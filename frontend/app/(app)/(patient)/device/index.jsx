import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { useGetDeviceStatusQuery, useGetDeviceInfoQuery, useGetBatteryStatusQuery, useRestartDeviceMutation } from '../../../../src/store/api/deviceApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';

export default function DeviceStatus() {
  const [refreshing, setRefreshing] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const { 
    data: deviceStatus,
    isLoading: statusLoading,
    refetch: refetchStatus
  } = useGetDeviceStatusQuery();

  const {
    data: deviceInfo,
    isLoading: infoLoading,
    refetch: refetchInfo
  } = useGetDeviceInfoQuery();

  const {
    data: batteryStatus,
    refetch: refetchBattery
  } = useGetBatteryStatusQuery();

  const [restartDevice] = useRestartDeviceMutation();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStatus(), refetchInfo(), refetchBattery()]);
    setRefreshing(false);
  };

  const handleRestart = () => {
    Alert.alert(
      'Restart Device',
      'Are you sure you want to restart the medical box?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          onPress: async () => {
            setRestarting(true);
            try {
              await restartDevice().unwrap();
              Alert.alert('Success', 'Device restart initiated');
            } catch (error) {
              Alert.alert('Error', 'Failed to restart device');
            } finally {
              setRestarting(false);
            }
          }
        }
      ]
    );
  };

  const getBatteryColor = (level) => {
    if (level >= 60) return '#2ecc71';
    if (level >= 20) return '#f39c12';
    return '#e74c3c';
  };

  const getBatteryIcon = (level) => {
    if (level >= 90) return 'battery';
    if (level >= 70) return 'battery-80';
    if (level >= 50) return 'battery-60';
    if (level >= 30) return 'battery-40';
    if (level >= 10) return 'battery-20';
    return 'battery-outline';
  };

  if (statusLoading || infoLoading) {
    return <Loading />;
  }

  if (!deviceStatus) {
    return (
      <EmptyState
        icon="devices"
        title="No Device Paired"
        message="You haven't paired any medical device yet"
        buttonText="Pair Device"
        onPress={() => router.push('/(app)/(patient)/device/pair')}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>Device Status</Text>
        <TouchableOpacity onPress={handleRestart} disabled={restarting}>
          <Icon name="restart" size={24} color={restarting ? '#bdc3c7' : '#3498db'} />
        </TouchableOpacity>
      </View>

      {/* Device Info Card */}
      <LinearGradient
        colors={deviceStatus?.status === 'online' ? ['#2ecc71', '#27ae60'] : ['#95a5a6', '#7f8c8d']}
        style={styles.deviceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.deviceHeader}>
          <Icon name="devices" size={40} color="#fff" />
          <View style={styles.deviceHeaderText}>
            <Text style={styles.deviceName}>{deviceInfo?.deviceName || 'Medical Box'}</Text>
            <Text style={styles.deviceId}>ID: {deviceInfo?.deviceId}</Text>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: deviceStatus?.status === 'online' ? '#fff' : 'rgba(255,255,255,0.2)'
          }]}>
            <Text style={[styles.statusText, { 
              color: deviceStatus?.status === 'online' ? '#2ecc71' : '#fff'
            }]}>
              {deviceStatus?.status === 'online' ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Battery Status */}
      <View style={styles.batteryCard}>
        <Text style={styles.cardTitle}>Battery Status</Text>
        <View style={styles.batteryContainer}>
          <Icon 
            name={getBatteryIcon(batteryStatus?.level)} 
            size={50} 
            color={getBatteryColor(batteryStatus?.level)} 
          />
          <View style={styles.batteryInfo}>
            <Text style={styles.batteryLevel}>{batteryStatus?.level || 0}%</Text>
            <Text style={styles.batteryStatus}>
              {batteryStatus?.charging ? 'Charging' : 'Not Charging'}
            </Text>
          </View>
        </View>
        {batteryStatus?.level < 20 && (
          <View style={styles.batteryWarning}>
            <Icon name="alert" size={16} color="#e74c3c" />
            <Text style={styles.batteryWarningText}>Low battery! Please charge soon.</Text>
          </View>
        )}
      </View>

      {/* Device Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Device Details</Text>
        
        <View style={styles.detailRow}>
          <Icon name="wifi" size={20} color="#3498db" />
          <Text style={styles.detailLabel}>Connection:</Text>
          <Text style={styles.detailValue}>
            {deviceStatus?.status === 'online' ? 'Connected' : 'Disconnected'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="clock-outline" size={20} color="#3498db" />
          <Text style={styles.detailLabel}>Last Seen:</Text>
          <Text style={styles.detailValue}>
            {deviceStatus?.lastSeen ? moment(deviceStatus.lastSeen).fromNow() : 'Never'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="update" size={20} color="#3498db" />
          <Text style={styles.detailLabel}>Firmware:</Text>
          <Text style={styles.detailValue}>
            {deviceInfo?.firmware?.version || '1.0.0'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="ip" size={20} color="#3498db" />
          <Text style={styles.detailLabel}>IP Address:</Text>
          <Text style={styles.detailValue}>
            {deviceInfo?.ipAddress || '192.168.1.100'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="wifi-strength" size={20} color="#3498db" />
          <Text style={styles.detailLabel}>Signal Strength:</Text>
          <Text style={styles.detailValue}>Excellent</Text>
        </View>
      </View>

      {/* Compartments */}
      <View style={styles.compartmentsCard}>
        <Text style={styles.cardTitle}>Medicine Compartments</Text>
        <View style={styles.compartmentsGrid}>
          {[1, 2, 3, 4].map((num) => {
            const compartment = deviceInfo?.compartments?.find(c => c.number === num);
            return (
              <View key={num} style={styles.compartmentItem}>
                <LinearGradient
                  colors={compartment?.medicine ? ['#3498db', '#2980b9'] : ['#ecf0f1', '#bdc3c7']}
                  style={styles.compartmentGradient}
                >
                  <Text style={styles.compartmentNumber}>{num}</Text>
                  {compartment?.medicine && (
                    <>
                      <Text style={styles.compartmentMedicine} numberOfLines={1}>
                        {compartment.medicine.name}
                      </Text>
                      <Text style={styles.compartmentCount}>
                        {compartment.remaining || 0} left
                      </Text>
                    </>
                  )}
                  {!compartment?.medicine && (
                    <Text style={styles.compartmentEmpty}>Empty</Text>
                  )}
                </LinearGradient>
              </View>
            );
          })}
        </View>
      </View>

      {/* Error Logs */}
      {deviceInfo?.errorLogs?.length > 0 && (
        <View style={styles.errorsCard}>
          <Text style={styles.cardTitle}>Recent Errors</Text>
          {deviceInfo.errorLogs.slice(0, 3).map((error, index) => (
            <View key={index} style={styles.errorItem}>
              <Icon name="alert-circle" size={16} color="#e74c3c" />
              <View style={styles.errorContent}>
                <Text style={styles.errorMessage}>{error.message}</Text>
                <Text style={styles.errorTime}>
                  {moment(error.timestamp).fromNow()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="tune" size={24} color="#3498db" />
          <Text style={styles.actionText}>Device Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="update" size={24} color="#3498db" />
          <Text style={styles.actionText}>Check for Updates</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="help-circle" size={24} color="#3498db" />
          <Text style={styles.actionText}>Troubleshooting</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.unpairButton]}
          onPress={() => Alert.alert(
            'Unpair Device',
            'Are you sure you want to unpair this device?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Unpair', 
                style: 'destructive',
                onPress: () => Alert.alert('Success', 'Device unpaired successfully')
              }
            ]
          )}
        >
          <Icon name="link-variant-off" size={24} color="#e74c3c" />
          <Text style={[styles.actionText, styles.unpairText]}>Unpair Device</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  deviceCard: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceHeaderText: {
    flex: 1,
    marginLeft: 15,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  deviceId: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  batteryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryInfo: {
    marginLeft: 20,
  },
  batteryLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  batteryStatus: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  batteryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c20',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  batteryWarningText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#e74c3c',
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#7f8c8d',
    width: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  compartmentsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compartmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  compartmentItem: {
    width: '48%',
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  compartmentGradient: {
    padding: 15,
    alignItems: 'center',
  },
  compartmentNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  compartmentMedicine: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  compartmentCount: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
  },
  compartmentEmpty: {
    fontSize: 12,
    color: '#fff',
    fontStyle: 'italic',
  },
  errorsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  errorContent: {
    marginLeft: 10,
    flex: 1,
  },
  errorMessage: {
    fontSize: 12,
    color: '#2c3e50',
  },
  errorTime: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
  },
  actionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  actionText: {
    marginLeft: 15,
    fontSize: 14,
    color: '#2c3e50',
  },
  unpairButton: {
    borderBottomWidth: 0,
    marginTop: 5,
  },
  unpairText: {
    color: '#e74c3c',
  },
});