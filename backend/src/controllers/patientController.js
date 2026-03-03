const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');
const Prescription = require('../models/Prescription');
const Alert = require('../models/Alert');

// @desc    Get patient dashboard data
// @route   GET /api/patient/dashboard
// @access  Private (Patient)
const getDashboard = async (req, res) => {
  try {
    const patientId = req.userId;

    // Get latest health data
    const latestHealth = await HealthRecord.findOne({ patientId })
      .sort({ recordedAt: -1 });

    // Get health records for chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const healthHistory = await HealthRecord.find({
      patientId,
      recordedAt: { $gte: sevenDaysAgo }
    }).sort({ recordedAt: 1 });

    // Get active prescription
    const activePrescription = await Prescription.findOne({
      patientId,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate('doctorId', 'name');

    // Get unread alerts count
    const unreadAlerts = await Alert.countDocuments({
      patientId,
      status: 'unread'
    });

    // Calculate statistics
    const stats = {
      totalReadings: await HealthRecord.countDocuments({ patientId }),
      avgHeartRate: await HealthRecord.aggregate([
        { $match: { patientId } },
        { $group: { _id: null, avg: { $avg: '$heartRate' } } }
      ]),
      adherenceRate: activePrescription ? activePrescription.getAdherenceRate() : 0
    };

    res.json({
      success: true,
      data: {
        latestHealth,
        healthHistory,
        activePrescription,
        unreadAlerts,
        stats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient health records
// @route   GET /api/patient/health-records
// @access  Private (Patient)
const getHealthRecords = async (req, res) => {
  try {
    const patientId = req.userId;
    const { days = 30, page = 1, limit = 20 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await HealthRecord.find({
      patientId,
      recordedAt: { $gte: startDate }
    })
      .sort({ recordedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HealthRecord.countDocuments({
      patientId,
      recordedAt: { $gte: startDate }
    });

    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add health record (manual)
// @route   POST /api/patient/health-records
// @access  Private (Patient)
const addHealthRecord = async (req, res) => {
  try {
    const patientId = req.userId;
    const healthData = req.body;

    const record = await HealthRecord.create({
      patientId,
      ...healthData,
      source: 'manual'
    });

    // Check for abnormal readings
    const abnormalCheck = record.checkAbnormal();
    
    if (abnormalCheck.isAbnormal) {
      const patient = await User.findById(patientId);
      const alerts = await Alert.createFromHealthReading(record, patient);
      
      // Emit alerts
      const io = req.app.get('io');
      alerts.forEach(alert => {
        io.to(`patient-${patientId}`).emit('healthAlert', alert);
        if (patient.assignedDoctor) {
          io.to(`doctor-${patient.assignedDoctor}`).emit('patientAlert', alert);
        }
      });
    }

    res.status(201).json({
      success: true,
      data: record,
      abnormal: abnormalCheck
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient prescriptions
// @route   GET /api/patient/prescriptions
// @access  Private (Patient)
const getPrescriptions = async (req, res) => {
  try {
    const patientId = req.userId;

    const prescriptions = await Prescription.find({
      patientId
    })
      .populate('doctorId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient alerts
// @route   GET /api/patient/alerts
// @access  Private (Patient)
const getAlerts = async (req, res) => {
  try {
    const patientId = req.userId;
    const { status, limit = 50 } = req.query;

    const query = { patientId };
    if (status) query.status = status;

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark alert as read
// @route   PATCH /api/patient/alerts/:alertId/read
// @access  Private (Patient)
const markAlertRead = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = 'read';
    await alert.save();

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update patient profile
// @route   PUT /api/patient/profile
// @access  Private (Patient)
const updateProfile = async (req, res) => {
  try {
    const patientId = req.userId;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.password;
    delete updates.role;
    delete updates.email;

    const patient = await User.findByIdAndUpdate(
      patientId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getHealthRecords,
  addHealthRecord,
  getPrescriptions,
  getAlerts,
  markAlertRead,
  updateProfile
};