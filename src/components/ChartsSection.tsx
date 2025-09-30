import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ChartData } from '../types/jmeter';
import ResponseTimesChart from './charts/ResponseTimesChart';
import ThroughputChart from './charts/ThroughputChart';
import ErrorsChart from './charts/ErrorsChart';
import PercentilesChart from './charts/PercentilesChart';
import ScatterChart from './charts/ScatterChart';

interface ChartsSectionProps {
  chartData: ChartData;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ chartData }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <TrendingUp className="h-6 w-6 text-indigo-500 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">Performance Charts</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ResponseTimesChart data={chartData.responseTimesOverTime} />
        <ThroughputChart data={chartData.tpsOverTime} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ErrorsChart data={chartData.errorsOverTime} />
        <PercentilesChart data={chartData.percentiles} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <ScatterChart 
          data={chartData.throughputVsResponseTime}
          title="Throughput vs Response Time"
          xAxisLabel="Throughput (req/s)"
          yAxisLabel="Response Time (ms)"
        />
      </div>

      <div className="mt-8">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-6 w-6 text-purple-500 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Performance Correlation Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ScatterChart 
            data={chartData.usersVsResponseTime}
            title="Users vs Response Time"
            xAxisLabel="Active Users"
            yAxisLabel="Response Time (ms)"
          />
          <ScatterChart 
            data={chartData.errorsVsUsers}
            title="Errors vs Users"
            xAxisLabel="Active Users"
            yAxisLabel="Response Time (ms)"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <ScatterChart 
            data={chartData.errorsVsResponseTime}
            title="Errors vs Response Time"
            xAxisLabel="Response Time (ms)"
            yAxisLabel="Active Users"
          />
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h4 className="text-lg font-medium mb-2">Correlation Insights</h4>
              <p className="text-sm">
                Analyze the correlation patterns between users, response times, errors, and throughput 
                to identify performance bottlenecks and optimization opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;