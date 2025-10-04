import { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import FileUploader from './components/FileUploader';
import ReportDashboard from './components/ReportDashboard';
import ComparisonUploader from './components/ComparisonUploader';
import ComparisonDashboard from './components/ComparisonDashboard';
import Navigation from './components/Navigation';
import Breadcrumb from './components/Breadcrumb';
import StepIndicator from './components/StepIndicator';
import KeyboardShortcuts from './components/KeyboardShortcuts';
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

  const handleTabChange = (tab: 'single' | 'comparison') => {
    setActiveTab(tab);
    handleReset();
  };

  const hasData = activeTab === 'single' ? !!jmeterData : !!comparisonResult;

  const getCurrentStep = () => {
    if (activeTab === 'single') {
      return jmeterData ? 1 : 0;
    } else {
      return comparisonResult ? 1 : 0;
    }
  };

  const singleReportSteps = [
    { id: 'upload', label: 'Upload File', description: 'Select JTL/CSV file' },
    { id: 'results', label: 'View Results', description: 'Analyze performance' },
  ];

  const comparisonSteps = [
    { id: 'upload', label: 'Upload Files', description: 'Select two test files' },
    { id: 'results', label: 'Compare Results', description: 'View differences' },
  ];

  const getBreadcrumbItems = () => {
    const items = [{ label: 'Home', onClick: () => handleReset() }];

    if (activeTab === 'single') {
      items.push({ label: 'Single Report' });
      if (jmeterData) {
        items.push({ label: 'Results' });
      }
    } else {
      items.push({ label: 'Comparison' });
      if (comparisonResult) {
        items.push({ label: 'Results' });
      }
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <KeyboardShortcuts
        activeTab={activeTab}
        onTabSwitch={handleTabChange}
        onEscape={handleReset}
      />
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasData={hasData}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Breadcrumb items={getBreadcrumbItems()} />
        </div>

        <header className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {activeTab === 'single' ? 'Single Report Analysis' : 'Performance Comparison'}
            </h1>
            <p className="text-gray-600 mb-6">
              {activeTab === 'single'
                ? 'Generate comprehensive HTML reports from JMeter .jtl/.csv files'
                : 'Compare performance metrics between two test runs'}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
              <span className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                <Upload className="h-4 w-4 mr-1" />
                Easy Upload
              </span>
              <span className="flex items-center bg-green-50 px-3 py-1 rounded-full">
                <Download className="h-4 w-4 mr-1" />
                Jenkins Compatible
              </span>
            </div>

            <StepIndicator
              steps={activeTab === 'single' ? singleReportSteps : comparisonSteps}
              currentStep={getCurrentStep()}
            />
          </div>
        </header>

        <main>
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
        </main>
      </div>
    </div>
  );
}

export default App;