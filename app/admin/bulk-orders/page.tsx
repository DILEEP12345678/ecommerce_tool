'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';

export default function BulkOrdersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [creatingUsers, setCreatingUsers] = useState(false);
  const createBulkOrders = useMutation(api.orders.createBulkOrders);
  const createTestUsers = useMutation(api.users.createTestUsers);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const orders: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());

      if (values.length < headers.length) continue;

      const order: any = {
        userEmail: '',
        items: [],
        deliveryAddress: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
        },
        paymentMethod: 'Cash on Delivery',
        status: 'pending',
        notes: '',
      };

      headers.forEach((header, index) => {
        const value = values[index];
        switch (header.toLowerCase()) {
          case 'email':
          case 'user_email':
          case 'useremail':
            order.userEmail = value;
            break;
          case 'product':
          case 'product_name':
          case 'productname':
            order.items.push({
              productName: value,
              quantity: 1,
            });
            break;
          case 'quantity':
          case 'qty':
            if (order.items.length > 0) {
              order.items[order.items.length - 1].quantity = parseInt(value) || 1;
            }
            break;
          case 'street':
          case 'address':
            order.deliveryAddress.street = value;
            break;
          case 'city':
            order.deliveryAddress.city = value;
            break;
          case 'state':
            order.deliveryAddress.state = value;
            break;
          case 'zipcode':
          case 'zip_code':
          case 'zip':
          case 'pincode':
            order.deliveryAddress.zipCode = value;
            break;
          case 'payment':
          case 'payment_method':
          case 'paymentmethod':
            order.paymentMethod = value;
            break;
          case 'status':
            order.status = value;
            break;
          case 'notes':
            order.notes = value;
            break;
        }
      });

      if (order.userEmail && order.items.length > 0) {
        orders.push(order);
      }
    }

    return orders;
  };

  const handleUpload = async () => {
    if (!file) return;

    setProcessing(true);
    setResult(null);

    try {
      const text = await file.text();
      const orders = parseCSV(text);

      if (orders.length === 0) {
        throw new Error('No valid orders found in CSV file');
      }

      const response = await createBulkOrders({ orders });
      setResult(response);
    } catch (error: any) {
      setResult({
        success: 0,
        failed: 1,
        errors: [error.message],
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateTestUsers = async () => {
    setCreatingUsers(true);
    try {
      const response = await createTestUsers();
      alert(response.message);
    } catch (error: any) {
      alert('Error creating test users: ' + error.message);
    } finally {
      setCreatingUsers(false);
    }
  };

  const downloadTemplate = () => {
    const template = `email,product_name,quantity,street,city,state,zipcode,payment_method,status,notes
user@example.com,Fresh Bananas,2,123 Main St,Mumbai,Maharashtra,400001,Cash on Delivery,pending,Sample order
user@example.com,Organic Tomatoes,1,123 Main St,Mumbai,Maharashtra,400001,Cash on Delivery,pending,Sample order`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_orders_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Order Import</h1>
        <p className="text-gray-500">Upload a CSV file to create multiple orders</p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          CSV Format Instructions
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>Your CSV file should include the following columns:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>email</strong> - User email address (required)</li>
            <li><strong>product_name</strong> - Product name (required)</li>
            <li><strong>quantity</strong> - Quantity to order (default: 1)</li>
            <li><strong>street</strong> - Delivery street address (required)</li>
            <li><strong>city</strong> - City (required)</li>
            <li><strong>state</strong> - State (required)</li>
            <li><strong>zipcode</strong> - ZIP/Postal code (required)</li>
            <li><strong>payment_method</strong> - Payment method (optional)</li>
            <li><strong>status</strong> - Order status (optional, default: pending)</li>
            <li><strong>notes</strong> - Order notes (optional)</li>
          </ul>
          <p className="mt-3">
            <strong>Note:</strong> Users must already exist in the system. Multiple rows with the same email
            will create separate orders.
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template CSV
          </button>
          <button
            onClick={handleCreateTestUsers}
            disabled={creatingUsers}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
          >
            {creatingUsers ? 'Creating...' : 'Create Test Users'}
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Upload CSV File</h3>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
          >
            Select CSV File
          </label>
          {file && (
            <p className="mt-4 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {file && (
          <button
            onClick={handleUpload}
            disabled={processing}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
          >
            {processing ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Import Orders
              </>
            )}
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Import Results</h3>

          <div className="space-y-4">
            {result.success > 0 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">
                    {result.success} order(s) created successfully
                  </p>
                </div>
              </div>
            )}

            {result.failed > 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-2">
                    {result.failed} order(s) failed
                  </p>
                  {result.errors && result.errors.length > 0 && (
                    <ul className="text-sm text-red-800 space-y-1">
                      {result.errors.map((error: string, index: number) => (
                        <li key={index} className="list-disc list-inside">
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
