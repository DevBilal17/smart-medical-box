export const HEALTH_RANGES = {
  heartRate: {
    normal: { min: 60, max: 100 },
    warning: { min: 50, max: 110 },
    critical: { min: 40, max: 120 }
  },
  bloodPressure: {
    systolic: {
      normal: { min: 90, max: 120 },
      elevated: { min: 120, max: 130 },
      high: { min: 130, max: 140 },
      critical: { min: 140, max: 180 }
    },
    diastolic: {
      normal: { min: 60, max: 80 },
      elevated: { min: 80, max: 85 },
      high: { min: 85, max: 90 },
      critical: { min: 90, max: 120 }
    }
  }
};

export const MEDICINE_TIMES = [
  { label: 'Morning (6-8 AM)', value: '06:00' },
  { label: 'Morning (8-10 AM)', value: '08:00' },
  { label: 'Afternoon (12-2 PM)', value: '12:00' },
  { label: 'Afternoon (2-4 PM)', value: '14:00' },
  { label: 'Evening (6-8 PM)', value: '18:00' },
  { label: 'Night (9-11 PM)', value: '21:00' }
];

export const ALERT_TYPES = {
  HEART_RATE: 'heartRate',
  BLOOD_PRESSURE: 'bloodPressure',
  MISSED_MEDICINE: 'missedMedicine',
  DEVICE_OFFLINE: 'deviceOffline',
  LOW_BATTERY: 'lowBattery'
};

export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor'
};


export const API_BASE_URL = 'http://10.173.231.123:5000/'