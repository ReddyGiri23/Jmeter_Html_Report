import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface HitsChartProps {
  data: Array<{ x: number; y: number }>;
}

const HitsChart: React.FC<HitsChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Hits/sec',
          data: data,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.1,
          pointRadius: 2,
          pointHoverRadius: 4,
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
              text: 'Elapsed Time'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Hits/sec'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Hits Over Time'
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

export default HitsChart;