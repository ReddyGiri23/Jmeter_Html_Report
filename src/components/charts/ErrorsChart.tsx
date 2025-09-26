import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ErrorsChartProps {
  data: Array<{ x: number; y: number }>;
}

const ErrorsChart: React.FC<ErrorsChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        datasets: [{
          label: 'Errors',
          data: data,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        }]
      },
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
              text: 'Number of Errors'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Errors Over Time'
          },
          legend: {
            display: false
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
    </div>
  );
};

export default ErrorsChart;