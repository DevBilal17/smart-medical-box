import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../utils/constants";
import moment from "moment";

export const patientApi = createApi({
  reducerPath: "patientApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}api/patient`,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Dashboard",
    "HealthRecords",
    "Prescriptions",
    "Alerts",
    "Profile",
    "Statistics",
    "Medicines", // Added this tag type
  ],
  endpoints: (builder) => ({
    // ========== DASHBOARD ==========
    getDashboard: builder.query({
      query: () => "/dashboard",
      providesTags: ["Dashboard"],
      transformResponse: (response) => response.data,
    }),

    // ========== HEALTH RECORDS ==========
    getHealthRecords: builder.query({
      query: ({ days = 30, page = 1, limit = 20 }) =>
        `/health-records?days=${days}&page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "HealthRecords", id })),
              { type: "HealthRecords", id: "LIST" },
            ]
          : [{ type: "HealthRecords", id: "LIST" }],
      transformResponse: (response) => response,
    }),

    getHealthRecordById: builder.query({
      query: (id) => `/health-records/${id}`,
      providesTags: (result, error, id) => [{ type: "HealthRecords", id }],
      transformResponse: (response) => response.data,
    }),

    addHealthRecord: builder.mutation({
      query: (body) => ({
        url: "/health-records",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "HealthRecords", id: "LIST" },
        { type: "Dashboard" },
        { type: "Statistics" },
      ],
      transformResponse: (response) => response.data,
    }),

    updateHealthRecord: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/health-records/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "HealthRecords", id },
        { type: "HealthRecords", id: "LIST" },
        { type: "Dashboard" },
      ],
      transformResponse: (response) => response.data,
    }),

    deleteHealthRecord: builder.mutation({
      query: (id) => ({
        url: `/health-records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "HealthRecords", id: "LIST" },
        { type: "Dashboard" },
      ],
    }),

    // ========== HEALTH STATISTICS ==========
    getHealthStatistics: builder.query({
      query: ({ days = 30, type }) =>
        `/health-statistics?days=${days}${type ? `&type=${type}` : ""}`,
      providesTags: ["Statistics"],
      transformResponse: (response) => response.data,
    }),

    getHealthTrends: builder.query({
      query: ({ startDate, endDate, metrics }) => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (metrics) params.append("metrics", metrics.join(","));
        return `/health-trends?${params.toString()}`;
      },
      transformResponse: (response) => response.data,
    }),

    // ========== PRESCRIPTIONS ==========
    getPrescriptions: builder.query({
      query: ({ status, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        params.append("page", page);
        params.append("limit", limit);
        return `/prescriptions?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Prescriptions", id })),
              { type: "Prescriptions", id: "LIST" },
            ]
          : [{ type: "Prescriptions", id: "LIST" }],
      transformResponse: (response) => response,
    }),

    getPrescriptionById: builder.query({
      query: (id) => `/prescriptions/${id}`,
      providesTags: (result, error, id) => [{ type: "Prescriptions", id }],
      transformResponse: (response) => response.data,
    }),

    getActivePrescription: builder.query({
      query: () => "/prescriptions/active",
      providesTags: [{ type: "Prescriptions", id: "ACTIVE" }],
      transformResponse: (response) => response.data,
    }),

    // ========== TODAY'S MEDICINES - FIXED POSITION ==========
    getTodaysMedicines: builder.query({
      query: () => "/medicines/today", // Make sure this matches your backend route
      providesTags: ["Medicines"],
      transformResponse: (response) => {
        // Transform the response to ensure consistent format
        const medicines = response.data || response || [];

        // Process each medicine to add computed fields
        return medicines.map((medicine) => {
          // If medicine has times array, process each time slot
          if (medicine.times && Array.isArray(medicine.times)) {
            return {
              ...medicine,
              // Add display time for each slot
              timeSlots: medicine.times.map((t) => ({
                ...t,
                displayTime: moment(t.time, "HH:mm").format("h:mm A"),
                isPast: moment(t.time, "HH:mm").isBefore(moment()),
                isNow: moment(t.time, "HH:mm").isBetween(
                  moment().subtract(30, "minutes"),
                  moment().add(30, "minutes"),
                ),
              })),
            };
          }

          // If medicine has single time field
          if (medicine.time) {
            return {
              ...medicine,
              displayTime: moment(medicine.time, "HH:mm").format("h:mm A"),
              isPast: moment(medicine.time, "HH:mm").isBefore(moment()),
              isNow: moment(medicine.time, "HH:mm").isBetween(
                moment().subtract(30, "minutes"),
                moment().add(30, "minutes"),
              ),
            };
          }

          return medicine;
        });
      },
    }),

    // Mark medicine as taken - Updated to include prescriptionId
    markMedicineTaken: builder.mutation({
      query: ({ prescriptionId, medicineId, timeId, takenAt }) => ({
        url: `/prescriptions/${prescriptionId}/medicines/${medicineId}/times/${timeId}/taken`,
        method: "POST",
        body: { takenAt },
      }),
      invalidatesTags: [
        { type: "Prescriptions", id: "LIST" },
        { type: "Prescriptions", id: "ACTIVE" },
        { type: "Medicines" },
        { type: "Dashboard" },
      ],
    }),

    // Mark medicine as skipped - Updated to include prescriptionId
    markMedicineSkipped: builder.mutation({
      query: ({ prescriptionId, medicineId, timeId, reason }) => ({
        url: `/prescriptions/${prescriptionId}/medicines/${medicineId}/times/${timeId}/skipped`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [
        { type: "Prescriptions", id: "LIST" },
        { type: "Prescriptions", id: "ACTIVE" },
        { type: "Medicines" },
        { type: "Dashboard" },
      ],
    }),

    getAdherenceRate: builder.query({
      query: ({ days = 30 }) => `/adherence-rate?days=${days}`,
      providesTags: ["Statistics"],
      transformResponse: (response) => response.data,
    }),

    // ========== ALERTS ==========
    getPatientAlerts: builder.query({
      query: ({ status, severity, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        if (severity) params.append("severity", severity);
        params.append("page", page);
        params.append("limit", limit);
        return `/alerts?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Alerts", id })),
              { type: "Alerts", id: "LIST" },
            ]
          : [{ type: "Alerts", id: "LIST" }],
      transformResponse: (response) => response,
    }),

    getUnreadAlertsCount: builder.query({
      query: () => "/alerts/unread-count",
      providesTags: [{ type: "Alerts", id: "UNREAD_COUNT" }],
      transformResponse: (response) => response.data.unreadCount,
    }),

    markAlertRead: builder.mutation({
      query: (alertId) => ({
        url: `/alerts/${alertId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, alertId) => [
        { type: "Alerts", id: alertId },
        { type: "Alerts", id: "LIST" },
        { type: "Alerts", id: "UNREAD_COUNT" },
        { type: "Dashboard" },
      ],
    }),

    markMultipleAlertsRead: builder.mutation({
      query: (alertIds) => ({
        url: "/alerts/mark-read",
        method: "POST",
        body: { alertIds },
      }),
      invalidatesTags: [
        { type: "Alerts", id: "LIST" },
        { type: "Alerts", id: "UNREAD_COUNT" },
        { type: "Dashboard" },
      ],
    }),

    // ========== PROFILE ==========
    getPatientProfile: builder.query({
      query: () => "/profile",
      providesTags: ["Profile"],
      transformResponse: (response) => response.data,
    }),

    updatePatientProfile: builder.mutation({
      query: (body) => ({
        url: "/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile", "Dashboard"],
      transformResponse: (response) => response.data,
    }),

    updateProfilePicture: builder.mutation({
      query: (formData) => ({
        url: "/profile/picture",
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
      invalidatesTags: ["Profile"],
      transformResponse: (response) => response.data,
    }),

    // ========== DEVICE MANAGEMENT ==========
    pairDevice: builder.mutation({
      query: (deviceData) => ({
        url: "/device/pair",
        method: "POST",
        body: deviceData,
      }),
      invalidatesTags: ["Profile", "Dashboard"],
      transformResponse: (response) => response.data,
    }),

    getDeviceStatus: builder.query({
      query: () => "/device/status",
      providesTags: ["Dashboard"],
      transformResponse: (response) => response.data,
    }),

    // ========== EMERGENCY ==========
    triggerEmergency: builder.mutation({
      query: (data) => ({
        url: "/emergency",
        method: "POST",
        body: data,
      }),
      transformResponse: (response) => response.data,
    }),

    // ========== REPORTS ==========
    generateReport: builder.mutation({
      query: ({ type, format = "pdf", dateRange }) => ({
        url: "/reports/generate",
        method: "POST",
        body: { type, format, dateRange },
      }),
      transformResponse: (response) => response.data,
    }),

    downloadReport: builder.query({
      query: (reportId) => ({
        url: `/reports/${reportId}/download`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }), // <-- This closing parenthesis and brace ends the endpoints object CORRECTLY
});

export const {
  // Dashboard
  useGetDashboardQuery,

  // Health Records
  useGetHealthRecordsQuery,
  useGetHealthRecordByIdQuery,
  useAddHealthRecordMutation,
  useUpdateHealthRecordMutation,
  useDeleteHealthRecordMutation,

  // Health Statistics
  useGetHealthStatisticsQuery,
  useGetHealthTrendsQuery,

  // Prescriptions
  useGetPrescriptionsQuery,
  useGetPrescriptionByIdQuery,
  useGetActivePrescriptionQuery,
  useGetAdherenceRateQuery,
  useGetTodaysMedicinesQuery, // Added this
  useMarkMedicineTakenMutation, // Added this
  useMarkMedicineSkippedMutation, // Added this

  // Alerts
  useGetPatientAlertsQuery,
  useGetUnreadAlertsCountQuery,
  useMarkAlertReadMutation,
  useMarkMultipleAlertsReadMutation,

  // Profile
  useGetPatientProfileQuery,
  useUpdatePatientProfileMutation,
  useUpdateProfilePictureMutation,

  // Device
  usePairDeviceMutation,
  useGetDeviceStatusQuery,

  // Emergency
  useTriggerEmergencyMutation,

  // Reports
  useGenerateReportMutation,
  useDownloadReportQuery,
} = patientApi;
