// src/services/companyProfile.js
import { api } from './api';

export const companyProfileService = {
  get: () => api.get('/company-profile'),
  save: ({ url, aiDescription, businessServices }) =>
    api.put('/company-profile', { url, aiDescription, businessServices }),
  clear: () => api.delete('/company-profile'),
};