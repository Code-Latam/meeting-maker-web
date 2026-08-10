import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export function GroupsPerformancePage() {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [timeframe, setTimeframe] = useState('last_12_months');
  const [groupPerformance, setGroupPerformance] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // Load agents on mount
  useEffect(() => {
    fetchAgents();
  }, []);

  // Load data when agent or timeframe changes
  useEffect(() => {
    if (selectedAgentId) {
      loadGroupsPerformance();
    }
  }, [selectedAgentId, timeframe]);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('https://api.meetingmaker.tech/agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        if (data.agents && data.agents.length > 0) {
          setSelectedAgentId(data.agents[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      showToast('Failed to load agents', 'error');
    }
  };

  const fetchMetric = async (metric, agentId, groupId, timeframeValue) => {
    try {
      const token = localStorage.getItem('jwt');
      const body = {
        metric,
        agentId,
        groupId,
        timeframe: {
          type: 'relative',
          value: timeframeValue
        }
      };
      
      const response = await fetch('https://api.meetingmaker.tech/analytics/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data?.value ?? 0;
      }
      return 0;
    } catch (error) {
      console.error(`Error fetching ${metric}:`, error);
      return 0;
    }
  };

  const fetchGroups = async (agentId) => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`https://api.meetingmaker.tech/people/agent/${agentId}/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.groups || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  };

  const fetchCampaigns = async (agentId) => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(`https://api.meetingmaker.tech/lead-campaigns/campaigns/agent/${agentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.campaigns || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  };

  const fetchGroupMetrics = async (agentId, groupId, timeframeValue) => {
    const metrics = [
      'leads_created',
      'invitations_sent',
      'connections',
      'invitation_to_connection_rate',
      'invitation_to_conversion_rate',
      'connection_to_conversion_rate'
    ];
    
    const results = await Promise.all(
      metrics.map(metric => fetchMetric(metric, agentId, groupId, timeframeValue))
    );
    
    return {
      leads: results[0] || 0,
      invitations: results[1] || 0,
      connections: results[2] || 0,
      inviteToConnectionRate: results[3] || 0,
      inviteToConversionRate: results[4] || 0,
      connectionToConversionRate: results[5] || 0
    };
  };

  const loadGroupsPerformance = async () => {
    if (!selectedAgentId) return;
    
    setLoading(true);
    
    try {
      // Fetch groups and campaigns in parallel
      const [groups, campaignsData] = await Promise.all([
        fetchGroups(selectedAgentId),
        fetchCampaigns(selectedAgentId)
      ]);
      
      setCampaigns(campaignsData);
      
      if (groups.length === 0) {
        setGroupPerformance([]);
        setLoading(false);
        return;
      }
      
      // Create campaign map for lookup
      const campaignMap = new Map();
      campaignsData.forEach(campaign => {
        campaignMap.set(campaign.name.toLowerCase(), campaign);
      });
      
      // Fetch metrics for each group
      const groupPromises = groups.map(group => 
        fetchGroupMetrics(selectedAgentId, group._id, timeframe)
      );
      
      const groupMetrics = await Promise.all(groupPromises);
      
      // Enrich with group names and campaign info
      const enrichedMetrics = groupMetrics.map((metric, index) => {
        const group = groups[index];
        
        let isCampaign = false;
        let groupType = '📁 Manual';
        let campaignStatus = '—';
        let campaignName = null;
        let campaign = null;
        
        if (group.source === 'lead_generation') {
          isCampaign = true;
          groupType = '🎯 Campaign';
          
          // Try to find matching campaign
          campaign = campaignMap.get(group.name.toLowerCase());
          
          if (!campaign) {
            campaign = campaignsData.find(c => 
              group.name.toLowerCase().includes(c.name.toLowerCase())
            );
          }
          
          if (!campaign) {
            campaign = campaignsData.find(c => 
              c.name.toLowerCase().includes(group.name.toLowerCase())
            );
          }
          
          if (campaign) {
            campaignName = campaign.name;
            const rawStatus = campaign.status || 'unknown';
            campaignStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
          } else {
            campaignStatus = '⚠️ Not found';
          }
        }
        
        return {
          ...metric,
          groupId: group._id,
          groupName: group.name || 'Unnamed Group',
          groupType,
          campaignStatus,
          campaignName,
          isCampaign,
          source: group.source
        };
      });
      
      // ✅ FIXED: Sort by Connection to Conversion Rate (Conn → Conv)
      // Groups with 0 connections or 0 leads go to the bottom
      const MIN_LEADS = 5;
      const MIN_CONNECTIONS = 5;
      
      // Separate groups with meaningful data vs small samples
      const meaningfulGroups = enrichedMetrics.filter(g => 
        g.leads >= MIN_LEADS && g.connections >= MIN_CONNECTIONS
      );
      
      const smallSampleGroups = enrichedMetrics.filter(g => 
        g.leads < MIN_LEADS || g.connections < MIN_CONNECTIONS
      );
      
      // ✅ SORT BY CONN → CONV (Connection to Conversion Rate)
      const sortedMeaningful = meaningfulGroups.sort((a, b) => {
        return b.connectionToConversionRate - a.connectionToConversionRate;
      });
      
      // Sort small sample groups by lead count (higher first)
      const sortedSmall = smallSampleGroups.sort((a, b) => {
        return b.leads - a.leads;
      });
      
      // Combine: meaningful groups first, then small sample groups
      const finalSorted = [...sortedMeaningful, ...sortedSmall];
      
      console.log('📊 Sorted by Conn → Conv:', finalSorted.map(g => ({
        name: g.groupName,
        leads: g.leads,
        connections: g.connections,
        connToConv: g.connectionToConversionRate,
        isMeaningful: g.leads >= MIN_LEADS && g.connections >= MIN_CONNECTIONS
      })));
      
      setGroupPerformance(finalSorted);
      
    } catch (error) {
      console.error('Error loading groups performance:', error);
      showToast('Failed to load groups performance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAgentChange = (e) => {
    setSelectedAgentId(e.target.value);
  };

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  const getRankMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  };

  const getConversionClass = (rate) => {
    if (rate >= 30) return 'text-green-600 font-semibold';
    if (rate >= 15) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getStatusBadge = (status) => {
    if (status === '⚠️ Not found') {
      return <span className="text-red-600 font-semibold">⚠️ Not found</span>;
    }
    
    const statusMap = {
      'active': <span className="text-green-600 font-semibold">🟢 Active</span>,
      'running': <span className="text-green-600 font-semibold">🟢 Active</span>,
      'paused': <span className="text-yellow-600 font-semibold">⏸️ Paused</span>,
      'completed': <span className="text-blue-600 font-semibold">✅ Completed</span>,
      'stopped': <span className="text-red-600 font-semibold">⏹️ Stopped</span>
    };
    
    return statusMap[status?.toLowerCase()] || status;
  };

  // Calculate summary stats
  const groupsWithLeads = groupPerformance.filter(g => g.leads > 0);
  const totalLeads = groupsWithLeads.reduce((sum, g) => sum + g.leads, 0);
  const totalInvites = groupsWithLeads.reduce((sum, g) => sum + g.invitations, 0);
  const totalConnections = groupsWithLeads.reduce((sum, g) => sum + g.connections, 0);
  
  // ✅ Average conversion should be based on Conn → Conv
  const groupsWithConnections = groupPerformance.filter(g => g.connections > 0);
  const avgConversion = groupsWithConnections.length > 0
    ? groupsWithConnections.reduce((sum, g) => sum + g.connectionToConversionRate, 0) / groupsWithConnections.length
    : 0;
    
  const campaignGroups = groupPerformance.filter(g => g.isCampaign).length;
  const manualGroups = groupPerformance.length - campaignGroups;
  
  // ✅ Top group is the first in the sorted list (highest Conn → Conv)
  const topGroup = groupPerformance.length > 0 && groupPerformance[0].connections >= 5
    ? groupPerformance[0] 
    : null;

  const selectedAgentName = agents.find(a => a._id === selectedAgentId)?.name || '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h2 className="text-xl font-semibold text-gray-800">📊 Groups Performance Dashboard</h2>
          {selectedAgentId && (
            <p className="text-sm text-gray-500 mt-0.5">Agent: {selectedAgentName}</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Agent</label>
            <select
              value={selectedAgentId}
              onChange={handleAgentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select agent</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.name || 'Unnamed agent'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Timeframe</label>
            <select
              value={timeframe}
              onChange={handleTimeframeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="last_7_days">Last 7 days</option>
              <option value="last_30_days">Last 30 days</option>
              <option value="last_90_days">Last 90 days</option>
              <option value="last_12_months">Last 12 months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* No Data */}
      {!loading && groupPerformance.length === 0 && selectedAgentId && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">No groups found for this agent</p>
        </div>
      )}

      {!loading && !selectedAgentId && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-gray-500">Select an agent to view groups performance</p>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && groupPerformance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500 font-medium">Total Groups</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{groupPerformance.length}</div>
            <div className="text-xs text-gray-400 mt-0.5">🎯 {campaignGroups} campaigns | 📁 {manualGroups} manual</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500 font-medium">Total Leads</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{totalLeads.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500 font-medium">Total Invitations</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{totalInvites.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500 font-medium">Total Connections</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{totalConnections.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-xs text-gray-500 font-medium">Avg. Conversion Rate</div>
            <div className="text-2xl font-bold text-primary-600 mt-1">
              {groupsWithConnections.length > 0 ? avgConversion.toFixed(1) : '0.0'}%
            </div>
            <div className="text-xs text-gray-400 mt-0.5">(Conn → Conv)</div>
          </div>
          {topGroup && topGroup.connections >= 5 && (
            <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-4 text-center">
              <div className="text-xs text-gray-500 font-medium">🏆 Top Performing</div>
              <div className="text-sm font-semibold text-gray-800 mt-1 truncate" title={topGroup.groupName}>
                {topGroup.groupName}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {topGroup.isCampaign ? '🎯 Campaign' : '📁 Manual'} • {topGroup.connectionToConversionRate.toFixed(1)}% conversion
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {topGroup.leads} leads • {topGroup.connections} connections
              </div>
            </div>
          )}
        </div>
      )}

      {/* Groups Table */}
      {!loading && groupPerformance.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Rank</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Group Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Campaign Status</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Leads</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Invitations</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Connections</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Invite → Conn</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Invite → Conv</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Conn → Conv</th>
              </tr>
            </thead>
            <tbody>
              {groupPerformance.map((group, index) => {
                const hasLeads = group.leads > 0;
                const hasConnections = group.connections > 0;
                const isMeaningful = group.leads >= 5 && group.connections >= 5;
                const isFirstNonMeaningful = !isMeaningful && index > 0 && 
                  groupPerformance[index - 1].leads >= 5 && groupPerformance[index - 1].connections >= 5;
                
                // Only show rank medals for meaningful groups
                const showRank = hasLeads && hasConnections && isMeaningful;
                
                return (
                  <React.Fragment key={group.groupId}>
                    {isFirstNonMeaningful && (
                      <tr>
                        <td colSpan="10" className="px-4 py-2 text-center text-xs text-gray-400 bg-gray-50">
                          — Groups with small sample sizes (fewer than 5 leads or connections) —
                        </td>
                      </tr>
                    )}
                    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!hasLeads || !hasConnections ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-center text-lg">
                        {showRank ? getRankMedal(index) : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate" title={group.groupName}>
                        {group.groupName}
                        {!isMeaningful && hasLeads && (
                          <span className="ml-2 text-xs text-gray-400">(small sample)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{group.groupType}</td>
                      <td className="px-4 py-3">{getStatusBadge(group.campaignStatus)}</td>
                      <td className="px-4 py-3 text-right">{group.leads.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{group.invitations.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{group.connections.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right ${hasLeads && isMeaningful ? getConversionClass(group.inviteToConnectionRate) : 'text-gray-400'}`}>
                        {hasLeads && isMeaningful ? group.inviteToConnectionRate.toFixed(1) + '%' : hasLeads ? '—' : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right ${hasLeads && isMeaningful ? getConversionClass(group.inviteToConversionRate) : 'text-gray-400'}`}>
                        {hasLeads && isMeaningful ? group.inviteToConversionRate.toFixed(1) + '%' : hasLeads ? '—' : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right ${hasConnections && isMeaningful ? getConversionClass(group.connectionToConversionRate) : 'text-gray-400'}`}>
                        {hasConnections && isMeaningful ? group.connectionToConversionRate.toFixed(1) + '%' : hasConnections ? '—' : '—'}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}