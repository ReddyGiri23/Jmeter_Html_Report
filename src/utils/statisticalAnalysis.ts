import * as ss from 'simple-statistics';
import _ from 'lodash';

export interface AnomalyResult {
  index: number;
  value: number;
  timestamp: number;
  label: string;
  severity: 'low' | 'medium' | 'high';
  zScore: number;
}

export interface TrendAnalysis {
  slope: number;
  intercept: number;
  rSquared: number;
  prediction: number[];
  direction: 'improving' | 'degrading' | 'stable';
  confidence: number;
}

export interface CorrelationAnalysis {
  metric1: string;
  metric2: string;
  coefficient: number;
  strength: 'weak' | 'moderate' | 'strong';
  type: 'positive' | 'negative' | 'none';
}

export interface OutlierDetection {
  outliers: number[];
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
}

export interface ClusterResult {
  clusterId: number;
  members: string[];
  centroid: {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  characteristics: string;
}

export const detectAnomalies = (
  data: Array<{ x: number; y: number; label: string }>,
  threshold: number = 3
): AnomalyResult[] => {
  if (data.length < 3) return [];

  const values = data.map(d => d.y);
  const mean = ss.mean(values);
  const stdDev = ss.standardDeviation(values);

  if (stdDev === 0) return [];

  const anomalies: AnomalyResult[] = [];

  data.forEach((point, index) => {
    const zScore = Math.abs((point.y - mean) / stdDev);

    if (zScore > threshold) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (zScore > threshold * 2) severity = 'high';
      else if (zScore > threshold * 1.5) severity = 'medium';

      anomalies.push({
        index,
        value: point.y,
        timestamp: point.x,
        label: point.label,
        severity,
        zScore
      });
    }
  });

  return anomalies;
};

export const performTrendAnalysis = (
  data: Array<{ x: number; y: number }>,
  forecastPoints: number = 5
): TrendAnalysis | null => {
  if (data.length < 3) return null;

  const sortedData = _.sortBy(data, 'x');
  const xValues = sortedData.map((d, i) => i);
  const yValues = sortedData.map(d => d.y);

  const regression = ss.linearRegression([xValues, yValues]);
  const rSquared = ss.rSquared([xValues, yValues], regression);

  const prediction: number[] = [];
  for (let i = xValues.length; i < xValues.length + forecastPoints; i++) {
    const predictedY = regression.m * i + regression.b;
    prediction.push(Math.max(0, predictedY));
  }

  let direction: 'improving' | 'degrading' | 'stable' = 'stable';
  const slopeThreshold = ss.mean(yValues) * 0.01;

  if (regression.m < -slopeThreshold) direction = 'improving';
  else if (regression.m > slopeThreshold) direction = 'degrading';

  const confidence = rSquared * 100;

  return {
    slope: regression.m,
    intercept: regression.b,
    rSquared,
    prediction,
    direction,
    confidence
  };
};

export const calculateCorrelations = (
  datasets: Array<{ name: string; values: number[] }>
): CorrelationAnalysis[] => {
  if (datasets.length < 2) return [];

  const correlations: CorrelationAnalysis[] = [];
  const minLength = Math.min(...datasets.map(d => d.values.length));

  for (let i = 0; i < datasets.length; i++) {
    for (let j = i + 1; j < datasets.length; j++) {
      const data1 = datasets[i].values.slice(0, minLength);
      const data2 = datasets[j].values.slice(0, minLength);

      if (data1.length < 2 || ss.standardDeviation(data1) === 0 || ss.standardDeviation(data2) === 0) {
        continue;
      }

      try {
        const coefficient = ss.sampleCorrelation(data1, data2);
        const absCoeff = Math.abs(coefficient);

        let strength: 'weak' | 'moderate' | 'strong' = 'weak';
        if (absCoeff > 0.7) strength = 'strong';
        else if (absCoeff > 0.4) strength = 'moderate';

        let type: 'positive' | 'negative' | 'none' = 'none';
        if (coefficient > 0.1) type = 'positive';
        else if (coefficient < -0.1) type = 'negative';

        correlations.push({
          metric1: datasets[i].name,
          metric2: datasets[j].name,
          coefficient,
          strength,
          type
        });
      } catch (error) {
        continue;
      }
    }
  }

  return correlations;
};

