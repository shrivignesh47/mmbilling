import React, { useState } from 'react';
import FileUploader from '../../components/invoice/FileUploader';
import TemplateSelector from '../../components/invoice/TemplateSelector';
import InvoicePreview from '../../components/invoice/InvoicePreview';
import InvoiceControls from '../../components/invoice/InvoiceControls';
import { Template } from '../../components/invoice/TemplateSelector';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const PurchaseInvoice: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('business');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [step, setStep] = useState<number>(1);

  // Default templates
  const defaultTemplates: Template[] = [
    {
      id: 'business',
      name: 'Business',
      description: 'Professional template for business invoices',
      previewImage: '',
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Clean and modern design with accent colors',
      previewImage: '',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simple and elegant minimalist design',
      previewImage: '',
    },
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional invoice layout with borders',
      previewImage: '',
    },
  ];

  // Combine default and user templates
  const allTemplates = [...defaultTemplates, ...userTemplates];

  // Handle file upload
  const handleFileUploaded = (data: any[], fileName: string) => {
    setInvoiceData(data);
    setFileName(fileName);
    setStep(2);
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStep(3);
  };

  // Toggle edit mode
  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Reset to start
  const handleReset = () => {
    setInvoiceData([]);
    setFileName('');
    setSelectedTemplate('business');
    setIsEditing(false);
    setStep(1);
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    const newData = [...invoiceData];
    newData.splice(index, 1);
    setInvoiceData(newData);
  };

  // Save template
  const handleSaveTemplate = () => {
    if (templateName.trim() === '') return;
    
    const newTemplate: Template = {
      id: `user-${Date.now()}`,
      name: templateName,
      description: 'Custom user template',
      previewImage: 'https://images.pexels.com/photos/5483077/pexels-photo-5483077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    };
    
    setUserTemplates([...userTemplates, newTemplate]);
    setTemplateName('');
  };

  // Create new template
  const handleCreateTemplate = () => {
    setIsEditing(true);
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const input = document.getElementById(
      selectedTemplate === 'business' ? 'business-template' :
      selectedTemplate === 'modern' ? 'modern-template' :
      selectedTemplate === 'minimal' ? 'minimal-template' :
      'classic-template'
    );
    
    if (!input) return;
    
    const originalDisplay = input.style.display;
    const originalHeight = input.style.height;
    const originalWidth = input.style.width;
    
    input.style.display = 'block';
    input.style.width = '800px';
    input.style.height = 'auto';
    
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Invoice-${fileName.split('.')[0] || 'document'}.pdf`);
      
      input.style.display = originalDisplay;
      input.style.height = originalHeight;
      input.style.width = originalWidth;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Generator</h1>
          <p className="mt-2 text-gray-600">
            Generate professional invoices from your Excel data
          </p>
        </div>
        
        {step >= 1 && invoiceData.length === 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload Excel File</h2>
            <FileUploader onFileUploaded={handleFileUploaded} />
          </div>
        )}
        
        {step >= 2 && invoiceData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4">Select Template</h2>
            <TemplateSelector 
              templates={allTemplates} 
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
            />
          </div>
        )}
        
        {step >= 3 && invoiceData.length > 0 && (
          <>
            <InvoiceControls
              onReset={handleReset}
              onSaveTemplate={handleSaveTemplate}
              onCreateTemplate={handleCreateTemplate}
              templateName={templateName}
              setTemplateName={setTemplateName}
              canSave={templateName.trim() !== ''}
            />
            
            <InvoicePreview
              invoiceData={invoiceData}
              selectedTemplate={selectedTemplate}
              templates={allTemplates}
              isEditing={isEditing}
              onToggleEdit={handleToggleEdit}
              onDownloadPDF={handleDownloadPDF}
              onDeleteRow={handleDeleteRow}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PurchaseInvoice;