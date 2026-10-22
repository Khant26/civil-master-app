import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiService } from '../services/api';

// Query Keys for admin operations
export const ADMIN_QUERY_KEYS = {
  PRODUCTS: ['admin', 'products'],
  PARTNERSHIPS: ['admin', 'partnerships'],
  PROJECT_REFERENCES: ['admin', 'projectReferences'],
  NEWS: ['admin', 'news'],
  ARTICLES: ['admin', 'articles'],
  PRODUCT_BY_ID: (id) => ['admin', 'products', id],
  PARTNERSHIP_BY_ID: (id) => ['admin', 'partnerships', id],
  PROJECT_REFERENCE_BY_ID: (id) => ['admin', 'projectReferences', id],
  NEWS_BY_ID: (id) => ['admin', 'news', id],
  ARTICLE_BY_ID: (id) => ['admin', 'articles', id],
};

// Products Hooks
export const useAdminProducts = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.PRODUCTS,
    queryFn: async () => {
      const response = await adminApiService.products.getAll();
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData) => adminApiService.products.create(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PRODUCTS });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, productData }) => adminApiService.products.update(id, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PRODUCTS });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => adminApiService.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PRODUCTS });
    },
  });
};

// Partnerships Hooks
export const useAdminPartnerships = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.PARTNERSHIPS,
    queryFn: async () => {
      const response = await adminApiService.partnerships.getAll();
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreatePartnership = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (partnershipData) => adminApiService.partnerships.create(partnershipData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PARTNERSHIPS });
    },
  });
};

export const useUpdatePartnership = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, partnershipData }) => adminApiService.partnerships.update(id, partnershipData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PARTNERSHIPS });
    },
  });
};

export const useDeletePartnership = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => adminApiService.partnerships.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PARTNERSHIPS });
    },
  });
};

// Project References Hooks
export const useAdminProjectReferences = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.PROJECT_REFERENCES,
    queryFn: async () => {
      const response = await adminApiService.projectReferences.getAll();
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateProjectReference = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectData) => adminApiService.projectReferences.create(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PROJECT_REFERENCES });
    },
  });
};

export const useUpdateProjectReference = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, projectData }) => adminApiService.projectReferences.update(id, projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PROJECT_REFERENCES });
    },
  });
};

export const useDeleteProjectReference = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => adminApiService.projectReferences.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.PROJECT_REFERENCES });
    },
  });
};

// News Hooks
export const useAdminNews = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.NEWS,
    queryFn: async () => {
      const response = await adminApiService.news.getAll();
      return response.data;
    },
    staleTime: 1000 * 60 * 1, // 1 minute for news (more frequent updates)
  });
};

export const useCreateNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newsData) => adminApiService.news.create(newsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.NEWS });
    },
  });
};

export const useUpdateNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, newsData }) => adminApiService.news.update(id, newsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.NEWS });
    },
  });
};

export const useDeleteNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => adminApiService.news.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.NEWS });
    },
  });
};

// Articles Hooks
export const useAdminArticles = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.ARTICLES,
    queryFn: async () => {
      const response = await adminApiService.articles.getAll();
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (articleData) => adminApiService.articles.create(articleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ARTICLES });
    },
  });
};

export const useUploadArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (articleData) => adminApiService.articles.uploadArticle(articleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ARTICLES });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, articleData }) => adminApiService.articles.update(id, articleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ARTICLES });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => adminApiService.articles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ARTICLES });
    },
  });
};