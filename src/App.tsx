import React, { useState } from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import FileUploader from './components/FileUploader';
import ReportDashboard from './components/ReportDashboard';
import { JMeterData } from './types/jmeter';

function App() {
  const [jmeterData, setJMeterData] = useState<JMeterData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDataProcessed = (data: JMeterData) => {
    setJMeterData(data);
  };

  const handleReset = () => {
    setJMeterData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              JMeter Report Generator
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Generate comprehensive HTML reports from JMeter .jtl/.csv files
          </p>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Upload className="h-4 w-4 mr-1" />
              Jenkins Compatible
            </span>
            <span className="flex items-center">
              <Download className="h-4 w-4 mr-1" />
              Self-contained HTML
            </span>
          </div>
        </header>

        {!jmeterData ? (
          <FileUploader 
            onDataProcessed={handleDataProcessed}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        ) : (
          <ReportDashboard 
            data={jmeterData} 
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default App;