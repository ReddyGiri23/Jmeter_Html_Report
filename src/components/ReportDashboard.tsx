import React from 'react';
import { RefreshCcw, Download, CheckCircle, XCircle } from 'lucide-react';
import { JMeterData } from '../types/jmeter';
import TestSummaryCard from './TestSummaryCard';
import SLAStatusCard from './SLAStatusCard';
import AggregateTable from './AggregateTable';
import ChartsSection from './ChartsSection';
import ErrorReportSection from './ErrorReportSection';
import { generateHTMLReport } from '../utils/reportGenerator';

interface ReportDashboardProps {
  data: JMeterData;
  onReset: () => void;
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ data, onReset }) => {
  const handleDownloadReport = () => {
    const htmlReport = generateHTMLReport(data);
    const blob = new Blob([htmlReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jmeter-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
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
            <Download className="h-4 w-4 mr-2" />
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

      {/* Test Summary */}
      <TestSummaryCard summary={data.summary} />

      {/* SLA Status */}
      <SLAStatusCard slaResults={data.slaResults} />

      {/* Aggregate Report Table */}
      <AggregateTable transactions={data.transactions} />

      {/* Charts Section */}
      <ChartsSection chartData={data.chartData} />

      {/* Error Report */}
      <ErrorReportSection errorSamples={data.errorSamples} />
    </div>
  );
};

export default ReportDashboard;