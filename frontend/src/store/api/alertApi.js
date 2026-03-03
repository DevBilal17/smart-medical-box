import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/constants';

export const alertApi = createApi({
  reducerPath: 'alertApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/alerts`,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Alerts', 'Alert', 'Statistics', 'Settings'],
  endpoints: (builder) => ({
    // ========== ALERT MANAGEMENT ==========
    getAlerts: builder.query({
      query: ({ status, severity, type, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (severity) params.append('severity', severity);
        if (type) params.append('type', type);
        params.append('page', page);
        params.append('limit', limit);
        return `/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Alerts', id })),
              { type: 'Alerts', id: 'LIST' },
            ]
          : [{ type: 'Alerts', id: 'LIST' }],
      transformResponse: (response) => response,
    }),

    getAlertById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Alert', id }],
      transformResponse: (response) => response.data,
    }),

    updateAlert: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Alert', id },
        { type: 'Alerts', id: 'LIST' },
        { type: 'Statistics' },
      ],
      transformResponse: (response) => response.data,
    }),

    deleteAlert: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Alerts', id: 'LIST' },
        { type: 'Statistics' },
      ],
    }),

    // ========== BULK OPERATIONS ==========
    markMultipleAsRead: builder.mutation({
      query: (alertIds) => ({
        url: '/mark-read',
        method: 'POST',
        body: { alertIds },
      }),
      invalidatesTags: [
        { type: 'Alerts', id: 'LIST' },
        { type: 'Statistics' },
      ],
      transformResponse: (response) => response.data,
    }),

    deleteMultipleAlerts: builder.mutation({
      query: (alertIds) => ({
        url: '/delete-multiple',
        method: 'POST',
        body: { alertIds },
      }),
      invalidatesTags: [
        { type: 'Alerts', id: 'LIST' },
        { type: 'Statistics' },
      ],
    }),

    // ========== COUNTS AND STATISTICS ==========
    getUnreadCount: builder.query({
      query: () => '/unread-count',
      providesTags: ['Statistics'],
      transformResponse: (response) => response.data.unreadCount,
    }),

    getAlertStatistics: builder.query({
      query: ({ days = 30, groupBy = 'day' }) => 
        `/statistics?days=${days}&groupBy=${groupBy}`,
      providesTags: ['Statistics'],
      transformResponse: (response) => response.data,
    }),

    getAlertTrends: builder.query({
      query: ({ startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/trends?${params.toString()}`;
      },
      providesTags: ['Statistics'],
      transformResponse: (response) => response.data,
    }),

    // ========== ALERT SETTINGS ==========
    getAlertSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    updateAlertSettings: builder.mutation({
      query: (settings) => ({
        url: '/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    // ========== ALERT TYPES ==========
    getAlertTypes: builder.query({
      query: () => '/types',
      transformResponse: (response) => response.data,
    }),

    getAlertSeverities: builder.query({
      query: () => '/severities',
      transformResponse: (response) => response.data,
    }),

    // ========== SUBSCRIPTIONS ==========
    subscribeToAlerts: builder.mutation({
      query: ({ channels, types, severity }) => ({
        url: '/subscribe',
        method: 'POST',
        body: { channels, types, severity },
      }),
      invalidatesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    unsubscribeFromAlerts: builder.mutation({
      query: () => ({
        url: '/unsubscribe',
        method: 'POST',
      }),
      invalidatesTags: ['Settings'],
    }),

    // ========== EXPORT ==========
    exportAlerts: builder.mutation({
      query: ({ format = 'csv', dateRange, status, severity }) => ({
        url: '/export',
        method: 'POST',
        body: { format, dateRange, status, severity },
      }),
      transformResponse: (response) => response.data,
    }),

    // ========== NOTIFICATIONS ==========
    sendTestNotification: builder.mutation({
      query: ({ channel }) => ({
        url: '/test-notification',
        method: 'POST',
        body: { channel },
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  // Alert Management
  useGetAlertsQuery,
  useGetAlertByIdQuery,
  useUpdateAlertMutation,
  useDeleteAlertMutation,
  
  // Bulk Operations
  useMarkMultipleAsReadMutation,
  useDeleteMultipleAlertsMutation,
  
  // Counts and Statistics
  useGetUnreadCountQuery,
  useGetAlertStatisticsQuery,
  useGetAlertTrendsQuery,
  
  // Alert Settings
  useGetAlertSettingsQuery,
  useUpdateAlertSettingsMutation,
  
  // Alert Types
  useGetAlertTypesQuery,
  useGetAlertSeveritiesQuery,
  
  // Subscriptions
  useSubscribeToAlertsMutation,
  useUnsubscribeFromAlertsMutation,
  
  // Export
  useExportAlertsMutation,
  
  // Notifications
  useSendTestNotificationMutation,
} = alertApi;