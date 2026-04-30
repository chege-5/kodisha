import { useQuery } from '@tanstack/react-query';
import api from '../utils/apiClient';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/landlords/dashboard').then((r) => r.data),
    refetchInterval: 60_000, // auto-refresh every minute
  });
}

export function useAirtimeRewards() {
  return useQuery({
    queryKey: ['airtime'],
    queryFn: () => api.get('/airtime').then((r) => r.data),
  });
}

export function useTrustLeaderboard() {
  return useQuery({
    queryKey: ['trustLeaderboard'],
    queryFn: () => api.get('/reports/trust-leaderboard').then((r) => r.data),
  });
}

export function useCreditPassport(tenantId) {
  return useQuery({
    queryKey: ['passport', tenantId],
    queryFn: () => api.get(`/passport/${tenantId}`).then((r) => r.data),
    enabled: !!tenantId,
  });
}
