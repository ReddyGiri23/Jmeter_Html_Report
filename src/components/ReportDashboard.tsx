import React from 'react';
import { RefreshCcw, Download, CheckCircle, XCircle, FileText, BarChart3, AlertTriangle } from 'lucide-react';
import { JMeterData } from '../types/jmeter';
import { generateHTMLReport } from '../utils/reportGenerator';
import TestSummaryCard from './TestSummaryCard';
import SLAStatusCard from './SLAStatusCard';
import AggregateTable from './AggregateTable';
import ChartsSection from './ChartsSection';
import ErrorReportSection from './ErrorReportSection';
import SLAHeatmap from './SLAHeatmap';

interface ReportDashboardProps {
  data: JMeterData;
  onReset: () => void;
  selectedTransactions: string[];
  onSelectedTransactionsChange: (transactions: string[]) => void;
  activeErrorTransaction: string | null;
  onTransactionErrorClick: (transactionLabel: string) => void;
  activeTab: 'dashboard' | 'charts' | 'errors';
  onTabChange: (tab: 'dashboard' | 'charts' | 'errors') => void;
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ 
  data, 
  onReset, 
  selectedTransactions, 
  onSelectedTransactionsChange, 
  activeErrorTransaction, 
  onTransactionErrorClick,
  activeTab,
  onTabChange
}) => {
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

  return (
    <div className="space-y-8">
      {/* Header with Test Status */}
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

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg shadow-md p-1 flex">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('charts')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'charts'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Charts
          </button>
          <button
            onClick={() => onTabChange('errors')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'errors'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Errors ({data.errorSamples.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <TestSummaryCard summary={data.summary} />
          <SLAStatusCard slaResults={data.slaResults} />
          <SLAHeatmap data={data} />
          <AggregateTable 
            transactions={data.transactions} 
            onTransactionErrorClick={onTransactionErrorClick}
          />
        </div>
      )}

      {activeTab === 'charts' && (
        <ChartsSection 
          chartData={data.chartData} 
          selectedTransactions={selectedTransactions}
          onSelectedTransactionsChange={onSelectedTransactionsChange}
          allTransactions={data.transactions.map(t => t.label)}
        />
      )}

      {activeTab === 'errors' && (
        <ErrorReportSection 
          errorSamples={data.errorSamples} 
          highlightTransactionLabel={activeErrorTransaction}
        />
      )}

    </div>
  );
};

export default ReportDashboard;