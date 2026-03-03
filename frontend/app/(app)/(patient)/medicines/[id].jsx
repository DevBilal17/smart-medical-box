import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { useGetPrescriptionByIdQuery, useMarkMedicineTakenMutation } from '../../../../src/store/api/patientApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';
import { formatTime } from '../../../../src/utils/helpers';

export default function MedicineDetails() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const { data: prescription, isLoading, error } = useGetPrescriptionByIdQuery(id);
  const [markMedicineTaken] = useMarkMedicineTakenMutation();

  // Find the specific medicine in the prescription
  const medicine = prescription?.medicines?.find(m => m.id === id);

  if (isLoading) {
    return <Loading />;
  }

  if (error || !medicine) {
    return (
      <EmptyState
        icon="alert-circle"
        title="Medicine not found"
        message="The medicine you're looking for doesn't exist"
        buttonText="Go Back"
        onPress={() => router.back()}
      />
    );
  }

  const handleTakeMedicine = async () => {
    Alert.alert(
      'Take Medicine',
      `Have you taken ${medicine.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Taken',
          onPress: async () => {
            setLoading(true);
            try {
              await markMedicineTaken({
                prescriptionId: prescription.id,
                medicineId: medicine.id,
                timeIndex: medicine.timeIndex || 0
              }).unwrap();
              Alert.alert('Success', 'Medicine marked as taken');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark medicine as taken');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSnooze = () => {
    Alert.alert(
      'Snooze Reminder',
      'Remind me in:',
      [
        { text: '10 minutes', onPress: () => Alert.alert('Snoozed', 'We\'ll remind you in 10 minutes') },
        { text: '30 minutes', onPress: () => Alert.alert('Snoozed', 'We\'ll remind you in 30 minutes') },
        { text: '1 hour', onPress: () => Alert.alert('Snoozed', 'We\'ll remind you in 1 hour') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getStatusColor = () => {
    if (medicine.taken) return '#2ecc71';
    const now = moment();
    const medicineTime = moment(medicine.time, 'HH:mm');
    if (now.isAfter(medicineTime)) return '#e74c3c';
    if (now.isBetween(moment(medicineTime).subtract(30, 'minutes'), medicineTime)) return '#f39c12';
    return '#3498db';
  };

  const getStatusText = () => {
    if (medicine.taken) return 'Taken';
    const now = moment();
    const medicineTime = moment(medicine.time, 'HH:mm');
    if (now.isAfter(medicineTime)) return 'Missed';
    if (now.isBetween(moment(medicineTime).subtract(30, 'minutes'), medicineTime)) return 'Due Soon';
    return 'Scheduled';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Icon name="pill" size={50} color="#fff" />
          </View>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Schedule Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={20} color="#3498db" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatTime(medicine.time)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="repeat" size={20} color="#3498db" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Frequency</Text>
              <Text style={styles.infoValue}>{medicine.frequency || 'Once daily'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="package-variant" size={20} color="#3498db" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Compartment</Text>
              <Text style={styles.infoValue}>Compartment {medicine.compartmentNumber || 1}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="calendar" size={20} color="#3498db" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Prescription Period</Text>
              <Text style={styles.infoValue}>
                {moment(prescription?.startDate).format('MMM D, YYYY')} - {moment(prescription?.endDate).format('MMM D, YYYY')}
              </Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        {medicine.instructions && (
          <View style={styles.instructionsCard}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.instructionsText}>{medicine.instructions}</Text>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          {medicine.form && (
            <View style={styles.infoRow}>
              <Icon name="pill" size={20} color="#3498db" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Form</Text>
                <Text style={styles.infoValue}>{medicine.form}</Text>
              </View>
            </View>
          )}

          {medicine.strength && (
            <View style={styles.infoRow}>
              <Icon name="weight" size={20} color="#3498db" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Strength</Text>
                <Text style={styles.infoValue}>{medicine.strength}</Text>
              </View>
            </View>
          )}

          {medicine.quantity && (
            <View style={styles.infoRow}>
              <Icon name="counter" size={20} color="#3498db" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Quantity</Text>
                <Text style={styles.infoValue}>{medicine.quantity}</Text>
              </View>
            </View>
          )}

          {medicine.refills > 0 && (
            <View style={styles.infoRow}>
              <Icon name="refresh" size={20} color="#3498db" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Refills Remaining</Text>
                <Text style={styles.infoValue}>{medicine.refills}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Doctor Info */}
        {prescription?.doctorId && (
          <View style={styles.doctorCard}>
            <Icon name="doctor" size={30} color="#3498db" />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorLabel}>Prescribed by</Text>
              <Text style={styles.doctorName}>Dr. {prescription.doctorId.name}</Text>
              {prescription.doctorId.specialization && (
                <Text style={styles.doctorSpecialization}>{prescription.doctorId.specialization}</Text>
              )}
            </View>
          </View>
        )}

        {/* Warnings */}
        {medicine.warnings && medicine.warnings.length > 0 && (
          <View style={styles.warningsCard}>
            <Text style={styles.warningsTitle}>⚠️ Warnings</Text>
            {medicine.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>• {warning}</Text>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!medicine.taken && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.takeButton]} 
              onPress={handleTakeMedicine}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="check" size={24} color="#fff" />
                  <Text style={styles.takeButtonText}>Mark as Taken</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.snoozeButton]} 
            onPress={handleSnooze}
          >
            <Icon name="clock-outline" size={24} color="#3498db" />
            <Text style={styles.snoozeButtonText}>Snooze</Text>
          </TouchableOpacity>
        </View>

        {/* Adherence History */}
        {medicine.times && medicine.times.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Recent History</Text>
            {medicine.times.slice(-7).map((time, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {moment(time.date).format('MMM D')}
                </Text>
                <View style={[styles.historyStatus, { 
                  backgroundColor: time.taken ? '#2ecc71' : '#e74c3c' 
                }]}>
                  <Text style={styles.historyStatusText}>
                    {time.taken ? 'Taken' : 'Missed'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  medicineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  medicineDosage: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  instructionsCard: {
    backgroundColor: '#3498db10',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
  },
  instructionsText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorInfo: {
    marginLeft: 15,
    flex: 1,
  },
  doctorLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 2,
  },
  doctorSpecialization: {
    fontSize: 12,
    color: '#3498db',
    marginTop: 2,
  },
  warningsCard: {
    backgroundColor: '#e74c3c10',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 12,
    color: '#2c3e50',
    marginBottom: 5,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  takeButton: {
    backgroundColor: '#2ecc71',
  },
  takeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  snoozeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  snoozeButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  historyDate: {
    fontSize: 12,
    color: '#2c3e50',
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});