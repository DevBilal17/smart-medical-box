import { router } from "expo-router";
import moment from "moment";
import { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  useGetAlertsQuery,
  useGetUnreadCountQuery,
  useMarkMultipleAsReadMutation,
  useUpdateAlertMutation,
} from "../../../../src/store/api/alertApi";
import EmptyState from "../../../../src/components/EmptyState";
import Loading from "../../../../src/components/Loading";

export default function DoctorAlerts() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [severityFilter, setSeverityFilter] = useState("all"); // all, critical, warning, info
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const {
    data: alertsResponse,
    isLoading,
    refetch,
  } = useGetAlertsQuery({
    status: filter === "all" ? undefined : filter,
    severity: severityFilter === "all" ? undefined : severityFilter,
    page: 1,
    limit: 100,
  });

  const { data: unreadCount = 0, refetch: refetchCount } =
    useGetUnreadCountQuery();
  const [updateAlert] = useUpdateAlertMutation();
  const [markMultipleAsRead] = useMarkMultipleAsReadMutation();

  const alerts = alertsResponse?.data || [];
  const counts = alertsResponse?.counts || { total: 0, bySeverity: {} };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchCount()]);
    setRefreshing(false);
  };

  const handleAlertPress = (alert) => {
    if (isSelectionMode) {
      toggleAlertSelection(alert.id);
    } else {
      if (alert.status === "unread") {
        handleMarkRead(alert.id);
      }

      // Navigate to patient details if available
      if (alert.patientId) {
        router.push({
          pathname: "/(app)/(doctor)/patients/[id]",
          params: { id: alert.patientId._id || alert.patientId },
        });
      }
    }
  };

  const handleMarkRead = async (alertId) => {
    try {
      await updateAlert({ id: alertId, status: "read" }).unwrap();
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await updateAlert({
        id: alertId,
        status: "acknowledged",
        notes: "Acknowledged by doctor",
      }).unwrap();
      Alert.alert("Success", "Alert acknowledged");
    } catch (error) {
      Alert.alert("Error", "Failed to acknowledge alert");
    }
  };

  const handleResolve = async (alertId) => {
    Alert.alert("Resolve Alert", "Mark this alert as resolved?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve",
        onPress: async () => {
          try {
            await updateAlert({
              id: alertId,
              status: "resolved",
              notes: "Resolved by doctor",
            }).unwrap();
            Alert.alert("Success", "Alert resolved");
          } catch (error) {
            Alert.alert("Error", "Failed to resolve alert");
          }
        },
      },
    ]);
  };

  const toggleAlertSelection = (alertId) => {
    setSelectedAlerts((prev) => {
      if (prev.includes(alertId)) {
        return prev.filter((id) => id !== alertId);
      } else {
        return [...prev, alertId];
      }
    });
  };

  const handleLongPress = (alert) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedAlerts([alert.id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map((a) => a.id));
    }
  };

  const handleBulkMarkRead = async () => {
    if (selectedAlerts.length === 0) return;

    Alert.alert(
      "Mark as Read",
      `Mark ${selectedAlerts.length} alert(s) as read?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Read",
          onPress: async () => {
            try {
              await markMultipleAsRead(selectedAlerts).unwrap();
              setSelectedAlerts([]);
              setIsSelectionMode(false);
              onRefresh();
              Alert.alert("Success", "Alerts marked as read");
            } catch (error) {
              Alert.alert("Error", "Failed to mark alerts as read");
            }
          },
        },
      ],
    );
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedAlerts([]);
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "heart_rate_high":
      case "heart_rate_low":
        return { name: "heart", color: "#e74c3c" };
      case "blood_pressure_high":
      case "blood_pressure_low":
        return { name: "water", color: "#f39c12" };
      case "oxygen_low":
        return { name: "lungs", color: "#3498db" };
      case "missed_medicine":
        return { name: "pill", color: "#9b59b6" };
      case "device_offline":
        return { name: "wifi-off", color: "#95a5a6" };
      case "low_battery":
        return { name: "battery-low", color: "#f39c12" };
      case "emergency":
        return { name: "alert", color: "#e74c3c" };
      default:
        return { name: "bell", color: "#3498db" };
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#e74c3c";
      case "warning":
        return "#f39c12";
      case "info":
        return "#3498db";
      default:
        return "#95a5a6";
    }
  };

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            isSelectionMode ? exitSelectionMode() : router.back()
          }
        >
          <Icon
            name={isSelectionMode ? "close" : "arrow-left"}
            size={24}
            color="#2c3e50"
          />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isSelectionMode ? `${selectedAlerts.length} selected` : "Alerts"}
        </Text>
        {isSelectionMode ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleSelectAll}
              style={styles.headerAction}
            >
              <Text style={styles.headerActionText}>
                {selectedAlerts.length === alerts.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsSelectionMode(true)}>
            <Icon name="dots-vertical" size={24} color="#3498db" />
          </TouchableOpacity>
        )}
      </View>

      {/* Selection Mode Actions */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity
            style={styles.selectionAction}
            onPress={handleBulkMarkRead}
          >
            <Icon name="check-all" size={20} color="#3498db" />
            <Text style={styles.selectionActionText}>Mark Read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Tabs */}
      {!isSelectionMode && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {["all", "unread", "read"].map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterTab,
                  filter === f && styles.filterTabActive,
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f && styles.filterTextActive,
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "unread" && unreadCount > 0 && ` (${unreadCount})`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Severity Filters */}
          <View style={styles.severityContainer}>
            {["all", "critical", "warning", "info"].map((sev) => (
              <TouchableOpacity
                key={sev}
                style={[
                  styles.severityChip,
                  severityFilter === sev && styles.severityChipActive,
                  {
                    borderColor:
                      sev !== "all" ? getSeverityColor(sev) : "#3498db",
                  },
                ]}
                onPress={() => setSeverityFilter(sev)}
              >
                <Text
                  style={[
                    styles.severityChipText,
                    severityFilter === sev && styles.severityChipTextActive,
                    {
                      color:
                        sev !== "all" && severityFilter !== sev
                          ? getSeverityColor(sev)
                          : "#2c3e50",
                    },
                  ]}
                >
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Summary Stats */}
      {!isSelectionMode && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{counts.total || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: "#e74c3c" }]}>
              {counts.bySeverity?.critical || 0}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: "#f39c12" }]}>
              {counts.bySeverity?.warning || 0}
            </Text>
            <Text style={styles.statLabel}>Warning</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: "#3498db" }]}>
              {counts.bySeverity?.info || 0}
            </Text>
            <Text style={styles.statLabel}>Info</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const icon = getAlertIcon(alert.type);
            const severityColor = getSeverityColor(alert.severity);
            const isSelected = selectedAlerts.includes(alert.id);

            return (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  alert.status === "unread" && styles.unreadCard,
                  isSelected && styles.selectedCard,
                ]}
                onPress={() => handleAlertPress(alert)}
                onLongPress={() => handleLongPress(alert)}
                delayLongPress={500}
              >
                {isSelectionMode && (
                  <View style={styles.checkbox}>
                    <Icon
                      name={
                        isSelected
                          ? "checkbox-marked"
                          : "checkbox-blank-outline"
                      }
                      size={24}
                      color={isSelected ? "#3498db" : "#bdc3c7"}
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.alertIcon,
                    { backgroundColor: icon.color + "20" },
                  ]}
                >
                  <Icon name={icon.name} size={24} color={icon.color} />
                </View>

                <View
                  style={[
                    styles.alertContent,
                    isSelectionMode && styles.alertContentWithCheckbox,
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <View style={styles.alertTitleContainer}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      {alert.patientId && (
                        <Text style={styles.patientName}>
                          {typeof alert.patientId === "object"
                            ? alert.patientId.name
                            : "Patient"}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.alertTime}>
                      {moment(alert.createdAt).fromNow()}
                    </Text>
                  </View>

                  <Text style={styles.alertMessage}>{alert.message}</Text>

                  <View style={styles.alertFooter}>
                    <View
                      style={[
                        styles.severityBadge,
                        { backgroundColor: severityColor + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.severityText, { color: severityColor }]}
                      >
                        {alert.severity?.toUpperCase()}
                      </Text>
                    </View>

                    {alert.status === "unread" && (
                      <View style={styles.unreadDot} />
                    )}

                    {!isSelectionMode && alert.status !== "resolved" && (
                      <View style={styles.actionButtons}>
                        {alert.status === "unread" && (
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleMarkRead(alert.id)}
                          >
                            <Text style={styles.actionButtonText}>
                              Mark Read
                            </Text>
                          </TouchableOpacity>
                        )}
                        {alert.status === "read" && (
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              styles.acknowledgeButton,
                            ]}
                            onPress={() => handleAcknowledge(alert.id)}
                          >
                            <Text style={styles.acknowledgeButtonText}>
                              Acknowledge
                            </Text>
                          </TouchableOpacity>
                        )}
                        {alert.status === "acknowledged" && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.resolveButton]}
                            onPress={() => handleResolve(alert.id)}
                          >
                            <Text style={styles.resolveButtonText}>
                              Resolve
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Alert Data */}
                  {alert.data && (
                    <View style={styles.dataContainer}>
                      {alert.data.heartRate && (
                        <View style={styles.dataItem}>
                          <Icon name="heart" size={12} color="#e74c3c" />
                          <Text style={styles.dataText}>
                            {alert.data.heartRate} bpm
                          </Text>
                        </View>
                      )}
                      {alert.data.systolic && alert.data.diastolic && (
                        <View style={styles.dataItem}>
                          <Icon name="water" size={12} color="#3498db" />
                          <Text style={styles.dataText}>
                            {alert.data.systolic}/{alert.data.diastolic}
                          </Text>
                        </View>
                      )}
                      {alert.data.oxygenLevel && (
                        <View style={styles.dataItem}>
                          <Icon name="lungs" size={12} color="#2ecc71" />
                          <Text style={styles.dataText}>
                            {alert.data.oxygenLevel}%
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <EmptyState
            icon="bell-off"
            title="No Alerts"
            message={
              filter === "all"
                ? "You don't have any alerts"
                : `No ${filter} alerts`
            }
          />
        )}
      </ScrollView>
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
  headerActions: {
    flexDirection: "row",
  },
  headerAction: {
    marginLeft: 15,
  },
  headerActionText: {
    color: "#3498db",
    fontSize: 14,
  },
  selectionBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  selectionAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  selectionActionText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#2c3e50",
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ecf0f1",
    marginRight: 10,
  },
  filterTabActive: {
    backgroundColor: "#3498db",
  },
  filterText: {
    fontSize: 14,
    color: "#2c3e50",
  },
  filterTextActive: {
    color: "#fff",
  },
  severityContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  severityChip: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    marginRight: 10,
  },
  severityChipActive: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  severityChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  severityChipTextActive: {
    color: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
    padding: 20,
  },
  alertCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  selectedCard: {
    backgroundColor: "#3498db10",
    borderWidth: 2,
    borderColor: "#3498db",
  },
  checkbox: {
    marginRight: 10,
    justifyContent: "center",
  },
  alertIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  alertContent: {
    flex: 1,
    marginLeft: 15,
  },
  alertContentWithCheckbox: {
    marginLeft: 0,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  patientName: {
    fontSize: 13,
    color: "#3498db",
    marginTop: 2,
  },
  alertTime: {
    fontSize: 11,
    color: "#7f8c8d",
  },
  alertMessage: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 10,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3498db",
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    marginLeft: "auto",
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 11,
    color: "#3498db",
  },
  acknowledgeButton: {
    backgroundColor: "#f39c1220",
  },
  acknowledgeButtonText: {
    color: "#f39c12",
    fontSize: 11,
  },
  resolveButton: {
    backgroundColor: "#2ecc7120",
  },
  resolveButtonText: {
    color: "#2ecc71",
    fontSize: 11,
  },
  dataContainer: {
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
  },
  dataItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  dataText: {
    marginLeft: 4,
    fontSize: 11,
    color: "#7f8c8d",
  },
});
