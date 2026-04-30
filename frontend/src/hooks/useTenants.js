import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';

export function useTenants(params = {}) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: () => api.get('/tenants', { params }).then((r) => r.data),
  });
}

export function useTenant(id) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/tenants/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAddTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/tenants', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries(['tenants']); toast.success('Tenant added'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add tenant'),
  });
}

export function useTenantPayments(tenantId) {
  return useQuery({
    queryKey: ['payments', tenantId],
    queryFn: () => api.get(`/tenants/${tenantId}/payments`).then((r) => r.data),
    enabled: !!tenantId,
  });
}

export function useLogPayment(tenantId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/tenants/${tenantId}/payments`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['payments', tenantId]);
      qc.invalidateQueries(['dashboard']);
      toast.success('Payment logged');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to log payment'),
  });
}

export function useSTKPush() {
  return useMutation({
    mutationFn: (data) => api.post('/mpesa/stkpush', data).then((r) => r.data),
    onSuccess: () => toast.success('M-Pesa prompt sent to tenant\'s phone'),
    onError: (err) => toast.error(err.response?.data?.error || 'STK push failed'),
  });
}
