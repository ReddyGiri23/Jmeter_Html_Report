import _ from 'lodash';
import { ErrorSample } from '../types/jmeter';

export interface ErrorPattern {
  pattern: string;
  count: number;
  percentage: number;
  samples: ErrorSample[];
  category: 'timeout' | 'server_error' | 'client_error' | 'network' | 'unknown';
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface ErrorCluster {
  timeWindow: { start: number; end: number };
  errorCount: number;
  averageRate: number;
  isBurst: boolean;
  affectedTransactions: string[];
}

export interface ErrorTimeline {
  timestamp: number;
  errorCount: number;
  cumulativeErrors: number;
  errorRate: number;
}

export interface RootCauseAnalysis {
  primaryCause: string;
  confidence: number;
  contributingFactors: Array<{ factor: string; weight: number }>;
  affectedTransactions: string[];
  recommendation: string;
}

export const recognizeErrorPatterns = (
  errors: ErrorSample[],
  totalRequests: number
): ErrorPattern[] => {
  if (errors.length === 0) return [];

  const patterns: Map<string, ErrorSample[]> = new Map();

  errors.forEach(error => {
    const key = `${error.responseCode}-${categorizeErrorMessage(error.responseMessage)}`;
    if (!patterns.has(key)) {
      patterns.set(key, []);
    }
    patterns.get(key)!.push(error);
  });

  const errorPatterns: ErrorPattern[] = [];

  patterns.forEach((samples, key) => {
    const count = samples.length;
    const percentage = (count / totalRequests) * 100;
    const [code, message] = key.split('-');

    errorPatterns.push({
      pattern: `${code}: ${message}`,
      count,
      percentage,
      samples: samples.slice(0, 10),
      category: categorizeError(code, message),
      severity: calculateSeverity(percentage, code),
      recommendation: generateRecommendation(code, message)
    });
  });

  return _.orderBy(errorPatterns, ['count'], ['desc']);
};

const categorizeErrorMessage = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'Connection Timeout';
  } else if (lowerMessage.includes('refused') || lowerMessage.includes('connect')) {
    return 'Connection Refused';
  } else if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return 'Not Found';
  } else if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
    return 'Unauthorized';
  } else if (lowerMessage.includes('forbidden') || lowerMessage.includes('403')) {
    return 'Forbidden';
  } else if (lowerMessage.includes('internal server') || lowerMessage.includes('500')) {
    return 'Internal Server Error';
  } else if (lowerMessage.includes('bad gateway') || lowerMessage.includes('502')) {
    return 'Bad Gateway';
  } else if (lowerMessage.includes('service unavailable') || lowerMessage.includes('503')) {
    return 'Service Unavailable';
  } else if (lowerMessage.includes('gateway timeout') || lowerMessage.includes('504')) {
    return 'Gateway Timeout';
  } else {
    return message.substring(0, 50);
  }
};

const categorizeError = (code: string, message: string): ErrorPattern['category'] => {
  const codeNum = parseInt(code);

  if (message.toLowerCase().includes('timeout')) return 'timeout';
  if (codeNum >= 500) return 'server_error';
  if (codeNum >= 400 && codeNum < 500) return 'client_error';
  if (message.toLowerCase().includes('connection') || message.toLowerCase().includes('network')) {
    return 'network';
  }
  return 'unknown';
};

const calculateSeverity = (percentage: number, code: string): ErrorPattern['severity'] => {
  const codeNum = parseInt(code);

  if (percentage > 10 || codeNum >= 500) return 'critical';
  if (percentage > 5 || codeNum >= 400) return 'high';
  if (percentage > 1) return 'medium';
  return 'low';
};

const generateRecommendation = (code: string, message: string): string => {
  const codeNum = parseInt(code);

  if (message.toLowerCase().includes('timeout')) {
    return 'Increase timeout settings, check network latency, or optimize slow endpoints';
  } else if (codeNum === 404) {
    return 'Verify URL paths in test script and ensure endpoints exist';
  } else if (codeNum === 401 || codeNum === 403) {
    return 'Check authentication credentials and authorization permissions';
  } else if (codeNum === 500) {
    return 'Review server logs for application errors and stack traces';
  } else if (codeNum === 502 || codeNum === 503) {
    return 'Check load balancer configuration and backend service health';
  } else if (codeNum === 504) {
    return 'Increase gateway timeout or optimize upstream service performance';
  } else if (message.toLowerCase().includes('connection')) {
    return 'Check network connectivity, firewall rules, and service availability';
  }

  return 'Investigate error details and check application logs for root cause';
};

