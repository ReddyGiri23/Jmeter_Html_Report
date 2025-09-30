import { useState } from 'react';
import { Upload, FileText, Download, GitCompare } from 'lucide-react';
import FileUploader from './components/FileUploader';
import ReportDashboard from './components/ReportDashboard';
import ComparisonUploader from './components/ComparisonUploader';
import ComparisonDashboard from './components/ComparisonDashboard';
import { JMeterData, ComparisonResult } from './types/jmeter';

function App() {
  const [jmeterData, setJMeterData] = useState<JMeterData | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'comparison'>('single');

  const handleDataProcessed = (data: JMeterData) => {
    setJMeterData(data);
  };

  const handleComparisonComplete = (result: ComparisonResult) => {
    setComparisonResult(result);
  };

  const handleReset = () => {
    setJMeterData(null);
    setComparisonResult(null);
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
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-500">
            <span className="flex items-center">
              <Upload className="h-4 w-4 mr-1" />
              Single Report
            </span>
            <span className="flex items-center">
              <GitCompare className="h-4 w-4 mr-1" />
              Performance Comparison
            </span>
            <span className="flex items-center">
              <Download className="h-4 w-4 mr-1" />
              Jenkins Compatible
            </span>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 flex">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'single'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Single Report
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GitCompare className="h-4 w-4 inline mr-2" />
              Comparison
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'single' ? (
          !jmeterData ? (
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
          )
        ) : (
          !comparisonResult ? (
            <ComparisonUploader
              onComparisonComplete={handleComparisonComplete}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          ) : (
            <ComparisonDashboard
              comparisonResult={comparisonResult}
              onReset={handleReset}
            />
          )
        )}
      </div>
    </div>
  );
}

export default App;