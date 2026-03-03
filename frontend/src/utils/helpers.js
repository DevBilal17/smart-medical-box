import moment from 'moment';
import { HEALTH_RANGES } from './constants';

export const formatDate = (date, format = 'MMM D, YYYY') => {
  return moment(date).format(format);
};

export const formatTime = (time, format = 'hh:mm A') => {
  return moment(time, 'HH:mm').format(format);
};

export const getHeartRateStatus = (value) => {
  if (!value) return { status: 'unknown', color: '#95a5a6', message: 'No data' };
  
  if (value < HEALTH_RANGES.heartRate.critical.min || value > HEALTH_RANGES.heartRate.critical.max) {
    return { status: 'critical', color: '#e74c3c', message: 'Critical' };
  } else if (value < HEALTH_RANGES.heartRate.warning.min || value > HEALTH_RANGES.heartRate.warning.max) {
    return { status: 'warning', color: '#f39c12', message: 'Warning' };
  } else if (value >= HEALTH_RANGES.heartRate.normal.min && value <= HEALTH_RANGES.heartRate.normal.max) {
    return { status: 'normal', color: '#2ecc71', message: 'Normal' };
  }
  return { status: 'unknown', color: '#95a5a6', message: 'Check' };
};

export const getBloodPressureStatus = (systolic, diastolic) => {
  if (!systolic || !diastolic) {
    return { status: 'unknown', color: '#95a5a6', message: 'No data' };
  }

  if (systolic >= HEALTH_RANGES.bloodPressure.systolic.critical.min ||
      diastolic >= HEALTH_RANGES.bloodPressure.diastolic.critical.min) {
    return { status: 'critical', color: '#e74c3c', message: 'Critical' };
  } else if (systolic >= HEALTH_RANGES.bloodPressure.systolic.high.min ||
             diastolic >= HEALTH_RANGES.bloodPressure.diastolic.high.min) {
    return { status: 'high', color: '#f39c12', message: 'High' };
  } else if (systolic >= HEALTH_RANGES.bloodPressure.systolic.elevated.min ||
             diastolic >= HEALTH_RANGES.bloodPressure.diastolic.elevated.min) {
    return { status: 'elevated', color: '#f39c12', message: 'Elevated' };
  } else if (systolic >= HEALTH_RANGES.bloodPressure.systolic.normal.min &&
             systolic <= HEALTH_RANGES.bloodPressure.systolic.normal.max &&
             diastolic >= HEALTH_RANGES.bloodPressure.diastolic.normal.min &&
             diastolic <= HEALTH_RANGES.bloodPressure.diastolic.normal.max) {
    return { status: 'normal', color: '#2ecc71', message: 'Normal' };
  } else if (systolic < HEALTH_RANGES.bloodPressure.systolic.normal.min ||
             diastolic < HEALTH_RANGES.bloodPressure.diastolic.normal.min) {
    return { status: 'low', color: '#f39c12', message: 'Low' };
  }
  
  return { status: 'unknown', color: '#95a5a6', message: 'Check' };
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{10}$/;
  return re.test(phone);
};

export const calculateAdherence = (taken, total) => {
  if (total === 0) return 0;
  return Math.round((taken / total) * 100);
};

export const groupByDate = (items, dateField = 'createdAt') => {
  return items.reduce((groups, item) => {
    const date = moment(item[dateField]).format('YYYY-MM-DD');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});
};