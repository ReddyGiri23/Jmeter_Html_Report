import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, GitCompare, CheckCircle, XCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { parseJMeterFile } from '../utils/jmeterParser';
import { compareJMeterResults } from '../utils/comparisonAnalyzer';
import { JMeterData, ComparisonResult } from '../types/jmeter';

interface ComparisonUploaderProps {
  onComparisonComplete: (result: ComparisonResult) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

interface ComparisonSettings {
  thresholds: {
    improvement: number;
    regression: number;
    significant: number;
  };
  analysisOptions: {
    includeNeutral: boolean;
    minSampleSize: number;
    focusMetrics: string[];
  };
}

const ComparisonUploader: React.FC<ComparisonUploaderProps> = ({
  onComparisonComplete,
  isProcessing,
  setIsProcessing
}) => {
  const currentFileRef = useRef<HTMLInputElement>(null);
  const previousFileRef = useRef<HTMLInputElement>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [previousFile, setPreviousFile] = useState<File | null>(null);
  const [currentData, setCurrentData] = useState<JMeterData | null>(null);
  const [previousData, setPreviousData] = useState<JMeterData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragStates, setDragStates] = useState({ current: false, previous: false });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [settings, setSettings] = useState<ComparisonSettings>({
    thresholds: {
      improvement: -5, // 5% improvement
      regression: 5,   // 5% regression
      significant: 10  // 10% significant change
    },
    analysisOptions: {
      includeNeutral: true,
      minSampleSize: 10, // Minimum samples per transaction
      focusMetrics: ['avgResponseTime', 'p90ResponseTime', 'throughput', 'errorRate']
    }
  });

