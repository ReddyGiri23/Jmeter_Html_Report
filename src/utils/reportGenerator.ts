import { JMeterData, TestSummary, ComparisonResult } from '../types/jmeter';

interface ComparisonData {
  current: TestSummary;
  previous: TestSummary;
  fileName: string;
  previousFileName: string;
}

export const generateHTMLReport = (data: JMeterData, comparison?: ComparisonData): string => {
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const groupErrorsByStatusCode = (errorSamples: any[]) => {
    return errorSamples.reduce((acc, error) => {
      const statusCode = error.responseCode || 'Unknown';
      if (!acc[statusCode]) acc[statusCode] = [];
      acc[statusCode].push(error);
      return acc;
    }, {} as Record<string, any[]>);
  };

  const getStatusCodeClass = (statusCode: string): string => {
    const code = parseInt(statusCode);
    if (code >= 400 && code < 500) return 'status-4xx';
    if (code >= 500) return 'status-5xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    return 'status-unknown';
  };

  const getStatusCodeDescription = (statusCode: string): string => {
    const descriptions: Record<string, string> = {
      '400': 'Bad Request',
      '401': 'Unauthorized',
      '403': 'Forbidden',
      '404': 'Not Found',
      '405': 'Method Not Allowed',
      '408': 'Request Timeout',
      '429': 'Too Many Requests',
      '500': 'Internal Server Error',
      '502': 'Bad Gateway',
      '503': 'Service Unavailable',
      '504': 'Gateway Timeout',
      'Unknown': 'Unknown Error'
    };
    return descriptions[statusCode] || `HTTP ${statusCode}`;
  };

  const generateDashboardTab = () => `
    <div id="dashboard" class="tab-content active">
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Test Configuration</h3>
          <div class="config-grid">
            <div class="config-item">
              <span class="label">Application Version:</span>
              <span class="value">${data.summary.applicationVersion}</span>
            </div>
            <div class="config-item">
              <span class="label">Test Environment:</span>
              <span class="value">${data.summary.testEnvironment}</span>
            </div>
            <div class="config-item">
              <span class="label">Test Duration:</span>
              <span class="value">${formatDuration(data.summary.testDuration)}</span>
            </div>
            <div class="config-item">
              <span class="label">Virtual Users:</span>
              <span class="value">${data.summary.virtualUsers}</span>
            </div>
            <div class="config-item">
              <span class="label">Total Requests:</span>
              <span class="value">${data.summary.totalRequests.toLocaleString()}</span>
            </div>
            <div class="config-item">
              <span class="label">Total Errors:</span>
              <span class="value">${data.summary.totalErrors.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <h3>SLA Gates Status</h3>
          <div class="sla-status ${data.slaResults.overallPassed ? 'passed' : 'failed'}">
            <div class="sla-overall">
              ${data.slaResults.overallPassed ? '✅ All SLAs Passed' : '❌ SLA Violations'}
            </div>
            <div class="sla-details">
              <div class="sla-item ${data.slaResults.p95ResponseTime.passed ? 'passed' : 'failed'}">
                <span>95th Percentile: ${data.slaResults.p95ResponseTime.value.toFixed(0)}ms</span>
                <span>(≤ ${data.slaResults.p95ResponseTime.threshold}ms)</span>
              </div>
              <div class="sla-item ${data.slaResults.averageThroughput.passed ? 'passed' : 'failed'}">
                <span>Throughput: ${data.slaResults.averageThroughput.value.toFixed(2)} req/s</span>
                <span>(≥ ${data.slaResults.averageThroughput.threshold} req/s)</span>
              </div>
              <div class="sla-item ${data.slaResults.errorRate.passed ? 'passed' : 'failed'}">
                <span>Error Rate: ${data.slaResults.errorRate.value.toFixed(2)}%</span>
                <span>(≤ ${data.slaResults.errorRate.threshold}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${data.summary.overallThroughput.toFixed(2)}</div>
          <div class="metric-label">Throughput (req/s)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.summary.avgResponseTime.toFixed(0)}</div>
          <div class="metric-label">Avg Response Time (ms)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.summary.p95ResponseTime.toFixed(0)}</div>
          <div class="metric-label">95th Percentile (ms)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.summary.errorRate.toFixed(2)}%</div>
          <div class="metric-label">Error Rate</div>
        </div>
      </div>

      <div class="aggregate-table">
        <h3>Aggregate Report</h3>
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Requests</th>
              <th>Avg (ms)</th>
              <th>Median (ms)</th>
              <th>95th % (ms)</th>
              <th>Max (ms)</th>
              <th>Errors</th>
              <th>Error %</th>
              <th>Throughput/sec</th>
            </tr>
          </thead>
          <tbody>
            ${data.transactions.map(t => `
              <tr>
                <td>${t.label}</td>
                <td>${t.count.toLocaleString()}</td>
                <td>${t.avgResponseTime.toFixed(0)}</td>
                <td>${t.medianResponseTime.toFixed(0)}</td>
                <td>${t.p95ResponseTime.toFixed(0)}</td>
                <td>${t.maxResponseTime.toFixed(0)}</td>
                <td>${t.errors.toLocaleString()}</td>
                <td class="${t.errorRate > 10 ? 'error-high' : t.errorRate > 5 ? 'error-medium' : 'error-low'}">${t.errorRate.toFixed(2)}%</td>
                <td>${t.throughput.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const generateGraphsTab = () => `
    <div id="graphs" class="tab-content">
      <div class="charts-grid">
        <!-- Time-Series Charts -->
        <div class="section-header">
          <h3 class="section-title">Performance Over Time</h3>
          <p class="section-description">These charts show how your system performs over the duration of the test, helping identify trends, spikes, and performance patterns over time.</p>
        </div>
        <div class="chart-container">
          <canvas id="responseTimesChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="throughputChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="errorsChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="hitsChart"></canvas>
        </div>
        
        <!-- Performance Correlation Analysis -->
        <div class="correlation-section full-width">
          <h3 class="correlation-title">Performance Correlation Analysis</h3>
          <p class="correlation-description">These scatter charts reveal relationships between different performance metrics, helping identify patterns and performance bottlenecks.</p>
          <div class="correlation-grid-large">
            <div class="chart-container">
              <canvas id="throughputVsResponseTimeChart"></canvas>
            </div>
            <div class="chart-container">
              <canvas id="usersVsResponseTimeChart"></canvas>
            </div>
            <div class="chart-container">
              <canvas id="errorsVsUsersChart"></canvas>
            </div>
            <div class="chart-container">
              <canvas id="errorsVsResponseTimeChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const generateErrorsTab = () => `
    <div id="errors" class="tab-content">
      <div class="error-summary">
        <h3>Error Report</h3>
        ${data.errorSamples.length === 0 ? `
          <div class="no-errors">
            <div class="success-icon">✅</div>
            <p>No Errors Found</p>
            <small>All requests completed successfully!</small>
          </div>
        ` : `
          <!-- Error Summary by Status Code -->
          <div class="error-status-summary">
            <h4>Error Summary by HTTP Status Code</h4>
            <div class="status-code-grid">
              ${Object.entries(data.errorCountsByStatusCode)
                .sort(([,a], [,b]) => b - a)
                .map(([statusCode, count]) => `
                  <div class="status-code-card ${getStatusCodeClass(statusCode)}">
                    <div class="status-code">${statusCode}</div>
                    <div class="error-count">${count} error${count !== 1 ? 's' : ''}</div>
                    <div class="status-description">${getStatusCodeDescription(statusCode)}</div>
                  </div>
                `).join('')}
            </div>
          </div>

          <div class="error-count">
            <span class="error-badge">${data.errorSamples.length} Error${data.errorSamples.length !== 1 ? 's' : ''} Found</span>
          </div>

          <!-- Errors Grouped by Status Code -->
          <div class="errors-by-status">
            ${Object.entries(groupErrorsByStatusCode(data.errorSamples))
              .sort(([,a], [,b]) => b.length - a.length)
              .map(([statusCode, errors]) => `
                <div class="status-group">
                  <h4 class="status-group-header ${getStatusCodeClass(statusCode)}">
                    <span class="status-code-badge">${statusCode}</span>
                    <span class="status-description">${getStatusCodeDescription(statusCode)}</span>
                    <span class="error-count-badge">${errors.length} error${errors.length !== 1 ? 's' : ''}</span>
                  </h4>
                  <table class="error-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Transaction</th>
                        <th>Response Time</th>
                        <th>Thread/User</th>
                        <th>Error Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${errors.map(error => `
                        <tr>
                          <td>${formatDate(error.timestamp)}</td>
                          <td>${error.label}</td>
                          <td>${error.responseTime.toFixed(0)} ms</td>
                          <td>${error.threadName}</td>
                          <td class="error-message">${error.responseMessage || 'Unknown error'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  const generateComparisonTab = (comparisonData: ComparisonData) => `
    <div id="comparison" class="tab-content">
      <div class="comparison-header">
        <h3>Performance Comparison</h3>
        <div class="comparison-files">
          <div class="file-info current">
            <h4>Current Test</h4>
            <p>${comparisonData.fileName}</p>
            <small>${comparisonData.current.totalRequests.toLocaleString()} requests, ${comparisonData.current.avgResponseTime.toFixed(0)}ms avg</small>
          </div>
          <div class="file-info previous">
            <h4>Previous Test</h4>
            <p>${comparisonData.previousFileName}</p>
            <small>${comparisonData.previous.totalRequests.toLocaleString()} requests, ${comparisonData.previous.avgResponseTime.toFixed(0)}ms avg</small>
          </div>
        </div>
      </div>
      
      <div class="comparison-metrics">
        <div class="metric-comparison">
          <h4>Overall Performance Comparison</h4>
          <div class="comparison-grid">
            <div class="comparison-item">
              <span class="metric-name">Average Response Time</span>
              <div class="comparison-values">
                <span class="current">${comparisonData.current.avgResponseTime.toFixed(0)}ms</span>
                <span class="vs">vs</span>
                <span class="previous">${comparisonData.previous.avgResponseTime.toFixed(0)}ms</span>
                <span class="change ${comparisonData.current.avgResponseTime < comparisonData.previous.avgResponseTime ? 'improvement' : 'regression'}">
                  ${((comparisonData.current.avgResponseTime - comparisonData.previous.avgResponseTime) / comparisonData.previous.avgResponseTime * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div class="comparison-item">
              <span class="metric-name">Throughput</span>
              <div class="comparison-values">
                <span class="current">${comparisonData.current.overallThroughput.toFixed(2)} req/s</span>
                <span class="vs">vs</span>
                <span class="previous">${comparisonData.previous.overallThroughput.toFixed(2)} req/s</span>
                <span class="change ${comparisonData.current.overallThroughput > comparisonData.previous.overallThroughput ? 'improvement' : 'regression'}">
                  ${((comparisonData.current.overallThroughput - comparisonData.previous.overallThroughput) / comparisonData.previous.overallThroughput * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div class="comparison-item">
              <span class="metric-name">Error Rate</span>
              <div class="comparison-values">
                <span class="current">${comparisonData.current.errorRate.toFixed(2)}%</span>
                <span class="vs">vs</span>
                <span class="previous">${comparisonData.previous.errorRate.toFixed(2)}%</span>
                <span class="change ${comparisonData.current.errorRate < comparisonData.previous.errorRate ? 'improvement' : 'regression'}">
                  ${((comparisonData.current.errorRate - comparisonData.previous.errorRate) / Math.max(comparisonData.previous.errorRate, 0.01) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const generateChartScripts = () => `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
    <script>
      // Chart data
      const chartData = ${JSON.stringify(data.chartData)};
      
      // Response Times Chart
      const responseTimesCtx = document.getElementById('responseTimesChart').getContext('2d');
      const groupedResponseTimes = chartData.responseTimesOverTime.reduce((acc, point) => {
        if (!acc[point.label]) acc[point.label] = [];
        acc[point.label].push({ x: point.x, y: point.y });
        return acc;
      }, {});
      
      new Chart(responseTimesCtx, {
        type: 'line',
        data: {
          datasets: Object.entries(groupedResponseTimes).map(([label, points], index) => ({
            label,
            data: points,
            borderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 50%)\`,
            backgroundColor: \`hsla(\${(index * 137.5) % 360}, 70%, 50%, 0.1)\`,
            fill: false,
            tension: 0.1,
            pointRadius: 2,
            pointHoverRadius: 4,
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              title: { display: true, text: 'Elapsed Time' }
            },
            y: { title: { display: true, text: 'Response Time (ms)' } }
          },
          plugins: {
            title: { display: true, text: 'Response Times Over Time' },
            legend: { display: true, position: 'top' }
          }
        }
      });
      
      // Throughput Chart
      const throughputCtx = document.getElementById('throughputChart').getContext('2d');
      new Chart(throughputCtx, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Throughput',
            data: chartData.tpsOverTime,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
              title: { display: true, text: 'Elapsed Time' }
            },
            y: { title: { display: true, text: 'Requests/sec' } }
          },
          plugins: {
            title: { display: true, text: 'Throughput Over Time' },
            legend: { display: false }
          }
        }
      });
      
      // Errors Chart
      const errorsCtx = document.getElementById('errorsChart').getContext('2d');
      new Chart(errorsCtx, {
        type: 'bar',
        data: {
          datasets: [{
            label: 'Errors',
            data: chartData.errorsOverTime,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 1,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              title: { display: true, text: 'Elapsed Time' }
            },
            y: { title: { display: true, text: 'Number of Errors' } }
          },
          plugins: {
            title: { display: true, text: 'Errors Over Time' },
            legend: { display: false }
          }
        }
      });
      
      // Hits Chart
      const hitsCtx = document.getElementById('hitsChart').getContext('2d');
      new Chart(hitsCtx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Hits/sec',
              data: chartData.hitsOverTime,
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.1,
              pointRadius: 2,
              pointHoverRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              title: { display: true, text: 'Elapsed Time' }
            },
            y: { title: { display: true, text: 'Hits/sec' } }
          },
          plugins: {
            title: { display: true, text: 'Hits Over Time' },
            legend: { display: false }
          }
        }
      });
      
      // Throughput vs Response Time Chart
      const throughputVsResponseTimeCtx = document.getElementById('throughputVsResponseTimeChart').getContext('2d');
      const groupedThroughputVsResponseTime = chartData.throughputVsResponseTime.reduce((acc, point) => {
        if (!acc[point.label]) acc[point.label] = [];
        acc[point.label].push({ x: point.x, y: point.y });
        return acc;
      }, {});
      
      new Chart(throughputVsResponseTimeCtx, {
        type: 'scatter',
        data: {
          datasets: Object.entries(groupedThroughputVsResponseTime).map(([label, points], index) => ({
            label,
            data: points,
            backgroundColor: \`hsla(\${(index * 137.5) % 360}, 70%, 50%, 0.6)\`,
            borderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 40%)\`,
            borderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: \`hsl(\${(index * 137.5) % 360}, 70%, 50%)\`,
            pointBorderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 30%)\`,
            pointBorderWidth: 1,
            showLine: false,
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: 'Throughput (req/s)' } },
            y: { title: { display: true, text: 'Response Time (ms)' } }
          },
          plugins: {
            title: { display: true, text: 'Throughput vs Response Time' }
          }
        }
      });
      
      // Users vs Response Time Chart
      const usersVsResponseTimeCtx = document.getElementById('usersVsResponseTimeChart').getContext('2d');
      const groupedUsersVsResponseTime = chartData.usersVsResponseTime.reduce((acc, point) => {
        if (!acc[point.label]) acc[point.label] = [];
        acc[point.label].push({ x: point.x, y: point.y });
        return acc;
      }, {});
      
      new Chart(usersVsResponseTimeCtx, {
        type: 'scatter',
        data: {
          datasets: Object.entries(groupedUsersVsResponseTime).map(([label, points], index) => ({
            label,
            data: points,
            backgroundColor: \`hsla(\${(index * 137.5) % 360}, 70%, 50%, 0.6)\`,
            borderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 40%)\`,
            borderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: \`hsl(\${(index * 137.5) % 360}, 70%, 50%)\`,
            pointBorderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 30%)\`,
            pointBorderWidth: 1,
            showLine: false,
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: 'Active Users' } },
            y: { title: { display: true, text: 'Response Time (ms)' } }
          },
          plugins: {
            title: { display: true, text: 'Users vs Response Time' }
          }
        }
      });
      
      // Errors vs Users Chart
      const errorsVsUsersCtx = document.getElementById('errorsVsUsersChart').getContext('2d');
      const groupedErrorsVsUsers = chartData.errorsVsUsers.reduce((acc, point) => {
        if (!acc[point.label]) acc[point.label] = [];
        acc[point.label].push({ x: point.x, y: point.y });
        return acc;
      }, {});
      
      new Chart(errorsVsUsersCtx, {
        type: 'scatter',
        data: {
          datasets: Object.entries(groupedErrorsVsUsers).map(([label, points], index) => ({
            label,
            data: points,
            backgroundColor: \`hsla(\${(index * 137.5) % 360}, 70%, 50%, 0.6)\`,
            borderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 40%)\`,
            borderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: \`hsl(\${(index * 137.5) % 360}, 70%, 50%)\`,
            pointBorderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 30%)\`,
            pointBorderWidth: 1,
            showLine: false,
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: 'Active Users' } },
            y: { title: { display: true, text: 'Response Time (ms)' } }
          },
          plugins: {
            title: { display: true, text: 'Errors vs Users' }
          }
        }
      });
      
      // Errors vs Response Time Chart
      const errorsVsResponseTimeCtx = document.getElementById('errorsVsResponseTimeChart').getContext('2d');
      const groupedErrorsVsResponseTime = chartData.errorsVsResponseTime.reduce((acc, point) => {
        if (!acc[point.label]) acc[point.label] = [];
        acc[point.label].push({ x: point.x, y: point.y });
        return acc;
      }, {});
      
      new Chart(errorsVsResponseTimeCtx, {
        type: 'scatter',
        data: {
          datasets: Object.entries(groupedErrorsVsResponseTime).map(([label, points], index) => ({
            label,
            data: points,
            backgroundColor: \`hsla(\${(index * 137.5) % 360}, 70%, 50%, 0.6)\`,
            borderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 40%)\`,
            borderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: \`hsl(\${(index * 137.5) % 360}, 70%, 50%)\`,
            pointBorderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 30%)\`,
            pointBorderWidth: 1,
            showLine: false,
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: 'Response Time (ms)' } },
            y: { title: { display: true, text: 'Active Users' } }
          },
          plugins: {
            title: { display: true, text: 'Errors vs Response Time' }
          }
        }
      });
    </script>
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JMeter Performance Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        
        .header h1 {
            color: #2563eb;
            margin-bottom: 10px;
            font-size: 2.5rem;
        }
        
        .header p {
            color: #666;
            font-size: 1.1rem;
        }
        
        .tabs {
            display: flex;
            background: white;
            border-radius: 10px 10px 0 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .tab {
            flex: 1;
            padding: 15px 20px;
            background: #f8f9fa;
            border: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
            border-right: 1px solid #e9ecef;
        }
        
        .tab:last-child {
            border-right: none;
        }
        
        .tab.active {
            background: #2563eb;
            color: white;
        }
        
        .tab:hover:not(.active) {
            background: #e9ecef;
        }
        
        .tab-content {
            display: none;
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            min-height: 600px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-left: 4px solid #2563eb;
        }
        
        .summary-card h3 {
            margin-bottom: 20px;
            color: #2563eb;
            font-size: 1.3rem;
        }
        
        .config-grid {
            display: grid;
            gap: 12px;
        }
        
        .config-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .config-item:last-child {
            border-bottom: none;
        }
        
        .label {
            font-weight: 500;
            color: #666;
        }
        
        .value {
            font-weight: 600;
            color: #333;
        }
        
        .sla-status {
            text-align: center;
        }
        
        .sla-overall {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
        }
        
        .sla-status.passed .sla-overall {
            background: #d1fae5;
            color: #065f46;
        }
        
        .sla-status.failed .sla-overall {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .sla-details {
            display: grid;
            gap: 10px;
        }
        
        .sla-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        
        .sla-item.passed {
            background: #d1fae5;
            color: #065f46;
        }
        
        .sla-item.failed {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .metric-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .aggregate-table {
            background: white;
        }
        
        .aggregate-table h3 {
            margin-bottom: 20px;
            color: #2563eb;
            font-size: 1.3rem;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .error-low { color: #28a745; font-weight: 600; }
        .error-medium { color: #ffc107; font-weight: 600; }
        .error-high { color: #dc3545; font-weight: 600; }
        
        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            height: 500px;
        }
        
        .chart-container.full-width {
            grid-column: 1 / -1;
        }
        
        .correlation-section {
            margin-top: 40px;
        }
        
        .correlation-title {
            color: #7c3aed;
            margin-bottom: 20px;
            font-size: 1.3rem;
            font-weight: 600;
            display: flex;
            align-items: center;
        }
        
        .correlation-title::before {
            content: "📊";
            margin-right: 10px;
        }
        
        .section-header {
          grid-column: 1 / -1;
          margin-bottom: 20px;
        }
        
        .section-description {
          color: #6b7280;
          font-size: 0.9rem;
          margin-top: 5px;
        }
        
        .correlation-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .correlation-grid-large {
            display: grid;
            grid-template-columns: 1fr;
            gap: 40px;
        }
        
        .correlation-insights {
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        }
        
        .insights-content {
            text-align: center;
            color: #6b7280;
            padding: 20px;
        }
        
        .insights-content h4 {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #374151;
        }
        
        .insights-content p {
            font-size: 0.9rem;
            line-height: 1.5;
        }
        
        .no-errors {
            text-align: center;
            padding: 60px 20px;
            color: #28a745;
        }
        
        .success-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        .error-count {
            margin-bottom: 20px;
        }
        
        .error-badge {
            background: #dc3545;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
        }
        
        .error-table {
            margin-top: 20px;
        }
        
        .error-message {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .comparison-header {
            margin-bottom: 30px;
        }
        
        .comparison-header h3 {
            color: #2563eb;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }
        
        .comparison-files {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .file-info {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .file-info.current {
            background: #e0f2fe;
            border-left: 4px solid #0277bd;
        }
        
        .file-info.previous {
            background: #fff3e0;
            border-left: 4px solid #f57c00;
        }
        
        .file-info h4 {
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .file-info p {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .comparison-metrics {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
        }
        
        .comparison-grid {
            display: grid;
            gap: 20px;
        }
        
        .comparison-item {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .metric-name {
            display: block;
            font-weight: 600;
            margin-bottom: 10px;
            color: #495057;
        }
        
        .comparison-values {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .current {
            font-weight: 600;
            color: #0277bd;
        }
        
        .previous {
            font-weight: 600;
            color: #f57c00;
        }
        
        .vs {
            color: #666;
            font-size: 0.9rem;
        }
        
        .change {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .change.improvement {
            background: #d1fae5;
            color: #065f46;
        }
        
        .change.regression {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .error-status-summary {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .error-status-summary h4 {
          margin-bottom: 15px;
          color: #495057;
          font-size: 1.1rem;
        }
        
        .status-code-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .correlation-description {
          color: #7c3aed;
          font-size: 0.9rem;
          margin-bottom: 20px;
        }
        
        .status-code-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          border-left: 4px solid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .status-code-card.status-4xx {
          border-left-color: #f59e0b;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        }
        
        .status-code-card.status-5xx {
          border-left-color: #ef4444;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        }
        
        .status-code-card.status-3xx {
          border-left-color: #3b82f6;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }
        
        .status-code-card.status-unknown {
          border-left-color: #6b7280;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        }
        
        .status-code {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .status-code-card .error-count {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .status-description {
          font-size: 0.85rem;
          color: #6b7280;
        }
        
        .errors-by-status {
          margin-top: 30px;
        }
        
        .status-group {
          margin-bottom: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .status-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .status-group-header.status-4xx {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
        }
        
        .status-group-header.status-5xx {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #991b1b;
        }
        
        .status-group-header.status-3xx {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
        }
        
        .status-group-header.status-unknown {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          color: #374151;
        }
        
        .status-code-badge {
          font-size: 1.2rem;
          font-weight: 700;
        }
        
        .error-count-badge {
          background: rgba(255,255,255,0.8);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .status-group .error-table {
          margin: 0;
          border-radius: 0;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .summary-grid,
            .comparison-files {
                grid-template-columns: 1fr;
            }
            
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .correlation-grid {
                grid-template-columns: 1fr;
            }
            
            .correlation-grid-large {
                grid-template-columns: 1fr;
            }
            
            .tabs {
                flex-direction: column;
            }
            
            .tab {
                border-right: none;
                border-bottom: 1px solid #e9ecef;
            }
            
            .tab:last-child {
                border-bottom: none;
            }
          
          .status-code-grid {
            grid-template-columns: 1fr;
          }
          
          .status-group-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>JMeter Performance Report</h1>
            <p>Generated on ${formatDate(Date.now())}</p>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('dashboard')">Dashboard</button>
            <button class="tab" onclick="showTab('graphs')">Graphs</button>
            <button class="tab" onclick="showTab('errors')">Error Report</button>
            ${comparison ? '<button class="tab" onclick="showTab(\'comparison\')">Comparison</button>' : ''}
        </div>
        
        ${generateDashboardTab()}
        ${generateGraphsTab()}
        ${generateErrorsTab()}
        ${comparison ? generateComparisonTab(comparison) : ''}
    </div>
    
    <script>
        function showTab(tabName) {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all tabs
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }
    </script>
    
    ${generateChartScripts()}
</body>
</html>
  `;
};