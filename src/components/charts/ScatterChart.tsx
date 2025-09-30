import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-plugin-trendline';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register plugins
Chart.register(annotationPlugin);

interface ScatterChartProps {
  data: Array<{ x: number; y: number; label: string; density?: number }>;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showTrendline?: boolean;
  annotations?: any[];
  useDensityVisualization?: boolean;
}

const ScatterChart: React.FC<ScatterChartProps> = ({ 
  data, 
  title = 'Throughput vs Response Time',
  xAxisLabel = 'Throughput (req/s)',
  yAxisLabel = 'Response Time (ms)',
  showTrendline = false,
  annotations = [],
  useDensityVisualization = false
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

    // Color scale function for density visualization
    const getDensityColor = (density: number = 0.5, baseHue: number) => {
      const intensity = Math.max(0.3, density); // Minimum visibility
      const alpha = 0.4 + (density * 0.6); // Variable transparency
      return `hsla(${baseHue}, 70%, ${50 + (intensity * 30)}%, ${alpha})`;
    };
    // Sort each group by x value for proper line connections
    const datasets = Object.entries(groupedData).map(([label, points], index) => ({
      label,
      data: points.sort((a, b) => a.x - b.x),
      backgroundColor: useDensityVisualization 
        ? points.map(point => getDensityColor(point.density, (index * 137.5) % 360))
        : `hsla(${(index * 137.5) % 360}, 70%, 50%, 0.6)`,
      borderColor: `hsl(${(index * 137.5) % 360}, 70%, 40%)`,
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      pointRadius: useDensityVisualization 
        ? points.map(point => 3 + ((point.density || 0.5) * 3))
        : 4,
      pointHoverRadius: 6,
      pointBackgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      pointBorderColor: `hsl(${(index * 137.5) % 360}, 70%, 30%)`,
      pointBorderWidth: 1,
      showLine: true,
      trendlineLinear: showTrendline ? {
        style: `hsl(${(index * 137.5) % 360}, 70%, 30%)`,
        lineStyle: 'solid',
        width: 2,
      } : undefined,
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
          annotation: {
            annotations: annotations.reduce((acc, annotation, index) => {
              acc[`annotation${index}`] = annotation;
              return acc;
            }, {} as any)
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return context[0].dataset.label || '';
              },
              label: function(context) {
                const densityInfo = useDensityVisualization && context.raw && (context.raw as any).density 
                  ? `, Density: ${((context.raw as any).density * 100).toFixed(1)}%` 
                  : '';
                return `${xAxisLabel}: ${context.parsed.x.toFixed(2)}, ${yAxisLabel}: ${context.parsed.y.toFixed(0)}${densityInfo}`;
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
  }, [data, title, xAxisLabel, yAxisLabel, showTrendline, annotations, useDensityVisualization]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div style={{ position: 'relative', height: '400px' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default ScatterChart;