import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, GitCompare } from 'lucide-react';
import { parseJMeterFile } from '../utils/jmeterParser';
import { compareJMeterResults } from '../utils/comparisonAnalyzer';
import { JMeterData, ComparisonResult } from '../types/jmeter';

interface ComparisonUploaderProps {
  onComparisonComplete: (result: ComparisonResult) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
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

  const handleFileSelect = async (file: File, type: 'current' | 'previous') => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const data = await parseJMeterFile(file);
      
      if (type === 'current') {
        setCurrentFile(file);
        setCurrentData(data);
      } else {
        setPreviousFile(file);
        setPreviousData(data);
      }
    } catch (error) {
      console.error(`Error processing ${type} file:`, error);
      alert(`Error processing ${type} file. Please ensure it's a valid JMeter .jtl or .csv file.`);
    } finally {
      setIsProcessing(false);
    }
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
      alert('Error comparing files. Please ensure both files have compatible formats.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, type: 'current' | 'previous') => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) handleFileSelect(file, type);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const canCompare = currentData && previousData && !isProcessing;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <GitCompare className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Compare JMeter Test Results</h2>
        <p className="text-gray-600">
          Upload two JMeter result files to compare performance metrics side-by-side
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Test File */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Test File</h3>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              currentData 
                ? 'border-green-300 bg-green-50' 
                : 'border-indigo-300 hover:border-indigo-400'
            }`}
            onDrop={(e) => handleDrop(e, 'current')}
            onDragOver={handleDragOver}
          >
            {currentData ? (
              <div className="space-y-3">
                <FileText className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <p className="font-medium text-green-800">{currentFile?.name}</p>
                  <p className="text-sm text-green-600">
                    {currentData.summary.totalRequests.toLocaleString()} requests processed
                  </p>
                  <p className="text-xs text-green-500">
                    Avg: {currentData.summary.avgResponseTime.toFixed(0)}ms | 
                    Errors: {currentData.summary.errorRate.toFixed(2)}%
                  </p>
                </div>
                <button
                  onClick={() => currentFileRef.current?.click()}
                  className="text-sm text-green-600 hover:text-green-700 underline"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-indigo-500 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">Upload Current Test</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop your latest .jtl or .csv file here
                  </p>
                  <button
                    onClick={() => currentFileRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Files
                  </button>
                </div>
              </div>
            )}
          </div>
          <input
            ref={currentFileRef}
            type="file"
            accept=".jtl,.csv"
            onChange={handleCurrentFileChange}
            className="hidden"
          />
        </div>

        {/* Previous Test File */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Previous/Baseline Test File</h3>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              previousData 
                ? 'border-green-300 bg-green-50' 
                : 'border-orange-300 hover:border-orange-400'
            }`}
            onDrop={(e) => handleDrop(e, 'previous')}
            onDragOver={handleDragOver}
          >
            {previousData ? (
              <div className="space-y-3">
                <FileText className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <p className="font-medium text-green-800">{previousFile?.name}</p>
                  <p className="text-sm text-green-600">
                    {previousData.summary.totalRequests.toLocaleString()} requests processed
                  </p>
                  <p className="text-xs text-green-500">
                    Avg: {previousData.summary.avgResponseTime.toFixed(0)}ms | 
                    Errors: {previousData.summary.errorRate.toFixed(2)}%
                  </p>
                </div>
                <button
                  onClick={() => previousFileRef.current?.click()}
                  className="text-sm text-green-600 hover:text-green-700 underline"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-orange-500 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">Upload Baseline Test</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop your baseline .jtl or .csv file here
                  </p>
                  <button
                    onClick={() => previousFileRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Files
                  </button>
                </div>
              </div>
            )}
          </div>
          <input
            ref={previousFileRef}
            type="file"
            accept=".jtl,.csv"
            onChange={handlePreviousFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Compare Button */}
      <div className="text-center">
        <button
          onClick={handleCompare}
          disabled={!canCompare}
          className={`inline-flex items-center px-8 py-3 text-lg font-medium rounded-md transition-colors ${
            canCompare
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
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Comparison Guidelines</h4>
            <ul className="space-y-2 text-blue-800">
              <li>• <strong>Current Test:</strong> Your latest test results to analyze</li>
              <li>• <strong>Baseline Test:</strong> Previous test results to compare against</li>
              <li>• <strong>Metrics Compared:</strong> Average response time, 90th percentile, throughput, error rate</li>
              <li>• <strong>Color Coding:</strong> Green = improvement, Red = regression, Gray = neutral</li>
              <li>• <strong>Thresholds:</strong> ±5% change triggers improvement/regression status</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonUploader;