import { JMeterData, TestSummary, TransactionMetrics } from '../types/jmeter';
import _ from 'lodash';
import { performTrendAnalysis, TrendAnalysis } from './statisticalAnalysis';

export interface MultiRunData {
  id: string;
  label: string;
  timestamp: number;
  data: JMeterData;
}

export interface MultiRunComparison {
  runs: Array<{
    id: string;
    label: string;
    summary: TestSummary;
  }>;
  transactionComparison: Array<{
    label: string;
    runs: Array<{
      id: string;
      avgResponseTime: number;
      throughput: number;
      errorRate: number;
    }>;
    trend: TrendAnalysis | null;
    bestRun: string;
    worstRun: string;
  }>;
  overallTrends: {
    responseTime: TrendAnalysis | null;
    throughput: TrendAnalysis | null;
    errorRate: TrendAnalysis | null;
  };
  insights: {
    mostImproved: string[];
    mostDegraded: string[];
    mostStable: string[];
    summary: string;
  };
  recommendations: string[];
}

export const compareMultipleRuns = (runs: MultiRunData[]): MultiRunComparison => {
  if (runs.length < 2) {
    throw new Error('At least 2 runs are required for comparison');
  }

  const sortedRuns = _.sortBy(runs, 'timestamp');

  const runSummaries = sortedRuns.map(run => ({
    id: run.id,
    label: run.label,
    summary: run.data.summary
  }));

  const allTransactionLabels = new Set<string>();
  sortedRuns.forEach(run => {
    run.data.transactions.forEach(t => allTransactionLabels.add(t.label));
  });

  const transactionComparison = Array.from(allTransactionLabels).map(label => {
    const runMetrics = sortedRuns.map(run => {
      const transaction = run.data.transactions.find(t => t.label === label);
      return {
        id: run.id,
        avgResponseTime: transaction?.avgResponseTime || 0,
        throughput: transaction?.throughput || 0,
        errorRate: transaction?.errorRate || 0
      };
    });

    const validMetrics = runMetrics.filter(m => m.avgResponseTime > 0);

    let trend: TrendAnalysis | null = null;
    if (validMetrics.length >= 3) {
      const trendData = validMetrics.map((m, i) => ({ x: i, y: m.avgResponseTime }));
      trend = performTrendAnalysis(trendData, 2);
    }

    const bestRun = _.minBy(validMetrics, 'avgResponseTime')?.id || '';
    const worstRun = _.maxBy(validMetrics, 'avgResponseTime')?.id || '';

    return {
      label,
      runs: runMetrics,
      trend,
      bestRun,
      worstRun
    };
  });

  const responseTimeTrend = performTrendAnalysis(
    sortedRuns.map((run, i) => ({ x: i, y: run.data.summary.avgResponseTime })),
    3
  );

  const throughputTrend = performTrendAnalysis(
    sortedRuns.map((run, i) => ({ x: i, y: run.data.summary.overallThroughput })),
    3
  );

  const errorRateTrend = performTrendAnalysis(
    sortedRuns.map((run, i) => ({ x: i, y: run.data.summary.errorRate })),
    3
  );

  const overallTrends = {
    responseTime: responseTimeTrend,
    throughput: throughputTrend,
    errorRate: errorRateTrend
  };

  const insights = generateMultiRunInsights(sortedRuns, transactionComparison, overallTrends);
  const recommendations = generateMultiRunRecommendations(overallTrends, transactionComparison);

  return {
    runs: runSummaries,
    transactionComparison,
    overallTrends,
    insights,
    recommendations
  };
};

