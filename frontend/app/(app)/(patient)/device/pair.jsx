import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { API_BASE_URL } from "../../../../src/utils/constants"
import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PairDevice() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  // Get token when component mounts
  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
      } catch (error) {
        console.error('Error getting token:', error);
      } finally {
        setTokenLoading(false);
      }
    };
    getToken();
  }, []);

  // Show loading while checking permission and token
  if (!permission || tokenLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          {!permission ? "Requesting camera permission..." : "Loading..."}
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.center}>
        <Icon name="alert-circle" size={60} color="#e74c3c" />
        <Text style={styles.title}>Authentication Required</Text>
        <Text style={styles.subtitle}>Please login again to pair devices</Text>
        <TouchableOpacity 
          onPress={() => router.replace('/(auth)/login')} 
          style={styles.button}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

const handleScan = async ({ data }) => {
  if (scanned || loading) return;

  setScanned(true);
  setLoading(true);

  try {
    Vibration.vibrate(200);
    
    // Parse deviceId from QR
    let deviceId = data;
    if (data.startsWith('{') && data.endsWith('}')) {
      const parsed = JSON.parse(data);
      deviceId = parsed.deviceId;
    }

    const response = await axios.post(
      `${API_BASE_URL}api/device/register`,
      { deviceId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    Alert.alert('Success', 'Device paired successfully!', [
      { text: 'OK', onPress: () => router.replace('/(patient)') }
    ]);
    
  } catch (err) {
    Alert.alert('Error', 'Pairing failed. Try again.', [
      { text: 'Retry', onPress: () => setScanned(false) }
    ]);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <View style={styles.overlay}>
        <Text style={styles.header}>Scan Medical Box QR</Text>

        <View style={styles.frame}>
          <Icon name="qrcode-scan" size={120} color="#fff" />
        </View>

        <Text style={styles.text}>
          Place QR code inside frame to pair device
        </Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Pairing device...</Text>
          </View>
        )}

        {scanned && !loading && (
          <TouchableOpacity
            style={styles.retry}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.retryText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },

  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  frame: {
    borderWidth: 2,
    borderColor: '#fff',
    padding: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  text: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 20,
  },

  retry: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },

  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },

  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
});