import axios from 'axios';

const getApiUrl = () => {
  const envVar = typeof window !== 'undefined' ? (window as any).ENV?.VITE_API_BASE_URL : null;
  return envVar || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('klyb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a response interceptor to handle 401 errors and refresh token
// 403 (Forbidden) is propagated as-is — components handle permission errors themselves
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('klyb_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data?.data?.accessToken || res.data?.data?.token;

          if (newAccessToken) {
            localStorage.setItem('klyb_token', newAccessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            processQueue(null, newAccessToken);
            isRefreshing = false;
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          localStorage.removeItem('klyb_token');
          localStorage.removeItem('klyb_refresh_token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        isRefreshing = false;
        localStorage.removeItem('klyb_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.patch('/auth/me', data),
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
};

export const userService = {
  generateApiKey: () => api.post('/users/api-key'),
  revokeApiKey: () => api.delete('/users/api-key'),
};

export const eventService = {
  // Core Events
  getAll: (communityId?: string | null) =>
    api.get('/events', { params: communityId ? { communityId } : {} }),
  getOne: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.patch(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  duplicate: (id: string) => api.post(`/events/${id}/duplicate`),

  // Analytics & Activity
  getStats: (id: string) => api.get(`/events/${id}/analytics`),
  getGlobalStats: (communityId?: string | null) => api.get('/events/stats/global', { params: { communityId } }),
  getGlobalHistory: (communityId?: string | null, days = 7) =>
    api.get('/events/stats/history', {
      params: { ...(communityId ? { communityId } : {}), days },
    }),
  getAdvancedStats: (communityId?: string | null, days = 30) =>
    api.get('/events/stats/advanced', {
      params: { ...(communityId ? { communityId } : {}), days },
    }),
  getRecentActivity: (communityId?: string | null) =>
    api.get('/events/activity/recent', { params: communityId ? { communityId } : {} }),

  // Participation & Check-in
  getAttendees: (id: string) => api.get(`/events/${id}/attendees`),
  checkIn: (eventId: string, qrCodeToken: string) =>
    api.patch(`/events/${eventId}/check-in`, { qrCodeToken }),

  // AI & Utils
  autoGenerate: (url: string) => api.post('/events/auto-generate', { url }),
  getCalendar: (id: string) => api.get(`/events/${id}/calendar`),

};

export const communityService = {
  // Core Community
  getAll: () => api.get('/communities'),
  getOne: (id: string) => api.get(`/communities/${id}`),
  create: (data: any) => api.post('/communities', data),
  update: (id: string, data: any) => api.patch(`/communities/${id}`, data),
  submitKyc: (
    id: string,
    kycDocumentUrl: string,
    kycDescription: string,
    associationType?: string,
    officialName?: string,
    registrationNumber?: string,
    declarantRole?: string,
    representativeName?: string,
    headquartersAddress?: string
  ) => api.post(`/communities/${id}/kyc`, {
    kycDocumentUrl,
    kycDescription,
    associationType,
    officialName,
    registrationNumber,
    declarantRole,
    representativeName,
    headquartersAddress
  }),

  // Members & Invitations
  getMembers: (communityId: string) => api.get(`/communities/${communityId}/members`),
  getMyMembers: (communityId?: string | null) =>
    api.get('/communities/my-members', { params: communityId ? { communityId } : {} }),
  getPendingRequests: (communityId: string) => api.get(`/communities/${communityId}/requests`),
  getChannels: (communityId: string) => api.get(`/communities/${communityId}/channels`),
  respondToRequest: (communityId: string, userId: string, action: 'accept' | 'reject') =>
    api.post(`/communities/${communityId}/requests/${userId}/${action}`),

  // Affiliations (communautés enfants)
  getParentRequests: (communityId: string) =>
    api.get(`/communities/${communityId}/parent-requests`),
  respondToParentRequest: (communityId: string, childId: string, action: 'accept' | 'reject') =>
    api.post(`/communities/${communityId}/parent-requests/${childId}/${action}`),
  inviteMember: (communityId: string, userId: string) =>
    api.post(`/communities/${communityId}/invite`, { userId }),
  kickMember: (communityId: string, userId: string) =>
    api.delete(`/communities/${communityId}/members/${userId}`),
  removeMember: (communityId: string, userId: string) =>
    api.delete(`/communities/${communityId}/members/${userId}`),

  // Roles & Permissions
  getRoles: (communityId: string) => api.get(`/communities/${communityId}/roles`),
  updateMemberRole: (communityId: string, userId: string, roleId: string) =>
    api.post(`/communities/${communityId}/roles/assign`, { userId, roleId }),
  getMyRole: (communityId: string) => api.get(`/communities/${communityId}/my-role`),

  // Widgets
  getWidgets: (communityId: string) => api.get(`/widget-library/community/${communityId}`),
  toggleWidget: (widgetId: string, enabled: boolean) =>
    api.patch(`/widget-library/${widgetId}`, { enabled }),
};

export const postService = {
  getAll: (communityId: string) => api.get(`/posts/community/${communityId}`),
  getOne: (id: string) => api.get(`/posts/${id}`),
  create: (data: any) => api.post('/posts', data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  like: (id: string) => api.post(`/posts/${id}/like`),
};

export const commentService = {
  getByPost: (postId: string) => api.get(`/posts/${postId}/comments`),
  delete: (postId: string, commentId: string) => api.delete(`/posts/${postId}/comments/${commentId}`),
};

export const roomService = {
  getAll: (communityId?: string | null) =>
    api.get('/rooms', { params: communityId ? { communityId } : {} }),
  getOne: (id: string) => api.get(`/rooms/${id}`),
  create: (data: any) => api.post('/rooms', data),
  join: (id: string) => api.post(`/rooms/${id}/join`),
  getMembers: (id: string) => api.get(`/rooms/${id}/members`),
};

export const chatService = {
  getByRoom: (roomId: string, params?: any) => api.get(`/chats/room/${roomId}`, { params }),
  delete: (id: string) => api.delete(`/chats/${id}`),
};

export const channelService = {
  getAll: (communityId: string) => api.get(`/communities/${communityId}/channels`),
  createCategory: (communityId: string, name: string) =>
    api.post(`/communities/${communityId}/channels/categories`, { name }),
  renameCategory: (communityId: string, categoryId: string, name: string) =>
    api.patch(`/communities/${communityId}/channels/categories/${categoryId}`, { name }),
  deleteCategory: (communityId: string, categoryId: string) =>
    api.delete(`/communities/${communityId}/channels/categories/${categoryId}`),
  createChannel: (communityId: string, categoryId: string, name: string, type: 'text' | 'announcement') => {
    console.log('API CALL: createChannel', { communityId, categoryId, name, type });
    return api.post(`/communities/${communityId}/channels/${categoryId}/channels`, { name, type });
  },
  renameChannel: (communityId: string, channelId: string, name: string) =>
    api.patch(`/communities/${communityId}/channels/channel/${channelId}`, { name }),
  deleteChannel: (communityId: string, channelId: string) =>
    api.delete(`/communities/${communityId}/channels/channel/${channelId}`),
};

export const storageService = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const moderationService = {
  getCommunityReports: (communityId: string, status?: string) =>
    api.get(`/moderation/communities/${communityId}/reports`, { params: status ? { status } : {} }),
  updateCommunityReport: (communityId: string, reportId: string, data: { actionTaken: string; note?: string }) =>
    api.patch(`/moderation/communities/${communityId}/reports/${reportId}`, data),
};

// ============================================
// Promo Codes
// ============================================
export const promoCodeService = {
  getAll: (eventId: string) => api.get(`/events/${eventId}/promo-codes`),
  create: (eventId: string, data: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxUses?: number;
    expiresAt?: string;
  }) => api.post(`/events/${eventId}/promo-codes`, data),
  update: (eventId: string, promoId: string, data: any) =>
    api.patch(`/events/${eventId}/promo-codes/${promoId}`, data),
  delete: (eventId: string, promoId: string) =>
    api.delete(`/events/${eventId}/promo-codes/${promoId}`),
};

// ============================================
// Widget Library (Marketplace + Developer)
// ============================================
export const widgetLibraryService = {
  /** Widgets validés publics — Marketplace */
  getMarketplace: () => api.get('/widget-library/marketplace'),
  /** Mes propres widgets (tous statuts) */
  getMyWidgets: () => api.get('/widget-library/developer/my-widgets'),
  /** Créer un widget */
  create: (data: any) => api.post('/widget-library/developer/create', data),
  /** Mettre à jour un widget (ex: soumission en pending) */
  update: (id: string, data: any) => api.patch(`/widget-library/developer/${id}`, data),
  /** Supprimer un widget */
  delete: (id: string) => api.delete(`/widget-library/developer/${id}`),
  /** Déployer un widget depuis un dossier zip */
  deploy: (file: Blob, manifest: string) => {
    const formData = new FormData();
    formData.append('file', file, 'widget.zip');
    formData.append('manifest', manifest);
    return api.post('/widget-library/developer/deploy', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  /** Modérer un widget (validation/rejet) */
  review: (id: string, data: { status: 'validated' | 'rejected'; reviewComment?: string; remoteUrl?: string; manifestUrl?: string }) => 
    api.post(`/widget-library/${id}/review`, data),
};

// ============================================
// Widget Installations
// ============================================
export const widgetInstallationService = {
  /** Installer un widget dans une communauté */
  install: (widgetId: string, communityId: string, grantedPermissions: string[] = []) =>
    api.post('/widget-installations', { widgetId, communityId, grantedPermissions }),
  /** Widgets installés dans une communauté */
  getByCommunity: (communityId: string) =>
    api.get(`/widget-installations/community/${communityId}`),
};

// ============================================
// Pages (Page Builder)
// ============================================
export const pageService = {
  /** Pages de la communauté */
  getByCommunity: (communityId: string, status?: 'draft' | 'published') =>
    api.get(`/pages/community/${communityId}`, { params: status ? { status } : {} }),
  /** Une page */
  getOne: (id: string) => api.get(`/pages/${id}`),
  /** Créer une page */
  create: (data: { name: string; layout: any; status?: 'draft' | 'published'; communityId?: string }) =>
    api.post('/pages', data),
  /** Mettre à jour une page */
  update: (id: string, data: any) => api.patch(`/pages/${id}`, data),
  /** Supprimer une page */
  delete: (id: string) => api.delete(`/pages/${id}`),
  /** Page publiée d'une communauté */
  getPublished: (communityId: string) =>
    api.get(`/pages/community/${communityId}/published`),
};

// ============================================
// System / Docs
// ============================================
export const systemService = {
  getDeveloperApiDocs: () => api.get('/docs/developers-json'),
};

export default api;
