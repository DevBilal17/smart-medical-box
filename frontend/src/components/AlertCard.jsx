import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';

export default function AlertCard({ alert, onPress, onDismiss }) {
  const getAlertIcon = (type) => {
    switch(type) {
      case 'heartRate': return { name: 'heart', color: '#e74c3c' };
      case 'bloodPressure': return { name: 'water', color: '#f39c12' };
      case 'missedMedicine': return { name: 'pill', color: '#3498db' };
      case 'deviceOffline': return { name: 'wifi-off', color: '#95a5a6' };
      case 'lowBattery': return { name: 'battery-low', color: '#f39c12' };
      default: return { name: 'bell', color: '#3498db' };
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const icon = getAlertIcon(alert.type);

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        alert.status === 'unread' && styles.unreadContainer
      ]} 
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
        <Icon name={icon.name} size={24} color={icon.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.time}>{moment(alert.createdAt).fromNow()}</Text>
        </View>

        <Text style={styles.message}>{alert.message}</Text>

        <View style={styles.footer}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) + '20' }]}>
            <Text style={[styles.severityText, { color: getSeverityColor(alert.severity) }]}>
              {alert.severity?.toUpperCase()}
            </Text>
          </View>

          {onDismiss && (
            <TouchableOpacity onPress={() => onDismiss(alert.id)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {alert.status === 'unread' && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  time: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  message: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 10,
  },
  footer: {
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
  dismissText: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
});