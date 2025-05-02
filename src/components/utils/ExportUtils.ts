
import * as XLSX from 'xlsx';

type ExportableData = Record<string, any>[];

export const exportToExcel = (data: ExportableData, fileName: string = 'export') => {
  // Create a new workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-size columns for better readability
  const colWidths = [];
  for (const row of data) {
    Object.entries(row).forEach(([k, v], i) => {
      const width = Math.max(
        k.length, 
        v !== null && v !== undefined ? String(v).length : 0
      );
      colWidths[i] = Math.max(colWidths[i] || 0, width);
    });
  }
  
  // Apply column widths if possible
  if (worksheet['!cols']) {
    worksheet['!cols'] = colWidths.map(w => ({ width: w + 2 }));
  }
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  // Generate the Excel file and trigger download
  XLSX.writeFile(workbook, `${fileName}-${formatDateForFilename()}.xlsx`);
};

// Helper to format date for filename
const formatDateForFilename = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export const formatCashierActivityForExport = (cashiers: any[]) => {
  return cashiers.map(cashier => {
    const loginDate = cashier.last_login ? new Date(cashier.last_login) : null;
    const logoutDate = cashier.last_logout ? new Date(cashier.last_logout) : null;
    
    return {
      'Name': cashier.name || 'Unknown',
      'Email': cashier.email || 'N/A',
      'Last Login Date': loginDate ? loginDate.toLocaleDateString() : 'Not logged in',
      'Last Login Time': loginDate ? loginDate.toLocaleTimeString() : 'Not logged in',
      'Last Logout Date': logoutDate ? logoutDate.toLocaleDateString() : 'Not logged out',
      'Last Logout Time': logoutDate ? logoutDate.toLocaleTimeString() : 'Not logged out',
      'Working Hours': calculateWorkingHours(loginDate, logoutDate),
      'Daily Sales': `$${cashier.daily_sales?.toFixed(2) || '0.00'}`,
      'Daily Transactions': cashier.daily_transactions || 0
    };
  });
};

// Calculate working hours between login and logout times
const calculateWorkingHours = (loginDate: Date | null, logoutDate: Date | null) => {
  if (!loginDate || !logoutDate) return 'N/A';
  
  const diffMs = logoutDate.getTime() - loginDate.getTime();
  if (diffMs < 0) return 'Invalid (logout before login)';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};
