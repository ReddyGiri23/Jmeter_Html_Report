import React, { useRef } from 'react';
import { Upload, FileText, AlertCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { parseJMeterFile } from '../utils/jmeterParser';
import { JMeterData } from '../types/jmeter';

interface FileUploaderProps {
  onDataProcessed: (data: JMeterData) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface AdvancedSettings {
  slaThresholds: {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  reportOptions: {
    includeCharts: boolean;
    maxErrorSamples: number;
    samplingRate: number;
  };
  testConfig: {
    testEnvironment: string;
  };
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onDataProcessed,
  isProcessing,
  setIsProcessing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [fileName, setFileName] = React.useState<string>('');
  const [fileSize, setFileSize] = React.useState<number>(0);
  const [dragActive, setDragActive] = React.useState(false);
  const [settings, setSettings] = React.useState<AdvancedSettings>({
    slaThresholds: {
      avgResponseTime: 3000, // Smart default: 3 seconds
      throughput: 0.03055, // Smart default: 110 TPH = 110/3600 req/s
      errorRate: 10 // Smart default: 10%
    },
    reportOptions: {
      includeCharts: true, // Smart default: include charts
      maxErrorSamples: 200, // Smart default: 200 errors
      samplingRate: 2 // Smart default: every 2nd sample
    },
    testConfig: {
      testEnvironment: 'PPE02' // Smart default: PPE02 environment
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);

    // Auto-adjust sampling rate for large files
    if (file.size > 50 * 1024 * 1024) { // > 50MB
      setSettings(prev => ({
        ...prev,
        reportOptions: {
          ...prev.reportOptions,
          samplingRate: 10 // Increase sampling for large files
        }
      }));
    }

    setIsProcessing(true);
    try {
      const reportOptions = {
        slaThresholds: settings.slaThresholds,
        reportOptions: settings.reportOptions,
        testConfig: settings.testConfig
      };
      const data = await parseJMeterFile(file, undefined, reportOptions);
      onDataProcessed(data);
    } catch (error) {
      console.error('Error processing file:', error);
      // Better error handling with specific messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('No valid samples')) {
        alert('No valid test data found. Please check that your file contains JMeter results with the required columns (timeStamp, elapsed, label, success).');
      } else if (errorMessage.includes('XML parsing failed')) {
        alert('Invalid XML format. Please ensure your .jtl file is properly formatted.');
      } else {
        alert(`Error processing file: ${errorMessage}\n\nPlease ensure it's a valid JMeter .jtl or .csv file.`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      fileInputRef.current.files = event.dataTransfer.files;
      handleFileSelect({ target: { files: [file] } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50 scale-105' 
            : 'border-indigo-300 hover:border-indigo-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
            <p className="text-lg font-medium text-gray-700">Processing JMeter file...</p>
            {fileName && (
              <div className="text-sm text-gray-500 space-y-1">
                <p>File: {fileName}</p>
                <p>Size: {formatFileSize(fileSize)}</p>
                <p>This may take a few moments for large files</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto h-16 w-16 text-indigo-500">
              <Upload className="h-full w-full" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload JMeter Results File
              </h3>
              <p className="text-gray-600 mb-4">
                {dragActive ? 'Drop your file here!' : 'Drag and drop your .jtl or .csv file here, or click to browse'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <FileText className="h-5 w-5 mr-2" />
                Choose File
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jtl,.csv"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload JMeter results file"
            />
          </div>
        )}
      </div>

      {/* Progressive Disclosure: Advanced Settings */}
      <div className="mt-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-expanded={showAdvanced}
        >
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-gray-600 mr-2" />
            <span className="font-medium text-gray-900">Advanced Settings</span>
            <span className="ml-2 text-sm text-gray-500">(Optional)</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg space-y-6">
            {/* SLA Thresholds Group */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">SLA Thresholds</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="avg-response-time-threshold" className="block text-sm font-medium text-gray-700 mb-1">
                    Avg Response Time (ms)
                  </label>
                  <input
                    id="avg-response-time-threshold"
                    type="number"
                    min="100"
                    max="30000"
                    value={settings.slaThresholds.avgResponseTime}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      slaThresholds: {
                        ...prev.slaThresholds,
                        avgResponseTime: parseInt(e.target.value) || 3000
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="3000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 1000-5000ms</p>
                </div>
                <div>
                  <label htmlFor="throughput-threshold" className="block text-sm font-medium text-gray-700 mb-1">
                    Min Throughput (TPH)
                  </label>
                  <input
                    id="throughput-threshold"
                    type="number"
                    min="0.1"
                    max="10000"
                    step="0.1"
                    value={(settings.slaThresholds.throughput * 3600).toFixed(1)}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      slaThresholds: {
                        ...prev.slaThresholds,
                        throughput: (parseFloat(e.target.value) || 110) / 3600
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="110"
                  />
                  <p className="text-xs text-gray-500 mt-1">Transactions per hour</p>
                </div>
                <div>
                  <label htmlFor="error-threshold" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Error Rate (%)
                  </label>
                  <input
                    id="error-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.slaThresholds.errorRate}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      slaThresholds: {
                        ...prev.slaThresholds,
                        errorRate: parseInt(e.target.value) || 10
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 5-10%</p>
                </div>
              </div>
            </div>

            {/* Report Options Group */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Report Options</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="include-charts"
                    type="checkbox"
                    checked={settings.reportOptions.includeCharts}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      reportOptions: {
                        ...prev.reportOptions,
                        includeCharts: e.target.checked
                      }
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="include-charts" className="ml-2 block text-sm text-gray-900">
                    Include performance charts in HTML report
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="max-errors" className="block text-sm font-medium text-gray-700 mb-1">
                      Max Error Samples
                    </label>
                    <select
                      id="max-errors"
                      value={settings.reportOptions.maxErrorSamples}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        reportOptions: {
                          ...prev.reportOptions,
                          maxErrorSamples: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={25}>25 errors</option>
                      <option value={50}>50 errors</option>
                      <option value={100}>100 errors</option>
                      <option value={200}>200 errors</option>
                      <option value={500}>500 errors</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sampling-rate" className="block text-sm font-medium text-gray-700 mb-1">
                      Chart Sampling Rate
                    </label>
                    <select
                      id="sampling-rate"
                      value={settings.reportOptions.samplingRate}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        reportOptions: {
                          ...prev.reportOptions,
                          samplingRate: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={1}>Every sample</option>
                      <option value={2}>Every 2nd sample</option>
                      <option value={5}>Every 5th sample</option>
                      <option value={10}>Every 10th sample</option>
                      <option value={50}>Every 50th sample</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Higher values = faster processing</p>
                  </div>
                </div>
                
                {/* Test Configuration */}
                <div>
                  <label htmlFor="test-environment" className="block text-sm font-medium text-gray-700 mb-1">
                    Test Environment
                  </label>
                  <input
                    id="test-environment"
                    type="text"
                    value={settings.testConfig.testEnvironment}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      testConfig: {
                        ...prev.testConfig,
                        testEnvironment: e.target.value || 'PPE02'
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="PPE02"
                  />
                  <p className="text-xs text-gray-500 mt-1">Environment where test was executed</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Quick Start Guide</h4>
            <div className="space-y-3 text-blue-800">
              <div>
                <p className="font-medium">✓ Supported Formats:</p>
                <p className="text-sm ml-4">JTL files (XML/CSV) and CSV files with JMeter headers</p>
              </div>
              <div>
                <p className="font-medium">✓ Required Columns:</p>
                <p className="text-sm ml-4">timeStamp, elapsed, label, success (responseCode optional)</p>
              </div>
              <div>
                <p className="font-medium">✓ File Size:</p>
                <p className="text-sm ml-4">Up to 100MB recommended. Larger files auto-adjust sampling.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

      {/* Improved Help Section */}
export default FileUploader;