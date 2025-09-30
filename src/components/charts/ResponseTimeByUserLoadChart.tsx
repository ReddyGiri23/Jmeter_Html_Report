import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

interface ResponseTimeByUserLoadChartProps {
  data: Array<{ activeUsers: number; medianResponseTime: number; label?: string; }>;
}

const ResponseTimeByUserLoadChart: React.FC<ResponseTimeByUserLoadChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [visibleDatasets, setVisibleDatasets] = useState<Set<string>>(new Set(['aggregate']));

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Separate aggregate and transaction-specific data
    const aggregateData = data.filter(d => !d.label).sort((a, b) => a.activeUsers - b.activeUsers);
    const transactionData = data.filter(d => d.label);

    // Group transaction data by label
    const groupedTransactionData = transactionData.reduce((acc, point) => {
      if (!acc[point.label!]) {
        acc[point.label!] = [];
      }
      acc[point.label!].push({ x: point.activeUsers, y: point.medianResponseTime });
      return acc;
    }, {} as Record<string, Array<{ x: number; y: number }>>);

    // Create datasets
    const datasets = [];

    // Aggregate dataset (always visible by default)
    if (aggregateData.length > 0) {
      datasets.push({
        label: 'Aggregate Median',
        data: aggregateData.map(d => ({ x: d.activeUsers, y: d.medianResponseTime })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        hidden: !visibleDatasets.has('aggregate'),
      });
    }

    // Transaction-specific datasets
    Object.entries(groupedTransactionData).forEach(([label, points], index) => {
      datasets.push({
        label,
        data: points.sort((a, b) => a.x - b.x),
        borderColor: `hsl(${(index * 137.5 + 60) % 360}, 70%, 50%)`,
        backgroundColor: `hsla(${(index * 137.5 + 60) % 360}, 70%, 50%, 0.1)`,
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
        hidden: !visibleDatasets.has(label),
      });
    });

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Active Users'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Median Response Time (ms)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Response Time by User Load'
          },
          legend: {
            display: true,
            position: 'top',
            onClick: (e, legendItem) => {
              const datasetLabel = legendItem.text;
              const newVisibleDatasets = new Set(visibleDatasets);
              
              if (visibleDatasets.has(datasetLabel)) {
                newVisibleDatasets.delete(datasetLabel);
              } else {
                newVisibleDatasets.add(datasetLabel);
              }
              
              setVisibleDatasets(newVisibleDatasets);
            }
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return context[0].dataset.label || '';
              },
              label: function(context) {
                return `Users: ${context.parsed.x}, Response Time: ${context.parsed.y.toFixed(0)}ms`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, visibleDatasets]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div style={{ position: 'relative', height: '400px' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Tip:</strong> Click on legend items to toggle individual transaction lines on/off. The aggregate median shows overall system performance.</p>
      </div>
    </div>
  );
};

export default ResponseTimeByUserLoadChart;