import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import moment from "moment";
import { useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useGetDoctorPrescriptionsQuery } from "../../../../src/store/api/doctorApi";
import Loading from "../../../../src/components/Loading";
import EmptyState from "../../../../src/components/EmptyState";

export default function PrescriptionsList() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, completed, cancelled

  const {
    data: prescriptionsData,
    isLoading,
    refetch,
  } = useGetDoctorPrescriptionsQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
    page: 1,
    limit: 50,
  });

  const prescriptions = prescriptionsData?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#2ecc71";
      case "completed":
        return "#3498db";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return "check-circle";
      case "completed":
        return "clock-check";
      case "cancelled":
        return "close-circle";
      default:
        return "file-document";
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      p.patientId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header,{}]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>Prescriptions</Text>
        <TouchableOpacity
          onPress={() => router.push("/(app)/(doctor)/prescriptions/new")}
        >
          {/* <Icon name="plus" size={24} color="#3498db" /> */}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon
          name="magnify"
          size={20}
          color="#95a5a6"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name or diagnosis..."
          placeholderTextColor="#95a5a6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="close" size={20} color="#95a5a6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {["all", "active", "completed"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              filterStatus === status && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterStatus === status && styles.filterChipTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{prescriptions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: "#2ecc71" }]}>
            {prescriptions.filter((p) => p.status === "active").length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: "#3498db" }]}>
            {prescriptions.filter((p) => p.status === "completed").length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPrescriptions.length > 0 ? (
          filteredPrescriptions.map((prescription) => (
            <TouchableOpacity
              key={prescription._id}
              style={styles.prescriptionCard}
              onPress={() =>
                router.push({
                  pathname: "/(app)/(doctor)/prescriptions/[id]",
                  params: { id: prescription.id },
                })
              }
            >
              <LinearGradient
                colors={["#ffffff", "#f9f9f9"]}
                style={styles.cardGradient}
              >
                <View style={styles.prescriptionHeader}>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>
                      {prescription.patientId?.name || "Unknown Patient"}
                    </Text>
                    <Text style={styles.prescriptionDate}>
                      {moment(prescription.createdAt).format("MMM D, YYYY")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(prescription.status) },
                    ]}
                  >
                    <Icon
                      name={getStatusIcon(prescription.status)}
                      size={12}
                      color="#fff"
                    />
                    <Text style={styles.statusText}>
                      {prescription.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.diagnosis} numberOfLines={2}>
                  {prescription.diagnosis}
                </Text>

                <View style={styles.medicinesList}>
                  {prescription.medicines
                    ?.slice(0, 3)
                    .map((medicine, index) => (
                      <View key={index} style={styles.medicineItem}>
                        <View style={styles.medicineDot} />
                        <Text style={styles.medicineName} numberOfLines={1}>
                          {medicine.name}
                        </Text>
                        <Text style={styles.medicineDosage}>
                          {medicine.dosage}
                        </Text>
                      </View>
                    ))}
                  {prescription.medicines?.length > 3 && (
                    <Text style={styles.moreText}>
                      +{prescription.medicines.length - 3} more
                    </Text>
                  )}
                </View>

                <View style={styles.prescriptionFooter}>
                  <View style={styles.footerItem}>
                    <Icon name="calendar" size={14} color="#7f8c8d" />
                    <Text style={styles.footerText}>
                      {moment(prescription.startDate).format("MMM D")} -{" "}
                      {moment(prescription.endDate).format("MMM D, YYYY")}
                    </Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Icon name="refresh" size={14} color="#7f8c8d" />
                    <Text style={styles.footerText}>
                      Refills: {prescription.refills || 0}
                    </Text>
                  </View>
                </View>

                {prescription.notes && (
                  <View style={styles.notesContainer}>
                    <Icon name="note-text" size={14} color="#7f8c8d" />
                    <Text style={styles.notesText} numberOfLines={1}>
                      {prescription.notes}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon="file-document-outline"
            title="No Prescriptions"
            message={
              searchQuery
                ? `No prescriptions matching "${searchQuery}"`
                : "You haven't created any prescriptions yet"
            }
            buttonText={searchQuery ? "Clear Search" : "Create Prescription"}
            onPress={
              searchQuery
                ? () => setSearchQuery("")
                : () => router.push("/(app)/(doctor)/prescriptions/new")
            }
          />
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {/* <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(app)/(doctor)/prescriptions/new")}
      >
        <LinearGradient
          colors={["#3498db", "#2980b9"]}
          style={styles.fabGradient}
        >
          <Icon name="plus" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity> */}
    </View>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 20,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2c3e50",
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2c3e50",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  statLabel: {
    fontSize: 10,
    color: "#7f8c8d",
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  prescriptionCard: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    padding: 15,
  },
  prescriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 2,
  },
  prescriptionDate: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  diagnosis: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 10,
    lineHeight: 20,
  },
  medicinesList: {
    marginBottom: 10,
  },
  medicineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  medicineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3498db",
    marginRight: 8,
  },
  medicineName: {
    flex: 1,
    fontSize: 13,
    color: "#2c3e50",
  },
  medicineDosage: {
    fontSize: 12,
    color: "#7f8c8d",
    marginLeft: 8,
  },
  moreText: {
    fontSize: 12,
    color: "#3498db",
    marginTop: 2,
  },
  prescriptionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    marginLeft: 4,
    fontSize: 11,
    color: "#7f8c8d",
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 5,
  },
  notesText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#7f8c8d",
    flex: 1,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
