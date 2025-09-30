import { JMeterData } from '../types/jmeter';

export const generateHTMLReport = (data: JMeterData, comparisonData?: { current: JMeterData; previous: JMeterData; fileName: string; previousFileName: string }): string => {
  // Generate additional chart data for new graphs
  const generateExtendedChartData = () => {
    // Hits per second (same as TPS)
    const hitsPerSecond = data.chartData.tpsOverTime;
    
    // Error rate over time
    const errorRateOverTime = data.chartData.errorsOverTime.map(point => ({
      x: point.x,
      y: data.chartData.tpsOverTime.find(tps => tps.x === point.x)?.y 
        ? (point.y / data.chartData.tpsOverTime.find(tps => tps.x === point.x)!.y) * 100 
        : 0
    }));

    // Users over time (based on thread data)
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
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }
        
        .container {
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 280px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
            box-shadow: 4px 0 10px rgba(0,0,0,0.1);
        }
        
        .sidebar h1 {
            font-size: 1.5rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 2rem;
            padding: 0 1rem;
        }
        
        .nav-tabs {
            list-style: none;
        }
        
        .nav-tab {
            margin: 0.5rem 1rem;
        }
        
        .nav-tab button {
            width: 100%;
            background: transparent;
            border: none;
            color: white;
            padding: 1rem 1.5rem;
            text-align: left;
            cursor: pointer;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
        }
        
        .nav-tab button:hover {
            background: rgba(255,255,255,0.1);
            transform: translateX(4px);
        }
        
        .nav-tab button.active {
            background: rgba(255,255,255,0.2);
            font-weight: 600;
        }
        
        .nav-tab button::before {
            content: '';
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255,255,255,0.6);
            margin-right: 12px;
        }
        
        .nav-tab button.active::before {
            background: #fbbf24;
        }
        
        .main-content {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .header {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .header h2 {
            font-size: 2rem;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            color: #64748b;
            font-size: 1.1rem;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            margin-top: 1rem;
        }
        
        .status-passed {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-failed {
            background: #fef2f2;
            color: #dc2626;
        }
        
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
            overflow: hidden;
        }
        
        .card-header {
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
        }
        
        .card-header h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
        }
        
        .card-content {
            padding: 2rem;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .metric-item {
            text-align: center;
            padding: 1rem;
            border-radius: 8px;
            background: #f8fafc;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 0.5rem;
        }
        
        .metric-label {
            font-size: 0.875rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .sla-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }
        
        .sla-item {
            padding: 1.5rem;
            border-radius: 8px;
            border: 2px solid;
        }
        
        .sla-passed {
            border-color: #10b981;
            background: #ecfdf5;
        }
        
        .sla-failed {
            border-color: #ef4444;
            background: #fef2f2;
        }
        
        .sla-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .sla-title {
            font-weight: 600;
            color: #1e293b;
        }
        
        .sla-status {
            width: 20px;
            height: 20px;
            border-radius: 50%;
        }
        
        .sla-status.passed {
            background: #10b981;
        }
        
        .sla-status.failed {
            background: #ef4444;
        }
        
        .sla-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .sla-threshold {
            font-size: 0.875rem;
            color: #64748b;
        }
        
        .table-container {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }
        
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        
        th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 0.75rem;
        }
        
        tr:hover {
            background: #f8fafc;
        }
        
        .error-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        
        .error-low {
            background: #dcfce7;
            color: #166534;
        }
        
        .error-medium {
            background: #fef3c7;
            color: #92400e;
        }
        
        .error-high {
            background: #fef2f2;
            color: #dc2626;
        }
        
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 2rem;
        }
        
        .chart-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            padding: 1.5rem;
        }
        
        .chart-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .chart-canvas {
            position: relative;
            height: 300px;
            width: 100%;
        }
        
        @media (max-width: 768px) {
            .container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                padding: 1rem 0;
            }
            
            .nav-tabs {
                display: flex;
                overflow-x: auto;
            }
            
            .nav-tab {
                margin: 0 0.5rem;
                min-width: 120px;
            }
            
            .main-content {
                padding: 1rem;
            }
            
            .charts-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h1>JMeter Report</h1>
            <ul class="nav-tabs">
                <li class="nav-tab">
                    <button class="tab-btn active" data-tab="dashboard">Dashboard</button>
                </li>
                <li class="nav-tab">
                    <button class="tab-btn" data-tab="graphs">Graphs</button>
                </li>
                <li class="nav-tab">
                    <button class="tab-btn" data-tab="errors">Error Report</button>
                </li>
                ${comparisonData ? `
                <li class="nav-tab">
                    <button class="tab-btn" data-tab="comparison">Comparison</button>
                </li>
                ` : ''}
            </ul>
        </div>
        
        <div class="main-content">
            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-content active">
                <div class="header">
                    <h2>Performance Test Dashboard</h2>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                    <div class="status-badge ${data.slaResults.overallPassed ? 'status-passed' : 'status-failed'}">
                        Test ${data.slaResults.overallPassed ? 'PASSED' : 'FAILED'}
                    </div>
                </div>
                
                <!-- Test Configuration Summary -->
                <div class="card">
                    <div class="card-header">
                        <h3>Test Configuration Summary</h3>
                    </div>
                    <div class="card-content">
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <div class="metric-value">${data.summary.testDuration}s</div>
                                <div class="metric-label">Test Duration</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${data.summary.virtualUsers}</div>
                                <div class="metric-label">Virtual Users</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${data.summary.totalRequests.toLocaleString()}</div>
                                <div class="metric-label">Total Requests</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${data.summary.totalErrors.toLocaleString()}</div>
                                <div class="metric-label">Total Errors</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${data.summary.overallThroughput.toFixed(2)}</div>
                                <div class="metric-label">Throughput (req/s)</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${data.summary.avgResponseTime.toFixed(0)}ms</div>
                                <div class="metric-label">Avg Response Time</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${data.summary.p95ResponseTime.toFixed(0)}ms</div>
                                <div class="metric-label">95th Percentile</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${data.summary.errorRate.toFixed(2)}%</div>
                                <div class="metric-label">Error Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- SLA Gates Status -->
                <div class="card">
                    <div class="card-header">
                        <h3>SLA Gates Status</h3>
                    </div>
                    <div class="card-content">
                        <div class="sla-grid">
                            <div class="sla-item ${data.slaResults.p95ResponseTime.passed ? 'sla-passed' : 'sla-failed'}">
                                <div class="sla-header">
                                    <div class="sla-title">95th Percentile Response Time</div>
                                    <div class="sla-status ${data.slaResults.p95ResponseTime.passed ? 'passed' : 'failed'}"></div>
                                </div>
                                <div class="sla-value">${data.slaResults.p95ResponseTime.value.toFixed(0)}ms</div>
                                <div class="sla-threshold">Threshold: ≤ ${data.slaResults.p95ResponseTime.threshold}ms</div>
                            </div>
                            <div class="sla-item ${data.slaResults.averageThroughput.passed ? 'sla-passed' : 'sla-failed'}">
                                <div class="sla-header">
                                    <div class="sla-title">Average Throughput</div>
                                    <div class="sla-status ${data.slaResults.averageThroughput.passed ? 'passed' : 'failed'}"></div>
                                </div>
                                <div class="sla-value">${data.slaResults.averageThroughput.value.toFixed(2)} req/s</div>
                                <div class="sla-threshold">Threshold: ≥ ${data.slaResults.averageThroughput.threshold} req/s</div>
                            </div>
                            <div class="sla-item ${data.slaResults.errorRate.passed ? 'sla-passed' : 'sla-failed'}">
                                <div class="sla-header">
                                    <div class="sla-title">Error Rate</div>
                                    <div class="sla-status ${data.slaResults.errorRate.passed ? 'passed' : 'failed'}"></div>
                                </div>
                                <div class="sla-value">${data.slaResults.errorRate.value.toFixed(2)}%</div>
                                <div class="sla-threshold">Threshold: ≤ ${data.slaResults.errorRate.threshold}%</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Aggregate Report -->
                <div class="card">
                    <div class="card-header">
                        <h3>Aggregate Report</h3>
                    </div>
                    <div class="card-content">
                        <div class="table-container">
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
                                            <td>
                                                <span class="error-badge ${
                                                    transaction.errorRate > 10 ? 'error-high' :
                                                    transaction.errorRate > 5 ? 'error-medium' : 'error-low'
                                                }">
                                                    ${transaction.errorRate.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td>${transaction.throughput.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Graphs Tab -->
            <div id="graphs" class="tab-content">
                <div class="header">
                    <h2>Performance Graphs</h2>
                    <p>Visual analysis of test metrics over time</p>
                </div>
                
                <div class="charts-grid">
                    <!-- Chart 1: Average Response Times Over Time -->
                    <div class="chart-container">
                        <div class="chart-title">Average Response Times Over Time</div>
                        <div class="chart-canvas">
                            <canvas id="avgResponseTimesChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Chart 2: Throughput Over Time -->
                    <div class="chart-container">
                        <div class="chart-title">Throughput Over Time</div>
                        <div class="chart-canvas">
                            <canvas id="throughputChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Chart 3: Error Rate Over Time -->
                    <div class="chart-container">
                        <div class="chart-title">Error Rate Over Time</div>
                        <div class="chart-canvas">
                            <canvas id="errorRateChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Chart 4: Hits/Second Over Time -->
                    <div class="chart-container">
                        <div class="chart-title">Hits/Second Over Time</div>
                        <div class="chart-canvas">
                            <canvas id="hitsPerSecondChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Chart 5: Response Times vs Over Time -->
                    <div class="chart-container">
                        <div class="chart-title">Response Times vs Over Time</div>
                        <div class="chart-canvas">
                            <canvas id="responseTimesOverTimeChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Chart 6: TPS vs Over Time -->
                    <div class="chart-container">
                        <div class="chart-title">TPS vs Over Time</div>
                        <div class="chart-canvas">
                            <canvas id="tpsOverTimeChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Chart 7: Errors vs Response Time -->
                    <div class="chart-container">
                        <div class="chart-title">Errors vs Response Time</div>
                        <div class="chart-canvas">
                            <canvas id="errorsVsResponseTimeChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Chart 8: Throughput vs Response Time -->
                    <div class="chart-container">
                        <div class="chart-title">Throughput vs Response Time</div>
                        <div class="chart-canvas">
                            <canvas id="throughputVsResponseTimeChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Chart 9: Users vs Response Time -->
                    <div class="chart-container">
                        <div class="chart-title">Users vs Response Time</div>
                        <div class="chart-canvas">
                            <canvas id="usersVsResponseTimeChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Chart 10: Errors vs Users -->
                    <div class="chart-container">
                        <div class="chart-title">Errors vs Users</div>
                        <div class="chart-canvas">
                            <canvas id="errorsVsUsersChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Error Report Tab -->
            <div id="errors" class="tab-content">
                <div class="header">
                    <h2>Error Report</h2>
                    <p>${data.errorSamples.length} error${data.errorSamples.length !== 1 ? 's' : ''} found during test execution</p>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>Failed Requests Analysis</h3>
                    </div>
                    <div class="card-content">
                        ${data.errorSamples.length === 0 ? `
                            <div style="text-align: center; padding: 3rem; color: #10b981;">
                                <div style="font-size: 3rem; margin-bottom: 1rem;">✓</div>
                                <h3 style="color: #10b981; margin-bottom: 0.5rem;">No Errors Found</h3>
                                <p style="color: #64748b;">All requests completed successfully!</p>
                            </div>
                        ` : `
                            <div class="table-container">
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
                                                <td>${new Date(error.timestamp).toLocaleString()}</td>
                                                <td>${error.label}</td>
                                                <td>${error.responseTime.toFixed(0)}ms</td>
                                                <td>${error.threadName}</td>
                                                <td style="max-width: 300px; word-wrap: break-word;">${error.responseMessage || 'Unknown error'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            ${data.errorSamples.length === 50 ? `
                                <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; color: #92400e;">
                                    <strong>Note:</strong> Only the first 50 errors are shown. There may be additional errors in the complete dataset.
                                </div>
                            ` : ''}
                        `}
                    </div>
                </div>
            </div>
            
            ${comparisonData ? `
            <!-- Comparison Tab -->
            <div id="comparison" class="tab-content">
                <div class="header">
                    <h2>Performance Comparison</h2>
                    <p>Side-by-side comparison of current vs previous test results</p>
                </div>
                
                <!-- Comparison Summary -->
                <div class="card">
                    <div class="card-header">
                        <h3>Test Comparison Summary</h3>
                    </div>
                    <div class="card-content">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <h4 class="font-semibold text-blue-900 mb-2">Current Test</h4>
                                <p class="text-sm font-medium text-blue-800">${comparisonData.fileName}</p>
                                <div class="text-xs text-blue-600 mt-2 space-y-1">
                                    <p>Requests: ${comparisonData.current.summary.totalRequests.toLocaleString()}</p>
                                    <p>Duration: ${comparisonData.current.summary.testDuration}s</p>
                                    <p>Avg Response: ${comparisonData.current.summary.avgResponseTime.toFixed(0)}ms</p>
                                    <p>Error Rate: ${comparisonData.current.summary.errorRate.toFixed(2)}%</p>
                                </div>
                            </div>
                            <div class="bg-orange-50 p-4 rounded-lg">
                                <h4 class="font-semibold text-orange-900 mb-2">Previous Test</h4>
                                <p class="text-sm font-medium text-orange-800">${comparisonData.previousFileName}</p>
                                <div class="text-xs text-orange-600 mt-2 space-y-1">
                                    <p>Requests: ${comparisonData.previous.summary.totalRequests.toLocaleString()}</p>
                                    <p>Duration: ${comparisonData.previous.summary.testDuration}s</p>
                                    <p>Avg Response: ${comparisonData.previous.summary.avgResponseTime.toFixed(0)}ms</p>
                                    <p>Error Rate: ${comparisonData.previous.summary.errorRate.toFixed(2)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Detailed Comparison Table -->
                <div class="card">
                    <div class="card-header">
                        <h3>Transaction Comparison</h3>
                    </div>
                    <div class="card-content">
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Transaction</th>
                                        <th>Avg Response Time</th>
                                        <th>Change</th>
                                        <th>Throughput</th>
                                        <th>Change</th>
                                        <th>Error Rate</th>
                                        <th>Change</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(() => {
                                        // Generate comparison data
                                        const currentTransactions = new Map(comparisonData.current.transactions.map(t => [t.label, t]));
                                        const previousTransactions = new Map(comparisonData.previous.transactions.map(t => [t.label, t]));
                                        const commonLabels = [...currentTransactions.keys()].filter(label => previousTransactions.has(label));
                                        
                                        return commonLabels.map((label, index) => {
                                            const current = currentTransactions.get(label)!;
                                            const previous = previousTransactions.get(label)!;
                                            
                                            const avgRTChange = ((current.avgResponseTime - previous.avgResponseTime) / previous.avgResponseTime) * 100;
                                            const throughputChange = ((current.throughput - previous.throughput) / previous.throughput) * 100;
                                            const errorRateChange = ((current.errorRate - previous.errorRate) / previous.errorRate) * 100;
                                            
                                            const getChangeColor = (change, isInverse = false) => {
                                                const threshold = 5;
                                                const isImprovement = isInverse ? change < -threshold : change > threshold;
                                                const isRegression = isInverse ? change > threshold : change < -threshold;
                                                
                                                if (isImprovement) return 'color: #059669; background: #ecfdf5;';
                                                if (isRegression) return 'color: #dc2626; background: #fef2f2;';
                                                return 'color: #6b7280; background: #f9fafb;';
                                            };
                                            
                                            const getChangeIcon = (change, isInverse = false) => {
                                                const threshold = 5;
                                                const isImprovement = isInverse ? change < -threshold : change > threshold;
                                                const isRegression = isInverse ? change > threshold : change < -threshold;
                                                
                                                if (isImprovement) return '↑';
                                                if (isRegression) return '↓';
                                                return '→';
                                            };
                                            
                                            const getStatus = () => {
                                                let improvements = 0;
                                                let regressions = 0;
                                                
                                                if (avgRTChange <= -5) improvements++;
                                                else if (avgRTChange >= 5) regressions++;
                                                
                                                if (throughputChange >= 5) improvements++;
                                                else if (throughputChange <= -5) regressions++;
                                                
                                                if (errorRateChange <= -5) improvements++;
                                                else if (errorRateChange >= 5) regressions++;
                                                
                                                if (improvements > regressions) return { status: 'Improved', color: '#059669' };
                                                if (regressions > improvements) return { status: 'Regressed', color: '#dc2626' };
                                                return { status: 'Neutral', color: '#6b7280' };
                                            };
                                            
                                            const status = getStatus();
                                            
                                            return `
                                                <tr style="${index % 2 === 0 ? 'background: white;' : 'background: #f9fafb;'}">
                                                    <td style="font-weight: 600;">${label}</td>
                                                    <td>
                                                        <div>${current.avgResponseTime.toFixed(0)}ms</div>
                                                        <div style="font-size: 0.75rem; color: #6b7280;">vs ${previous.avgResponseTime.toFixed(0)}ms</div>
                                                    </td>
                                                    <td>
                                                        <span style="padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; ${getChangeColor(avgRTChange, true)}">
                                                            ${getChangeIcon(avgRTChange, true)} ${avgRTChange.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>${current.throughput.toFixed(2)}/s</div>
                                                        <div style="font-size: 0.75rem; color: #6b7280;">vs ${previous.throughput.toFixed(2)}/s</div>
                                                    </td>
                                                    <td>
                                                        <span style="padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; ${getChangeColor(throughputChange)}">
                                                            ${getChangeIcon(throughputChange)} ${throughputChange.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>${current.errorRate.toFixed(2)}%</div>
                                                        <div style="font-size: 0.75rem; color: #6b7280;">vs ${previous.errorRate.toFixed(2)}%</div>
                                                    </td>
                                                    <td>
                                                        <span style="padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; ${getChangeColor(errorRateChange, true)}">
                                                            ${getChangeIcon(errorRateChange, true)} ${errorRateChange.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style="color: ${status.color}; font-weight: 600;">${status.status}</span>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('');
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
    
    <script>
        // Tab switching functionality
        document.addEventListener('DOMContentLoaded', function() {
            const tabButtons = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            let chartsInitialized = false;
            
            tabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const targetTab = this.getAttribute('data-tab');
                    
                    // Remove active class from all buttons and contents
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Add active class to clicked button and corresponding content
                    this.classList.add('active');
                    document.getElementById(targetTab).classList.add('active');
                    
                    // Initialize charts when graphs tab is first opened
                    if (targetTab === 'graphs' && !chartsInitialized) {
                        initializeCharts();
                        chartsInitialized = true;
                    }
                });
            });
            
            function initializeCharts() {
                // Chart 1: Average Response Times Over Time
                const avgResponseTimesCtx = document.getElementById('avgResponseTimesChart').getContext('2d');
                new Chart(avgResponseTimesCtx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: 'Average Response Time',
                            data: ${JSON.stringify(data.chartData.responseTimesOverTime)},
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.1
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
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Response Time (ms)'
                                }
                            }
                        }
                    }
                });
                
                // Chart 2: Throughput Over Time
                const throughputCtx = document.getElementById('throughputChart').getContext('2d');
                new Chart(throughputCtx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: 'Throughput',
                            data: ${JSON.stringify(data.chartData.tpsOverTime)},
                            borderColor: 'rgb(34, 197, 94)',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            fill: true,
                            tension: 0.1
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
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Requests/sec'
                                }
                            }
                        }
                    }
                });
                
                // Chart 3: Error Rate Over Time
                const errorRateCtx = document.getElementById('errorRateChart').getContext('2d');
                new Chart(errorRateCtx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: 'Error Rate',
                            data: ${JSON.stringify(extendedChartData.errorRateOverTime)},
                            borderColor: 'rgb(239, 68, 68)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.1
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
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Error Rate (%)'
                                }
                            }
                        }
                    }
                });
                
                // Chart 4: Hits/Second Over Time
                const hitsPerSecondCtx = document.getElementById('hitsPerSecondChart').getContext('2d');
                new Chart(hitsPerSecondCtx, {
                    type: 'bar',
                    data: {
                        datasets: [{
                            label: 'Hits/Second',
                            data: ${JSON.stringify(extendedChartData.hitsPerSecond)},
                            backgroundColor: 'rgba(245, 158, 11, 0.8)',
                            borderColor: 'rgb(245, 158, 11)',
                            borderWidth: 1
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
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Hits/sec'
                                }
                            }
                        }
                    }
                });
                
                // Chart 5: Response Times vs Over Time (Multi-line by transaction)
                const responseTimesOverTimeCtx = document.getElementById('responseTimesOverTimeChart').getContext('2d');
                const groupedData = ${JSON.stringify(data.chartData.responseTimesOverTime)}.reduce((acc, point) => {
                    if (!acc[point.label]) {
                        acc[point.label] = [];
                    }
                    acc[point.label].push({ x: point.x, y: point.y });
                    return acc;
                }, {});
                
                // Sort each group by x value for proper line connections
                const datasets = Object.entries(groupedData).map(([label, points], index) => ({
                    label,
                    data: points.sort((a, b) => a.x - b.x),
                    borderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 50%)\`,
                    backgroundColor: \`hsl(\${(index * 137.5) % 360}, 70%, 90%)\`,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                }));
                
                new Chart(responseTimesOverTimeCtx, {
                    type: 'line',
                    data: { datasets },
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
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Response Time (ms)'
                                }
                            }
                        }
                    }
                });
                
                // Chart 6: TPS vs Over Time (Bar)
                const tpsOverTimeCtx = document.getElementById('tpsOverTimeChart').getContext('2d');
                new Chart(tpsOverTimeCtx, {
                    type: 'bar',
                    data: {
                        datasets: [{
                            label: 'TPS',
                            data: ${JSON.stringify(data.chartData.tpsOverTime)},
                            backgroundColor: 'rgba(168, 85, 247, 0.8)',
                            borderColor: 'rgb(168, 85, 247)',
                            borderWidth: 1
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
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Transactions/sec'
                                }
                            }
                        }
                    }
                });
                
                // Chart 7: Errors vs Response Time
                const errorsVsResponseTimeCtx = document.getElementById('errorsVsResponseTimeChart').getContext('2d');
                new Chart(errorsVsResponseTimeCtx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'Errors',
                            data: ${JSON.stringify(extendedChartData.errorsVsResponseTime)},
                            backgroundColor: 'rgba(239, 68, 68, 0.6)',
                            borderColor: 'rgb(239, 68, 68)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Response Time (ms)'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Error Count'
                                }
                            }
                        }
                    }
                });
                
                // Chart 8: Throughput vs Response Time
                const throughputVsResponseTimeCtx = document.getElementById('throughputVsResponseTimeChart').getContext('2d');
                
                // Group data by label for line charts
                const groupedData = ${JSON.stringify(data.chartData.throughputVsResponseTime)}.reduce((acc, point) => {
                  if (!acc[point.label]) {
                    acc[point.label] = [];
                  }
                  acc[point.label].push({ x: point.x, y: point.y });
                  return acc;
                }, {});

                // Sort each group by x value for proper line connections
                const datasets = Object.entries(groupedData).map(([label, points], index) => ({
                  label: label,
                  data: points.sort((a, b) => a.x - b.x),
                  backgroundColor: \`hsla(\${(index * 137.5) % 360}, 70%, 50%, 0.6)\`,
                  borderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 40%)\`,
                  borderWidth: 2,
                  fill: false,
                  tension: 0.1,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  pointBackgroundColor: \`hsl(\${(index * 137.5) % 360}, 70%, 50%)\`,
                  pointBorderColor: \`hsl(\${(index * 137.5) % 360}, 70%, 30%)\`,
                  pointBorderWidth: 1,
                  showLine: true,
                }));

                const config = {
                  type: 'line',
                  data: { datasets: datasets },
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
                      },
                      tooltip: {
                        callbacks: {
                          title: function(context) {
                            return context[0].dataset.label || '';
                          },
                          label: function(context) {
                            return \`Throughput: \${context.parsed.x.toFixed(2)} req/s, Response Time: \${context.parsed.y.toFixed(0)} ms\`;
                          }
                        }
                      }
                    }
                  }
                };
                
                new Chart(throughputVsResponseTimeCtx, config);
                
                // Chart 9: Users vs Response Time
                const usersVsResponseTimeCtx = document.getElementById('usersVsResponseTimeChart').getContext('2d');
                new Chart(usersVsResponseTimeCtx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'Users',
                            data: ${JSON.stringify(extendedChartData.usersVsResponseTime)},
                            backgroundColor: 'rgba(59, 130, 246, 0.6)',
                            borderColor: 'rgb(59, 130, 246)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Users'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Response Time (ms)'
                                }
                            }
                        }
                    }
                });
                
                // Chart 10: Errors vs Users
                const errorsVsUsersCtx = document.getElementById('errorsVsUsersChart').getContext('2d');
                new Chart(errorsVsUsersCtx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'Errors',
                            data: ${JSON.stringify(extendedChartData.errorsVsUsers)},
                            backgroundColor: 'rgba(239, 68, 68, 0.6)',
                            borderColor: 'rgb(239, 68, 68)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Users'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Error Count'
                                }
                            }
                        }
                    }
                });
            }
        });
    </script>
</body>
</html>`;
};