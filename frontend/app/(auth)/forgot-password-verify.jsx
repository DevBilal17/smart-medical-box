import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVerifyOTPMutation } from '../../src/store/api/authApi';

export default function ForgotPasswordVerify() {
  const params = useLocalSearchParams();
  const [verifyOTP, { isLoading }] = useVerifyOTPMutation();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRefs = useRef([]);
    // Load email on component mount
  useEffect(() => {
    loadEmail();
  }, []);
  
  // Focus first input after email is loaded
  useEffect(() => {
    if (!loading && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [loading]);
  const loadEmail = async () => {
    try {
      // First try to get from params
      if (params.email) {
        setEmail(params.email);
      } else {
        // If not in params, get from storage
        const storedEmail = await getItem('userEmail');
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          // No email found, go back to request screen
          Alert.alert(
            'Session Expired',
            'Please start the password reset process again.',
            [
              { 
                text: 'OK', 
                onPress: () => router.replace('/(auth)/forgot-password-request') 
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error loading email:', error);
      Alert.alert('Error', 'Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    
    // Handle paste (if user pastes multiple digits)
    if (text.length > 1) {
      const pastedCode = text.slice(0, 4).split('');
      for (let i = 0; i < 4; i++) {
        newOtp[i] = pastedCode[i] || '';
      }
      setOtp(newOtp);
      
      // Focus last filled input or next empty
      const lastFilledIndex = Math.min(3, pastedCode.length - 1);
      if (inputRefs.current[lastFilledIndex + 1]) {
        inputRefs.current[lastFilledIndex + 1].focus();
      }
      return;
    }

    // Normal single digit input
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    try {
      await verifyOTP({ email, otp: otpString }).unwrap();
      // Navigate to reset password screen
      router.push({
        pathname: '/(auth)/forgot-password-reset',
        params: { email }
      });
    } catch (error) {
      Alert.alert('Error', error?.data?.message || 'Invalid OTP');
    }
  };

  const handleResend = () => {
    // Implement resend logic
    Alert.alert('Success', 'New code has been sent to your email');
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.title}>Verify Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Icon name="email-check" size={60} color="#3498db" style={styles.icon} />
        
        <Text style={styles.verifyText}>
          Enter the 4-digit code sent to
        </Text>
        <Text style={styles.emailText}>{email}</Text>

        <View style={styles.codeContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
                isOtpComplete && styles.codeInputComplete
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, (!isOtpComplete || isLoading) && styles.disabledButton]}
          onPress={handleVerify}
          disabled={!isOtpComplete || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={isLoading}>
          <Text style={styles.resendText}>Resend Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  verifyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  codeInput: {
    width: 60,
    height: 70,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginHorizontal: 6,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    backgroundColor: '#fff',
  },
  codeInputFilled: {
    borderColor: '#3498db',
    backgroundColor: '#f0f8ff',
  },
  codeInputComplete: {
    borderColor: '#27ae60',
  },
  verifyButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendText: {
    color: '#3498db',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});