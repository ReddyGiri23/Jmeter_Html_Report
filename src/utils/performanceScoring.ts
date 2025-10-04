import { TransactionMetrics, TestSummary, SLAResult } from '../types/jmeter';
import _ from 'lodash';

export interface PerformanceScore {
  overall: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    responseTime: { score: number; weight: number };
    throughput: { score: number; weight: number };
    errorRate: { score: number; weight: number };
    stability: { score: number; weight: number };
    scalability: { score: number; weight: number };
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface CapacityRecommendation {
  currentCapacity: number;
  recommendedCapacity: number;
  headroom: number;
  bottlenecks: string[];
  projectedPerformance: {
    at50Percent: { responseTime: number; throughput: number };
    at75Percent: { responseTime: number; throughput: number };
    at100Percent: { responseTime: number; throughput: number };
  };
}

export interface AdaptiveSLA {
  metric: string;
  currentThreshold: number;
  recommendedThreshold: number;
  confidence: number;
  reasoning: string;
  historicalPerformance: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export const calculatePerformanceScore = (
  summary: TestSummary,
  transactions: TransactionMetrics[],
  slaResults: SLAResult
): PerformanceScore => {
  const weights = {
    responseTime: 0.30,
    throughput: 0.20,
    errorRate: 0.25,
    stability: 0.15,
    scalability: 0.10
  };

  const responseTimeScore = calculateResponseTimeScore(summary.avgResponseTime, summary.p95ResponseTime);
  const throughputScore = calculateThroughputScore(summary.overallThroughput);
  const errorRateScore = calculateErrorRateScore(summary.errorRate);
  const stabilityScore = calculateStabilityScore(transactions);
  const scalabilityScore = calculateScalabilityScore(transactions);

  const overall =
    responseTimeScore * weights.responseTime +
    throughputScore * weights.throughput +
    errorRateScore * weights.errorRate +
    stabilityScore * weights.stability +
    scalabilityScore * weights.scalability;

  const grade = determineGrade(overall);

  const breakdown = {
    responseTime: { score: responseTimeScore, weight: weights.responseTime },
    throughput: { score: throughputScore, weight: weights.throughput },
    errorRate: { score: errorRateScore, weight: weights.errorRate },
    stability: { score: stabilityScore, weight: weights.stability },
    scalability: { score: scalabilityScore, weight: weights.scalability }
  };

  const strengths = identifyStrengths(breakdown);
  const weaknesses = identifyWeaknesses(breakdown);
  const recommendations = generateRecommendations(breakdown, summary);

  return {
    overall,
    grade,
    breakdown,
    strengths,
    weaknesses,
    recommendations
  };
};

const calculateResponseTimeScore = (avgRT: number, p95RT: number): number => {
  let score = 100;

  if (avgRT > 3000) score -= 30;
  else if (avgRT > 2000) score -= 20;
  else if (avgRT > 1000) score -= 10;
  else if (avgRT > 500) score -= 5;

  if (p95RT > 5000) score -= 20;
  else if (p95RT > 3000) score -= 10;
  else if (p95RT > 2000) score -= 5;

  const variability = p95RT / Math.max(avgRT, 1);
  if (variability > 3) score -= 10;
  else if (variability > 2) score -= 5;

  return Math.max(0, score);
};

const calculateThroughputScore = (throughput: number): number => {
  let score = 100;

  if (throughput < 0.1) score = 50;
  else if (throughput < 1) score = 70;
  else if (throughput < 10) score = 85;
  else if (throughput < 50) score = 95;

  return score;
};

const calculateErrorRateScore = (errorRate: number): number => {
  let score = 100;

  if (errorRate > 10) score = 0;
  else if (errorRate > 5) score = 40;
  else if (errorRate > 2) score = 70;
  else if (errorRate > 1) score = 85;
  else if (errorRate > 0.1) score = 95;

  return score;
};

const calculateStabilityScore = (transactions: TransactionMetrics[]): number => {
  if (transactions.length === 0) return 50;

  const coefficientsOfVariation = transactions.map(t => {
    const cv = (t.maxResponseTime - t.avgResponseTime) / Math.max(t.avgResponseTime, 1);
    return cv;
  });

  const avgCV = _.mean(coefficientsOfVariation);

  let score = 100;
  if (avgCV > 2) score = 60;
  else if (avgCV > 1.5) score = 75;
  else if (avgCV > 1) score = 85;
  else if (avgCV > 0.5) score = 95;

  return score;
};

const calculateScalabilityScore = (transactions: TransactionMetrics[]): number => {
  if (transactions.length === 0) return 50;

  const transactionsWithoutErrors = transactions.filter(t => t.errorRate < 5);
  const scalabilityRatio = transactionsWithoutErrors.length / transactions.length;

  let score = scalabilityRatio * 100;

  const avgErrorRate = _.mean(transactions.map(t => t.errorRate));
  if (avgErrorRate > 5) score -= 20;
  else if (avgErrorRate > 2) score -= 10;

  return Math.max(0, score);
};

const determineGrade = (score: number): PerformanceScore['grade'] => {
  if (score >= 97) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const identifyStrengths = (breakdown: PerformanceScore['breakdown']): string[] => {
  const strengths: string[] = [];

  if (breakdown.responseTime.score >= 90) {
    strengths.push('Excellent response times across all transactions');
  }
  if (breakdown.throughput.score >= 90) {
    strengths.push('High throughput capacity maintained');
  }
  if (breakdown.errorRate.score >= 95) {
    strengths.push('Very low error rate indicating high reliability');
  }
  if (breakdown.stability.score >= 90) {
    strengths.push('Consistent performance with minimal variance');
  }
  if (breakdown.scalability.score >= 90) {
    strengths.push('Good scalability characteristics under load');
  }

  return strengths.length > 0 ? strengths : ['System meets basic performance requirements'];
};

const identifyWeaknesses = (breakdown: PerformanceScore['breakdown']): string[] => {
  const weaknesses: string[] = [];

  if (breakdown.responseTime.score < 70) {
    weaknesses.push('Response times exceed acceptable thresholds');
  }
  if (breakdown.throughput.score < 70) {
    weaknesses.push('Low throughput capacity may limit scalability');
  }
  if (breakdown.errorRate.score < 70) {
    weaknesses.push('High error rate indicates reliability concerns');
  }
  if (breakdown.stability.score < 70) {
    weaknesses.push('Inconsistent performance with high variance');
  }
  if (breakdown.scalability.score < 70) {
    weaknesses.push('Poor scalability under increased load');
  }

  return weaknesses;
};

const generateRecommendations = (
  breakdown: PerformanceScore['breakdown'],
  summary: TestSummary
): string[] => {
  const recommendations: string[] = [];

  if (breakdown.responseTime.score < 80) {
    recommendations.push('Optimize slow endpoints and database queries');
    recommendations.push('Consider implementing caching strategies');
    recommendations.push('Review and optimize n+1 query patterns');
  }

  if (breakdown.throughput.score < 80) {
    recommendations.push('Scale horizontally to increase capacity');
    recommendations.push('Optimize connection pool settings');
    recommendations.push('Consider asynchronous processing for heavy operations');
  }

  if (breakdown.errorRate.score < 80) {
    recommendations.push('Investigate and fix failing transactions');
    recommendations.push('Implement retry logic for transient failures');
    recommendations.push('Add circuit breakers for external dependencies');
  }

  if (breakdown.stability.score < 80) {
    recommendations.push('Identify and eliminate performance bottlenecks');
    recommendations.push('Implement rate limiting to prevent resource exhaustion');
    recommendations.push('Review garbage collection and memory usage patterns');
  }

  if (breakdown.scalability.score < 80) {
    recommendations.push('Address architectural limitations for better scalability');
    recommendations.push('Implement load balancing across multiple instances');
    recommendations.push('Consider microservices architecture for independent scaling');
  }

  if (summary.avgResponseTime > 1000 && summary.errorRate < 5) {
    recommendations.push('Performance is slow but stable - focus on optimization');
  }

  return recommendations;
};

export const generateCapacityRecommendations = (
  summary: TestSummary,
  transactions: TransactionMetrics[]
): CapacityRecommendation => {
  const currentCapacity = summary.virtualUsers;
  const avgResponseTime = summary.avgResponseTime;
  const throughput = summary.overallThroughput;
  const errorRate = summary.errorRate;

  let recommendedCapacity = currentCapacity;
  const bottlenecks: string[] = [];

  if (errorRate < 1 && avgResponseTime < 1000) {
    recommendedCapacity = Math.floor(currentCapacity * 1.5);
  } else if (errorRate < 5 && avgResponseTime < 2000) {
    recommendedCapacity = Math.floor(currentCapacity * 1.2);
  } else if (errorRate > 10) {
    recommendedCapacity = Math.floor(currentCapacity * 0.7);
    bottlenecks.push('High error rate indicates system overload');
  } else if (avgResponseTime > 3000) {
    recommendedCapacity = Math.floor(currentCapacity * 0.8);
    bottlenecks.push('High response times suggest resource constraints');
  }

  const slowTransactions = transactions.filter(t => t.avgResponseTime > 2000);
  if (slowTransactions.length > 0) {
    bottlenecks.push(`${slowTransactions.length} transactions are slow (>2s avg)`);
  }

  const errorProneTransactions = transactions.filter(t => t.errorRate > 5);
  if (errorProneTransactions.length > 0) {
    bottlenecks.push(`${errorProneTransactions.length} transactions have high error rates`);
  }

  const headroom = ((recommendedCapacity - currentCapacity) / currentCapacity) * 100;

  const projectedPerformance = {
    at50Percent: {
      responseTime: avgResponseTime * 0.6,
      throughput: throughput * 0.5
    },
    at75Percent: {
      responseTime: avgResponseTime * 0.8,
      throughput: throughput * 0.75
    },
    at100Percent: {
      responseTime: avgResponseTime,
      throughput: throughput
    }
  };

  return {
    currentCapacity,
    recommendedCapacity,
    headroom,
    bottlenecks,
    projectedPerformance
  };
};

export const generateAdaptiveSLAs = (
  transactions: TransactionMetrics[],
  currentSLA: SLAResult
): AdaptiveSLA[] => {
  const adaptiveSLAs: AdaptiveSLA[] = [];

  const responseTimes = transactions.map(t => t.avgResponseTime);
  const p50RT = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.5)] || 0;
  const p95RT = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)] || 0;
  const p99RT = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)] || 0;

  adaptiveSLAs.push({
    metric: 'Average Response Time',
    currentThreshold: currentSLA.avgResponseTime.threshold,
    recommendedThreshold: Math.ceil(p95RT * 1.2),
    confidence: 0.85,
    reasoning: 'Based on P95 response time with 20% buffer for variance',
    historicalPerformance: { p50: p50RT, p95: p95RT, p99: p99RT }
  });

  const avgThroughput = _.mean(transactions.map(t => t.throughput));
  const minSafeThroughput = avgThroughput * 0.7;

  adaptiveSLAs.push({
    metric: 'Throughput',
    currentThreshold: currentSLA.averageThroughput.threshold,
    recommendedThreshold: Number(minSafeThroughput.toFixed(4)),
    confidence: 0.8,
    reasoning: '70% of average throughput to allow for performance degradation',
    historicalPerformance: {
      p50: avgThroughput,
      p95: avgThroughput * 1.2,
      p99: avgThroughput * 1.4
    }
  });

  const maxAcceptableErrorRate = Math.max(1, Math.ceil(_.mean(transactions.map(t => t.errorRate)) * 2));

  adaptiveSLAs.push({
    metric: 'Error Rate',
    currentThreshold: currentSLA.errorRate.threshold,
    recommendedThreshold: maxAcceptableErrorRate,
    confidence: 0.9,
    reasoning: 'Set to 2x average error rate or 1%, whichever is higher',
    historicalPerformance: {
      p50: _.mean(transactions.map(t => t.errorRate)),
      p95: Math.ceil(_.mean(transactions.map(t => t.errorRate)) * 2),
      p99: Math.ceil(_.mean(transactions.map(t => t.errorRate)) * 3)
    }
  });

  return adaptiveSLAs;
};

