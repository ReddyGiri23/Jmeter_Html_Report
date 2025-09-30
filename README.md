# JMeter HTML Report Generator

A powerful tool to generate comprehensive HTML reports from JMeter test results with both web interface and command-line support.

## Features

- 📊 **Comprehensive Reports**: Generate detailed HTML reports with charts, tables, and analysis
- 🔄 **Performance Comparison**: Compare two test runs side-by-side
- 🌐 **Web Interface**: User-friendly drag-and-drop interface
- ⚡ **CLI Support**: Direct command-line processing for automation
- 📈 **Interactive Charts**: Response times, throughput, errors over time
- 🎯 **SLA Gates**: Configurable performance thresholds
- 🚨 **Error Analysis**: Detailed error reporting and investigation

## Quick Start

### Web Interface
```bash
npm run dev
# Open http://localhost:5173 in your browser
```

### Command Line Interface
```bash
# Generate report from JTL file
npm run generate-report -- -i path/to/your/test-results.jtl

# Generate comparison report between two test runs
npm run generate-comparison-report -- -c current-test.jtl -p previous-test.jtl

# Specify custom output location
npm run generate-report -- -i results.jtl -o custom-report.html

# Comparison report with custom output
npm run generate-comparison-report -- -c current.jtl -p baseline.jtl -o comparison.html

# Show help
npm run generate-report -- --help
```

## CLI Usage Examples

```bash
# Basic usage
npm run generate-report -- -i ./load-test.jtl

# Custom output file
npm run generate-report -- -i ./performance-test.csv -o ./reports/performance-report.html

# Process file with full paths
npm run generate-report -- --input /home/user/jmeter-results.jtl --output /home/user/reports/report.html

# Generate comparison report
npm run generate-comparison-report -- -c ./current-test.jtl -p ./baseline-test.jtl

# Comparison with custom output location
npm run generate-comparison-report -- --current-input ./new-results.csv --previous-input ./old-results.csv -o ./reports/comparison-report.html

# Comparison with configuration file
npm run generate-comparison-report -- -c current.jtl -p baseline.jtl -f config.json -o comparison.html
```

## Supported File Formats

- **JTL Files**: XML or CSV format from JMeter
- **CSV Files**: With required columns: `timeStamp`, `elapsed`, `label`, `success`

## Required Columns

Your JMeter results file must contain these columns:
- `timeStamp` - Request timestamp
- `elapsed` - Response time in milliseconds
- `label` - Transaction/request name
- `success` - Boolean indicating request success

Optional columns:
- `responseCode` - HTTP response code
- `responseMessage` - Error message
- `threadName` - Thread/user identifier
- `bytes` - Response size

## Report Contents

### Dashboard Tab
- Test configuration summary
- SLA gates status
- Aggregate performance metrics
- Key performance indicators

### Graphs Tab
- Response times over time
- Throughput analysis
- Error rate trends
- Performance percentiles
- Throughput vs response time correlation

### Error Report Tab
- Failed request details
- Error messages and codes
- Timeline analysis
- Thread information

### Comparison Tab (when available)
- Side-by-side test comparison
- Performance change analysis
- Improvement/regression identification
- Detailed metrics comparison

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## Integration

### CloudBees Jenkins Integration

This tool integrates seamlessly with CloudBees Jenkins for automated performance reporting in CI/CD pipelines.

#### Prerequisites
- **Node.js**: Version 16 or higher installed on Jenkins agents
- **Jenkins Plugins**:
  - NodeJS Plugin (for Node.js environment management)
  - HTML Publisher Plugin (for publishing HTML reports)

#### Setup Steps

1. **Install Required Jenkins Plugins**
   ```
   - Go to Jenkins → Manage Jenkins → Manage Plugins
   - Install "NodeJS Plugin" and "HTML Publisher Plugin"
   - Configure Node.js installation in Global Tool Configuration
   ```

