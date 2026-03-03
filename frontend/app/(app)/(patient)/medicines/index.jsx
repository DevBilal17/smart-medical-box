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
import { useGetPrescriptionsQuery, useGetTodaysMedicinesQuery } from '../../../../src/store/api/patientApi';
import { useMarkMedicineTakenMutation } from '../../../../src/store/api/patientApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';
import MedicineCard from '../../../../src/components/MedicineCard';

export default function Medicines() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('today'); // today, all, history

  const { 
    data: todaysMedicines = [],
    isLoading: todaysLoading,
    refetch: refetchToday
  } = useGetTodaysMedicinesQuery();

  const {
    data: prescriptions,
    isLoading: prescriptionsLoading,
    refetch: refetchPrescriptions
  } = useGetPrescriptionsQuery({ 
    status: 'active',
    page: 1,
    limit: 50
  });

  const [markMedicineTaken] = useMarkMedicineTakenMutation();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchToday(), refetchPrescriptions()]);
    setRefreshing(false);
  };

  const handleTakeMedicine = async (medicine) => {
    Alert.alert(
      'Take Medicine',
      `Have you taken ${medicine.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Taken',
          onPress: async () => {
            try {
              await markMedicineTaken({
                prescriptionId: medicine.prescriptionId,
                medicineId: medicine.id,
                timeIndex: medicine.timeIndex
              }).unwrap();
              Alert.alert('Success', 'Medicine marked as taken');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark medicine as taken');
            }
          }
        }
      ]
    );
  };

  const getMedicineStatus = (medicine) => {
    const now = moment();
    const medicineTime = moment(medicine.time, 'HH:mm');
    const todayDateTime = moment().set({
      hour: medicineTime.hour(),
      minute: medicineTime.minute()
    });

    if (medicine.taken) {
      return { status: 'taken', color: '#2ecc71', icon: 'check-circle' };
    } else if (now.isAfter(todayDateTime)) {
      return { status: 'missed', color: '#e74c3c', icon: 'close-circle' };
    } else if (now.isBetween(moment(todayDateTime).subtract(30, 'minutes'), todayDateTime)) {
      return { status: 'upcoming', color: '#f39c12', icon: 'clock-outline' };
    } else {
      return { status: 'scheduled', color: '#3498db', icon: 'calendar-clock' };
    }
  };

  const isLoading = todaysLoading || prescriptionsLoading;

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  // Categorize today's medicines
  const upcoming = todaysMedicines?.filter(m => 
    !m.taken && moment(m.time, 'HH:mm').isAfter(moment())
  ) || [];
  
  const taken = todaysMedicines?.filter(m => m.taken) || [];
  const missed = todaysMedicines?.filter(m => 
    !m.taken && moment(m.time, 'HH:mm').isBefore(moment())
  ) || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>My Medicines</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/(patient)/medicines/history')}>
          <Icon name="history" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.summaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.summaryContent}>
          <View>
            <Text style={styles.summaryLabel}>Today's Schedule</Text>
            <Text style={styles.summaryValue}>{todaysMedicines?.length || 0} Medicines</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <View style={[styles.statDot, { backgroundColor: '#2ecc71' }]} />
                <Text style={styles.statText}>Taken: {taken.length}</Text>
              </View>
              <View style={styles.summaryStat}>
                <View style={[styles.statDot, { backgroundColor: '#f39c12' }]} />
                <Text style={styles.statText}>Pending: {upcoming.length}</Text>
              </View>
              {missed.length > 0 && (
                <View style={styles.summaryStat}>
                  <View style={[styles.statDot, { backgroundColor: '#e74c3c' }]} />
                  <Text style={styles.statText}>Missed: {missed.length}</Text>
                </View>
              )}
            </View>
          </View>
          <Icon name="pill" size={50} color="#fff" style={styles.summaryIcon} />
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'today' && styles.tabActive]}
          onPress={() => setSelectedTab('today')}
        >
          <Text style={[styles.tabText, selectedTab === 'today' && styles.tabTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All Medicines
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'today' ? (
          <>
            {/* Upcoming Medicines */}
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                {upcoming.map((medicine, index) => (
                  <MedicineCard
                    key={index}
                    medicine={{
                      ...medicine,
                      status: getMedicineStatus(medicine).status
                    }}
                    onPress={() => router.push({
                      pathname: '/(app)/(patient)/medicines/[id]',
                      params: { id: medicine.id }
                    })}
                    onTake={() => handleTakeMedicine(medicine)}
                  />
                ))}
              </View>
            )}

            {/* Taken Medicines */}
            {taken.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Taken</Text>
                {taken.map((medicine, index) => (
                  <MedicineCard
                    key={index}
                    medicine={{
                      ...medicine,
                      status: 'taken'
                    }}
                    onPress={() => router.push({
                      pathname: '/(app)/(patient)/medicines/[id]',
                      params: { id: medicine.id }
                    })}
                  />
                ))}
              </View>
            )}

            {/* Missed Medicines */}
            {missed.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: '#e74c3c' }]}>Missed</Text>
                {missed.map((medicine, index) => (
                  <MedicineCard
                    key={index}
                    medicine={{
                      ...medicine,
                      status: 'missed'
                    }}
                    onPress={() => router.push({
                      pathname: '/(app)/(patient)/medicines/[id]',
                      params: { id: medicine.id }
                    })}
                  />
                ))}
              </View>
            )}

            {todaysMedicines?.length === 0 && (
              <EmptyState
                icon="pill-off"
                title="No Medicines Today"
                message="You don't have any medicines scheduled for today"
              />
            )}
          </>
        ) : (
          <>
            {/* Active Prescriptions */}
            {prescriptions?.data?.map((prescription, index) => (
              <TouchableOpacity
                key={index}
                style={styles.prescriptionCard}
                onPress={() => router.push({
                  pathname: '/(app)/(patient)/prescriptions/[id]',
                  params: { id: prescription.id }
                })}
              >
                <View style={styles.prescriptionHeader}>
                  <Icon name="file-document" size={20} color="#3498db" />
                  <Text style={styles.prescriptionDate}>
                    {moment(prescription.startDate).format('MMM D, YYYY')} - {moment(prescription.endDate).format('MMM D, YYYY')}
                  </Text>
                </View>
                <Text style={styles.prescriptionDoctor}>
                  Dr. {prescription.doctorId?.name}
                </Text>
                <Text style={styles.prescriptionCount}>
                  {prescription.medicines?.length || 0} medicines
                </Text>
                <View style={styles.prescriptionFooter}>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: prescription.isActive ? '#2ecc71' : '#95a5a6' 
                  }]}>
                    <Text style={styles.statusBadgeText}>
                      {prescription.isActive ? 'Active' : 'Completed'}
                    </Text>
                  </View>
                  <Text style={styles.adherenceText}>
                    Adherence: {prescription.adherenceRate || 0}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {(!prescriptions?.data || prescriptions.data.length === 0) && (
              <EmptyState
                icon="file-document-outline"
                title="No Prescriptions"
                message="You don't have any active prescriptions"
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button for adding prescription (only for doctors) */}
      {/* This would be conditionally rendered based on user role */}
    </View>
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
  summaryCard: {
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  summaryContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  summaryStats: {
    marginTop: 10,
  },
  summaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  summaryIcon: {
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  tabText: {
    textAlign: 'center',
    color: '#2c3e50',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  prescriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prescriptionDate: {
    marginLeft: 10,
    fontSize: 12,
    color: '#7f8c8d',
  },
  prescriptionDoctor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 5,
  },
  prescriptionCount: {
    fontSize: 12,
    color: '#3498db',
    marginBottom: 10,
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  adherenceText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});