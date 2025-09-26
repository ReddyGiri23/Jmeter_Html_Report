import React, { useState } from 'react';
import { BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { TransactionMetrics } from '../types/jmeter';

interface AggregateTableProps {
  transactions: TransactionMetrics[];
}

type SortField = keyof TransactionMetrics;
type SortDirection = 'asc' | 'desc';

const AggregateTable: React.FC<AggregateTableProps> = ({ transactions }) => {
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * multiplier;
    }
    
    return (Number(aValue) - Number(bValue)) * multiplier;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <BarChart3 className="h-6 w-6 text-indigo-500 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">Aggregate Report</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="label">Transaction</SortableHeader>
              <SortableHeader field="count">Requests</SortableHeader>
              <SortableHeader field="avgResponseTime">Avg (ms)</SortableHeader>
              <SortableHeader field="medianResponseTime">Median (ms)</SortableHeader>
              <SortableHeader field="p95ResponseTime">95th % (ms)</SortableHeader>
              <SortableHeader field="maxResponseTime">Max (ms)</SortableHeader>
              <SortableHeader field="errors">Errors</SortableHeader>
              <SortableHeader field="errorRate">Error %</SortableHeader>
              <SortableHeader field="throughput">Throughput/sec</SortableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.map((transaction, index) => (
              <tr key={transaction.label} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {transaction.label}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.count.toLocaleString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.avgResponseTime.toFixed(0)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.medianResponseTime.toFixed(0)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.p95ResponseTime.toFixed(0)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.maxResponseTime.toFixed(0)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.errors.toLocaleString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.errorRate > 10 ? 'bg-red-100 text-red-800' :
                    transaction.errorRate > 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {transaction.errorRate.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.throughput.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AggregateTable;