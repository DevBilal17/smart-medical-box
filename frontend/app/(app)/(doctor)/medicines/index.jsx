import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import { useGetMedicinesQuery, useDeleteMedicineMutation } from "../../../../src/store/api/medicineApi";
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';

export default function MedicinesList() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { 
    data: medicinesData,
    isLoading,
    refetch
  } = useGetMedicinesQuery({ 
    search: searchQuery,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    page: 1,
    limit: 50
  });

  const [deleteMedicine] = useDeleteMedicineMutation();

  const medicines = medicinesData?.data || [];
  
  // Get unique categories from medicines
  const categories = [...new Set(medicines.map(med => med.category).filter(Boolean))];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (medicine) => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to delete ${medicine.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedicine(medicine._id).unwrap();
              Alert.alert('Success', 'Medicine deleted successfully');
            } catch (error) {
              Alert.alert('Error', error.data?.message || 'Failed to delete medicine');
            }
          }
        }
      ]
    );
  };

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>Medicines</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/medicines/add')}>
          <Icon name="pill" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#95a5a6" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medicines by name, category..."
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

      {/* Category Filter */}
      {/* <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            categoryFilter === 'all' && styles.filterChipActive
          ]}
          onPress={() => setCategoryFilter('all')}
        >
          <Text style={[
            styles.filterChipText,
            categoryFilter === 'all' && styles.filterChipTextActive
          ]}>All</Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterChip,
              categoryFilter === category && styles.filterChipActive
            ]}
            onPress={() => setCategoryFilter(category)}
          >
            <Text style={[
              styles.filterChipText,
              categoryFilter === category && styles.filterChipTextActive
            ]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView> */}

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{medicines.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        {/* <View style={styles.statBox}>
          <Text style={styles.statNumber}>{categories.length}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View> */}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {medicines.length > 0 ? (
          medicines.map((medicine) => (
            <TouchableOpacity
              key={medicine._id}
              style={styles.medicineCard}
              onPress={() => router.push({
                pathname: '/(app)/medicines/[id]',
                params: { id: medicine._id }
              })}
            >
              <LinearGradient
                colors={['#ffffff', '#f9f9f9']}
                style={styles.cardGradient}
              >
                <View style={styles.medicineHeader}>
                  <View style={styles.medicineIcon}>
                    <Icon name="pill" size={24} color="#3498db" />
                  </View>
                  
                  <View style={styles.medicineMainInfo}>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    <Text style={styles.medicineSubInfo}>
                      {medicine.category} • {medicine.manufacturer || 'Generic'}
                    </Text>
                  </View>
                </View>

                {medicine.dosage && (
                  <View style={styles.dosageContainer}>
                    <Icon name="needle" size={16} color="#7f8c8d" />
                    <Text style={styles.dosageText}>Dosage: {medicine.dosage}</Text>
                  </View>
                )}

                {medicine.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {medicine.description}
                  </Text>
                )}

                <View style={styles.footer}>
                  <View style={styles.dateInfo}>
                    <Icon name="calendar" size={12} color="#95a5a6" />
                    <Text style={styles.dateText}>
                      Added: {moment(medicine.createdAt).format('MMM D, YYYY')}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => router.push({
                        pathname: '/(app)/medicines/add',
                        params: { id: medicine._id }
                      })}
                    >
                      <Icon name="pencil" size={16} color="#3498db" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(medicine)}
                    >
                      <Icon name="delete" size={16} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon="pill-off"
            title="No Medicines Found"
            message={searchQuery 
              ? `No medicines matching "${searchQuery}"` 
              : "No medicines added yet"}
            buttonText={searchQuery ? "Clear Search" : "Add Medicine"}
            onPress={searchQuery ? () => setSearchQuery('') : () => router.push('/(app)/medicines/add')}
          />
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/medicines/add')}
      >
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
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
    borderColor: '#ccc',
    marginRight: 10,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2c3e50',
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
  medicineCard: {
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
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicineIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  medicineMainInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  medicineSubInfo: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dosageText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#2c3e50',
  },
  description: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 10,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#95a5a6',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#3498db20',
    borderRadius: 5,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#e74c3c20',
    borderRadius: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});