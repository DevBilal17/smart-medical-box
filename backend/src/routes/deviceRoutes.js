const express = require('express');
const router = express.Router();
const { authenticateDevice, protect } = require('../middleware/auth');
const {
  registerDevice,
  updateDeviceStatus,
  receiveSensorData,
  medicineTaken,
  getDeviceSchedule,
  triggerAlarm
} = require('../controllers/deviceController');

// Device routes (with device token)
router.post('/register', protect, registerDevice);
router.post('/status', authenticateDevice, updateDeviceStatus);
router.post('/sensor-data', authenticateDevice, receiveSensorData);
router.post('/medicine-taken', authenticateDevice, medicineTaken);
router.get('/schedule', authenticateDevice, getDeviceSchedule);
router.post('/trigger-alarm', authenticateDevice, triggerAlarm);

module.exports = router;