import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/constants';

export const medicineApi = createApi({
  reducerPath: 'medicineApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/medicines`,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Medicines', 'Medicine', 'Categories', 'Interactions', 'Inventory'],
  endpoints: (builder) => ({
    // ========== MEDICINE CATALOG ==========
    searchMedicines: builder.query({
      query: ({ query, category, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (category) params.append('category', category);
        params.append('page', page);
        params.append('limit', limit);
        return `/search?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Medicines', id })),
              { type: 'Medicines', id: 'SEARCH' },
            ]
          : [{ type: 'Medicines', id: 'SEARCH' }],
      transformResponse: (response) => response,
    }),

    getMedicineById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Medicine', id }],
      transformResponse: (response) => response.data,
    }),

    getMedicinesByCategory: builder.query({
      query: ({ category, page = 1, limit = 20 }) => 
        `/category/${category}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { category }) => [
        { type: 'Categories', id: category },
      ],
      transformResponse: (response) => response,
    }),

    getPopularMedicines: builder.query({
      query: ({ limit = 10 }) => `/popular?limit=${limit}`,
      providesTags: [{ type: 'Medicines', id: 'POPULAR' }],
      transformResponse: (response) => response.data,
    }),

    getRecentlyAddedMedicines: builder.query({
      query: ({ limit = 10 }) => `/recent?limit=${limit}`,
      providesTags: [{ type: 'Medicines', id: 'RECENT' }],
      transformResponse: (response) => response.data,
    }),

    // ========== MEDICINE DETAILS ==========
    getMedicineDetails: builder.query({
      query: (id) => `/${id}/details`,
      providesTags: (result, error, id) => [{ type: 'Medicine', id }],
      transformResponse: (response) => response.data,
    }),

    getMedicineAlternatives: builder.query({
      query: (id) => `/${id}/alternatives`,
      providesTags: (result, error, id) => [{ type: 'Medicine', id }],
      transformResponse: (response) => response.data,
    }),

    // ========== CATEGORIES ==========
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Categories'],
      transformResponse: (response) => response.data,
    }),

    getCategoryDetails: builder.query({
      query: (category) => `/categories/${category}`,
      providesTags: (result, error, category) => [
        { type: 'Categories', id: category },
      ],
      transformResponse: (response) => response.data,
    }),

    // ========== INTERACTIONS ==========
    checkInteraction: builder.mutation({
      query: ({ medicineIds }) => ({
        url: '/interactions/check',
        method: 'POST',
        body: { medicineIds },
      }),
      transformResponse: (response) => response.data,
    }),

    getMedicineInteractions: builder.query({
      query: (id) => `/${id}/interactions`,
      providesTags: (result, error, id) => [{ type: 'Interactions', id }],
      transformResponse: (response) => response.data,
    }),

    // ========== SIDE EFFECTS ==========
    getSideEffects: builder.query({
      query: (id) => `/${id}/side-effects`,
      providesTags: (result, error, id) => [{ type: 'Medicine', id }],
      transformResponse: (response) => response.data,
    }),

    // ========== DOSAGE INFORMATION ==========
    getDosageInfo: builder.query({
      query: (id) => `/${id}/dosage`,
      providesTags: (result, error, id) => [{ type: 'Medicine', id }],
      transformResponse: (response) => response.data,
    }),

    calculateDosage: builder.mutation({
      query: ({ medicineId, weight, age, condition }) => ({
        url: '/dosage/calculate',
        method: 'POST',
        body: { medicineId, weight, age, condition },
      }),
      transformResponse: (response) => response.data,
    }),

    // ========== INVENTORY (For pharmacies/hospitals) ==========
    getInventory: builder.query({
      query: ({ page = 1, limit = 20 }) => 
        `/inventory?page=${page}&limit=${limit}`,
      providesTags: ['Inventory'],
      transformResponse: (response) => response,
    }),

    updateInventory: builder.mutation({
      query: ({ medicineId, quantity, action }) => ({
        url: `/inventory/${medicineId}`,
        method: 'PATCH',
        body: { quantity, action },
      }),
      invalidatesTags: ['Inventory'],
      transformResponse: (response) => response.data,
    }),

    getLowStockAlert: builder.query({
      query: ({ threshold = 10 }) => `/inventory/low-stock?threshold=${threshold}`,
      providesTags: ['Inventory'],
      transformResponse: (response) => response.data,
    }),

    // ========== PRESCRIPTION TEMPLATES ==========
    getPrescriptionTemplates: builder.query({
      query: () => '/templates',
      providesTags: ['Templates'],
      transformResponse: (response) => response.data,
    }),

    createPrescriptionTemplate: builder.mutation({
      query: (templateData) => ({
        url: '/templates',
        method: 'POST',
        body: templateData,
      }),
      invalidatesTags: ['Templates'],
      transformResponse: (response) => response.data,
    }),

    // ========== MANUFACTURERS ==========
    getManufacturers: builder.query({
      query: () => '/manufacturers',
      transformResponse: (response) => response.data,
    }),

    getMedicinesByManufacturer: builder.query({
      query: ({ manufacturer, page = 1, limit = 20 }) => 
        `/manufacturer/${manufacturer}?page=${page}&limit=${limit}`,
      transformResponse: (response) => response,
    }),

    // ========== FAVORITES ==========
    getFavoriteMedicines: builder.query({
      query: () => '/favorites',
      providesTags: ['Medicines'],
      transformResponse: (response) => response.data,
    }),

    addToFavorites: builder.mutation({
      query: (medicineId) => ({
        url: `/favorites/${medicineId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Medicines'],
    }),

    removeFromFavorites: builder.mutation({
      query: (medicineId) => ({
        url: `/favorites/${medicineId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Medicines'],
    }),

    // ========== HISTORY ==========
    getMedicineHistory: builder.query({
      query: ({ medicineId, days = 30 }) => 
        `/${medicineId}/history?days=${days}`,
      providesTags: (result, error, { medicineId }) => [
        { type: 'Medicine', id: medicineId },
      ],
      transformResponse: (response) => response.data,
    }),

    // ========== ADMIN ONLY ==========
    addMedicine: builder.mutation({
      query: (medicineData) => ({
        url: '/',
        method: 'POST',
        body: medicineData,
      }),
      invalidatesTags: [
        { type: 'Medicines', id: 'LIST' },
        { type: 'Categories' },
      ],
      transformResponse: (response) => response.data,
    }),

    updateMedicine: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Medicine', id },
        { type: 'Medicines', id: 'LIST' },
      ],
      transformResponse: (response) => response.data,
    }),

    deleteMedicine: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Medicines', id: 'LIST' },
        { type: 'Categories' },
      ],
    }),

    bulkImportMedicines: builder.mutation({
      query: (formData) => ({
        url: '/bulk-import',
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      invalidatesTags: [
        { type: 'Medicines', id: 'LIST' },
        { type: 'Categories' },
      ],
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  // Medicine Catalog
  useSearchMedicinesQuery,
  useGetMedicineByIdQuery,
  useGetMedicinesByCategoryQuery,
  useGetPopularMedicinesQuery,
  useGetRecentlyAddedMedicinesQuery,
  
  // Medicine Details
  useGetMedicineDetailsQuery,
  useGetMedicineAlternativesQuery,
  
  // Categories
  useGetCategoriesQuery,
  useGetCategoryDetailsQuery,
  
  // Interactions
  useCheckInteractionMutation,
  useGetMedicineInteractionsQuery,
  
  // Side Effects
  useGetSideEffectsQuery,
  
  // Dosage Information
  useGetDosageInfoQuery,
  useCalculateDosageMutation,
  
  // Inventory
  useGetInventoryQuery,
  useUpdateInventoryMutation,
  useGetLowStockAlertQuery,
  
  // Prescription Templates
  useGetPrescriptionTemplatesQuery,
  useCreatePrescriptionTemplateMutation,
  
  // Manufacturers
  useGetManufacturersQuery,
  useGetMedicinesByManufacturerQuery,
  
  // Favorites
  useGetFavoriteMedicinesQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  
  // History
  useGetMedicineHistoryQuery,
  
  // Admin Only
  useAddMedicineMutation,
  useUpdateMedicineMutation,
  useDeleteMedicineMutation,
  useBulkImportMedicinesMutation,
} = medicineApi;