const generateMultiRunInsights = (
  runs: MultiRunData[],
  transactionComparison: MultiRunComparison['transactionComparison'],
  trends: MultiRunComparison['overallTrends']
): MultiRunComparison['insights'] => {
  const mostImproved: string[] = [];
  const mostDegraded: string[] = [];
  const mostStable: string[] = [];

  transactionComparison.forEach(tc => {
    if (tc.trend) {
      if (tc.trend.direction === 'improving' && tc.trend.confidence > 60) {
        mostImproved.push(`${tc.label} (${tc.trend.confidence.toFixed(0)}% confidence)`);
      } else if (tc.trend.direction === 'degrading' && tc.trend.confidence > 60) {
        mostDegraded.push(`${tc.label} (${tc.trend.confidence.toFixed(0)}% confidence)`);
      } else if (tc.trend.direction === 'stable' && tc.trend.confidence > 70) {
        mostStable.push(tc.label);
      }
    }
  });

  let summary = `Analyzed ${runs.length} test runs`;

  if (trends.responseTime) {
    const direction = trends.responseTime.direction;
    const confidence = trends.responseTime.confidence;
    summary += `. Response times are ${direction} (${confidence.toFixed(0)}% confidence)`;
  }

  if (trends.errorRate) {
    const direction = trends.errorRate.direction;
    if (direction === 'degrading') {
      summary += `. Error rates are increasing`;
    } else if (direction === 'improving') {
      summary += `. Error rates are decreasing`;
    }
  }

  if (mostImproved.length > 0) {
    summary += `. ${mostImproved.length} transactions showing improvement`;
  }

  if (mostDegraded.length > 0) {
    summary += `. ${mostDegraded.length} transactions showing degradation`;
  }

  return {
    mostImproved: mostImproved.slice(0, 5),
    mostDegraded: mostDegraded.slice(0, 5),
    mostStable: mostStable.slice(0, 5),
    summary
  };
};

