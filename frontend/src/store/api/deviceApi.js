import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, DEVICE_AUTH_TOKEN } from '../../utils/constants';

export const deviceApi = createApi({
  reducerPath: 'deviceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/device`,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem('token');
      const deviceToken = await AsyncStorage.getItem('deviceToken');
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (deviceToken) {
        headers.set('x-device-token', deviceToken);
      }
      return headers;
    },
  }),
  tagTypes: ['Device', 'DeviceStatus', 'DeviceLogs', 'Schedule'],
  endpoints: (builder) => ({
    // ========== DEVICE REGISTRATION ==========
    registerDevice: builder.mutation({
      query: (deviceData) => ({
        url: '/register',
        method: 'POST',
        body: deviceData,
      }),
      invalidatesTags: ['Device'],
      transformResponse: async (response) => {
        if (response.data?.deviceToken) {
          await AsyncStorage.setItem('deviceToken', response.data.deviceToken);
        }
        return response.data;
      },
    }),

    pairDevice: builder.mutation({
      query: ({ deviceId, pairingCode }) => ({
        url: '/pair',
        method: 'POST',
        body: { deviceId, pairingCode },
      }),
      invalidatesTags: ['Device'],
      transformResponse: async (response) => {
        if (response.data?.deviceToken) {
          await AsyncStorage.setItem('deviceToken', response.data.deviceToken);
        }
        return response.data;
      },
    }),

    unpairDevice: builder.mutation({
      query: () => ({
        url: '/unpair',
        method: 'POST',
      }),
      invalidatesTags: ['Device'],
      transformResponse: async (response) => {
        await AsyncStorage.removeItem('deviceToken');
        return response.data;
      },
    }),

    // ========== DEVICE STATUS ==========
    getDeviceStatus: builder.query({
      query: () => '/status',
      providesTags: ['DeviceStatus'],
      transformResponse: (response) => response.data,
    }),

    updateDeviceStatus: builder.mutation({
      query: (statusData) => ({
        url: '/status',
        method: 'POST',
        body: statusData,
        headers: {
          'x-device-token': DEVICE_AUTH_TOKEN,
        },
      }),
      invalidatesTags: ['DeviceStatus'],
      transformResponse: (response) => response.data,
    }),

    // ========== DEVICE INFORMATION ==========
    getDeviceInfo: builder.query({
      query: () => '/info',
      providesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    updateDeviceInfo: builder.mutation({
      query: (infoData) => ({
        url: '/info',
        method: 'PUT',
        body: infoData,
      }),
      invalidatesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    // ========== SENSOR DATA ==========
    sendSensorData: builder.mutation({
      query: (sensorData) => ({
        url: '/sensor-data',
        method: 'POST',
        body: sensorData,
        headers: {
          'x-device-token': DEVICE_AUTH_TOKEN,
        },
      }),
      invalidatesTags: ['DeviceStatus'],
      transformResponse: (response) => response.data,
    }),

    getLatestSensorData: builder.query({
      query: () => '/sensor-data/latest',
      providesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    getSensorDataHistory: builder.query({
      query: ({ type, limit = 100 }) => 
        `/sensor-data/history?type=${type}&limit=${limit}`,
      providesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    // ========== MEDICINE SCHEDULE ==========
    getDeviceSchedule: builder.query({
      query: () => '/schedule',
      providesTags: ['Schedule'],
      transformResponse: (response) => response.data,
    }),

    updateMedicineTaken: builder.mutation({
      query: ({ compartment, medicineName }) => ({
        url: '/medicine-taken',
        method: 'POST',
        body: { compartment, medicineName },
        headers: {
          'x-device-token': DEVICE_AUTH_TOKEN,
        },
      }),
      invalidatesTags: ['Schedule', 'Device'],
      transformResponse: (response) => response.data,
    }),

    getMedicineStatus: builder.query({
      query: () => '/medicine-status',
      providesTags: ['Schedule'],
      transformResponse: (response) => response.data,
    }),

    // ========== COMPARTMENT MANAGEMENT ==========
    getCompartments: builder.query({
      query: () => '/compartments',
      providesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    updateCompartment: builder.mutation({
      query: ({ compartmentNumber, data }) => ({
        url: `/compartments/${compartmentNumber}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Device', 'Schedule'],
      transformResponse: (response) => response.data,
    }),

    // ========== DEVICE SETTINGS ==========
    getDeviceSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    updateDeviceSettings: builder.mutation({
      query: (settings) => ({
        url: '/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    // ========== BATTERY MANAGEMENT ==========
    getBatteryStatus: builder.query({
      query: () => '/battery',
      providesTags: ['DeviceStatus'],
      transformResponse: (response) => response.data,
    }),

    updateBatteryLevel: builder.mutation({
      query: ({ level, charging }) => ({
        url: '/battery',
        method: 'POST',
        body: { level, charging },
        headers: {
          'x-device-token': DEVICE_AUTH_TOKEN,
        },
      }),
      invalidatesTags: ['DeviceStatus'],
      transformResponse: (response) => response.data,
    }),

    // ========== ALARMS ==========
    triggerAlarm: builder.mutation({
      query: ({ type, message }) => ({
        url: '/trigger-alarm',
        method: 'POST',
        body: { type, message },
        headers: {
          'x-device-token': DEVICE_AUTH_TOKEN,
        },
      }),
      transformResponse: (response) => response.data,
    }),

    stopAlarm: builder.mutation({
      query: () => ({
        url: '/stop-alarm',
        method: 'POST',
      }),
      transformResponse: (response) => response.data,
    }),

    // ========== ERROR LOGS ==========
    getErrorLogs: builder.query({
      query: ({ limit = 50 }) => `/error-logs?limit=${limit}`,
      providesTags: ['DeviceLogs'],
      transformResponse: (response) => response.data,
    }),

    sendErrorLog: builder.mutation({
      query: (errorData) => ({
        url: '/error-logs',
        method: 'POST',
        body: errorData,
        headers: {
          'x-device-token': DEVICE_AUTH_TOKEN,
        },
      }),
      invalidatesTags: ['DeviceLogs'],
      transformResponse: (response) => response.data,
    }),

    clearErrorLogs: builder.mutation({
      query: () => ({
        url: '/error-logs/clear',
        method: 'POST',
      }),
      invalidatesTags: ['DeviceLogs'],
    }),

    // ========== FIRMWARE ==========
    getFirmwareVersion: builder.query({
      query: () => '/firmware/version',
      providesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    checkForUpdates: builder.query({
      query: () => '/firmware/check-update',
      providesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    startFirmwareUpdate: builder.mutation({
      query: () => ({
        url: '/firmware/update',
        method: 'POST',
      }),
      invalidatesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    // ========== CALIBRATION ==========
    getCalibrationStatus: builder.query({
      query: () => '/calibration',
      providesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    calibrateSensor: builder.mutation({
      query: ({ sensor, referenceValue }) => ({
        url: '/calibration',
        method: 'POST',
        body: { sensor, referenceValue },
      }),
      invalidatesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    // ========== DIAGNOSTICS ==========
    runDiagnostics: builder.mutation({
      query: () => ({
        url: '/diagnostics',
        method: 'POST',
      }),
      transformResponse: (response) => response.data,
    }),

    getDiagnosticsReport: builder.query({
      query: () => '/diagnostics/report',
      providesTags: ['Device'],
      transformResponse: (response) => response.data,
    }),

    // ========== COMMANDS ==========
    sendCommand: builder.mutation({
      query: ({ command, params }) => ({
        url: '/command',
        method: 'POST',
        body: { command, params },
        headers: {
          'x-device-token': DEVICE_AUTH_TOKEN,
        },
      }),
      transformResponse: (response) => response.data,
    }),

    restartDevice: builder.mutation({
      query: () => ({
        url: '/restart',
        method: 'POST',
      }),
      invalidatesTags: ['Device', 'DeviceStatus'],
    }),

    shutdownDevice: builder.mutation({
      query: () => ({
        url: '/shutdown',
        method: 'POST',
      }),
      invalidatesTags: ['Device', 'DeviceStatus'],
    }),
  }),
});

export const {
  // Device Registration
  useRegisterDeviceMutation,
  usePairDeviceMutation,
  useUnpairDeviceMutation,
  
  // Device Status
  useGetDeviceStatusQuery,
  useUpdateDeviceStatusMutation,
  
  // Device Information
  useGetDeviceInfoQuery,
  useUpdateDeviceInfoMutation,
  
  // Sensor Data
  useSendSensorDataMutation,
  useGetLatestSensorDataQuery,
  useGetSensorDataHistoryQuery,
  
  // Medicine Schedule
  useGetDeviceScheduleQuery,
  useUpdateMedicineTakenMutation,
  useGetMedicineStatusQuery,
  
  // Compartments
  useGetCompartmentsQuery,
  useUpdateCompartmentMutation,
  
  // Device Settings
  useGetDeviceSettingsQuery,
  useUpdateDeviceSettingsMutation,
  
  // Battery
  useGetBatteryStatusQuery,
  useUpdateBatteryLevelMutation,
  
  // Alarms
  useTriggerAlarmMutation,
  useStopAlarmMutation,
  
  // Error Logs
  useGetErrorLogsQuery,
  useSendErrorLogMutation,
  useClearErrorLogsMutation,
  
  // Firmware
  useGetFirmwareVersionQuery,
  useCheckForUpdatesQuery,
  useStartFirmwareUpdateMutation,
  
  // Calibration
  useGetCalibrationStatusQuery,
  useCalibrateSensorMutation,
  
  // Diagnostics
  useRunDiagnosticsMutation,
  useGetDiagnosticsReportQuery,
  
  // Commands
  useSendCommandMutation,
  useRestartDeviceMutation,
  useShutdownDeviceMutation,
} = deviceApi;