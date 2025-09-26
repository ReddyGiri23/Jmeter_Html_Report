import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

interface ResponseTimesChartProps {
  data: Array<{ x: number; y: number; label: string }>;
}

const ResponseTimesChart: React.FC<ResponseTimesChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart
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

    const datasets = Object.entries(groupedData).map(([label, points], index) => ({
      label,
      data: points,
      borderColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 90%)`,
      fill: false,
      tension: 0.1,
      pointRadius: 2,
      pointHoverRadius: 4,
    }));

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              displayFormats: {
                millisecond: 'HH:mm:ss.SSS',
                second: 'HH:mm:ss',
                minute: 'HH:mm',
                hour: 'HH:mm'
              }
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Response Time (ms)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Response Times Over Time'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
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
    </div>
  );
};

export default ResponseTimesChart;