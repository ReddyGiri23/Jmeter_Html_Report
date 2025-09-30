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

# Specify custom output location
npm run generate-report -- -i results.jtl -o custom-report.html

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

### Jenkins Integration
1. Generate HTML report using CLI
2. Use Jenkins publishHTML plugin
3. Archive the generated HTML file

### CI/CD Pipeline
```yaml
# Example GitHub Actions step
- name: Generate JMeter Report
  run: npm run generate-report -- -i test-results.jtl -o jmeter-report.html

- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: jmeter-report
    path: jmeter-report.html
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