import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ScatterChartProps {
  data: Array<{ x: number; y: number; label: string }>;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const ScatterChart: React.FC<ScatterChartProps> = ({ 
  data, 
  title = 'Throughput vs Response Time',
  xAxisLabel = 'Throughput (req/s)',
  yAxisLabel = 'Response Time (ms)'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Group data by label
    const groupedData = data.reduce((acc, point) => {
      if (!acc[point.label]) {
        acc[point.label] = [];
      }
      acc[point.label].push({ x: point.x, y: point.y });
      return acc;
    }, {} as Record<string, Array<{ x: number; y: number }>>);

    // Sort each group by x value for proper line connections
    const datasets = Object.entries(groupedData).map(([label, points], index) => ({
      label,
      data: points.sort((a, b) => a.x - b.x),
      backgroundColor: `hsla(${(index * 137.5) % 360}, 70%, 50%, 0.6)`,
      borderColor: `hsl(${(index * 137.5) % 360}, 70%, 40%)`,
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      pointBorderColor: `hsl(${(index * 137.5) % 360}, 70%, 30%)`,
      pointBorderWidth: 1,
      showLine: true,
    }));

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
              text: xAxisLabel
            }
          },
          y: {
            title: {
              display: true,
              text: yAxisLabel
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return context[0].dataset.label || '';
              },
              label: function(context) {
                return `${xAxisLabel}: ${context.parsed.x.toFixed(2)}, ${yAxisLabel}: ${context.parsed.y.toFixed(0)}`;
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
  }, [data, title, xAxisLabel, yAxisLabel]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div style={{ position: 'relative', height: '400px' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default ScatterChart;