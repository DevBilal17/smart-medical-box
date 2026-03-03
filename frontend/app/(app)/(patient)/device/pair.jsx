import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Updated import

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePairDeviceMutation } from '../../../../src/store/api/deviceApi';

export default function PairDevice() {
  const [permission, requestPermission] = useCameraPermissions(); // Updated hook
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [pairing, setPairing] = useState(false);

  const [pairDevice] = usePairDeviceMutation();

  // Remove the old useEffect and replace with permission check
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Icon name="camera-off" size={60} color="#e74c3c" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionMessage}>
          We need camera access to scan the QR code on your medical box
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission} // Request permission
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.permissionButton, { marginTop: 10, backgroundColor: '#95a5a6' }]}
          onPress={() => router.back()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    
    try {
      const deviceData = JSON.parse(data);
      
      // Validate device data format
      if (deviceData.deviceId && deviceData.deviceType === 'medical-box') {
        setPairing(true);
        
        try {
          await pairDevice({
            deviceId: deviceData.deviceId,
            pairingCode: deviceData.pairingCode,
            deviceName: deviceData.deviceName || 'Medical Box'
          }).unwrap();

          Alert.alert(
            'Success',
            'Device paired successfully!',
            [
              {
                text: 'OK',
                onPress: () => router.back()
              }
            ]
          );
        } catch (error) {
          Alert.alert(
            'Pairing Failed',
            error.data?.message || 'Failed to pair device. Please try again.',
            [
              { text: 'Try Again', onPress: () => setScanned(false) }
            ]
          );
        } finally {
          setPairing(false);
        }
      } else {
        Alert.alert(
          'Invalid QR Code',
          'This is not a valid medical box QR code',
          [
            { text: 'Try Again', onPress: () => setScanned(false) }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Invalid QR Code',
        'Please scan a valid medical box QR code',
        [
          { text: 'Try Again', onPress: () => setScanned(false) }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} // Note: onBarcodeScanned (not onBarCodeScanned)
        enableTorch={torchOn} // Updated prop name
        barcodeScannerSettings={{
          barcodeTypes: ["qr"], // Specify QR codes only
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Medical Box QR Code</Text>
            <TouchableOpacity onPress={() => setTorchOn(!torchOn)} style={styles.torchButton}>
              <Icon name={torchOn ? 'flashlight' : 'flashlight-off'} size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.scanText}>
              Place the QR code inside the frame
            </Text>
          </View>

          {scanned && (
            <TouchableOpacity 
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
              disabled={pairing}
            >
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                style={styles.scanAgainGradient}
              >
                {pairing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.instructions}>
            <Icon name="information" size={20} color="#fff" />
            <Text style={styles.instructionsText}>
              Scan the QR code on your Medical Box to pair it with your account
            </Text>
          </View>

          {/* Manual Entry Option */}
          <TouchableOpacity 
            style={styles.manualButton}
            onPress={() => Alert.alert(
              'Manual Entry',
              'Enter device ID manually',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Next',
                  onPress: () => Alert.alert('Coming Soon', 'Manual entry coming soon')
                }
              ]
            )}
          >
            <Text style={styles.manualButtonText}>Enter ID Manually</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {pairing && (
        <View style={styles.pairingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.pairingText}>Pairing device...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  torchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
  },
  scanAgainButton: {
    alignSelf: 'center',
    borderRadius: 25,
    overflow: 'hidden',
  },
  scanAgainGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  manualButton: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  permissionText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionMessage: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pairingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});