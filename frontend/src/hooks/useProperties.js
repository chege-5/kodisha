import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getFriendlyError } from '../utils/apiClient';
import toast from 'react-hot-toast';

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get('/landlords/properties').then((r) => r.data),
  });
}

export function useAddProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/landlords/properties', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries(['properties']); toast.success('Property added'); },
    onError: (err) => toast.error(getFriendlyError(err, 'Failed to add property')),
  });
}

export function useAddUnit(propertyId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/landlords/properties/${propertyId}/units`, data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries(['properties']); toast.success('Unit added'); },
    onError: (err) => toast.error(getFriendlyError(err, 'Failed to add unit')),
  });
}
