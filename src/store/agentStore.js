import { create } from 'zustand';
import { agentsService } from '../services/agents';

export const useAgentStore = create((set, get) => ({
  agents: [],
  categories: [],
  isLoading: false,
  error: null,
  selectedAgent: null,
  websiteData: null,

  // Fetch all agents
  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    const result = await agentsService.getAgents();
    if (result.success) {
      set({ agents: result.agents, isLoading: false });
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },

  // Fetch agent categories
  fetchCategories: async () => {
    const result = await agentsService.getAgentCategories();
    if (result.success) {
      set({ categories: result.categories });
    }
    return result;
  },

  // Create an agent
  createAgent: async (data) => {
    set({ isLoading: true, error: null });
    const result = await agentsService.createAgent(data);
    if (result.success) {
      const { agents } = get();
      set({ agents: [result.agent, ...agents], isLoading: false });
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },

  // Update an agent
  updateAgent: async (id, data) => {
    set({ isLoading: true, error: null });
    const result = await agentsService.updateAgent(id, data);
    if (result.success) {
      const { agents } = get();
      const index = agents.findIndex(a => a._id === id);
      if (index !== -1) {
        const updatedAgents = [...agents];
        updatedAgents[index] = result.agent;
        set({ agents: updatedAgents, isLoading: false });
      }
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },

  // Delete an agent
  deleteAgent: async (id) => {
    set({ isLoading: true, error: null });
    const result = await agentsService.deleteAgent(id);
    if (result.success) {
      const { agents } = get();
      set({ 
        agents: agents.filter(a => a._id !== id),
        isLoading: false 
      });
    } else {
      set({ error: result.error, isLoading: false });
    }
    return result;
  },

  // Set selected agent
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  // Clear selected agent
  clearSelectedAgent: () => set({ selectedAgent: null }),

  // Set website data
  setWebsiteData: (data) => set({ websiteData: data }),

  // Clear website data
  clearWebsiteData: () => set({ websiteData: null })
}));