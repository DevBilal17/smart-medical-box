import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../../../src/hooks/useAuth";
import {
  useGetPatientProfileQuery,
  useUpdateProfilePictureMutation,
} from "../../../../src/store/api/patientApi";
import { useGetDeviceStatusQuery } from "../../../../src/store/api/deviceApi";
import { useGetUnreadCountQuery } from "../../../../src/store/api/alertApi";
import Loading from "../../../../src/components/Loading";

export default function Profile() {
  const { user, logout } = useAuth();
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading: profileLoading } =
    useGetPatientProfileQuery();
    // console.log(profile)
  const { data: deviceStatus } = useGetDeviceStatusQuery(undefined, {
    skip: !user?.deviceId,
  });
  const { data: unreadCount } = useGetUnreadCountQuery();
  const [updateProfilePicture] = useUpdateProfilePictureMutation();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("profilePicture", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "profile.jpg",
        });

        await updateProfilePicture(formData).unwrap();
        Alert.alert("Success", "Profile picture updated");
      } catch (error) {
        Alert.alert("Error", "Failed to update profile picture");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: logout,
        style: "destructive",
      },
    ]);
  };

  const menuItems = [
    {
      icon: "account",
      title: "Personal Information",
      subtitle: "View and edit your personal details",
      route: "/(app)/(patient)/profile/edit",
      badge: null,
    },
    // {
    //   icon: "doctor",
    //   title: "My Doctor",
    //   subtitle: profile?.assignedDoctor?.name || "No doctor assigned",
    //   route: profile?.assignedDoctor ? "/(app)/(patient)/profile/doctor" : null,
    //   badge: null,
    // },
    // {
    //   icon: 'bell',
    //   title: 'Notifications',
    //   subtitle: 'Manage notification preferences',
    //   route: '/(app)/(patient)/profile/notifications',
    //   badge: unreadCount > 0 ? unreadCount : null,
    // },
    // {
    //   icon: 'shield-lock',
    //   title: 'Privacy & Security',
    //   subtitle: 'Manage your privacy settings',
    //   route: '/(app)/(patient)/profile/privacy',
    //   badge: null,
    // },
    // {
    //   icon: 'help-circle',
    //   title: 'Help & Support',
    //   subtitle: 'Get help with the app',
    //   route: '/(app)/(patient)/profile/help',
    //   badge: null,
    // },
    // {
    //   icon: 'information',
    //   title: 'About',
    //   subtitle: 'App version 1.0.0',
    //   route: '/(app)/(patient)/profile/about',
    //   badge: null,
    // },
  ];

  if (profileLoading) {
    return <Loading />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Cover */}
      <LinearGradient colors={["#3498db", "#2980b9"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Profile Image Section */}
      <View style={styles.profileSection}>
        <TouchableOpacity
          // onPress={pickImage}
          style={styles.imageContainer}
          disabled={uploading}
        >
          <View style={styles.imageContainer}>
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          {/* <View style={styles.editBadge}>
            <Icon name="camera" size={16} color="#fff" />
          </View> */}
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        {/* Device Status */}
        {user?.deviceId && (
          <View style={styles.deviceStatus}>
            <View
              style={[
                styles.deviceDot,
                {
                  backgroundColor:
                    deviceStatus?.status === "online" ? "#2ecc71" : "#e74c3c",
                },
              ]}
            />
            <Text style={styles.deviceText}>
              Device:{" "}
              {deviceStatus?.status === "online" ? "Connected" : "Offline"}
            </Text>
          </View>
        )}
      </View>

      {/* Stats Cards */}
      {/* <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="calendar" size={24} color="#3498db" />
          <Text style={styles.statValue}>
            {profile?.stats?.daysActive || 0}
          </Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="heart" size={24} color="#e74c3c" />
          <Text style={styles.statValue}>
            {profile?.stats?.totalReadings || 0}
          </Text>
          <Text style={styles.statLabel}>Readings</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="pill" size={24} color="#2ecc71" />
          <Text style={styles.statValue}>
            {profile?.stats?.adherenceRate || 0}%
          </Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
      </View> */}

      {/* Quick Info */}
      <View style={styles.quickInfo}>
        <View style={styles.infoRow}>
          <Icon name="phone" size={20} color="#7f8c8d" />
          <Text style={styles.infoText}>
            {profile?.phone || "Not provided"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="cake-variant" size={20} color="#7f8c8d" />
          <Text style={styles.infoText}>
            {profile?.age ? `${profile.age} years` : "Not provided"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="gender-male-female" size={20} color="#7f8c8d" />
          <Text style={styles.infoText}>
            {profile?.gender
              ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
              : "Not provided"}
          </Text>
        </View>
        
        {profile?.bloodGroup && (
          <View style={styles.infoRow}>
            <Icon name="water" size={20} color="#7f8c8d" />
            <Text style={styles.infoText}>
              Blood Group: {profile.bloodGroup}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Icon name="doctor" size={20} color="#7f8c8d" />
          <Text style={styles.infoText}>
            {profile?.assignedDoctor
              ? "Dr. "  + profile.assignedDoctor.name 
              : "Not provided"}
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, !item.route && styles.menuItemDisabled]}
            onPress={() => item.route && router.push(item.route)}
            disabled={!item.route}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: "#3498db20" }]}>
                <Icon name={item.icon} size={24} color="#3498db" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <View style={styles.menuItemRight}>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              {item.route && (
                <Icon name="chevron-right" size={24} color="#95a5a6" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color="#e74c3c" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.copyright}>© {new Date().getFullYear()} Smart Medical Box v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    height: 120,
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    marginTop: -50,
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  placeholderText: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
  },
  uploadingContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  editBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#3498db",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 5,
  },
  userEmail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 5,
  },
  deviceStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  deviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deviceText: {
    fontSize: 12,
    color: "#2c3e50",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  quickInfo: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#2c3e50",
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e74c3c30",
    marginTop: 20,
    marginBottom: 10,
  },
  logoutText: {
    color: "#e74c3c",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  copyright: {
    textAlign: "center",
    color: "#7f8c8d",
    fontSize: 12,
    marginBottom: 20,
  },
});
