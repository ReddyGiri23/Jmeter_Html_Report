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

  // Generate additional chart data for new graphs
  const generateExtendedChartData = () => {
    // Hits per second (same as TPS)
    const hitsPerSecond = data.chartData.tpsOverTime;

    // Error Rate over time
    const errorRateOverTime = data.chartData.errorsOverTime.map(point => ({
      x: point.x,
      y: data.chartData.tpsOverTime.find(tps => tps.x === point.x)?.y 
        ? (point.y / data.chartData.tpsOverTime.find(tps => tps.x === point.x)!.y) * 100 
        : 0
    }));

    // Users over time (from sample data)
    const usersOverTime = data.samples
      .filter((_, index) => index % Math.max(1, Math.floor(data.samples.length / 100)) === 0)
      .map(sample => ({
        x: sample.timeStamp,
        y: sample.allThreads
      }));

    // Errors vs Response Time
    const errorsVsResponseTime = data.samples
      .filter(sample => !sample.success)
      .map(sample => ({
        x: sample.elapsed,
        y: 1,
        label: sample.label
      }));

    // Users vs Response Time
    const usersVsResponseTime = data.samples
      .filter((_, index) => index % Math.max(1, Math.floor(data.samples.length / 200)) === 0)
      .map(sample => ({
        x: sample.allThreads,
        y: sample.elapsed,
        label: sample.label
      }));

    // Errors vs Users
    const errorsVsUsers = data.samples
      .filter(sample => !sample.success)
      .map(sample => ({
        x: sample.allThreads,
        y: 1,
        label: sample.label
      }));

    return {
      hitsPerSecond,
      errorRateOverTime,
      usersOverTime,
      errorsVsResponseTime,
      usersVsResponseTime,
      errorsVsUsers
    };
  };

  const extendedChartData = generateExtendedChartData();

  // Generate additional chart data for new graphs
  const generateExtendedChartData = () => {
    // Hits per second (same as TPS)
    const hitsPerSecond = data.chartData.tpsOverTime;

    // Error Rate over time
    const errorRateOverTime = data.chartData.errorsOverTime.map(point => ({
      x: point.x,
      y: data.chartData.tpsOverTime.find(tps => tps.x === point.x)?.y 
        ? (point.y / data.chartData.tpsOverTime.find(tps => tps.x === point.x)!.y) * 100 
        : 0
    }));

    // Users over time (from sample data)
    const usersOverTime = data.samples
      .filter((_, index) => index % Math.max(1, Math.floor(data.samples.length / 100)) === 0)
      .map(sample => ({
        x: sample.timeStamp,
        y: sample.allThreads
      }));

    // Errors vs Response Time
    const errorsVsResponseTime = data.samples
      .filter(sample => !sample.success)
      .map(sample => ({
        x: sample.elapsed,
        y: 1,
        label: sample.label
      }));

    // Users vs Response Time
    const usersVsResponseTime = data.samples
      .filter((_, index) => index % Math.max(1, Math.floor(data.samples.length / 200)) === 0)
      .map(sample => ({
        x: sample.allThreads,
        y: sample.elapsed,
        label: sample.label
      }));

    // Errors vs Users
    const errorsVsUsers = data.samples
      .filter(sample => !sample.success)
      .map(sample => ({
        x: sample.allThreads,
        y: 1,
        label: sample.label
      }));

    return {
      hitsPerSecond,
      errorRateOverTime,
      usersOverTime,
      errorsVsResponseTime,
      usersVsResponseTime,
      errorsVsUsers
    };
  };

  const extendedChartData = generateExtendedChartData();

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
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 250px;
            background: #2c3e50;
            color: white;
            padding: 20px 0;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
        }
        
        .sidebar h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #ecf0f1;
            font-size: 1.5rem;
        }
        
        .tab-button {
            display: block;
            width: 100%;
            padding: 15px 25px;
            background: none;
            border: none;
            color: #bdc3c7;
            text-align: left;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
            border-left: 4px solid transparent;
        }
        
        .tab-button:hover {
            background: #34495e;
            color: #ecf0f1;
            border-left-color: #3498db;
        }
        
        .tab-button.active {
            background: #34495e;
            color: #3498db;
            border-left-color: #3498db;
            font-weight: bold;
        }
        
        .main-content {
            margin-left: 250px;
            flex: 1;
            padding: 20px;
        }
        
        .header {
            text-align: center;
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
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 250px;
            background: #2c3e50;
            color: white;
            padding: 20px 0;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
        }
        
        .sidebar h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #ecf0f1;
            font-size: 1.5rem;
        }
        
        .tab-button {
            display: block;
            width: 100%;
            padding: 15px 25px;
            background: none;
            border: none;
            color: #bdc3c7;
            text-align: left;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
            border-left: 4px solid transparent;
        }
        
        .tab-button:hover {
            background: #34495e;
            color: #ecf0f1;
            border-left-color: #3498db;
        }
        
        .tab-button.active {
            background: #34495e;
            color: #3498db;
            border-left-color: #3498db;
            font-weight: bold;
        }
        
        .main-content {
            margin-left: 250px;
            flex: 1;
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
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
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
        
        .chart-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }
        
        .chart-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .error-message {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        @media (max-width: 768px) {
            .sidebar {
                width: 200px;
            }
            
            .main-content {
                margin-left: 200px;
            }
            
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .chart-container {
                height: 300px;
            }
        }
        
        @media (max-width: 600px) {
            .sidebar {
                width: 100%;
                height: auto;
                position: relative;
            }
            
            .main-content {
                margin-left: 0;
            }
            
            .tab-button {
                display: inline-block;
                width: auto;
                margin: 5px;
                border-radius: 5px;
            }
        }
        
        @media (max-width: 768px) {
            .sidebar {
                width: 200px;
            }
            
            .main-content {
                margin-left: 200px;
            }
            
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .chart-container {
                height: 300px;
            }
        }
        
        @media (max-width: 600px) {
            .sidebar {
                width: 100%;
                height: auto;
                position: relative;
            }
            
            .main-content {
                margin-left: 0;
            }
            
            .tab-button {
                display: inline-block;
                width: auto;
                margin: 5px;
                border-radius: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Sidebar -->
        <div class="sidebar">
            <h2>JMeter Report</h2>
            <button class="tab-button active" onclick="showTab('dashboard')">Dashboard</button>
            <button class="tab-button" onclick="showTab('graphs')">Graphs</button>
            <button class="tab-button" onclick="showTab('errors')">Error Report</button>
            <button class="tab-button" onclick="showTab('graphs')">Graphs</button>
            <button class="tab-button" onclick="showTab('errors')">Error Report</button>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="header">
                <h1>JMeter Performance Test Report</h1>
                <p>Generated on ${formatDate(Date.now())}</p>
                <div class="status-badge ${data.slaResults.overallPassed ? 'status-passed' : 'status-failed'}">
                    Test ${data.slaResults.overallPassed ? 'PASSED' : 'FAILED'}
                </div>
            </div>

            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-content active">
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
            </div>

            <!-- Graphs Tab -->
            <div id="graphs" class="tab-content">
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-title">Average Response Times Over Time</div>
                        <div class="chart-container">
                            <canvas id="avgResponseTimesChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Throughput Over Time</div>
                        <div class="chart-container">
                            <canvas id="throughputChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Error Rate Over Time</div>
                        <div class="chart-container">
                            <canvas id="errorRateChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Hits/Second Over Time</div>
                        <div class="chart-container">
                            <canvas id="hitsPerSecondChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Response Times vs Over Time</div>
                        <div class="chart-container">
                            <canvas id="responseTimesOverTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">TPS vs Over Time</div>
                        <div class="chart-container">
                            <canvas id="tpsOverTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Errors vs Response Time</div>
                        <div class="chart-container">
                            <canvas id="errorsVsResponseTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Throughput vs Response Time</div>
                        <div class="chart-container">
                            <canvas id="throughputVsResponseTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Users vs Response Time</div>
                        <div class="chart-container">
                            <canvas id="usersVsResponseTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Errors vs Users</div>
                        <div class="chart-container">
                            <canvas id="errorsVsUsersChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Report Tab -->
            <div id="errors" class="tab-content">
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
        <!-- Main Content -->
            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-content active">
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
                    maintainAspectRatio: false,
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
            </div>

            <!-- Graphs Tab -->
            <div id="graphs" class="tab-content">
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-title">Average Response Times Over Time</div>
                        <div class="chart-container">
                            <canvas id="avgResponseTimesChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Throughput Over Time</div>
                        <div class="chart-container">
                            <canvas id="throughputChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Error Rate Over Time</div>
                        <div class="chart-container">
                            <canvas id="errorRateChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Hits/Second Over Time</div>
                        <div class="chart-container">
                            <canvas id="hitsPerSecondChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Response Times vs Over Time</div>
                        <div class="chart-container">
                            <canvas id="responseTimesOverTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">TPS vs Over Time</div>
                        <div class="chart-container">
                            <canvas id="tpsOverTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Errors vs Response Time</div>
                        <div class="chart-container">
                            <canvas id="errorsVsResponseTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Throughput vs Response Time</div>
                        <div class="chart-container">
                            <canvas id="throughputVsResponseTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Users vs Response Time</div>
                        <div class="chart-container">
                            <canvas id="usersVsResponseTimeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-title">Errors vs Users</div>
                        <div class="chart-container">
                            <canvas id="errorsVsUsersChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Report Tab -->
            <div id="errors" class="tab-content">
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
        </div>
    </div>

    <script>
        // Tab switching functionality
        function showTab(tabName) {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all buttons
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(button => button.classList.remove('active'));
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
            
            // Initialize charts when graphs tab is shown
            if (tabName === 'graphs') {
                setTimeout(initializeCharts, 100);
            }
        }

        // Chart data from server
        const chartData = ${JSON.stringify(data.chartData)};
        const extendedChartData = ${JSON.stringify(extendedChartData)};
        
        let chartsInitialized = false;
        
        function initializeCharts() {
            if (chartsInitialized) return;
            chartsInitialized = true;
            
            // Average Response Times Over Time
            const avgResponseTimesCtx = document.getElementById('avgResponseTimesChart').getContext('2d');
            new Chart(avgResponseTimesCtx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Avg Response Time',
                        data: chartData.responseTimesOverTime,
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
                        y: { title: { display: true, text: 'Response Time (ms)' } }
                    }
                }
            });

            // Throughput Over Time
            const throughputCtx = document.getElementById('throughputChart').getContext('2d');
            new Chart(throughputCtx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Throughput',
                        data: chartData.tpsOverTime,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true,
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

            // Error Rate Over Time
            const errorRateCtx = document.getElementById('errorRateChart').getContext('2d');
            new Chart(errorRateCtx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Error Rate',
                        data: extendedChartData.errorRateOverTime,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' },
                        y: { title: { display: true, text: 'Error Rate (%)' } }
                    }
                }
            });

            // Hits/Second Over Time
            const hitsPerSecondCtx = document.getElementById('hitsPerSecondChart').getContext('2d');
            new Chart(hitsPerSecondCtx, {
                type: 'bar',
                data: {
                    datasets: [{
                        label: 'Hits/Second',
                        data: extendedChartData.hitsPerSecond,
                        backgroundColor: 'rgba(168, 85, 247, 0.8)',
                        borderColor: 'rgb(168, 85, 247)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' },
                        y: { title: { display: true, text: 'Hits/sec' } }
                    }
                }
            });

            // Response Times vs Over Time
            const responseTimesOverTimeCtx = document.getElementById('responseTimesOverTimeChart').getContext('2d');
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

            new Chart(responseTimesOverTimeCtx, {
                type: 'line',
                data: { datasets: responseTimesDatasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' },
                        y: { title: { display: true, text: 'Response Time (ms)' } }
                    }
                }
            });

            // TPS vs Over Time
            const tpsOverTimeCtx = document.getElementById('tpsOverTimeChart').getContext('2d');
            new Chart(tpsOverTimeCtx, {
                type: 'bar',
                data: {
                    datasets: [{
                        label: 'TPS',
                        data: chartData.tpsOverTime,
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderColor: 'rgb(245, 158, 11)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' },
                        y: { title: { display: true, text: 'Transactions/sec' } }
                    }
                }
            });

            // Errors vs Response Time
            const errorsVsResponseTimeCtx = document.getElementById('errorsVsResponseTimeChart').getContext('2d');
            new Chart(errorsVsResponseTimeCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Errors',
                        data: extendedChartData.errorsVsResponseTime,
                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                        borderColor: 'rgb(239, 68, 68)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Response Time (ms)' } },
                        y: { title: { display: true, text: 'Error Count' } }
                    }
                }
            });

            // Throughput vs Response Time
            const throughputVsResponseTimeCtx = document.getElementById('throughputVsResponseTimeChart').getContext('2d');
            new Chart(throughputVsResponseTimeCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Throughput vs Response Time',
                        data: chartData.throughputVsResponseTime,
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: 'rgb(34, 197, 94)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Throughput (req/s)' } },
                        y: { title: { display: true, text: 'Response Time (ms)' } }
                    }
                }
            });

            // Users vs Response Time
            const usersVsResponseTimeCtx = document.getElementById('usersVsResponseTimeChart').getContext('2d');
            new Chart(usersVsResponseTimeCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Users vs Response Time',
                        data: extendedChartData.usersVsResponseTime,
                        backgroundColor: 'rgba(168, 85, 247, 0.6)',
                        borderColor: 'rgb(168, 85, 247)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Users' } },
                        y: { title: { display: true, text: 'Response Time (ms)' } }
                    }
                }
            });

            // Errors vs Users
            const errorsVsUsersCtx = document.getElementById('errorsVsUsersChart').getContext('2d');
            new Chart(errorsVsUsersCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Errors vs Users',
                        data: extendedChartData.errorsVsUsers,
                        backgroundColor: 'rgba(249, 115, 22, 0.6)',
                        borderColor: 'rgb(249, 115, 22)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Users' } },
                        y: { title: { display: true, text: 'Error Count' } }
                    }
                }
            });
        }
    </script>
