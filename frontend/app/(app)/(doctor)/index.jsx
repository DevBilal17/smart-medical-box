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

import { useGetDoctorDashboardQuery } from '../../../src/store/api/doctorApi';
import { useGetUnreadCountQuery } from '../../../src/store/api/alertApi';
import Loading from '../../../src/components/Loading';
import EmptyState from '../../../src/components/EmptyState';
import { useAuth } from '../../../src/hooks/useAuth';

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { 
    data: dashboardData,
    isLoading,
    refetch
  } = useGetDoctorDashboardQuery();

  const { data: unreadCount = 0 } = useGetUnreadCountQuery();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  // Since transformResponse: (response) => response.data, dashboardData is already the data object
  const dashboard = dashboardData || {};

  const stats = {
    totalPatients: dashboard.totalPatients || 0,
    newPatients: dashboard.newPatients || 0,
    pendingAlerts: dashboard.pendingAlerts || 0,
    criticalAlerts: dashboard.criticalAlerts || 0,
    todayAppointments: dashboard.todayAppointments || 0,
    pendingPrescriptions: dashboard.pendingPrescriptions || 0
  };

  const recentPatients = dashboard.recentPatients || [];
  const recentAlerts = dashboard.recentAlerts || [];

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
            <Text style={styles.greeting}>Hello, Dr. {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.role}>Doctor</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={() => router.push('/(app)/(doctor)/alerts')}
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

        {/* Date */}
        <Text style={styles.date}>{moment().format('dddd, MMMM D, YYYY')}</Text>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(app)/(doctor)/patients')}
        >
          <LinearGradient
            colors={['#3498db', '#2980b9']}
            style={styles.statGradient}
          >
            <Icon name="account-multiple" size={30} color="#fff" />
            <Text style={styles.statValue}>{stats.totalPatients}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(app)/(doctor)/alerts')}
        >
          <LinearGradient
            colors={['#e74c3c', '#c0392b']}
            style={styles.statGradient}
          >
            <Icon name="bell" size={30} color="#fff" />
            <Text style={styles.statValue}>{stats.pendingAlerts}</Text>
            <Text style={styles.statLabel}>Pending Alerts</Text>
            {stats.criticalAlerts > 0 && (
              <View style={styles.criticalBadge}>
                <Text style={styles.criticalText}>{stats.criticalAlerts} critical</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(app)/(doctor)/prescriptions')}
        >
          <LinearGradient
            colors={['#2ecc71', '#27ae60']}
            style={styles.statGradient}
          >
            <Icon name="file-document" size={30} color="#fff" />
            <Text style={styles.statValue}>{stats.pendingPrescriptions}</Text>
            <Text style={styles.statLabel}>Prescriptions</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Today's Schedule */}
      <View style={styles.scheduleCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Schedule</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(doctor)/appointments')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {dashboard.appointments && dashboard.appointments.length > 0 ? (
          dashboard.appointments.map((appointment, index) => (
            <View key={index} style={styles.appointmentItem}>
              <View style={styles.appointmentTime}>
                <Text style={styles.timeText}>{appointment.time}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.patientName}>{appointment.patientName}</Text>
                <Text style={styles.appointmentType}>{appointment.type}</Text>
              </View>
              <View style={styles.appointmentStatus}>
                <View style={[styles.statusDot, { 
                  backgroundColor: appointment.status === 'confirmed' ? '#2ecc71' : 
                                  appointment.status === 'pending' ? '#f39c12' : '#e74c3c' 
                }]} />
                <Text style={styles.statusText}>
                  {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptySchedule}>
            <Text style={styles.emptyText}>No appointments scheduled for today</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(app)/(doctor)/appointments/new')}
        >
          <Icon name="plus" size={20} color="#3498db" />
          <Text style={styles.addButtonText}>Add Appointment</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Patients */}
      {recentPatients.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Patients</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(doctor)/patients')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentPatients.slice(0, 5).map((patient, index) => (
            <TouchableOpacity
              key={index}
              style={styles.patientCard}
              onPress={() => router.push({
                pathname: '/(app)/(doctor)/patients/[id]',
                params: { id: patient.id }
              })}
            >
              <View style={styles.patientAvatar}>
                <Text style={styles.avatarText}>
                  {patient.name?.split(' ').map(n => n[0]).join('') || 'P'}
                </Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientCardName}>{patient.name}</Text>
                <Text style={styles.patientDetails}>
                  {patient.age ? `${patient.age} yrs` : ''} • {patient.bloodGroup || 'NA'} • 
                  Last visit: {patient.lastVisit ? moment(patient.lastVisit).format('MMM D') : 'Never'}
                </Text>
              </View>
              <View style={[styles.statusIndicator, { 
                backgroundColor: patient.status === 'critical' ? '#e74c3c' :
                                patient.status === 'warning' ? '#f39c12' : '#2ecc71' 
              }]} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Recent Patients</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent patients</Text>
          </View>
        </View>
      )}

      {/* Recent Alerts */}
      {recentAlerts.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Alerts</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(doctor)/alerts')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentAlerts.slice(0, 5).map((alert, index) => {
            const severity = alert.severity || 'info';
            const severityColor = severity === 'critical' ? '#e74c3c' :
                                 severity === 'warning' ? '#f39c12' : '#3498db';
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.alertCard}
                onPress={() => router.push('/(app)/(doctor)/alerts')}
              >
                <View style={[styles.alertIcon, { 
                  backgroundColor: severityColor + '20'
                }]}>
                  <Icon 
                    name={alert.type?.includes('heart') ? 'heart' : 
                          alert.type?.includes('pressure') ? 'water' : 
                          alert.type?.includes('medicine') ? 'pill' : 'bell'} 
                    size={24} 
                    color={severityColor} 
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertPatient}>{alert.patientName || 'Patient'}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertTime}>{moment(alert.createdAt).fromNow()}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Recent Alerts</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent alerts</Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => router.push('/(app)/(doctor)/prescriptions/new')}
        >
          <LinearGradient
            colors={['#3498db', '#2980b9']}
            style={styles.quickActionGradient}
          >
            <Icon name="file-document" size={30} color="#fff" />
            <Text style={styles.quickActionText}>New Prescription</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => router.push('/(app)/(doctor)/patients')}
        >
          <LinearGradient
            colors={['#2ecc71', '#27ae60']}
            style={styles.quickActionGradient}
          >
            <Icon name="account-search" size={30} color="#fff" />
            <Text style={styles.quickActionText}>Find Patient</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  date: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 20,
    marginTop: -30,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statGradient: {
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  criticalBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  criticalText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  scheduleCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewAllText: {
    color: '#3498db',
    fontSize: 14,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  appointmentTime: {
    width: 70,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  appointmentType: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  appointmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  emptySchedule: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
    marginTop: 5,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  patientInfo: {
    flex: 1,
  },
  patientCardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  alertCard: {
    flexDirection: 'row',
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
  alertIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  alertContent: {
    flex: 1,
  },
  alertPatient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 10,
    color: '#95a5a6',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
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