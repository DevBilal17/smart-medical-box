const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPatients,
  getPatientDetails,
  getPatientHealthData,
  createPrescription,
  getPrescriptions,
  getAlerts,
  updateAlertStatus,
  sendMessage,
  getPatientReport,
  addPatient
} = require('../controllers/doctorController');

// All routes require authentication and doctor role
router.use(protect);
router.use(authorize('doctor'));

// Patient routes
router.get('/patients', getPatients);
router.get('/patients/:patientId', getPatientDetails);
router.get('/patients/:patientId/health-data', getPatientHealthData);
router.get('/patients/:patientId/report', getPatientReport);

//Add patients
router.post("/create-patient",protect,authorize("doctor"),addPatient)

// Prescription routes
router.post('/prescriptions', createPrescription);
router.get('/prescriptions', getPrescriptions);

// Alert routes
router.get('/alerts', getAlerts);
router.patch('/alerts/:alertId', updateAlertStatus);

// Message routes
router.post('/message', sendMessage);

module.exports = router;