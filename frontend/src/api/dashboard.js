import api from './client';

export const getDashboardSummary = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.month) query.append('month', params.month);
  if (params.year) query.append('year', params.year);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const response = await api.get(`/dashboard/summary?${query.toString()}`);
  return response.data;
};
