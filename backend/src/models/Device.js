const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['medical-box', 'heart-monitor', 'bp-monitor'],
    default: 'medical-box'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firmware: {
    version: String,
    lastUpdated: Date
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance'],
    default: 'offline'
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  macAddress: String,
  compartments: [{
    number: Number,
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine'
    },
    lastFilled: Date,
    remaining: Number
  }],
  settings: {
    buzzerVolume: { type: Number, default: 5, min: 0, max: 10 },
    ledBrightness: { type: Number, default: 5, min: 0, max: 10 },
    reminderInterval: { type: Number, default: 5 }, // minutes
    autoLock: { type: Boolean, default: true }
  },
  calibration: {
    heartRateOffset: { type: Number, default: 0 },
    bpSystolicOffset: { type: Number, default: 0 },
    bpDiastolicOffset: { type: Number, default: 0 }
  },
  errorLogs: [{
    code: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Update lastSeen on any activity
deviceSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  this.status = 'online';
  return this.save();
};

// Check if device is offline
deviceSchema.methods.isOffline = function() {
  const offlineThreshold = 5 * 60 * 1000; // 5 minutes
  return Date.now() - this.lastSeen > offlineThreshold;
};

module.exports = mongoose.model('Device', deviceSchema);