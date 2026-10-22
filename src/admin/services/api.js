import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Create axios instance with optimized configuration for faster loading
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout for admin operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/admin/token/refresh/`,
            { refresh: refreshToken }
          );
          
          const { access } = response.data;
          localStorage.setItem('accessToken', access);
          
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/admin/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const adminApiService = {
  auth: {
    login: (data) => api.post('/admin/login/', data),
    refreshToken: (data) => api.post('/admin/token/refresh/', data),
  },
  partnerships: {
    getAll: () => api.get('/admin/partnerships/'),
    create: (data) => api.post('/admin/partnerships/', data),
    update: (id, data) => api.put(`/admin/partnerships/${id}/`, data),
    delete: (id) => api.delete(`/admin/partnerships/${id}/`),
  },
  products: {
    getAll: () => api.get('/admin/products/'),
    create: (data) => api.post('/admin/products/', data),
    update: (id, data) => api.put(`/admin/products/${id}/`, data),
    delete: (id) => api.delete(`/admin/products/${id}/`),
  },
  requestForms: {
    getAll: () => api.get('/admin/requestforms/'),
    getById: (id) => api.get(`/admin/requestforms/${id}/`),
    updateStatus: (id, status) => api.patch(`/admin/requestforms/${id}/update_status/`, { status }),
    delete: (id) => api.delete(`/admin/requestforms/${id}/`),
  },
  projectReferences: {
    getAll: () => api.get('/admin/projectreferences/'),
    create: (data) => api.post('/admin/projectreferences/', data),
    update: (id, data) => api.put(`/admin/projectreferences/${id}/`, data),
    delete: (id) => api.delete(`/admin/projectreferences/${id}/`),
    toggleFavorite: (id) => api.post(`/admin/projectreferences/${id}/toggle_favorite/`),
    getFavorites: () => api.get('/admin/projectreferences/favorites/'),
  },
  news: {
    getAll: () => api.get('/admin/news/'),
    create: (data) => {
      return api.post('/admin/news/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    update: (id, data) => {
      return api.put(`/admin/news/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    delete: (id) => api.delete(`/admin/news/${id}/`),
  },
  articles: {
    getAll: () => api.get('/admin/articles/'),
    getById: (id) => api.get(`/admin/articles/${id}/`),
    create: (data) => {
      return api.post('/admin/articles/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    update: (id, data) => {
      return api.put(`/admin/articles/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    delete: (id) => api.delete(`/admin/articles/${id}/`),
    uploadArticle: (formData) => {
      return api.post('/admin/articles/upload_article/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  },
};

export default api;