2. **Create Jenkinsfile**
   
   Add this `Jenkinsfile` to your repository root:
   
   ```groovy
   pipeline {
       agent {
           docker {
               image 'node:18-alpine'
               args '-u 0:0'
           }
       }
   
       stages {
           stage('Checkout Code') {
               steps {
                   git branch: 'main', url: 'YOUR_REPOSITORY_URL'
               }
           }
   
           stage('Install Dependencies') {
               steps {
                   sh 'npm install'
               }
           }
   
           stage('Run JMeter Test') {
               steps {
                   // Example JMeter execution
                   sh '''
                       echo "Running JMeter test..."
                       # Replace with your actual JMeter command
                       # ${JMETER_HOME}/bin/jmeter -n -t testplan.jmx -l test-results.jtl
                       cp test-sample.jtl test-results.jtl
                   '''
               }
           }
   
           stage('Generate Performance Report') {
               steps {
                   sh 'npm run generate-report -- -i test-results.jtl -o jmeter-report.html'
               }
           }
   
           stage('Publish HTML Report') {
               steps {
                   publishHTML([
                       allowMissing: false,
                       alwaysLinkToLastBuild: true,
                       keepAll: true,
                       reportDir: '.',
                       reportFiles: 'jmeter-report.html',
                       reportName: 'JMeter Performance Report'
                   ])
               }
           }
       }
   
       post {
           always {
               // Archive JTL files for debugging
               archiveArtifacts artifacts: '*.jtl', allowEmptyArchive: true
               cleanWs()
           }
           failure {
               // Send notifications on failure
               echo 'Performance test failed!'
           }
       }
   }
   ```

3. **Configure Jenkins Pipeline Job**
   ```
   - Create new Pipeline job in Jenkins
   - Configure SCM to point to your repository
   - Set branch to contain the Jenkinsfile
   - Save and build
   ```

4. **View Reports**
   ```
   - After successful build, click "JMeter Performance Report" link
   - Reports are archived for each build
   - Compare performance across builds
   ```

#### Advanced Jenkins Configuration

**Using Configuration Files**

Create a `jenkins-config.json` in your repository:
```json
{
  "slaThresholds": {
    "avgResponseTime": 3000,
    "throughput": 0.03055,
    "errorRate": 10
  },
  "reportOptions": {
    "includeCharts": true,
    "maxErrorSamples": 200,
    "samplingRate": 2
  },
  "testConfig": {
    "testEnvironment": "PPE02"
  }
}
```

Then use it in your pipeline:
```groovy
sh 'npm run generate-report -- -i test-results.jtl -f jenkins-config.json -o jmeter-report.html'
```

**Comparison Reports in Jenkins**

For performance regression detection:
```groovy
stage('Generate Comparison Report') {
    when {
        not { changeRequest() } // Only on main branch
    }
    steps {
        script {
            // Get previous build's JTL file
            def previousBuild = currentBuild.previousSuccessfulBuild
            if (previousBuild) {
                copyArtifacts(
                    projectName: env.JOB_NAME,
                    selector: specific("${previousBuild.number}"),
                    filter: 'test-results.jtl',
                    target: 'previous/'
                )
                sh '''
                    npm run generate-report -- \
                        -c test-results.jtl \
                        -p previous/test-results.jtl \
                        -o comparison-report.html
                '''
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: '.',
                    reportFiles: 'comparison-report.html',
                    reportName: 'Performance Comparison Report'
                ])
            }
        }
    }
}
```

**SLA Gates Integration**

Fail builds based on SLA violations:
```groovy
stage('Check SLA Gates') {
    steps {
        script {
            // Parse the generated report or use exit codes
            def reportExists = fileExists('jmeter-report.html')
            if (!reportExists) {
                error('Performance report generation failed')
            }
            
            // You can extend this to parse SLA results and fail the build
            echo 'SLA gates passed - build continues'
        }
    }
}
```

### CI/CD Pipeline

#### GitHub Actions Example
```yaml
name: Performance Testing

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  performance-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run JMeter Test
      run: |
        # Your JMeter test execution
        cp test-sample.jtl test-results.jtl
    
    - name: Generate Performance Report
      run: npm run generate-report -- -i test-results.jtl -o jmeter-report.html
    
    - name: Upload Performance Report
      uses: actions/upload-artifact@v3
      with:
        name: performance-report
        path: jmeter-report.html
```

#### GitLab CI Example
```yaml
stages:
  - test
  - report

performance-test:
  stage: test
  image: node:18-alpine
  script:
    - npm install
    - cp test-sample.jtl test-results.jtl  # Replace with actual JMeter execution
    - npm run generate-report -- -i test-results.jtl -o jmeter-report.html
  artifacts:
    reports:
      performance: jmeter-report.html
    paths:
      - jmeter-report.html
    expire_in: 30 days
```

## Troubleshooting

### Common Issues

**File not found error:**
- Check file path is correct
- Ensure file exists and is readable
- Use absolute paths if relative paths don't work

**No valid samples error:**
- Verify file contains JMeter test results
- Check required columns are present
- Ensure file is not empty or corrupted

**XML parsing error:**
- Verify JTL file is valid XML format
- Check file wasn't truncated during test
- Try opening file in text editor to verify format

### Performance Tips

- For large files (>100MB), processing may take several minutes
- Use sampling options for very large datasets
- Ensure sufficient memory for large test results

## License

MIT License - see LICENSE file for details