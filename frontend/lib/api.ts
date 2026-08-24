// API client — all calls go through here
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  register: (data: any) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/api/auth/me'),
};

// ── Orders ────────────────────────────────────────────────────────────────
export const orders = {
  calculate: (data: any) => request('/api/orders/calculate', { method: 'POST', body: JSON.stringify(data) }),
  create: (data: any) => request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/orders${qs}`);
  },
  track: (trackingNumber: string) => request(`/api/orders/track/${trackingNumber}`),
  get: (id: number) => request(`/api/orders/${id}`),
  updateStatus: (id: number, data: any) => request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  fail: (id: number, data: any) => request(`/api/orders/${id}/fail`, { method: 'POST', body: JSON.stringify(data) }),
  reschedule: (id: number, data: any) => request(`/api/orders/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
  assign: (id: number, agentId: number) => request(`/api/orders/${id}/assign`, { method: 'POST', body: JSON.stringify({ agent_id: agentId }) }),
  autoAssign: (id: number) => request(`/api/orders/${id}/auto-assign`, { method: 'POST' }),
  intelligence: (id: number) => request(`/api/orders/${id}/intelligence`),
};

// ── Admin ─────────────────────────────────────────────────────────────────
export const admin = {
  dashboard: () => request('/api/admin/dashboard'),
  orders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/admin/orders${qs}`);
  },
  users: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/admin/users${qs}`);
  },
  customers: () => request('/api/admin/customers'),
  agents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/admin/agents${qs}`);
  },
  createAgent: (data: any) => request('/api/admin/agents', { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (id: number, data: any) => request(`/api/admin/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  zones: () => request('/api/admin/zones'),
  createZone: (data: any) => request('/api/admin/zones', { method: 'POST', body: JSON.stringify(data) }),
  updateZone: (id: number, data: any) => request(`/api/admin/zones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  areas: (zoneId?: number) => request(`/api/admin/areas${zoneId ? `?zone_id=${zoneId}` : ''}`),
  createArea: (data: any) => request('/api/admin/areas', { method: 'POST', body: JSON.stringify(data) }),
  updateArea: (id: number, data: any) => request(`/api/admin/areas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  rates: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/admin/rates${qs}`);
  },
  createRate: (data: any) => request('/api/admin/rates', { method: 'POST', body: JSON.stringify(data) }),
  updateRate: (id: number, data: any) => request(`/api/admin/rates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRate: (id: number) => request(`/api/admin/rates/${id}`, { method: 'DELETE' }),
  controlTowerSummary: () => request<import('@/types').ControlTowerSummary>('/api/admin/control-tower/summary'),
};


// ── Agent ─────────────────────────────────────────────────────────────────
export const agentApi = {
  profile: () => request('/api/agent/profile'),
  dashboard: () => request('/api/agent/dashboard'),
  orders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/agent/orders${qs}`);
  },
  updateAvailability: (status: string) => request('/api/agent/availability', { method: 'PATCH', body: JSON.stringify({ availability_status: status }) }),
  updateLocation: (data: any) => request('/api/agent/location', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Notifications ──────────────────────────────────────────────────────────
export const notifications = {
  list: (unreadOnly?: boolean) => request(`/api/notifications${unreadOnly ? '?unread_only=true' : ''}`),
  markRead: (id: number) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/api/notifications/read-all', { method: 'PATCH' }),
  unreadCount: () => request('/api/notifications/unread-count'),
};
