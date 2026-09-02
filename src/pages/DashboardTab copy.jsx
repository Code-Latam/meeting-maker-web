import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export function DashboardTab() {
  const navigate = useNavigate();
  const { showToast } = useUIStore();

  // ============================================================
  // 🎯 TARGET CONFIGURATION – Adjust these numbers freely
  // ============================================================
  const TARGETS = {
    // BDR (Outbound – sends invitations)
    bdr: {
      leadsPerDay: 15,
      invitationsPerDay: 15,
      connectionsPerDay: 3.8,
      inConversation: 30,
      invitationToConnectionRate: 25,
      invitationToConversionRate: 0.75,
      connectionToConversionRate: 2,
    },
    // CRS (Inbound – no invitations)
    crs: {
      leadsPerDay: 30,
      connectionsPerDay: 20,
      inConversation: 50,
      connectionToConversionRate: 5,
    },
  };

  // Colour thresholds (80% of target = yellow, below = red)
  const YELLOW_THRESHOLD = 0.8;

  // ============================================================
  // 💬 TOOLTIP CONFIGURATION – Edit descriptions & advice freely
  // ============================================================
  const METRIC_INFO = {
    avgLeads: {
      description: 'Total leads created divided by the number of days in the selected timeframe.',
      advice: '💡 Increase campaign volume or improve targeting to hit your daily goal.',
    },
    avgInvitations: {
      description: 'Total LinkedIn invitations sent per day.',
      advice: '💡 Ensure you are sending the daily limit (approx. 15) to maintain a healthy pipeline. Check your agent setting.',
    },
    avgConnections: {
      description: 'Connections accepted per day. Reflects your targeting and profile quality.',
      advice: '💡 Improve your profile and adapt keywords and title in your campaigns. Try more than one type of campaign.',
    },
    inConversation: {
      description: 'Number of active ongoing conversations.',
      advice: '💡 If below target, improve other indicators to affect volume.',
    },
    invToConnRate: {
      description: 'Percentage of invitations that convert to connections.',
      advice: '💡 Aim for 25%. Optimise your profile, refine targeting, and improve request personalisation.',
    },
    invToConvRate: {
      description: 'Percentage of invitations that lead to a conversion (meeting/opportunity).',
      advice: '💡 Improve your profile and adapt keywords and title in your campaigns. Try more than one type of campaign.',
    },
    connToConvRate: {
      description: 'Percentage of connections that convert to a meeting or opportunity.',
      advice: '💡 BDR target: 2%. CRS target: 5% (inbound leads are warmer). Focus on relationship building through the marketing manager and marketing campaigns.',
    },
  };
  // ============================================================

  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [timeframe, setTimeframe] = useState('last_12_months');
  const [activeChannel, setActiveChannel] = useState('linkedin');

  // LinkedIn Metrics
  const [linkedInMetrics, setLinkedInMetrics] = useState({
    leads: 0,
    invitations: 0,
    connections: 0,
    inConversation: 0,
    invitationToConnectionRate: 0,
    invitationToConversionRate: 0,
    connectionToConversionRate: 0,
  });

  // Email Metrics
  const [emailMetrics, setEmailMetrics] = useState({
    emailLeads: 0,
    emailsSent: 0,
    emailReplied: 0,
    emailInConversation: 0,
    replyRate: 0,
    replyToConversionRate: 0,
    emailToConversionRate: 0,
  });

  // Timeseries data
  const [leadsTimeseries, setLeadsTimeseries] = useState([]);
  const [emailsSentTimeseries, setEmailsSentTimeseries] = useState([]);
  const [replyRateTimeseries, setReplyRateTimeseries] = useState([]);
  const [dailyConnections, setDailyConnections] = useState([]);

  // Chart refs for cleanup
  const leadsChartRef = useRef(null);
  const funnelChartRef = useRef(null);
  const dailyConnectionsChartRef = useRef(null);
  const emailsSentChartRef = useRef(null);
  const replyRateChartRef = useRef(null);
  const emailFunnelChartRef = useRef(null);

  // Load agents on mount
  useEffect(() => {
    fetchAgents();
  }, []);

  // Load dashboard data when agent or timeframe changes
  useEffect(() => {
    if (selectedAgentId) {
      loadDashboardData();
    }
  }, [selectedAgentId, timeframe, activeChannel]);

  // Cleanup charts on unmount or data change
  useEffect(() => {
    return () => {
      destroyAllCharts();
    };
  }, []);

  const destroyAllCharts = () => {
    [
      leadsChartRef,
      funnelChartRef,
      dailyConnectionsChartRef,
      emailsSentChartRef,
      replyRateChartRef,
      emailFunnelChartRef,
    ].forEach((ref) => {
      if (ref.current) {
        ref.current.destroy();
        ref.current = null;
      }
    });
  };

  // ✅ FIXED: Filter agents in the frontend
  const fetchAgents = async () => {
    try {
      const response = await api.get('/agents');
      if (response.data) {
        const data = response.data;

        // ✅ Exclude Marketing Manager and SEO Manager roles (exact match)
        const excludedRoles = ['Marketing Manager', 'SEO Manager'];

        const filteredAgents = (data.agents || []).filter(
          (agent) => !excludedRoles.includes(agent.role)
        );

        setAgents(filteredAgents);
        if (filteredAgents.length > 0) {
          setSelectedAgentId(filteredAgents[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      showToast('Failed to load agents', 'error');
    }
  };

  // ✅ FIXED: Use api service instead of direct fetch
  const fetchMetric = async (metric, agentId, timeframeValue) => {
    try {
      const body = {
        metric,
        agentId,
        timeframe: {
          type: 'relative',
          value: timeframeValue,
        },
      };

      const response = await api.post('/analytics/query', body);
      return response.data?.data?.value ?? 0;
    } catch (error) {
      console.error(`Error fetching ${metric}:`, error);
      return 0;
    }
  };

  // ✅ FIXED: Use api service instead of direct fetch
  const fetchTimeseries = async (metric, agentId, timeframeValue) => {
    try {
      const body = {
        metric,
        agentId,
        timeframe: {
          type: 'relative',
          value: timeframeValue,
        },
        format: 'timeseries',
      };

      const response = await api.post('/analytics/query', body);
      return response.data?.data?.series || [];
    } catch (error) {
      console.error(`Error fetching timeseries for ${metric}:`, error);
      return [];
    }
  };

  // ✅ FIXED: Use api service instead of direct fetch
  const fetchDailyConnections = async (timeframeValue) => {
    try {
      const params = timeframeValue ? { timeframe: timeframeValue } : {};
      const response = await api.get('/analytics/daily-connections', { params });

      console.log('📥 Daily connections response:', response.data);

      // Handle different response formats
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data && data.connections && Array.isArray(data.connections)) {
        return data.connections;
      } else {
        console.warn('⚠️ Unexpected data format:', data);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching daily connections:', error);
      return [];
    }
  };

  const loadDashboardData = async () => {
    if (!selectedAgentId) return;

    setLoading(true);

    try {
      // Fetch daily connections (agent-independent)
      const dailyConnectionsData = await fetchDailyConnections(timeframe);
      setDailyConnections(dailyConnectionsData);
      console.log('📊 Daily connections set to:', dailyConnectionsData.length, 'items');

      if (activeChannel === 'linkedin') {
        // Fetch LinkedIn metrics
        const [
          leads,
          invitations,
          connections,
          inConversation,
          invitationToConnectionRate,
          invitationToConversionRate,
          connectionToConversionRate,
          leadsSeries,
        ] = await Promise.all([
          fetchMetric('leads_created', selectedAgentId, timeframe),
          fetchMetric('invitations_sent', selectedAgentId, timeframe),
          fetchMetric('connections', selectedAgentId, timeframe),
          fetchMetric('in_conversation', selectedAgentId, timeframe),
          fetchMetric('invitation_to_connection_rate', selectedAgentId, timeframe),
          fetchMetric('invitation_to_conversion_rate', selectedAgentId, timeframe),
          fetchMetric('connection_to_conversion_rate', selectedAgentId, timeframe),
          fetchTimeseries('leads_created', selectedAgentId, timeframe),
        ]);

        setLinkedInMetrics({
          leads,
          invitations,
          connections,
          inConversation,
          invitationToConnectionRate,
          invitationToConversionRate,
          connectionToConversionRate,
        });
        setLeadsTimeseries(leadsSeries);

        // Render charts after state update
        setTimeout(() => {
          renderLinkedInCharts(
            leadsSeries,
            leads,
            invitations,
            connections,
            inConversation,
            dailyConnectionsData
          );
        }, 100);
      } else {
        // Fetch Email metrics
        const [
          emailLeads,
          emailsSent,
          emailReplied,
          emailInConversation,
          replyRate,
          replyToConversionRate,
          emailToConversionRate,
          emailsSentSeries,
          replyRateSeries,
        ] = await Promise.all([
          fetchMetric('email_leads', selectedAgentId, timeframe),
          fetchMetric('emails_sent', selectedAgentId, timeframe),
          fetchMetric('email_replied', selectedAgentId, timeframe),
          fetchMetric('email_in_conversation', selectedAgentId, timeframe),
          fetchMetric('email_reply_rate', selectedAgentId, timeframe),
          fetchMetric('email_reply_to_conversion_rate', selectedAgentId, timeframe),
          fetchMetric('email_to_conversion_rate', selectedAgentId, timeframe),
          fetchTimeseries('emails_sent', selectedAgentId, timeframe),
          fetchTimeseries('email_reply_rate', selectedAgentId, timeframe),
        ]);

        setEmailMetrics({
          emailLeads,
          emailsSent,
          emailReplied,
          emailInConversation,
          replyRate,
          replyToConversionRate,
          emailToConversionRate,
        });
        setEmailsSentTimeseries(emailsSentSeries);
        setReplyRateTimeseries(replyRateSeries);

        // Render charts after state update
        setTimeout(() => {
          renderEmailCharts(
            emailsSentSeries,
            replyRateSeries,
            emailLeads,
            emailsSent,
            emailReplied,
            emailInConversation
          );
        }, 100);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CHART RENDER FUNCTIONS (unchanged)
  // ============================================================

  const renderLinkedInCharts = (
    leadsSeries,
    leads,
    invitations,
    connections,
    inConversation,
    dailyConnectionsData
  ) => {
    // Destroy existing charts
    if (leadsChartRef.current) {
      leadsChartRef.current.destroy();
      leadsChartRef.current = null;
    }
    if (funnelChartRef.current) {
      funnelChartRef.current.destroy();
      funnelChartRef.current = null;
    }
    if (dailyConnectionsChartRef.current) {
      dailyConnectionsChartRef.current.destroy();
      dailyConnectionsChartRef.current = null;
    }

    // 1. Leads Over Time Chart
    if (leadsSeries && leadsSeries.length > 0) {
      const canvas = document.getElementById('leadsChart');
      if (canvas) {
        leadsChartRef.current = createBarChart(canvas, leadsSeries, 'Leads', '#3b82f6');
      }
    }

    // 2. Funnel Chart
    const funnelCanvas = document.getElementById('funnelChart');
    if (funnelCanvas) {
      funnelChartRef.current = createFunnelChart(
        funnelCanvas,
        leads,
        invitations,
        connections,
        inConversation
      );
    }

    // 3. Daily Connections Chart
    if (
      dailyConnectionsData &&
      Array.isArray(dailyConnectionsData) &&
      dailyConnectionsData.length > 0
    ) {
      const dailyCanvas = document.getElementById('dailyConnectionsChart');
      if (dailyCanvas) {
        dailyConnectionsChartRef.current = createBarChart(
          dailyCanvas,
          dailyConnectionsData,
          'Connections Added',
          '#2563eb'
        );
      }
    } else {
      const container = document.getElementById('dailyConnectionsContainer');
      if (container) {
        container.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <p>No daily connections data available</p>
            <p class="text-xs text-gray-400 mt-2">Try selecting a different timeframe</p>
          </div>
        `;
      }
    }
  };

  const renderEmailCharts = (
    emailsSentSeries,
    replyRateSeries,
    emailLeads,
    emailsSent,
    emailReplied,
    emailInConversation
  ) => {
    // Destroy existing charts
    if (emailsSentChartRef.current) {
      emailsSentChartRef.current.destroy();
      emailsSentChartRef.current = null;
    }
    if (replyRateChartRef.current) {
      replyRateChartRef.current.destroy();
      replyRateChartRef.current = null;
    }
    if (emailFunnelChartRef.current) {
      emailFunnelChartRef.current.destroy();
      emailFunnelChartRef.current = null;
    }

    // 1. Emails Sent Over Time
    if (emailsSentSeries && emailsSentSeries.length > 0) {
      const canvas = document.getElementById('emailsSentChart');
      if (canvas) {
        emailsSentChartRef.current = createBarChart(
          canvas,
          emailsSentSeries,
          'Emails Sent',
          '#3b82f6'
        );
      }
    }

    // 2. Reply Rate Over Time
    if (replyRateSeries && replyRateSeries.length > 0) {
      const canvas = document.getElementById('replyRateChart');
      if (canvas) {
        replyRateChartRef.current = createLineChart(
          canvas,
          replyRateSeries,
          'Reply Rate (%)',
          '#22c55e'
        );
      }
    }

    // 3. Email Funnel Chart
    const funnelCanvas = document.getElementById('emailFunnelChart');
    if (funnelCanvas) {
      emailFunnelChartRef.current = createFunnelChart(
        funnelCanvas,
        emailLeads,
        emailsSent,
        emailReplied,
        emailInConversation,
        'Email Funnel',
        '#3b82f6'
      );
    }
  };

  // ============================================================
  // CHART CREATION HELPERS (unchanged)
  // ============================================================

  const createBarChart = (canvas, data, label, color) => {
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 250;

    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(2, 2);

    const padding = { top: 20, bottom: 40, left: 50, right: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map((d) => d.value || d.count || 0);
    const maxValue = Math.max(...values, 1);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      const value = maxValue - (i / 5) * maxValue;
      ctx.fillText(Math.round(value).toString(), padding.left - 8, y + 3);
    }

    // Draw bars
    const barWidth = Math.min(chartWidth / values.length * 0.7, 30);
    const gap = chartWidth / values.length;

    values.forEach((value, index) => {
      const x = padding.left + index * gap + (gap - barWidth) / 2;
      const barHeight = (value / maxValue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // Bar
      ctx.fillStyle = color + '80';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Bar border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // X-axis label
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      const date = new Date(data[index].date);
      const labelText = date.toLocaleDateString();
      if (index % Math.ceil(values.length / 10) === 0 || index === values.length - 1) {
        ctx.fillText(labelText, x + barWidth / 2, height - 5);
      }
    });

    return { destroy: () => {} };
  };

  const createLineChart = (canvas, data, label, color) => {
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 250;

    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(2, 2);

    const padding = { top: 20, bottom: 40, left: 50, right: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map((d) => d.value || d.count || 0);
    const maxValue = Math.max(...values, 1);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      const value = maxValue - (i / 5) * maxValue;
      const displayValue = label.includes('%')
        ? value.toFixed(1) + '%'
        : Math.round(value).toString();
      ctx.fillText(displayValue, padding.left - 8, y + 3);
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    values.forEach((value, index) => {
      const x = padding.left + (index / (values.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill under line
    const lastX = padding.left + ((values.length - 1) / (values.length - 1)) * chartWidth;
    ctx.lineTo(lastX, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = color + '20';
    ctx.fill();

    // Draw points
    values.forEach((value, index) => {
      const x = padding.left + (index / (values.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // X-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      const date = new Date(data[index].date);
      const labelText = date.toLocaleDateString();
      if (index % Math.ceil(values.length / 10) === 0 || index === values.length - 1) {
        ctx.fillText(labelText, x, height - 5);
      }
    });

    return { destroy: () => {} };
  };

  const createFunnelChart = (
    canvas,
    step1,
    step2,
    step3,
    step4,
    label = 'Funnel',
    color = '#9c6bff'
  ) => {
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 250;

    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(2, 2);

    const padding = { top: 20, bottom: 30, left: 120, right: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const labels =
      label === 'Email Funnel'
        ? ['Email Leads', 'Emails Sent', 'Replied', 'In Conversation']
        : ['Leads Created', 'Invitations Sent', 'Connections', 'In Conversation'];
    const values = [step1, step2, step3, step4];
    const maxValue = Math.max(...values, 1);
    const barHeight = (chartHeight / values.length) * 0.6;
    const gap = chartHeight / values.length;

    // Clear
    ctx.clearRect(0, 0, width, height);

    values.forEach((value, index) => {
      const x = padding.left;
      const y = padding.top + index * gap + (gap - barHeight) / 2;
      const barWidth = (value / maxValue) * chartWidth;

      // Bar
      ctx.fillStyle = color + '80';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Bar border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(labels[index], x - 8, y + barHeight / 2 + 4);

      // Value
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      const percentage = maxValue > 0 ? ((value / maxValue) * 100).toFixed(1) : 0;
      ctx.fillText(`${value} (${percentage}%)`, x + barWidth + 8, y + barHeight / 2 + 4);
    });

    return { destroy: () => {} };
  };

  const handleAgentChange = (e) => {
    setSelectedAgentId(e.target.value);
  };

  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  const handleChannelChange = (channel) => {
    setActiveChannel(channel);
    destroyAllCharts();
  };

  const selectedAgentName = agents.find((a) => a._id === selectedAgentId)?.name || '';

  // ============================================================
  // 🆕 HELPERS FOR TARGETS & COLOURS
  // ============================================================

  const getDaysFromTimeframe = (tf) => {
    const map = {
      last_7_days: 7,
      last_30_days: 30,
      last_90_days: 90,
      last_12_months: 365,
    };
    return map[tf] || 30;
  };

  const getColorClass = (value, target) => {
    if (typeof value !== 'number' || typeof target !== 'number' || target === 0)
      return 'text-gray-800';
    if (value >= target) return 'text-emerald-600';
    if (value >= target * YELLOW_THRESHOLD) return 'text-yellow-600';
    return 'text-red-500';
  };

  const formatValue = (value, isRate = false, isAbsolute = false) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    if (isRate) return value.toFixed(1);
    if (isAbsolute) return Math.round(value).toString();
    return value.toFixed(1);
  };

  const formatTargetDisplay = (target, isRate = false, isAbsolute = false) => {
    if (isRate) return `${target}%`;
    if (isAbsolute) return `${target}`;
    return `${target} / day`;
  };

  // ============================================================
  // 🆕 METRIC CARD COMPONENT (with target, colour & hover tooltip)
  // ============================================================

  const MetricCard = ({
    label,
    value,
    suffix = '',
    isRate = false,
    isAbsolute = false,
    target,
    metricKey, // used to look up description & advice
  }) => {
    const displayValue = formatValue(value, isRate, isAbsolute);
    const colorClass = target !== undefined ? getColorClass(value, target) : 'text-gray-800';
    const targetDisplay =
      target !== undefined ? formatTargetDisplay(target, isRate, isAbsolute) : null;
    const info = metricKey ? METRIC_INFO[metricKey] : null;

    return (
      <div className="relative group bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md">
        <div className="cursor-help">
          <div className="text-sm text-gray-500 font-medium">{label}</div>
          <div className={`text-2xl font-bold mt-1 ${colorClass}`}>
            {displayValue}
            {suffix}
          </div>
          {targetDisplay && (
            <div className="text-xs text-gray-400 mt-0.5">Target: {targetDisplay}</div>
          )}
        </div>

        {/* Tooltip */}
        {info && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <p className="font-medium text-gray-200 mb-1">{info.description}</p>
            <p className="text-yellow-300">{info.advice}</p>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER – KPI Cards (unchanged)
  // ============================================================

  const KPIGrid = ({ metrics }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );

  // ============================================================
  // MAIN RETURN
  // ============================================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">📊 Analytics Dashboard</h2>
        <button
          onClick={() => navigate('/groups-performance')}
          className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
        >
          📊 Compare Groups →
        </button>
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

      {/* Channel Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-3">
        {[
          { id: 'linkedin', label: '🔗 LinkedIn Funnel' },
          { id: 'email', label: '📧 Email Funnel' },
        ].map((channel) => (
          <button
            key={channel.id}
            onClick={() => handleChannelChange(channel.id)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              activeChannel === channel.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {channel.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* No Agent Selected */}
      {!selectedAgentId && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">Select an agent to view dashboard data</p>
        </div>
      )}

      {/* ============================================================
          LINKEDIN DASHBOARD – Role‑based with averages, targets & tooltips
          ============================================================ */}
      {!loading && selectedAgentId && activeChannel === 'linkedin' && (
        <div className="space-y-4">
          {(() => {
            // --- Determine agent role (case‑insensitive, flexible) ---
            const agent = agents.find((a) => a._id === selectedAgentId);
            const role = (agent?.role || '').toUpperCase().trim();

            // ✅ FIXED: Added "CUSTOM SERVICE" to the keywords list
            const inboundKeywords = [
              'CSR',
              'CUSTOMER SUCCESS',
              'CUSTOM SERVICE',  // ← Added this!
              'INBOUND',
            ];
            const isCrs = inboundKeywords.some((kw) => role.includes(kw));

            // 🔍 DEBUG LOGS – remove after verifying
            console.log('🔍 [Dashboard] Agent role:', `"${role}"`, '→ isCrs:', isCrs);
            console.log('📌 Agent object:', agent);

            const targets = isCrs ? TARGETS.crs : TARGETS.bdr;
            const days = getDaysFromTimeframe(timeframe);

            // --- Compute daily averages ---
            const avgLeads = linkedInMetrics.leads / days;
            const avgInvitations = linkedInMetrics.invitations / days;
            const avgConnections = linkedInMetrics.connections / days;

            // --- Build the list of metric cards (CRS hides invitation cards) ---
            const cardConfigs = [];

            // 1. Avg Leads / Day (always shown)
            cardConfigs.push({
              label: 'Avg Leads / Day',
              value: avgLeads,
              target: targets.leadsPerDay,
              isRate: false,
              isAbsolute: false,
              metricKey: 'avgLeads',
            });

            // 2. Avg Invitations / Day (✅ ONLY for BDR)
            if (!isCrs) {
              cardConfigs.push({
                label: 'Avg Invitations / Day',
                value: avgInvitations,
                target: targets.invitationsPerDay,
                isRate: false,
                isAbsolute: false,
                metricKey: 'avgInvitations',
              });
            } else {
              console.log('🚫 CSR agent – hiding Invitations card');
            }

            // 3. Avg Connections / Day (always shown)
            cardConfigs.push({
              label: 'Avg Connections / Day',
              value: avgConnections,
              target: targets.connectionsPerDay,
              isRate: false,
              isAbsolute: false,
              metricKey: 'avgConnections',
            });

            // 4. In Conversation (always shown – absolute count)
            cardConfigs.push({
              label: 'In Conversation',
              value: linkedInMetrics.inConversation,
              target: targets.inConversation,
              isRate: false,
              isAbsolute: true,
              metricKey: 'inConversation',
            });

            // 5. Invitation → Connection Rate (✅ ONLY for BDR)
            if (!isCrs) {
              cardConfigs.push({
                label: 'Invitation → Connection Rate',
                value: linkedInMetrics.invitationToConnectionRate,
                target: targets.invitationToConnectionRate,
                suffix: '%',
                isRate: true,
                isAbsolute: false,
                metricKey: 'invToConnRate',
              });
            }

            // 6. Invitation → Conversion Rate (✅ ONLY for BDR)
            if (!isCrs) {
              cardConfigs.push({
                label: 'Invitation → Conversion Rate',
                value: linkedInMetrics.invitationToConversionRate,
                target: targets.invitationToConversionRate,
                suffix: '%',
                isRate: true,
                isAbsolute: false,
                metricKey: 'invToConvRate',
              });
            }

            // 7. Connection → Conversion Rate (always shown)
            cardConfigs.push({
              label: 'Connection → Conversion Rate',
              value: linkedInMetrics.connectionToConversionRate,
              target: targets.connectionToConversionRate,
              suffix: '%',
              isRate: true,
              isAbsolute: false,
              metricKey: 'connToConvRate',
            });

            // 🔍 Log how many cards we have
            console.log('📋 [Dashboard] Card configs:', cardConfigs.length, 'items');
            console.log('📋 Cards:', cardConfigs.map(c => c.label).join(', '));

            return (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {cardConfigs.map((cfg, idx) => (
                    <MetricCard key={idx} {...cfg} />
                  ))}
                </div>

                {/* Daily Connections Chart */}
                <div
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                  id="dailyConnectionsContainer"
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Daily Connections Added
                  </h3>
                  <div className="w-full h-64">
                    <canvas id="dailyConnectionsChart"></canvas>
                  </div>
                </div>

                {/* Leads Over Time Chart */}
                {leadsTimeseries && leadsTimeseries.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Leads Over Time
                    </h3>
                    <div className="w-full h-64">
                      <canvas id="leadsChart"></canvas>
                    </div>
                  </div>
                )}

                {/* Funnel Chart – ✅ hidden for CRS */}
                {!isCrs && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Conversion Funnel
                    </h3>
                    <div className="w-full h-64">
                      <canvas id="funnelChart"></canvas>
                    </div>
                  </div>
                )}

                {/* No Data Message */}
                {linkedInMetrics.leads === 0 && leadsTimeseries.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm">
                      No data available for this agent and timeframe
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ============================================================
          EMAIL DASHBOARD – untouched (as requested)
          ============================================================ */}
      {!loading && selectedAgentId && activeChannel === 'email' && (
        <div className="space-y-4">
          {/* Row 1: Core Email Metrics */}
          <KPIGrid
            metrics={[
              { label: 'Email Leads', value: emailMetrics.emailLeads },
              { label: 'Emails Sent', value: emailMetrics.emailsSent },
              { label: 'Replied', value: emailMetrics.emailReplied },
              { label: 'In Conversation', value: emailMetrics.emailInConversation },
            ]}
          />

          {/* Row 2: Email Conversion Rates */}
          <KPIGrid
            metrics={[
              {
                label: 'Reply Rate',
                value: emailMetrics.replyRate,
                suffix: '%',
                isRate: true,
              },
              {
                label: 'Reply → Conversion Rate',
                value: emailMetrics.replyToConversionRate,
                suffix: '%',
                isRate: true,
              },
              {
                label: 'Email → Conversion Rate',
                value: emailMetrics.emailToConversionRate,
                suffix: '%',
                isRate: true,
              },
            ]}
          />

          {/* Emails Sent Over Time */}
          {emailsSentTimeseries && emailsSentTimeseries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Emails Sent Over Time
              </h3>
              <div className="w-full h-64">
                <canvas id="emailsSentChart"></canvas>
              </div>
            </div>
          )}

          {/* Reply Rate Over Time */}
          {replyRateTimeseries && replyRateTimeseries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Reply Rate Over Time
              </h3>
              <div className="w-full h-64">
                <canvas id="replyRateChart"></canvas>
              </div>
            </div>
          )}

          {/* Email Funnel Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Email Funnel</h3>
            <div className="w-full h-64">
              <canvas id="emailFunnelChart"></canvas>
            </div>
          </div>

          {/* No Data Message */}
          {emailMetrics.emailLeads === 0 && emailsSentTimeseries.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-sm">
                No data available for this agent and timeframe
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}