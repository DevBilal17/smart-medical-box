import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAddHealthRecordMutation } from '../../../../src/store/api/patientApi';
import { getHeartRateStatus, getBloodPressureStatus, getOxygenStatus } from '../../../../src/utils/helpers';

const healthSchema = z.object({
  heartRate: z.string()
    .min(1, 'Heart rate is required')
    .refine((val) => !isNaN(val) && val >= 30 && val <= 200, {
      message: 'Heart rate must be between 30-200 bpm'
    }),
  systolic: z.string()
    .min(1, 'Systolic pressure is required')
    .refine((val) => !isNaN(val) && val >= 70 && val <= 200, {
      message: 'Systolic must be between 70-200 mmHg'
    }),
  diastolic: z.string()
    .min(1, 'Diastolic pressure is required')
    .refine((val) => !isNaN(val) && val >= 40 && val <= 130, {
      message: 'Diastolic must be between 40-130 mmHg'
    }),
  oxygenLevel: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(val) && val >= 70 && val <= 100), {
      message: 'Oxygen level must be between 70-100%'
    }),
  notes: z.string().optional(),
});

export default function AddHealthReading() {
  const [addHealthRecord, { isLoading }] = useAddHealthRecordMutation();
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(healthSchema),
    defaultValues: {
      heartRate: '',
      systolic: '',
      diastolic: '',
      oxygenLevel: '',
      notes: '',
    },
  });

  const heartRate = watch('heartRate');
  const systolic = watch('systolic');
  const diastolic = watch('diastolic');
  const oxygenLevel = watch('oxygenLevel');

  const heartRateStatus = heartRate ? getHeartRateStatus(parseInt(heartRate)) : null;
  const bpStatus = systolic && diastolic ? 
    getBloodPressureStatus(parseInt(systolic), parseInt(diastolic)) : null;
  const oxygenStatus = oxygenLevel ? getOxygenStatus(parseInt(oxygenLevel)) : null;

  const onSubmit = async (data) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const recordData = {
        heartRate: parseInt(data.heartRate),
        systolic: parseInt(data.systolic),
        diastolic: parseInt(data.diastolic),
        ...(data.oxygenLevel && { oxygenLevel: parseInt(data.oxygenLevel) }),
        notes: data.notes,
      };

      const response = await addHealthRecord(recordData).unwrap();
      
      Alert.alert(
        'Success',
        'Health reading added successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.data?.message || 'Failed to add health reading');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Health Reading</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        {/* Heart Rate Input */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Heart Rate (bpm)</Text>
          <View style={[styles.inputContainer, errors.heartRate && styles.inputError]}>
            <Icon name="heart" size={24} color="#e74c3c" style={styles.inputIcon} />
            <Controller
              control={control}
              name="heartRate"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter heart rate"
                  placeholderTextColor="#95a5a6"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="numeric"
                  maxLength={3}
                />
              )}
            />
          </View>
          {errors.heartRate ? (
            <Text style={styles.errorText}>{errors.heartRate.message}</Text>
          ) : heartRateStatus && (
            <View style={[styles.statusBadge, { backgroundColor: heartRateStatus.color }]}>
              <Text style={styles.statusText}>{heartRateStatus.message}</Text>
            </View>
          )}
        </View>

        {/* Blood Pressure Input */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Blood Pressure (mmHg)</Text>
          <View style={styles.bpContainer}>
            <View style={[styles.bpInput, errors.systolic && styles.inputError]}>
              <Icon name="water" size={24} color="#3498db" style={styles.inputIcon} />
              <Controller
                control={control}
                name="systolic"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Systolic"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                )}
              />
            </View>
            <Text style={styles.bpSeparator}>/</Text>
            <View style={[styles.bpInput, errors.diastolic && styles.inputError]}>
              <Controller
                control={control}
                name="diastolic"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Diastolic"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                )}
              />
            </View>
          </View>
          {errors.systolic && <Text style={styles.errorText}>{errors.systolic.message}</Text>}
          {errors.diastolic && <Text style={styles.errorText}>{errors.diastolic.message}</Text>}
          {bpStatus && !errors.systolic && !errors.diastolic && (
            <View style={[styles.statusBadge, { backgroundColor: bpStatus.color }]}>
              <Text style={styles.statusText}>{bpStatus.message}</Text>
            </View>
          )}
        </View>

        {/* Oxygen Level Input */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Oxygen Level (%) (Optional)</Text>
          <View style={[styles.inputContainer, errors.oxygenLevel && styles.inputError]}>
            <Icon name="lungs" size={24} color="#2ecc71" style={styles.inputIcon} />
            <Controller
              control={control}
              name="oxygenLevel"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter oxygen level"
                  placeholderTextColor="#95a5a6"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="numeric"
                  maxLength={3}
                />
              )}
            />
          </View>
          {errors.oxygenLevel ? (
            <Text style={styles.errorText}>{errors.oxygenLevel.message}</Text>
          ) : oxygenStatus && (
            <View style={[styles.statusBadge, { backgroundColor: oxygenStatus.color }]}>
              <Text style={styles.statusText}>{oxygenStatus.message}</Text>
            </View>
          )}
        </View>

        {/* Notes Input */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <View style={styles.inputContainer}>
            <Icon name="note-text" size={24} color="#95a5a6" style={styles.inputIcon} />
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add any notes..."
                  placeholderTextColor="#95a5a6"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />
          </View>
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📋 Tips for accurate reading:</Text>
          <View style={styles.tipItem}>
            <Icon name="check-circle" size={16} color="#2ecc71" />
            <Text style={styles.tipText}>Rest for 5 minutes before measuring</Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check-circle" size={16} color="#2ecc71" />
            <Text style={styles.tipText}>Sit comfortably with feet flat on floor</Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check-circle" size={16} color="#2ecc71" />
            <Text style={styles.tipText}>Place cuff on bare arm at heart level</Text>
          </View>
          <View style={styles.tipItem}>
            <Icon name="check-circle" size={16} color="#2ecc71" />
            <Text style={styles.tipText}>Don't talk during measurement</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#3498db', '#2980b9']}
            style={styles.submitGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="check" size={24} color="#fff" />
                <Text style={styles.submitText}>Save Reading</Text>
              </>
            )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  form: {
    padding: 20,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bpInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  bpSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginHorizontal: 10,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  tipsCard: {
    backgroundColor: '#3498db10',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  tipText: {
    marginLeft: 10,
    fontSize: 12,
    color: '#2c3e50',
    flex: 1,
  },
  submitButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 30,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});