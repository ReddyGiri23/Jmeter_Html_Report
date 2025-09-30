import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, FileText, RefreshCcw, Download } from 'lucide-react';
import { ComparisonResult, ComparisonMetrics } from '../types/jmeter';
import { generateHTMLReport } from '../utils/reportGenerator';

interface ComparisonDashboardProps {
  comparisonResult: ComparisonResult;
  onReset: () => void;
}

type SortField = keyof ComparisonMetrics['changes'] | 'label' | 'currentCount';
type SortDirection = 'asc' | 'desc';

const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({ comparisonResult, onReset }) => {
  const [sortField, setSortField] = useState<SortField>('currentCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleDownloadComparisonReport = () => {
    const htmlReport = generateHTMLReport(
      comparisonResult.currentTest.summary as any, // We'll need to reconstruct full data
      {
        current: comparisonResult.currentTest.summary as any,
        previous: comparisonResult.previousTest.summary as any,
        fileName: comparisonResult.currentTest.fileName,
        previousFileName: comparisonResult.previousTest.fileName
      }
    );
    const blob = new Blob([htmlReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jmeter-comparison-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedMetrics = [...comparisonResult.metrics].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    if (sortField === 'label') {
      aValue = a.label;
      bValue = b.label;
    } else if (sortField === 'currentCount') {
      aValue = a.current.count;
      bValue = b.current.count;
    } else {
      aValue = a.changes[sortField];
      bValue = b.changes[sortField];
    }

    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * multiplier;
    }
    
    return (Number(aValue) - Number(bValue)) * multiplier;
  });

  const getChangeIcon = (change: number, isInverse: boolean = false) => {
    const threshold = 5;
    const isImprovement = isInverse ? change < -threshold : change > threshold;
    const isRegression = isInverse ? change > threshold : change < -threshold;

    if (isImprovement) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (isRegression) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = (change: number, isInverse: boolean = false) => {
    const threshold = 5;
    const isImprovement = isInverse ? change < -threshold : change > threshold;
    const isRegression = isInverse ? change > threshold : change < -threshold;

    if (isImprovement) return 'text-green-600 bg-green-50';
    if (isRegression) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status: ComparisonMetrics['status']) => {
    switch (status) {
      case 'improvement':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'regression':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-400" />;
    }
  };

  const getOverallStatusColor = (status: ComparisonResult['overallStatus']) => {
    switch (status) {
      case 'improvement':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'regression':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Performance Comparison</h2>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadComparisonReport}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download HTML Report
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            New Comparison
          </button>
        </div>
      </div>

      {/* Overall Status Card */}
      <div className={`border-2 rounded-lg p-6 ${getOverallStatusColor(comparisonResult.overallStatus)}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Overall Comparison Status</h3>
          <div className="flex items-center space-x-2">
            {comparisonResult.overallStatus === 'improvement' && <TrendingUp className="h-6 w-6" />}
            {comparisonResult.overallStatus === 'regression' && <TrendingDown className="h-6 w-6" />}
            {comparisonResult.overallStatus === 'mixed' && <AlertTriangle className="h-6 w-6" />}
            <span className="font-semibold capitalize">{comparisonResult.overallStatus}</span>
          </div>
        </div>
        <p className="text-sm mb-4">{comparisonResult.insights.summary}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Current Test</h4>
            <p className="text-sm font-medium">{comparisonResult.currentTest.fileName}</p>
            <p className="text-xs text-gray-600">
              {comparisonResult.currentTest.summary.totalRequests.toLocaleString()} requests, 
              {comparisonResult.currentTest.summary.avgResponseTime.toFixed(0)}ms avg
            </p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Previous Test</h4>
            <p className="text-sm font-medium">{comparisonResult.previousTest.fileName}</p>
            <p className="text-xs text-gray-600">
              {comparisonResult.previousTest.summary.totalRequests.toLocaleString()} requests, 
              {comparisonResult.previousTest.summary.avgResponseTime.toFixed(0)}ms avg
            </p>
          </div>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Improvements */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Top Improvements</h3>
          </div>
          {comparisonResult.insights.topImprovements.length > 0 ? (
            <div className="space-y-3">
              {comparisonResult.insights.topImprovements.map((metric, _index) => (
                <div key={metric.label} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{metric.label}</p>
                    <p className="text-sm text-gray-600">
                      Avg RT: {metric.changes.avgResponseTime.toFixed(1)}% improvement
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No significant improvements found</p>
          )}
        </div>

        {/* Top Regressions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Top Regressions</h3>
          </div>
          {comparisonResult.insights.topRegressions.length > 0 ? (
            <div className="space-y-3">
              {comparisonResult.insights.topRegressions.map((metric, _index) => (
                <div key={metric.label} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{metric.label}</p>
                    <p className="text-sm text-gray-600">
                      Avg RT: {metric.changes.avgResponseTime.toFixed(1)}% regression
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No significant regressions found</p>
          )}
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-indigo-500 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Detailed Comparison</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('label')}
                >
                  Transaction
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avgResponseTime')}
                >
                  Avg Response Time
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('p90ResponseTime')}
                >
                  90th Percentile
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('throughput')}
                >
                  Throughput
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('errorRate')}
                >
                  Error Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMetrics.map((metric, index) => (
                <tr key={metric.label} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.label}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      {getStatusIcon(metric.status)}
                      <span className="ml-2 capitalize">{metric.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{metric.current.avgResponseTime.toFixed(0)}ms</span>
                        <span className="text-gray-400">vs {metric.previous.avgResponseTime.toFixed(0)}ms</span>
                      </div>
                      <div className={`flex items-center px-2 py-1 rounded text-xs ${getChangeColor(metric.changes.avgResponseTime, true)}`}>
                        {getChangeIcon(metric.changes.avgResponseTime, true)}
                        <span className="ml-1">{metric.changes.avgResponseTime.toFixed(1)}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{metric.current.p90ResponseTime.toFixed(0)}ms</span>
                        <span className="text-gray-400">vs {metric.previous.p90ResponseTime.toFixed(0)}ms</span>
                      </div>
                      <div className={`flex items-center px-2 py-1 rounded text-xs ${getChangeColor(metric.changes.p90ResponseTime, true)}`}>
                        {getChangeIcon(metric.changes.p90ResponseTime, true)}
                        <span className="ml-1">{metric.changes.p90ResponseTime.toFixed(1)}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{metric.current.throughput.toFixed(2)}/s</span>
                        <span className="text-gray-400">vs {metric.previous.throughput.toFixed(2)}/s</span>
                      </div>
                      <div className={`flex items-center px-2 py-1 rounded text-xs ${getChangeColor(metric.changes.throughput)}`}>
                        {getChangeIcon(metric.changes.throughput)}
                        <span className="ml-1">{metric.changes.throughput.toFixed(1)}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{metric.current.errorRate.toFixed(2)}%</span>
                        <span className="text-gray-400">vs {metric.previous.errorRate.toFixed(2)}%</span>
                      </div>
                      <div className={`flex items-center px-2 py-1 rounded text-xs ${getChangeColor(metric.changes.errorRate, true)}`}>
                        {getChangeIcon(metric.changes.errorRate, true)}
                        <span className="ml-1">{metric.changes.errorRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparisonDashboard;