const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, healthRecordValidation } = require('../middleware/validation');
const {
  getDashboard,
  getHealthRecords,
  addHealthRecord,
  getPrescriptions,
  getAlerts,
  markAlertRead,
  updateProfile
} = require('../controllers/patientController');

// All routes require authentication and patient role
router.use(protect);
router.use(authorize('patient'));

router.get('/dashboard', getDashboard);
router.get('/health-records', getHealthRecords);
router.post('/health-records', validate(healthRecordValidation), addHealthRecord);
router.get('/prescriptions', getPrescriptions);
router.get('/alerts', getAlerts);
router.patch('/alerts/:alertId/read', markAlertRead);
router.put('/profile', updateProfile);

module.exports = router;