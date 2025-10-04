import React, { useState } from 'react';
import { RefreshCcw, Download, CheckCircle, XCircle, FileText, Sparkles } from 'lucide-react';
import { JMeterData } from '../types/jmeter';
import { generateHTMLReport } from '../utils/reportGenerator';
import AdvancedInsightsPanel from './AdvancedInsightsPanel';
import HeatmapChart from './charts/HeatmapChart';
import BoxPlotChart from './charts/BoxPlotChart';
import CorrelationMatrix from './charts/CorrelationMatrix';
import { calculateCorrelations } from '../utils/statisticalAnalysis';

interface ReportDashboardProps {
  data: JMeterData;
  onReset: () => void;
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ data, onReset }) => {
  const [activeView, setActiveView] = useState<'summary' | 'advanced' | 'visualizations'>('summary');

  const handleDownloadReport = () => {
    const htmlReport = generateHTMLReport(data);
    const blob = new Blob([htmlReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jmeter-performance-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const heatmapData = data.samples.map(s => ({
    timestamp: s.timeStamp,
    transaction: s.label,
    responseTime: s.elapsed
  }));

  const boxPlotData = data.transactions.map(t => {
    const transactionSamples = data.samples
      .filter(s => s.label === t.label)
      .map(s => s.elapsed);
    return {
      label: t.label,
      values: transactionSamples
    };
  });

  const correlationData = [
    { name: 'Response Time', values: data.samples.slice(0, 100).map(s => s.elapsed) },
    { name: 'Thread Count', values: data.samples.slice(0, 100).map(s => s.allThreads) },
    { name: 'Bytes Sent', values: data.samples.slice(0, 100).map(s => s.sentBytes) },
    { name: 'Bytes Received', values: data.samples.slice(0, 100).map(s => s.bytes) }
  ];
  const correlations = calculateCorrelations(correlationData);
  const metricNames = correlationData.map(d => d.name);

  return (
    <div className="space-y-8">
      {/* Header with Test Status and View Tabs */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {data.slaResults.overallPassed ? (
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500 mr-3" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              Test {data.slaResults.overallPassed ? 'PASSED' : 'FAILED'}
            </h2> 
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Download HTML Report
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Upload New File
          </button>
        </div>
        </div>

        {/* View Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveView('summary')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeView === 'summary'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Summary Report
          </button>
          <button
            onClick={() => setActiveView('advanced')}
            className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
              activeView === 'advanced'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Advanced Insights
          </button>
          <button
            onClick={() => setActiveView('visualizations')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeView === 'visualizations'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Advanced Visualizations
          </button>
        </div>
      </div>

      {/* Conditional Content Based on Active View */}
      {activeView === 'summary' && (
        <>
      {/* Report Preview Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-indigo-500 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">HTML Report Preview</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">{data.summary.totalRequests.toLocaleString()}</div>
            <div className="text-sm text-blue-800">Total Requests</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">{data.summary.avgResponseTime.toFixed(0)}ms</div>
            <div className="text-sm text-green-800">Avg Response Time</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-2">{data.summary.errorRate.toFixed(2)}%</div>
            <div className="text-sm text-red-800">Error Rate</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Report Contents</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">📊 Dashboard Tab</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Test Configuration Summary</li>
                <li>• SLA Gates Status</li>
                <li>• Aggregate Report Table</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">📈 Graphs Tab</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Response Times Over Time</li>
                <li>• Throughput Analysis</li>
                <li>• Error Rate Trends</li>
                <li>• Performance Correlations</li>
                <li>• User Load Analysis</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">🚨 Error Report Tab</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Failed Request Details</li>
                <li>• Error Messages</li>
                <li>• Timestamp Analysis</li>
                <li>• Thread Information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">{data.summary.testDuration}s</div>
          <div className="text-sm text-gray-600">Test Duration</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{data.summary.virtualUsers}</div>
          <div className="text-sm text-gray-600">Virtual Users</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{data.summary.overallThroughput.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Throughput (req/s)</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{data.summary.p95ResponseTime.toFixed(0)}ms</div>
          <div className="text-sm text-gray-600">95th Percentile</div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">📋 How to Use the HTML Report</h4>
        <p className="text-blue-800 mb-3">
          Click "Download HTML Report" to get a comprehensive, self-contained report with interactive charts and detailed analysis.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <p className="font-medium mb-2">🚀 Integration Options:</p>
            <ul className="space-y-1">
              <li>• Jenkins publishHTML plugin support</li>
              <li>• CI/CD pipeline integration ready</li>
              <li>• Self-contained HTML file</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">📈 Report Features:</p>
            <ul className="space-y-1">
              <li>• Interactive charts and graphs</li>
              <li>• Sortable performance tables</li>
              <li>• Detailed error analysis</li>
            </ul>
          </div>
        </div>
      </div>
        </>
      )}

      {activeView === 'advanced' && (
        <AdvancedInsightsPanel data={data} />
      )}

      {activeView === 'visualizations' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Advanced Visualizations</h2>
            <p className="text-gray-700">
              Explore your performance data with advanced visualization techniques including heatmaps, box plots, and correlation analysis.
            </p>
          </div>

          <HeatmapChart data={heatmapData} title="Response Time Heatmap Over Time" />

          <BoxPlotChart data={boxPlotData.slice(0, 10)} title="Response Time Distribution by Transaction" />

          <CorrelationMatrix
            correlations={correlations}
            metrics={metricNames}
            title="Performance Metrics Correlation Matrix"
          />
        </div>
      )}

    </div>
  );
};

export default ReportDashboard;