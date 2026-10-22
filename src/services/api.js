import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create axios instance with optimized configuration for faster loading
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ChatBot persistence helper functions
// Using sessionStorage so chat history clears when tab is closed or page is refreshed
const CHATBOT_STORAGE_KEY = 'chatbot_messages';
const CHATBOT_STATE_KEY = 'chatbot_state';

export const chatBotStorage = {
  // Save chat messages to sessionStorage (clears on tab close/refresh)
  saveMessages: (messages) => {
    try {
      sessionStorage.setItem(CHATBOT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.warn('Failed to save chat messages:', error);
    }
  },

  // Load chat messages from sessionStorage
  loadMessages: () => {
    try {
      const saved = sessionStorage.getItem(CHATBOT_STORAGE_KEY);
      if (saved) {
        const messages = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return messages.map(message => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load chat messages:', error);
    }
    // Return default welcome message if no saved messages
    return [
      {
        id: 1,
        text: "Hello! I'm CMS Bot. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      }
    ];
  },

  // Save chatbot open/close state to sessionStorage
  saveState: (isOpen) => {
    try {
      sessionStorage.setItem(CHATBOT_STATE_KEY, JSON.stringify({ isOpen }));
    } catch (error) {
      console.warn('Failed to save chatbot state:', error);
    }
  },

  // Load chatbot open/close state from sessionStorage
  loadState: () => {
    try {
      const saved = sessionStorage.getItem(CHATBOT_STATE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load chatbot state:', error);
    }
    return { isOpen: false };
  },

  // Clear chat history
  clearMessages: () => {
    try {
      sessionStorage.removeItem(CHATBOT_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear chat messages:', error);
    }
  }
};

// API Service for all endpoints
export const apiService = {
  // Partnership APIs
  partnerships: {
    getAll: () => api.get('/partnerships/'),
    getById: (id) => api.get(`/partnerships/${id}/`),
  },

  // Product APIs
  products: {
    getAll: () => api.get('/products/'),
    getById: (id) => api.get(`/products/${id}/`),
  },

  // Project Reference APIs
  projectReferences: {
    getAll: () => api.get('/projectreferences/'),
    getById: (id) => api.get(`/projectreferences/${id}/`),
    getFavorites: () => api.get('/projectreferences/favorites/'),
  },

  // News APIs
  news: {
    getAll: () => api.get('/news/'),
    getById: (id) => api.get(`/news/${id}/`),
    submit: (data) => api.post('/news/', data),
  },

  // Articles APIs
  articles: {
    getAll: () => api.get('/articles/'),
    getById: (id) => api.get(`/articles/${id}/`),
  },

  // Request Form API
  requestForm: {
    submit: (data) => api.post('/requestforms/', data),
  },

  // Chatbot API
  chatbot: {
    sendMessage: (data) => api.post('/chatbot/', data),
  },
};

export default api;
