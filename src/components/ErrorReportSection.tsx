import React from 'react';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { ErrorSample } from '../types/jmeter';

interface ErrorReportSectionProps {
  errorSamples: ErrorSample[];
}

const ErrorReportSection: React.FC<ErrorReportSectionProps> = ({ errorSamples }) => {
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (errorSamples.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-green-500 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Error Report</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-green-500 mb-2">
            <AlertTriangle className="h-16 w-16 mx-auto opacity-50" />
          </div>
          <p className="text-lg font-medium text-green-600">No Errors Found</p>
          <p className="text-gray-500 mt-1">All requests completed successfully!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Error Report</h3>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          {errorSamples.length} Error{errorSamples.length !== 1 ? 's' : ''} Found
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing up to 50 failed samples for investigation. Review these errors to identify patterns and root causes.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Timestamp
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Thread/User
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error Message
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {errorSamples.map((error, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-red-50'}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTimestamp(error.timestamp)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {error.label}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {error.responseTime.toFixed(0)} ms
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {error.threadName}
                </td>
                <td className="px-4 py-4 text-sm text-red-600 max-w-xs truncate" title={error.responseMessage}>
                  {error.responseMessage || 'Unknown error'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errorSamples.length === 50 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Only the first 50 errors are shown. There may be additional errors in the complete dataset.
          </p>
        </div>
      )}
    </div>
  );
};

export default ErrorReportSection;