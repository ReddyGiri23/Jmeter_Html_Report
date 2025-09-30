import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { SLAResult } from '../types/jmeter';

interface SLAStatusCardProps {
  slaResults: SLAResult;
}

const SLAStatusCard: React.FC<SLAStatusCardProps> = ({ slaResults }) => {
  const StatusIcon = ({ passed }: { passed: boolean }) => (
    passed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-6 w-6 text-orange-500 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">SLA Gates Status</h3>
        <div className="ml-auto flex items-center">
          {slaResults.overallPassed ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              All SLAs Passed
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <XCircle className="h-4 w-4 mr-1" />
              SLA Violations
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-4 rounded-lg border-2 ${
          slaResults.avgResponseTime.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Average Response Time</span>
            <StatusIcon passed={slaResults.avgResponseTime.passed} />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{slaResults.avgResponseTime.value.toFixed(0)} ms</p>
            <p className="text-sm text-gray-600">Threshold: ≤ {slaResults.avgResponseTime.threshold} ms</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg border-2 ${
          slaResults.averageThroughput.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Average Throughput</span>
            <StatusIcon passed={slaResults.averageThroughput.passed} />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{slaResults.averageThroughput.value.toFixed(2)} req/s</p>
            <p className="text-sm text-gray-600">Threshold: ≥ {(slaResults.averageThroughput.threshold * 3600).toFixed(0)} TPH</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg border-2 ${
          slaResults.errorRate.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Error Rate</span>
            <StatusIcon passed={slaResults.errorRate.passed} />
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{slaResults.errorRate.value.toFixed(2)}%</p>
            <p className="text-sm text-gray-600">Threshold: ≤ {slaResults.errorRate.threshold}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SLAStatusCard;