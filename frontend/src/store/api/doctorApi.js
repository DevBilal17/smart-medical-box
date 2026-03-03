import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/constants';

export const doctorApi = createApi({
  reducerPath: 'doctorApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/doctor`,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Patients', 
    'PatientDetails', 
    'Prescriptions', 
    'Alerts', 
    'Dashboard',
    'Messages',
    'Statistics'
  ],
  endpoints: (builder) => ({
    // ========== DASHBOARD ==========
    getDoctorDashboard: builder.query({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
      transformResponse: (response) => response.data,
    }),

    // ========== PATIENTS ==========
    getPatients: builder.query({
      query: ({ search, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', page);
        params.append('limit', limit);
        return `/patients?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Patients', id })),
              { type: 'Patients', id: 'LIST' },
            ]
          : [{ type: 'Patients', id: 'LIST' }],
      transformResponse: (response) => response,
    }),

    getPatientDetails: builder.query({
      query: (patientId) => `/patients/${patientId}`,
      providesTags: (result, error, patientId) => [
        { type: 'PatientDetails', id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    getPatientHealthData: builder.query({
      query: ({ patientId, startDate, endDate, type }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (type) params.append('type', type);
        return `/patients/${patientId}/health-data?${params.toString()}`;
      },
      providesTags: (result, error, { patientId }) => [
        { type: 'PatientDetails', id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    getPatientReport: builder.query({
      query: ({ patientId, days = 30 }) => 
        `/patients/${patientId}/report?days=${days}`,
      providesTags: (result, error, { patientId }) => [
        { type: 'PatientDetails', id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    getPatientStatistics: builder.query({
      query: ({ patientId, days = 30 }) => 
        `/patients/${patientId}/statistics?days=${days}`,
      providesTags: (result, error, { patientId }) => [
        { type: 'Statistics', id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    getPatientVitals: builder.query({
      query: ({ patientId, limit = 10 }) => 
        `/patients/${patientId}/vitals?limit=${limit}`,
      providesTags: (result, error, { patientId }) => [
        { type: 'PatientDetails', id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    getPatientMedicationAdherence: builder.query({
      query: ({ patientId, days = 30 }) => 
        `/patients/${patientId}/adherence?days=${days}`,
      providesTags: (result, error, { patientId }) => [
        { type: 'Statistics', id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    assignPatient: builder.mutation({
      query: (patientId) => ({
        url: `/patients/${patientId}/assign`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Patients', id: 'LIST' },
        { type: 'Dashboard' },
      ],
      transformResponse: (response) => response.data,
    }),

    unassignPatient: builder.mutation({
      query: (patientId) => ({
        url: `/patients/${patientId}/unassign`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Patients', id: 'LIST' },
        { type: 'Dashboard' },
      ],
      transformResponse: (response) => response.data,
    }),

    addPatientNote: builder.mutation({
      query: ({ patientId, note }) => ({
        url: `/patients/${patientId}/notes`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: 'PatientDetails', id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    getPatientNotes: builder.query({
      query: (patientId) => `/patients/${patientId}/notes`,
      providesTags: (result, error, patientId) => [
        { type: 'PatientDetails', id: patientId },
      ],
      transformResponse: (response) => response.data,
    }),

    // ========== PRESCRIPTIONS ==========
    createPrescription: builder.mutation({
      query: (prescriptionData) => ({
        url: '/prescriptions',
        method: 'POST',
        body: prescriptionData,
      }),
      invalidatesTags: [
        { type: 'Prescriptions', id: 'LIST' },
        { type: 'PatientDetails', id: 'LIST' },
        { type: 'Dashboard' },
      ],
      transformResponse: (response) => response.data,
    }),

    getDoctorPrescriptions: builder.query({
      query: ({ status, patientId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (patientId) params.append('patientId', patientId);
        params.append('page', page);
        params.append('limit', limit);
        return `/prescriptions?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Prescriptions', id })),
              { type: 'Prescriptions', id: 'LIST' },
            ]
          : [{ type: 'Prescriptions', id: 'LIST' }],
      transformResponse: (response) => response,
    }),

    getPrescriptionById: builder.query({
      query: (id) => `/prescriptions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Prescriptions', id }],
      transformResponse: (response) => response.data,
    }),

    updatePrescription: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/prescriptions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Prescriptions', id },
        { type: 'Prescriptions', id: 'LIST' },
        { type: 'PatientDetails', id: 'LIST' },
      ],
      transformResponse: (response) => response.data,
    }),

    deletePrescription: builder.mutation({
      query: (id) => ({
        url: `/prescriptions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Prescriptions', id: 'LIST' },
        { type: 'PatientDetails', id: 'LIST' },
      ],
    }),

    renewPrescription: builder.mutation({
      query: ({ id, endDate }) => ({
        url: `/prescriptions/${id}/renew`,
        method: 'POST',
        body: { endDate },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Prescriptions', id },
        { type: 'Prescriptions', id: 'LIST' },
      ],
      transformResponse: (response) => response.data,
    }),

    getPrescriptionTemplates: builder.query({
      query: () => '/prescriptions/templates',
      providesTags: [{ type: 'Prescriptions', id: 'TEMPLATES' }],
      transformResponse: (response) => response.data,
    }),

    createPrescriptionTemplate: builder.mutation({
      query: (templateData) => ({
        url: '/prescriptions/templates',
        method: 'POST',
        body: templateData,
      }),
      invalidatesTags: [{ type: 'Prescriptions', id: 'TEMPLATES' }],
      transformResponse: (response) => response.data,
    }),

    // ========== ALERTS ==========
    getDoctorAlerts: builder.query({
      query: ({ status, severity, patientId, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (severity) params.append('severity', severity);
        if (patientId) params.append('patientId', patientId);
        params.append('page', page);
        params.append('limit', limit);
        return `/alerts?${params.toString()}`;
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
      query: (id) => `/alerts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Alerts', id }],
      transformResponse: (response) => response.data,
    }),

    updateAlertStatus: builder.mutation({
      query: ({ id, status, notes }) => ({
        url: `/alerts/${id}`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Alerts', id },
        { type: 'Alerts', id: 'LIST' },
        { type: 'Dashboard' },
      ],
      transformResponse: (response) => response.data,
    }),

    getUnreadAlertsCount: builder.query({
      query: () => '/alerts/unread-count',
      providesTags: [{ type: 'Alerts', id: 'UNREAD_COUNT' }],
      transformResponse: (response) => response.data.unreadCount,
    }),

    getAlertStatistics: builder.query({
      query: ({ days = 30 }) => `/alerts/statistics?days=${days}`,
      providesTags: ['Statistics'],
      transformResponse: (response) => response.data,
    }),

    // ========== MESSAGES ==========
    sendMessageToPatient: builder.mutation({
      query: ({ patientId, message, type = 'text' }) => ({
        url: '/message',
        method: 'POST',
        body: { patientId, message, type },
      }),
      invalidatesTags: [{ type: 'Messages', id: 'LIST' }],
      transformResponse: (response) => response.data,
    }),

    getMessagesWithPatient: builder.query({
      query: ({ patientId, page = 1, limit = 50 }) => 
        `/messages/${patientId}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { patientId }) => [
        { type: 'Messages', id: patientId },
      ],
      transformResponse: (response) => response,
    }),

    markMessagesAsRead: builder.mutation({
      query: ({ patientId, messageIds }) => ({
        url: `/messages/${patientId}/read`,
        method: 'POST',
        body: { messageIds },
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: 'Messages', id: patientId },
      ],
    }),

    getUnreadMessagesCount: builder.query({
      query: () => '/messages/unread-count',
      providesTags: [{ type: 'Messages', id: 'UNREAD_COUNT' }],
      transformResponse: (response) => response.data,
    }),

    // ========== APPOINTMENTS ==========
    getAppointments: builder.query({
      query: ({ date, patientId, page = 1, limit = 20 }) => {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (patientId) params.append('patientId', patientId);
        params.append('page', page);
        params.append('limit', limit);
        return `/appointments?${params.toString()}`;
      },
      providesTags: ['Appointments'],
      transformResponse: (response) => response,
    }),

    createAppointment: builder.mutation({
      query: (appointmentData) => ({
        url: '/appointments',
        method: 'POST',
        body: appointmentData,
      }),
      invalidatesTags: ['Appointments', 'Dashboard'],
      transformResponse: (response) => response.data,
    }),

    updateAppointment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/appointments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Appointments'],
      transformResponse: (response) => response.data,
    }),

    cancelAppointment: builder.mutation({
      query: (id) => ({
        url: `/appointments/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Appointments'],
    }),

    // ========== SCHEDULE ==========
    getDoctorSchedule: builder.query({
      query: ({ startDate, endDate }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/schedule?${params.toString()}`;
      },
      providesTags: ['Schedule'],
      transformResponse: (response) => response.data,
    }),

    updateAvailability: builder.mutation({
      query: (availabilityData) => ({
        url: '/schedule/availability',
        method: 'POST',
        body: availabilityData,
      }),
      invalidatesTags: ['Schedule'],
      transformResponse: (response) => response.data,
    }),

    // ========== REPORTS ==========
    generatePatientReport: builder.mutation({
      query: ({ patientId, type, format = 'pdf', dateRange }) => ({
        url: `/reports/patient/${patientId}`,
        method: 'POST',
        body: { type, format, dateRange },
      }),
      transformResponse: (response) => response.data,
    }),

    generatePracticeReport: builder.mutation({
      query: ({ type, format = 'pdf', dateRange }) => ({
        url: '/reports/practice',
        method: 'POST',
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
      query: () => '/profile',
      providesTags: ['Profile'],
      transformResponse: (response) => response.data,
    }),

    updateDoctorProfile: builder.mutation({
      query: (data) => ({
        url: '/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile'],
      transformResponse: (response) => response.data,
    }),

    updateAvailabilitySettings: builder.mutation({
      query: (settings) => ({
        url: '/settings/availability',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Schedule'],
      transformResponse: (response) => response.data,
    }),

    getNotificationSettings: builder.query({
      query: () => '/settings/notifications',
      providesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),

    updateNotificationSettings: builder.mutation({
      query: (settings) => ({
        url: '/settings/notifications',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Settings'],
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  // Dashboard
  useGetDoctorDashboardQuery,
  
  // Patients
  useGetPatientsQuery,
  useGetPatientDetailsQuery,
  useGetPatientHealthDataQuery,
  useGetPatientReportQuery,
  useGetPatientStatisticsQuery,
  useGetPatientVitalsQuery,
  useGetPatientMedicationAdherenceQuery,
  useAssignPatientMutation,
  useUnassignPatientMutation,
  useAddPatientNoteMutation,
  useGetPatientNotesQuery,
  
  // Prescriptions
  useCreatePrescriptionMutation,
  useGetDoctorPrescriptionsQuery,
  useGetPrescriptionByIdQuery,
  useUpdatePrescriptionMutation,
  useDeletePrescriptionMutation,
  useRenewPrescriptionMutation,
  useGetPrescriptionTemplatesQuery,
  useCreatePrescriptionTemplateMutation,
  
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