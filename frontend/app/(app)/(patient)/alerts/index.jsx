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
// ✅ Correct imports from your alertApi
import { 
  useGetAlertsQuery,              // Instead of useGetPatientAlertsQuery
  useUpdateAlertMutation,          // Instead of useMarkAlertReadMutation
  useMarkMultipleAsReadMutation,   // Instead of useMarkMultipleAlertsReadMutation
  useGetUnreadCountQuery 
} from '../../../../src/store/api/alertApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';
import AlertCard from '../../../../src/components/AlertCard';

export default function Alerts() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { 
    data: alertsData,
    isLoading,
    refetch
  } = useGetAlertsQuery({ 
    status: filter === 'all' ? undefined : filter,
    page: 1,
    limit: 100
  });

  const { data: unreadCount = 0, refetch: refetchCount } = useGetUnreadCountQuery();
  const [markAlertRead] = useUpdateAlertMutation();
  const [markMultipleRead] = useMarkMultipleAsReadMutation();

  const alerts = alertsData?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchCount()]);
    setRefreshing(false);
  };

  const handleAlertPress = async (alert) => {
    if (isSelectionMode) {
      toggleAlertSelection(alert.id);
    } else {
      if (alert.status === 'unread') {
        await markAlertRead(alert.id);
      }
      // Navigate based on alert type
      switch(alert.type) {
        case 'missed_medicine':
          router.push({
            pathname: '/(app)/(patient)/medicines/[id]',
            params: { id: alert.data?.medicineId }
          });
          break;
        case 'heart_rate_high':
        case 'heart_rate_low':
        case 'blood_pressure_high':
        case 'blood_pressure_low':
          router.push('/(app)/(patient)/health');
          break;
        default:
          // Just mark as read
          break;
      }
    }
  };

  const toggleAlertSelection = (alertId) => {
    setSelectedAlerts(prev => {
      if (prev.includes(alertId)) {
        return prev.filter(id => id !== alertId);
      } else {
        return [...prev, alertId];
      }
    });
  };

  const handleLongPress = (alert) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedAlerts([alert.id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map(a => a.id));
    }
  };

  const handleBulkMarkRead = async () => {
    if (selectedAlerts.length === 0) return;

    Alert.alert(
      'Mark as Read',
      `Mark ${selectedAlerts.length} alert(s) as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Read',
          onPress: async () => {
            await markMultipleRead(selectedAlerts);
            setSelectedAlerts([]);
            setIsSelectionMode(false);
            onRefresh();
          }
        }
      ]
    );
  };

  const handleBulkDelete = () => {
    if (selectedAlerts.length === 0) return;

    Alert.alert(
      'Delete Alerts',
      `Delete ${selectedAlerts.length} alert(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Implement bulk delete if needed
            setSelectedAlerts([]);
            setIsSelectionMode(false);
          }
        }
      ]
    );
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedAlerts([]);
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'heart_rate_high':
      case 'heart_rate_low':
        return { name: 'heart', color: '#e74c3c' };
      case 'blood_pressure_high':
      case 'blood_pressure_low':
        return { name: 'water', color: '#f39c12' };
      case 'oxygen_low':
        return { name: 'lungs', color: '#3498db' };
      case 'missed_medicine':
        return { name: 'pill', color: '#9b59b6' };
      case 'device_offline':
        return { name: 'wifi-off', color: '#95a5a6' };
      case 'low_battery':
        return { name: 'battery-low', color: '#f39c12' };
      case 'emergency':
        return { name: 'alert', color: '#e74c3c' };
      default:
        return { name: 'bell', color: '#3498db' };
    }
  };

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => isSelectionMode ? exitSelectionMode() : router.back()}>
          <Icon name={isSelectionMode ? 'close' : 'arrow-left'} size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isSelectionMode ? `${selectedAlerts.length} selected` : 'Alerts'}
        </Text>
        {isSelectionMode ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.headerAction}>
              <Text style={styles.headerActionText}>
                {selectedAlerts.length === alerts.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
            <Icon name="dots-vertical" size={24} color="#3498db" />
          </TouchableOpacity>
        )}
      </View>

      {/* Selection Mode Actions */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity style={styles.selectionAction} onPress={handleBulkMarkRead}>
            <Icon name="check-all" size={20} color="#3498db" />
            <Text style={styles.selectionActionText}>Mark Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.selectionAction, styles.deleteAction]} onPress={handleBulkDelete}>
            <Icon name="delete" size={20} color="#e74c3c" />
            <Text style={[styles.selectionActionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Tabs */}
      {!isSelectionMode && (
        <View style={styles.filterContainer}>
          {['all', 'unread', 'read'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterTab,
                filter === f && styles.filterTabActive,
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Alerts List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const icon = getAlertIcon(alert.type);
            const isSelected = selectedAlerts.includes(alert.id);
            
            return (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  alert.status === 'unread' && styles.unreadCard,
                  isSelected && styles.selectedCard,
                ]}
                onPress={() => handleAlertPress(alert)}
                onLongPress={() => handleLongPress(alert)}
                delayLongPress={500}
              >
                {isSelectionMode && (
                  <View style={styles.checkbox}>
                    <Icon 
                      name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                      size={24} 
                      color={isSelected ? '#3498db' : '#bdc3c7'} 
                    />
                  </View>
                )}
                
                <View style={[styles.alertIcon, { backgroundColor: icon.color + '20' }]}>
                  <Icon name={icon.name} size={24} color={icon.color} />
                </View>
                
                <View style={[styles.alertContent, isSelectionMode && styles.alertContentWithCheckbox]}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertTime}>
                      {moment(alert.createdAt).fromNow()}
                    </Text>
                  </View>
                  
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  
                  <View style={styles.alertFooter}>
                    <View style={[styles.severityBadge, { 
                      backgroundColor: 
                        alert.severity === 'critical' ? '#e74c3c20' :
                        alert.severity === 'warning' ? '#f39c1220' :
                        '#3498db20'
                    }]}>
                      <Text style={[styles.severityText, { 
                        color: 
                          alert.severity === 'critical' ? '#e74c3c' :
                          alert.severity === 'warning' ? '#f39c12' :
                          '#3498db'
                      }]}>
                        {alert.severity?.toUpperCase()}
                      </Text>
                    </View>
                    
                    {alert.status === 'unread' && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <EmptyState
            icon="bell-off"
            title="No Alerts"
            message={filter === 'all' 
              ? "You don't have any alerts" 
              : `No ${filter} alerts`}
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
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    marginLeft: 15,
  },
  headerActionText: {
    color: '#3498db',
    fontSize: 14,
  },
  selectionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  selectionActionText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#2c3e50',
  },
  deleteAction: {
    marginLeft: 'auto',
  },
  deleteText: {
    color: '#e74c3c',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
  },
  filterTabActive: {
    backgroundColor: '#3498db',
  },
  filterText: {
    textAlign: 'center',
    color: '#2c3e50',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  selectedCard: {
    backgroundColor: '#3498db10',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  checkbox: {
    marginRight: 10,
    justifyContent: 'center',
  },
  alertIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: 15,
  },
  alertContentWithCheckbox: {
    marginLeft: 0,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  alertTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  alertMessage: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 10,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
});