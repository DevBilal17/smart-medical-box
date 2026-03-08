import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { useGetPatientsQuery } from "../../../../src/store/api/doctorApi";
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';

export default function PatientsList() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, critical, warning, stable

  const { 
    data: patientsData,
    isLoading,
    refetch
  } = useGetPatientsQuery({ 
    search: searchQuery,
    page: 1,
    limit: 50
  });

  const patients = patientsData?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'critical': return '#e74c3c';
      case 'warning': return '#f39c12';
      case 'stable': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const filteredPatients = patients.filter(patient => {
    if (filterStatus === 'all') return true;
    return patient.status === filterStatus;
  });

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>My Patients</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/(doctor)/patients/add')}>
          <Icon name="account-plus" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#95a5a6" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients by name, email, phone..."
          placeholderTextColor="#95a5a6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#95a5a6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      {/* <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {['all', 'critical', 'warning', 'stable'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              filterStatus === status && styles.filterChipActive,
              { borderColor: status !== 'all' ? getStatusColor(status) : '#3498db' }
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterChipText,
              filterStatus === status && styles.filterChipTextActive,
              { color: status !== 'all' && filterStatus !== status ? getStatusColor(status) : '#2c3e50' }
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView> */}

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        {/* <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#e74c3c' }]}>
            {patients.filter(p => p.status === 'critical').length}
          </Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#f39c12' }]}>
            {patients.filter(p => p.status === 'warning').length}
          </Text>
          <Text style={styles.statLabel}>Warning</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#2ecc71' }]}>
            {patients.filter(p => p.status === 'stable').length}
          </Text>
          <Text style={styles.statLabel}>Stable</Text>
        </View> */}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <TouchableOpacity
              key={patient._id}
              style={styles.patientCard}
              onPress={() => router.push({
                pathname: '/(app)/(doctor)/patients/[id]',
                params: { id: patient._id }
              })}
            >
              <LinearGradient
                colors={['#ffffff', '#f9f9f9']}
                style={styles.cardGradient}
              >
                <View style={styles.patientHeader}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.avatarText}>
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  
                  <View style={styles.patientMainInfo}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientSubInfo}>
                      {patient.age} yrs • {patient.gender} • {patient.bloodGroup || 'NA'}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) }]}>
                    <Text style={styles.statusBadgeText}>
                      {patient.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.patientDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="phone" size={14} color="#7f8c8d" />
                    <Text style={styles.detailText}>{patient.phone}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Icon name="email" size={14} color="#7f8c8d" />
                    <Text style={styles.detailText}>{patient.email}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Icon name="calendar" size={14} color="#7f8c8d" />
                    <Text style={styles.detailText}>
                      Last visit: {patient.lastVisit ? moment(patient.lastVisit).format('MMM D, YYYY') : 'Never'}
                    </Text>
                  </View>
                </View>

                {/* Latest Vitals */}
                {patient.latestHealth && (
                  <View style={styles.vitalsContainer}>
                    <View style={styles.vitalItem}>
                      <Icon name="heart" size={16} color="#e74c3c" />
                      <Text style={styles.vitalText}>{patient.latestHealth.heartRate || '--'} bpm</Text>
                    </View>
                    <View style={styles.vitalItem}>
                      <Icon name="water" size={16} color="#3498db" />
                      <Text style={styles.vitalText}>
                        {patient.latestHealth.systolic && patient.latestHealth.diastolic 
                          ? `${patient.latestHealth.systolic}/${patient.latestHealth.diastolic}` 
                          : '--/--'}
                      </Text>
                    </View>
                    <View style={styles.vitalItem}>
                      <Icon name="lungs" size={16} color="#2ecc71" />
                      <Text style={styles.vitalText}>{patient.latestHealth.oxygenLevel || '--'}%</Text>
                    </View>
                  </View>
                )}

                {/* Alerts Indicator */}
                {patient.unreadAlerts > 0 && (
                  <View style={styles.alertIndicator}>
                    <Icon name="bell" size={14} color="#e74c3c" />
                    <Text style={styles.alertText}>{patient.unreadAlerts} new alert(s)</Text>
                  </View>
                )}

                {/* Device Status */}
                {patient.deviceStatus && (
                  <View style={styles.deviceStatus}>
                    <View style={[styles.deviceDot, { 
                      backgroundColor: patient.deviceStatus === 'online' ? '#2ecc71' : '#e74c3c' 
                    }]} />
                    <Text style={styles.deviceText}>
                      Device: {patient.deviceStatus === 'online' ? 'Connected' : 'Offline'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon="account-off"
            title="No Patients Found"
            message={searchQuery 
              ? `No patients matching "${searchQuery}"` 
              : "You don't have any patients assigned yet"}
            buttonText={searchQuery ? "Clear Search" : undefined}
            onPress={searchQuery ? () => setSearchQuery('') : undefined}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2c3e50',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  patientCard: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    padding: 15,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  patientMainInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  patientSubInfo: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  patientDetails: {
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#2c3e50',
  },
  vitalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ecf0f1',
    marginBottom: 10,
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#2c3e50',
  },
  alertIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c20',
    padding: 8,
    borderRadius: 5,
    marginBottom: 8,
  },
  alertText: {
    marginLeft: 5,
    fontSize: 11,
    color: '#e74c3c',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  deviceText: {
    fontSize: 10,
    color: '#7f8c8d',
  },
});




// filterChip: {
//   paddingHorizontal: 12,
//   paddingVertical: 6, // slightly smaller
//   borderRadius: 20,
//   backgroundColor: '#fff',
//   borderWidth: 1,
//   borderColor: '#ccc', // default border
//   marginRight: 10,
//   height: 32, // ensure uniform height
//   justifyContent: 'center',
//   alignItems: 'center',
// },
// filterChipActive: {
//   backgroundColor: '#3498db',
//   borderColor: '#3498db',
// },
// filterChipText: {
//   fontSize: 12,
//   fontWeight: '500',
//   color: '#2c3e50',
// },
// filterChipTextActive: {
//   color: '#fff',
// },