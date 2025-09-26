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
        <ScatterChart data={chartData.throughputVsResponseTime} />
      </div>
    </div>
  );
};

export default ChartsSection;