const generateMultiRunRecommendations = (
  trends: MultiRunComparison['overallTrends'],
  transactionComparison: MultiRunComparison['transactionComparison']
): string[] => {
  const recommendations: string[] = [];

  if (trends.responseTime?.direction === 'degrading' && trends.responseTime.confidence > 60) {
    recommendations.push(
      'Response times are degrading over time - investigate recent changes and infrastructure capacity'
    );
  }

  if (trends.errorRate?.direction === 'degrading' && trends.errorRate.confidence > 60) {
    recommendations.push(
      'Error rates are increasing - review recent deployments and external dependencies'
    );
  }

  if (trends.throughput?.direction === 'degrading' && trends.throughput.confidence > 60) {
    recommendations.push(
      'Throughput is declining - check for resource constraints and bottlenecks'
    );
  }

  const unstableTransactions = transactionComparison.filter(tc => {
    if (!tc.trend) return false;
    const responseTimes = tc.runs.map(r => r.avgResponseTime).filter(rt => rt > 0);
    const stdDev = standardDeviation(responseTimes);
    const mean = _.mean(responseTimes);
    const cv = stdDev / mean;
    return cv > 0.5;
  });

  if (unstableTransactions.length > 0) {
    recommendations.push(
      `${unstableTransactions.length} transactions show high variance - focus on stabilizing: ${unstableTransactions.slice(0, 3).map(t => t.label).join(', ')}`
    );
  }

  const alwaysSlowTransactions = transactionComparison.filter(tc =>
    tc.runs.every(r => r.avgResponseTime > 2000)
  );

  if (alwaysSlowTransactions.length > 0) {
    recommendations.push(
      `${alwaysSlowTransactions.length} transactions consistently slow - prioritize optimization: ${alwaysSlowTransactions.slice(0, 3).map(t => t.label).join(', ')}`
    );
  }

  const errorProneTransactions = transactionComparison.filter(tc =>
    _.mean(tc.runs.map(r => r.errorRate)) > 5
  );

  if (errorProneTransactions.length > 0) {
    recommendations.push(
      `${errorProneTransactions.length} transactions have persistent high error rates - investigate root causes`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance is stable across all runs - maintain current practices');
  }

  return recommendations;
};

const standardDeviation = (values: number[]): number => {
  const mean = _.mean(values);
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = _.mean(squaredDiffs);
  return Math.sqrt(variance);
};

export const identifyPerformanceBaseline = (runs: MultiRunData[]): {
  baselineRun: MultiRunData;
  confidence: number;
  reasoning: string;
} => {
  if (runs.length === 0) {
    throw new Error('No runs provided for baseline identification');
  }

  const scoredRuns = runs.map(run => {
    const summary = run.data.summary;
    let score = 0;

    if (summary.avgResponseTime < 1000) score += 30;
    else if (summary.avgResponseTime < 2000) score += 20;
    else if (summary.avgResponseTime < 3000) score += 10;

    if (summary.errorRate < 1) score += 25;
    else if (summary.errorRate < 5) score += 15;
    else if (summary.errorRate < 10) score += 5;

    if (summary.overallThroughput > 10) score += 20;
    else if (summary.overallThroughput > 1) score += 15;
    else if (summary.overallThroughput > 0.1) score += 10;

    const errorRateWeight = summary.errorRate < 5 ? 15 : 0;
    const stabilityWeight = summary.totalErrors < summary.totalRequests * 0.1 ? 10 : 0;

    score += errorRateWeight + stabilityWeight;

    return { run, score };
  });

  const bestRun = _.maxBy(scoredRuns, 'score')!;
  const maxScore = 100;
  const confidence = (bestRun.score / maxScore) * 100;

  const reasoning = `Selected based on best combination of low response time (${bestRun.run.data.summary.avgResponseTime.toFixed(0)}ms), ` +
    `low error rate (${bestRun.run.data.summary.errorRate.toFixed(2)}%), ` +
    `and good throughput (${bestRun.run.data.summary.overallThroughput.toFixed(2)} req/s)`;

  return {
    baselineRun: bestRun.run,
    confidence,
    reasoning
  };
};

export const detectPerformanceRegression = (
  baseline: JMeterData,
  current: JMeterData,
  thresholds: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  } = { responseTime: 10, errorRate: 20, throughput: 10 }
): {
  hasRegression: boolean;
  regressions: Array<{
    metric: string;
    baselineValue: number;
    currentValue: number;
    change: number;
    severity: 'critical' | 'high' | 'medium';
  }>;
  summary: string;
} => {
  const regressions: Array<{
    metric: string;
    baselineValue: number;
    currentValue: number;
    change: number;
    severity: 'critical' | 'high' | 'medium';
  }> = [];

  const rtChange = ((current.summary.avgResponseTime - baseline.summary.avgResponseTime) / baseline.summary.avgResponseTime) * 100;
  if (rtChange > thresholds.responseTime) {
    regressions.push({
      metric: 'Average Response Time',
      baselineValue: baseline.summary.avgResponseTime,
      currentValue: current.summary.avgResponseTime,
      change: rtChange,
      severity: rtChange > thresholds.responseTime * 2 ? 'critical' : rtChange > thresholds.responseTime * 1.5 ? 'high' : 'medium'
    });
  }

  const errorChange = ((current.summary.errorRate - baseline.summary.errorRate) / Math.max(baseline.summary.errorRate, 0.1)) * 100;
  if (errorChange > thresholds.errorRate) {
    regressions.push({
      metric: 'Error Rate',
      baselineValue: baseline.summary.errorRate,
      currentValue: current.summary.errorRate,
      change: errorChange,
      severity: errorChange > thresholds.errorRate * 2 ? 'critical' : errorChange > thresholds.errorRate * 1.5 ? 'high' : 'medium'
    });
  }

  const throughputChange = ((baseline.summary.overallThroughput - current.summary.overallThroughput) / baseline.summary.overallThroughput) * 100;
  if (throughputChange > thresholds.throughput) {
    regressions.push({
      metric: 'Throughput',
      baselineValue: baseline.summary.overallThroughput,
      currentValue: current.summary.overallThroughput,
      change: -throughputChange,
      severity: throughputChange > thresholds.throughput * 2 ? 'critical' : throughputChange > thresholds.throughput * 1.5 ? 'high' : 'medium'
    });
  }

  const hasRegression = regressions.length > 0;

  let summary = hasRegression
    ? `${regressions.length} performance regression${regressions.length > 1 ? 's' : ''} detected`
    : 'No significant performance regressions detected';

  const criticalCount = regressions.filter(r => r.severity === 'critical').length;
  if (criticalCount > 0) {
    summary += ` (${criticalCount} critical)`;
  }

  return {
    hasRegression,
    regressions,
    summary
  };
};
