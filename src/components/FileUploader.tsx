import React, { useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parseJMeterFile } from '../utils/jmeterParser';
import { JMeterData } from '../types/jmeter';

interface FileUploaderProps {
  onDataProcessed: (data: JMeterData) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onDataProcessed,
  isProcessing,
  setIsProcessing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const data = await parseJMeterFile(file);
      onDataProcessed(data);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please ensure it\'s a valid JMeter .jtl or .csv file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      fileInputRef.current.files = event.dataTransfer.files;
      handleFileSelect({ target: { files: [file] } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="border-2 border-dashed border-indigo-300 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
            <p className="text-lg font-medium text-gray-700">Processing JMeter file...</p>
            <p className="text-sm text-gray-500">This may take a few moments for large files</p>
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
                Drag and drop your .jtl or .csv file here, or click to browse
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
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
            />
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Supported File Formats</h4>
            <ul className="space-y-2 text-blue-800">
              <li>• <strong>JTL files:</strong> Standard JMeter test results in XML or CSV format</li>
              <li>• <strong>CSV files:</strong> Comma-separated values with JMeter column headers</li>
              <li>• <strong>File size:</strong> Recommended maximum 100MB for optimal performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;