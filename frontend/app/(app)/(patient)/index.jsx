import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../src/hooks/useAuth';
import { 
  useGetDashboardQuery,
  useGetTodaysMedicinesQuery,
} from '../../../src/store/api/patientApi';
import {useGetUnreadCountQuery } from '../../../src/store/api/alertApi';
import { useGetDeviceStatusQuery } from '../../../src/store/api/deviceApi';
import Loading from '../../../src/components/Loading';
import EmptyState from '../../../src/components/EmptyState';
import HealthChart from '../../../src/components/HealthChart';
import MedicineCard from '../../../src/components/MedicineCard';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // RTK Queries
  const { 
    data: dashboard,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
    error: dashboardError
  } = useGetDashboardQuery();

  const {
    data: todaysMedicines = [],
    refetch: refetchMedicines
  } = useGetTodaysMedicinesQuery();

  const {
    data: unreadCount = 0,
    refetch: refetchAlerts
  } = useGetUnreadCountQuery();

  const {
    data: deviceStatus,
    refetch: refetchDevice
  } = useGetDeviceStatusQuery(undefined, {
    skip: !user?.deviceId // Skip if no device paired
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDashboard(),
      refetchMedicines(),
      refetchAlerts(),
      refetchDevice()
    ]);
    setRefreshing(false);
  }, []);


  //uncomment when api calling

  // if (dashboardLoading && !refreshing) {
  //   return <Loading />;
  // }

  // if (dashboardError) {
  //   return (
  //     <EmptyState
  //       icon="alert-circle"
  //       title="Error Loading Dashboard"
  //       message="Please pull down to refresh"
  //       buttonText="Retry"
  //       onPress={onRefresh}
  //     />
  //   );
  // }

  const latestHealth = dashboard?.latestHealth || []; // remove array 
  const stats = dashboard?.stats || {};
  const activePrescription = dashboard?.activePrescription || ""; //remove ""

  // Get next medicine
  const getNextMedicine = () => {
    if (!todaysMedicines?.length) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const upcoming = todaysMedicines
      .filter(med => !med.taken)
      .map(med => {
        const [hours, minutes] = med.time.split(':').map(Number);
        const medTime = hours * 60 + minutes;
        return { ...med, medTime };
      })
      .filter(med => med.medTime > currentTime)
      .sort((a, b) => a.medTime - b.medTime);

    return upcoming[0] || null;
  };

  const nextMedicine = getNextMedicine();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.role}>Patient</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={() => router.push('/(app)/(patient)/alerts')}
            >
              <Icon name="bell" size={24} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={logout}
            >
              <Icon name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Device Status */}
        {user?.deviceId && (
          <View style={styles.deviceStatus}>
            <View style={[styles.deviceDot, { 
              backgroundColor: deviceStatus?.status === 'online' ? '#2ecc71' : '#e74c3c' 
            }]} />
            <Text style={styles.deviceText}>
              Device: {deviceStatus?.status === 'online' ? 'Connected' : 'Offline'}
              {deviceStatus?.batteryLevel && ` • Battery: ${deviceStatus.batteryLevel}%`}
            </Text>
          </View>
        )}

        {/* Health Summary Cards */}
        <View style={styles.healthSummary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Heart Rate</Text>
            <Text style={styles.summaryValue}>
              {latestHealth?.heartRate || '--'}
              <Text style={styles.summaryUnit}> bpm</Text>
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Blood Pressure</Text>
            <Text style={styles.summaryValue}>
              {latestHealth ? `${latestHealth.systolic}/${latestHealth.diastolic}` : '--/--'}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Oxygen</Text>
            <Text style={styles.summaryValue}>
              {latestHealth?.oxygenLevel || '--'}
              <Text style={styles.summaryUnit}>%</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Next Medicine Card */}
      {nextMedicine ? (
        <TouchableOpacity 
          style={styles.nextMedicineCard}
          onPress={() => router.push('/(app)/(patient)/medicines')}
        >
          <LinearGradient
            colors={['#2ecc71', '#27ae60']}
            style={styles.nextMedicineGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.nextMedicineContent}>
              <View style={styles.nextMedicineIcon}>
                <Icon name="pill" size={30} color="#fff" />
              </View>
              <View style={styles.nextMedicineInfo}>
                <Text style={styles.nextMedicineLabel}>Next Medicine</Text>
                <Text style={styles.nextMedicineName}>{nextMedicine.name}</Text>
                <Text style={styles.nextMedicineTime}>{nextMedicine.time}</Text>
              </View>
              <Icon name="chevron-right" size={30} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={styles.noMedicineCard}>
          <Text style={styles.noMedicineText}>No medicines scheduled for today</Text>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalReadings || 0}</Text>
          <Text style={styles.statLabel}>Total Readings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.avgHeartRate ? Math.round(stats.avgHeartRate) : '--'}
          </Text>
          <Text style={styles.statLabel}>Avg Heart Rate</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.adherenceRate || 0}%</Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
      </View>

      {/* Health Chart */}
      {dashboard?.healthHistory?.length > 0 ? (
        <HealthChart
          data={dashboard.healthHistory.map(r => r.heartRate)}
          labels={dashboard.healthHistory.map(r => 
            new Date(r.recordedAt).toLocaleDateString().slice(0, 5)
          )}
          title="Heart Rate Trend (7 Days)"
        />
      ) : (
        <View style={styles.emptyChart}>
          <Icon name="chart-line" size={40} color="#bdc3c7" />
          <Text style={styles.emptyChartText}>No health data available</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(app)/(patient)/health/add')}
          >
            <Text style={styles.addButtonText}>Add Reading</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Medicines */}
      {todaysMedicines?.length > 0 && (
        <View style={styles.medicinesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Medicines</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(patient)/medicines')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {todaysMedicines.slice(0, 3).map((medicine, index) => (
            <MedicineCard
              key={index}
              medicine={medicine}
              onPress={() => router.push({
                pathname: '/(app)/(patient)/medicines/[id]',
                params: { id: medicine.id }
              })}
            />
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(app)/(patient)/health/add')}
        >
          <LinearGradient
            colors={['#3498db', '#2980b9']}
            style={styles.quickActionGradient}
          >
            <Icon name="heart-pulse" size={30} color="#fff" />
            <Text style={styles.quickActionText}>Add Reading</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(app)/(patient)/medicines')}
        >
          <LinearGradient
            colors={['#2ecc71', '#27ae60']}
            style={styles.quickActionGradient}
          >
            <Icon name="pill" size={30} color="#fff" />
            <Text style={styles.quickActionText}>Medicines</Text>
          </LinearGradient>
        </TouchableOpacity>

        {!user?.deviceId && (
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(app)/(patient)/device/pair')}
          >
            <LinearGradient
              colors={['#f39c12', '#e67e22']}
              style={styles.quickActionGradient}
            >
              <Icon name="bluetooth" size={30} color="#fff" />
              <Text style={styles.quickActionText}>Pair Device</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  role: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 15,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 15,
  },
  deviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deviceText: {
    color: '#fff',
    fontSize: 12,
  },
  healthSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  nextMedicineCard: {
    margin: 20,
    marginTop: -20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextMedicineGradient: {
    padding: 15,
  },
  nextMedicineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextMedicineIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextMedicineInfo: {
    flex: 1,
    marginLeft: 15,
  },
  nextMedicineLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  nextMedicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  nextMedicineTime: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  noMedicineCard: {
    margin: 20,
    marginTop: -20,
    padding: 15,
    backgroundColor: '#f39c12',
    borderRadius: 10,
  },
  noMedicineText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
  emptyChart: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  medicinesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewAllText: {
    color: '#3498db',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingTop: 0,
  },
  quickAction: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 15,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
});