  const handleFileSelect = async (file: File, type: 'current' | 'previous') => {
    if (!file) return;

    // Clear previous validation errors
    setValidationErrors([]);

    // Validate file format
    const validExtensions = ['.jtl', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      setValidationErrors([`Invalid file format. Please use ${validExtensions.join(' or ')} files.`]);
      return;
    }

    // Validate file size (warn for very large files)
    if (file.size > 200 * 1024 * 1024) { // > 200MB
      setValidationErrors([`Large file detected (${(file.size / 1024 / 1024).toFixed(1)}MB). Processing may take several minutes.`]);
    }

    setIsProcessing(true);
    try {
      const data = await parseJMeterFile(file);
      
      // Validate data quality
      if (data.samples.length < settings.analysisOptions.minSampleSize) {
        setValidationErrors([`File contains only ${data.samples.length} samples. Minimum ${settings.analysisOptions.minSampleSize} samples recommended for reliable comparison.`]);
      }

      if (type === 'current') {
        setCurrentFile(file);
        setCurrentData(data);
      } else {
        setPreviousFile(file);
        setPreviousData(data);
      }
    } catch (error) {
      console.error(`Error processing ${type} file:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setValidationErrors([`Error processing ${type} file: ${errorMessage}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateCompatibility = (): string[] => {
    const errors: string[] = [];
    
    if (!currentData || !previousData) return errors;

    // Check if files have overlapping transactions
    const currentLabels = new Set(currentData.transactions.map(t => t.label));
    const previousLabels = new Set(previousData.transactions.map(t => t.label));
    const commonLabels = [...currentLabels].filter(label => previousLabels.has(label));
    
    if (commonLabels.length === 0) {
      errors.push('No common transactions found between files. Comparison requires matching transaction names.');
    } else if (commonLabels.length < 3) {
      errors.push(`Only ${commonLabels.length} common transactions found. More transactions recommended for meaningful comparison.`);
    }

    // Check test duration similarity
    const durationDiff = Math.abs(currentData.summary.testDuration - previousData.summary.testDuration);
    const avgDuration = (currentData.summary.testDuration + previousData.summary.testDuration) / 2;
    if (durationDiff / avgDuration > 0.5) { // > 50% difference
      errors.push('Test durations differ significantly. This may affect comparison accuracy.');
    }

    return errors;
  };

  const handleCurrentFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file, 'current');
  };

  const handlePreviousFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file, 'previous');
  };

  const handleCompare = () => {
    if (!currentData || !previousData || !currentFile || !previousFile) return;

    // Final validation before comparison
    const compatibilityErrors = validateCompatibility();
    if (compatibilityErrors.length > 0) {
      setValidationErrors(compatibilityErrors);
      return;
    }

    setIsProcessing(true);
    try {
      const comparisonResult = compareJMeterResults(
        currentData,
        previousData,
        currentFile.name,
        previousFile.name
      );
      onComparisonComplete(comparisonResult);
    } catch (error) {
      console.error('Error comparing files:', error);
      setValidationErrors(['Error comparing files. Please ensure both files have compatible formats and contain valid test data.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, type: 'current' | 'previous') => {
    event.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
    const file = event.dataTransfer.files[0];
    if (file) handleFileSelect(file, type);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, type: 'current' | 'previous') => {
    event.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: true }));
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>, type: 'current' | 'previous') => {
    event.preventDefault();
    setDragStates(prev => ({ ...prev, [type]: false }));
  };

  const canCompare = currentData && previousData && !isProcessing;
  const hasErrors = validationErrors.length > 0;

  const FileUploadCard = ({ 
    type, 
    title, 
    data, 
    file, 
    fileRef, 
    onChange, 
    colorClass 
  }: {
    type: 'current' | 'previous';
    title: string;
    data: JMeterData | null;
    file: File | null;
    fileRef: React.RefObject<HTMLInputElement>;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    colorClass: string;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {data && (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Ready
          </div>
        )}
      </div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragStates[type]
            ? `${colorClass.replace('300', '500')} bg-opacity-10 scale-105`
            : data 
              ? 'border-green-300 bg-green-50' 
              : `${colorClass} hover:border-opacity-80`
        }`}
        onDrop={(e) => handleDrop(e, type)}
        onDragOver={(e) => handleDragOver(e, type)}
        onDragLeave={(e) => handleDragLeave(e, type)}
      >
        {data ? (
          <div className="space-y-3">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <p className="font-medium text-green-800">{file?.name}</p>
              <div className="text-sm text-green-600 space-y-1 mt-2">
                <p>{data.summary.totalRequests.toLocaleString()} requests</p>
                <p>{data.transactions.length} unique transactions</p>
                <p>Duration: {data.summary.testDuration}s</p>
                <div className="flex justify-center space-x-4 text-xs">
                  <span>Avg: {data.summary.avgResponseTime.toFixed(0)}ms</span>
                  <span>Errors: {data.summary.errorRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-green-600 hover:text-green-700 underline"
            >
              Choose different file
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className={`h-12 w-12 mx-auto ${colorClass.includes('indigo') ? 'text-indigo-500' : 'text-orange-500'}`} />
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">{title}</p>
              <p className="text-sm text-gray-600 mb-4">
                {dragStates[type] ? 'Drop your file here!' : 'Drag and drop your .jtl or .csv file here'}
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  colorClass.includes('indigo') 
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
                    : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Browse Files
              </button>
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".jtl,.csv"
        onChange={onChange}
        className="hidden"
        aria-label={`Upload ${title.toLowerCase()}`}
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <GitCompare className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Compare JMeter Test Results</h2>
        <p className="text-gray-600">
          Upload two JMeter result files to compare performance metrics side-by-side
        </p>
      </div>

      {/* Validation Errors */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-2">Validation Issues</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FileUploadCard
          type="current"
          title="Current Test File"
          data={currentData}
          file={currentFile}
          fileRef={currentFileRef}
          onChange={handleCurrentFileChange}
          colorClass="border-indigo-300"
        />
        <FileUploadCard
          type="previous"
          title="Previous/Baseline Test File"
          data={previousData}
          file={previousFile}
          fileRef={previousFileRef}
          onChange={handlePreviousFileChange}
          colorClass="border-orange-300"
        />
      </div>

      {/* Progressive Disclosure: Advanced Settings */}
      {(currentData || previousData) && (
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-expanded={showAdvanced}
          >
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-gray-600 mr-2" />
              <span className="font-medium text-gray-900">Comparison Settings</span>
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
              {/* Threshold Settings */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Change Thresholds</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="improvement-threshold" className="block text-sm font-medium text-gray-700 mb-1">
                      Improvement Threshold (%)
                    </label>
                    <input
                      id="improvement-threshold"
                      type="number"
                      min="-50"
                      max="0"
                      value={settings.thresholds.improvement}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        thresholds: {
                          ...prev.thresholds,
                          improvement: parseInt(e.target.value) || -5
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Negative values (e.g., -5 = 5% improvement)</p>
                  </div>
                  <div>
                    <label htmlFor="regression-threshold" className="block text-sm font-medium text-gray-700 mb-1">
                      Regression Threshold (%)
                    </label>
                    <input
                      id="regression-threshold"
                      type="number"
                      min="0"
                      max="50"
                      value={settings.thresholds.regression}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        thresholds: {
                          ...prev.thresholds,
                          regression: parseInt(e.target.value) || 5
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Positive values (e.g., 5 = 5% regression)</p>
                  </div>
                  <div>
                    <label htmlFor="min-samples" className="block text-sm font-medium text-gray-700 mb-1">
                      Min Samples per Transaction
                    </label>
                    <input
                      id="min-samples"
                      type="number"
                      min="1"
                      max="1000"
                      value={settings.analysisOptions.minSampleSize}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        analysisOptions: {
                          ...prev.analysisOptions,
                          minSampleSize: parseInt(e.target.value) || 10
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Exclude transactions with fewer samples</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compare Button */}
      <div className="text-center">
        <button
          onClick={handleCompare}
          disabled={!canCompare || hasErrors}
          className={`inline-flex items-center px-8 py-3 text-lg font-medium rounded-md transition-colors ${
            canCompare && !hasErrors
              ? 'text-white bg-indigo-600 hover:bg-indigo-700'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
              Comparing...
            </>
          ) : (
            <>
              <GitCompare className="h-5 w-5 mr-3" />
              Compare Performance
            </>
          )}
        </button>
        {canCompare && !hasErrors && (
          <p className="text-sm text-gray-600 mt-2">
            Ready to compare {currentData?.transactions.length} and {previousData?.transactions.length} transactions
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Comparison Guidelines</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800">
              <div>
                <p className="font-medium mb-2">📊 What We Compare:</p>
                <ul className="text-sm space-y-1">
                  <li>• Average & 90th percentile response times</li>
                  <li>• Throughput (requests per second)</li>
                  <li>• Error rates and success percentages</li>
                  <li>• Transaction-level performance changes</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">🎯 Best Practices:</p>
                <ul className="text-sm space-y-1">
                  <li>• Use tests with similar duration and load</li>
                  <li>• Ensure transaction names match exactly</li>
                  <li>• Include at least 10+ samples per transaction</li>
                  <li>• Compare tests from same environment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonUploader;