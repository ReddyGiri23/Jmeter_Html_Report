import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

interface ErrorsByUserLoadChartProps {
  data: Array<{ activeUsers: number; errorRate: number; }>;
  maxErrorRateSLA?: number;
}

const ErrorsByUserLoadChart: React.FC<ErrorsByUserLoadChartProps> = ({ 
  data, 
  maxErrorRateSLA = 10 
}) => {
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
          label: 'Error Rate',
          data: sortedData.map(d => ({ x: d.activeUsers, y: d.errorRate })),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: 'rgb(185, 28, 28)',
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
              text: 'Error Rate (%)'
            },
            beginAtZero: true,
            max: Math.max(maxErrorRateSLA * 2, Math.max(...sortedData.map(d => d.errorRate)) * 1.2)
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Error Rate by User Load'
          },
          legend: {
            display: false
          },
          annotation: {
            annotations: {
              slaLine: {
                type: 'line',
                yMin: maxErrorRateSLA,
                yMax: maxErrorRateSLA,
                borderColor: 'rgb(220, 38, 38)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: `Max Error Rate SLA: ${maxErrorRateSLA}%`,
                  enabled: true,
                  position: 'end',
                  backgroundColor: 'rgba(220, 38, 38, 0.8)',
                  color: 'white',
                  font: {
                    size: 12
                  }
                }
              }
            }
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return `${context[0].parsed.x} Active Users`;
              },
              label: function(context) {
                return `Error Rate: ${context.parsed.y.toFixed(2)}%`;
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
  }, [data, maxErrorRateSLA]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div style={{ position: 'relative', height: '400px' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Analysis:</strong> Identify the user load at which errors begin to escalate. The red dashed line shows your SLA threshold.</p>
      </div>
    </div>
  );
};

export default ErrorsByUserLoadChart;