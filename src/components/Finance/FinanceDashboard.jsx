import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmService } from '../../services/crm';
import { useUIStore } from '../../store';
import { LoadingSpinner } from '../Common/LoadingSpinner';

export function FinanceDashboard() {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState(null);
  const [paying, setPaying] = useState(false);

  const loadFinanceData = useCallback(async () => {
    setLoading(true);
    const result = await crmService.getFinanceDashboard();
    if (result.success) {
      setFinanceData(result.data);
    } else {
      showToast(result.error || 'Failed to load finance data', 'error');
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const handlePayNow = async () => {
    setPaying(true);
    const result = await crmService.createCheckoutSession();
    setPaying(false);
    
    if (result.success && result.url) {
      // Open Stripe Checkout in new tab
      window.open(result.url, '_blank');
      showToast(`Redirecting to payment... ($${result.amount?.toFixed(2) || '0.00'})`, 'success');
      // Refresh data after payment
      setTimeout(loadFinanceData, 3000);
    } else {
      showToast(result.error || 'Failed to initiate payment', 'error');
    }
  };

  // ✅ FIXED: Use React Router navigation with invoice ID
  const handleViewInvoice = (invoiceId) => {
    if (!invoiceId) {
      showToast('No invoice ID found', 'error');
      return;
    }
    // Open invoice page using React Router in a new tab
    const url = `/invoice?id=${invoiceId}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!financeData) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">💰</div>
        <p className="text-gray-500">No finance data available</p>
        <button
          onClick={loadFinanceData}
          className="mt-4 btn-secondary text-sm"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  // Check if user is on subscription model
  const isSubscription = financeData.billingModel === 'subscription';

  if (isSubscription) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-blue-800">You're on a Subscription Plan</h3>
        <p className="text-blue-700 mt-2">
          Your billing is handled automatically via your subscription. No commission tracking is available.
        </p>
      </div>
    );
  }

  const hasOutstanding = financeData.outstandingBalance > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Outstanding Balance</div>
          <div className={`text-2xl font-bold mt-1 ${hasOutstanding ? 'text-red-600' : 'text-green-600'}`}>
            ${financeData.outstandingBalance?.toLocaleString() || '0'}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Paid to Date</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            ${financeData.totalPaid?.toLocaleString() || '0'}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Fixed Fee Per Deal</div>
          <div className="text-2xl font-bold text-gray-700 mt-1">
            ${financeData.fixedSuccessFee?.toLocaleString() || '0'}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Deals Closed This Month</div>
          <div className="text-2xl font-bold text-primary-600 mt-1">
            {financeData.dealsClosedThisMonth || 0}
          </div>
        </div>
      </div>

      {/* Pay Now Button */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handlePayNow}
          disabled={!hasOutstanding || paying}
          className={`btn-primary px-6 py-2.5 text-sm min-h-[44px] ${
            !hasOutstanding ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {paying ? '⏳ Processing...' : hasOutstanding ? `💳 Pay Outstanding Balance ($${financeData.outstandingBalance.toLocaleString()})` : '💳 No Outstanding Balance'}
        </button>
        {!hasOutstanding && (
          <span className="text-sm text-gray-500">You have no pending commissions to pay</span>
        )}
        {hasOutstanding && (
          <span className="text-sm text-gray-500">Click to pay all pending commissions</span>
        )}
      </div>

      {/* Commission History Table */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">Commission History</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {!financeData.commissions || financeData.commissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p>No commissions yet. Deals you close will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Deal</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Closed Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Due Date</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {financeData.commissions.map((commission, index) => {
                    const statusClass = {
                      'pending': 'bg-yellow-100 text-yellow-700',
                      'paid': 'bg-green-100 text-green-700',
                      'in_transit': 'bg-blue-100 text-blue-700',
                      'voided': 'bg-gray-100 text-gray-500',
                      'refunded': 'bg-red-100 text-red-700'
                    }[commission.status] || 'bg-gray-100 text-gray-700';

                    const statusLabel = {
                      'pending': 'Pending',
                      'paid': 'Paid',
                      'in_transit': 'In Transit',
                      'voided': 'Voided',
                      'refunded': 'Refunded'
                    }[commission.status] || commission.status;

                    const dueDate = commission.closedAt 
                      ? new Date(new Date(commission.closedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
                      : null;

                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {commission.dealName || 'Untitled'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          ${commission.amount?.toLocaleString() || '0'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {commission.closedAt ? new Date(commission.closedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {dueDate ? dueDate.toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {commission.invoiceId ? (
                            <button
                              onClick={() => handleViewInvoice(commission.invoiceId)}
                              className="text-primary-600 hover:text-primary-700 hover:underline text-sm font-medium"
                            >
                              View Invoice
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}