export const detectErrorClusters = (
  errors: ErrorSample[],
  timeWindowMs: number = 60000
): ErrorCluster[] => {
  if (errors.length === 0) return [];

  const sortedErrors = _.sortBy(errors, 'timestamp');
  const clusters: ErrorCluster[] = [];

  let windowStart = sortedErrors[0].timestamp;
  let windowErrors: ErrorSample[] = [];

  sortedErrors.forEach(error => {
    if (error.timestamp - windowStart < timeWindowMs) {
      windowErrors.push(error);
    } else {
      if (windowErrors.length > 0) {
        clusters.push(createErrorCluster(windowStart, windowErrors, timeWindowMs));
      }
      windowStart = error.timestamp;
      windowErrors = [error];
    }
  });

  if (windowErrors.length > 0) {
    clusters.push(createErrorCluster(windowStart, windowErrors, timeWindowMs));
  }

  const avgErrorsPerWindow = clusters.reduce((sum, c) => sum + c.errorCount, 0) / clusters.length;
  const stdDev = Math.sqrt(
    clusters.reduce((sum, c) => sum + Math.pow(c.errorCount - avgErrorsPerWindow, 2), 0) / clusters.length
  );

  clusters.forEach(cluster => {
    cluster.isBurst = cluster.errorCount > avgErrorsPerWindow + 2 * stdDev;
  });

  return clusters;
};

const createErrorCluster = (
  windowStart: number,
  errors: ErrorSample[],
  timeWindowMs: number
): ErrorCluster => {
  const affectedTransactions = _.uniq(errors.map(e => e.label));
  const windowEnd = windowStart + timeWindowMs;

  return {
    timeWindow: { start: windowStart, end: windowEnd },
    errorCount: errors.length,
    averageRate: errors.length / (timeWindowMs / 1000),
    isBurst: false,
    affectedTransactions
  };
};

export const generateErrorTimeline = (
  errors: ErrorSample[],
  totalRequests: number,
  intervalMs: number = 60000
): ErrorTimeline[] => {
  if (errors.length === 0) return [];

  const sortedErrors = _.sortBy(errors, 'timestamp');
  const startTime = sortedErrors[0].timestamp;
  const endTime = sortedErrors[sortedErrors.length - 1].timestamp;

  const timeline: ErrorTimeline[] = [];
  let cumulativeErrors = 0;

  for (let time = startTime; time <= endTime; time += intervalMs) {
    const windowErrors = errors.filter(
      e => e.timestamp >= time && e.timestamp < time + intervalMs
    );

    cumulativeErrors += windowErrors.length;
    const errorRate = (windowErrors.length / (totalRequests / ((endTime - startTime) / intervalMs))) * 100;

    timeline.push({
      timestamp: time,
      errorCount: windowErrors.length,
      cumulativeErrors,
      errorRate: Math.max(0, errorRate)
    });
  }

  return timeline;
};