export const detectOutliers = (values: number[]): OutlierDetection => {
  if (values.length === 0) {
    return {
      outliers: [],
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerBound: 0,
      upperBound: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = ss.quantile(sorted, 0.25);
  const q3 = ss.quantile(sorted, 0.75);
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = values.filter(v => v < lowerBound || v > upperBound);

  return {
    outliers,
    q1,
    q3,
    iqr,
    lowerBound,
    upperBound
  };
};

export const clusterTransactions = (
  transactions: Array<{
    label: string;
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
  }>,
  numClusters: number = 3
): ClusterResult[] => {
  if (transactions.length < numClusters) {
    return transactions.map((t, i) => ({
      clusterId: i,
      members: [t.label],
      centroid: {
        avgResponseTime: t.avgResponseTime,
        throughput: t.throughput,
        errorRate: t.errorRate
      },
      characteristics: characterizeTransaction(t)
    }));
  }

  const features = transactions.map(t => [
    normalizeValue(t.avgResponseTime, transactions.map(x => x.avgResponseTime)),
    normalizeValue(t.throughput, transactions.map(x => x.throughput)),
    normalizeValue(t.errorRate, transactions.map(x => x.errorRate))
  ]);

  const clusters = kMeansClustering(features, numClusters);

  const clusterResults: ClusterResult[] = [];
  for (let i = 0; i < numClusters; i++) {
    const clusterMembers = transactions.filter((_, idx) => clusters[idx] === i);

    if (clusterMembers.length === 0) continue;

    const centroid = {
      avgResponseTime: ss.mean(clusterMembers.map(t => t.avgResponseTime)),
      throughput: ss.mean(clusterMembers.map(t => t.throughput)),
      errorRate: ss.mean(clusterMembers.map(t => t.errorRate))
    };

    clusterResults.push({
      clusterId: i,
      members: clusterMembers.map(t => t.label),
      centroid,
      characteristics: characterizeCluster(centroid)
    });
  }

  return clusterResults;
};

const normalizeValue = (value: number, allValues: number[]): number => {
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};

const kMeansClustering = (data: number[][], k: number, maxIterations: number = 100): number[] => {
  const n = data.length;
  const d = data[0].length;

  let centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    centroids.push(data[Math.floor(Math.random() * n)].slice());
  }

  let assignments = new Array(n).fill(0);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let minCluster = 0;

      for (let j = 0; j < k; j++) {
        const dist = euclideanDistance(data[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          minCluster = j;
        }
      }

      if (assignments[i] !== minCluster) {
        assignments[i] = minCluster;
        changed = true;
      }
    }

    for (let j = 0; j < k; j++) {
      const clusterPoints = data.filter((_, idx) => assignments[idx] === j);
      if (clusterPoints.length > 0) {
        centroids[j] = new Array(d).fill(0).map((_, dim) =>
          ss.mean(clusterPoints.map(p => p[dim]))
        );
      }
    }
  }

  return assignments;
};

const euclideanDistance = (a: number[], b: number[]): number => {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
};

const characterizeTransaction = (t: { avgResponseTime: number; throughput: number; errorRate: number }): string => {
  const parts: string[] = [];

  if (t.avgResponseTime < 500) parts.push('Fast');
  else if (t.avgResponseTime < 2000) parts.push('Moderate');
  else parts.push('Slow');

  if (t.errorRate > 10) parts.push('High Errors');
  else if (t.errorRate > 1) parts.push('Some Errors');
  else parts.push('Stable');

  if (t.throughput > 10) parts.push('High Volume');
  else if (t.throughput > 1) parts.push('Moderate Volume');
  else parts.push('Low Volume');

  return parts.join(', ');
};

const characterizeCluster = (centroid: { avgResponseTime: number; throughput: number; errorRate: number }): string => {
  return characterizeTransaction(centroid);
};

export const calculateConfidenceInterval = (
  values: number[],
  confidenceLevel: number = 0.95
): { mean: number; lower: number; upper: number; marginOfError: number } => {
  if (values.length === 0) {
    return { mean: 0, lower: 0, upper: 0, marginOfError: 0 };
  }

  const mean = ss.mean(values);
  const stdError = ss.standardDeviation(values) / Math.sqrt(values.length);

  const zScore = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;
  const marginOfError = zScore * stdError;

  return {
    mean,
    lower: mean - marginOfError,
    upper: mean + marginOfError,
    marginOfError
  };
};

export const detectChangePoints = (
  data: Array<{ x: number; y: number }>,
  sensitivity: number = 2
): number[] => {
  if (data.length < 10) return [];

  const sortedData = _.sortBy(data, 'x');
  const values = sortedData.map(d => d.y);
  const changePoints: number[] = [];

  const windowSize = Math.max(5, Math.floor(values.length / 10));

  for (let i = windowSize; i < values.length - windowSize; i++) {
    const leftWindow = values.slice(i - windowSize, i);
    const rightWindow = values.slice(i, i + windowSize);

    const leftMean = ss.mean(leftWindow);
    const rightMean = ss.mean(rightWindow);
    const leftStd = ss.standardDeviation(leftWindow);
    const rightStd = ss.standardDeviation(rightWindow);

    const pooledStd = Math.sqrt((leftStd ** 2 + rightStd ** 2) / 2);

    if (pooledStd === 0) continue;

    const tStat = Math.abs(leftMean - rightMean) / (pooledStd * Math.sqrt(2 / windowSize));

    if (tStat > sensitivity) {
      changePoints.push(sortedData[i].x);
    }
  }

  return changePoints;
};
