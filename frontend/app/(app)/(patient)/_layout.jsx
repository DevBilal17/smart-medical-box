import { Tabs } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelPosition: 'below-icon', // Force labels below icons
        tabBarLabelStyle: {
          fontSize: 11, // Smaller font for more tabs
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="health/index"
        options={{
          title: 'Health',
          tabBarIcon: ({ color, size }) => (
            <Icon name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="health/add" options={{ href: null }} />
      <Tabs.Screen
        name="medicines/index" // Add this
        options={{
          title: 'Medicines',
          tabBarIcon: ({ color, size }) => (
            <Icon name="pill" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="medicines/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="alerts/index" // Add this
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="device/index" // Add this
        options={{
          title: 'Device',
          tabBarIcon: ({ color, size }) => (
            <Icon name="devices" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="device/pair" options={{ href: null }} />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="profile/settings" options={{ href: null }} />
    </Tabs>
  );
}