export const calculatePerformanceBudget = (
  current: TestSummary,
  target: { responseTime: number; errorRate: number; throughput: number }
): {
  status: 'within_budget' | 'near_limit' | 'over_budget';
  metrics: Array<{
    name: string;
    current: number;
    target: number;
    usage: number;
    status: 'good' | 'warning' | 'critical';
  }>;
} => {
  const metrics = [
    {
      name: 'Response Time',
      current: current.avgResponseTime,
      target: target.responseTime,
      usage: (current.avgResponseTime / target.responseTime) * 100,
      status: current.avgResponseTime <= target.responseTime ? 'good' as const :
              current.avgResponseTime <= target.responseTime * 1.1 ? 'warning' as const : 'critical' as const
    },
    {
      name: 'Error Rate',
      current: current.errorRate,
      target: target.errorRate,
      usage: (current.errorRate / target.errorRate) * 100,
      status: current.errorRate <= target.errorRate ? 'good' as const :
              current.errorRate <= target.errorRate * 1.1 ? 'warning' as const : 'critical' as const
    },
    {
      name: 'Throughput',
      current: current.overallThroughput,
      target: target.throughput,
      usage: (current.overallThroughput / target.throughput) * 100,
      status: current.overallThroughput >= target.throughput ? 'good' as const :
              current.overallThroughput >= target.throughput * 0.9 ? 'warning' as const : 'critical' as const
    }
  ];

  const criticalCount = metrics.filter(m => m.status === 'critical').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;

  let status: 'within_budget' | 'near_limit' | 'over_budget';
  if (criticalCount > 0) status = 'over_budget';
  else if (warningCount > 0) status = 'near_limit';
  else status = 'within_budget';

  return { status, metrics };
};
