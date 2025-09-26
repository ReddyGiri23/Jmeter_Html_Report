import React from 'react';
import { Clock, Users, Activity, AlertTriangle, Zap, Target } from 'lucide-react';
import { TestSummary } from '../types/jmeter';

interface TestSummaryCardProps {
  summary: TestSummary;
}

const TestSummaryCard: React.FC<TestSummaryCardProps> = ({ summary }) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Test Configuration Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Application Version</p>
              <p className="text-lg font-semibold">{summary.applicationVersion}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Test Environment</p>
              <p className="text-lg font-semibold">{summary.testEnvironment}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-indigo-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Test Duration</p>
              <p className="text-lg font-semibold">{formatDuration(summary.testDuration)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Virtual Users</p>
              <p className="text-lg font-semibold">{summary.virtualUsers}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-lg font-semibold">{summary.totalRequests.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total Errors</p>
              <p className="text-lg font-semibold">{summary.totalErrors.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Throughput</p>
            <p className="text-2xl font-bold text-blue-600">{summary.overallThroughput.toFixed(2)} req/s</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Avg Response Time</p>
            <p className="text-2xl font-bold text-green-600">{summary.avgResponseTime.toFixed(0)} ms</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">95th Percentile</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.p95ResponseTime.toFixed(0)} ms</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Error Rate</p>
            <p className="text-2xl font-bold text-red-600">{summary.errorRate.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Start Time: {formatDate(summary.startTime)}</span>
          <span>End Time: {formatDate(summary.endTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default TestSummaryCard;