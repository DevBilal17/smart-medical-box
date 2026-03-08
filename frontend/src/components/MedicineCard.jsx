import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatTime } from '../utils/helpers';

export default function MedicineCard({ medicine, onPress, onTake }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'taken': return '#2ecc71';
      case 'missed': return '#e74c3c';
      case 'upcoming': return '#f39c12';
      default: return '#3498db';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'taken': return 'check-circle';
      case 'missed': return 'close-circle';
      case 'upcoming': return 'clock-outline';
      default: return 'pill';
    }
  };
// console.log(medicine)
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.colorBar, { backgroundColor: getStatusColor(medicine.status) }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon name="pill" size={20} color="#2c3e50" />
            <Text style={styles.name}>{medicine.name}</Text>
          </View>
          <Icon 
            name={getStatusIcon(medicine.status)} 
            size={24} 
            color={getStatusColor(medicine.status)} 
          />
        </View>

        <Text style={styles.dosage}>{medicine.dosage}</Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Icon name="clock-outline" size={16} color="#7f8c8d" />
            <Text style={styles.detailText}>{formatTime(medicine.times[0].time)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Icon name="package-variant" size={16} color="#7f8c8d" />
            <Text style={styles.detailText}>Compartment {medicine.compartmentNumber}</Text>
          </View>
        </View>

        {medicine.instructions && (
          <Text style={styles.instructions}>{medicine.instructions}</Text>
        )}

        {medicine.status === 'upcoming' && onTake && (
          <TouchableOpacity style={styles.takeButton} onPress={() => onTake(medicine)}>
            <Text style={styles.takeButtonText}>Mark as Taken</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  colorBar: {
    width: 6,
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  dosage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#7f8c8d',
  },
  instructions: {
    fontSize: 12,
    color: '#3498db',
    backgroundColor: '#3498db10',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  takeButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  takeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});