import React from 'react';
import { FileText, GitCompare, Menu, X, Home, HelpCircle } from 'lucide-react';

interface NavigationProps {
  activeTab: 'single' | 'comparison';
  onTabChange: (tab: 'single' | 'comparison') => void;
  hasData: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, hasData }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    {
      id: 'single' as const,
      label: 'Single Report',
      icon: FileText,
      description: 'Generate report from one test file'
    },
    {
      id: 'comparison' as const,
      label: 'Comparison',
      icon: GitCompare,
      description: 'Compare two test runs'
    }
  ];

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 transition-colors"
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
                <span className="font-semibold hidden sm:inline">JMeter Reports</span>
              </button>

              <div className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === item.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      aria-current={activeTab === item.id ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="text-gray-600 hover:text-gray-900 transition-colors hidden sm:flex items-center space-x-1"
                aria-label="Help"
                title="Keyboard shortcuts: Alt+1 (Single Report), Alt+2 (Comparison), Esc (Reset)"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="text-sm">Help</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-sm ${activeTab === item.id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <HelpCircle className="h-5 w-5" />
                <span className="font-medium">Help & Documentation</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {hasData && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-blue-700">
                <span className="font-medium">Workflow:</span>
                <span className="text-blue-600">Upload</span>
                <span className="text-blue-400">→</span>
                <span className="font-semibold text-blue-800">View Results</span>
                <span className="text-blue-400">→</span>
                <span className="text-blue-600">Download Report</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
