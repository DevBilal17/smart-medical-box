import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import { useGetPatientDetailsQuery, useGetPatientHealthDataQuery, useGetPatientReportQuery } from '../../../../src/store/api/doctorApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';

const screenWidth = Dimensions.get('window').width;

export default function PatientDetails() {
  const { id } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
  const [selectedChart, setSelectedChart] = useState('heartRate'); // heartRate, bloodPressure, oxygen

  const { 
    data: patientData,
    isLoading: patientLoading,
    refetch: refetchPatient
  } = useGetPatientDetailsQuery(id);

  const {
    data: healthData,
    isLoading: healthLoading,
    refetch: refetchHealth
  } = useGetPatientHealthDataQuery({ 
    patientId: id,
    days: selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90 
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchPatient(), refetchHealth()]);
    setRefreshing(false);
  };

  if (patientLoading && !refreshing) {
    return <Loading />;
  }

  if (!patientData) {
    return (
      <EmptyState
        icon="account-off"
        title="Patient Not Found"
        message="The patient you're looking for doesn't exist"
        buttonText="Go Back"
        onPress={() => router.back()}
      />
    );
  }

  const patient = patientData.patient;
  const latestHealth = patientData.latestHealth;
  const healthStats = patientData.healthStats || {};
  const activePrescription = patientData.activePrescription;
  const recentAlerts = patientData.recentAlerts || [];

  const getChartData = () => {
    if (!healthData?.data) return null;

    let dataPoints = [];
    let labels = [];

    if (selectedChart === 'heartRate') {
      dataPoints = healthData.data.map(d => d.heartRate || 0);
    } else if (selectedChart === 'bloodPressure') {
      dataPoints = healthData.data.map(d => d.systolic || 0);
    } else if (selectedChart === 'oxygen') {
      dataPoints = healthData.data.map(d => d.oxygenLevel || 0);
    }

    labels = healthData.data.map(d => moment(d.recordedAt).format('MMM D'));

    return {
      labels,
      datasets: [{ data: dataPoints }]
    };
  };

  const chartData = getChartData();

  const handleContact = () => {
    Alert.alert(
      'Contact Patient',
      'Choose contact method',
      [
        { text: 'Call', onPress: () => Alert.alert('Calling', `Calling ${patient.phone}`) },
        { text: 'Message', onPress: () => Alert.alert('Message', `Messaging ${patient.phone}`) },
        { text: 'Email', onPress: () => Alert.alert('Email', `Emailing ${patient.email}`) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleNewPrescription = () => {
    router.push({
      pathname: '/(app)/(doctor)/prescriptions/new',
      params: { 
        patientId: id, 
        patientName: patient.name,
        patientAge: patient.age,
        patientGender: patient.gender
      }
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <TouchableOpacity onPress={handleContact} style={styles.contactButton}>
          <Icon name="phone" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Patient Info Card */}
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.profileCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {patient.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientBasicInfo}>
              {patient.age} years • {patient.gender} • {patient.bloodGroup || 'NA'}
            </Text>
          </View>
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactRow}>
            <Icon name="phone" size={16} color="#fff" />
            <Text style={styles.contactText}>{patient.phone}</Text>
          </View>
          <View style={styles.contactRow}>
            <Icon name="email" size={16} color="#fff" />
            <Text style={styles.contactText}>{patient.email}</Text>
          </View>
          {patient.address && (
            <View style={styles.contactRow}>
              <Icon name="map-marker" size={16} color="#fff" />
              <Text style={styles.contactText}>
                {`${patient.address.city || ''}, ${patient.address.state || ''}`}
              </Text>
            </View>
          )}
        </View>

        {patient.allergies && patient.allergies.length > 0 && (
          <View style={styles.allergiesContainer}>
            <Text style={styles.allergiesTitle}>Allergies:</Text>
            <View style={styles.allergyTags}>
              {patient.allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyTag}>
                  <Text style={styles.allergyText}>{allergy}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Heart Rate</Text>
          <Text style={styles.statValue}>
            {latestHealth?.heartRate || '--'}
            <Text style={styles.statUnit}> bpm</Text>
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Blood Pressure</Text>
          <Text style={styles.statValue}>
            {latestHealth ? `${latestHealth.systolic}/${latestHealth.diastolic}` : '--/--'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Oxygen</Text>
          <Text style={styles.statValue}>
            {latestHealth?.oxygenLevel || '--'}
            <Text style={styles.statUnit}>%</Text>
          </Text>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['week', 'month', 'year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart Type Selector */}
      <View style={styles.chartSelector}>
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            selectedChart === 'heartRate' && styles.chartTypeActive,
          ]}
          onPress={() => setSelectedChart('heartRate')}
        >
          <Icon 
            name="heart" 
            size={20} 
            color={selectedChart === 'heartRate' ? '#fff' : '#e74c3c'} 
          />
          <Text style={[
            styles.chartTypeText,
            selectedChart === 'heartRate' && styles.chartTypeTextActive
          ]}>Heart Rate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            selectedChart === 'bloodPressure' && styles.chartTypeActive,
          ]}
          onPress={() => setSelectedChart('bloodPressure')}
        >
          <Icon 
            name="water" 
            size={20} 
            color={selectedChart === 'bloodPressure' ? '#fff' : '#3498db'} 
          />
          <Text style={[
            styles.chartTypeText,
            selectedChart === 'bloodPressure' && styles.chartTypeTextActive
          ]}>BP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            selectedChart === 'oxygen' && styles.chartTypeActive,
          ]}
          onPress={() => setSelectedChart('oxygen')}
        >
          <Icon 
            name="lungs" 
            size={20} 
            color={selectedChart === 'oxygen' ? '#fff' : '#2ecc71'} 
          />
          <Text style={[
            styles.chartTypeText,
            selectedChart === 'oxygen' && styles.chartTypeTextActive
          ]}>Oxygen</Text>
        </TouchableOpacity>
      </View>

      {/* Health Chart */}
      {chartData && chartData.datasets[0].data.length > 0 ? (
        <View style={styles.chartCard}>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => 
                selectedChart === 'heartRate' ? `rgba(231, 76, 60, ${opacity})` :
                selectedChart === 'bloodPressure' ? `rgba(52, 152, 219, ${opacity})` :
                `rgba(46, 204, 113, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '6', strokeWidth: '2' },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Icon name="chart-line" size={40} color="#bdc3c7" />
          <Text style={styles.emptyChartText}>No health data available for this period</Text>
        </View>
      )}

      {/* Health Statistics */}
      {healthStats && (
        <View style={styles.statsDetails}>
          <Text style={styles.sectionTitle}>Statistics (30 days)</Text>
          <View style={styles.statsRow}>
            <View style={styles.statDetail}>
              <Text style={styles.statDetailLabel}>Avg Heart Rate</Text>
              <Text style={styles.statDetailValue}>
                {healthStats.avgHeartRate ? Math.round(healthStats.avgHeartRate) : '--'} bpm
              </Text>
            </View>
            <View style={styles.statDetail}>
              <Text style={styles.statDetailLabel}>Min/Max</Text>
              <Text style={styles.statDetailValue}>
                {healthStats.minHeartRate || '--'}/{healthStats.maxHeartRate || '--'} bpm
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statDetail}>
              <Text style={styles.statDetailLabel}>Avg Systolic</Text>
              <Text style={styles.statDetailValue}>
                {healthStats.avgSystolic ? Math.round(healthStats.avgSystolic) : '--'} mmHg
              </Text>
            </View>
            <View style={styles.statDetail}>
              <Text style={styles.statDetailLabel}>Avg Diastolic</Text>
              <Text style={styles.statDetailValue}>
                {healthStats.avgDiastolic ? Math.round(healthStats.avgDiastolic) : '--'} mmHg
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statDetail}>
              <Text style={styles.statDetailLabel}>Avg Oxygen</Text>
              <Text style={styles.statDetailValue}>
                {healthStats.avgOxygenLevel ? Math.round(healthStats.avgOxygenLevel) : '--'}%
              </Text>
            </View>
            <View style={styles.statDetail}>
              <Text style={styles.statDetailLabel}>Total Readings</Text>
              <Text style={styles.statDetailValue}>{healthStats.totalReadings || 0}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Active Prescription */}
      {activePrescription && (
        <View style={styles.prescriptionCard}>
          <Text style={styles.sectionTitle}>Active Prescription</Text>
          <View style={styles.prescriptionHeader}>
            <Icon name="file-document" size={20} color="#3498db" />
            <Text style={styles.prescriptionDate}>
              {moment(activePrescription.startDate).format('MMM D, YYYY')} - {moment(activePrescription.endDate).format('MMM D, YYYY')}
            </Text>
          </View>
          {activePrescription.medicines?.map((medicine, index) => (
            <View key={index} style={styles.medicineItem}>
              <View style={styles.medicineDot} />
              <View style={styles.medicineInfo}>
                <Text style={styles.medicineName}>{medicine.name}</Text>
                <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
              </View>
              <Text style={styles.medicineTime}>{medicine.time}</Text>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.viewPrescriptionButton}
            onPress={() => router.push({
              pathname: '/(app)/(doctor)/prescriptions/[id]',
              params: { id: activePrescription.id }
            })}
          >
            <Text style={styles.viewPrescriptionText}>View Full Prescription</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          {recentAlerts.map((alert, index) => (
            <TouchableOpacity
              key={index}
              style={styles.alertItem}
              onPress={() => router.push('/(app)/(doctor)/alerts')}
            >
              <View style={[styles.alertIcon, { 
                backgroundColor: 
                  alert.severity === 'critical' ? '#e74c3c20' :
                  alert.severity === 'warning' ? '#f39c1220' : '#3498db20'
              }]}>
                <Icon 
                  name={alert.type === 'heart_rate' ? 'heart' : 
                        alert.type === 'blood_pressure' ? 'water' : 'pill'} 
                  size={20} 
                  color={
                    alert.severity === 'critical' ? '#e74c3c' :
                    alert.severity === 'warning' ? '#f39c12' : '#3498db'
                  } 
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>{moment(alert.createdAt).fromNow()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNewPrescription}>
          <LinearGradient
            colors={['#3498db', '#2980b9']}
            style={styles.buttonGradient}
          >
            <Icon name="file-document" size={20} color="#fff" />
            <Text style={styles.buttonText}>New Prescription</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleContact}>
          <Icon name="message" size={20} color="#3498db" />
          <Text style={styles.secondaryButtonText}>Send Message</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.reportButton}>
        <Icon name="file-pdf" size={20} color="#7f8c8d" />
        <Text style={styles.reportButtonText}>Generate Patient Report</Text>
      </TouchableOpacity>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  contactButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  profileInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  patientBasicInfo: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  contactInfo: {
    marginBottom: 15,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
    opacity: 0.9,
  },
  allergiesContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
  },
  allergiesTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  allergyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergyTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  allergyText: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#7f8c8d',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  periodButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  periodButtonText: {
    textAlign: 'center',
    color: '#2c3e50',
    fontSize: 14,
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  chartSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chartTypeActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  chartTypeText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#2c3e50',
  },
  chartTypeTextActive: {
    color: '#fff',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
  },
  statsDetails: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statDetail: {
    flex: 1,
  },
  statDetailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  statDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  prescriptionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  prescriptionDate: {
    marginLeft: 10,
    fontSize: 12,
    color: '#7f8c8d',
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  medicineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
    marginRight: 10,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  medicineDosage: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  medicineTime: {
    fontSize: 12,
    color: '#3498db',
  },
  viewPrescriptionButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewPrescriptionText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  alertsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  primaryButton: {
    flex: 2,
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reportButtonText: {
    color: '#7f8c8d',
    fontSize: 14,
    marginLeft: 8,
  },
});