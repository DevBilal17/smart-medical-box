import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { 
  useGetPrescriptionByIdQuery,

} from '../../../../src/store/api/doctorApi';
import {  useMarkMedicineTakenMutation,
  useMarkMedicineSkippedMutation } from "../../../../src/store/api/patientApi"
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';

export default function TodaysMedicines() {
  const { prescriptionId } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTime, setSelectedTime] = useState('all');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { 
    data: prescription,
    isLoading,
    refetch
  } = useGetPrescriptionByIdQuery(prescriptionId);
  // const [markMedicineTaken, { isLoading: isTaking }] = useMarkMedicineTakenMutation();
  // const [markMedicineSkipped, { isLoading: isSkipping }] = useMarkMedicineSkippedMutation();
  // Process medicines for today with time slots
  const todaysMedicines = useMemo(() => {
    if (!prescription?.medicines) return [];

    const medicines = [];
    
    prescription.medicines.forEach(medicine => {
      if (medicine.times && medicine.times.length > 0) {
        medicine.times.forEach((timeSlot, index) => {
          medicines.push({
            ...medicine,
            timeSlot: timeSlot.time,
            timeId: timeSlot._id,
            taken: timeSlot.taken || false,
            takenAt: timeSlot.takenAt,
            skipped: timeSlot.skipped || false,
            skippedAt: timeSlot.skippedAt,
            skippedReason: timeSlot.skippedReason,
            doseIndex: index,
            totalDoses: medicine.times.length
          });
        });
      }
    });

    // Sort by time
    return medicines.sort((a, b) => {
      return a.timeSlot.localeCompare(b.timeSlot);
    });
  }, [prescription]);

  // Filter by time
  const filteredMedicines = useMemo(() => {
    if (selectedTime === 'all') return todaysMedicines;
    return todaysMedicines.filter(med => med.timeSlot === selectedTime);
  }, [todaysMedicines, selectedTime]);
   console.log(filteredMedicines)
  // Get unique times for filter
  const uniqueTimes = useMemo(() => {
    const times = [...new Set(todaysMedicines.map(med => med.timeSlot))];
    return times.sort();
  }, [todaysMedicines]);

  // Statistics
  const stats = useMemo(() => {
    const total = todaysMedicines.length;
    const taken = todaysMedicines.filter(med => med.taken).length;
    const skipped = todaysMedicines.filter(med => med.skipped).length;
    const pending = total - taken - skipped;
    const progress = total === 0 ? 0 : Math.round(((taken + skipped) / total) * 100);

    return { total, taken, skipped, pending, progress };
  }, [todaysMedicines]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

//   const handleMedicineAction = (medicine) => {
//     setSelectedMedicine(medicine);
//     setModalVisible(true);
//   };

//  const handleMarkAsTaken = async () => {
//   if (!selectedMedicine) return;
  
//   try {
//     // Call the API with prescriptionId, medicineId, and timeId
//     const response = await markMedicineTaken({
//       prescriptionId: prescriptionId,           // From useLocalSearchParams
//       medicineId: selectedMedicine._id,          // The medicine ID
//       timeId: selectedMedicine.timeId,           // The time slot ID
//       takenAt: new Date().toISOString()          // When it was taken
//     }).unwrap();
    
//     console.log('Mark as taken response:', response);
    
//     Alert.alert(
//       'Success',
//       `${selectedMedicine.name} marked as taken at ${selectedMedicine.timeSlot}`,
//       [{ text: 'OK', onPress: () => setModalVisible(false) }]
//     );
    
//     // Refresh data
//     refetch();
//   } catch (error) {
//     console.error('Error marking as taken:', error);
//     Alert.alert(
//       'Error', 
//       error?.data?.message || 'Failed to update medicine status'
//     );
//   }
// };
// const handleMarkAsNotTaken = async (reason) => {
//   if (!selectedMedicine) return;
  
//   try {
//     // Call the API with prescriptionId, medicineId, timeId, and reason
//     const response = await markMedicineSkipped({
//       prescriptionId: prescriptionId,           // From useLocalSearchParams
//       medicineId: selectedMedicine._id,          // The medicine ID
//       timeId: selectedMedicine.timeId,           // The time slot ID
//       reason: reason                              // Why it was skipped
//     }).unwrap();
    
//     console.log('Mark as skipped response:', response);
    
//     Alert.alert(
//       'Recorded',
//       `${selectedMedicine.name} marked as not taken`,
//       [{ text: 'OK', onPress: () => setModalVisible(false) }]
//     );
    
//     // Refresh data
//     refetch();
//   } catch (error) {
//     console.error('Error marking as skipped:', error);
//     Alert.alert(
//       'Error', 
//       error?.data?.message || 'Failed to update medicine status'
//     );
//   }
// };

  const handleSnooze = (medicine) => {
    setModalVisible(false);
    Alert.alert(
      'Snooze Reminder',
      'Remind me in:',
      [
        { text: '15 minutes', onPress: () => console.log('Snooze 15min') },
        { text: '30 minutes', onPress: () => console.log('Snooze 30min') },
        { text: '1 hour', onPress: () => console.log('Snooze 1hr') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getTimeStatus = (time, taken, skipped) => {
    if (taken) return 'taken';
    if (skipped) return 'skipped';
    
    const now = moment();
    const medicineTime = moment(time, 'HH:mm');
    
    if (now.isAfter(medicineTime)) {
      return 'past';
    } else if (now.isBetween(medicineTime.clone().subtract(30, 'minutes'), medicineTime)) {
      return 'upcoming';
    } else {
      return 'future';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'taken': return '#2ecc71';
      case 'skipped': return '#e74c3c';
      case 'past': return '#f39c12';
      case 'upcoming': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'taken': return 'check-circle';
      case 'skipped': return 'close-circle';
      case 'past': return 'alert-circle';
      case 'upcoming': return 'clock-outline';
      default: return 'clock-outline';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'taken': return 'Taken';
      case 'skipped': return 'Skipped';
      case 'past': return 'Missed';
      case 'upcoming': return 'Upcoming';
      default: return 'Scheduled';
    }
  };

  // const renderMedicineItem = ({ item }) => {
  //   const status = getTimeStatus(item.timeSlot, item.taken, item.skipped);
  //   const statusColor = getStatusColor(status);
  //   const statusIcon = getStatusIcon(status);
  //   const statusText = getStatusText(status);

  //   return (
  //     <View style={[styles.medicineCard, 
  //       item.taken && styles.takenCard,
  //       item.skipped && styles.skippedCard
  //     ]}>
  //       <View style={styles.medicineHeader}>
  //         <View style={styles.medicineInfo}>
  //           <Text style={styles.medicineName}>{item.name}</Text>
  //           <Text style={styles.medicineDosage}>{item.dosage || '500mg'}</Text>
  //         </View>
  //         <View style={[styles.timeBadge, { backgroundColor: statusColor + '20' }]}>
  //           <Icon name="clock-outline" size={14} color={statusColor} />
  //           <Text style={[styles.timeText, { color: statusColor }]}>
  //             {item.timeSlot}
  //           </Text>
  //         </View>
  //       </View>

  //       <View style={styles.medicineDetails}>
  //         <Text style={styles.medicineForm}>{item.form || 'Tablet'}</Text>
  //         <Text style={styles.medicineFrequency}>
  //           Dose {item.doseIndex + 1} of {item.totalDoses}
  //         </Text>
  //       </View>

  //       {/* <View style={styles.statusContainer}>
  //         <Icon name={statusIcon} size={16} color={statusColor} />
  //         <Text style={[styles.statusText, { color: statusColor }]}>
  //           {statusText}
  //         </Text>
  //         {item.taken && item.takenAt && (
  //           <Text style={styles.takenTime}>
  //             at {moment(item.takenAt).format('h:mm A')}
  //           </Text>
  //         )}
  //         {item.skipped && item.skippedReason && (
  //           <Text style={styles.skippedReason}>
  //             Reason: {item.skippedReason}
  //           </Text>
  //         )}
  //       </View> */}

  //       {/* {item.instructions && (
  //         <Text style={styles.instructions}>{item.instructions}</Text>
  //       )}

  //       {(status === 'past' || status === 'upcoming' || status === 'future') && !item.taken && !item.skipped && (
  //         <View style={styles.actionButtons}>
  //           <TouchableOpacity 
  //             style={[styles.actionButton, styles.takeButton]}
  //             onPress={() => handleMedicineAction(item)}
  //           >
  //             <Icon name="check" size={20} color="#fff" />
  //             <Text style={styles.takeButtonText}>Update Status</Text>
  //           </TouchableOpacity>
  //         </View>
  //       )} */}
  //     </View>
  //   );
  // };


const renderMedicineItem = ({ item }) => {
  // Convert time to AM/PM format
  const formatTimeToAMPM = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const formattedTime = formatTimeToAMPM(item.timeSlot);

  return (
    <View style={styles.medicineCard}>
      <View style={styles.medicineRow}>
        <View style={styles.medicineInfo}>
          <Text style={styles.medicineName}>{item.name}</Text>
          <Text style={styles.medicineDosage}>{item.dosage || '500mg'} • {item.form || 'Tablet'}</Text>
          <Text style={styles.medicineDosage}>{item.frequency}</Text>
        </View>
        <View style={styles.timeContainer}>
          <Icon name="clock-outline" size={16} color="#7f8c8d" />
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>
      </View>
    </View>
  );
};

  const renderActionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Medicine Status</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          {selectedMedicine && (
            <>
              <View style={styles.modalMedicineInfo}>
                <Text style={styles.modalMedicineName}>{selectedMedicine.name}</Text>
                <Text style={styles.modalMedicineTime}>
                  Scheduled for {selectedMedicine.timeSlot}
                </Text>
                <Text style={styles.modalMedicineDosage}>
                  {selectedMedicine.dosage} • {selectedMedicine.form}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.takenAction]}
                  onPress={handleMarkAsTaken}
                >
                  <Icon name="check-circle" size={24} color="#fff" />
                  <Text style={styles.modalActionText}>Taken</Text>
                  <Text style={styles.modalActionSubtext}>I took this medicine</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.notTakenAction]}
                  onPress={() => {
                    setModalVisible(false);
                    Alert.alert(
                      'Reason for not taking',
                      'Please select a reason:',
                      [
                        { text: 'Forgot', onPress: () => handleMarkAsNotTaken('Forgot') },
                        { text: 'Side effects', onPress: () => handleMarkAsNotTaken('Side effects') },
                        { text: 'Felt better', onPress: () => handleMarkAsNotTaken('Felt better') },
                        { text: 'Other', onPress: () => {
                          Alert.prompt(
                            'Other reason',
                            'Please specify:',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Submit', onPress: (reason) => handleMarkAsNotTaken(reason) }
                            ]
                          );
                        }},
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Icon name="close-circle" size={24} color="#fff" />
                  <Text style={styles.modalActionText}>Not Taken</Text>
                  <Text style={styles.modalActionSubtext}>I missed/skipped this dose</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.snoozeAction]}
                  onPress={() => handleSnooze(selectedMedicine)}
                >
                  <Icon name="clock-outline" size={24} color="#fff" />
                  <Text style={styles.modalActionText}>Snooze</Text>
                  <Text style={styles.modalActionSubtext}>Remind me later</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  if (!prescription) {
    return (
      <EmptyState
        icon="pill-off"
        title="No Prescription Found"
        message="Unable to load prescription details"
        buttonText="Go Back"
        onPress={() => router.back()}
      />
    );
  }

  if (todaysMedicines.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#3498db', '#2980b9']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Today's Medicines</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <EmptyState
          icon="pill-off"
          title="No Medicines Today"
          message="You don't have any medicines scheduled for today"
          buttonText="Back to Prescription"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Medicines</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.backButton}>
            <Icon name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        {/* <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressPercentage}>{stats.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${stats.progress}%` }
              ]} 
            />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#2ecc71' }]}>{stats.taken}</Text>
              <Text style={styles.statLabel}>Taken</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#e74c3c' }]}>{stats.skipped}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#f39c12' }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View> */}
      </LinearGradient>

      {/* Time Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedTime === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedTime('all')}
        >
          <Text style={[styles.filterText, selectedTime === 'all' && styles.filterTextActive]}>
            All Times
          </Text>
        </TouchableOpacity>
        {uniqueTimes.map(time => (
          <TouchableOpacity
            key={time}
            style={[styles.filterChip, selectedTime === time && styles.filterChipActive]}
            onPress={() => setSelectedTime(time)}
          >
            <Text style={[styles.filterText, selectedTime === time && styles.filterTextActive]}>
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Medicines List */}
      <FlatList
        data={filteredMedicines}
        renderItem={renderMedicineItem}
        keyExtractor={(item, index) => `${item._id}-${item.timeId}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              {filteredMedicines.length} {filteredMedicines.length === 1 ? 'dose' : 'doses'} scheduled
            </Text>
          </View>
        }
      />

      {/* Action Modal */}
      {renderActionModal()}
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
    marginBottom: 20,
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
  placeholder: {
    width: 40,
  },
  progressContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
  },
  filterContainer: {
    backgroundColor: '#fff',
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3498db',
  },
  filterText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  listContent: {
    padding: 15,
  },
  listHeader: {
    marginBottom: 15,
  },
  listHeaderText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  medicineCard: {
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
  takenCard: {
    backgroundColor: '#f0fff4',
  },
  skippedCard: {
    backgroundColor: '#fff5f5',
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  medicineDosage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  medicineDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  medicineForm: {
    fontSize: 13,
    color: '#95a5a6',
  },
  medicineFrequency: {
    fontSize: 13,
    color: '#95a5a6',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  takenTime: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  skippedReason: {
    fontSize: 12,
    color: '#e74c3c',
    fontStyle: 'italic',
  },
  instructions: {
    fontSize: 13,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  actionButtons: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  takeButton: {
    backgroundColor: '#2ecc71',
  },
  takeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalMedicineInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modalMedicineName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  modalMedicineTime: {
    fontSize: 16,
    color: '#3498db',
    marginBottom: 5,
  },
  modalMedicineDosage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  modalActions: {
    gap: 15,
  },
  modalActionButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
  },
  takenAction: {
    backgroundColor: '#2ecc71',
  },
  notTakenAction: {
    backgroundColor: '#e74c3c',
  },
  snoozeAction: {
    backgroundColor: '#f39c12',
  },
  modalActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  modalActionSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  medicineCard: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  marginBottom: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
},
medicineRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
medicineInfo: {
  flex: 1,
},
medicineName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#2c3e50',
  marginBottom: 4,
},
medicineDosage: {
  fontSize: 14,
  color: '#7f8c8d',
},
timeContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f8f9fa',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  gap: 4,
},
timeText: {
  fontSize: 14,
  color: '#2c3e50',
  fontWeight: '500',
},
});