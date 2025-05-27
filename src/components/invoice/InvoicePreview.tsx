import React, { useRef } from 'react';
import { Printer, Download, Edit, Eye } from 'lucide-react';
import { Template } from './TemplateSelector';
import BusinessTemplate from './templates/BusinessTemplate';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ClassicTemplate from './templates/ClassicTemplate';

interface InvoicePreviewProps {
  invoiceData: any[];
  selectedTemplate: string;
  templates: Template[];
  isEditing: boolean;
  onToggleEdit: () => void;
  onDownloadPDF: () => void;
  onDeleteRow?: (index: number) => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoiceData,
  selectedTemplate,
  templates,
  isEditing,
  onToggleEdit,
  onDownloadPDF,
  onDeleteRow,
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'business':
        return <BusinessTemplate data={invoiceData} isEditing={isEditing} onDeleteRow={onDeleteRow} />;
      case 'modern':
        return <ModernTemplate data={invoiceData} isEditing={isEditing} onDeleteRow={onDeleteRow} />;
      case 'minimal':
        return <MinimalTemplate data={invoiceData} isEditing={isEditing} onDeleteRow={onDeleteRow} />;
      case 'classic':
        return <ClassicTemplate data={invoiceData} isEditing={isEditing} onDeleteRow={onDeleteRow} />;
      default:
        return <BusinessTemplate data={invoiceData} isEditing={isEditing} onDeleteRow={onDeleteRow} />;
    }
  };

  const selectedTemplateName = templates.find(t => t.id === selectedTemplate)?.name || 'Invoice';

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {selectedTemplateName} Preview
          </h3>
          <div className="flex space-x-2">
            <button
              className={`flex items-center px-3 py-1.5 rounded text-sm font-medium ${
                isEditing
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={onToggleEdit}
            >
              {isEditing ? (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  View Mode
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Mode
                </>
              )}
            </button>
            <button
              className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-gray-700"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-1" />
              Print
            </button>
            <button
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium text-white"
              onClick={onDownloadPDF}
            >
              <Download className="w-4 h-4 mr-1" />
              Download PDF
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-white" ref={invoiceRef}>
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;