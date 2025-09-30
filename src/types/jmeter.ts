export interface JMeterSample {
  timeStamp: number;
  elapsed: number;
  label: string;
  responseCode: string;
  responseMessage: string;
  threadName: string;
  success: boolean;
  bytes: number;
  sentBytes: number;
  grpThreads: number;
  allThreads: number;
}

export interface TransactionMetrics {
  label: string;
  count: number;
  avgResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  maxResponseTime: number;
  errors: number;
  errorRate: number;
  throughput: number;
}

export interface TestSummary {
  applicationVersion: string;
  testEnvironment: string;
  testDuration: number;
  virtualUsers: number;
  totalRequests: number;
  totalErrors: number;
  overallThroughput: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  startTime: number;
  endTime: number;
}

export interface SLAResult {
  avgResponseTime: {
    value: number;
    threshold: number;
    passed: boolean;
  };
  averageThroughput: {
    value: number;
    threshold: number;
    passed: boolean;
  };
  errorRate: {
    value: number;
    threshold: number;
    passed: boolean;
  };
  overallPassed: boolean;
}

export interface ErrorSample {
  timestamp: number;
  label: string;
  responseTime: number;
  threadName: string;
  responseMessage: string;
  responseCode: string;
}

export interface ChartData {
  responseTimesOverTime: Array<{ x: number; y: number; label: string }>;
  tpsOverTime: Array<{ x: number; y: number }>;
  errorsOverTime: Array<{ x: number; y: number }>;
  percentiles: Array<{ label: string; p50: number; p75: number; p90: number; p95: number; p99: number }>;
  throughputVsResponseTime: Array<{ x: number; y: number; label: string }>;
  usersVsResponseTime: Array<{ x: number; y: number; label: string }>;
  errorsVsUsers: Array<{ x: number; y: number; label: string }>;
  errorsVsResponseTime: Array<{ x: number; y: number; label: string }>;
  hitsOverTime: Array<{ x: number; y: number }>;
}

export interface JMeterData {
  samples: JMeterSample[];
  summary: TestSummary;
  transactions: TransactionMetrics[];
  slaResults: SLAResult;
  errorSamples: ErrorSample[];
  errorCountsByStatusCode: Record<string, number>;
  chartData: ChartData;
}

export interface ComparisonMetrics {
  label: string;
  current: {
    avgResponseTime: number;
    p90ResponseTime: number;
    throughput: number;
    errorRate: number;
    count: number;
  };
  previous: {
    avgResponseTime: number;
    p90ResponseTime: number;
    throughput: number;
    errorRate: number;
    count: number;
  };
  changes: {
    avgResponseTime: number; // percentage change
    p90ResponseTime: number; // percentage change
    throughput: number; // percentage change
    errorRate: number; // percentage change
  };
  status: 'improvement' | 'regression' | 'neutral';
}

export interface ComparisonResult {
  currentTest: {
    fileName: string;
    summary: TestSummary;
  };
  previousTest: {
    fileName: string;
    summary: TestSummary;
  };
  metrics: ComparisonMetrics[];
  overallStatus: 'improvement' | 'regression' | 'mixed' | 'neutral';
  insights: {
    topImprovements: ComparisonMetrics[];
    topRegressions: ComparisonMetrics[];
    summary: string;
  };
}

export interface ReportGenerationOptions {
  slaThresholds: {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  reportOptions: {
    includeCharts: boolean;
    maxErrorSamples: number;
    samplingRate: number;
  };
  testConfig: {
    testEnvironment: string;
  };
}