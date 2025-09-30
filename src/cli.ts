#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, basename, extname } from 'path';
import { DOMParser } from '@xmldom/xmldom';
import { parseJMeterFile } from './utils/jmeterParser';
import { generateHTMLReport } from './utils/reportGenerator';
import { compareJMeterResults } from './utils/comparisonAnalyzer';
import { ReportGenerationOptions } from './types/jmeter';

interface CLIOptions {
  input: string;
  currentInput?: string;
  previousInput?: string;
  output?: string;
  configFile?: string;
  help?: boolean;
}

const parseArgs = (args: string[]): CLIOptions => {
  const options: CLIOptions = { input: '' };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-i':
      case '--input':
        options.input = args[++i];
        break;
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '--current-input':
      case '-c':
        options.currentInput = args[++i];
        break;
      case '--previous-input':
      case '-p':
        options.previousInput = args[++i];
        break;
      case '-f':
      case '--config-file':
        options.configFile = args[++i];
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
    }
  }
  
  return options;
};

const showHelp = () => {
  console.log(`
JMeter HTML Report Generator CLI

Usage: 
  Single Report:    npm run generate-report -- -i <input-file> [-o <output-file>]
  Comparison Report: npm run generate-report -- -c <current-file> -p <previous-file> [-o <output-file>]

Options:
  -i, --input <file>    Path to JMeter JTL/CSV file (required for single report)
  -c, --current-input <file>   Path to current/new JMeter JTL/CSV file (for comparison)
  -p, --previous-input <file>  Path to previous/baseline JMeter JTL/CSV file (for comparison)
  -o, --output <file>   Output HTML file path (optional)
  -f, --config-file <file>     Path to JSON configuration file for SLA thresholds and settings (optional)
  -h, --help           Show this help message

Single Report Examples:
  npm run generate-report -- -i ./test-results.jtl
  npm run generate-report -- -i ./results.csv -o ./custom-report.html
  npm run generate-report -- --input ./load-test.jtl --output ./performance-report.html
  npm run generate-report -- -i ./test-results.jtl -f ./config.json

Comparison Report Examples:
  npm run generate-report -- -c ./current-test.jtl -p ./baseline-test.jtl
  npm run generate-report -- --current-input ./new-results.csv --previous-input ./old-results.csv -o ./comparison-report.html
  npm run generate-report -- -c ./current-test.jtl -p ./baseline-test.jtl -f ./config.json

Default output: jmeter-report-[timestamp].html in current directory
For comparison: jmeter-comparison-report-[timestamp].html in current directory

Configuration File Format (JSON):
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
`);
};

const generateOutputPath = (inputPath: string, customOutput?: string): string => {
  if (customOutput) {
    return resolve(customOutput);
  }
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const inputName = basename(inputPath, extname(inputPath));
  return resolve(`jmeter-report-${inputName}-${timestamp}.html`);
};

