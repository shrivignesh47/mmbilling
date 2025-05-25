import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';
import { toast } from 'sonner';

export interface ProductTemplateRow {
  'Product Name': string;
  'Category': string;
  'SKU': string;
  'Unit Type': string;
  'Stock': number;
  'MRP (₹)': number;
  'Stock Price (₹)': number;
  'Selling Price (₹)': number;
  'Weight Rate': number;
  'GST Percentage': number;
}

export const generateProductExcelTemplate = () => {
  const templateData: ProductTemplateRow[] = [
    {
      'Product Name': 'Sample Product',
      'Category': 'Clothing',
      'SKU': 'SKU123',
      'Unit Type': 'piece',
      'Stock': 100,
      'MRP (₹)': 150,
      'Stock Price (₹)': 120,
      'Selling Price (₹)': 130,
      'Weight Rate': 0,
      'GST Percentage': 18
    },
    {
      'Product Name': 'Sample Vegetable',
      'Category': 'Vegetables',
      'SKU': 'VEG001',
      'Unit Type': 'kg',
      'Stock': 50,
      'MRP (₹)': 80,
      'Stock Price (₹)': 60,
      'Selling Price (₹)': 70,
      'Weight Rate': 70,
      'GST Percentage': 5
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  // Add column widths for better readability
  const wscols = [
    { wch: 20 }, // Product Name
    { wch: 15 }, // Category
    { wch: 10 }, // SKU
    { wch: 10 }, // Unit Type
    { wch: 8 }, // Stock
    { wch: 10 }, // MRP
    { wch: 15 }, // Stock Price
    { wch: 15 }, // Selling Price
    { wch: 12 }, // Weight Rate
    { wch: 15 }, // GST Percentage
  ];
  worksheet['!cols'] = wscols;

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  FileSaver.saveAs(data, 'product_template.xlsx');
  
  toast.success('Template downloaded successfully!');
};