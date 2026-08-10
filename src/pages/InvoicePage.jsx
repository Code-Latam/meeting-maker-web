import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { crmService } from '../services/crm';
import { useUIStore } from '../store';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export function InvoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  const invoiceId = searchParams.get('id');

  useEffect(() => {
    const loadInvoice = async () => {
      if (!invoiceId) {
        setError('No invoice ID provided');
        setLoading(false);
        return;
      }

      const result = await crmService.getInvoice(invoiceId);
      if (result.success) {
        setInvoice(result.invoice);
      } else {
        setError(result.error || 'Failed to load invoice');
        showToast(result.error || 'Failed to load invoice', 'error');
      }
      setLoading(false);
    };

    loadInvoice();
  }, [invoiceId, showToast]);

  const handleClose = () => {
    window.close();
    // Fallback if window.close doesn't work
    navigate('/crm');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'draft': { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      'sent': { label: 'Sent', className: 'bg-yellow-100 text-yellow-700' },
      'paid': { label: 'Paid', className: 'bg-green-100 text-green-700' },
      'overdue': { label: 'Overdue', className: 'bg-red-100 text-red-700' },
      'void': { label: 'Void', className: 'bg-gray-100 text-gray-500' }
    };
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Invoice</h2>
          <p className="text-gray-500">{error || 'Invoice not found'}</p>
          <button
            onClick={() => navigate('/crm')}
            className="mt-6 btn-primary"
          >
            Go to CRM
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusBadge(invoice.status);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b-2 border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Invoice</h1>
              <p className="text-sm text-gray-500 mt-1">
                #{invoice.invoiceNumber || invoice._id?.slice(0, 8) || 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Client & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Client</p>
              <p className="text-base font-semibold text-gray-800 mt-1">
                {invoice.clientId?.name || 'Unknown Client'}
              </p>
              <p className="text-sm text-gray-500">
                {invoice.clientId?.email || ''}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Invoice Date</p>
                <p className="text-base text-gray-800 mt-1">{formatDate(invoice.sentAt || invoice.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Due Date</p>
                <p className="text-base text-gray-800 mt-1">{formatDate(invoice.dueDate)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Period</p>
                <p className="text-base text-gray-800 mt-1">
                  {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="py-6 border-b border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Description</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.commissionIds && invoice.commissionIds.length > 0 ? (
                  // If commissions are populated objects
                  typeof invoice.commissionIds[0] === 'object' ? (
                    invoice.commissionIds.map((commission, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">
                          {commission.dealId?.name || 'Commission'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {formatCurrency(commission.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Commissions are just IDs
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-700">
                        Commission for {invoice.commissionIds.length} deal(s)
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                    </tr>
                  )
                ) : (
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-700">Commission</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end pt-6">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(invoice.totalAmount)}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button
              onClick={handleClose}
              className="btn-secondary px-6"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}