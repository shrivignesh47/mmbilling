import React from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

interface InvoiceControlsProps {
  onReset: () => void;
  onSaveTemplate: () => void;
  onCreateTemplate: () => void;
  templateName: string;
  setTemplateName: (name: string) => void;
  canSave: boolean;
}

const InvoiceControls: React.FC<InvoiceControlsProps> = ({
  onReset,
  onSaveTemplate,
  onCreateTemplate,
  templateName,
  setTemplateName,
  canSave,
}) => {
  return (
    <div className="w-full mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <button
            onClick={onReset}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span>Start Over</span>
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={onSaveTemplate}
              disabled={!canSave}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                canSave
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </button>
            
            <button
              onClick={onCreateTemplate}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceControls;