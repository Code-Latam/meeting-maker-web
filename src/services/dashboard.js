import { api } from './api';

export const dashboardService = {
  // Fetch a single metric
  async fetchMetric(metric, agentId, groupId, timeframe) {
    try {
      const body = {
        metric,
        agentId,
        timeframe: {
          type: 'relative',
          value: timeframe
        }
      };
      
      if (groupId && groupId !== '') {
        body.groupId = groupId;
      }
      
      const response = await api.post('/analytics/query', body);
      return response.data?.data?.value ?? 0;
    } catch (error) {
      console.error(`Error fetching ${metric}:`, error);
      return 0;
    }
  },

  // Fetch timeseries data for charts
  async fetchTimeseries(metric, agentId, groupId, timeframe) {
    try {
      const body = {
        metric,
        agentId,
        timeframe: {
          type: 'relative',
          value: timeframe
        },
        format: 'timeseries'
      };
      
      if (groupId && groupId !== '') {
        body.groupId = groupId;
      }
      
      const response = await api.post('/analytics/query', body);
      return response.data?.data?.series || [];
    } catch (error) {
      console.error(`Error fetching timeseries for ${metric}:`, error);
      return [];
    }
  },

  // Fetch daily connections (agent-independent)
  async fetchDailyConnections(groupId, timeframe) {
    try {
      const params = new URLSearchParams();
      if (groupId && groupId !== '') params.append('groupId', groupId);
      if (timeframe) params.append('timeframe', timeframe);
      
      const response = await api.get(`/analytics/daily-connections?${params.toString()}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching daily connections:', error);
      return [];
    }
  },

  // Fetch all metrics for LinkedIn dashboard
  async fetchLinkedInMetrics(agentId, groupId, timeframe) {
    const metrics = [
      'leads_created',
      'invitations_sent',
      'connections',
      'in_conversation',
      'invitation_to_connection_rate',
      'invitation_to_conversion_rate',
      'connection_to_conversion_rate'
    ];
    
    const results = await Promise.all(
      metrics.map(metric => this.fetchMetric(metric, agentId, groupId, timeframe))
    );
    
    return {
      leads: results[0],
      invitations: results[1],
      connections: results[2],
      inConversation: results[3],
      invitationToConnectionRate: results[4],
      invitationToConversionRate: results[5],
      connectionToConversionRate: results[6]
    };
  },

  // Fetch all metrics for Email dashboard
  async fetchEmailMetrics(agentId, groupId, timeframe) {
    const metrics = [
      'email_leads',
      'emails_sent',
      'email_replied',
      'email_in_conversation',
      'email_reply_rate',
      'email_reply_to_conversion_rate',
      'email_to_conversion_rate'
    ];
    
    const results = await Promise.all(
      metrics.map(metric => this.fetchMetric(metric, agentId, groupId, timeframe))
    );
    
    return {
      emailLeads: results[0],
      emailsSent: results[1],
      emailReplied: results[2],
      emailInConversation: results[3],
      replyRate: results[4],
      replyToConversionRate: results[5],
      emailToConversionRate: results[6]
    };
  },

  // Groups Performance
  async fetchGroupMetrics(agentId, groupId, timeframe) {
    const metrics = [
      'leads_created',
      'invitations_sent',
      'connections',
      'invitation_to_connection_rate',
      'invitation_to_conversion_rate',
      'connection_to_conversion_rate'
    ];
    
    const results = await Promise.all(
      metrics.map(metric => this.fetchMetric(metric, agentId, groupId, timeframe))
    );
    
    return {
      leads: results[0],
      invitations: results[1],
      connections: results[2],
      inviteToConnectionRate: results[3],
      inviteToConversionRate: results[4],
      connectionToConversionRate: results[5]
    };
  },

  // Get groups for an agent
  async getGroups(agentId) {
    try {
      const response = await api.get(`/people/agent/${agentId}/groups`);
      return response.data.groups || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  },

  // Get campaigns for an agent (for groups performance)
  async getCampaigns(agentId) {
    try {
      const response = await api.get(`/lead-campaigns/campaigns/agent/${agentId}`);
      return response.data.campaigns || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }
};