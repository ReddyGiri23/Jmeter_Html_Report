import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ScatterChartProps {
  data: Array<{ x: number; y: number; label: string }>;
}

const ScatterChart: React.FC<ScatterChartProps> = ({ data }) => {
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

    const datasets = Object.entries(groupedData).map(([label, points], index) => ({
      label,
      data: points,
      backgroundColor: `hsla(${(index * 137.5) % 360}, 70%, 50%, 0.6)`,
      borderColor: `hsl(${(index * 137.5) % 360}, 70%, 40%)`,
      pointRadius: 4,
      pointHoverRadius: 6,
    }));

    chartRef.current = new Chart(canvasRef.current, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Throughput (req/s)'
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
            text: 'Throughput vs Response Time'
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

export default ScatterChart;