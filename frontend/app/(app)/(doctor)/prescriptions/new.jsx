import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import { useCreatePrescriptionMutation } from "../../../../src/store/api/doctorApi";
import { useGetMedicinesQuery } from "../../../../src/store/api/medicineApi";

const medicineSchema = z.object({
  name: z.string().min(1, "Medicine name is required"),
  dosage: z.string().optional(),
  form: z.enum([
    "tablet",
    "capsule",
    "liquid",
    "injection",
    "topical",
    "inhaler",
  ]).default("tablet"),
  frequency: z.enum(["once-daily", "twice-daily", "thrice-daily", "as-needed"]),
  times: z
    .array(
      z.object({
        time: z.string(),
        taken: z.boolean().default(false),
      }),
    )
    .min(1, "At least one time is required"),
  compartmentNumber: z.string().min(1, "Compartment is required"),
  quantity: z.string().optional(),
  instructions: z.string().optional(),
});

const prescriptionSchema = z
  .object({
    patientId: z.string().min(1, "Patient is required"),
    medicines: z
      .array(medicineSchema)
      .min(1, "At least one medicine is required"),
    diagnosis: z.string().min(1, "Diagnosis is required"),
    notes: z.string().optional(),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export default function CreatePrescription() {
  const { patientId, patientName, patientAge, patientGender } =
    useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [showMedicineSuggestions, setShowMedicineSuggestions] = useState(false);
  const [medicineSearchIndex, setMedicineSearchIndex] = useState(null);
  const { data: medicineSuggestions } = useGetMedicinesQuery(
    { search: medicineSearch, limit: 5 },
    { skip: medicineSearch.length < 2 },
  );
  // console.log(medicineSuggestions)
  const [createPrescription] = useCreatePrescriptionMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: patientId || "",
      medicines: [
        {
          name: "",
          form: "",
          frequency: "once-daily",
          times: [{ time: "08:00", taken: false }],
          compartmentNumber: "1",
          quantity: "",
          instructions: "",
        },
      ],
      diagnosis: "",
      notes: "",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medicines",
  });

  const medicineTimes = [
    { label: "Morning (6-8 AM)", value: "06:00" },
    { label: "Morning (8-10 AM)", value: "08:00" },
    { label: "Afternoon (12-2 PM)", value: "12:00" },
    { label: "Afternoon (2-4 PM)", value: "14:00" },
    { label: "Evening (6-8 PM)", value: "18:00" },
    { label: "Night (9-11 PM)", value: "21:00" },
  ];

  const compartments = [1, 2, 3, 4].map((num) => ({
    label: `Compartment ${num}`,
    value: num.toString(),
  }));

  const medicineForms = [
    { label: "Tablet", value: "tablet" },
    { label: "Capsule", value: "capsule" },
    { label: "Liquid", value: "liquid" },
    { label: "Injection", value: "injection" },
    { label: "Topical", value: "topical" },
    { label: "Inhaler", value: "inhaler" },
  ];

  const frequencies = [
    { label: "Once Daily", value: "once-daily" },
    { label: "Twice Daily", value: "twice-daily" },
    { label: "Thrice Daily", value: "thrice-daily" },
    { label: "As Needed", value: "as-needed" },
  ];
const onError = (errors) => {
  console.log('Validation errors:', errors);
  console.log('Form state:', {
    startDate: watch('startDate'),
    endDate: watch('endDate'),
    patientId: watch('patientId'),
    medicines: watch('medicines'),
    diagnosis: watch('diagnosis'),
  });
};
const checkForm = () => {
  console.log('Current form values:', {
    patientId: watch('patientId'),
    medicines: watch('medicines'),
    diagnosis: watch('diagnosis'),
    startDate: watch('startDate'),
    endDate: watch('endDate'),
  });
  console.log('Form errors:', errors);
  console.log('Is form valid?', Object.keys(errors).length === 0);
};
const onSubmit = async (data) => {
  console.log(data)
  setLoading(true);
  try {
    // Convert the data to match backend format
    const formattedData = {
      ...data,
      startDate: data.startDate.toISOString(), // Convert Date to ISO string
      endDate: data.endDate.toISOString(),     // Convert Date to ISO string
    };
    
    console.log(formattedData); // This should now show strings instead of Date objects
    await createPrescription(formattedData).unwrap();

    Alert.alert("Success", "Prescription created successfully", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  } catch (error) {
    console.log(error);
    Alert.alert(
      "Error",
      error.data?.message || "Failed to create prescription",
    );
  } finally {
    setLoading(false);
  }
};

  const addMedicine = () => {
    append({
      name: "",
      dosage: "",
      form: "tablet",
      frequency: "once-daily",
      times: [{ time: "08:00", taken: false }],
      compartmentNumber: "1",
      quantity: "",
      instructions: "",
    });
  };

  const addTimeToMedicine = (index) => {
    const currentTimes = watch(`medicines.${index}.times`) || [];
    if (currentTimes.length < 4) {
      const newTime = { time: "12:00", taken: false };
      setValue(`medicines.${index}.times`, [...currentTimes, newTime]);
    }
  };

  const removeTimeFromMedicine = (medicineIndex, timeIndex) => {
    const currentTimes = watch(`medicines.${medicineIndex}.times`);
    if (currentTimes.length > 1) {
      const newTimes = currentTimes.filter((_, i) => i !== timeIndex);
      setValue(`medicines.${medicineIndex}.times`, newTimes);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>New Prescription</Text>
        <TouchableOpacity onPress={handleSubmit(onSubmit,onError)} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#3498db" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Patient Info */}
      {patientName && (
        <View style={styles.patientInfoCard}>
          <Icon name="account" size={24} color="#3498db" />
          <View style={styles.patientInfo}>
            <Text style={styles.patientInfoName}>{patientName}</Text>
            <Text style={styles.patientInfoDetails}>
              {patientAge} years • {patientGender}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.form}>
        {/* Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescription Period</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setShowStartDate(true)}
            >
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>
                {moment(watch("startDate")).format("MMM D, YYYY")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setShowEndDate(true)}
            >
              <Text style={styles.dateLabel}>End Date</Text>
              <Text style={styles.dateValue}>
                {moment(watch("endDate")).format("MMM D, YYYY")}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.endDate && (
            <Text style={styles.errorText}>{errors.endDate.message}</Text>
          )}
        </View>

        {/* Diagnosis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis</Text>
          <View
            style={[
              styles.inputContainer,
              errors.diagnosis && styles.inputError,
            ]}
          >
            <Icon
              name="stethoscope"
              size={20}
              color="#95a5a6"
              style={styles.inputIcon}
            />
            <Controller
              control={control}
              name="diagnosis"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Enter diagnosis"
                  placeholderTextColor="#95a5a6"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>
          {errors.diagnosis && (
            <Text style={styles.errorText}>{errors.diagnosis.message}</Text>
          )}
        </View>

        {/* Medicines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medicines</Text>
            <TouchableOpacity onPress={addMedicine}>
              <Icon name="plus-circle" size={24} color="#3498db" />
            </TouchableOpacity>
          </View>

          {fields.map((field, index) => (
            <View key={field.id} style={styles.medicineCard}>
              <View style={styles.medicineHeader}>
                <Text style={styles.medicineNumber}>Medicine #{index + 1}</Text>
                {index > 0 && (
                  <TouchableOpacity onPress={() => remove(index)}>
                    <Icon name="close-circle" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Medicine Name with Search */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Medicine Name *</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.medicines?.[index]?.name && styles.inputError,
                  ]}
                >
                  <Icon
                    name="pill"
                    size={20}
                    color="#95a5a6"
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name={`medicines.${index}.name`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="Search medicine"
                        placeholderTextColor="#95a5a6"
                        onBlur={onBlur}
                        onChangeText={(text) => {
                          onChange(text);
                          setMedicineSearch(text);
                          setMedicineSearchIndex(index);
                          setShowMedicineSuggestions(true);
                        }}
                        value={value}
                      />
                    )}
                  />
                </View>
                {errors.medicines?.[index]?.name && (
                  <Text style={styles.errorText}>
                    {errors.medicines[index].name.message}
                  </Text>
                )}

                {/* Medicine Suggestions */}
                {showMedicineSuggestions &&
                  medicineSearchIndex === index &&
                  medicineSearch.length >= 2 &&
                  medicineSuggestions?.data?.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      {medicineSuggestions.data.map((med, idx) => (
                        <TouchableOpacity
                          key={med._id}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setValue(`medicines.${index}.name`, med.name);
                            setValue(`medicines.${index}.form`, med.form);
                            if (med.strength) {
                              setValue(
                                `medicines.${index}.dosage`,
                                med.strength.value + med.strength.unit,
                              );
                            }
                            setShowMedicineSuggestions(false);
                            setMedicineSearch("");
                          }}
                        >
                          <Text style={styles.suggestionName}>{med.name}</Text>
                          <Text style={styles.suggestionForm}>{med.form}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
              </View>

              {/* Dosage and Form Row */}
              <View style={styles.rowContainer}>
                <View style={[styles.fieldContainer, styles.halfField]}>
                  <Text style={styles.label}>Dosage</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.medicines?.[index]?.dosage && styles.inputError,
                    ]}
                  >
                    <Controller
                      control={control}
                      name={`medicines.${index}.dosage`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., 10mg"
                          placeholderTextColor="#95a5a6"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      )}
                    />
                  </View>
                  {errors.medicines?.[index]?.dosage && (
                    <Text style={styles.errorText}>
                      {errors.medicines[index].dosage.message}
                    </Text>
                  )}
                </View>

                <View style={[styles.fieldContainer, styles.halfField]}>
                  <Text style={styles.label}>Form</Text>
                  <View style={styles.pickerContainer}>
                    <Controller
  control={control}
  name={`medicines.${index}.form`}
  render={({ field: { onChange, value } }) => {
    // Add this console.log to debug
    console.log(`Picker value for index ${index}:`, value);
    
    return (
      <Picker
        key={`form-picker-${index}-${value}`} // Add key to force re-render when value changes
        selectedValue={value || "tablet"} // Fallback to "tablet" if value is undefined
        style={styles.picker}
        onValueChange={onChange}
      >
        {medicineForms.map((form) => (
          <Picker.Item
            key={form.value}
            label={form.label}
            value={form.value}
          />
        ))}
      </Picker>
    );
  }}
/>
                  </View>
                </View>
              </View>

              {/* Frequency and Compartment Row */}
              <View style={styles.rowContainer}>
                <View style={[styles.fieldContainer, styles.halfField]}>
                  <Text style={styles.label}>Frequency</Text>
                  <View style={styles.pickerContainer}>
                    <Controller
                      control={control}
                      name={`medicines.${index}.frequency`}
                      render={({ field: { onChange, value } }) => (
                        <Picker
                          selectedValue={value}
                          style={styles.picker}
                          onValueChange={onChange}
                        >
                          {frequencies.map((freq) => (
                            <Picker.Item
                              key={freq.value}
                              label={freq.label}
                              value={freq.value}
                            />
                          ))}
                        </Picker>
                      )}
                    />
                  </View>
                </View>

                <View style={[styles.fieldContainer, styles.halfField]}>
                  <Text style={styles.label}>Compartment</Text>
                  <View style={styles.pickerContainer}>
                    <Controller
                      control={control}
                      name={`medicines.${index}.compartmentNumber`}
                      render={({ field: { onChange, value } }) => (
                        <Picker
                          selectedValue={value}
                          style={styles.picker}
                          onValueChange={onChange}
                        >
                          {compartments.map((comp) => (
                            <Picker.Item
                              key={comp.value}
                              label={comp.label}
                              value={comp.value}
                            />
                          ))}
                        </Picker>
                      )}
                    />
                  </View>
                </View>
              </View>

              {/* Times */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Times</Text>
                {watch(`medicines.${index}.times`)?.map((time, timeIndex) => (
                  <View key={timeIndex} style={styles.timeRow}>
                    <View style={styles.timePickerContainer}>
                      <Picker
                        selectedValue={time.time}
                        style={styles.timePicker}
                        onValueChange={(newTime) => {
                          const currentTimes = watch(
                            `medicines.${index}.times`,
                          );
                          const newTimes = [...currentTimes];
                          newTimes[timeIndex].time = newTime;
                          setValue(`medicines.${index}.times`, newTimes);
                        }}
                      >
                        {medicineTimes.map((t) => (
                          <Picker.Item
                            key={t.value}
                            label={t.label}
                            value={t.value}
                          />
                        ))}
                      </Picker>
                    </View>
                    {watch(`medicines.${index}.times`).length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeTimeFromMedicine(index, timeIndex)}
                      >
                        <Icon name="close" size={20} color="#e74c3c" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {watch(`medicines.${index}.times`).length < 4 && (
                  <TouchableOpacity
                    style={styles.addTimeButton}
                    onPress={() => addTimeToMedicine(index)}
                  >
                    <Icon name="plus" size={16} color="#3498db" />
                    <Text style={styles.addTimeText}>Add Time</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Quantity (Optional) */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Quantity (Optional)</Text>
                <View style={styles.inputContainer}>
                  <Icon
                    name="counter"
                    size={20}
                    color="#95a5a6"
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name={`medicines.${index}.quantity`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., 30 tablets"
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

              {/* Instructions */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Special Instructions</Text>
                <View style={styles.inputContainer}>
                  <Icon
                    name="note-text"
                    size={20}
                    color="#95a5a6"
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name={`medicines.${index}.instructions`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="e.g., Take with food"
                        placeholderTextColor="#95a5a6"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        multiline
                        numberOfLines={2}
                      />
                    )}
                  />
                </View>
              </View>
            </View>
          ))}
          {errors.medicines && !Array.isArray(errors.medicines) && (
            <Text style={styles.errorText}>{errors.medicines.message}</Text>
          )}
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <View style={styles.inputContainer}>
            <Icon
              name="note-text"
              size={20}
              color="#95a5a6"
              style={styles.inputIcon}
            />
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any additional instructions for the patient..."
                  placeholderTextColor="#95a5a6"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={3}
                />
              )}
            />
          </View>
        </View>
      </View>

      {/* Date Pickers */}
      {showStartDate && (
        <DateTimePicker
          value={watch("startDate")}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDate(false);
            if (selectedDate) {
              setValue("startDate", selectedDate);
            }
          }}
        />
      )}

      {showEndDate && (
        <DateTimePicker
          value={watch("endDate")}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDate(false);
            if (selectedDate) {
              setValue("endDate", selectedDate);
            }
          }}
        />
      )}


      <TouchableOpacity onPress={checkForm}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  saveText: {
    color: "#3498db",
    fontSize: 16,
    fontWeight: "600",
  },
  patientInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 20,
    marginTop: 10,
    marginBottom: 0,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  patientInfo: {
    marginLeft: 15,
    flex: 1,
  },
  patientInfoName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  patientInfoDetails: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  form: {
    padding: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  datePicker: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2c3e50",
  },
  medicineCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  medicineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  medicineNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3498db",
  },
  fieldContainer: {
    marginBottom: 15,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfField: {
    width: "48%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2c3e50",
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputIcon: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 10,
    fontSize: 14,
    color: "#2c3e50",
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 5,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timePickerContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginRight: 10,
    overflow: "hidden",
  },
  timePicker: {
    height: 45,
  },
  addTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  addTimeText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#3498db",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 5,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  suggestionName: {
    fontSize: 14,
    color: "#2c3e50",
  },
  suggestionForm: {
    fontSize: 12,
    color: "#7f8c8d",
  },
});