export const analyzeRootCause = (
  errors: ErrorSample[],
  allSamples: Array<{ label: string; elapsed: number; success: boolean; allThreads: number }>
): RootCauseAnalysis | null => {
  if (errors.length === 0) return null;

  const errorsByTransaction = _.groupBy(errors, 'label');
  const mostAffectedTransaction = _.maxBy(
    Object.entries(errorsByTransaction),
    ([, errs]) => errs.length
  );

  if (!mostAffectedTransaction) return null;

  const [transactionLabel, transactionErrors] = mostAffectedTransaction;

  const contributingFactors: Array<{ factor: string; weight: number }> = [];

  const avgResponseTime = _.mean(transactionErrors.map(e => e.responseTime));
  if (avgResponseTime > 5000) {
    contributingFactors.push({ factor: 'High response times (>5s)', weight: 0.4 });
  }

  const timeoutErrors = transactionErrors.filter(e =>
    e.responseMessage.toLowerCase().includes('timeout')
  ).length;
  if (timeoutErrors > transactionErrors.length * 0.3) {
    contributingFactors.push({ factor: 'Frequent timeouts', weight: 0.5 });
  }

  const serverErrors = transactionErrors.filter(e =>
    parseInt(e.responseCode) >= 500
  ).length;
  if (serverErrors > transactionErrors.length * 0.5) {
    contributingFactors.push({ factor: 'Server-side errors (5xx)', weight: 0.6 });
  }

  const transactionSamples = allSamples.filter(s => s.label === transactionLabel);
  const maxThreads = _.max(transactionSamples.map(s => s.allThreads)) || 0;
  if (maxThreads > 100) {
    contributingFactors.push({ factor: 'High concurrent load', weight: 0.3 });
  }

  const errorRate = (transactionErrors.length / transactionSamples.length) * 100;
  let primaryCause = 'Unknown error pattern';
  let confidence = 0.5;

  if (timeoutErrors > transactionErrors.length * 0.5) {
    primaryCause = 'Performance bottleneck causing timeouts';
    confidence = 0.8;
  } else if (serverErrors > transactionErrors.length * 0.7) {
    primaryCause = 'Application-level failures on server';
    confidence = 0.85;
  } else if (errorRate > 50) {
    primaryCause = 'Systemic failure affecting transaction';
    confidence = 0.75;
  } else {
    primaryCause = 'Intermittent failures under load';
    confidence = 0.6;
  }

  const affectedTransactions = Object.keys(errorsByTransaction).slice(0, 10);

  return {
    primaryCause,
    confidence,
    contributingFactors: _.orderBy(contributingFactors, ['weight'], ['desc']),
    affectedTransactions,
    recommendation: generateRootCauseRecommendation(primaryCause, contributingFactors)
  };
};

const generateRootCauseRecommendation = (
  primaryCause: string,
  factors: Array<{ factor: string; weight: number }>
): string => {
  const recommendations: string[] = [];

  if (primaryCause.includes('timeout')) {
    recommendations.push('Optimize slow database queries and API calls');
    recommendations.push('Consider implementing caching strategies');
    recommendations.push('Scale up resources or implement load balancing');
  } else if (primaryCause.includes('Application-level')) {
    recommendations.push('Review application logs for exceptions');
    recommendations.push('Check database connection pool settings');
    recommendations.push('Verify third-party service availability');
  } else if (primaryCause.includes('Systemic failure')) {
    recommendations.push('Review infrastructure and service health');
    recommendations.push('Check for resource exhaustion (CPU, memory, disk)');
    recommendations.push('Implement circuit breakers and retry mechanisms');
  }

  factors.forEach(factor => {
    if (factor.factor.includes('High concurrent load')) {
      recommendations.push('Implement rate limiting and request throttling');
    }
  });

  return recommendations.join('; ');
};

export const calculateErrorSeverityScore = (
  errors: ErrorSample[],
  totalRequests: number
): { score: number; grade: string; description: string } => {
  if (totalRequests === 0) return { score: 100, grade: 'A', description: 'No requests executed' };

  const errorRate = (errors.length / totalRequests) * 100;

  const criticalErrors = errors.filter(e => parseInt(e.responseCode) >= 500).length;
  const timeoutErrors = errors.filter(e =>
    e.responseMessage.toLowerCase().includes('timeout')
  ).length;

  let score = 100;
  score -= errorRate * 2;
  score -= (criticalErrors / totalRequests) * 100 * 1.5;
  score -= (timeoutErrors / totalRequests) * 100 * 1.2;

  score = Math.max(0, Math.min(100, score));

  let grade = 'F';
  let description = 'Critical - Immediate action required';

  if (score >= 90) {
    grade = 'A';
    description = 'Excellent - Minimal errors detected';
  } else if (score >= 80) {
    grade = 'B';
    description = 'Good - Minor issues present';
  } else if (score >= 70) {
    grade = 'C';
    description = 'Fair - Notable error rate';
  } else if (score >= 60) {
    grade = 'D';
    description = 'Poor - Significant errors detected';
  }

  return { score, grade, description };
};
