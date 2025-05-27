import React, { useState, useRef } from 'react';
import { Upload, FileWarning, CheckCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onFileUploaded: (data: any[], fileName: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processExcelFile = (file: File) => {
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          setError('The Excel file appears to be empty');
          setIsSuccess(false);
          return;
        }

        setFileName(file.name);
        setIsSuccess(true);
        onFileUploaded(jsonData, file.name);
      } catch (err) {
        setError('Unable to process the Excel file');
        setIsSuccess(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading the file');
      setIsSuccess(false);
    };
    
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        processExcelFile(file);
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
        setIsSuccess(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        processExcelFile(file);
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
        setIsSuccess(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full mb-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : isSuccess 
              ? 'border-green-500 bg-green-50' 
              : error 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          {isSuccess ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-lg font-medium text-green-700">{fileName} uploaded successfully!</p>
              <p className="text-sm text-green-600">Click or drag to upload a different file</p>
            </>
          ) : error ? (
            <>
              <FileWarning className="w-12 h-12 text-red-500" />
              <p className="text-lg font-medium text-red-700">{error}</p>
              <p className="text-sm text-red-600">Click or drag to try again</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              <p className="text-lg font-medium text-gray-700">
                Drag & drop your Excel file here
              </p>
              <p className="text-sm text-gray-500">or click to browse files</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                <span>Supports .xlsx and .xls formats</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;