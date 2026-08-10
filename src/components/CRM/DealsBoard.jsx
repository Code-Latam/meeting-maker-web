import React, { useState, useEffect, useCallback } from 'react';
import { crmService } from '../../services/crm';
import { useUIStore } from '../../store';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import DealModal from './DealModal';
import CreateDealModal from './CreateDealModal';
import ManageTypesModal from './ManageTypesModal';

const stageConfig = {
  lead: { label: 'Lead', color: '#2563eb', order: 0 },
  discovery: { label: 'Discovery', color: '#7c3aed', order: 1 },
  proposal: { label: 'Proposal', color: '#d97706', order: 2 },
  closed_won: { label: 'Closed Won', color: '#059669', order: 3 },
  closed_lost: { label: 'Closed Lost', color: '#dc2626', order: 4 }
};

const stageOrder = ['lead', 'discovery', 'proposal', 'closed_won', 'closed_lost'];

export default function DealsBoard() {
  const { showToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState({});
  const [dealTypes, setDealTypes] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false);

  // Load deals
  const loadDeals = useCallback(async () => {
    setLoading(true);
    const result = await crmService.getDealsBoard(filter);
    if (result.success) {
      setDeals(result.data || {});
    } else {
      showToast(result.error || 'Failed to load deals', 'error');
    }
    setLoading(false);
  }, [filter, showToast]);

  // Load deal types
  const loadDealTypes = useCallback(async () => {
    const result = await crmService.getDealTypes();
    if (result.success) {
      setDealTypes(result.types || []);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDealTypes();
    loadDeals();
  }, [loadDeals, loadDealTypes]);

  // Handle move deal
  const handleMoveDeal = async (e, dealId, newStage) => {
    e.stopPropagation();
    e.preventDefault();
    
    let currentDeal = null;
    let currentStage = null;
    for (const stage of stageOrder) {
      const found = (deals[stage] || []).find(d => d._id === dealId);
      if (found) {
        currentDeal = found;
        currentStage = stage;
        break;
      }
    }

    if (!currentDeal) {
      showToast('Deal not found', 'error');
      return;
    }

    if (currentStage === newStage) {
      return;
    }

    if (currentStage === 'closed_won' && newStage !== 'closed_won' && newStage !== 'closed_lost') {
      if (currentDeal.commissionStatus === 'paid') {
        showToast('🔒 Cannot move this deal. The commission has been paid and the deal is locked.', 'error');
        return;
      }
      
      const commissionStatus = currentDeal.commissionStatus || 'pending';
      const confirmMove = window.confirm(
        `⚠️ This deal is currently in "Closed Won" with a ${commissionStatus} commission.\n\n` +
        `Moving it to "${stageConfig[newStage].label}" will VOID the commission and invoice.\n\n` +
        `Are you sure you want to continue?`
      );
      if (!confirmMove) {
        return;
      }
    }

    if (currentStage !== 'closed_won' && newStage === 'closed_won') {
      if (currentDeal.commissionStatus === 'paid') {
        showToast('This deal already has a paid commission. Cannot close again.', 'error');
        return;
      }
    }

    const result = await crmService.moveDealStage(dealId, newStage);
    if (result.success) {
      showToast(`Deal moved to ${stageConfig[newStage].label}`, 'success');
      await loadDeals();
    } else {
      showToast(result.error || 'Failed to move deal', 'error');
    }
  };

  // Handle edit deal
  const handleEditDeal = (deal) => {
    setSelectedDeal(deal);
    setIsEditModalOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async (dealId, updates) => {
    const result = await crmService.updateDeal(dealId, updates);
    if (result.success) {
      showToast('Deal updated successfully', 'success');
      setIsEditModalOpen(false);
      setSelectedDeal(null);
      await loadDeals();
    } else {
      showToast(result.error || 'Failed to update deal', 'error');
    }
  };

  // Handle create deal
  const handleCreateDeal = async (dealData) => {
    const result = await crmService.createDeal(dealData);
    if (result.success) {
      showToast('Deal created successfully', 'success');
      setIsCreateModalOpen(false);
      await loadDeals();
    } else {
      showToast(result.error || 'Failed to create deal', 'error');
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Apply filter
  useEffect(() => {
    loadDeals();
  }, [filter]);

  // Calculate totals
  const calculateStageTotal = (stageDeals) => {
    if (!stageDeals || stageDeals.length === 0) return 0;
    return stageDeals.reduce((total, deal) => total + (deal.dealSize || 0), 0);
  };

  const calculateStageWeightedTotal = (stageDeals) => {
    if (!stageDeals || stageDeals.length === 0) return 0;
    return stageDeals.reduce((total, deal) => {
      const probability = (deal.probability || 10) / 100;
      return total + ((deal.dealSize || 0) * probability);
    }, 0);
  };

  const getDealTypeName = (typeId) => {
    if (!typeId) return null;
    const type = dealTypes.find(t => t._id === typeId);
    return type ? type.name : null;
  };

  const getDealTypeColor = (typeId) => {
    if (!typeId) return null;
    const type = dealTypes.find(t => t._id === typeId);
    return type ? type.color : null;
  };

  // Get move buttons
  const getMoveButtons = (currentStage, dealId) => {
    const currentIndex = stageOrder.indexOf(currentStage);
    let buttons = [];

    if (currentIndex > 0) {
      const prevStage = stageOrder[currentIndex - 1];
      buttons.push(
        <button
          key="prev"
          onClick={(e) => handleMoveDeal(e, dealId, prevStage)}
          className="flex-1 px-2 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors cursor-pointer min-h-[36px]"
        >
          ← {stageConfig[prevStage].label}
        </button>
      );
    }

    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      buttons.push(
        <button
          key="next"
          onClick={(e) => handleMoveDeal(e, dealId, nextStage)}
          className="flex-1 px-2 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors cursor-pointer min-h-[36px]"
        >
          {stageConfig[nextStage].label} →
        </button>
      );
    }

    if (buttons.length === 0) {
      return <span className="text-xs text-gray-400">End of pipeline</span>;
    }

    return buttons;
  };

  // Check if a deal is locked (paid commission)
  const isDealLocked = (deal) => {
    return deal.commissionStatus === 'paid';
  };

  // Render a deal card
  const renderDealCard = (deal, stageKey) => {
    const firstName = deal.personId?.firstName || '';
    const lastName = deal.personId?.lastName || '';
    const fullName = deal.personId?.fullName || '';
    const personName = fullName || `${firstName} ${lastName}`.trim() || 'Unknown';
    const companyName = deal.companyId?.name || '';
    const locked = isDealLocked(deal);

    const pendingAction = deal.actions?.find(a => a.status === 'pending');
    const dealTypeName = getDealTypeName(deal.dealType);
    const dealTypeColor = getDealTypeColor(deal.dealType);

    return (
      <div
        key={deal._id}
        className={`bg-white rounded-lg border border-gray-200 p-3 mb-2 shadow-sm hover:shadow-md transition-all cursor-pointer touch-manipulation ${
          locked ? 'opacity-60 border-red-200' : 'hover:border-primary-300 active:scale-[0.98]'
        }`}
        onClick={() => !locked && handleEditDeal(deal)}
      >
        <div className="font-semibold text-sm sm:text-base text-gray-800 flex items-center gap-2">
          {deal.name || 'Untitled'}
          {locked && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">🔒</span>
          )}
        </div>
        {personName !== 'Unknown' && (
          <div className="text-xs sm:text-sm text-gray-500 mt-0.5">
            👤 {personName}
          </div>
        )}
        {companyName && (
          <div className="text-xs sm:text-sm text-gray-400">🏢 {companyName}</div>
        )}
        {deal.dealSize && (
          <div className="text-sm sm:text-base font-semibold text-green-600 mt-1">
            ${deal.dealSize.toLocaleString()}
          </div>
        )}
        {dealTypeName && (
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 border"
            style={{ borderColor: dealTypeColor || '#e5e7eb', color: dealTypeColor || '#6b7280' }}
          >
            🏷️ {dealTypeName}
          </span>
        )}
        {pendingAction && (
          <div className="text-xs sm:text-sm text-gray-500 mt-1">📌 {pendingAction.description}</div>
        )}
        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-1" onClick={(e) => e.stopPropagation()}>
          {getMoveButtons(stageKey, deal._id)}
        </div>
        {locked && (
          <div className="text-xs text-red-500 mt-1">🔒 Locked (commission paid)</div>
        )}
      </div>
    );
  };

  // Render a column - Mobile responsive
  const renderColumn = (stageKey) => {
    const config = stageConfig[stageKey];
    const stageDeals = deals[stageKey] || [];
    const stageTotal = calculateStageTotal(stageDeals);
    const stageWeightedTotal = calculateStageWeightedTotal(stageDeals);

    return (
      <div
        key={stageKey}
        className="flex-shrink-0 w-64 sm:w-72 md:w-80 lg:w-72 bg-gray-50 rounded-xl flex flex-col max-h-[70vh]"
      >
        <div
          className="bg-white rounded-t-xl px-3 sm:px-4 py-3 border-b-3 sticky top-0 z-10"
          style={{ borderBottomColor: config.color }}
        >
          <div>
            <h3 className="text-sm sm:text-base font-semibold" style={{ color: config.color }}>
              {config.label}
            </h3>
            <div className="text-xs text-gray-400 mt-0.5">
              {stageDeals.length} deal{stageDeals.length !== 1 ? 's' : ''}
              {stageTotal > 0 && ` | $${stageTotal.toLocaleString()}`}
              {stageWeightedTotal > 0 && ` | 📊 $${stageWeightedTotal.toLocaleString()}`}
            </div>
          </div>
        </div>

        <div className="flex-1 p-2 sm:p-3 overflow-y-auto min-h-[200px]">
          {stageDeals.length === 0 ? (
            <div className="text-center text-gray-400 text-xs sm:text-sm py-8">
              No deals in {config.label}
            </div>
          ) : (
            stageDeals.map((deal) => renderDealCard(deal, stageKey))
          )}
        </div>
      </div>
    );
  };

  // Get total deals count
  const totalDeals = Object.values(deals).reduce((sum, stageDeals) => sum + (stageDeals?.length || 0), 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">📊 Deal Pipeline</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {totalDeals} deals across {stageOrder.length} stages
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={filter}
            onChange={handleFilterChange}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white min-h-[44px]"
          >
            <option value="">All Deal Types</option>
            {dealTypes.map((type) => (
              <option key={type._id} value={type._id} style={{ color: type.color || '#000' }}>
                {type.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-none btn-primary text-sm px-4 py-2 min-h-[44px]"
          >
            + Create
          </button>
          <button
            onClick={() => setIsTypesModalOpen(true)}
            className="flex-1 sm:flex-none btn-secondary text-sm px-4 py-2 min-h-[44px]"
          >
            🏷️
          </button>
          <button
            onClick={loadDeals}
            className="flex-1 sm:flex-none btn-secondary text-sm px-4 py-2 min-h-[44px]"
          >
            🔄
          </button>
        </div>
      </div>

      {/* No Deals */}
      {totalDeals === 0 && (
        <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-4xl sm:text-5xl mb-4">📊</div>
          <p className="text-gray-500 text-sm sm:text-base">No deals found</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 btn-primary text-sm px-4 py-2 min-h-[44px]"
          >
            + Create your first deal
          </button>
        </div>
      )}

      {/* Kanban Board - Horizontal scroll on mobile */}
      {totalDeals > 0 && (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 items-start touch-pan-x">
          {stageOrder.map((stageKey) => renderColumn(stageKey))}
        </div>
      )}

      {/* Modals */}
      <DealModal
        isOpen={isEditModalOpen}
        deal={selectedDeal}
        dealTypes={dealTypes}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDeal(null);
        }}
        onSave={handleSaveEdit}
      />

      <CreateDealModal
        isOpen={isCreateModalOpen}
        dealTypes={dealTypes}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateDeal}
      />

      <ManageTypesModal
        isOpen={isTypesModalOpen}
        dealTypes={dealTypes}
        onClose={() => setIsTypesModalOpen(false)}
        onTypesChange={loadDealTypes}
        onDealsRefresh={loadDeals}
      />

      <style>{`
        .border-b-3 {
          border-bottom-width: 3px;
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
        .touch-pan-x {
          touch-action: pan-x;
        }
        /* Mobile touch feedback */
        @media (max-width: 640px) {
          .btn-primary, .btn-secondary {
            font-size: 12px !important;
            padding: 8px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
