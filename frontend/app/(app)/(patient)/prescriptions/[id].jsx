import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

import { useGetPrescriptionByIdQuery } from '../../../../src/store/api/doctorApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';
import MedicineCard from '../../../../src/components/MedicineCard';

export default function PrescriptionDetails() {
  const { id } = useLocalSearchParams();
  console.log(id)
  const [refreshing, setRefreshing] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);

  const { 
    data: prescription,
    isLoading: prescriptionLoading,
    refetch: refetchPrescription,
    isError,
    error
  } = useGetPrescriptionByIdQuery(id);

  // console.log('Prescription Data:', prescription);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchPrescription();
    setRefreshing(false);
  };

  const handleShare = async () => {
    try {
      if (!prescription) return;
      
      const medicinesList = prescription.medicines?.map(med => 
        `• ${med.name} - ${med.form} - ${med.frequency}`
      ).join('\n') || 'No medicines prescribed';
      
      const prescriptionText = `
Prescription Details
Doctor: Dr. ${prescription.doctorId?.name || 'Unknown'}
Date: ${moment(prescription.startDate).format('MMMM D, YYYY')}
Diagnosis: ${prescription.diagnosis || 'N/A'}
Status: ${getStatusText()}

Medicines:
${medicinesList}
      `;
      
      await Share.share({
        message: prescriptionText,
        title: 'Prescription Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share prescription');
    }
  };

  const getStatusColor = () => {
    if (!prescription) return '#95a5a6';
    if (!prescription.isActive) return '#95a5a6';
    if (moment(prescription.endDate).isBefore(moment())) return '#e74c3c';
    return '#2ecc71';
  };

  const getStatusText = () => {
    if (!prescription) return 'Unknown';
    if (!prescription.isActive) return 'Completed';
    if (moment(prescription.endDate).isBefore(moment())) return 'Expired';
    return 'Active';
  };

  const calculateAdherence = () => {
    if (!prescription?.medicines || prescription.medicines.length === 0) return 0;
    
    let totalTimes = 0;
    let takenTimes = 0;
    
    prescription.medicines.forEach(medicine => {
      if (medicine.times && medicine.times.length > 0) {
        medicine.times.forEach(time => {
          totalTimes++;
          if (time.taken) takenTimes++;
        });
      }
    });
    
    return totalTimes === 0 ? 0 : Math.round((takenTimes / totalTimes) * 100);
  };

  const getTodaysMedicines = () => {
    if (!prescription?.medicines) return [];
    
    const today = moment().format('dddd').toLowerCase();
    return prescription.medicines.filter(medicine => {
      // Check if medicine should be taken today based on frequency
      if (medicine.frequency === 'once-daily') return true;
      if (medicine.frequency === 'twice-daily') return true;
      if (medicine.frequency === 'thrice-daily') return true;
      if (medicine.frequency === 'weekly' && medicine.dayOfWeek === today) return true;
      return false;
    });
  };

  const isLoading = prescriptionLoading;

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  if (isError) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Error Loading Prescription"
        message={error?.data?.message || 'Failed to load prescription details'}
        buttonText="Try Again"
        onPress={onRefresh}
      />
    );
  }

  if (!prescription) {
    return (
      <EmptyState
        icon="file-document-outline"
        title="Prescription Not Found"
        message="The prescription you're looking for doesn't exist"
        buttonText="Go Back"
        onPress={() => router.back()}
      />
    );
  }

  const adherence = calculateAdherence();
  const todaysMedicines = getTodaysMedicines();

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
          <Text style={styles.headerTitle}>Prescription Details</Text>
          <TouchableOpacity onPress={handleShare} style={styles.backButton}>
            <Icon name="share-variant" size={24} color="#fff" />
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
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Icon name="calendar-start" size={20} color="#3498db" />
              <Text style={styles.statusLabel}>Started</Text>
              <Text style={styles.statusValue}>
                {moment(prescription.startDate).format('MMM D, YYYY')}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Icon name="calendar-end" size={20} color="#e74c3c" />
              <Text style={styles.statusLabel}>Ends</Text>
              <Text style={styles.statusValue}>
                {moment(prescription.endDate).format('MMM D, YYYY')}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Icon name="doctor" size={20} color="#2ecc71" />
              <Text style={styles.statusLabel}>Doctor</Text>
              <Text style={styles.statusValue} numberOfLines={1}>
                Dr. {prescription.doctorId?.name || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Doctor Info Card - Only if doctor details are populated */}
        {prescription.doctorId && typeof prescription.doctorId === 'object' && (
          <View style={styles.doctorCard}>
            <View style={styles.doctorHeader}>
              <View style={styles.doctorAvatar}>
                <Icon name="doctor" size={30} color="#3498db" />
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>Dr. {prescription.doctorId.name}</Text>
                <Text style={styles.doctorSpecialty}>
                  {prescription.doctorId.specialty || 'General Physician'}
                </Text>
                {prescription.doctorId.email && (
                  <Text style={styles.doctorContact}>{prescription.doctorId.email}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Diagnosis Card */}
        {prescription.diagnosis && (
          <View style={styles.diagnosisCard}>
            <View style={styles.cardHeader}>
              <Icon name="stethoscope" size={20} color="#3498db" />
              <Text style={styles.cardTitle}>Diagnosis</Text>
            </View>
            <Text style={styles.diagnosisText}>{prescription.diagnosis}</Text>
          </View>
        )}

        {/* Notes Card */}
        {prescription.notes && prescription.notes.trim() !== '' && (
          <View style={styles.notesCard}>
            <View style={styles.cardHeader}>
              <Icon name="note-text" size={20} color="#f39c12" />
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text 
              style={styles.notesText}
              numberOfLines={showFullNotes ? undefined : 3}
              onPress={() => setShowFullNotes(!showFullNotes)}
            >
              {prescription.notes}
            </Text>
            {prescription.notes.length > 150 && (
              <TouchableOpacity onPress={() => setShowFullNotes(!showFullNotes)}>
                <Text style={styles.readMoreText}>
                  {showFullNotes ? 'Read Less' : 'Read More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Adherence Card */}
        {prescription.medicines && prescription.medicines.length > 0 && (
          <View style={styles.adherenceCard}>
            <View style={styles.cardHeader}>
              <Icon name="check-circle" size={20} color="#2ecc71" />
              <Text style={styles.cardTitle}>Adherence Rate</Text>
            </View>
            <View style={styles.adherenceContent}>
              <View style={styles.adherenceCircle}>
                <Text style={styles.adherencePercentage}>{adherence}%</Text>
              </View>
              <View style={styles.adherenceStats}>
                <View style={styles.adherenceStat}>
                  <Text style={styles.adherenceStatLabel}>Total Medicines</Text>
                  <Text style={styles.adherenceStatValue}>{prescription.medicines.length}</Text>
                </View>
                <View style={styles.adherenceStat}>
                  <Text style={styles.adherenceStatLabel}>Total Doses Today</Text>
                  <Text style={[styles.adherenceStatValue, { color: '#3498db' }]}>
                    {todaysMedicines.length}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Medicines List */}
        <View style={styles.medicinesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prescribed Medicines</Text>
            <Text style={styles.medicineCount}>{prescription.medicines?.length || 0} items</Text>
          </View>

          {prescription.medicines && prescription.medicines.length > 0 ? (
            prescription.medicines.map((medicine, index) => (
              <MedicineCard
                key={medicine._id || index}
                medicine={medicine}
                // onPress={() => router.push({
                //   pathname: '/(app)/(patient)/medicines/[id]',
                //   params: { 
                //     id: medicine._id,
                //     prescriptionId: prescription._id
                //   }
                // })}
                showTakeButton={prescription.isActive && moment(prescription.endDate).isAfter(moment())}
              />
            ))
          ) : (
            <View style={styles.noMedicines}>
              <Icon name="pill-off" size={40} color="#bdc3c7" />
              <Text style={styles.noMedicinesText}>No medicines prescribed</Text>
            </View>
          )}
        </View>

        {/* Timeline Card */}
        <View style={styles.timelineCard}>
          <View style={styles.cardHeader}>
            <Icon name="timeline" size={20} color="#9b59b6" />
            <Text style={styles.cardTitle}>Prescription Timeline</Text>
          </View>
          
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#3498db' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Prescribed</Text>
                <Text style={styles.timelineDate}>
                  {moment(prescription.startDate).format('MMMM D, YYYY')}
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { 
                backgroundColor: moment().isBetween(prescription.startDate, prescription.endDate) 
                  ? '#2ecc71' : '#bdc3c7' 
              }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Current Period</Text>
                <Text style={styles.timelineDate}>
                  {moment().format('MMMM D, YYYY')}
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { 
                backgroundColor: moment(prescription.endDate).isBefore(moment()) 
                  ? '#e74c3c' : '#95a5a6' 
              }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Ends</Text>
                <Text style={styles.timelineDate}>
                  {moment(prescription.endDate).format('MMMM D, YYYY')}
                </Text>
                {moment(prescription.endDate).isBefore(moment()) && (
                  <Text style={styles.timelineStatus}>Expired</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {prescription.isActive && moment(prescription.endDate).isAfter(moment()) && todaysMedicines.length > 0 && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push({
                pathname: '/(app)/(patient)/medicines/today',
                params: { prescriptionId: prescription._id }
              })}
            >
              <LinearGradient
                colors={['#2ecc71', '#27ae60']}
                style={styles.actionGradient}
              >
                <Icon name="pill" size={20} color="#fff" />
                <Text style={styles.actionText}>View Today's Medicines ({todaysMedicines.length})</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push({
              pathname: '/(app)/(patient)',
              params: { refresh: true }
            })}
          >
            <Icon name="arrow-left" size={20} color="#3498db" />
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
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
  statusCard: {
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 5,
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  doctorContact: {
    fontSize: 12,
    color: '#3498db',
  },
  diagnosisCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  diagnosisText: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
  },
  notesText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  readMoreText: {
    color: '#3498db',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  adherenceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  adherenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adherenceCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fff4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#2ecc71',
  },
  adherencePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  adherenceStats: {
    flex: 1,
  },
  adherenceStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  adherenceStatLabel: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  adherenceStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  medicinesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  medicineCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  noMedicines: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  noMedicinesText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
  },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeline: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
    marginTop: 3,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  timelineStatus: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
    fontWeight: '500',
  },
  actionButtons: {
    marginBottom: 30,
  },
  actionButton: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3498db',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});