</body>
</html>`;
};

            const errorRateCtx = document.getElementById('errorRateChart').getContext('2d');
            new Chart(errorRateCtx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Error Rate',
                        data: extendedChartData.errorRateOverTime,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' },
                        y: { title: { display: true, text: 'Error Rate (%)' } }
                    }
                }
            });

            // Hits/Second Over Time
            const hitsPerSecondCtx = document.getElementById('hitsPerSecondChart').getContext('2d');
            new Chart(hitsPerSecondCtx, {
                type: 'bar',
                data: {
                    datasets: [{
                        label: 'Hits/Second',
                        data: extendedChartData.hitsPerSecond,
                        backgroundColor: 'rgba(168, 85, 247, 0.8)',
                        borderColor: 'rgb(168, 85, 247)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' },
                        y: { title: { display: true, text: 'Hits/sec' } }
                    }
                }
            });

            // Response Times vs Over Time
            const responseTimesOverTimeCtx = document.getElementById('responseTimesOverTimeChart').getContext('2d');
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

            new Chart(responseTimesOverTimeCtx, {
                type: 'line',
                data: { datasets: responseTimesDatasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' },
                        y: { title: { display: true, text: 'Response Time (ms)' } }
                    }
                }
            });

            // TPS vs Over Time
            const tpsOverTimeCtx = document.getElementById('tpsOverTimeChart').getContext('2d');
            new Chart(tpsOverTimeCtx, {
                type: 'bar',
                data: {
                    datasets: [{
                        label: 'TPS',
                        data: chartData.tpsOverTime,
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderColor: 'rgb(245, 158, 11)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time' },
                        y: { title: { display: true, text: 'Transactions/sec' } }
                    }
                }
            });

            // Errors vs Response Time
            const errorsVsResponseTimeCtx = document.getElementById('errorsVsResponseTimeChart').getContext('2d');
            new Chart(errorsVsResponseTimeCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Errors',
                        data: extendedChartData.errorsVsResponseTime,
                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                        borderColor: 'rgb(239, 68, 68)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Response Time (ms)' } },
                        y: { title: { display: true, text: 'Error Count' } }
                    }
                }
            });

            // Throughput vs Response Time
            const throughputVsResponseTimeCtx = document.getElementById('throughputVsResponseTimeChart').getContext('2d');
            new Chart(throughputVsResponseTimeCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Throughput vs Response Time',
                        data: chartData.throughputVsResponseTime,
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: 'rgb(34, 197, 94)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Throughput (req/s)' } },
                        y: { title: { display: true, text: 'Response Time (ms)' } }
                    }
                }
            });

            // Users vs Response Time
            const usersVsResponseTimeCtx = document.getElementById('usersVsResponseTimeChart').getContext('2d');
            new Chart(usersVsResponseTimeCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Users vs Response Time',
                        data: extendedChartData.usersVsResponseTime,
                        backgroundColor: 'rgba(168, 85, 247, 0.6)',
                        borderColor: 'rgb(168, 85, 247)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Users' } },
                        y: { title: { display: true, text: 'Response Time (ms)' } }
                    }
                }
            });

            // Errors vs Users
            const errorsVsUsersCtx = document.getElementById('errorsVsUsersChart').getContext('2d');
            new Chart(errorsVsUsersCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Errors vs Users',
                        data: extendedChartData.errorsVsUsers,
                        backgroundColor: 'rgba(249, 115, 22, 0.6)',
                        borderColor: 'rgb(249, 115, 22)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Users' } },
                        y: { title: { display: true, text: 'Error Count' } }
                    }
                }
            });
        }
    </script>
</body>
</html>`;
            };
            )
            )