const generateComparisonOutputPath = (currentPath: string, previousPath: string, customOutput?: string): string => {
  if (customOutput) {
    return resolve(customOutput);
  }
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const currentName = basename(currentPath, extname(currentPath));
  const previousName = basename(previousPath, extname(previousPath));
  return resolve(`jmeter-comparison-report-${currentName}-vs-${previousName}-${timestamp}.html`);
};
const main = async () => {
const loadConfigFile = (configPath: string): ReportGenerationOptions | null => {
  try {
    if (!existsSync(configPath)) {
      console.error(`❌ Error: Configuration file not found: ${configPath}`);
      return null;
    }
    
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent) as ReportGenerationOptions;
    
    console.log('📋 Loaded configuration from:', configPath);
    return config;
  } catch (error) {
    console.error(`❌ Error loading configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
};

  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  if (options.help || args.length === 0) {
    showHelp();
    process.exit(0);
  }
  
  // Load configuration file if provided
  let config: ReportGenerationOptions | undefined;
  if (options.configFile) {
    const loadedConfig = loadConfigFile(resolve(options.configFile));
    if (!loadedConfig) {
      process.exit(1);
    }
    config = loadedConfig;
  }
  
  // Check if this is a comparison report request
  const isComparison = options.currentInput && options.previousInput;
  const isSingleReport = options.input;
  
  if (!isComparison && !isSingleReport) {
    console.error('❌ Error: Either input file (-i) or both comparison files (-c and -p) are required');
    console.error('Use -h or --help for usage information');
    process.exit(1);
  }
  
  if (isComparison && (!options.currentInput || !options.previousInput)) {
    console.error('❌ Error: Both current input (-c) and previous input (-p) files are required for comparison');
    console.error('Use -h or --help for usage information');
    process.exit(1);
  }
  
  try {
    if (isComparison) {
      // Handle comparison report generation
      const currentPath = resolve(options.currentInput!);
      const previousPath = resolve(options.previousInput!);
      const outputPath = generateComparisonOutputPath(currentPath, previousPath, options.output);
      
      // Check if both input files exist
      if (!existsSync(currentPath)) {
        console.error(`❌ Error: Current input file not found: ${currentPath}`);
        console.error('Please check the file path and try again.');
        process.exit(1);
      }
      
      if (!existsSync(previousPath)) {
        console.error(`❌ Error: Previous input file not found: ${previousPath}`);
        console.error('Please check the file path and try again.');
        process.exit(1);
      }
      
      console.log('🚀 JMeter HTML Comparison Report Generator');
      console.log(`📁 Current file: ${currentPath}`);
      console.log(`📁 Previous file: ${previousPath}`);
      console.log(`📄 Output file: ${outputPath}`);
      console.log('');
      
      console.log('📖 Reading current JTL file...');
      const currentFileContent = readFileSync(currentPath, 'utf-8');
      
      if (!currentFileContent || currentFileContent.trim().length === 0) {
        console.error('❌ Error: Current input file is empty');
        process.exit(1);
      }
      
      console.log('📖 Reading previous JTL file...');
      const previousFileContent = readFileSync(previousPath, 'utf-8');
      
      if (!previousFileContent || previousFileContent.trim().length === 0) {
        console.error('❌ Error: Previous input file is empty');
        process.exit(1);
      }
      
      // Create File-like objects for the parser
      const currentFile = {
        name: basename(currentPath),
        size: currentFileContent.length,
        text: async () => currentFileContent,
        type: currentPath.toLowerCase().endsWith('.xml') || currentPath.toLowerCase().endsWith('.jtl') ? 'text/xml' : 'text/csv'
      } as File;
      
      const previousFile = {
        name: basename(previousPath),
        size: previousFileContent.length,
        text: async () => previousFileContent,
        type: previousPath.toLowerCase().endsWith('.xml') || previousPath.toLowerCase().endsWith('.jtl') ? 'text/xml' : 'text/csv'
      } as File;
      
      console.log('⚙️  Processing current JMeter data...');
      const currentData = await parseJMeterFile(currentFile, DOMParser, config);
      
      console.log('⚙️  Processing previous JMeter data...');
      const previousData = await parseJMeterFile(previousFile, DOMParser, config);
      
      console.log('🔄 Comparing test results...');
      const comparisonResult = compareJMeterResults(
        currentData,
        previousData,
        basename(currentPath),
        basename(previousPath)
      );
      
      console.log('📊 Generating HTML comparison report...');
      const htmlReport = generateHTMLReport(currentData, comparisonResult);
      
      console.log('💾 Saving HTML report...');
      const finalOutputPath = outputPath.endsWith('.html') ? outputPath : `${outputPath}.html`;
      writeFileSync(finalOutputPath, htmlReport, 'utf-8');
      
      console.log('');
      console.log('✅ Comparison report generated successfully!');
      console.log('');
      console.log('📈 Comparison Summary:');
      console.log(`   • Current Test: ${currentData.summary.totalRequests.toLocaleString()} requests, ${currentData.summary.avgResponseTime.toFixed(0)}ms avg`);
      console.log(`   • Previous Test: ${previousData.summary.totalRequests.toLocaleString()} requests, ${previousData.summary.avgResponseTime.toFixed(0)}ms avg`);
      console.log(`   • Transactions Compared: ${comparisonResult.metrics.length}`);
      console.log(`   • Overall Status: ${comparisonResult.overallStatus.toUpperCase()}`);
      console.log(`   • Top Improvements: ${comparisonResult.insights.topImprovements.length}`);
      console.log(`   • Top Regressions: ${comparisonResult.insights.topRegressions.length}`);
      console.log('');
      console.log(`📂 Open report: ${finalOutputPath}`);
      
    } else {
      // Handle single report generation (existing logic)
      const inputPath = resolve(options.input!);
      const outputPath = generateOutputPath(inputPath, options.output);
      
      // Check if input file exists
      if (!existsSync(inputPath)) {
        console.error(`❌ Error: Input file not found: ${inputPath}`);
        console.error('Please check the file path and try again.');
        process.exit(1);
      }
      
      console.log('🚀 JMeter HTML Report Generator');
      console.log(`📁 Input file: ${inputPath}`);
      console.log(`📄 Output file: ${outputPath}`);
      console.log('');
      
      console.log('📖 Reading JTL file...');
      const fileContent = readFileSync(inputPath, 'utf-8');
      
      if (!fileContent || fileContent.trim().length === 0) {
        console.error('❌ Error: Input file is empty');
        process.exit(1);
      }
      
      // Create a File-like object for the parser
      const file = {
        name: basename(inputPath),
        size: fileContent.length,
        text: async () => fileContent,
        type: inputPath.toLowerCase().endsWith('.xml') || inputPath.toLowerCase().endsWith('.jtl') ? 'text/xml' : 'text/csv'
      } as File;
      
      console.log('⚙️  Processing JMeter data...');
      const jmeterData = await parseJMeterFile(file, DOMParser, config);
      
      console.log('📊 Generating HTML report...');
      const htmlReport = generateHTMLReport(jmeterData);
      
      console.log('💾 Saving HTML report...');
      // Ensure output path has .html extension
      const finalOutputPath = outputPath.endsWith('.html') ? outputPath : `${outputPath}/jmeter-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
      writeFileSync(finalOutputPath, htmlReport, 'utf-8');
      
      console.log('');
      console.log('✅ Report generated successfully!');
      console.log('');
      console.log('📈 Test Summary:');
      console.log(`   • Total Requests: ${jmeterData.summary.totalRequests.toLocaleString()}`);
      console.log(`   • Test Duration: ${jmeterData.summary.testDuration}s`);
      console.log(`   • Average Response Time: ${jmeterData.summary.avgResponseTime.toFixed(0)}ms`);
      console.log(`   • 95th Percentile: ${jmeterData.summary.p95ResponseTime.toFixed(0)}ms`);
      console.log(`   • Throughput: ${jmeterData.summary.overallThroughput.toFixed(2)} req/s`);
      console.log(`   • Error Rate: ${jmeterData.summary.errorRate.toFixed(2)}%`);
      console.log(`   • SLA Status: ${jmeterData.slaResults.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log('');
      console.log(`📂 Open report: ${finalOutputPath}`);
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ Error generating report:');
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        console.error(`   File not found: ${options.input}`);
        console.error('   Please check the file path and try again.');
      } else if (error.message.includes('No valid samples')) {
        console.error('   No valid test data found in the file.');
        console.error('   Please ensure the file contains JMeter results with required columns.');
      } else if (error.message.includes('XML parsing failed')) {
        console.error('   Invalid XML format in JTL file.');
        console.error('   Please ensure the file is a valid JMeter results file.');
      } else if (error.message.includes('Cannot find package')) {
        console.error('   Missing required dependencies.');
        console.error('   Please run: npm install');
      } else {
        console.error(`   ${error.message}`);
      }
    } else {
      console.error('   Unknown error occurred');
    }
    
    console.error('');
    console.error('💡 Tips:');
    console.error('   • Ensure the file is a valid JMeter .jtl or .csv file');
    console.error('   • Check that the file contains the required columns: timeStamp, elapsed, label, success');
    console.error('   • Verify file permissions and path');
    console.error('   • Run "npm install" to ensure all dependencies are installed');
    console.error('');
    
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

main();