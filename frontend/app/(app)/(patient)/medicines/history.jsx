import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { useGetPrescriptionsQuery, useGetMedicineHistoryQuery } from '../../../../src/store/api/patientApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';

const { width } = Dimensions.get('window');

export default function MedicineHistory() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, completed, expired
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));

  const { 
    data: prescriptions,
    isLoading: prescriptionsLoading,
    refetch: refetchPrescriptions
  } = useGetPrescriptionsQuery({ 
    status: 'all',
    page: 1,
    limit: 100
  });

  const {
    data: medicineHistory,
    isLoading: historyLoading,
    refetch: refetchHistory
  } = useGetMedicineHistoryQuery({
    month: selectedMonth,
    page: 1,
    limit: 50
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchPrescriptions(), refetchHistory()]);
    setRefreshing(false);
  };

  const isLoading = prescriptionsLoading || historyLoading;

  // Filter prescriptions based on selected filter
  const getFilteredPrescriptions = () => {
    if (!prescriptions?.data) return [];
    
    switch(selectedFilter) {
      case 'completed':
        return prescriptions.data.filter(p => !p.isActive && moment(p.endDate).isBefore(moment()));
      case 'expired':
        return prescriptions.data.filter(p => p.isActive && moment(p.endDate).isBefore(moment()));
      default:
        return prescriptions.data.filter(p => !p.isActive || moment(p.endDate).isBefore(moment()));
    }
  };

  const filteredPrescriptions = getFilteredPrescriptions();

  // Calculate monthly statistics
  const getMonthlyStats = () => {
    if (!medicineHistory?.data) return { total: 0, taken: 0, missed: 0, adherence: 0 };
    
    const total = medicineHistory.data.length;
    const taken = medicineHistory.data.filter(m => m.taken).length;
    const missed = total - taken;
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;
    
    return { total, taken, missed, adherence };
  };

  const monthlyStats = getMonthlyStats();

  // Get available months for history
  const getAvailableMonths = () => {
    const months = [];
    for (let i = 0; i < 6; i++) {
      months.push(moment().subtract(i, 'months').format('YYYY-MM'));
    }
    return months;
  };

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medicine History</Text>
          <TouchableOpacity style={styles.backButton}>
            <Icon name="dots-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Monthly Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Icon name="calendar-month" size={20} color="#3498db" />
            <Text style={styles.summaryTitle}>Monthly Summary</Text>
          </View>

          {/* Month Selector */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.monthSelector}
          >
            {getAvailableMonths().map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  selectedMonth === month && styles.monthButtonActive
                ]}
                onPress={() => setSelectedMonth(month)}
              >
                <Text style={[
                  styles.monthButtonText,
                  selectedMonth === month && styles.monthButtonTextActive
                ]}>
                  {moment(month).format('MMM YYYY')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Statistics Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyStats.total}</Text>
              <Text style={styles.statLabel}>Total Doses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#2ecc71' }]}>{monthlyStats.taken}</Text>
              <Text style={styles.statLabel}>Taken</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#e74c3c' }]}>{monthlyStats.missed}</Text>
              <Text style={styles.statLabel}>Missed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#3498db' }]}>{monthlyStats.adherence}%</Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </View>
          </View>

          {/* Adherence Bar */}
          <View style={styles.adherenceBar}>
            <View style={[styles.adherenceFill, { width: `${monthlyStats.adherence}%` }]} />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['all', 'completed', 'expired'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Past Prescriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Prescriptions</Text>
          
          {filteredPrescriptions.length > 0 ? (
            filteredPrescriptions.map((prescription, index) => (
              <TouchableOpacity
                key={index}
                style={styles.prescriptionCard}
                onPress={() => router.push({
                  pathname: '/(app)/(patient)/prescriptions/[id]',
                  params: { id: prescription.id }
                })}
              >
                <View style={styles.prescriptionHeader}>
                  <View style={styles.prescriptionIcon}>
                    <Icon 
                      name={prescription.isActive ? 'file-document' : 'file-document-outline'} 
                      size={24} 
                      color={prescription.isActive ? '#3498db' : '#95a5a6'} 
                    />
                  </View>
                  <View style={styles.prescriptionInfo}>
                    <Text style={styles.prescriptionDoctor}>
                      Dr. {prescription.doctorId?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.prescriptionDate}>
                      {moment(prescription.startDate).format('MMM D, YYYY')} - {moment(prescription.endDate).format('MMM D, YYYY')}
                    </Text>
                  </View>
                  <View style={[styles.prescriptionStatus, {
                    backgroundColor: prescription.isActive ? '#f39c12' : 
                      moment(prescription.endDate).isBefore(moment()) ? '#e74c3c' : '#2ecc71'
                  }]}>
                    <Text style={styles.prescriptionStatusText}>
                      {prescription.isActive ? 'Active' : 
                        moment(prescription.endDate).isBefore(moment()) ? 'Expired' : 'Completed'}
                    </Text>
                  </View>
                </View>

                <View style={styles.prescriptionDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="pill" size={16} color="#7f8c8d" />
                    <Text style={styles.detailText}>
                      {prescription.medicines?.length || 0} medicines
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="check-circle" size={16} color="#2ecc71" />
                    <Text style={styles.detailText}>
                      Adherence: {prescription.adherenceRate || 0}%
                    </Text>
                  </View>
                </View>

                {prescription.diagnosis && (
                  <View style={styles.diagnosisContainer}>
                    <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
                    <Text style={styles.diagnosisText}>{prescription.diagnosis}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <EmptyState
              icon="file-document-outline"
              title="No Past Prescriptions"
              message="You don't have any past prescriptions to show"
              containerStyle={styles.emptyState}
            />
          )}
        </View>

        {/* Recent History Timeline */}
        {medicineHistory?.data?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent History</Text>
            {medicineHistory.data.slice(0, 10).map((record, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { 
                    backgroundColor: record.taken ? '#2ecc71' : '#e74c3c'
                  }]} />
                  {index < medicineHistory.data.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineMedicine}>{record.medicineName}</Text>
                    <Text style={[styles.timelineStatus, {
                      color: record.taken ? '#2ecc71' : '#e74c3c'
                    }]}>
                      {record.taken ? 'Taken' : 'Missed'}
                    </Text>
                  </View>
                  <Text style={styles.timelineTime}>
                    {moment(record.scheduledTime).format('MMM D, YYYY • h:mm A')}
                  </Text>
                  {record.dosage && (
                    <Text style={styles.timelineDosage}>Dosage: {record.dosage}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
  },
  monthSelector: {
    flexGrow: 0,
    marginBottom: 20,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  monthButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  monthButtonText: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '500',
  },
  monthButtonTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 4,
  },
  adherenceBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  adherenceFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterButtonText: {
    textAlign: 'center',
    color: '#2c3e50',
    fontSize: 13,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  prescriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prescriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionDoctor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  prescriptionDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  prescriptionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prescriptionStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  prescriptionDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#2c3e50',
  },
  diagnosisContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  diagnosisLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  diagnosisText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timelineLeft: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    position: 'absolute',
    top: 12,
    bottom: -15,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  timelineMedicine: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  timelineStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  timelineTime: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  timelineDosage: {
    fontSize: 12,
    color: '#95a5a6',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
  },
});