import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/constants';
// Base query with token handling
const baseQuery = fetchBaseQuery({
  baseUrl: 'http://10.62.32.130:5000/api', // Replace with your backend URL
  prepareHeaders: async (headers) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // Login mutation
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      // Transform response to store token
      transformResponse: async (response) => {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        return response;
      },
      // Invalidate user data after login
      invalidatesTags: ['User'],
    }),

    // Register mutation
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: async (response) => {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        return response;
      },
    }),

    // Logout mutation
    logout: builder.mutation({
      queryFn: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        return { data: null };
      },
      invalidatesTags: ['User'],
    }),

    // Forgot Password
    forgotPassword: builder.mutation({
      query: (userData) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: userData,
      }),
    }),

    // Get current user
    getCurrentUser: builder.query({
      queryFn: async () => {
        try {
          const userStr = await AsyncStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          return { data: user };
        } catch (error) {
          return { error: { message: 'Failed to get user' } };
        }
      },
      providesTags: ['User'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useForgotPasswordMutation
} = authApi;