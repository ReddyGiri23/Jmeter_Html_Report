import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ChartData } from '../types/jmeter';
import ResponseTimeByUserLoadChart from './charts/ResponseTimeByUserLoadChart';
import ThroughputByUserLoadChart from './charts/ThroughputByUserLoadChart';
import ErrorsByUserLoadChart from './charts/ErrorsByUserLoadChart';
import TimeBasedPercentilesChart from './charts/TimeBasedPercentilesChart';
import ScatterChart from './charts/ScatterChart';

interface ChartsSectionProps {
  chartData: ChartData;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ chartData }) => {
  // SLA thresholds (could be made configurable)
  const SLA_THRESHOLDS = {
    maxResponseTime: 4000, // ms
    maxErrorRate: 10, // %
  };

  // Annotations for correlation charts
  const getUsersVsResponseTimeAnnotations = () => [
    {
      type: 'line',
      yMin: SLA_THRESHOLDS.maxResponseTime,
      yMax: SLA_THRESHOLDS.maxResponseTime,
      borderColor: 'rgb(220, 38, 38)',
      borderWidth: 2,
      borderDash: [5, 5],
      label: {
        content: `Max Response Time SLA: ${SLA_THRESHOLDS.maxResponseTime}ms`,
        enabled: true,
        position: 'end',
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        color: 'white',
        font: { size: 12 }
      }
    }
  ];

  const getErrorsVsUsersAnnotations = () => [
    {
      type: 'line',
      yMin: SLA_THRESHOLDS.maxResponseTime,
      yMax: SLA_THRESHOLDS.maxResponseTime,
      borderColor: 'rgb(220, 38, 38)',
      borderWidth: 2,
      borderDash: [5, 5],
      label: {
        content: `Max Response Time: ${SLA_THRESHOLDS.maxResponseTime}ms`,
        enabled: true,
        position: 'end',
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        color: 'white',
        font: { size: 12 }
      }
    }
  ];
  return (
    <div className="space-y-8">
      {/* Load-Based Analysis Charts */}
      <div className="flex items-center">
        <TrendingUp className="h-6 w-6 text-blue-500 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">Load-Based Performance Analysis</h3>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          <strong>Load-Based Analysis:</strong> These charts show how your system performs as the number of active users increases, 
          helping identify capacity limits and scalability bottlenecks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ResponseTimeByUserLoadChart data={chartData.responseTimeByUserLoad} />
        <ThroughputByUserLoadChart data={chartData.throughputByUserLoad} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ErrorsByUserLoadChart 
          data={chartData.errorsByUserLoad} 
          maxErrorRateSLA={SLA_THRESHOLDS.maxErrorRate}
        />
        <TimeBasedPercentilesChart 
          data={chartData.timeBasedPercentiles}
          p95SLA={SLA_THRESHOLDS.maxResponseTime}
        />
      </div>

      {/* Performance Correlation Analysis */}
      <div className="mt-8">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-6 w-6 text-purple-500 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">Performance Correlation Analysis</h3>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <p className="text-purple-800 text-sm">
            <strong>Correlation Analysis:</strong> These scatter charts with trendlines reveal relationships between different performance metrics, 
            helping identify patterns and performance bottlenecks. Dense areas use color intensity to show data concentration.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ScatterChart 
            data={chartData.throughputVsResponseTimeWithDensity}
            title="Throughput vs Response Time"
            xAxisLabel="Throughput (req/s)"
            yAxisLabel="Response Time (ms)"
            showTrendline={true}
            useDensityVisualization={true}
          />
          <ScatterChart 
            data={chartData.usersVsResponseTimeWithDensity}
            title="Users vs Response Time"
            xAxisLabel="Active Users"
            yAxisLabel="Response Time (ms)"
            showTrendline={true}
            useDensityVisualization={true}
            annotations={getUsersVsResponseTimeAnnotations()}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <ScatterChart 
            data={chartData.errorsVsUsers}
            title="Errors vs Users"
            xAxisLabel="Active Users"
            yAxisLabel="Response Time (ms)"
            showTrendline={true}
            annotations={getErrorsVsUsersAnnotations()}
          />
          <ScatterChart 
            data={chartData.errorsVsResponseTime}
            title="Errors vs Response Time"
            xAxisLabel="Response Time (ms)"
            yAxisLabel="Active Users"
            showTrendline={true}
          />
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-gray-700">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-500" />
            <h4 className="text-lg font-medium mb-2">How to Interpret Correlation Charts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left">
              <div>
                <p className="font-medium mb-2">🎯 Trendlines:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Upward slope = positive correlation</li>
                  <li>• Downward slope = negative correlation</li>
                  <li>• Flat line = no correlation</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">🌈 Density Colors:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Brighter colors = more data points</li>
                  <li>• Darker areas = typical performance zone</li>
                  <li>• Scattered points = outliers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;