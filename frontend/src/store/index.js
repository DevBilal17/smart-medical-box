import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authApi } from './api/authApi';
import { patientApi } from './api/patientApi';
import { doctorApi } from './api/doctorApi';
import { deviceApi } from './api/deviceApi';
import { alertApi } from './api/alertApi';
import { medicineApi } from './api/medicineApi';
import { notificationApi } from './api/notificationApi';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [patientApi.reducerPath]: patientApi.reducer,
    [doctorApi.reducerPath]: doctorApi.reducer,
    [deviceApi.reducerPath]: deviceApi.reducer,
    [alertApi.reducerPath]: alertApi.reducer,
    [medicineApi.reducerPath]: medicineApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      authApi.middleware,
      patientApi.middleware,
      doctorApi.middleware,
      deviceApi.middleware,
      alertApi.middleware,
      medicineApi.middleware,
      notificationApi.middleware
    ),
});

setupListeners(store.dispatch);

export default store;