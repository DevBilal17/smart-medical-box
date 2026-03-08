import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../utils/constants";

export const doctorApi = createApi({
  reducerPath: "doctorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}api/doctor`,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    "Patients",
    "PatientDetails",
    "Prescriptions",
    "Alerts",
    "Dashboard",
    "Messages",
    "Statistics",
    "Appointments",
    "Schedule",
    "Profile",
    "Settings",
    "UnassignedPatients",
  ],
  endpoints: (builder) => ({
    // ========== DASHBOARD ==========
    getDoctorDashboard: builder.query({
      query: () => "/dashboard",
      providesTags: ["Dashboard"],
      // transformResponse: (response) => response.data,
    }),

    // ========== PATIENTS ==========
    getPatients: builder.query({
      query: ({ search, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        params.append("page", page);
        params.append("limit", limit);
        return `/patients?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Patients", id: _id })),
              { type: "Patients", id: "LIST" },
            ]
          : [{ type: "Patients", id: "LIST" }],
      transformResponse: (response) => response,
    }),

    // Get unassigned patients (for doctors to claim)
    getUnassignedPatients: builder.query({
      query: ({ search, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        params.append("page", page);
        params.append("limit", limit);
        return `/patients/unassigned?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "UnassignedPatients",
                id: _id,
              })),
              { type: "UnassignedPatients", id: "LIST" },
            ]
          : [{ type: "UnassignedPatients", id: "LIST" }],
      transformResponse: (response) => response,
    }),

    // Add single patient
    addPatient: builder.mutation({
      query: (patientData) => ({
        url: "/create-patient",
        method: "POST",
        body: patientData,
      }),
      invalidatesTags: [
        { type: "Patients", id: "LIST" },
        { type: "Dashboard" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Bulk import patients
    bulkImportPatients: builder.mutation({
      query: (patientsData) => ({
        url: "/patients/bulk-import",
        method: "POST",
        body: patientsData,
      }),
      invalidatesTags: [
        { type: "Patients", id: "LIST" },
        { type: "Dashboard" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Get patient details
    getPatientDetails: builder.query({
      query: (patientId) => `/patients/${patientId}`,
      providesTags: (result, error, patientId) => [
        { type: "PatientDetails", id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    // Update patient
    updatePatient: builder.mutation({
      query: ({ patientId, ...updates }) => ({
        url: `/patients/${patientId}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: "PatientDetails", id: patientId },
        { type: "Patients", id: patientId },
        { type: "Patients", id: "LIST" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Remove patient (soft delete)
    removePatient: builder.mutation({
      query: ({ patientId, action = "deactivate", reason }) => ({
        url: `/patients/${patientId}`,
        method: "DELETE",
        body: { action, reason },
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: "PatientDetails", id: patientId },
        { type: "Patients", id: patientId },
        { type: "Patients", id: "LIST" },
        { type: "Dashboard" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Transfer patient to another doctor
    transferPatient: builder.mutation({
      query: ({ patientId, newDoctorId, reason }) => ({
        url: `/patients/${patientId}/transfer`,
        method: "POST",
        body: { newDoctorId, reason },
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: "PatientDetails", id: patientId },
        { type: "Patients", id: patientId },
        { type: "Patients", id: "LIST" },
        { type: "Dashboard" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Assign unassigned patient to current doctor
    assignPatient: builder.mutation({
      query: (patientId) => ({
        url: `/patients/${patientId}/assign`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Patients", id: "LIST" },
        { type: "UnassignedPatients", id: "LIST" },
        { type: "Dashboard" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Unassign patient (make them unassigned)
    unassignPatient: builder.mutation({
      query: (patientId) => ({
        url: `/patients/${patientId}/unassign`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Patients", id: "LIST" },
        { type: "UnassignedPatients", id: "LIST" },
        { type: "Dashboard" },
      ],
      transformResponse: (response) => response.data,
    }),

    // Add patient note
    addPatientNote: builder.mutation({
      query: ({ patientId, note }) => ({
        url: `/patients/${patientId}/notes`,
        method: "POST",
        body: { note },
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: "PatientDetails", id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    // Get patient notes
    getPatientNotes: builder.query({
      query: (patientId) => `/patients/${patientId}/notes`,
      providesTags: (result, error, patientId) => [
        { type: "PatientDetails", id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    // Get patient health data
    getPatientHealthData: builder.query({
      query: ({ patientId, startDate, endDate, type }) => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (type) params.append("type", type);
        return `/patients/${patientId}/health-data?${params.toString()}`;
      },
      providesTags: (result, error, { patientId }) => [
        { type: "PatientDetails", id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    // Get patient report
    getPatientReport: builder.query({
      query: ({ patientId, days = 30 }) =>
        `/patients/${patientId}/report?days=${days}`,
      providesTags: (result, error, { patientId }) => [
        { type: "PatientDetails", id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    // Get patient statistics
    getPatientStatistics: builder.query({
      query: ({ patientId, days = 30 }) =>
        `/patients/${patientId}/statistics?days=${days}`,
      providesTags: (result, error, { patientId }) => [
        { type: "Statistics", id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    // Get patient vitals
    getPatientVitals: builder.query({
      query: ({ patientId, limit = 10 }) =>
        `/patients/${patientId}/vitals?limit=${limit}`,
      providesTags: (result, error, { patientId }) => [
        { type: "PatientDetails", id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    // Get patient medication adherence
    getPatientMedicationAdherence: builder.query({
      query: ({ patientId, days = 30 }) =>
        `/patients/${patientId}/adherence?days=${days}`,
      providesTags: (result, error, { patientId }) => [
        { type: "Statistics", id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    // ========== PRESCRIPTIONS ==========

    createPrescription: builder.mutation({
      query: (prescriptionData) => ({
        url: "/prescriptions",
        method: "POST",
        body: prescriptionData,
      }),
      invalidatesTags: (result, error, prescriptionData) => [
        { type: "Prescriptions", id: "LIST" },
        { type: "PatientDetails", id: prescriptionData.patientId },
        { type: "Dashboard" },
      ],
      transformResponse: (response) => response.data,
    }),
    getDoctorPrescriptions: builder.query({
      query: ({ status, patientId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        if (patientId) params.append("patientId", patientId);
        params.append("page", page);
        params.append("limit", limit);
        return `/prescriptions?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Prescriptions",
                id: _id,
              })),
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

    updatePrescription: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/prescriptions/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Prescriptions", id },
        { type: "Prescriptions", id: "LIST" },
        { type: "PatientDetails", id: result?.patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    deletePrescription: builder.mutation({
      query: (id) => ({
        url: `/prescriptions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Prescriptions", id: "LIST" },
        { type: "PatientDetails", id: "LIST" },
      ],
    }),

    renewPrescription: builder.mutation({
      query: ({ id, endDate }) => ({
        url: `/prescriptions/${id}/renew`,
        method: "POST",
        body: { endDate },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Prescriptions", id },
        { type: "Prescriptions", id: "LIST" },
      ],
      transformResponse: (response) => response.data,
    }),

    getPrescriptionTemplates: builder.query({
      query: () => "/prescriptions/templates",
      providesTags: [{ type: "Prescriptions", id: "TEMPLATES" }],
      transformResponse: (response) => response.data,
    }),

    createPrescriptionTemplate: builder.mutation({
      query: (templateData) => ({
        url: "/prescriptions/templates",
        method: "POST",
        body: templateData,
      }),
      invalidatesTags: [{ type: "Prescriptions", id: "TEMPLATES" }],
      transformResponse: (response) => response.data,
    }),

    // Medicines
    // Add this new endpoint
    getPrescriptionMedicines: builder.query({
      query: (prescriptionId) => `/prescriptions/${prescriptionId}/medicines`,
      providesTags: (result, error, prescriptionId) => [
        { type: "Prescriptions", id: prescriptionId },
        { type: "Prescriptions", id: "MEDICINES" },
      ],
      transformResponse: (response) => response.data || response,
      // Only run the query if we have an ID
      keepUnusedDataFor: 300, // 5 minutes
    }),

    // Optional: Add medicine-specific endpoints
    addPrescriptionMedicine: builder.mutation({
      query: ({ prescriptionId, medicineData }) => ({
        url: `/prescriptions/${prescriptionId}/medicines`,
        method: "POST",
        body: medicineData,
      }),
      invalidatesTags: (result, error, { prescriptionId }) => [
        { type: "Prescriptions", id: prescriptionId },
        { type: "Prescriptions", id: "LIST" },
        { type: "PatientDetails", id: result?.patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    updatePrescriptionMedicine: builder.mutation({
      query: ({ prescriptionId, medicineId, ...updates }) => ({
        url: `/prescriptions/${prescriptionId}/medicines/${medicineId}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { prescriptionId }) => [
        { type: "Prescriptions", id: prescriptionId },
      ],
      transformResponse: (response) => response.data,
    }),

    deletePrescriptionMedicine: builder.mutation({
      query: ({ prescriptionId, medicineId }) => ({
        url: `/prescriptions/${prescriptionId}/medicines/${medicineId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { prescriptionId }) => [
        { type: "Prescriptions", id: prescriptionId },
      ],
    }),

    reorderPrescriptionMedicines: builder.mutation({
      query: ({ prescriptionId, medicineOrder }) => ({
        url: `/prescriptions/${prescriptionId}/medicines/reorder`,
        method: "POST",
        body: { medicineOrder },
      }),
      invalidatesTags: (result, error, { prescriptionId }) => [
        { type: "Prescriptions", id: prescriptionId },
      ],
      transformResponse: (response) => response.data,
    }),

    // ========== ALERTS ==========
    getDoctorAlerts: builder.query({
      query: ({ status, severity, patientId, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        if (severity) params.append("severity", severity);
        if (patientId) params.append("patientId", patientId);
        params.append("page", page);
        params.append("limit", limit);
        return `/alerts?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Alerts", id: _id })),
              { type: "Alerts", id: "LIST" },
            ]
          : [{ type: "Alerts", id: "LIST" }],
      transformResponse: (response) => response,
    }),

    getAlertById: builder.query({
      query: (id) => `/alerts/${id}`,
      providesTags: (result, error, id) => [{ type: "Alerts", id }],
      transformResponse: (response) => response.data,
    }),

    updateAlertStatus: builder.mutation({
      query: ({ id, status, notes }) => ({
        url: `/alerts/${id}`,
        method: "PATCH",
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Alerts", id },
        { type: "Alerts", id: "LIST" },
        { type: "Dashboard" },
      ],
      transformResponse: (response) => response.data,
    }),

    getUnreadAlertsCount: builder.query({
      query: () => "/alerts/unread-count",
      providesTags: [{ type: "Alerts", id: "UNREAD_COUNT" }],
      transformResponse: (response) => response.data?.unreadCount,
    }),

    getAlertStatistics: builder.query({
      query: ({ days = 30 }) => `/alerts/statistics?days=${days}`,
      providesTags: ["Statistics"],
      transformResponse: (response) => response.data,
    }),

    // ========== MESSAGES ==========
    sendMessageToPatient: builder.mutation({
      query: ({ patientId, message, type = "text" }) => ({
        url: "/message",
        method: "POST",
        body: { patientId, message, type },
      }),
      invalidatesTags: [{ type: "Messages", id: "LIST" }],
      transformResponse: (response) => response.data,
    }),

    getMessagesWithPatient: builder.query({
      query: ({ patientId, page = 1, limit = 50 }) =>
        `/messages/${patientId}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { patientId }) => [
        { type: "Messages", id: patientId },
      ],
      transformResponse: (response) => response,
    }),

    markMessagesAsRead: builder.mutation({
      query: ({ patientId, messageIds }) => ({
        url: `/messages/${patientId}/read`,
        method: "POST",
        body: { messageIds },
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: "Messages", id: patientId },
      ],
    }),

    getUnreadMessagesCount: builder.query({
      query: () => "/messages/unread-count",
      providesTags: [{ type: "Messages", id: "UNREAD_COUNT" }],
      transformResponse: (response) => response.data,
    }),

    // ========== APPOINTMENTS ==========
    getAppointments: builder.query({
      query: ({ date, patientId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (date) params.append("date", date);
        if (patientId) params.append("patientId", patientId);
        params.append("page", page);
        params.append("limit", limit);
        return `/appointments?${params.toString()}`;
      },
      providesTags: ["Appointments"],
      transformResponse: (response) => response,
    }),

    createAppointment: builder.mutation({
      query: (appointmentData) => ({
        url: "/appointments",
        method: "POST",
        body: appointmentData,
      }),
      invalidatesTags: ["Appointments", "Dashboard", "Schedule"],
      transformResponse: (response) => response.data,
    }),

    updateAppointment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/appointments/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Appointments", "Schedule"],
      transformResponse: (response) => response.data,
    }),

    cancelAppointment: builder.mutation({
      query: (id) => ({
        url: `/appointments/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Appointments", "Schedule"],
    }),

    // ========== SCHEDULE ==========
    getDoctorSchedule: builder.query({
      query: ({ startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        return `/schedule?${params.toString()}`;
      },
      providesTags: ["Schedule"],
      transformResponse: (response) => response.data,
    }),

    updateAvailability: builder.mutation({
      query: (availabilityData) => ({
        url: "/schedule/availability",
        method: "POST",
        body: availabilityData,
      }),
      invalidatesTags: ["Schedule"],
      transformResponse: (response) => response.data,
    }),

    // ========== REPORTS ==========
    generatePatientReport: builder.mutation({
      query: ({ patientId, type, format = "pdf", dateRange }) => ({
        url: `/reports/patient/${patientId}`,
        method: "POST",
        body: { type, format, dateRange },
      }),
      transformResponse: (response) => response.data,
    }),

    generatePracticeReport: builder.mutation({
      query: ({ type, format = "pdf", dateRange }) => ({
        url: "/reports/practice",
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

    // ========== SETTINGS ==========
    getDoctorProfile: builder.query({
      query: () => "/profile",
      providesTags: ["Profile"],
      transformResponse: (response) => response.data,
    }),

    updateDoctorProfile: builder.mutation({
      query: (data) => ({
        url: "/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
      transformResponse: (response) => response.data,
    }),

    updateAvailabilitySettings: builder.mutation({
      query: (settings) => ({
        url: "/settings/availability",
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["Schedule"],
      transformResponse: (response) => response.data,
    }),

    getNotificationSettings: builder.query({
      query: () => "/settings/notifications",
      providesTags: ["Settings"],
      transformResponse: (response) => response.data,
    }),

    updateNotificationSettings: builder.mutation({
      query: (settings) => ({
        url: "/settings/notifications",
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["Settings"],
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  // Dashboard
  useGetDoctorDashboardQuery,

  // Patients
  useGetPatientsQuery,
  useGetUnassignedPatientsQuery,
  useAddPatientMutation,
  useBulkImportPatientsMutation,
  useGetPatientDetailsQuery,
  useUpdatePatientMutation,
  useRemovePatientMutation,
  useTransferPatientMutation,
  useAssignPatientMutation,
  useUnassignPatientMutation,
  useAddPatientNoteMutation,
  useGetPatientNotesQuery,
  useGetPatientHealthDataQuery,
  useGetPatientReportQuery,
  useGetPatientStatisticsQuery,
  useGetPatientVitalsQuery,
  useGetPatientMedicationAdherenceQuery,

  // Prescriptions
  useCreatePrescriptionMutation,
  useGetDoctorPrescriptionsQuery,
  useGetPrescriptionByIdQuery,
  useUpdatePrescriptionMutation,
  useDeletePrescriptionMutation,
  useRenewPrescriptionMutation,
  useGetPrescriptionTemplatesQuery,
  useCreatePrescriptionTemplateMutation,

  // Medicines
  useGetPrescriptionMedicinesQuery,

  // Alerts
  useGetDoctorAlertsQuery,
  useGetAlertByIdQuery,
  useUpdateAlertStatusMutation,
  useGetUnreadAlertsCountQuery,
  useGetAlertStatisticsQuery,

  // Messages
  useSendMessageToPatientMutation,
  useGetMessagesWithPatientQuery,
  useMarkMessagesAsReadMutation,
  useGetUnreadMessagesCountQuery,

  // Appointments
  useGetAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,

  // Schedule
  useGetDoctorScheduleQuery,
  useUpdateAvailabilityMutation,

  // Reports
  useGeneratePatientReportMutation,
  useGeneratePracticeReportMutation,
  useDownloadReportQuery,

  // Settings
  useGetDoctorProfileQuery,
  useUpdateDoctorProfileMutation,
  useUpdateAvailabilitySettingsMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
} = doctorApi;
