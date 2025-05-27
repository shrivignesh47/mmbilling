import React from 'react';

interface BusinessTemplateProps {
  data: any[];
  isEditing: boolean;
  onDeleteRow?: (index: number) => void; // <-- Add this line
}

const BusinessTemplate: React.FC<BusinessTemplateProps> = ({ data, isEditing, onDeleteRow }) => {
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
    return new Intl.NumberFormat('en-US', {
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
    <div className="w-full p-6 bg-white invoice-template" id="business-template">
      {/* Header with company and invoice info */}
      <div className={`mb-6 ${isEditing ? 'border border-dashed border-gray-300 p-3 rounded' : ''}`}>
        <div className="flex flex-col md:flex-row justify-between items-start mb-10">
          <div className="mb-4 md:mb-0">
            <div>
              <h3 contentEditable={isEditing} className="text-xl font-bold text-gray-800 mb-2">
                {supplierInfo?.name}
              </h3>
              <p contentEditable={isEditing} className="text-gray-600">
                GST No: {supplierInfo?.gstNo}
              </p>
              <p contentEditable={isEditing} className="text-gray-600">
                {supplierInfo?.address}
              </p>
              <p contentEditable={isEditing} className="text-gray-600">
                {supplierInfo?.city}, {supplierInfo?.state} - {supplierInfo?.pincode}
              </p>
              <p contentEditable={isEditing} className="text-gray-600">
                Contact: {supplierInfo?.contact}
              </p>
              <p contentEditable={isEditing} className="text-gray-600">
                Email: {supplierInfo?.email}
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h1 className="text-2xl font-bold text-blue-700 mb-2">INVOICE</h1>
            <div className="grid grid-cols-2 gap-x-4 text-sm">
              <span className="text-gray-600">Bill No:</span>
              <span contentEditable={isEditing} className="font-medium text-right">
                {invoiceInfo?.billNo}
              </span>
              
              <span className="text-gray-600">Purchase Date:</span>
              <span contentEditable={isEditing} className="font-medium text-right">
                {invoiceInfo?.purchaseDate}
              </span>
              
              <span className="text-gray-600">Due Date:</span>
              <span contentEditable={isEditing} className="font-medium text-right">
                {invoiceInfo?.dueDate}
              </span>

              <span className="text-gray-600">Credit Days:</span>
              <span contentEditable={isEditing} className="font-medium text-right">
                {invoiceInfo?.creditDays}
              </span>

              <span className="text-gray-600">Payment Status:</span>
              <span contentEditable={isEditing} className="font-medium text-right">
                {invoiceInfo?.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className={`mb-8 ${isEditing ? 'border border-dashed border-gray-300 p-3 rounded' : ''}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {isEditing && <th></th>}
              <th className="py-3 px-4 text-left text-gray-700 font-semibold border-b border-gray-200">
                Product Name
              </th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold border-b border-gray-200">
                Category
              </th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold border-b border-gray-200">
                Qty
              </th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold border-b border-gray-200">
                Unit Type
              </th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold border-b border-gray-200">
                MRP
              </th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold border-b border-gray-200">
                Stock Price
              </th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold border-b border-gray-200">
                Selling Price
              </th>
              <th className="py-3 px-4 text-left text-gray-700 font-semibold border-b border-gray-200">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {isEditing && (
                  <td>
                    <button
                      onClick={() => onDeleteRow?.(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      &#10005;
                    </button>
                  </td>
                )}
                <td className="py-3 px-4 border-b border-gray-200" contentEditable={isEditing}>
                  {item['Product Name']}
                </td>
                <td className="py-3 px-4 border-b border-gray-200" contentEditable={isEditing}>
                  {item['Category']}
                </td>
                <td className="py-3 px-4 border-b border-gray-200" contentEditable={isEditing}>
                  {item['Stock']}
                </td>
                <td className="py-3 px-4 border-b border-gray-200" contentEditable={isEditing}>
                  {item['Unit Type']}
                </td>
                <td className="py-3 px-4 border-b border-gray-200" contentEditable={isEditing}>
                  {formatCurrency(parseFloat(item['MRP'] || '0'))}
                </td>
                <td className="py-3 px-4 border-b border-gray-200" contentEditable={isEditing}>
                  {formatCurrency(parseFloat(item['Stock Price'] || '0'))}
                </td>
                <td className="py-3 px-4 border-b border-gray-200" contentEditable={isEditing}>
                  {formatCurrency(parseFloat(item['Selling Price'] || '0'))}
                </td>
                <td className="py-3 px-4 border-b border-gray-200" contentEditable={isEditing}>
                  {formatCurrency(parseFloat(item['Stock']) * parseFloat(item['Selling Price'] || '0'))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className={`mb-8 flex justify-end ${isEditing ? 'border border-dashed border-gray-300 p-3 rounded' : ''}`}>
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
          <div className="flex justify-between py-3 text-lg font-bold">
            <span>Net Amount:</span>
            <span>{formatCurrency(totals.netAmount)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className={`mt-10 pt-4 border-t border-gray-200 ${isEditing ? 'border border-dashed border-gray-300 p-3 rounded' : ''}`}>
        <h4 className="font-semibold mb-2">Notes</h4>
        <p contentEditable={isEditing} className="text-gray-600 mb-4">
          Thank you for your business. Please make payment within the specified credit days.
        </p>
      </div>
    </div>
  );
};

export default BusinessTemplate;