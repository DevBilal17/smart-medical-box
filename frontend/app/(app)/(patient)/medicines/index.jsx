import React, { useState } from 'react';
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
import { useGetPrescriptionsQuery } from '../../../../src/store/api/patientApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';

export default function Medicines() {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: prescriptions,
    isLoading,
    refetch: refetchPrescriptions
  } = useGetPrescriptionsQuery({ 
    page: 1,
    limit: 50
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchPrescriptions();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  // Separate active and completed prescriptions
  const activePrescriptions = prescriptions?.data?.filter(p => p.isActive) || [];
  const completedPrescriptions = prescriptions?.data?.filter(p => !p.isActive) || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>My Medicines</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Today's Medicines Quick Link */}
      {/* <TouchableOpacity 
        style={styles.todayLink}
        onPress={() => router.push('/(app)/(patient)/medicines/today')}
      >
        <LinearGradient
          colors={['#2ecc71', '#27ae60']}
          style={styles.todayLinkGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Icon name="pill" size={24} color="#fff" />
          <View style={styles.todayLinkText}>
            <Text style={styles.todayLinkTitle}>Today's Schedule</Text>
            <Text style={styles.todayLinkSubtitle}>View your medicines for today</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity> */}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Active Prescriptions */}
        {activePrescriptions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="file-document" size={20} color="#2ecc71" />
              <Text style={styles.sectionTitle}>Active Prescriptions</Text>
              <Text style={styles.sectionCount}>{activePrescriptions.length}</Text>
            </View>
            
            {activePrescriptions.map((prescription) => (
              <TouchableOpacity
                key={prescription._id}
                style={styles.prescriptionCard}
                onPress={() => router.push({
                  pathname: '/(app)/(patient)/prescriptions/[id]',
                  params: { id: prescription._id }
                })}
              >
                <View style={styles.prescriptionHeader}>
                  <View style={styles.prescriptionTitleContainer}>
                    <Text style={styles.prescriptionDoctor}>
                      Dr. {prescription.doctorId?.name || 'Unknown'}
                    </Text>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={20} color="#bdc3c7" />
                </View>

                <Text style={styles.prescriptionDiagnosis}>
                  {prescription.diagnosis}
                </Text>

                <View style={styles.prescriptionDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="calendar" size={14} color="#7f8c8d" />
                    <Text style={styles.detailText}>
                      {moment(prescription.startDate).format('MMM D, YYYY')} - {moment(prescription.endDate).format('MMM D, YYYY')}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Icon name="pill" size={14} color="#7f8c8d" />
                    <Text style={styles.detailText}>
                      {prescription.medicines?.length || 0} medicines
                    </Text>
                  </View>
                </View>

                {prescription.notes && (
                  <Text style={styles.prescriptionNotes} numberOfLines={2}>
                    {prescription.notes}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Completed Prescriptions */}
        {completedPrescriptions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="file-document" size={20} color="#95a5a6" />
              <Text style={styles.sectionTitle}>Completed Prescriptions</Text>
              <Text style={styles.sectionCount}>{completedPrescriptions.length}</Text>
            </View>
            
            {completedPrescriptions.map((prescription) => (
              <TouchableOpacity
                key={prescription._id}
                style={[styles.prescriptionCard, styles.completedCard]}
                onPress={() => router.push({
                  pathname: '/(app)/(patient)/prescriptions/[id]',
                  params: { id: prescription._id }
                })}
              >
                <View style={styles.prescriptionHeader}>
                  <View style={styles.prescriptionTitleContainer}>
                    <Text style={[styles.prescriptionDoctor, styles.completedText]}>
                      Dr. {prescription.doctorId?.name || 'Unknown'}
                    </Text>
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>Completed</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={20} color="#bdc3c7" />
                </View>

                <Text style={[styles.prescriptionDiagnosis, styles.completedText]}>
                  {prescription.diagnosis}
                </Text>

                <View style={styles.prescriptionDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="calendar" size={14} color="#95a5a6" />
                    <Text style={[styles.detailText, styles.completedText]}>
                      {moment(prescription.startDate).format('MMM D, YYYY')} - {moment(prescription.endDate).format('MMM D, YYYY')}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Icon name="pill" size={14} color="#95a5a6" />
                    <Text style={[styles.detailText, styles.completedText]}>
                      {prescription.medicines?.length || 0} medicines
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(!prescriptions?.data || prescriptions.data.length === 0) && (
          <EmptyState
            icon="file-document-outline"
            title="No Prescriptions"
            message="You don't have any prescriptions yet"
          />
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
  todayLink: {
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  todayLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  todayLinkText: {
    flex: 1,
    marginLeft: 12,
  },
  todayLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  todayLinkSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: '#7f8c8d',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  prescriptionCard: {
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
  completedCard: {
    opacity: 0.8,
    backgroundColor: '#f8f9fa',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prescriptionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prescriptionDoctor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  activeBadge: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  prescriptionDiagnosis: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 10,
  },
  prescriptionDetails: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  prescriptionNotes: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  completedText: {
    color: '#95a5a6',
  },
});