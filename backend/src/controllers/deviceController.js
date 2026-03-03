const Device = require('../models/Device');
const HealthRecord = require('../models/HealthRecord');
const Alert = require('../models/Alert');
const User = require('../models/User');

// @desc    Register device
// @route   POST /api/device/register
// @access  Private
const registerDevice = async (req, res) => {
  try {
    const { deviceId, deviceName, deviceType } = req.body;
    const patientId = req.userId;

    // Check if device already registered
    let device = await Device.findOne({ deviceId });
    
    if (device) {
      if (device.owner.toString() !== patientId.toString()) {
        return res.status(400).json({ message: 'Device already registered to another user' });
      }
      return res.json({ success: true, device });
    }

    // Create new device
    device = await Device.create({
      deviceId,
      deviceName,
      deviceType,
      owner: patientId,
      compartments: [1, 2, 3, 4].map(num => ({ number: num })),
      lastSeen: new Date()
    });

    // Update patient with device ID
    await User.findByIdAndUpdate(patientId, { deviceId: device._id });

    // Emit socket event
    const io = req.app.get('io');
    io.emit('deviceRegistered', { 
      patientId, 
      deviceId: device._id,
      device
    });

    res.status(201).json({ success: true, device });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update device status
// @route   POST /api/device/status
// @access  Device (with device token)
const updateDeviceStatus = async (req, res) => {
  try {
    const { batteryLevel, firmware, compartments } = req.body;
    const deviceId = req.deviceId;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Update device info
    device.batteryLevel = batteryLevel || device.batteryLevel;
    device.firmware = firmware || device.firmware;
    device.lastSeen = new Date();
    device.status = 'online';

    if (compartments) {
      device.compartments = compartments;
    }

    await device.save();

    // Check low battery
    if (batteryLevel && batteryLevel < 20) {
      const alert = await Alert.create({
        patientId: device.owner,
        deviceId: device._id,
        type: 'low_battery',
        severity: 'warning',
        title: 'Low Battery',
        message: `Device battery is at ${batteryLevel}%`,
        data: { batteryLevel }
      });

      // Emit alert
      const io = req.app.get('io');
      io.emit('newAlert', alert);
    }

    res.json({ success: true, device });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Receive sensor data from device
// @route   POST /api/device/sensor-data
// @access  Device (with device token)
const receiveSensorData = async (req, res) => {
  try {
    const {
      heartRate,
      heartRateVariability,
      oxygenLevel,
      temperature,
      systolic,
      diastolic,
      respiratoryRate,
      steps
    } = req.body;

    const deviceId = req.deviceId;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Create health record
    const healthRecord = await HealthRecord.create({
      patientId: device.owner,
      deviceId: device._id,
      heartRate,
      heartRateVariability,
      oxygenLevel,
      temperature,
      systolic,
      diastolic,
      respiratoryRate,
      steps,
      source: 'device',
      recordedAt: new Date()
    });

    // Check for abnormal readings
    const abnormalCheck = healthRecord.checkAbnormal();
    
    if (abnormalCheck.isAbnormal) {
      // Create alerts
      const alerts = await Alert.createFromHealthReading(healthRecord, await User.findById(device.owner));
      
      // Emit alerts via WebSocket
      const io = req.app.get('io');
      alerts.forEach(alert => {
        io.to(`patient-${device.owner}`).emit('healthAlert', alert);
        if (device.owner.assignedDoctor) {
          io.to(`doctor-${device.owner.assignedDoctor}`).emit('patientAlert', alert);
        }
      });
    }

    // Update device last seen
    device.lastSeen = new Date();
    await device.save();

    res.json({ 
      success: true, 
      record: healthRecord,
      abnormal: abnormalCheck
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Medicine taken confirmation
// @route   POST /api/device/medicine-taken
// @access  Device (with device token)
const medicineTaken = async (req, res) => {
  try {
    const { compartment, medicineName } = req.body;
    const deviceId = req.deviceId;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Update compartment
    const compartmentData = device.compartments.find(c => c.number === compartment);
    if (compartmentData && compartmentData.medicine) {
      // Update medicine taken status in prescription
      // This would require finding the active prescription and updating
    }

    // Emit event
    const io = req.app.get('io');
    io.to(`patient-${device.owner}`).emit('medicineTaken', {
      compartment,
      medicineName,
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Medicine taken recorded' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get device schedule
// @route   GET /api/device/schedule
// @access  Device (with device token)
const getDeviceSchedule = async (req, res) => {
  try {
    const deviceId = req.deviceId;

    const device = await Device.findOne({ deviceId }).populate('owner');
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Get active prescription
    const Prescription = require('../models/Prescription');
    const prescription = await Prescription.findOne({
      patientId: device.owner._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!prescription) {
      return res.json({ schedule: [] });
    }

    // Format schedule for device
    const schedule = prescription.medicines.map(med => ({
      name: med.name,
      dosage: med.dosage,
      times: med.times.map(t => t.time),
      compartment: med.compartmentNumber,
      instructions: med.instructions
    }));

    res.json({ success: true, schedule });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Trigger alarm from device
// @route   POST /api/device/trigger-alarm
// @access  Device (with device token)
const triggerAlarm = async (req, res) => {
  try {
    const { type, message } = req.body;
    const deviceId = req.deviceId;

    const device = await Device.findOne({ deviceId }).populate('owner');
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Create emergency alert
    const alert = await Alert.create({
      patientId: device.owner._id,
      deviceId: device._id,
      type: type || 'emergency',
      severity: 'emergency',
      title: 'Emergency Alert',
      message: message || 'Emergency button pressed',
      data: { source: 'device' }
    });

    // Emit emergency alert
    const io = req.app.get('io');
    io.to(`doctor-${device.owner.assignedDoctor}`).emit('emergencyAlert', {
      patient: device.owner,
      alert
    });

    // Send SMS to emergency contact (you would implement this)
    if (device.owner.emergencyContact) {
      // Send SMS via Twilio or similar service
    }

    res.json({ success: true, alert });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerDevice,
  updateDeviceStatus,
  receiveSensorData,
  medicineTaken,
  getDeviceSchedule,
  triggerAlarm
};