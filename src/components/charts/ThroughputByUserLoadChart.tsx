import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ThroughputByUserLoadChartProps {
  data: Array<{ activeUsers: number; throughput: number; }>;
}

const ThroughputByUserLoadChart: React.FC<ThroughputByUserLoadChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const sortedData = data.sort((a, b) => a.activeUsers - b.activeUsers);

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Throughput (Moving Average)',
          data: sortedData.map(d => ({ x: d.activeUsers, y: d.throughput })),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: 'rgb(21, 128, 61)',
          pointBorderWidth: 2,
        }]
      },
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
              text: 'Throughput (Requests/sec)'
            },
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Throughput by User Load'
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return `${context[0].parsed.x} Active Users`;
              },
              label: function(context) {
                return `Throughput: ${context.parsed.y.toFixed(2)} req/s`;
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
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div style={{ position: 'relative', height: '400px' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Analysis:</strong> Look for the "knee" where throughput plateaus or drops - this indicates your system's capacity limit. A moving average is applied to smooth out noise.</p>
      </div>
    </div>
  );
};

export default ThroughputByUserLoadChart;