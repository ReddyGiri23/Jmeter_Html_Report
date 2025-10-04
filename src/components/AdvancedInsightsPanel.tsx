import { AlertCircle, TrendingUp, TrendingDown, Minus, Activity, Target, Zap } from 'lucide-react';
import { JMeterData } from '../types/jmeter';
import {
  detectAnomalies,
  performTrendAnalysis,
  calculateCorrelations,
  clusterTransactions
} from '../utils/statisticalAnalysis';
import {
  recognizeErrorPatterns,
  detectErrorClusters,
  analyzeRootCause,
  calculateErrorSeverityScore
} from '../utils/errorAnalysis';
import {
  calculatePerformanceScore,
  generateCapacityRecommendations,
  generateAdaptiveSLAs
} from '../utils/performanceScoring';

interface AdvancedInsightsPanelProps {
  data: JMeterData;
}

const AdvancedInsightsPanel = ({ data }: AdvancedInsightsPanelProps) => {
  const anomalies = detectAnomalies(data.chartData.responseTimesOverTime);
  const trend = performTrendAnalysis(
    data.chartData.tpsOverTime.map((d, i) => ({ x: i, y: d.y })),
    5
  );

  const correlationData = [
    { name: 'Response Time', values: data.samples.slice(0, 100).map(s => s.elapsed) },
    { name: 'Thread Count', values: data.samples.slice(0, 100).map(s => s.allThreads) },
    { name: 'Bytes', values: data.samples.slice(0, 100).map(s => s.bytes) }
  ];
  const correlations = calculateCorrelations(correlationData);

  const clusters = clusterTransactions(
    data.transactions.map(t => ({
      label: t.label,
      avgResponseTime: t.avgResponseTime,
      throughput: t.throughput,
      errorRate: t.errorRate
    })),
    3
  );

  const errorPatterns = recognizeErrorPatterns(data.errorSamples, data.summary.totalRequests);
  const errorClusters = detectErrorClusters(data.errorSamples);
  const rootCause = analyzeRootCause(data.errorSamples, data.samples);
  const errorSeverity = calculateErrorSeverityScore(data.errorSamples, data.summary.totalRequests);

  const performanceScore = calculatePerformanceScore(
    data.summary,
    data.transactions,
    data.slaResults
  );

  const capacityRecs = generateCapacityRecommendations(data.summary, data.transactions);
  const adaptiveSLAs = generateAdaptiveSLAs(data.transactions, data.slaResults);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Advanced Performance Insights</h2>
        </div>
        <p className="text-gray-700">
          AI-powered analysis of your test results with actionable recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Performance Score</h3>
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-center">
            <div className={`text-5xl font-bold mb-2 ${
              performanceScore.overall >= 90 ? 'text-green-600' :
              performanceScore.overall >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {performanceScore.overall.toFixed(0)}
            </div>
            <div className={`text-2xl font-bold mb-4 ${
              performanceScore.grade === 'A+' || performanceScore.grade === 'A' ? 'text-green-600' :
              performanceScore.grade === 'B' || performanceScore.grade === 'C' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              Grade {performanceScore.grade}
            </div>
            <div className="space-y-2 text-sm">
              {Object.entries(performanceScore.breakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="font-semibold">{value.score.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Error Severity</h3>
            <AlertCircle className={`h-5 w-5 ${
              errorSeverity.grade === 'A' ? 'text-green-600' :
              errorSeverity.grade === 'B' || errorSeverity.grade === 'C' ? 'text-yellow-600' :
              'text-red-600'
            }`} />
          </div>
          <div className="text-center">
            <div className={`text-5xl font-bold mb-2 ${
              errorSeverity.score >= 90 ? 'text-green-600' :
              errorSeverity.score >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {errorSeverity.score.toFixed(0)}
            </div>
            <div className={`text-2xl font-bold mb-4 ${
              errorSeverity.grade === 'A' ? 'text-green-600' :
              errorSeverity.grade === 'B' || errorSeverity.grade === 'C' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              Grade {errorSeverity.grade}
            </div>
            <p className="text-sm text-gray-600">{errorSeverity.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Capacity Analysis</h3>
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Users:</span>
              <span className="font-semibold">{capacityRecs.currentCapacity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recommended:</span>
              <span className="font-semibold">{capacityRecs.recommendedCapacity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Headroom:</span>
              <span className={`font-semibold ${
                capacityRecs.headroom > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {capacityRecs.headroom > 0 ? '+' : ''}{capacityRecs.headroom.toFixed(0)}%
              </span>
            </div>
            {capacityRecs.bottlenecks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Bottlenecks:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {capacityRecs.bottlenecks.slice(0, 3).map((b, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-500">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {trend && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {trend.direction === 'improving' && <TrendingUp className="h-5 w-5 text-green-600" />}
            {trend.direction === 'degrading' && <TrendingDown className="h-5 w-5 text-red-600" />}
            {trend.direction === 'stable' && <Minus className="h-5 w-5 text-gray-600" />}
            Performance Trend Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Direction:</p>
              <p className={`font-semibold capitalize ${
                trend.direction === 'improving' ? 'text-green-600' :
                trend.direction === 'degrading' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {trend.direction}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Confidence:</p>
              <p className="font-semibold">{trend.confidence.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-600">Slope:</p>
              <p className="font-semibold">{trend.slope.toFixed(4)}</p>
            </div>
          </div>
          {trend.prediction.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Forecasted throughput (next 5 intervals):</p>
              <div className="flex gap-2">
                {trend.prediction.map((val, i) => (
                  <div key={i} className="flex-1 bg-blue-50 rounded p-2 text-center">
                    <div className="text-xs text-gray-600">+{i + 1}</div>
                    <div className="font-semibold text-sm">{val.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Anomaly Detection ({anomalies.length} found)
          </h3>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((anomaly, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  anomaly.severity === 'high' ? 'bg-red-50 border-red-200' :
                  anomaly.severity === 'medium' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{anomaly.label}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Response time: {anomaly.value.toFixed(0)}ms (Z-score: {anomaly.zScore.toFixed(2)})
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    anomaly.severity === 'high' ? 'bg-red-200 text-red-800' :
                    anomaly.severity === 'medium' ? 'bg-orange-200 text-orange-800' :
                    'bg-yellow-200 text-yellow-800'
                  }`}>
                    {anomaly.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {clusters.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Transaction Clustering</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clusters.map((cluster) => (
              <div key={cluster.clusterId} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Cluster {cluster.clusterId + 1}</h4>
                <p className="text-xs text-gray-600 mb-3">{cluster.characteristics}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg RT:</span>
                    <span className="font-semibold">{cluster.centroid.avgResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Throughput:</span>
                    <span className="font-semibold">{cluster.centroid.throughput.toFixed(2)}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error Rate:</span>
                    <span className="font-semibold">{cluster.centroid.errorRate.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">{cluster.members.length} transactions</p>
                  <div className="text-xs text-gray-500">
                    {cluster.members.slice(0, 2).map(m => (
                      <div key={m} className="truncate">{m}</div>
                    ))}
                    {cluster.members.length > 2 && (
                      <div>+{cluster.members.length - 2} more</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rootCause && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Root Cause Analysis</h3>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-sm text-red-900 mb-2">Primary Cause:</p>
              <p className="text-sm text-red-800">{rootCause.primaryCause}</p>
              <p className="text-xs text-red-700 mt-2">
                Confidence: {(rootCause.confidence * 100).toFixed(0)}%
              </p>
            </div>

            {rootCause.contributingFactors.length > 0 && (
              <div>
                <p className="font-semibold text-sm text-gray-900 mb-2">Contributing Factors:</p>
                <div className="space-y-2">
                  {rootCause.contributingFactors.map((factor, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${factor.weight * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700 w-2/3">{factor.factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-sm text-blue-900 mb-2">Recommendations:</p>
              <p className="text-sm text-blue-800">{rootCause.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Performance Recommendations</h3>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Strengths:</h4>
            <ul className="space-y-1">
              {performanceScore.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {performanceScore.weaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Weaknesses:</h4>
              <ul className="space-y-1">
                {performanceScore.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Action Items:</h4>
            <ul className="space-y-2">
              {performanceScore.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2 bg-blue-50 p-2 rounded">
                  <span className="text-blue-500 mt-1">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {adaptiveSLAs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Adaptive SLA Recommendations</h3>
          <div className="space-y-4">
            {adaptiveSLAs.map((sla, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm">{sla.metric}</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {(sla.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                  <div>
                    <p className="text-gray-600">Current Threshold:</p>
                    <p className="font-semibold">{sla.currentThreshold.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Recommended:</p>
                    <p className="font-semibold text-blue-600">{sla.recommendedThreshold.toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">{sla.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedInsightsPanel;
