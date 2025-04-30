
import * as XLSX from 'xlsx';

type ExportableData = Record<string, any>[];

export const exportToExcel = (data: ExportableData, fileName: string = 'export') => {
  // Create a new workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  // Generate the Excel file and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const formatProductsForExport = (products: any[]) => {
  return products.map(product => ({
    'Name': product.name,
    'Category': product.category || '',
    'Price': product.price,
    'Stock': product.stock,
    'Unit': product.unitType || 'piece',
    'SKU': product.sku || '',
    'Barcode': product.barcode || ''
  }));
};
