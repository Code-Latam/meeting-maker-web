import React, { useState, useEffect } from 'react';
import { crmService } from '../../services/crm';
import { useUIStore } from '../../store';
import { ActivityDetailModal } from '../Activity/ActivityDetailModal';

export function TasksTab() {
  const { showToast } = useUIStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    const result = await crmService.getAllDeals();
    setLoading(false);

    if (!result.success) {
      showToast(result.error || 'Failed to load tasks', 'error');
      return;
    }

    const flattened = (result.deals || []).flatMap((deal) =>
      (deal.actions || [])
        .map((action, index) => ({ ...action, index, deal }))
        .filter((a) => a.status === 'pending')
    );

    flattened.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    setTasks(flattened);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const markComplete = async (e, task) => {
    e.stopPropagation();
    const deal = task.deal;
    const updatedActions = (deal.actions || []).map((a, i) =>
      i === task.index ? { ...a, status: 'completed' } : a
    );
    const result = await crmService.updateDeal(deal._id, { actions: updatedActions });
    if (result.success) {
      showToast('Task marked complete', 'success');
      await loadTasks();
    } else {
      showToast(result.error || 'Failed to update task', 'error');
    }
  };

  const openPerson = (task) => {
    const person = task.deal.personId;
    const activity = {
      personId: person?._id || person,
      person: person,
      personName: person?.fullName || `${person?.firstName || ''} ${person?.lastName || ''}`.trim(),
      personTitle: person?.title || '',
      personCompany: person?.companyName || '',
      personType: person?.personType || 'prospect',
      assignedAgentId: person?.assignedAgentId || null,
      groupId: person?.groupId || null,
      channelPreference: person?.channelPreference || 'linkedin',
      channel: 'linkedin',
    };
    setSelectedPerson(activity);
    setIsOpen(true);
  };

  const formatDate = (d) => {
    if (!d) return 'No due date';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? String(d).slice(0, 10) : dt.toLocaleDateString();
  };

  const isOverdue = (d) => {
    if (!d) return false;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dt < today;
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading tasks...</div>;
  }

  return (
    <>
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500">No pending tasks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, i) => {
            const person = task.deal.personId;
            const personName =
              person?.fullName || `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || 'Unknown';
            const overdue = isOverdue(task.dueDate);

            return (
              <div
                key={i}
                onClick={() => openPerson(task)}
                className="bg-white rounded-lg border border-gray-200 p-3 flex items-start justify-between gap-3 cursor-pointer hover:border-primary-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{task.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {personName} · {task.deal.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      {overdue ? 'Overdue: ' : 'Due: '}
                      {formatDate(task.dueDate)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                      {task.deal.stage || 'lead'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => markComplete(e, task)}
                  className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
                >
                  Mark Complete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedPerson && (
        <ActivityDetailModal
          isOpen={isOpen}
          activity={selectedPerson}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
