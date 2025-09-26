import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface PercentilesChartProps {
  data: Array<{ 
    label: string; 
    p50: number; 
    p75: number; 
    p90: number; 
    p95: number; 
    p99: number; 
  }>;
}

const PercentilesChart: React.FC<PercentilesChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = data.map(d => d.label);

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'p50',
            data: data.map(d => d.p50),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1,
          },
          {
            label: 'p75',
            data: data.map(d => d.p75),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
          },
          {
            label: 'p90',
            data: data.map(d => d.p90),
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderColor: 'rgb(245, 158, 11)',
            borderWidth: 1,
          },
          {
            label: 'p95',
            data: data.map(d => d.p95),
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderColor: 'rgb(249, 115, 22)',
            borderWidth: 1,
          },
          {
            label: 'p99',
            data: data.map(d => d.p99),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Transaction'
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
            text: 'Response Time Percentiles'
          },
          legend: {
            display: true,
            position: 'top'
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

export default PercentilesChart;