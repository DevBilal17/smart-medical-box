import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { z } from 'zod';
import { 
  useAddMedicineMutation, 
  useUpdateMedicineMutation,
  useGetMedicineByIdQuery 
} from "../../../../src/store/api/medicineApi";
import Loading from '../../../../src/components/Loading'

// Simplified schema without price, stock, and expiry
const simplifiedMedicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  category: z.string().min(1, 'Category is required'),
//   manufacturer: z.string().optional(),
  dosage: z.string().optional(),
  description: z.string().optional(),
});

const categories = [
  'Antibiotic',
  'Painkiller',
  'Antacid',
  'Antidiabetic',
  'Antihistamine',
  'Antiviral',
   'Antidepressant',
  'Antifungal',
  'Vitamin',
  'Supplement',
  'Other'
];

export default function MedicineForm() {
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);

  const { data: medicineData, isLoading: isLoadingMedicine } = useGetMedicineByIdQuery(id, {
    skip: !isEditing
  });

  const [addMedicine] = useAddMedicineMutation();
  const [updateMedicine] = useUpdateMedicineMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(simplifiedMedicineSchema),
    defaultValues: {
      name: '',
      category: '',
      dosage: '',
      description: '',
    }
  });

  useEffect(() => {
    if (medicineData?.data && isEditing) {
      const medicine = medicineData.data;
      setValue('name', medicine.name || '');
      setValue('category', medicine.category || '');
    //   setValue('manufacturer', medicine.manufacturer || '');
      setValue('dosage', medicine.dosage || '');
      setValue('description', medicine.description || '');
    }
  }, [medicineData, isEditing, setValue]);

const onSubmit = async (data) => {
  setLoading(true);
  try {
    const payload = {
      ...data,
      category: data.category.toLowerCase() // convert to lowercase
    };

    if (isEditing) {
      await updateMedicine({ id, ...payload }).unwrap();
    } else {
      await addMedicine(payload).unwrap();
    }

    Alert.alert('Success', `Medicine ${isEditing ? 'updated' : 'added'} successfully`, [{ text: 'OK', onPress: () => router.back() }]);

  } catch (error) {
    Alert.alert('Error', error.data?.message || `Failed to ${isEditing ? 'update' : 'add'} medicine`);
  } finally {
    setLoading(false);
  }
};

  if (isLoadingMedicine) {
    return <Loading />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Medicine' : 'Add New Medicine'}
        </Text>
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#3498db" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicine Information</Text>
          
          {/* Medicine Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Medicine Name *</Text>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <Icon name="pill" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter medicine name"
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

          {/* Category */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category *</Text>
            <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
              <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    selectedValue={value}
                    style={styles.picker}
                    onValueChange={onChange}
                  >
                    <Picker.Item label="Select category" value="" />
                    {categories.map(category => (
                      <Picker.Item key={category} label={category} value={category} />
                    ))}
                  </Picker>
                )}
              />
            </View>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category.message}</Text>
            )}
          </View>

          {/* Manufacturer */}
          {/* <View style={styles.fieldContainer}>
            <Text style={styles.label}>Manufacturer</Text>
            <View style={styles.inputContainer}>
              <Icon name="factory" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="manufacturer"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter manufacturer name"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          </View> */}

          {/* Dosage */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Dosage</Text>
            <View style={styles.inputContainer}>
              <Icon name="needle" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="dosage"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 500mg, 10ml, 1 tablet"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter medicine description, usage instructions, etc."
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
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Icon name="information" size={20} color="#3498db" />
          <Text style={styles.noteText}>
            {isEditing 
              ? 'Update the medicine information as needed.'
              : 'Fill in all required fields marked with * to add a new medicine.'}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  fieldContainer: {
    marginBottom: 15,
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
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
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