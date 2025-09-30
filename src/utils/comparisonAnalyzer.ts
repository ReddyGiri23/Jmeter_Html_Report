import { JMeterData, ComparisonMetrics, ComparisonResult } from '../types/jmeter';

// Configuration for comparison thresholds
const COMPARISON_THRESHOLDS = {
  improvement: -5, // 5% improvement or better
  regression: 5,   // 5% regression or worse
  significant: 10  // 10% change is considered significant
};

// Calculate percentage change
const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Determine status based on changes
const determineStatus = (changes: ComparisonMetrics['changes']): 'improvement' | 'regression' | 'neutral' => {
  const avgRTChange = changes.avgResponseTime;
  const p90Change = changes.p90ResponseTime;
  const throughputChange = changes.throughput;
  const errorRateChange = changes.errorRate;

  // Count improvements and regressions
  let improvements = 0;
  let regressions = 0;

  // Response time: lower is better
  if (avgRTChange <= COMPARISON_THRESHOLDS.improvement) improvements++;
  else if (avgRTChange >= COMPARISON_THRESHOLDS.regression) regressions++;

  if (p90Change <= COMPARISON_THRESHOLDS.improvement) improvements++;
  else if (p90Change >= COMPARISON_THRESHOLDS.regression) regressions++;

  // Throughput: higher is better
  if (throughputChange >= -COMPARISON_THRESHOLDS.improvement) improvements++;
  else if (throughputChange <= -COMPARISON_THRESHOLDS.regression) regressions++;

  // Error rate: lower is better
  if (errorRateChange <= COMPARISON_THRESHOLDS.improvement) improvements++;
  else if (errorRateChange >= COMPARISON_THRESHOLDS.regression) regressions++;

  if (improvements > regressions) return 'improvement';
  if (regressions > improvements) return 'regression';
  return 'neutral';
};

// Generate comparison metrics for each transaction
const generateComparisonMetrics = (currentData: JMeterData, previousData: JMeterData): ComparisonMetrics[] => {
  const currentTransactions = new Map(currentData.transactions.map(t => [t.label, t]));
  const previousTransactions = new Map(previousData.transactions.map(t => [t.label, t]));

  // Get all unique transaction labels
  const allLabels = new Set([
    ...currentTransactions.keys(),
    ...previousTransactions.keys()
  ]);

  const metrics: ComparisonMetrics[] = [];

  allLabels.forEach(label => {
    const current = currentTransactions.get(label);
    const previous = previousTransactions.get(label);

    // Skip if transaction doesn't exist in both datasets
    if (!current || !previous) return;

    // Calculate 90th percentile for both datasets
    const currentSamples = currentData.samples.filter(s => s.label === label);
    const previousSamples = previousData.samples.filter(s => s.label === label);
    
    const currentResponseTimes = currentSamples.map(s => s.elapsed).sort((a, b) => a - b);
    const previousResponseTimes = previousSamples.map(s => s.elapsed).sort((a, b) => a - b);
    
    const currentP90 = currentResponseTimes[Math.floor(currentResponseTimes.length * 0.9)] || 0;
    const previousP90 = previousResponseTimes[Math.floor(previousResponseTimes.length * 0.9)] || 0;

    const currentMetrics = {
      avgResponseTime: current.avgResponseTime,
      p90ResponseTime: currentP90,
      throughput: current.throughput,
      errorRate: current.errorRate,
      count: current.count
    };

    const previousMetrics = {
      avgResponseTime: previous.avgResponseTime,
      p90ResponseTime: previousP90,
      throughput: previous.throughput,
      errorRate: previous.errorRate,
      count: previous.count
    };

    const changes = {
      avgResponseTime: calculatePercentageChange(currentMetrics.avgResponseTime, previousMetrics.avgResponseTime),
      p90ResponseTime: calculatePercentageChange(currentMetrics.p90ResponseTime, previousMetrics.p90ResponseTime),
      throughput: calculatePercentageChange(currentMetrics.throughput, previousMetrics.throughput),
      errorRate: calculatePercentageChange(currentMetrics.errorRate, previousMetrics.errorRate)
    };

    const comparisonMetric: ComparisonMetrics = {
      label,
      current: currentMetrics,
      previous: previousMetrics,
      changes,
      status: determineStatus(changes)
    };

    metrics.push(comparisonMetric);
  });

  return metrics.sort((a, b) => b.current.count - a.current.count); // Sort by request count
};

// Generate insights from comparison
const generateInsights = (metrics: ComparisonMetrics[]): ComparisonResult['insights'] => {
  // Find top improvements (best overall performance gains)
  const improvements = metrics
    .filter(m => m.status === 'improvement')
    .sort((a, b) => {
      const aScore = -a.changes.avgResponseTime - a.changes.p90ResponseTime + a.changes.throughput - a.changes.errorRate;
      const bScore = -b.changes.avgResponseTime - b.changes.p90ResponseTime + b.changes.throughput - b.changes.errorRate;
      return bScore - aScore;
    })
    .slice(0, 5);

  // Find top regressions (worst performance degradations)
  const regressions = metrics
    .filter(m => m.status === 'regression')
    .sort((a, b) => {
      const aScore = a.changes.avgResponseTime + a.changes.p90ResponseTime - a.changes.throughput + a.changes.errorRate;
      const bScore = b.changes.avgResponseTime + b.changes.p90ResponseTime - b.changes.throughput + b.changes.errorRate;
      return bScore - aScore;
    })
    .slice(0, 5);

  // Generate summary
  const totalTransactions = metrics.length;
  const improvementCount = metrics.filter(m => m.status === 'improvement').length;
  const regressionCount = metrics.filter(m => m.status === 'regression').length;
  const neutralCount = totalTransactions - improvementCount - regressionCount;

  let summary = `Analyzed ${totalTransactions} transactions: `;
  if (improvementCount > 0) summary += `${improvementCount} improved, `;
  if (regressionCount > 0) summary += `${regressionCount} regressed, `;
  if (neutralCount > 0) summary += `${neutralCount} unchanged`;

  return {
    topImprovements: improvements,
    topRegressions: regressions,
    summary: summary.replace(/, $/, '')
  };
};

// Main comparison function
export const compareJMeterResults = (
  currentData: JMeterData,
  previousData: JMeterData,
  currentFileName: string,
  previousFileName: string
): ComparisonResult => {
  const metrics = generateComparisonMetrics(currentData, previousData);
  const insights = generateInsights(metrics);

  // Determine overall status
  const improvementCount = metrics.filter(m => m.status === 'improvement').length;
  const regressionCount = metrics.filter(m => m.status === 'regression').length;
  
  let overallStatus: ComparisonResult['overallStatus'];
  if (improvementCount > regressionCount * 1.5) {
    overallStatus = 'improvement';
  } else if (regressionCount > improvementCount * 1.5) {
    overallStatus = 'regression';
  } else if (improvementCount > 0 || regressionCount > 0) {
    overallStatus = 'mixed';
  } else {
    overallStatus = 'neutral';
  }

  return {
    currentTest: {
      fileName: currentFileName,
      summary: currentData.summary
    },
    previousTest: {
      fileName: previousFileName,
      summary: previousData.summary
    },
    metrics,
    overallStatus,
    insights
  };
};