import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/constants'

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/notifications`,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Notifications', 'Settings', 'Devices'],
  endpoints: (builder) => ({
    // ========== NOTIFICATION MANAGEMENT ==========
    getNotifications: builder.query({
      query: ({ status, type, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (type) params.append('type', type);
        params.append('page', page);
        params.append('limit', limit);
        return `/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Notifications', id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
      transformResponse: (response) => response,
    }),

    getNotificationById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Notifications', id }],
      transformResponse: (response) => response.data,
    }),

    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),

    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/read-all',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),

    deleteAllNotifications: builder.mutation({
      query: () => ({
        url: '/delete-all',
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),

    // ========== COUNTS ==========
    getUnreadCount: builder.query({
      query: () => '/unread-count',
      providesTags: ['Notifications'],
      transformResponse: (response) => response.data.count,
    }),

    // ========== SETTINGS ==========
    getNotificationSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    updateNotificationSettings: builder.mutation({
      query: (settings) => ({
        url: '/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    // ========== DEVICE TOKENS ==========
    registerPushToken: builder.mutation({
      query: ({ token, platform }) => ({
        url: '/devices',
        method: 'POST',
        body: { token, platform },
      }),
      invalidatesTags: ['Devices'],
      transformResponse: (response) => response.data,
    }),

    unregisterPushToken: builder.mutation({
      query: (token) => ({
        url: '/devices',
        method: 'DELETE',
        body: { token },
      }),
      invalidatesTags: ['Devices'],
    }),

    getRegisteredDevices: builder.query({
      query: () => '/devices',
      providesTags: ['Devices'],
      transformResponse: (response) => response.data,
    }),

    // ========== PREFERENCES ==========
    getNotificationPreferences: builder.query({
      query: () => '/preferences',
      providesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    updateNotificationPreferences: builder.mutation({
      query: (preferences) => ({
        url: '/preferences',
        method: 'PUT',
        body: preferences,
      }),
      invalidatesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    // ========== SCHEDULED NOTIFICATIONS ==========
    getScheduledNotifications: builder.query({
      query: () => '/scheduled',
      providesTags: ['Notifications'],
      transformResponse: (response) => response.data,
    }),

    scheduleNotification: builder.mutation({
      query: (notificationData) => ({
        url: '/scheduled',
        method: 'POST',
        body: notificationData,
      }),
      invalidatesTags: ['Notifications'],
      transformResponse: (response) => response.data,
    }),

    cancelScheduledNotification: builder.mutation({
      query: (id) => ({
        url: `/scheduled/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // ========== TYPES ==========
    getNotificationTypes: builder.query({
      query: () => '/types',
      transformResponse: (response) => response.data,
    }),

    // ========== TEST ==========
    sendTestNotification: builder.mutation({
      query: ({ channel, type }) => ({
        url: '/test',
        method: 'POST',
        body: { channel, type },
      }),
      transformResponse: (response) => response.data,
    }),

    // ========== HISTORY ==========
    getNotificationHistory: builder.query({
      query: ({ days = 7, page = 1, limit = 50 }) => 
        `/history?days=${days}&page=${page}&limit=${limit}`,
      providesTags: ['Notifications'],
      transformResponse: (response) => response,
    }),

    getNotificationStatistics: builder.query({
      query: ({ days = 30 }) => `/statistics?days=${days}`,
      providesTags: ['Notifications'],
      transformResponse: (response) => response.data,
    }),

    // ========== SUBSCRIPTIONS ==========
    subscribeToTopic: builder.mutation({
      query: (topic) => ({
        url: '/subscribe',
        method: 'POST',
        body: { topic },
      }),
      transformResponse: (response) => response.data,
    }),

    unsubscribeFromTopic: builder.mutation({
      query: (topic) => ({
        url: '/unsubscribe',
        method: 'POST',
        body: { topic },
      }),
      transformResponse: (response) => response.data,
    }),

    getSubscribedTopics: builder.query({
      query: () => '/subscriptions',
      transformResponse: (response) => response.data,
    }),

    // ========== QUIET HOURS ==========
    getQuietHours: builder.query({
      query: () => '/quiet-hours',
      providesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    setQuietHours: builder.mutation({
      query: ({ enabled, startTime, endTime }) => ({
        url: '/quiet-hours',
        method: 'POST',
        body: { enabled, startTime, endTime },
      }),
      invalidatesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    // ========== EXPORT ==========
    exportNotificationHistory: builder.mutation({
      query: ({ format = 'csv', dateRange }) => ({
        url: '/export',
        method: 'POST',
        body: { format, dateRange },
      }),
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  // Notification Management
  useGetNotificationsQuery,
  useGetNotificationByIdQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
  
  // Counts
  useGetUnreadCountQuery,
  
  // Settings
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  
  // Device Tokens
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
  useGetRegisteredDevicesQuery,
  
  // Preferences
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  
  // Scheduled Notifications
  useGetScheduledNotificationsQuery,
  useScheduleNotificationMutation,
  useCancelScheduledNotificationMutation,
  
  // Types
  useGetNotificationTypesQuery,
  
  // Test
  useSendTestNotificationMutation,
  
  // History
  useGetNotificationHistoryQuery,
  useGetNotificationStatisticsQuery,
  
  // Subscriptions
  useSubscribeToTopicMutation,
  useUnsubscribeFromTopicMutation,
  useGetSubscribedTopicsQuery,
  
  // Quiet Hours
  useGetQuietHoursQuery,
  useSetQuietHoursMutation,
  
  // Export
  useExportNotificationHistoryMutation,
} = notificationApi;