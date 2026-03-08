import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { useAuth } from '../../../src/hooks/useAuth';
import { 
  useGetDashboardQuery,
  useGetTodaysMedicinesQuery,
} from '../../../src/store/api/patientApi';
import { useGetUnreadCountQuery } from '../../../src/store/api/alertApi';
import { useGetDeviceStatusQuery } from '../../../src/store/api/deviceApi';
import Loading from '../../../src/components/Loading';
import EmptyState from '../../../src/components/EmptyState';
import HealthChart from '../../../src/components/HealthChart';

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
    skip: !user?.deviceId
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

  // Get ONLY upcoming medicines (not taken, not skipped, and time is current or future)
  const upcomingMedicines = useMemo(() => {
    if (!todaysMedicines?.length) return [];

    const now = moment();
    const upcoming = [];

    todaysMedicines.forEach(medicine => {
      // Check if medicine has times array
      if (medicine.times && medicine.times.length > 0) {
        const upcomingSlots = medicine.times.filter(slot => {
          const slotTime = moment(slot.time, 'HH:mm');
          return !slot.taken && !slot.skipped && slotTime.isSameOrAfter(now, 'minute');
        });

        if (upcomingSlots.length > 0) {
          upcoming.push({
            ...medicine,
            upcomingSlots: upcomingSlots.sort((a, b) => 
              moment(a.time, 'HH:mm').diff(moment(b.time, 'HH:mm'))
            )
          });
        }
      }
    });

    // Sort medicines by earliest upcoming time
    return upcoming.sort((a, b) => 
      moment(a.upcomingSlots[0].time, 'HH:mm').diff(moment(b.upcomingSlots[0].time, 'HH:mm'))
    );
  }, [todaysMedicines]);

  // Get next medicine (earliest upcoming)
  const nextMedicine = upcomingMedicines[0] || null;

  // Get all upcoming slots flattened for display
  const allUpcomingSlots = useMemo(() => {
    return upcomingMedicines.flatMap(medicine => 
      medicine.upcomingSlots.map(slot => ({
        ...slot,
        medicineId: medicine._id,
        medicineName: medicine.name,
        medicineForm: medicine.form,
        doctorName: medicine.doctorName,
        diagnosis: medicine.diagnosis,
        prescriptionId: medicine.prescriptionId
      }))
    ).sort((a, b) => a.time.localeCompare(b.time));
  }, [upcomingMedicines]);

  const isLoading = dashboardLoading;

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  if (dashboardError) {
    return (
      <EmptyState
        icon="alert-circle"
        title="Error Loading Dashboard"
        message="Please pull down to refresh"
        buttonText="Retry"
        onPress={onRefresh}
      />
    );
  }

  // Handle cases where data might be undefined or in wrong format
  const latestHealth = dashboard?.latestHealth || {};
  const dashboardStats = dashboard?.stats || {};
  const activePrescription = dashboard?.activePrescription || "";
  const healthHistory = dashboard?.healthHistory || [];

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
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Patient'}</Text>
            <Text style={styles.role}>Patient Dashboard</Text>
          </View>
          <View style={styles.headerActions}>
            {/* <TouchableOpacity 
              style={styles.headerIcon}
              onPress={() => router.push('/(app)/(patient)/alerts')}
            >
              <Icon name="bell" size={24} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity> */}
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
              Health Monitor: {deviceStatus?.status === 'online' ? 'Connected' : 'Offline'}
              {deviceStatus?.batteryLevel && ` • Battery: ${deviceStatus.batteryLevel}%`}
            </Text>
          </View>
        )}

        {/* Health Summary Cards */}
        <View style={styles.healthSummary}>
          <View style={styles.summaryCard}>
            <Icon name="heart-pulse" size={20} color="#fff" style={styles.cardIcon} />
            <Text style={styles.summaryLabel}>Heart Rate</Text>
            <Text style={styles.summaryValue}>
              {latestHealth?.heartRate || '--'}
              <Text style={styles.summaryUnit}> bpm</Text>
            </Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Icon name="water" size={20} color="#fff" style={styles.cardIcon} />
            <Text style={styles.summaryLabel}>Blood Pressure</Text>
            <Text style={styles.summaryValue}>
              {latestHealth?.systolic && latestHealth?.diastolic 
                ? `${latestHealth.systolic}/${latestHealth.diastolic}`
                : '--/--'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* SIMPLIFIED - ONLY SHOW UPCOMING MEDICINES */}
      <View style={styles.medicinesSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Icon name="pill" size={24} color="#3498db" />
            <Text style={styles.sectionTitle}>Today's Upcoming Medicines</Text>
          </View>
          {upcomingMedicines.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(app)/(patient)/medicines/today')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {upcomingMedicines.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="pill-off" size={40} color="#bdc3c7" />
            <Text style={styles.emptyText}>No upcoming medicines for today</Text>
          </View>
        ) : (
          <View>
            {/* Next Medicine Card */}
            {nextMedicine && (
              <TouchableOpacity 
                style={styles.nextMedicineCard}
                onPress={() => router.push('/(app)/(patient)/medicines/today')}
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
                      <View style={styles.nextMedicineTimeRow}>
                        <Icon name="clock-outline" size={14} color="#fff" />
                        <Text style={styles.nextMedicineTime}>
                          {moment(nextMedicine.upcomingSlots[0].time, 'HH:mm').format('h:mm A')}
                        </Text>
                      </View>
                      <Text style={styles.nextMedicineForm}>{nextMedicine.form}</Text>
                    </View>
                    <Icon name="chevron-right" size={30} color="#fff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* List of all upcoming medicines */}
            {upcomingMedicines.map(medicine => (
              <TouchableOpacity
                key={medicine._id}
                style={styles.medicineCard}
                onPress={() => router.push({
                  pathname: '/(app)/(patient)/medicines/[id]',
                  params: { id: medicine._id }
                })}
              >
                <View style={styles.medicineCardHeader}>
                  <View>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    <Text style={styles.medicineForm}>{medicine.form}</Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#bdc3c7" />
                </View>

                <View style={styles.doctorInfo}>
                  <Icon name="doctor" size={14} color="#7f8c8d" />
                  <Text style={styles.doctorName}>Dr. {medicine.doctorName}</Text>
                </View>

                {/* Show upcoming times only */}
                <View style={styles.timeSlotsContainer}>
                  {medicine.upcomingSlots.map((slot, index) => (
                    <View key={slot._id || index} style={styles.timeSlot}>
                      <View style={styles.timeDot} />
                      <Text style={styles.timeSlotText}>
                        {moment(slot.time, 'HH:mm').format('h:mm A')}
                      </Text>
                    </View>
                  ))}
                </View>

                {medicine.diagnosis && (
                  <View style={styles.diagnosisContainer}>
                    <Icon name="stethoscope" size={14} color="#7f8c8d" />
                    <Text style={styles.diagnosisText} numberOfLines={1}>
                      {medicine.diagnosis}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Quick Stats - KEEP AS IS */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dashboardStats.totalReadings || 0}</Text>
          <Text style={styles.statLabel}>Total Readings</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {dashboardStats.avgHeartRate ? Math.round(dashboardStats.avgHeartRate[0]?.avg || 0) : '--'}
          </Text>
          <Text style={styles.statLabel}>Avg Heart Rate</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{upcomingMedicines.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
      </View>

      {/* Health Chart - KEEP AS IS */}
      {healthHistory.length > 0 ? (
        <View style={styles.chartsContainer}>
          <HealthChart
            data={healthHistory.map(r => r.heartRate)}
            labels={healthHistory.map(r => 
              new Date(r.recordedAt).toLocaleDateString().slice(0, 5)
            )}
            title="Heart Rate History"
            color="#e74c3c"
          />
          
          {healthHistory.some(r => r.systolic && r.diastolic) && (
            <View style={styles.secondChart}>
              <HealthChart
                data={healthHistory.map(r => r.systolic)}
                labels={healthHistory.map(r => 
                  new Date(r.recordedAt).toLocaleDateString().slice(0, 5)
                )}
                title="Blood Pressure (Systolic)"
                color="#3498db"
              />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Icon name="chart-line" size={50} color="#bdc3c7" />
          <Text style={styles.emptyChartText}>No health data available</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(app)/(patient)/health/add')}
          >
            <Text style={styles.addButtonText}>Add Reading</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Prescription - KEEP AS IS */}
      {activePrescription && typeof activePrescription === 'object' && (
        <View style={styles.prescriptionCard}>
          <View style={styles.prescriptionHeader}>
            <Icon name="file-document" size={24} color="#3498db" />
            <Text style={styles.prescriptionTitle}>Active Prescription</Text>
          </View>
          
          <View style={styles.prescriptionDetails}>
            {activePrescription.diagnosis && (
              <View style={styles.prescriptionRow}>
                <Text style={styles.prescriptionLabel}>Diagnosis:</Text>
                <Text style={styles.prescriptionValue}>{activePrescription.diagnosis}</Text>
              </View>
            )}
            
            {activePrescription.startDate && (
              <View style={styles.prescriptionRow}>
                <Text style={styles.prescriptionLabel}>Prescribed on:</Text>
                <Text style={styles.prescriptionValue}>
                  {moment(activePrescription.startDate).format('MMM D, YYYY')}
                </Text>
              </View>
            )}
            
            {activePrescription.endDate && (
              <View style={styles.prescriptionRow}>
                <Text style={styles.prescriptionLabel}>Valid until:</Text>
                <Text style={styles.prescriptionValue}>
                  {moment(activePrescription.endDate).format('MMM D, YYYY')}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.prescriptionButton}
            onPress={() => router.push({
              pathname: '/(app)/(patient)/prescriptions/[id]',
              params: { id: activePrescription._id }
            })}
          >
            <Text style={styles.prescriptionButtonText}>View Full Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions - KEEP AS IS */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(app)/(patient)/health/add')}
        >
          <LinearGradient
            colors={['#3498db', '#2980b9']}
            style={styles.quickActionGradient}
          >
            <Icon name="heart-plus" size={24} color="#fff" />
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
            <Icon name="pill" size={24} color="#fff" />
            <Text style={styles.quickActionText}>All Prescriptions</Text>
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
              <Icon name="bluetooth" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Pair Device</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  medicinesSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewAllText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 10,
  },
  nextMedicineCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    marginBottom: 2,
  },
  nextMedicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  nextMedicineTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  nextMedicineTime: {
    fontSize: 13,
    color: '#fff',
  },
  nextMedicineForm: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  medicineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medicineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  medicineForm: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  doctorName: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  timeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3498db',
  },
  timeSlotText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  diagnosisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  diagnosisText: {
    flex: 1,
    fontSize: 12,
    color: '#7f8c8d',
  },
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
    marginBottom: 15,
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
    padding: 10,
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
    fontSize: 13,
  },
  healthSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  todayMedsSummary: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -20,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  summaryStatLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'right',
  },
  nextMedicineCard: {
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
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
    marginBottom: 2,
  },
  nextMedicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  nextMedicineTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  nextMedicineTime: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 4,
  },
  nextMedicineDosage: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  noMedicineCard: {
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#27ae60',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  noMedicineText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 5,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 15,
  },
  filterContainer: {
    paddingHorizontal: 15,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  filterChipActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  medicinesList: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  medicineTimelineCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medicineTimelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  medicineTimelineContent: {
    marginBottom: 8,
  },
  medicineTimelineName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  medicineTimelineDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  medicineTimelineDetail: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  medicineInstructions: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  takenAtText: {
    fontSize: 11,
    color: '#2ecc71',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyMedicines: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    marginHorizontal: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  emptyMedicinesText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
  },
  chartsContainer: {
    marginBottom: 20,
  },
  secondChart: {
    marginTop: 15,
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
    fontSize: 16,
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
  prescriptionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  prescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
  },
  prescriptionDetails: {
    marginVertical: 10,
  },
  prescriptionRow: {
    flexDirection: 'row',
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  prescriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
    width: 90,
  },
  prescriptionValue: {
    fontSize: 13,
    color: '#2c3e50',
    flex: 1,
  },
  prescriptionButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  prescriptionButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingTop: 0,
    paddingBottom: 30,
  },
  quickAction: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    textAlign: 'center',
  },
});