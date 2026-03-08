import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetPatientProfileQuery, useUpdatePatientProfileMutation } from '../../../../src/store/api/patientApi';
import Loading from '../../../../src/components/Loading';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
  age: z.string().refine((val) => !isNaN(val) && parseInt(val) > 0 && parseInt(val) < 150, {
    message: 'Please enter a valid age',
  }),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number').optional().or(z.literal('')),
    relationship: z.string().optional(),
  }).optional(),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
});

export default function EditProfile() {
  const [loading, setLoading] = useState(false);
  const { data: profile, isLoading: profileLoading, error: profileError, refetch } = useGetPatientProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdatePatientProfileMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      age: '',
      gender: 'male',
      bloodGroup: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
      allergies: '',
      medicalConditions: '',
    },
  });

  // Set form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        phone: profile.phone || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || 'male',
        bloodGroup: profile.bloodGroup || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          zipCode: profile.address?.zipCode || '',
        },
        emergencyContact: {
          name: profile.emergencyContact?.name || '',
          phone: profile.emergencyContact?.phone || '',
          relationship: profile.emergencyContact?.relationship || '',
        },
        allergies: profile.allergies?.join(', ') || '',
        medicalConditions: profile.medicalConditions?.join(', ') || '',
      });
    }
  }, [profile, reset]);

  if (profileLoading) {
    return <Loading />;
  }

  if (profileError) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={50} color="#e74c3c" />
        <Text style={styles.errorTitle}>Error Loading Profile</Text>
        <Text style={styles.errorMessage}>
          {profileError?.data?.message || 'Failed to load profile. Please try again.'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Process the data before sending
      const updateData = {
        name: data.name,
        phone: data.phone,
        age: parseInt(data.age),
        gender: data.gender,
        bloodGroup: data.bloodGroup || undefined,
        address: {
          street: data.address?.street || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          zipCode: data.address?.zipCode || '',
        },
        emergencyContact: {
          name: data.emergencyContact?.name || '',
          phone: data.emergencyContact?.phone || '',
          relationship: data.emergencyContact?.relationship || '',
        },
        allergies: data.allergies ? data.allergies.split(',').map(item => item.trim()).filter(item => item) : [],
        medicalConditions: data.medicalConditions ? data.medicalConditions.split(',').map(item => item.trim()).filter(item => item) : [],
      };

      // Remove empty fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      if (updateData.address && Object.values(updateData.address).every(val => !val)) {
        delete updateData.address;
      }

      if (updateData.emergencyContact && Object.values(updateData.emergencyContact).every(val => !val)) {
        delete updateData.emergencyContact;
      }

      const response = await updateProfile(updateData).unwrap();
      
      Alert.alert(
        'Success',
        response.message || 'Profile updated successfully',
        [
          { 
            text: 'OK', 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      console.error('Update error:', error);
      
      // Handle different error types
      let errorMessage = 'Failed to update profile';
      
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || isUpdating;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#3498db" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <Icon name="account" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
          </View>

          {/* Email Field (Read Only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, styles.readOnlyInput]}>
              <Icon name="email" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>{profile?.email}</Text>
            </View>
          </View>

          {/* Phone Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
              <Icon name="phone" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 10-digit phone number"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
          </View>

          {/* Age and Gender Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Age <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputContainer, errors.age && styles.inputError]}>
                <Icon name="cake-variant" size={20} color="#95a5a6" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="age"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Age"
                      placeholderTextColor="#95a5a6"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      maxLength={3}
                      editable={!isLoading}
                    />
                  )}
                />
              </View>
              {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}
            </View>

            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Gender <Text style={styles.required}>*</Text></Text>
              <View style={[styles.pickerContainer, errors.gender && styles.inputError]}>
                <Icon name="gender-male-female" size={20} color="#95a5a6" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <Picker
                      selectedValue={value}
                      style={styles.picker}
                      onValueChange={onChange}
                      enabled={!isLoading}
                    >
                      <Picker.Item label="Male" value="male" />
                      <Picker.Item label="Female" value="female" />
                      <Picker.Item label="Other" value="other" />
                    </Picker>
                  )}
                />
              </View>
            </View>
          </View>

          {/* Blood Group */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Blood Group</Text>
            <View style={styles.pickerContainer}>
              <Icon name="water" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="bloodGroup"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    selectedValue={value}
                    style={styles.picker}
                    onValueChange={onChange}
                    enabled={!isLoading}
                  >
                    <Picker.Item label="Select Blood Group" value="" />
                    <Picker.Item label="A+" value="A+" />
                    <Picker.Item label="A-" value="A-" />
                    <Picker.Item label="B+" value="B+" />
                    <Picker.Item label="B-" value="B-" />
                    <Picker.Item label="AB+" value="AB+" />
                    <Picker.Item label="AB-" value="AB-" />
                    <Picker.Item label="O+" value="O+" />
                    <Picker.Item label="O-" value="O-" />
                  </Picker>
                )}
              />
            </View>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Street Address</Text>
            <View style={styles.inputContainer}>
              <Icon name="map-marker" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="address.street"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Street address"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputContainer}>
                <Controller
                  control={control}
                  name="address.city"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="City"
                      placeholderTextColor="#95a5a6"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isLoading}
                    />
                  )}
                />
              </View>
            </View>

            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>State</Text>
              <View style={styles.inputContainer}>
                <Controller
                  control={control}
                  name="address.state"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="State"
                      placeholderTextColor="#95a5a6"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      editable={!isLoading}
                    />
                  )}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>ZIP Code</Text>
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name="address.zipCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="ZIP Code"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="numeric"
                    maxLength={6}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Emergency Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contact Name</Text>
            <View style={styles.inputContainer}>
              <Icon name="account" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="emergencyContact.name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Emergency contact name"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contact Phone</Text>
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="emergencyContact.phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Emergency contact phone"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
            {errors.emergencyContact?.phone && (
              <Text style={styles.errorText}>{errors.emergencyContact.phone.message}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Relationship</Text>
            <View style={styles.inputContainer}>
              <Icon name="account-heart" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="emergencyContact.relationship"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Spouse, Parent, Sibling"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Allergies (comma separated)</Text>
            <View style={styles.inputContainer}>
              <Icon name="alert" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="allergies"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Penicillin, Peanuts"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Medical Conditions</Text>
            <View style={styles.inputContainer}>
              <Icon name="medical-bag" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="medicalConditions"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Diabetes, Hypertension"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#95a5a6', '#7f8c8d'] : ['#3498db', '#2980b9']}
            style={styles.saveGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="check" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  saveText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  fieldContainer: {
    marginBottom: 15,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 5,
  },
  required: {
    color: '#e74c3c',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 10,
    fontSize: 14,
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
  readOnlyInput: {
    backgroundColor: '#ecf0f1',
  },
  readOnlyText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#7f8c8d',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    flex: 1,
    height: 50,
  },
  saveButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 30,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});