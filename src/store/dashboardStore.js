import { create } from 'zustand';
import { dashboardService } from '../services/dashboard';

export const useDashboardStore = create((set, get) => ({
  // State
  agents: [],
  groups: [],
  campaigns: [],
  isLoading: false,
  error: null,
  
  // Dashboard settings
  settings: {
    agentId: '',
    groupId: '',
    channel: 'linkedin',
    timeframe: 'last_12_months'
  },
  
  // LinkedIn metrics
  linkedInMetrics: {
    leads: 0,
    invitations: 0,
    connections: 0,
    inConversation: 0,
    invitationToConnectionRate: 0,
    invitationToConversionRate: 0,
    connectionToConversionRate: 0
  },
  
  // Email metrics
  emailMetrics: {
    emailLeads: 0,
    emailsSent: 0,
    emailReplied: 0,
    emailInConversation: 0,
    replyRate: 0,
    replyToConversionRate: 0,
    emailToConversionRate: 0
  },
  
  // Timeseries data
  leadsTimeseries: [],
  emailsSentTimeseries: [],
  replyRateTimeseries: [],
  dailyConnections: [],
  
  // Groups performance
  groupPerformance: [],
  
  // Actions
  setSettings: (settings) => set({ settings }),
  
  setChannel: (channel) => set((state) => ({
    settings: { ...state.settings, channel }
  })),
  
  setAgentId: (agentId) => set((state) => ({
    settings: { ...state.settings, agentId }
  })),
  
  setGroupId: (groupId) => set((state) => ({
    settings: { ...state.settings, groupId }
  })),
  
  setTimeframe: (timeframe) => set((state) => ({
    settings: { ...state.settings, timeframe }
  })),
  
  // Fetch agents
  fetchAgents: async () => {
    try {
      const response = await api.get('/agents');
      const agents = response.data.agents || [];
      set({ agents });
      return agents;
    } catch (error) {
      console.error('Error fetching agents:', error);
      set({ error: error.message });
      return [];
    }
  },
  
  // Fetch groups for an agent
  fetchGroups: async (agentId) => {
    if (!agentId) {
      set({ groups: [] });
      return [];
    }
    
    try {
      const groups = await dashboardService.getGroups(agentId);
      set({ groups });
      return groups;
    } catch (error) {
      console.error('Error fetching groups:', error);
      set({ groups: [] });
      return [];
    }
  },
  
  // Fetch campaigns (for groups performance)
  fetchCampaigns: async (agentId) => {
    if (!agentId) {
      set({ campaigns: [] });
      return [];
    }
    
    try {
      const campaigns = await dashboardService.getCampaigns(agentId);
      set({ campaigns });
      return campaigns;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      set({ campaigns: [] });
      return [];
    }
  },
  
  // Load LinkedIn dashboard
  loadLinkedInDashboard: async (agentId, groupId, timeframe) => {
    set({ isLoading: true });
    try {
      const [
        metrics,
        leadsSeries,
        dailyConnections
      ] = await Promise.all([
        dashboardService.fetchLinkedInMetrics(agentId, groupId, timeframe),
        dashboardService.fetchTimeseries('leads_created', agentId, groupId, timeframe),
        dashboardService.fetchDailyConnections(groupId, timeframe)
      ]);
      
      set({
        linkedInMetrics: metrics,
        leadsTimeseries: leadsSeries,
        dailyConnections: dailyConnections,
        isLoading: false
      });
      
      return { metrics, leadsSeries, dailyConnections };
    } catch (error) {
      console.error('Error loading LinkedIn dashboard:', error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  // Load Email dashboard
  loadEmailDashboard: async (agentId, groupId, timeframe) => {
    set({ isLoading: true });
    try {
      const [
        metrics,
        emailsSentSeries,
        replyRateSeries
      ] = await Promise.all([
        dashboardService.fetchEmailMetrics(agentId, groupId, timeframe),
        dashboardService.fetchTimeseries('emails_sent', agentId, groupId, timeframe),
        dashboardService.fetchTimeseries('email_reply_rate', agentId, groupId, timeframe)
      ]);
      
      set({
        emailMetrics: metrics,
        emailsSentTimeseries: emailsSentSeries,
        replyRateTimeseries: replyRateSeries,
        isLoading: false
      });
      
      return { metrics, emailsSentSeries, replyRateSeries };
    } catch (error) {
      console.error('Error loading Email dashboard:', error);
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
  
  // Load groups performance
  loadGroupsPerformance: async (agentId, timeframe) => {
    set({ isLoading: true });
    try {
      // Fetch groups and campaigns in parallel
      const [groups, campaigns] = await Promise.all([
        dashboardService.getGroups(agentId),
        dashboardService.getCampaigns(agentId)
      ]);
      
      set({ groups, campaigns });
      
      if (groups.length === 0) {
        set({ groupPerformance: [], isLoading: false });
        return [];
      }
      
      // Create campaign map
      const campaignMap = new Map();
      campaigns.forEach(campaign => {
        campaignMap.set(campaign.name.toLowerCase(), campaign);
      });
      
      // Fetch metrics for each group
      const groupPromises = groups.map(group => 
        dashboardService.fetchGroupMetrics(agentId, group._id, timeframe)
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
            // Try contains match
            campaign = campaigns.find(c => 
              group.name.toLowerCase().includes(c.name.toLowerCase())
            );
          }
          
          if (!campaign) {
            campaign = campaigns.find(c => 
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
      
      // Sort by conversion rate
      enrichedMetrics.sort((a, b) => b.inviteToConversionRate - a.inviteToConversionRate);
      
      set({ groupPerformance: enrichedMetrics, isLoading: false });
      return enrichedMetrics;
      
    } catch (error) {
      console.error('Error loading groups performance:', error);
      set({ error: error.message, isLoading: false, groupPerformance: [] });
      return [];
    }
  },
  
  // Clear dashboard data
  clearDashboard: () => set({
    linkedInMetrics: {
      leads: 0,
      invitations: 0,
      connections: 0,
      inConversation: 0,
      invitationToConnectionRate: 0,
      invitationToConversionRate: 0,
      connectionToConversionRate: 0
    },
    emailMetrics: {
      emailLeads: 0,
      emailsSent: 0,
      emailReplied: 0,
      emailInConversation: 0,
      replyRate: 0,
      replyToConversionRate: 0,
      emailToConversionRate: 0
    },
    leadsTimeseries: [],
    emailsSentTimeseries: [],
    replyRateTimeseries: [],
    dailyConnections: [],
    groupPerformance: []
  })
}));

// Import api for fetchAgents
import { api } from '../services/api';