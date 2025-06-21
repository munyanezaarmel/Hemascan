import React from 'react';
import { Check } from 'lucide-react';

interface QualityChecklistProps {
  checks: {
    goodLighting: boolean;
    properDistance: boolean;
    eyelidOpen: boolean;
    inFocus: boolean;
    whiteBalance: boolean;
  };
  onCheckChange: (check: keyof QualityChecklistProps['checks'], value: boolean) => void;
}

const QualityChecklist: React.FC<QualityChecklistProps> = ({ checks, onCheckChange }) => {
  const checkItems = [
    { key: 'goodLighting' as const, label: 'Good Lighting', aiVerified: checks.goodLighting },
    { key: 'properDistance' as const, label: 'Proper Distance', aiVerified: checks.properDistance },
    { key: 'eyelidOpen' as const, label: 'Eyelid Open', aiVerified: checks.eyelidOpen },
    { key: 'inFocus' as const, label: 'In Focus', aiVerified: checks.inFocus },
    { key: 'whiteBalance' as const, label: 'White Lighting/White Balance OK', aiVerified: checks.whiteBalance },
  ];

  const allChecksComplete = Object.values(checks).every(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">Quality Assessment</h3>
        {allChecksComplete && (
          <div className="flex items-center space-x-2 text-green-600">
            <Check size={20} />
            <span className="font-semibold">All checks passed!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checkItems.map((item) => (
          <div
            key={item.key}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              checks[item.key] 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onCheckChange(item.key, !checks[item.key])}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  checks[item.key]
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {checks[item.key] && <Check size={16} />}
              </button>
              
              <div className="flex-1">
                <label className="font-medium text-gray-800 cursor-pointer">
                  {item.label}
                </label>
                {item.aiVerified && (
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-xs text-blue-600 font-medium">AI Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Overall Quality Score:</span>
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  allChecksComplete ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${(Object.values(checks).filter(Boolean).length / 5) * 100}%` }}
              ></div>
            </div>
            <span className="font-bold text-gray-800">
              {Object.values(checks).filter(Boolean).length}/5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityChecklist;
