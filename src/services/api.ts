import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clubz_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('clubz_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.patch('/auth/me', data),
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

  // Tickets
  getTicketTypes: (id: string) => api.get(`/events/${id}/tickets`),
  createTicketType: (id: string, data: any) => api.post(`/events/${id}/tickets`, data),

  // Analytics & Activity
  getStats: (id: string) => api.get(`/events/${id}/analytics`),
  getGlobalStats: (communityId?: string | null) => api.get('/events/stats/global', { params: { communityId } }),
  getGlobalHistory: (communityId?: string | null) =>
    api.get('/events/stats/history', { params: communityId ? { communityId } : {} }),
  getRecentActivity: (communityId?: string | null) =>
    api.get('/events/activity/recent', { params: communityId ? { communityId } : {} }),

  // Participation & Check-in
  getAttendees: (id: string) => api.get(`/events/${id}/attendees`),
  checkIn: (eventId: string, qrCodeToken: string) =>
    api.patch(`/events/${eventId}/check-in`, { qrCodeToken }),

  // AI & Utils
  autoGenerate: (url: string) => api.post('/events/auto-generate', { url }),
  getCalendar: (id: string) => api.get(`/events/${id}/calendar`),

  // Gamification
  getGamification: (id: string) => api.get(`/events/${id}/gamification`),
  updateGamification: (id: string, data: any) => api.patch(`/events/${id}/gamification`, data),
};

export const communityService = {
  // Core Community
  getAll: () => api.get('/communities'),
  getOne: (id: string) => api.get(`/communities/${id}`),
  create: (data: any) => api.post('/communities', data),
  update: (id: string, data: any) => api.patch(`/communities/${id}`, data),
  submitKyc: (id: string, kycDocumentUrl: string) => api.post(`/communities/${id}/kyc`, { kycDocumentUrl }),

  // Members & Invitations
  getMembers: (communityId: string) => api.get(`/communities/${communityId}/members`),
  getMyMembers: (communityId?: string | null) =>
    api.get('/communities/my-members', { params: communityId ? { communityId } : {} }),
  getPendingRequests: (communityId: string) => api.get(`/communities/${communityId}/requests`),
  getChannels: (communityId: string) => api.get(`/communities/${communityId}/channels`),
  respondToRequest: (communityId: string, userId: string, action: 'accept' | 'reject') =>
    api.post(`/communities/${communityId}/requests/${userId}/${action}`),
  inviteMember: (communityId: string, userId: string) =>
    api.post(`/communities/${communityId}/invite`, { userId }),
  kickMember: (communityId: string, userId: string) =>
    api.delete(`/communities/${communityId}/members/${userId}`),
  removeMember: (communityId: string, userId: string) =>
    api.delete(`/communities/${communityId}/members/${userId}`),

  // Roles
  getRoles: (communityId: string) => api.get(`/communities/${communityId}/roles`),
  updateMemberRole: (communityId: string, userId: string, roleId: string) =>
    api.post(`/communities/${communityId}/roles/assign`, { userId, roleId }),

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

export default api;
