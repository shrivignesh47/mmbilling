import React from 'react';
import { Trash2 } from 'lucide-react';

interface ModernTemplateProps {
  data: any[];
  isEditing: boolean;
  onDeleteRow?: (index: number) => void;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ data, isEditing, onDeleteRow }) => {
  // Calculate totals from Excel data
  const calculateTotals = () => {
    if (!data || data.length === 0) return {
      grossAmount: 0,
      discount: 0,
      additionalCharges: 0,
      roundOff: 0,
      netAmount: 0
    };

    const firstItem = data[0];
    return {
      grossAmount: parseFloat(firstItem['Gross Amount'] || '0'),
      discount: parseFloat(firstItem['Discount'] || '0'),
      additionalCharges: parseFloat(firstItem['Additional Charges'] || '0'),
      roundOff: parseFloat(firstItem['Round Off'] || '0'),
      netAmount: parseFloat(firstItem['Net Amount'] || '0')
    };
  };

  const totals = calculateTotals();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get supplier info from first row
  const supplierInfo = data && data.length > 0 ? {
    name: data[0]['Supplier'] || '',
    gstNo: data[0]['GST No'] || '',
    state: data[0]['State'] || '',
    address: data[0]['Address'] || '',
    city: data[0]['City'] || '',
    pincode: data[0]['Pincode'] || '',
    contactPerson: data[0]['Contact Person'] || '',
    contact: data[0]['Contact'] || '',
    email: data[0]['Email'] || ''
  } : null;

  // Get invoice info from first row
  const invoiceInfo = data && data.length > 0 ? {
    billNo: data[0]['Bill No'] || '',
    purchaseDate: data[0]['Purchase Date'] || '',
    dueDate: data[0]['Due Date'] || '',
    paymentStatus: data[0]['Payment Status'] || '',
    creditDays: data[0]['Credit Days'] || ''
  } : null;

  return (
    <div className="w-full bg-white invoice-template" id="modern-template">
      {/* Header with accent color */}
      <div className={`p-6 bg-indigo-600 text-white rounded-t-lg ${isEditing ? 'border border-dashed border-gray-300' : ''}`}>
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="mb-4 md:mb-0">
            <h3 contentEditable={isEditing} className="text-2xl font-bold mb-2">
              {supplierInfo?.name}
            </h3>
            <div className="text-indigo-100">
              <p contentEditable={isEditing}>GST No: {supplierInfo?.gstNo}</p>
              <p contentEditable={isEditing}>{supplierInfo?.address}</p>
              <p contentEditable={isEditing}>{supplierInfo?.city}, {supplierInfo?.state} - {supplierInfo?.pincode}</p>
              <p contentEditable={isEditing}>Contact: {supplierInfo?.contact}</p>
              <p contentEditable={isEditing}>Email: {supplierInfo?.email}</p>
            </div>
          </div>
          
          <div className="bg-white text-indigo-600 p-4 rounded-lg">
            <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-indigo-400">Bill No:</span>
              <span contentEditable={isEditing} className="font-medium">{invoiceInfo?.billNo}</span>
              
              <span className="text-indigo-400">Purchase Date:</span>
              <span contentEditable={isEditing} className="font-medium">{invoiceInfo?.purchaseDate}</span>
              
              <span className="text-indigo-400">Due Date:</span>
              <span contentEditable={isEditing} className="font-medium">{invoiceInfo?.dueDate}</span>

              <span className="text-indigo-400">Credit Days:</span>
              <span contentEditable={isEditing} className="font-medium">{invoiceInfo?.creditDays}</span>

              <span className="text-indigo-400">Payment Status:</span>
              <span contentEditable={isEditing} className="font-medium">{invoiceInfo?.paymentStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className={`p-6 ${isEditing ? 'border border-dashed border-gray-300' : ''}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-indigo-200">
              {isEditing && <th className="py-3 px-2"></th>}
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">Product Name</th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">Category</th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">Qty</th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">Unit Type</th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">MRP</th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">Stock Price</th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">Selling Price</th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                {isEditing && (
                  <td className="py-3 px-2">
                    <button
                      onClick={() => {
                        // Prevent deleting the first row (index 0)
                        if (index > 0) onDeleteRow?.(index);
                      }}
                      className={`text-red-500 hover:text-red-700 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={index === 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
                <td className="py-3 px-4" contentEditable={isEditing}>{item['Product Name']}</td>
                <td className="py-3 px-4" contentEditable={isEditing}>{item['Category']}</td>
                <td className="py-3 px-4" contentEditable={isEditing}>{item['Stock']}</td>
                <td className="py-3 px-4" contentEditable={isEditing}>{item['Unit Type']}</td>
                <td className="py-3 px-4" contentEditable={isEditing}>
                  {formatCurrency(parseFloat(item['MRP'] || '0'))}
                </td>
                <td className="py-3 px-4" contentEditable={isEditing}>
                  {formatCurrency(parseFloat(item['Stock Price'] || '0'))}
                </td>
                <td className="py-3 px-4" contentEditable={isEditing}>
                  {formatCurrency(parseFloat(item['Selling Price'] || '0'))}
                </td>
                <td className="py-3 px-4" contentEditable={isEditing}>
                  {formatCurrency(parseFloat(item['Stock']) * parseFloat(item['Selling Price'] || '0'))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className={`p-6 flex justify-end ${isEditing ? 'border border-dashed border-gray-300' : ''}`}>
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Gross Amount:</span>
            <span className="font-medium">{formatCurrency(totals.grossAmount)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Discount:</span>
            <span className="font-medium">{formatCurrency(totals.discount)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Additional Charges:</span>
            <span className="font-medium">{formatCurrency(totals.additionalCharges)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Round Off:</span>
            <span className="font-medium">{formatCurrency(totals.roundOff)}</span>
          </div>
          <div className="flex justify-between py-3 text-lg font-bold text-indigo-600">
            <span>Net Amount:</span>
            <span>{formatCurrency(totals.netAmount)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className={`p-6 bg-indigo-50 rounded-b-lg ${isEditing ? 'border border-dashed border-gray-300' : ''}`}>
        <h4 className="font-semibold text-indigo-700 mb-2">Notes</h4>
        <p contentEditable={isEditing} className="text-gray-700">
          Thank you for your business. Please make payment within the specified credit days.
        </p>
      </div>
    </div>
  );
};

export default ModernTemplate;