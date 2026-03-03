import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRegisterMutation } from '../../src/store/api/authApi';
import { registerSchema } from '../../src/utils/validators';

export default function Register() {
  const [register, { isLoading }] = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'patient',
      phone: '',
      age: '',
      gender: 'male',
    },
  });

  const onSubmit = async (data) => {
    try {
      const response = await register(data).unwrap();
      
      Alert.alert('Success', 'Registration successful!', [
        {
          text: 'OK',
          onPress: () => {
            if (response.user.role === 'patient') {
              router.replace('/(app)/(patient)');
            } else {
              router.replace('/(app)/(doctor)');
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error.data?.message || 'Please check your information and try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#3498db', '#2980b9']}
          style={styles.header}
        >
          <Icon name="account-plus" size={60} color="#fff" />
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Join Smart Medical Box</Text>
        </LinearGradient>

        <View style={styles.form}>
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name</Text>
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
                  />
                )}
              />
            </View>
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Icon name="email" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
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

          {/* Phone Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Phone Number</Text>
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
                  />
                )}
              />
            </View>
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            )}
          </View>

          {/* Age and Gender Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Age</Text>
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
                    />
                  )}
                />
              </View>
              {errors.age && (
                <Text style={styles.errorText}>{errors.age.message}</Text>
              )}
            </View>

            <View style={[styles.fieldContainer, styles.halfField]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerContainer}>
                <Icon name="gender-male-female" size={20} color="#95a5a6" style={styles.inputIcon} />
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <Picker
                      selectedValue={value}
                      style={styles.picker}
                      onValueChange={onChange}
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

          {/* Role Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>I am a</Text>
            <View style={styles.pickerContainer}>
              <Icon name="account-switch" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    selectedValue={value}
                    style={styles.picker}
                    onValueChange={onChange}
                  >
                    <Picker.Item label="Patient" value="patient" />
                    <Picker.Item label="Doctor" value="doctor" />
                  </Picker>
                )}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <Icon name="lock" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showPassword}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#95a5a6" 
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          {/* Confirm Password Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
              <Icon name="lock-check" size={20} color="#95a5a6" style={styles.inputIcon} />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#95a5a6"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showConfirmPassword}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#95a5a6" 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
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
  eyeIcon: {
    paddingHorizontal: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    flex: 1,
    height: 50,
  },
  registerButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  loginLink: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
  },
});