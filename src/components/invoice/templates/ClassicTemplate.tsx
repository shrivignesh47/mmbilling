import React from 'react';

interface ClassicTemplateProps {
  data: any[];
  isEditing: boolean;
  onDeleteRow?: (index: number) => void;
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ data, isEditing, onDeleteRow }) => {
  // Extract supplier info from first row
  const supplierInfo = data && data.length > 0 ? {
    name: data[0]['Supplier'] || '',
    address: data[0]['Address'] || '',
    city: data[0]['City'] || '',
    pincode: data[0]['Pincode'] || '',
    contact: data[0]['Contact'] || '',
    email: data[0]['Email'] || ''
  } : null;

  // Extract invoice info from first row
  const invoiceInfo = data && data.length > 0 ? {
    billNo: data[0]['Bill No'] || '',
    purchaseDate: data[0]['Purchase Date'] || '',
    dueDate: data[0]['Due Date'] || ''
  } : null;

  // Calculate totals
  const calculateTotals = () => {
    if (!data || data.length === 0) return {
      subtotal: 0,
      tax: 0,
      total: 0
    };

    let subtotal = 0;

    data.forEach((item, index) => {
      if (index === 0) return; // Skip header row

      const quantity = parseFloat(item['Stock']) || 0;
      const price = parseFloat(item['Selling Price']) || 0;
      subtotal += quantity * price;
    });

    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="w-full bg-white invoice-template font-serif" id="classic-template">
      {/* Header */}
      <div className={`mb-6 pb-4 border-b border-gray-300 ${isEditing ? 'border-dashed border-gray-400' : ''}`}>
        <div className="flex justify-between items-start">
          {/* Company Info */}
          <div>
            <h2 contentEditable={isEditing} className={`text-xl font-bold mb-1 ${isEditing ? 'border-b border-dashed border-gray-300' : ''}`}>
              {supplierInfo?.name || 'ABC Traders'}
            </h2>
            <p contentEditable={isEditing} className={`text-sm text-gray-700 ${isEditing ? 'border-b border-dashed border-gray-300' : ''}`}>
              {supplierInfo?.address || '123 Market St'}
            </p>
            <p contentEditable={isEditing} className={`text-sm text-gray-700 ${isEditing ? 'border-b border-dashed border-gray-300' : ''}`}>
              {supplierInfo?.city}, {supplierInfo?.pincode}
            </p>
            <p contentEditable={isEditing} className={`text-sm text-gray-700 ${isEditing ? 'border-b border-dashed border-gray-300' : ''}`}>
              Phone: {supplierInfo?.contact || '+91 12345 67890'}
            </p>
            <p contentEditable={isEditing} className={`text-sm text-gray-700 ${isEditing ? 'border-b border-dashed border-gray-300' : ''}`}>
              Email: {supplierInfo?.email || 'abc@traders.com'}
            </p>
          </div>

          {/* Invoice Info */}
          <div className="text-right">
            <h1 contentEditable={isEditing} className={`text-2xl font-bold text-gray-800 mb-1 ${isEditing ? 'border-b border-dashed border-gray-300' : ''}`}>
              INVOICE
            </h1>
            <p contentEditable={isEditing} className={`text-sm text-gray-700 ${isEditing ? 'border-b border-dashed border-gray-300' : ''}`}>
              Bill No: {invoiceInfo?.billNo || 'INV-001'}
            </p>
            <p contentEditable={isEditing} className={`text-sm text-gray-700 ${isEditing ? 'border-b border-dashed border-gray-300' : ''}`}>
              Date: {invoiceInfo?.purchaseDate || '01 Jan 2025'}
            </p>
            <p contentEditable={isEditing} className={`text-sm text-gray-700 ${isEditing ? 'border-b border-dashed border-gray-300' : ''}`}>
              Due Date: {invoiceInfo?.dueDate || '30 Days'}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${isEditing ? 'border border-dashed border-gray-300 p-2' : ''}`}>
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="border-b border-gray-300">
              {isEditing && <th className="py-2 px-2"></th>}
              <th className="py-2 px-2 text-left text-gray-700">Product</th>
              <th className="py-2 px-2 text-left text-gray-700">Qty</th>
              <th className="py-2 px-2 text-left text-gray-700">Unit</th>
              <th className="py-2 px-2 text-left text-gray-700">Price</th>
              <th className="py-2 px-2 text-right text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              // Skip first row if it contains metadata
              if (index === 0) return null;

              const quantity = parseFloat(item['Stock']) || 0;
              const price = parseFloat(item['Selling Price']) || 0;
              const amount = quantity * price;

              return (
                <tr key={index} className="border-b border-gray-200">
                  {isEditing && (
                    <td className="py-2 px-2">
                      <button
                        onClick={() => {
                          if (index > 0) onDeleteRow?.(index);
                        }}
                        className={`text-red-500 hover:text-red-700 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={index === 0}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 0 0-4h-4a2 2 0 0 0-2 2v2"></path>
                          <line x1="9" y1="12" x2="9" y2="16"></line>
                          <line x1="15" y1="12" x2="15" y2="16"></line>
                        </svg>
                      </button>
                    </td>
                  )}
                  <td className="py-2 px-2" contentEditable={isEditing}>{item['Product Name']}</td>
                  <td className="py-2 px-2" contentEditable={isEditing}>{item['Stock']}</td>
                  <td className="py-2 px-2" contentEditable={isEditing}>{item['Unit Type']}</td>
                  <td className="py-2 px-2" contentEditable={isEditing}>
                    {formatCurrency(price)}
                  </td>
                  <td className="py-2 px-2 text-right">{formatCurrency(amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className={`w-64 ml-auto text-right ${isEditing ? 'border border-dashed border-gray-300 p-2 rounded' : ''}`}>
        <div className="flex justify-between mb-1">
          <span className="text-gray-600">Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-600">Tax (18%):</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t border-gray-200">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Notes */}
      <div className={`mt-8 ${isEditing ? 'border border-dashed border-gray-300 p-3 rounded' : ''}`}>
        <h4 className="font-medium text-gray-700 mb-1">Notes</h4>
        <p contentEditable={isEditing} className="text-gray-600 text-sm">
          Thank you for your business. Please make payment within the specified credit days.
        </p>
      </div>
    </div>
  );
};

export default ClassicTemplate;