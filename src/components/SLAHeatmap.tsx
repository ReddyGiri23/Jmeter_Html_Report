import React from 'react';
import { Target, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { JMeterData } from '../types/jmeter';

interface SLAHeatmapProps {
  data: JMeterData;
}

interface SLAMetric {
  name: string;
  key: keyof Pick<any, 'avgResponseTime' | 'throughput' | 'errorRate'>;
  threshold: number;
  unit: string;
  isInverse: boolean; // true if lower values are better
}

const SLAHeatmap: React.FC<SLAHeatmapProps> = ({ data }) => {
  const slaMetrics: SLAMetric[] = [
    {
      name: 'Avg Response Time',
      key: 'avgResponseTime',
      threshold: data.slaResults.avgResponseTime.threshold,
      unit: 'ms',
      isInverse: true
    },
    {
      name: 'Throughput',
      key: 'throughput',
      threshold: data.slaResults.averageThroughput.threshold,
      unit: 'req/s',
      isInverse: false
    },
    {
      name: 'Error Rate',
      key: 'errorRate',
      threshold: data.slaResults.errorRate.threshold,
      unit: '%',
      isInverse: true
    }
  ];

  const getSLAStatus = (value: number, metric: SLAMetric): 'pass' | 'fail' => {
    if (metric.isInverse) {
      return value <= metric.threshold ? 'pass' : 'fail';
    } else {
      return value >= metric.threshold ? 'pass' : 'fail';
    }
  };

  const getCellClass = (status: 'pass' | 'fail'): string => {
    return status === 'pass' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'ms' || unit === '%') {
      return `${value.toFixed(1)}${unit}`;
    }
    return `${value.toFixed(3)}${unit}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <Target className="h-6 w-6 text-purple-500 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">SLA Compliance Heatmap</h3>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        <p>Visual overview of SLA compliance across all transactions. Green indicates passing, red indicates failing.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              {slaMetrics.map((metric) => (
                <th key={metric.key} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col items-center">
                    <span>{metric.name}</span>
                    <span className="text-xs text-gray-400 mt-1">
                      {metric.isInverse ? '≤' : '≥'} {formatValue(metric.threshold, metric.unit)}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Overall Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.transactions.map((transaction, index) => {
              const slaStatuses = slaMetrics.map(metric => {
                const value = transaction[metric.key as keyof typeof transaction] as number;
                return getSLAStatus(value, metric);
              });
              
              const overallStatus = slaStatuses.every(status => status === 'pass') ? 'pass' : 'fail';

              return (
                <tr key={transaction.label} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.label}
                  </td>
                  {slaMetrics.map((metric, metricIndex) => {
                    const value = transaction[metric.key as keyof typeof transaction] as number;
                    const status = slaStatuses[metricIndex];
                    
                    return (
                      <td key={metric.key} className="px-4 py-4 whitespace-nowrap text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCellClass(status)}`}>
                          {status === 'pass' ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          {formatValue(value, metric.unit)}
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCellClass(overallStatus)}`}>
                      {overallStatus === 'pass' ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-1" />
                      )}
                      {overallStatus.toUpperCase()}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {data.transactions.filter(t => 
              slaMetrics.every(metric => {
                const value = t[metric.key as keyof typeof t] as number;
                return getSLAStatus(value, metric) === 'pass';
              })
            ).length}
          </div>
          <div className="text-sm text-green-800">Transactions Passing All SLAs</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {data.transactions.filter(t => 
              slaMetrics.some(metric => {
                const value = t[metric.key as keyof typeof t] as number;
                return getSLAStatus(value, metric) === 'fail';
              })
            ).length}
          </div>
          <div className="text-sm text-red-800">Transactions Failing SLAs</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {((data.transactions.filter(t => 
              slaMetrics.every(metric => {
                const value = t[metric.key as keyof typeof t] as number;
                return getSLAStatus(value, metric) === 'pass';
              })
            ).length / data.transactions.length) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-blue-800">Overall SLA Compliance</div>
        </div>
      </div>
    </div>
  );
};

export default SLAHeatmap;