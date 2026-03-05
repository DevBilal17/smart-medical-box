const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');
const Prescription = require('../models/Prescription');
const Alert = require('../models/Alert');
const Device = require('../models/Device');
const moment = require('moment');
const { sendEmail } = require('../utils/emailService');

// @desc    Get all patients assigned to doctor
// @route   GET /api/doctor/patients
// @access  Private (Doctor)
const getPatients = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { search, page = 1, limit = 20 } = req.query;

    let query = { 
      role: 'patient', 
      assignedDoctor: doctorId,
      isActive: true 
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await User.find(query)
      .select('name email phone age gender bloodGroup lastActive deviceId')
      .populate('deviceId')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get latest health data for each patient
    const patientsWithHealth = await Promise.all(
      patients.map(async (patient) => {
        const latestHealth = await HealthRecord.findOne({ patientId: patient._id })
          .sort({ recordedAt: -1 });
        
        const unreadAlerts = await Alert.countDocuments({
          patientId: patient._id,
          status: 'unread'
        });

        return {
          ...patient.toObject(),
          latestHealth,
          unreadAlerts,
          deviceStatus: patient.deviceId ? patient.deviceId.status : 'offline'
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: patientsWithHealth,
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

// @desc    Get single patient details
// @route   GET /api/doctor/patients/:patientId
// @access  Private (Doctor)
const getPatientDetails = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.userId;

    // Verify patient belongs to this doctor
    const patient = await User.findOne({
      _id: patientId,
      role: 'patient',
      assignedDoctor: doctorId
    }).select('-password')
      .populate('deviceId');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get latest health data
    const latestHealth = await HealthRecord.findOne({ patientId })
      .sort({ recordedAt: -1 });

    // Get health statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const healthStats = await HealthRecord.aggregate([
      {
        $match: {
          patientId: patient._id,
          recordedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          avgHeartRate: { $avg: '$heartRate' },
          avgSystolic: { $avg: '$systolic' },
          avgDiastolic: { $avg: '$diastolic' },
          avgOxygenLevel: { $avg: '$oxygenLevel' },
          maxHeartRate: { $max: '$heartRate' },
          minHeartRate: { $min: '$heartRate' },
          totalReadings: { $sum: 1 }
        }
      }
    ]);

    // Get active prescription
    const activePrescription = await Prescription.findOne({
      patientId,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate('medicines');

    // Get recent alerts
    const recentAlerts = await Alert.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get device status and logs
    const deviceLogs = patient.deviceId ? await Device.findById(patient.deviceId)
      .select('errorLogs batteryLevel lastSeen status') : null;

    res.json({
      success: true,
      data: {
        patient,
        latestHealth,
        healthStats: healthStats[0] || null,
        activePrescription,
        recentAlerts,
        deviceLogs
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient health data with date range
// @route   GET /api/doctor/patients/:patientId/health-data
// @access  Private (Doctor)
const getPatientHealthData = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate, type } = req.query;
    const doctorId = req.userId;

    // Verify patient belongs to this doctor
    const patient = await User.findOne({
      _id: patientId,
      assignedDoctor: doctorId
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    let query = { patientId };

    // Date range filter
    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.recordedAt = { $gte: thirtyDaysAgo };
    }

    // Select specific data type
    let select = {};
    if (type === 'heartRate') {
      select = { heartRate: 1, recordedAt: 1 };
    } else if (type === 'bloodPressure') {
      select = { systolic: 1, diastolic: 1, recordedAt: 1 };
    } else if (type === 'oxygen') {
      select = { oxygenLevel: 1, recordedAt: 1 };
    } else {
      select = { 
        heartRate: 1, 
        systolic: 1, 
        diastolic: 1, 
        oxygenLevel: 1,
        temperature: 1,
        recordedAt: 1 
      };
    }

    const healthData = await HealthRecord.find(query)
      .select(select)
      .sort({ recordedAt: 1 });

    // Format data for charts
    const formattedData = {
      labels: healthData.map(d => moment(d.recordedAt).format('MMM D')),
      datasets: []
    };

    if (!type || type === 'heartRate') {
      formattedData.datasets.push({
        label: 'Heart Rate',
        data: healthData.map(d => d.heartRate || 0),
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)'
      });
    }

    if (!type || type === 'bloodPressure') {
      formattedData.datasets.push({
        label: 'Systolic',
        data: healthData.map(d => d.systolic || 0),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)'
      });
      formattedData.datasets.push({
        label: 'Diastolic',
        data: healthData.map(d => d.diastolic || 0),
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.1)'
      });
    }

    if (!type || type === 'oxygen') {
      formattedData.datasets.push({
        label: 'Oxygen Level',
        data: healthData.map(d => d.oxygenLevel || 0),
        borderColor: '#f39c12',
        backgroundColor: 'rgba(243, 156, 18, 0.1)'
      });
    }

    res.json({
      success: true,
      data: formattedData,
      raw: healthData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create prescription for patient
// @route   POST /api/doctor/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, medicines, diagnosis, notes, startDate, endDate } = req.body;

    // Verify patient exists and is assigned to this doctor
    const patient = await User.findOne({
      _id: patientId,
      role: 'patient',
      assignedDoctor: doctorId
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Deactivate any existing active prescriptions
    await Prescription.updateMany(
      { patientId, isActive: true },
      { isActive: false, status: 'completed' }
    );

    // Create new prescription
    const prescription = await Prescription.create({
      patientId,
      doctorId,
      medicines,
      diagnosis,
      notes,
      startDate,
      endDate,
      isActive: true,
      status: 'active'
    });

    // Update device compartments if patient has a device
    if (patient.deviceId) {
      const device = await Device.findById(patient.deviceId);
      if (device) {
        // Update compartment assignments
        medicines.forEach(med => {
          const compartment = device.compartments.find(
            c => c.number === med.compartmentNumber
          );
          if (compartment) {
            compartment.medicine = med._id;
            compartment.lastFilled = new Date();
          }
        });
        await device.save();

        // Notify device via WebSocket
        const io = req.app.get('io');
        io.to(`device-${device.deviceId}`).emit('prescriptionUpdated', {
          prescription: prescription._id,
          medicines
        });
      }
    }

    // Notify patient via WebSocket
    const io = req.app.get('io');
    io.to(`patient-${patientId}`).emit('newPrescription', {
      prescription: prescription._id,
      doctorName: req.user.name
    });

    // Send email notification to patient

    await sendEmail({
      email: patient.email,
      subject: 'New Prescription Created',
      template: 'newPrescription',
      data: {
        name: patient.name,
        doctorName: req.user.name,
        medicines: medicines.map(m => m.name).join(', ')
      }
    });

    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all prescriptions for doctor
// @route   GET /api/doctor/prescriptions
// @access  Private (Doctor)
const getPrescriptions = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { status, patientId, page = 1, limit = 20 } = req.query;

    let query = { doctorId };
    if (status) query.status = status;
    if (patientId) query.patientId = patientId;

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name email phone age')
      .populate('medicines')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(query);

    res.json({
      success: true,
      data: prescriptions,
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

// @desc    Get all alerts for doctor's patients
// @route   GET /api/doctor/alerts
// @access  Private (Doctor)
const getAlerts = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { status, severity, patientId, page = 1, limit = 50 } = req.query;

    // Get all patients of this doctor
    const patients = await User.find({ 
      assignedDoctor: doctorId,
      role: 'patient' 
    }).select('_id');

    const patientIds = patients.map(p => p._id);

    let query = { 
      patientId: { $in: patientIds },
      ...(status && { status }),
      ...(severity && { severity }),
      ...(patientId && { patientId })
    };

    const alerts = await Alert.find(query)
      .populate('patientId', 'name email phone age')
      .populate('acknowledgedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alert.countDocuments(query);

    // Get counts by severity
    const severityCounts = await Alert.aggregate([
      { $match: { patientId: { $in: patientIds } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: alerts,
      counts: {
        total,
        bySeverity: severityCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      },
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

// @desc    Update alert status
// @route   PATCH /api/doctor/alerts/:alertId
// @access  Private (Doctor)
const updateAlertStatus = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, notes } = req.body;
    const doctorId = req.userId;

    const alert = await Alert.findById(alertId).populate('patientId');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Verify patient belongs to this doctor
    if (alert.patientId.assignedDoctor?.toString() !== doctorId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update alert
    alert.status = status;
    if (status === 'acknowledged') {
      alert.acknowledgedBy = doctorId;
      alert.acknowledgedAt = new Date();
    } else if (status === 'resolved') {
      alert.resolvedAt = new Date();
    }

    if (notes) {
      alert.actions.push({
        type: 'note',
        action: notes,
        performedBy: doctorId,
        performedAt: new Date()
      });
    }

    await alert.save();

    // Notify patient via WebSocket
    const io = req.app.get('io');
    io.to(`patient-${alert.patientId._id}`).emit('alertUpdated', {
      alertId: alert._id,
      status
    });

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send message to patient
// @route   POST /api/doctor/message
// @access  Private (Doctor)
const sendMessage = async (req, res) => {
  try {
    const { patientId, message, type = 'text' } = req.body;
    const doctorId = req.userId;
    const doctor = await User.findById(doctorId);

    // Verify patient belongs to this doctor
    const patient = await User.findOne({
      _id: patientId,
      assignedDoctor: doctorId
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create message in database (you'd need a Message model)
    // For now, just emit via WebSocket

    const io = req.app.get('io');
    io.to(`patient-${patientId}`).emit('doctorMessage', {
      doctorId,
      doctorName: doctor.name,
      message,
      type,
      timestamp: new Date()
    });

    // Send email for important messages
    if (type === 'important') {
      await sendEmail({
        email: patient.email,
        subject: 'Important Message from Your Doctor',
        template: 'doctorMessage',
        data: {
          patientName: patient.name,
          doctorName: doctor.name,
          message
        }
      });
    }

    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get patient summary report
// @route   GET /api/doctor/patients/:patientId/report
// @access  Private (Doctor)
const getPatientReport = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { days = 30 } = req.query;
    const doctorId = req.userId;

    // Verify patient belongs to this doctor
    const patient = await User.findOne({
      _id: patientId,
      assignedDoctor: doctorId
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get health records
    const healthRecords = await HealthRecord.find({
      patientId,
      recordedAt: { $gte: startDate }
    }).sort({ recordedAt: 1 });

    // Get prescriptions
    const prescriptions = await Prescription.find({
      patientId,
      createdAt: { $gte: startDate }
    }).populate('medicines');

    // Get alerts
    const alerts = await Alert.find({
      patientId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalReadings: healthRecords.length,
      avgHeartRate: healthRecords.reduce((sum, r) => sum + (r.heartRate || 0), 0) / healthRecords.length,
      avgSystolic: healthRecords.reduce((sum, r) => sum + (r.systolic || 0), 0) / healthRecords.length,
      avgDiastolic: healthRecords.reduce((sum, r) => sum + (r.diastolic || 0), 0) / healthRecords.length,
      adherenceRate: calculateAdherence(prescriptions),
      alertsCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length
    };

    res.json({
      success: true,
      data: {
        patient,
        stats,
        healthRecords: healthRecords.slice(-10), // Last 10 records
        prescriptions,
        alerts: alerts.slice(0, 20)
      },
      dateRange: {
        start: startDate,
        end: new Date(),
        days
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate adherence
const calculateAdherence = (prescriptions) => {
  if (!prescriptions.length) return 0;
  
  let total = 0;
  let taken = 0;
  
  prescriptions.forEach(prescription => {
    prescription.medicines.forEach(medicine => {
      medicine.times.forEach(time => {
        total++;
        if (time.taken) taken++;
      });
    });
  });
  
  return total === 0 ? 0 : Math.round((taken / total) * 100);
};


// @desc    Add new patient and assign to doctor
// @route   POST /api/doctor/create-patient
// @access  Private (Doctor)
const addPatient = async (req, res) => {
  try {
    const doctorId = req.userId;
    const {
      name,
      email,
      phone,
      password,
      age,
      gender,
      bloodGroup,
      allergies,
      medicalConditions,
      address,
      emergencyContact
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        message: 'Please provide at least name, email, and phone'
      });
    }

    // Check if patient with email already exists
    const existingPatient = await User.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ 
        message: 'Patient with this email already exists' 
      });
    }

    // Check if phone number is already registered
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ 
        message: 'Patient with this phone number already exists' 
      });
    }

    // Generate temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-8);

    // Create new patient
    const patient = await User.create({
      name,
      email,
      password: tempPassword, // hashed by pre-save hook
      phone,
      role: 'patient',
      age: age || null,
      gender: gender || null,
      bloodGroup: bloodGroup || null,
      allergies: allergies || [],
      medicalConditions: medicalConditions || [],
      address: address || {},
      emergencyContact: emergencyContact || {},
      assignedDoctor: doctorId,
      isActive: true,
      emailVerified: false
    });

    // Prepare patient object for response
    const patientResponse = patient.toObject();
    delete patientResponse.password;
    delete patientResponse.otp;
    delete patientResponse.otpExpire;
    delete patientResponse.resetPasswordToken;
    delete patientResponse.resetPasswordExpire;

    // Send welcome email
    await sendEmail({
      email: patient.email,
      subject: 'Welcome to Health Monitoring System',
      template: 'welcomePatient', // your original template
      data: {
        name: patient.name,
        doctorName: req.user?.name || 'Your Doctor',
        email: patient.email,
        password: tempPassword
      }
    });

    // Notify doctor via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor-${doctorId}`).emit('patientAdded', {
        patientId: patient._id,
        patientName: patient.name
      });
    }

    res.status(201).json({
      success: true,
      message: 'Patient added successfully',
      data: patientResponse
    });

  } catch (error) {
    console.error('Error adding patient:', error);

    // Duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `Patient with this ${field} already exists` 
      });
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addPatient };


module.exports = {
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
};