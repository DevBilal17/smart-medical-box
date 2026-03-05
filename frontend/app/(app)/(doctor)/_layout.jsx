import { Tabs } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useGetUnreadCountQuery } from "../../../src/store/api/alertApi";


export default function DoctorLayout() {
  const { data: unreadCount = 0 } = useGetUnreadCountQuery();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3498db",
        tabBarInactiveTintColor: "#95a5a6",
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients/index"
        options={{
          title: "Patients",
          tabBarIcon: ({ color, size }) => (
            <Icon name="account-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="patients/[id]" options={{ href: null }} />
      <Tabs.Screen name="patients/add" options={{ href: null }} />
      <Tabs.Screen
        name="prescriptions/index"
        options={{
          title: "Prescriptions",
          tabBarIcon: ({ color, size }) => (
            <Icon name="file-document" size={size} color={color} />
          ),
        }}
      />
     <Tabs.Screen name="prescriptions/new" options={{ href: null }} /> 
        <Tabs.Screen
        name="medicines/index"
        options={{
          title: "Medicines",
          tabBarIcon: ({ color, size }) => (
            <Icon name="pill" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="medicines/add" options={{ href: null }} /> 
      <Tabs.Screen
        name="alerts/index"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell" size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tabs>
  );
}
