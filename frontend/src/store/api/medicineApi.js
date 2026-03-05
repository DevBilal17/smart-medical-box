import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../utils/constants';

export const medicineApi = createApi({
  reducerPath: 'medicineApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}api`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Medicine'],
  endpoints: (builder) => ({
    // Get all medicines with filters
    getMedicines: builder.query({
      query: ({ search, category, page = 1, limit = 20 }) => ({
        url: '/medicines',
        params: { search, category, page, limit },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Medicine', id: _id })),
              { type: 'Medicine', id: 'LIST' },
            ]
          : [{ type: 'Medicine', id: 'LIST' }],
    }),

    // Get single medicine by ID
    getMedicineById: builder.query({
      query: (id) => `/medicines/${id}`,
      providesTags: (result, error, id) => [{ type: 'Medicine', id }],
    }),

    // Add new medicine
    addMedicine: builder.mutation({
      query: (medicine) => ({
        url: '/medicines',
        method: 'POST',
        body: medicine,
      }),
      invalidatesTags: [{ type: 'Medicine', id: 'LIST' }],
    }),

    // Update medicine
    updateMedicine: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/medicines/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Medicine', id },
        { type: 'Medicine', id: 'LIST' },
      ],
    }),

    // Delete medicine (soft delete)
    deleteMedicine: builder.mutation({
      query: (id) => ({
        url: `/medicines/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Medicine', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetMedicinesQuery,
  useGetMedicineByIdQuery,
  useAddMedicineMutation,
  useUpdateMedicineMutation,
  useDeleteMedicineMutation,
} = medicineApi;