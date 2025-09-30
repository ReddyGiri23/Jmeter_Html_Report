import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

interface TimeBasedPercentilesChartProps {
  data: Array<{ timestamp: number; p90: number; p95: number; p99: number; }>;
  p95SLA?: number;
}

const TimeBasedPercentilesChart: React.FC<TimeBasedPercentilesChartProps> = ({ 
  data, 
  p95SLA = 4000 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'P90',
            data: sortedData.map(d => ({ x: d.timestamp, y: d.p90 })),
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: 'P95',
            data: sortedData.map(d => ({ x: d.timestamp, y: d.p95 })),
            borderColor: 'rgb(249, 115, 22)',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            label: 'P99',
            data: sortedData.map(d => ({ x: d.timestamp, y: d.p99 })),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
          }
        ]
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
              text: 'Time Since Start'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Response Time (ms)'
            },
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Response Time Percentiles Over Time'
          },
          legend: {
            display: true,
            position: 'top'
          },
          annotation: {
            annotations: {
              targetZone: {
                type: 'box',
                yMin: 0,
                yMax: p95SLA * 0.8, // 80% of SLA as target
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderColor: 'rgba(34, 197, 94, 0.3)',
                borderWidth: 1,
                label: {
                  content: 'Target Performance Zone',
                  enabled: true,
                  position: 'start',
                  backgroundColor: 'rgba(34, 197, 94, 0.8)',
                  color: 'white',
                  font: {
                    size: 10
                  }
                }
              },
              slaZone: {
                type: 'box',
                yMin: p95SLA * 0.8,
                yMax: p95SLA,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                borderWidth: 1,
                label: {
                  content: 'Acceptable Zone',
                  enabled: true,
                  position: 'center',
                  backgroundColor: 'rgba(245, 158, 11, 0.8)',
                  color: 'white',
                  font: {
                    size: 10
                  }
                }
              },
              breachZone: {
                type: 'box',
                yMin: p95SLA,
                yMax: p95SLA * 2, // Extend beyond SLA
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                borderWidth: 1,
                label: {
                  content: 'SLA Breach Zone',
                  enabled: true,
                  position: 'end',
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  color: 'white',
                  font: {
                    size: 10
                  }
                }
              },
              slaLine: {
                type: 'line',
                yMin: p95SLA,
                yMax: p95SLA,
                borderColor: 'rgb(220, 38, 38)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: `P95 SLA: ${p95SLA}ms`,
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
                return new Date(context[0].parsed.x).toLocaleTimeString();
              },
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(0)}ms`;
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
  }, [data, p95SLA]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div style={{ position: 'relative', height: '400px' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Performance Zones:</strong> <span className="text-green-600">Green = Target Met</span>, <span className="text-yellow-600">Yellow = Acceptable</span>, <span className="text-red-600">Red = SLA Breached</span></p>
      </div>
    </div>
  );
};

export default TimeBasedPercentilesChart;