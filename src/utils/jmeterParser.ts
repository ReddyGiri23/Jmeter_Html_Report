import Papa from 'papaparse';
import _ from 'lodash';
import * as ss from 'simple-statistics';
import { JMeterSample, JMeterData, TestSummary, TransactionMetrics, SLAResult, ErrorSample, ChartData, ReportGenerationOptions } from '../types/jmeter';

// Enhanced logging for debugging
const DEBUG = false;
const log = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[JMeter Parser] ${message}`, data || '');
  }
};

// Statistical utility functions
const calculatePercentile = (values: number[], percentile: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return ss.quantile(sorted, percentile / 100);
};

const calculateStatistics = (values: number[]) => {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      standardDeviation: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  
  return {
    min: ss.min(sorted),
    max: ss.max(sorted),
    mean: ss.mean(sorted),
    median: ss.median(sorted),
    p50: calculatePercentile(sorted, 50),
    p75: calculatePercentile(sorted, 75),
    p90: calculatePercentile(sorted, 90),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
    standardDeviation: ss.standardDeviation(sorted)
  };
};

// Enhanced data validation
const validateSample = (sample: any): boolean => {
  return (
    sample &&
    typeof sample.timeStamp === 'number' &&
    sample.timeStamp > 0 &&
    typeof sample.elapsed === 'number' &&
    sample.elapsed >= 0 &&
    typeof sample.label === 'string' &&
    sample.label.trim() !== '' &&
    sample.label.trim() !== 'null' &&
    sample.label.trim() !== 'undefined'
  );
};

// Enhanced CSV parsing with better field mapping
const parseCSV = (text: string): JMeterSample[] => {
  log('Starting CSV parsing...');
  
  const result = Papa.parse(text, { 
    header: true, 
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string, field: string) => {
      // Handle numeric fields
      if (['timeStamp', 'elapsed', 'bytes', 'sentBytes', 'grpThreads', 'allThreads'].includes(field)) {
        const num = parseInt(value) || 0;
        return num;
      }
      // Handle boolean fields
      if (field === 'success') {
        return value.toLowerCase() === 'true';
      }
      // Handle string fields
      return value ? value.trim() : '';
    }
  });

  if (result.errors.length > 0) {
    log('CSV parsing errors:', result.errors);
  }

  const samples = result.data
    .map((row: any) => {
      // Handle different possible column names
      const sample: JMeterSample = {
        timeStamp: row.timeStamp || row.ts || row.timestamp || 0,
        elapsed: row.elapsed || row.t || row.responseTime || 0,
        label: row.label || row.lb || row.transactionName || '',
        responseCode: row.responseCode || row.rc || row.code || '',
        responseMessage: row.responseMessage || row.rm || row.message || '',
        threadName: row.threadName || row.tn || row.thread || '',
        success: row.success !== undefined ? row.success : (row.s === 'true' || row.s === true),
        bytes: row.bytes || row.by || 0,
        sentBytes: row.sentBytes || row.sby || 0,
        grpThreads: row.grpThreads || row.ng || 0,
        allThreads: row.allThreads || row.na || 0
      };

      return sample;
    })
    .filter(validateSample);

  log(`Parsed ${samples.length} valid samples from CSV`);
  log('Sample data preview:', samples.slice(0, 3));
  
  return samples;
};

// Enhanced XML parsing with better attribute handling
const parseXML = (text: string, DOMParserClass?: any): JMeterSample[] => {
  log('Starting XML parsing...');
  
  try {
    const parser = DOMParserClass ? new DOMParserClass() : new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    // Check for parsing errors
    if (DOMParserClass) {
      // For xmldom, check documentElement
      if (!xmlDoc.documentElement || xmlDoc.documentElement.nodeName === 'parsererror') {
        throw new Error('XML parsing failed: Invalid XML format');
      }
    } else {
      // For browser DOMParser
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing failed: ' + parserError.textContent);
      }
    }

    // Use getElementsByTagName instead of querySelectorAll for xmldom compatibility
    const httpSamples = xmlDoc.getElementsByTagName('httpSample');
    const samples = xmlDoc.getElementsByTagName('sample');
    
    // Combine both NodeLists
    const allSamples = [...Array.from(httpSamples), ...Array.from(samples)];
    
    log(`Found ${allSamples.length} sample elements in XML`);
    
    const parsedSamples = allSamples
      .map(sample => {
        const sampleData: JMeterSample = {
          timeStamp: parseInt(sample.getAttribute('ts') || '0'),
          elapsed: parseInt(sample.getAttribute('t') || '0'),
          label: sample.getAttribute('lb') || '',
          responseCode: sample.getAttribute('rc') || '',
          responseMessage: sample.getAttribute('rm') || '',
          threadName: sample.getAttribute('tn') || '',
          success: sample.getAttribute('s') === 'true',
          bytes: parseInt(sample.getAttribute('by') || '0'),
          sentBytes: parseInt(sample.getAttribute('sby') || '0'),
          grpThreads: parseInt(sample.getAttribute('ng') || '0'),
          allThreads: parseInt(sample.getAttribute('na') || '0')
        };

        return sampleData;
      })
      .filter(validateSample);

    log(`Parsed ${parsedSamples.length} valid samples from XML`);
    log('Sample data preview:', parsedSamples.slice(0, 3));
    
    return parsedSamples;
  } catch (error) {
    log('XML parsing error:', error);
    throw new Error(`Failed to parse XML: ${error}`);
  }
};

// Enhanced test summary generation with precise calculations
const generateTestSummary = (samples: JMeterSample[], options?: ReportGenerationOptions): TestSummary => {
  log('Generating test summary...');
  
  if (samples.length === 0) {
    throw new Error('No samples available for summary generation');
  }

  // Time calculations
  const timestamps = samples.map(s => s.timeStamp);
  const startTime = Math.min(...timestamps);
  const endTime = Math.max(...timestamps);
  const durationMs = endTime - startTime;
  const durationSeconds = Math.max(1, Math.round(durationMs / 1000)); // Ensure minimum 1 second

  // Basic counts
  const totalRequests = samples.length;
  const errorSamples = samples.filter(s => !s.success);
  const totalErrors = errorSamples.length;
  const successSamples = samples.filter(s => s.success);

  // Response time calculations (only for successful requests for accuracy)
  const allResponseTimes = samples.map(s => s.elapsed);
  const successResponseTimes = successSamples.map(s => s.elapsed);
  
  const responseTimeStats = calculateStatistics(allResponseTimes);
  const successResponseTimeStats = calculateStatistics(successResponseTimes);

  // Thread calculations
  const threadCounts = samples.map(s => s.allThreads).filter(t => t > 0);
  const maxThreads = threadCounts.length > 0 ? Math.max(...threadCounts) : 1;

  // Throughput calculation (requests per second)
  const overallThroughput = totalRequests / durationSeconds;

  // Error rate calculation
  const errorRate = (totalErrors / totalRequests) * 100;

  const summary: TestSummary = {
    applicationVersion: 'v1.0.0',
    testEnvironment: options?.testConfig?.testEnvironment || 'PPE02',
    testDuration: durationSeconds,
    virtualUsers: maxThreads,
    totalRequests,
    totalErrors,
    overallThroughput,
    avgResponseTime: responseTimeStats.mean,
    p95ResponseTime: responseTimeStats.p95,
    errorRate,
    startTime,
    endTime
  };

  log('Generated test summary:', summary);
  return summary;
};

// Enhanced transaction metrics with advanced statistical calculations
const generateTransactionMetrics = (samples: JMeterSample[]): TransactionMetrics[] => {
  log('Generating transaction metrics...');
  
  // Group samples by transaction label
  const transactionGroups = _.groupBy(samples, 'label');
  
  const metrics = Object.entries(transactionGroups).map(([label, labelSamples]) => {
    log(`Processing transaction: ${label} (${labelSamples.length} samples)`);
    
    // Separate successful and failed samples
    const successSamples = labelSamples.filter(s => s.success);
    const errorSamples = labelSamples.filter(s => !s.success);
    
    // Response time calculations
    const allResponseTimes = labelSamples.map(s => s.elapsed);
    const successResponseTimes = successSamples.map(s => s.elapsed);
    
    const responseTimeStats = calculateStatistics(allResponseTimes);
    
    // Time span calculation for throughput
    const timestamps = labelSamples.map(s => s.timeStamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const durationSeconds = Math.max(1, (maxTime - minTime) / 1000);
    
    // Throughput calculation
    const throughput = labelSamples.length / durationSeconds;
    
    // Error calculations
    const errorCount = errorSamples.length;
    const errorRate = (errorCount / labelSamples.length) * 100;

    const transactionMetric: TransactionMetrics = {
      label,
      count: labelSamples.length,
      avgResponseTime: responseTimeStats.mean,
      medianResponseTime: responseTimeStats.median,
      p95ResponseTime: responseTimeStats.p95,
      maxResponseTime: responseTimeStats.max,
      errors: errorCount,
      errorRate,
      throughput
    };

    log(`Transaction ${label} metrics:`, transactionMetric);
    return transactionMetric;
  });

  // Sort by request count (descending)
  const sortedMetrics = _.orderBy(metrics, ['count'], ['desc']);
  
  log(`Generated metrics for ${sortedMetrics.length} transactions`);
  return sortedMetrics;
};

// Enhanced SLA evaluation with configurable thresholds
const evaluateSLAs = (summary: TestSummary, transactions: TransactionMetrics[], options?: ReportGenerationOptions): SLAResult => {
  log('Evaluating SLA gates...');
  
  // Configurable SLA thresholds
  const SLA_THRESHOLDS = {
    avgResponseTime: options?.slaThresholds?.avgResponseTime || 3000, // ms (3 seconds)
    throughput: options?.slaThresholds?.throughput || 0.03055, // req/s (110 TPH = 110/3600)
    errorRate: options?.slaThresholds?.errorRate || 10 // %
  };

  const avgResponseTimePassed = summary.avgResponseTime <= SLA_THRESHOLDS.avgResponseTime;
  const throughputPassed = summary.overallThroughput >= SLA_THRESHOLDS.throughput;
  const errorRatePassed = summary.errorRate <= SLA_THRESHOLDS.errorRate;
  
  const slaResult: SLAResult = {
    avgResponseTime: {
      value: summary.avgResponseTime,
      threshold: SLA_THRESHOLDS.avgResponseTime,
      passed: avgResponseTimePassed
    },
    averageThroughput: {
      value: summary.overallThroughput,
      threshold: SLA_THRESHOLDS.throughput,
      passed: throughputPassed
    },
    errorRate: {
      value: summary.errorRate,
      threshold: SLA_THRESHOLDS.errorRate,
      passed: errorRatePassed
    },
    overallPassed: avgResponseTimePassed && throughputPassed && errorRatePassed
  };

  log('SLA evaluation results:', slaResult);
  return slaResult;
};

// Enhanced error sample extraction
const getErrorSamples = (samples: JMeterSample[], options?: ReportGenerationOptions): ErrorSample[] => {
  log('Extracting error samples...');
  
  const maxErrorSamples = options?.reportOptions?.maxErrorSamples || 200;
  
  const errorSamples = samples
    .filter(sample => !sample.success)
    .slice(0, maxErrorSamples) // Limit to configured number of errors
    .map(sample => ({
      timestamp: sample.timeStamp,
      label: sample.label,
      responseTime: sample.elapsed,
      threadName: sample.threadName,
      responseMessage: sample.responseMessage || `HTTP ${sample.responseCode}`,
      responseCode: sample.responseCode || 'Unknown'
    }));

  log(`Extracted ${errorSamples.length} error samples`);
  return errorSamples;
};

// Calculate error counts by HTTP status code
const calculateErrorCountsByStatusCode = (samples: JMeterSample[]): Record<string, number> => {
  log('Calculating error counts by status code...');
  
  const errorCounts: Record<string, number> = {};
  
  samples
    .filter(sample => !sample.success)
    .forEach(sample => {
      const statusCode = sample.responseCode || 'Unknown';
      errorCounts[statusCode] = (errorCounts[statusCode] || 0) + 1;
    });

  log(`Error counts by status code:`, errorCounts);
  return errorCounts;
};

// Enhanced chart data generation with time-based aggregation
const generateChartData = (samples: JMeterSample[], transactions: TransactionMetrics[], options?: ReportGenerationOptions): ChartData => {
  log('Generating chart data...');
  
  const samplingRate = options?.reportOptions?.samplingRate || 2;
  
  // Response Times Over Time - sample every few seconds to avoid overcrowding
  const responseTimesOverTime = samples
    .filter((_, index) => index % Math.max(1, samplingRate) === 0) // Use configured sampling rate
    .map(sample => ({
      x: sample.timeStamp,
      y: sample.elapsed,
      label: sample.label
    }));

  // TPS Over Time - aggregate by time intervals
  const timeInterval = 60000; // 1 minute intervals
  const tpsMap = new Map<number, number>();
  
  samples.forEach(sample => {
    const timeSlot = Math.floor(sample.timeStamp / timeInterval) * timeInterval;
    tpsMap.set(timeSlot, (tpsMap.get(timeSlot) || 0) + 1);
  });
  
  const tpsOverTime = Array.from(tpsMap.entries())
    .map(([time, count]) => ({ 
      x: time, 
      y: count / (timeInterval / 1000) // Convert to requests per second
    }))
    .sort((a, b) => a.x - b.x);

  // Errors Over Time - aggregate by time intervals
  const errorMap = new Map<number, number>();
  samples
    .filter(s => !s.success)
    .forEach(sample => {
      const timeSlot = Math.floor(sample.timeStamp / timeInterval) * timeInterval;
      errorMap.set(timeSlot, (errorMap.get(timeSlot) || 0) + 1);
    });
  
  const errorsOverTime = Array.from(errorMap.entries())
    .map(([time, count]) => ({ x: time, y: count }))
    .sort((a, b) => a.x - b.x);

  // Hits Over Time - aggregate all requests by time intervals
  const hitsMap = new Map<number, number>();
  
  samples.forEach(sample => {
    const timeSlot = Math.floor(sample.timeStamp / timeInterval) * timeInterval;
    hitsMap.set(timeSlot, (hitsMap.get(timeSlot) || 0) + 1);
  });
  
  const hitsOverTime = Array.from(hitsMap.entries())
    .map(([time, count]) => ({ 
      x: time, 
      y: count / (timeInterval / 1000) // Convert to hits per second
    }))
    .sort((a, b) => a.x - b.x);
  // Enhanced percentiles calculation for each transaction
  const percentiles = transactions.map(transaction => {
    const labelSamples = samples.filter(s => s.label === transaction.label);
    const responseTimes = labelSamples.map(s => s.elapsed);
    const stats = calculateStatistics(responseTimes);
    
    return {
      label: transaction.label,
      p50: stats.p50,
      p75: stats.p75,
      p90: stats.p90,
      p95: stats.p95,
      p99: stats.p99
    };
  });

  // Throughput vs Response Time
  const throughputVsResponseTime: Array<{ x: number; y: number; label: string }> = [];
  
  // Group samples by transaction and time intervals for trend analysis
  const transactionTimeIntervals = new Map<string, Map<number, { totalTime: number; count: number }>>();
  
  samples.forEach(sample => {
    const timeSlot = Math.floor(sample.timeStamp / (timeInterval * 2)) * (timeInterval * 2); // 2-minute intervals
    
    if (!transactionTimeIntervals.has(sample.label)) {
      transactionTimeIntervals.set(sample.label, new Map());
    }
    
    const labelMap = transactionTimeIntervals.get(sample.label)!;
    if (!labelMap.has(timeSlot)) {
      labelMap.set(timeSlot, { totalTime: 0, count: 0 });
    }
    
    const slot = labelMap.get(timeSlot)!;
    slot.totalTime += sample.elapsed;
    slot.count += 1;
  });
  
  // Convert to throughput vs response time data points
  transactionTimeIntervals.forEach((timeSlots, label) => {
    timeSlots.forEach((data, timeSlot) => {
      if (data.count >= 5) { // Only include time slots with sufficient data
        const avgResponseTime = data.totalTime / data.count;
        const throughput = data.count / (timeInterval * 2 / 1000); // Convert to req/s
        
        throughputVsResponseTime.push({
          x: throughput,
          y: avgResponseTime,
          label: label
        });
      }
    });
  });

  // Users vs Response Time - sample data to avoid overcrowding
  const usersVsResponseTime = samples
    .filter((_, index) => index % Math.max(1, samplingRate * 250) === 0) // Use configured sampling rate
    .filter(sample => sample.allThreads > 0) // Only include samples with valid thread count
    .map(sample => ({
      x: sample.allThreads,
      y: sample.elapsed,
      label: sample.label
    }));

  // Errors vs Users - only failed samples
  const errorsVsUsers = samples
    .filter(sample => !sample.success && sample.allThreads > 0)
    .map(sample => ({
      x: sample.allThreads,
      y: sample.elapsed,
      label: sample.label
    }));

  // Errors vs Response Time - only failed samples
  const errorsVsResponseTime = samples
    .filter(sample => !sample.success)
    .map(sample => ({
      x: sample.elapsed,
      y: sample.allThreads > 0 ? sample.allThreads : 1, // Default to 1 if no thread info
      label: sample.label
    }));
  const chartData: ChartData = {
    responseTimesOverTime,
    tpsOverTime,
    errorsOverTime,
    hitsOverTime,
    percentiles,
    throughputVsResponseTime,
    usersVsResponseTime,
    errorsVsUsers,
    errorsVsResponseTime
  };

  log('Generated chart data with data points:', {
    responseTimesOverTime: responseTimesOverTime.length,
    tpsOverTime: tpsOverTime.length,
    errorsOverTime: errorsOverTime.length,
    hitsOverTime: hitsOverTime.length,
    percentiles: percentiles.length,
    throughputVsResponseTime: throughputVsResponseTime.length,
    usersVsResponseTime: usersVsResponseTime.length,
    errorsVsUsers: errorsVsUsers.length,
    errorsVsResponseTime: errorsVsResponseTime.length
  });

  return chartData;
};

// Main parsing function with enhanced error handling
export const parseJMeterFile = async (file: File, DOMParserClass?: any, options?: ReportGenerationOptions): Promise<JMeterData> => {
  log(`Starting to parse file: ${file.name} (${file.size} bytes)`);
  
  try {
    const text = await file.text();
    log(`File content length: ${text.length} characters`);
    
    let samples: JMeterSample[];

    // Determine file format and parse accordingly
    if (text.trim().startsWith('<?xml') || text.includes('<testResults')) {
      log('Detected XML format');
      samples = parseXML(text, DOMParserClass);
    } else {
      log('Detected CSV format');
      samples = parseCSV(text);
    }

    if (samples.length === 0) {
      throw new Error('No valid samples found in the file. Please check the file format and content.');
    }

    log(`Successfully parsed ${samples.length} samples`);

    // Generate all metrics
    const summary = generateTestSummary(samples, options);
    const transactions = generateTransactionMetrics(samples);
    const slaResults = evaluateSLAs(summary, transactions, options);
    const errorSamples = getErrorSamples(samples, options);
    const errorCountsByStatusCode = calculateErrorCountsByStatusCode(samples);
    const chartData = generateChartData(samples, transactions, options);

    const jmeterData: JMeterData = {
      samples,
      summary,
      transactions,
      slaResults,
      errorSamples,
      errorCountsByStatusCode,
      chartData
    };

    log('Successfully generated complete JMeter data analysis');
    return jmeterData;

  } catch (error) {
    log('Error parsing JMeter file:', error);
    throw new Error(`Failed to parse JMeter file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};