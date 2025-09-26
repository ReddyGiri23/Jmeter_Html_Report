import { JMeterData } from '../types/jmeter';

export const generateHTMLReport = (data: JMeterData): string => {
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JMeter Performance Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2563eb;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 1.2rem;
            margin-top: 10px;
        }
        
        .status-passed {
            background: #10b981;
            color: white;
        }
        
        .status-failed {
            background: #ef4444;
            color: white;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .card h2 {
            color: #1f2937;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .metric {
            text-align: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
        }
        
        .metric-label {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #1f2937;
        }
        
        .sla-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .sla-item {
            padding: 20px;
            border-radius: 8px;
            border: 2px solid;
        }
        
        .sla-passed {
            background: #f0fdf4;
            border-color: #10b981;
        }
        
        .sla-failed {
            background: #fef2f2;
            border-color: #ef4444;
        }
        
        .sla-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .sla-value {
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .sla-threshold {
            font-size: 0.9rem;
            color: #6b7280;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        th {
            background: #f8fafc;
            font-weight: bold;
            color: #374151;
        }
        
        tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .error-high {
            background: #fef2f2;
            color: #991b1b;
        }
        
        .error-medium {
            background: #fffbeb;
            color: #92400e;
        }
        
        .error-low {
            background: #f0fdf4;
            color: #166534;
        }
        
        .chart-container {
            position: relative;
            height: 400px;
            margin: 20px 0;
        }
        
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin: 30px 0;
        }
        
        .error-message {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        @media (max-width: 768px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .chart-container {
                height: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>JMeter Performance Test Report</h1>
            <p>Generated on ${formatDate(Date.now())}</p>
            <div class="status-badge ${data.slaResults.overallPassed ? 'status-passed' : 'status-failed'}">
                Test ${data.slaResults.overallPassed ? 'PASSED' : 'FAILED'}
            </div>
        </div>

        <!-- Test Summary -->
        <div class="card">
            <h2>Test Configuration Summary</h2>
            <div class="summary-grid">
                <div class="metric">
                    <div class="metric-label">Application Version</div>
                    <div class="metric-value">${data.summary.applicationVersion}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Test Environment</div>
                    <div class="metric-value">${data.summary.testEnvironment}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Test Duration</div>
                    <div class="metric-value">${formatDuration(data.summary.testDuration)}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Virtual Users</div>
                    <div class="metric-value">${data.summary.virtualUsers}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Total Requests</div>
                    <div class="metric-value">${data.summary.totalRequests.toLocaleString()}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Total Errors</div>
                    <div class="metric-value">${data.summary.totalErrors.toLocaleString()}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Throughput</div>
                    <div class="metric-value">${data.summary.overallThroughput.toFixed(2)} req/s</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Error Rate</div>
                    <div class="metric-value">${data.summary.errorRate.toFixed(2)}%</div>
                </div>
            </div>
        </div>

        <!-- SLA Status -->
        <div class="card">
            <h2>SLA Gates Status</h2>
            <div class="sla-grid">
                <div class="sla-item ${data.slaResults.p95ResponseTime.passed ? 'sla-passed' : 'sla-failed'}">
                    <div class="sla-title">95th Percentile Response Time</div>
                    <div class="sla-value">${data.slaResults.p95ResponseTime.value.toFixed(0)} ms</div>
                    <div class="sla-threshold">Threshold: ≤ ${data.slaResults.p95ResponseTime.threshold} ms</div>
                </div>
                <div class="sla-item ${data.slaResults.averageThroughput.passed ? 'sla-passed' : 'sla-failed'}">
                    <div class="sla-title">Average Throughput</div>
                    <div class="sla-value">${data.slaResults.averageThroughput.value.toFixed(2)} req/s</div>
                    <div class="sla-threshold">Threshold: ≥ ${data.slaResults.averageThroughput.threshold} req/s</div>
                </div>
                <div class="sla-item ${data.slaResults.errorRate.passed ? 'sla-passed' : 'sla-failed'}">
                    <div class="sla-title">Error Rate</div>
                    <div class="sla-value">${data.slaResults.errorRate.value.toFixed(2)}%</div>
                    <div class="sla-threshold">Threshold: ≤ ${data.slaResults.errorRate.threshold}%</div>
                </div>
            </div>
        </div>

        <!-- Aggregate Report -->
        <div class="card">
            <h2>Aggregate Report</h2>
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
                    ${data.transactions.map(transaction => `
                        <tr>
                            <td>${transaction.label}</td>
                            <td>${transaction.count.toLocaleString()}</td>
                            <td>${transaction.avgResponseTime.toFixed(0)}</td>
                            <td>${transaction.medianResponseTime.toFixed(0)}</td>
                            <td>${transaction.p95ResponseTime.toFixed(0)}</td>
                            <td>${transaction.maxResponseTime.toFixed(0)}</td>
                            <td>${transaction.errors.toLocaleString()}</td>
                            <td class="${transaction.errorRate > 10 ? 'error-high' : transaction.errorRate > 5 ? 'error-medium' : 'error-low'}">
                                ${transaction.errorRate.toFixed(2)}%
                            </td>
                            <td>${transaction.throughput.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Charts -->
        <div class="card">
            <h2>Performance Charts</h2>
            <div class="charts-grid">
                <div>
                    <h3>Response Times Over Time</h3>
                    <div class="chart-container">
                        <canvas id="responseTimesChart"></canvas>
                    </div>
                </div>
                <div>
                    <h3>Throughput Over Time</h3>
                    <div class="chart-container">
                        <canvas id="throughputChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="charts-grid">
                <div>
                    <h3>Errors Over Time</h3>
                    <div class="chart-container">
                        <canvas id="errorsChart"></canvas>
                    </div>
                </div>
                <div>
                    <h3>Response Time Percentiles</h3>
                    <div class="chart-container">
                        <canvas id="percentilesChart"></canvas>
                    </div>
                </div>
            </div>
            <div>
                <h3>Throughput vs Response Time</h3>
                <div class="chart-container">
                    <canvas id="scatterChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Error Report -->
        <div class="card">
            <h2>Error Report</h2>
            ${data.errorSamples.length === 0 ? `
                <div style="text-align: center; padding: 40px;">
                    <p style="color: #10b981; font-size: 1.2rem; font-weight: bold;">No Errors Found</p>
                    <p style="color: #6b7280;">All requests completed successfully!</p>
                </div>
            ` : `
                <p style="margin-bottom: 20px; color: #6b7280;">
                    Showing up to 50 failed samples for investigation. Found ${data.errorSamples.length} error${data.errorSamples.length !== 1 ? 's' : ''}.
                </p>
                <table>
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
                        ${data.errorSamples.map(error => `
                            <tr>
                                <td>${formatDate(error.timestamp)}</td>
                                <td>${error.label}</td>
                                <td>${error.responseTime.toFixed(0)} ms</td>
                                <td>${error.threadName}</td>
                                <td class="error-message" title="${error.responseMessage}">
                                    ${error.responseMessage || 'Unknown error'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
    </div>

    <script>
        // Chart data from server
        const chartData = ${JSON.stringify(data.chartData)};
        
        // Response Times Over Time Chart
        const responseTimesCtx = document.getElementById('responseTimesChart').getContext('2d');
        const groupedResponseTimes = chartData.responseTimesOverTime.reduce((acc, point) => {
            if (!acc[point.label]) {
                acc[point.label] = [];
            }
            acc[point.label].push({ x: point.x, y: point.y });
            return acc;
        }, {});

        const responseTimesDatasets = Object.entries(groupedResponseTimes).map(([label, points], index) => ({
            label,
            data: points,
            borderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 50%)\`,
            backgroundColor: \`hsl(\${(index * 137.5) % 360}, 70%, 90%)\`,
            fill: false,
            tension: 0.1,
            pointRadius: 2,
        }));

        new Chart(responseTimesCtx, {
            type: 'line',
            data: { datasets: responseTimesDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: { displayFormats: { millisecond: 'HH:mm:ss.SSS', second: 'HH:mm:ss', minute: 'HH:mm', hour: 'HH:mm' } }
                    },
                    y: { title: { display: true, text: 'Response Time (ms)' } }
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
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'time' },
                    y: { title: { display: true, text: 'Requests/sec' } }
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
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgb(239, 68, 68)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'time' },
                    y: { title: { display: true, text: 'Number of Errors' } }
                }
            }
        });

        // Percentiles Chart
        const percentilesCtx = document.getElementById('percentilesChart').getContext('2d');
        new Chart(percentilesCtx, {
            type: 'bar',
            data: {
                labels: chartData.percentiles.map(d => d.label),
                datasets: [
                    { label: 'p50', data: chartData.percentiles.map(d => d.p50), backgroundColor: 'rgba(34, 197, 94, 0.8)' },
                    { label: 'p75', data: chartData.percentiles.map(d => d.p75), backgroundColor: 'rgba(59, 130, 246, 0.8)' },
                    { label: 'p90', data: chartData.percentiles.map(d => d.p90), backgroundColor: 'rgba(245, 158, 11, 0.8)' },
                    { label: 'p95', data: chartData.percentiles.map(d => d.p95), backgroundColor: 'rgba(249, 115, 22, 0.8)' },
                    { label: 'p99', data: chartData.percentiles.map(d => d.p99), backgroundColor: 'rgba(239, 68, 68, 0.8)' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { title: { display: true, text: 'Response Time (ms)' } }
                }
            }
        });

        // Scatter Chart
        const scatterCtx = document.getElementById('scatterChart').getContext('2d');
        const groupedScatter = chartData.throughputVsResponseTime.reduce((acc, point) => {
            if (!acc[point.label]) {
                acc[point.label] = [];
            }
            acc[point.label].push({ x: point.x, y: point.y });
            return acc;
        }, {});

        const scatterDatasets = Object.entries(groupedScatter).map(([label, points], index) => ({
            label,
            data: points,
            backgroundColor: \`hsla(\${(index * 137.5) % 360}, 70%, 50%, 0.6)\`,
            borderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 40%)\`,
        }));

        new Chart(scatterCtx, {
            type: 'scatter',
            data: { datasets: scatterDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Throughput (req/s)' } },
                    y: { title: { display: true, text: 'Response Time (ms)' } }
                }
            }
        });
    </script>
</body>
</html>`;
};