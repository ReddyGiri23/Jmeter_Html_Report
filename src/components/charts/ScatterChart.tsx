import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface ScatterChartProps {
  data: Array<{ x: number; y: number; label: string }>;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  trendlineData?: { slope: number; intercept: number; rSquared: number } | null;
  showTrendline?: boolean;
  onExport?: () => void;
}

const ScatterChart: React.FC<ScatterChartProps> = ({ 
  data, 
  title = 'Scatter Chart',
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  height = 600,
  trendlineData = null,
  showTrendline = true,
  onExport
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const handleExport = () => {
    if (chartRef.current && onExport) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.png`;
      link.href = url;
      link.click();
    }
  };
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

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
      borderWidth: 1,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      pointBorderColor: `hsl(${(index * 137.5) % 360}, 70%, 30%)`,
      pointBorderWidth: 1,
      showLine: true,
      fill: false,
      tension: 0.1,
    }));

    // Add trendline dataset if available and enabled
    if (trendlineData && showTrendline && data.length > 0) {
      const xValues = data.map(d => d.x);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      
      const trendlinePoints = [
        { x: minX, y: trendlineData.slope * minX + trendlineData.intercept },
        { x: maxX, y: trendlineData.slope * maxX + trendlineData.intercept }
      ];

      datasets.push({
        label: `Trendline (R² = ${trendlineData.rSquared.toFixed(3)})`,
        data: trendlinePoints,
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderColor: 'rgba(255, 99, 132, 0.8)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        showLine: true,
        fill: false,
        borderDash: [5, 5],
      });
    }
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
  }, [data, title, xAxisLabel, yAxisLabel, trendlineData, showTrendline]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No data available for {title}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          📊 Export PNG
        </button>
      </div>
      <div style={{ position: 'relative', height: `${height}px` }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default ScatterChart;