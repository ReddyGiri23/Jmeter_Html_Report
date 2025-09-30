import React from 'react';
import { BarChart3 } from 'lucide-react';
import { ChartData } from '../types/jmeter';
import ResponseTimesChart from './charts/ResponseTimesChart';
import ThroughputChart from './charts/ThroughputChart';
import ErrorsChart from './charts/ErrorsChart';
import HitsChart from './charts/HitsChart';
import ScatterChart from './charts/ScatterChart';
import PercentilesChart from './charts/PercentilesChart';

interface ChartsSectionProps {
  chartData: ChartData;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ chartData }) => {
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
        <ResponseTimesChart data={chartData.responseTimesOverTime} />
        <ThroughputChart data={chartData.tpsOverTime} />
      </div>

      <div className={`grid ${getTimeSeriesLayout()} gap-8`}>
        <ErrorsChart data={chartData.errorsOverTime} />
        <HitsChart data={chartData.hitsOverTime} />
      </div>

      {/* Percentiles Chart */}
      {chartData.percentiles && chartData.percentiles.length > 0 && (
        <div className="mt-8">
          <PercentilesChart data={chartData.percentiles} />
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
            data={chartData.throughputVsResponseTime}
            title="Throughput vs Response Time"
            xAxisLabel="Throughput (req/s)"
            yAxisLabel="Response Time (ms)"
            height={getCorrelationChartHeight()}
          />
          <ScatterChart 
            data={chartData.usersVsResponseTime}
            title="Users vs Response Time"
            xAxisLabel="Active Users"
            yAxisLabel="Response Time (ms)"
            height={getCorrelationChartHeight()}
          />
          <ScatterChart 
            data={chartData.errorsVsUsers}
            title="Errors vs Users"
            xAxisLabel="Active Users"
            yAxisLabel="Response Time (ms)"
            height={getCorrelationChartHeight()}
          />
          <ScatterChart 
            data={chartData.errorsVsResponseTime}
            title="Errors vs Response Time"
            xAxisLabel="Response Time (ms)"
            yAxisLabel="Active Users"
            height={getCorrelationChartHeight()}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;