import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useGetHealthRecordsQuery, useGetHealthStatisticsQuery } from '../../../../src/store/api/patientApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';

const screenWidth = Dimensions.get('window').width;

export default function HealthRecords() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [selectedMetric, setSelectedMetric] = useState('heartRate');

  const { 
    data: healthData,
    isLoading,
    refetch: refetchRecords
  } = useGetHealthRecordsQuery({ 
    days: parseInt(selectedPeriod),
    page: 1,
    limit: 100
  });

  const { 
    data: statistics,
    refetch: refetchStats
  } = useGetHealthStatisticsQuery({ 
    days: parseInt(selectedPeriod) 
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchRecords(), refetchStats()]);
    setRefreshing(false);
  };

  const getChartData = () => {
    if (!healthData?.data?.length) return null;

    const records = healthData.data.slice(0, 10).reverse();
    
    let dataPoints = [];
    let labels = [];

    if (selectedMetric === 'heartRate') {
      dataPoints = records.map(r => r.heartRate || 0);
    } else if (selectedMetric === 'bloodPressure') {
      dataPoints = records.map(r => r.systolic || 0);
    } else if (selectedMetric === 'oxygen') {
      dataPoints = records.map(r => r.oxygenLevel || 0);
    }

    labels = records.map(r => new Date(r.recordedAt).toLocaleDateString().slice(0, 5));

    return {
      labels,
      datasets: [{ data: dataPoints }]
    };
  };

  const chartData = getChartData();
  const stats = statistics || {};

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.title}>Health Records</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/(patient)/health/add')}>
          <Icon name="plus" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['7', '30', '90'].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              styles.periodButton,
              selectedPeriod === days && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(days)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === days && styles.periodButtonTextActive,
              ]}
            >
              {days} days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metric Selector */}
      <View style={styles.metricSelector}>
        <TouchableOpacity
          style={[
            styles.metricButton,
            selectedMetric === 'heartRate' && styles.metricButtonActive,
          ]}
          onPress={() => setSelectedMetric('heartRate')}
        >
          <Icon 
            name="heart" 
            size={20} 
            color={selectedMetric === 'heartRate' ? '#fff' : '#e74c3c'} 
          />
          <Text style={[
            styles.metricText,
            selectedMetric === 'heartRate' && styles.metricTextActive
          ]}>Heart Rate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.metricButton,
            selectedMetric === 'bloodPressure' && styles.metricButtonActive,
          ]}
          onPress={() => setSelectedMetric('bloodPressure')}
        >
          <Icon 
            name="water" 
            size={20} 
            color={selectedMetric === 'bloodPressure' ? '#fff' : '#3498db'} 
          />
          <Text style={[
            styles.metricText,
            selectedMetric === 'bloodPressure' && styles.metricTextActive
          ]}>BP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.metricButton,
            selectedMetric === 'oxygen' && styles.metricButtonActive,
          ]}
          onPress={() => setSelectedMetric('oxygen')}
        >
          <Icon 
            name="lungs" 
            size={20} 
            color={selectedMetric === 'oxygen' ? '#fff' : '#2ecc71'} 
          />
          <Text style={[
            styles.metricText,
            selectedMetric === 'oxygen' && styles.metricTextActive
          ]}>Oxygen</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      {stats && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Average</Text>
            <Text style={styles.statValue}>
              {selectedMetric === 'heartRate' && (stats.avgHeartRate ? Math.round(stats.avgHeartRate) : '--')}
              {selectedMetric === 'bloodPressure' && stats.avgSystolic ? `${Math.round(stats.avgSystolic)}/${Math.round(stats.avgDiastolic)}` : '--'}
              {selectedMetric === 'oxygen' && (stats.avgOxygenLevel ? Math.round(stats.avgOxygenLevel) : '--')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Minimum</Text>
            <Text style={styles.statValue}>
              {selectedMetric === 'heartRate' && (stats.minHeartRate || '--')}
              {selectedMetric === 'oxygen' && (stats.minOxygenLevel || '--')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Maximum</Text>
            <Text style={styles.statValue}>
              {selectedMetric === 'heartRate' && (stats.maxHeartRate || '--')}
              {selectedMetric === 'oxygen' && (stats.maxOxygenLevel || '--')}
            </Text>
          </View>
        </View>
      )}

      {/* Chart */}
      {chartData ? (
        <View style={styles.chartCard}>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => 
                selectedMetric === 'heartRate' ? `rgba(231, 76, 60, ${opacity})` :
                selectedMetric === 'bloodPressure' ? `rgba(52, 152, 219, ${opacity})` :
                `rgba(46, 204, 113, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '6', strokeWidth: '2' },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      ) : (
        <EmptyState
          icon="chart-line"
          title="No Data"
          message="No health records found for this period"
          buttonText="Add Reading"
          onPress={() => router.push('/(app)/(patient)/health/add')}
        />
      )}

      {/* Records List */}
      {healthData?.data?.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Recent Readings</Text>
          {healthData.data.slice(0, 10).map((record, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recordCard}
              onPress={() => router.push({
                pathname: '/(app)/(patient)/health/[id]',
                params: { id: record.id }
              })}
            >
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>
                  {new Date(record.recordedAt).toLocaleDateString()}
                </Text>
                <Text style={styles.recordTime}>
                  {new Date(record.recordedAt).toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.recordDetails}>
                <View style={styles.recordDetail}>
                  <Icon name="heart" size={16} color="#e74c3c" />
                  <Text style={styles.recordText}>{record.heartRate || '--'} bpm</Text>
                </View>
                <View style={styles.recordDetail}>
                  <Icon name="water" size={16} color="#3498db" />
                  <Text style={styles.recordText}>
                    {record.systolic && record.diastolic 
                      ? `${record.systolic}/${record.diastolic}` 
                      : '--/--'}
                  </Text>
                </View>
                <View style={styles.recordDetail}>
                  <Icon name="lungs" size={16} color="#2ecc71" />
                  <Text style={styles.recordText}>{record.oxygenLevel || '--'}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  periodButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  periodButtonText: {
    textAlign: 'center',
    color: '#2c3e50',
    fontSize: 14,
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  metricSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metricButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  metricText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#2c3e50',
  },
  metricTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    borderRadius: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  recordTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recordDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#2c3e50',
  },
});