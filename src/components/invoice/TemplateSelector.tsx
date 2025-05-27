import React from 'react';
import { CheckCircle } from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  previewImage: string;
  description: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
}) => {
  return (
    <div className="w-full mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Choose a Template</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`relative border rounded-lg overflow-hidden transition-all duration-200 cursor-pointer transform hover:-translate-y-1 hover:shadow-md ${
              selectedTemplate === template.id
                ? 'border-blue-500 shadow-md'
                : 'border-gray-200'
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2 z-10">
                <CheckCircle className="w-6 h-6 text-blue-500 bg-white rounded-full" />
              </div>
            )}
            <div className="h-40 bg-gray-100 overflow-hidden">
              <img
                src={template.previewImage}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <h4 className="font-medium text-gray-800">{template.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;