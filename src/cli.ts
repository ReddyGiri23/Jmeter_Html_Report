#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename, extname } from 'path';
import { parseJMeterFile } from './utils/jmeterParser.js';
import { generateHTMLReport } from './utils/reportGenerator.js';

interface CLIOptions {
  input: string;
  output?: string;
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

Usage: npm run generate-report -- -i <input-file> [-o <output-file>]

Options:
  -i, --input <file>    Path to JMeter JTL/CSV file (required)
  -o, --output <file>   Output HTML file path (optional)
  -h, --help           Show this help message

Examples:
  npm run generate-report -- -i ./test-results.jtl
  npm run generate-report -- -i ./results.csv -o ./custom-report.html
  npm run generate-report -- --input ./load-test.jtl --output ./performance-report.html

Default output: jmeter-report-[timestamp].html in current directory
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

const main = async () => {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  if (options.help || args.length === 0) {
    showHelp();
    process.exit(0);
  }
  
  if (!options.input) {
    console.error('❌ Error: Input file is required');
    console.error('Use -h or --help for usage information');
    process.exit(1);
  }
  
  try {
    const inputPath = resolve(options.input);
    const outputPath = generateOutputPath(inputPath, options.output);
    
    console.log('🚀 JMeter HTML Report Generator');
    console.log(`📁 Input file: ${inputPath}`);
    console.log(`📄 Output file: ${outputPath}`);
    console.log('');
    
    // Check if input file exists
    console.log('📖 Reading JTL file...');
    const fileContent = readFileSync(inputPath, 'utf-8');
    
    // Create a File-like object for the parser
    const file = {
      name: basename(inputPath),
      size: fileContent.length,
      text: async () => fileContent
    } as File;
    
    console.log('⚙️  Processing JMeter data...');
    const jmeterData = await parseJMeterFile(file);
    
    console.log('📊 Generating HTML report...');
    const htmlReport = generateHTMLReport(jmeterData);
    
    console.log('💾 Saving HTML report...');
    writeFileSync(outputPath, htmlReport, 'utf-8');
    
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
    console.log(`📂 Open report: ${outputPath}`);
    
  } catch (error) {
    console.error('');
    console.error('❌ Error generating report:');
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error(`   File not found: ${options.input}`);
        console.error('   Please check the file path and try again.');
      } else if (error.message.includes('No valid samples')) {
        console.error('   No valid test data found in the file.');
        console.error('   Please ensure the file contains JMeter results with required columns.');
      } else if (error.message.includes('XML parsing failed')) {
        console.error('   Invalid XML format in JTL file.');
        console.error('   Please ensure the file is a valid JMeter results file.');
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