import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { patientSchema } from '../../../../src/utils/validators';
import {useAddPatientMutation} from "../../../../src/store/api/doctorApi"

// Validation Schema


export default function CreatePatient() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [showAddress, setShowAddress] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const [addPatient] = useAddPatientMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm({
    resolver: zodResolver(patientSchema),
   defaultValues: {
  name: '',
  email: '',
  phone: '',
  age: '',
  gender: 'male',
  bloodGroup: 'O+',
  allergies: [],
  medicalConditions: [],
}
  });

  const allergies = watch('allergies') || [];
  const medicalConditions = watch('medicalConditions') || [];

  const onSubmit = async (data) => {
      console.log(data)
      console.log(errors);
    setLoading(true);
    try {
      // Convert age string to number
      const submitData = {
        ...data,
       age: Number(data.age),
      };
      console.log(submitData)

      await addPatient(submitData).unwrap();
      
      Alert.alert(
        'Success',
        'Patient added successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
        console.log(error)
        console.log(errors);
      Alert.alert('Error', error.data?.message || 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      const currentAllergies = getValues('allergies') || [];
      setValue('allergies', [...currentAllergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (index) => {
    const currentAllergies = getValues('allergies') || [];
    setValue('allergies', currentAllergies.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    if (conditionInput.trim()) {
      const currentConditions = getValues('medicalConditions') || [];
      setValue('medicalConditions', [...currentConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const removeCondition = (index) => {
    const currentConditions = getValues('medicalConditions') || [];
    setValue('medicalConditions', currentConditions.filter((_, i) => i !== index));
  };

  const bloodGroups = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  const genders = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Patient</Text>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? (
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
          
          {/* Full Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <Icon name="account" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email *</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Icon name="email" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Phone and Password Row */}
          <View style={[styles.fieldContainer]}>
              <Text style={styles.label}>Phone *</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Icon name="phone" size={20} color="#95a5a6" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Phone number"
                      placeholderTextColor="#95a5a6"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="phone-pad"
                    />
                  )}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone.message}</Text>
              )}
            </View>
          <View style={styles.rowContainer}>
            

            {/* <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Password *</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Icon name="lock" size={20} color="#95a5a6" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#95a5a6"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showPassword}
                    />
                  )}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#95a5a6" />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View> */}
          </View>

          {/* Age and Gender Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Age *</Text>
              <View style={[styles.inputContainer, errors.age && styles.inputError]}>
                <Icon name="calendar" size={20} color="#95a5a6" style={styles.inputIcon} />
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
                    />
                  )}
                />
              </View>
              {errors.age && (
                <Text style={styles.errorText}>{errors.age.message}</Text>
              )}
            </View>

            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.pickerContainer}>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <Picker
                      selectedValue={value}
                      style={styles.picker}
                      onValueChange={onChange}
                    >
                      {genders.map(gender => (
                        <Picker.Item key={gender.value} label={gender.label} value={gender.value} />
                      ))}
                    </Picker>
                  )}
                />
              </View>
            </View>
          </View>

          {/* Blood Group */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Blood Group *</Text>
            <View style={styles.pickerContainer}>
              <Controller
                control={control}
                name="bloodGroup"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    selectedValue={value}
                    style={styles.picker}
                    onValueChange={onChange}
                  >
                    {bloodGroups.map(group => (
                      <Picker.Item key={group} label={group} value={group} />
                    ))}
                  </Picker>
                )}
              />
            </View>
          </View>
        </View>

        {/* Medical Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          {/* Allergies */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Allergies</Text>
            <View style={styles.tagInputContainer}>
              <View style={styles.tagInputRow}>
                <View style={[styles.inputContainer, styles.tagInput]}>
                  <Icon name="alert-circle" size={20} color="#95a5a6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Add allergy (e.g., Penicillin)"
                    placeholderTextColor="#95a5a6"
                    value={allergyInput}
                    onChangeText={setAllergyInput}
                    onSubmitEditing={addAllergy}
                  />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
                  <Icon name="plus" size={24} color="#3498db" />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {allergies.map((allergy, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{allergy}</Text>
                    <TouchableOpacity onPress={() => removeAllergy(index)}>
                      <Icon name="close" size={16} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Medical Conditions */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Medical Conditions</Text>
            <View style={styles.tagInputContainer}>
              <View style={styles.tagInputRow}>
                <View style={[styles.inputContainer, styles.tagInput]}>
                  <Icon name="hospital-box" size={20} color="#95a5a6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Add condition (e.g., Diabetes)"
                    placeholderTextColor="#95a5a6"
                    value={conditionInput}
                    onChangeText={setConditionInput}
                    onSubmitEditing={addCondition}
                  />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={addCondition}>
                  <Icon name="plus" size={24} color="#3498db" />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {medicalConditions.map((condition, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{condition}</Text>
                    <TouchableOpacity onPress={() => removeCondition(index)}>
                      <Icon name="close" size={16} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => setShowAddress(!showAddress)}
          >
            <Text style={styles.sectionTitle}>Address</Text>
            <Icon 
              name={showAddress ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#7f8c8d" 
            />
          </TouchableOpacity>

          {showAddress && (
            <View>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Street Address</Text>
                <View style={styles.inputContainer}>
                  <Icon name="home" size={20} color="#95a5a6" style={styles.inputIcon} />
                  <Controller
                    control={control}
                    name="address.street"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Enter street address"
                        placeholderTextColor="#95a5a6"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
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
                        />
                      )}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.fieldContainer, styles.halfField]}>
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
                        />
                      )}
                    />
                  </View>
                </View>

                <View style={[styles.fieldContainer, styles.halfField]}>
                  <Text style={styles.label}>Country</Text>
                  <View style={styles.inputContainer}>
                    <Controller
                      control={control}
                      name="address.country"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="Country"
                          placeholderTextColor="#95a5a6"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Emergency Contact Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => setShowEmergency(!showEmergency)}
          >
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Icon 
              name={showEmergency ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#7f8c8d" 
            />
          </TouchableOpacity>

          {showEmergency && (
            <View>
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
                        placeholder="Enter contact name"
                        placeholderTextColor="#95a5a6"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.fieldContainer, styles.halfField]}>
                  <Text style={styles.label}>Relationship</Text>
                  <View style={styles.inputContainer}>
                    <Controller
                      control={control}
                      name="emergencyContact.relationship"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., Spouse"
                          placeholderTextColor="#95a5a6"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                </View>

                <View style={[styles.fieldContainer, styles.halfField]}>
                  <Text style={styles.label}>Phone</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="phone" size={20} color="#95a5a6" style={styles.inputIcon} />
                    <Controller
                      control={control}
                      name="emergencyContact.phone"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="Phone number"
                          placeholderTextColor="#95a5a6"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          keyboardType="phone-pad"
                        />
                      )}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Additional Info Note */}
        <View style={styles.noteContainer}>
          <Icon name="information" size={20} color="#3498db" />
          <Text style={styles.noteText}>
            An email will be sent to the patient with login credentials.
          </Text>
        </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  eyeIcon: {
    paddingHorizontal: 10,
  },
  tagInputContainer: {
    marginTop: 5,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#2c3e50',
    marginRight: 5,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebf5ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#2c3e50',
  },
});