import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGetNotificationSettingsQuery, useUpdateNotificationSettingsMutation } from '../../../../src/store/api/notificationApi';
import Loading from '../../../../src/components/Loading';

export default function Settings() {
  const { data: settings, isLoading } = useGetNotificationSettingsQuery();
  const [updateSettings] = useUpdateNotificationSettingsMutation();

  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    medicineReminders: true,
    healthAlerts: true,
    appointmentReminders: true,
    quietHours: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });

  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);

  const handleToggle = async (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    
    try {
      await updateSettings({ [key]: value }).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
      setNotifications(prev => ({ ...prev, [key]: !value }));
    }
  };

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        {
          icon: 'bell',
          title: 'Push Notifications',
          type: 'switch',
          value: notifications.push,
          onValueChange: (val) => handleToggle('push', val),
        },
        {
          icon: 'email',
          title: 'Email Notifications',
          type: 'switch',
          value: notifications.email,
          onValueChange: (val) => handleToggle('email', val),
        },
        {
          icon: 'message',
          title: 'SMS Notifications',
          type: 'switch',
          value: notifications.sms,
          onValueChange: (val) => handleToggle('sms', val),
        },
      ],
    },
    {
      title: 'Reminder Settings',
      items: [
        {
          icon: 'pill',
          title: 'Medicine Reminders',
          type: 'switch',
          value: notifications.medicineReminders,
          onValueChange: (val) => handleToggle('medicineReminders', val),
        },
        {
          icon: 'heart',
          title: 'Health Alerts',
          type: 'switch',
          value: notifications.healthAlerts,
          onValueChange: (val) => handleToggle('healthAlerts', val),
        },
        {
          icon: 'calendar',
          title: 'Appointment Reminders',
          type: 'switch',
          value: notifications.appointmentReminders,
          onValueChange: (val) => handleToggle('appointmentReminders', val),
        },
        {
          icon: 'clock-outline',
          title: 'Quiet Hours',
          type: 'switch',
          value: notifications.quietHours,
          onValueChange: (val) => handleToggle('quietHours', val),
        },
      ],
    },
    {
      title: 'App Preferences',
      items: [
        {
          icon: 'theme-light-dark',
          title: 'Dark Mode',
          type: 'switch',
          value: darkMode,
          onValueChange: setDarkMode,
        },
        {
          icon: 'sync',
          title: 'Auto Sync Data',
          type: 'switch',
          value: autoSync,
          onValueChange: setAutoSync,
        },
        {
          icon: 'database',
          title: 'Data Saver Mode',
          type: 'switch',
          value: dataSaver,
          onValueChange: setDataSaver,
        },
        {
          icon: 'translate',
          title: 'Language',
          type: 'select',
          value: 'English',
          onPress: () => Alert.alert('Coming Soon', 'Language selection will be available soon'),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: 'lock',
          title: 'Change Password',
          type: 'action',
          onPress: () => Alert.alert('Coming Soon', 'Change password feature coming soon'),
        },
        {
          icon: 'fingerprint',
          title: 'Biometric Login',
          type: 'switch',
          value: false,
          onValueChange: () => Alert.alert('Coming Soon', 'Biometric login coming soon'),
        },
        {
          icon: 'history',
          title: 'Login History',
          type: 'action',
          onPress: () => Alert.alert('Coming Soon', 'Login history coming soon'),
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          icon: 'database-export',
          title: 'Export My Data',
          type: 'action',
          onPress: () => Alert.alert('Export', 'Your data export will be prepared'),
        },
        {
          icon: 'backup-restore',
          title: 'Backup & Restore',
          type: 'action',
          onPress: () => Alert.alert('Coming Soon', 'Backup feature coming soon'),
        },
        {
          icon: 'delete',
          title: 'Clear Cache',
          type: 'action',
          onPress: () => Alert.alert(
            'Clear Cache',
            'This will clear all temporary data. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', onPress: () => Alert.alert('Success', 'Cache cleared') }
            ]
          ),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information',
          title: 'App Version',
          type: 'info',
          value: '1.0.0',
        },
        {
          icon: 'license',
          title: 'Terms of Service',
          type: 'link',
          onPress: () => Alert.alert('Terms', 'Terms of Service will be shown here'),
        },
        {
          icon: 'shield',
          title: 'Privacy Policy',
          type: 'link',
          onPress: () => Alert.alert('Privacy', 'Privacy Policy will be shown here'),
        },
        {
          icon: 'star',
          title: 'Rate the App',
          type: 'action',
          onPress: () => Alert.alert('Rate', 'Opening app store...'),
        },
        {
          icon: 'help-circle',
          title: 'Help & Support',
          type: 'action',
          onPress: () => Alert.alert('Support', 'Contact support at support@smartmedicalbox.com'),
        },
      ],
    },
  ];

  const renderSettingItem = (item, index) => {
    switch (item.type) {
      case 'switch':
        return (
          <View key={index} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name={item.icon} size={24} color={item.danger ? '#e74c3c' : '#3498db'} />
              <Text style={[styles.settingTitle, item.danger && styles.dangerText]}>
                {item.title}
              </Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onValueChange}
              trackColor={{ false: '#bdc3c7', true: '#3498db' }}
              thumbColor="#fff"
            />
          </View>
        );

      case 'select':
        return (
          <TouchableOpacity key={index} style={styles.settingItem} onPress={item.onPress}>
            <View style={styles.settingLeft}>
              <Icon name={item.icon} size={24} color="#3498db" />
              <Text style={styles.settingTitle}>{item.title}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{item.value}</Text>
              <Icon name="chevron-right" size={20} color="#95a5a6" />
            </View>
          </TouchableOpacity>
        );

      case 'action':
        return (
          <TouchableOpacity 
            key={index} 
            style={styles.settingItem} 
            onPress={item.onPress}
          >
            <View style={styles.settingLeft}>
              <Icon name={item.icon} size={24} color={item.danger ? '#e74c3c' : '#3498db'} />
              <Text style={[styles.settingTitle, item.danger && styles.dangerText]}>
                {item.title}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color="#95a5a6" />
          </TouchableOpacity>
        );

      case 'info':
        return (
          <View key={index} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Icon name={item.icon} size={24} color="#3498db" />
              <Text style={styles.settingTitle}>{item.title}</Text>
            </View>
            <Text style={styles.settingValue}>{item.value}</Text>
          </View>
        );

      case 'link':
        return (
          <TouchableOpacity key={index} style={styles.settingItem} onPress={item.onPress}>
            <View style={styles.settingLeft}>
              <Icon name={item.icon} size={24} color="#3498db" />
              <Text style={styles.settingTitle}>{item.title}</Text>
            </View>
            <Icon name="open-in-new" size={20} color="#95a5a6" />
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {settingSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
          </View>
        </View>
      ))}

      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
        <TouchableOpacity 
          style={styles.dangerButton}
          onPress={() => Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be permanently deleted.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Delete Account', 
                style: 'destructive',
                onPress: () => Alert.alert('Account Deletion', 'Please contact support to delete your account')
              }
            ]
          )}
        >
          <Icon name="delete-forever" size={24} color="#e74c3c" />
          <Text style={styles.dangerButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.copyright}>© 2024 Smart Medical Box. All rights reserved.</Text>
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
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginLeft: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    marginLeft: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 5,
  },
  dangerText: {
    color: '#e74c3c',
  },
  dangerZone: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c20',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  dangerButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  copyright: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 12,
    marginVertical: 30,
  },
});