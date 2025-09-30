import React from 'react';
import { BarChart3, Filter, ToggleLeft, ToggleRight } from 'lucide-react';
import { ChartData } from '../types/jmeter';
import ResponseTimesChart from './charts/ResponseTimesChart';
import ThroughputChart from './charts/ThroughputChart';
import ErrorsChart from './charts/ErrorsChart';
import HitsChart from './charts/HitsChart';
import ScatterChart from './charts/ScatterChart';
import PercentilesChart from './charts/PercentilesChart';

interface ChartsSectionProps {
  chartData: ChartData;
  selectedTransactions: string[];
  onSelectedTransactionsChange: (transactions: string[]) => void;
  allTransactions: string[];
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ 
  chartData, 
  selectedTransactions, 
  onSelectedTransactionsChange, 
  allTransactions 
}) => {
  const [showTrendlines, setShowTrendlines] = React.useState(true);

  // Filter chart data based on selected transactions
  const filterDataByTransactions = (data: Array<{ x: number; y: number; label: string }>) => {
    return data.filter(point => selectedTransactions.includes(point.label));
  };

  const handleTransactionToggle = (transaction: string) => {
    if (selectedTransactions.includes(transaction)) {
      onSelectedTransactionsChange(selectedTransactions.filter(t => t !== transaction));
    } else {
      onSelectedTransactionsChange([...selectedTransactions, transaction]);
    }
  };

  const handleSelectAll = () => {
    onSelectedTransactionsChange(allTransactions);
  };

  const handleSelectNone = () => {
    onSelectedTransactionsChange([]);
  };

  // Calculate number of unique transactions
  const transactionCount = chartData.percentiles?.length || 0;
  
  // Dynamic layout based on transaction count
  const getTimeSeriesLayout = () => {
    if (transactionCount <= 2) return 'grid-cols-1'; // Single column for 1-2 transactions
    return 'grid-cols-1 lg:grid-cols-2'; // 2 columns for 3+ transactions
  };
  
  const getCorrelationLayout = () => {
    return 'grid-cols-1'; // Single column for maximum horizontal space
  };
  
  const getCorrelationGap = () => {
    return 'gap-12'; // Larger gaps for better spacing
  };
  
  const getCorrelationChartHeight = () => {
    return 600; // Larger height for better visibility
  };

  return (
    <div className="space-y-8">
      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-indigo-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Chart Filters</h3>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowTrendlines(!showTrendlines)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {showTrendlines ? (
                <ToggleRight className="h-5 w-5 text-indigo-500" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-gray-400" />
              )}
              <span>Show Trendlines</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Transactions ({selectedTransactions.length} of {allTransactions.length} selected)
            </span>
            <div className="space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Select All
              </button>
              <button
                onClick={handleSelectNone}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Select None
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {allTransactions.map(transaction => (
              <label key={transaction} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTransactions.includes(transaction)}
                  onChange={() => handleTransactionToggle(transaction)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="truncate" title={transaction}>{transaction}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      {/* Time-Series Charts */}
      <div className="flex items-center">
        <BarChart3 className="h-6 w-6 text-blue-500 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">Performance Over Time</h3>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          <strong>Time-Series Analysis:</strong> These charts show how your system performs over the duration of the test, 
          helping identify trends, spikes, and performance patterns over time.
          {transactionCount > 0 && (
            <span className="ml-2 font-medium">
              ({transactionCount} transaction{transactionCount !== 1 ? 's' : ''} analyzed)
            </span>
          )}
        </p>
      </div>

      <div className={`grid ${getTimeSeriesLayout()} gap-8`}>
        <ResponseTimesChart data={filterDataByTransactions(chartData.responseTimesOverTime)} />
        <ThroughputChart data={chartData.tpsOverTime} />
      </div>

      <div className={`grid ${getTimeSeriesLayout()} gap-8`}>
        <ErrorsChart data={chartData.errorsOverTime} />
        <HitsChart data={chartData.hitsOverTime} />
      </div>

      {/* Percentiles Chart */}
      {chartData.percentiles && chartData.percentiles.length > 0 && (
        <div className="mt-8">
          <PercentilesChart 
            data={chartData.percentiles.filter(p => selectedTransactions.includes(p.label))} 
          />
        </div>
      )}

      {/* Performance Correlation Analysis */}
      <div className="mt-8">
        <div className="flex items-center mb-6">
          <BarChart3 className="h-6 w-6 text-purple-500 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Performance Correlation Analysis</h3>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <p className="text-purple-800 text-sm">
            <strong>Correlation Analysis:</strong> These scatter charts reveal relationships between different performance metrics, 
            helping identify patterns and performance bottlenecks.
            {transactionCount > 0 && (
              <span className="ml-2 font-medium">
                Layout optimized for {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}.
              </span>
            )}
          </p>
        </div>
        
        <div className={`grid ${getCorrelationLayout()} ${getCorrelationGap()}`}>
          <ScatterChart 
            data={filterDataByTransactions(chartData.throughputVsResponseTime)}
            title="Throughput vs Response Time"
            xAxisLabel="Throughput (req/s)"
            yAxisLabel="Response Time (ms)"
            height={getCorrelationChartHeight()}
            trendlineData={chartData.throughputVsResponseTimeTrend}
            showTrendline={showTrendlines}
          />
          <ScatterChart 
            data={filterDataByTransactions(chartData.usersVsResponseTime)}
            title="Users vs Response Time"
            xAxisLabel="Active Users"
            yAxisLabel="Response Time (ms)"
            height={getCorrelationChartHeight()}
            trendlineData={chartData.usersVsResponseTimeTrend}
            showTrendline={showTrendlines}
          />
          <ScatterChart 
            data={filterDataByTransactions(chartData.errorsVsUsers)}
            title="Errors vs Users"
            xAxisLabel="Active Users"
            yAxisLabel="Response Time (ms)"
            height={getCorrelationChartHeight()}
            trendlineData={chartData.errorsVsUsersTrend}
            showTrendline={showTrendlines}
          />
          <ScatterChart 
            data={filterDataByTransactions(chartData.errorsVsResponseTime)}
            title="Errors vs Response Time"
            xAxisLabel="Response Time (ms)"
            yAxisLabel="Active Users"
            height={getCorrelationChartHeight()}
            trendlineData={chartData.errorsVsResponseTimeTrend}
            showTrendline={showTrendlines}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;