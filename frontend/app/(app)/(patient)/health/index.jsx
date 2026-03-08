import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetHealthRecordsQuery, useGetHealthStatisticsQuery } from '../../../../src/store/api/patientApi';
import Loading from '../../../../src/components/Loading';
import EmptyState from '../../../../src/components/EmptyState';

const screenWidth = Dimensions.get('window').width;

export default function HealthRecords() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
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
      if (dataPoints.every(val => val === 0)) return null;
    } else if (selectedMetric === 'bloodPressure') {
      dataPoints = records.map(r => r.systolic || 0);
      if (dataPoints.every(val => val === 0)) return null;
    }

    labels = records.map(r => {
      const date = new Date(r.recordedAt);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    // Filter out zero values for min/max calculation
    const validData = dataPoints.filter(val => val > 0);
    const minVal = validData.length > 0 ? Math.min(...validData) : 0;
    const maxVal = validData.length > 0 ? Math.max(...validData) : 100;
    const padding = Math.round((maxVal - minVal) * 0.1) || 10;

    return {
      labels,
      datasets: [{ data: dataPoints }],
      minValue: Math.max(0, minVal - padding),
      maxValue: maxVal + padding,
    };
  };

  const chartData = getChartData();
  const stats = statistics || {};

  const getMetricColor = () => {
    return selectedMetric === 'heartRate' ? '#e74c3c' : '#3498db';
  };

  const getMetricIcon = () => {
    return selectedMetric === 'heartRate' ? 'heart' : 'water';
  };

  const getMinValue = () => {
    if (selectedMetric === 'heartRate') return stats.minHeartRate || '--';
    if (selectedMetric === 'bloodPressure') {
      return stats.minSystolic ? `${stats.minSystolic}/${stats.minDiastolic}` : '--/--';
    }
    return '--';
  };

  const getMaxValue = () => {
    if (selectedMetric === 'heartRate') return stats.maxHeartRate || '--';
    if (selectedMetric === 'bloodPressure') {
      return stats.maxSystolic ? `${stats.maxSystolic}/${stats.maxDiastolic}` : '--/--';
    }
    return '--';
  };

  const getAvgValue = () => {
    if (selectedMetric === 'heartRate') {
      return stats.avgHeartRate ? Math.round(stats.avgHeartRate) : '--';
    }
    if (selectedMetric === 'bloodPressure') {
      return stats.avgSystolic && stats.avgDiastolic 
        ? `${Math.round(stats.avgSystolic)}/${Math.round(stats.avgDiastolic)}` 
        : '--/--';
    }
    return '--';
  };

  const getUnit = () => {
    return selectedMetric === 'heartRate' ? 'bpm' : 'mmHg';
  };

  if (isLoading && !refreshing) {
    return <Loading />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Records</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(app)/(patient)/health/add')}
          >
            <Icon name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Icon name={getMetricIcon()} size={32} color={getMetricColor()} />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Current {selectedMetric === 'heartRate' ? 'Heart Rate' : 'Blood Pressure'}</Text>
            <Text style={styles.summaryValue}>
              {selectedMetric === 'heartRate' 
                ? (healthData?.data?.[0]?.heartRate || '--')
                : (healthData?.data?.[0]?.systolic 
                  ? `${healthData.data[0].systolic}/${healthData.data[0].diastolic}`
                  : '--/--')
              }
            </Text>
          </View>
        </View>
      </LinearGradient>

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
              {days} {parseInt(days) === 7 ? 'Days' : 'Days'}
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
          ]}>Blood Pressure</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      {stats && Object.keys(stats).length > 0 && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderLeftColor: getMetricColor() }]}>
            <Text style={styles.statLabel}>Average</Text>
            <Text style={[styles.statValue, { color: getMetricColor() }]}>
              {getAvgValue()}
            </Text>
            <Text style={styles.statUnit}>{getUnit()}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#f39c12' }]}>
            <Text style={styles.statLabel}>Minimum</Text>
            <Text style={[styles.statValue, { color: '#f39c12' }]}>
              {getMinValue()}
            </Text>
            <Text style={styles.statUnit}>{getUnit()}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#2ecc71' }]}>
            <Text style={styles.statLabel}>Maximum</Text>
            <Text style={[styles.statValue, { color: '#2ecc71' }]}>
              {getMaxValue()}
            </Text>
            <Text style={styles.statUnit}>{getUnit()}</Text>
          </View>
        </View>
      )}

      {/* Chart */}
      {chartData ? (
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <View style={[styles.chartDot, { backgroundColor: getMetricColor() }]} />
              <Text style={styles.chartTitle}>
                {selectedMetric === 'heartRate' ? 'Heart Rate Trend' : 'Blood Pressure Trend'}
              </Text>
            </View>
            <Text style={styles.chartSubtitle}>Last 10 readings</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartWrapper}>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [{
                    data: chartData.datasets[0].data,
                  }]
                }}
                width={Math.max(screenWidth - 64, chartData.labels.length * 45)}
                height={220}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => getMetricColor(),
                  labelColor: (opacity = 1) => '#7f8c8d',
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: '#fff',
                  },
                  propsForLabels: {
                    fontSize: 10,
                    fontWeight: '500',
                  },
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={false}
                yAxisInterval={1}
                segments={4}
                formatYLabel={(value) => {
                  const num = Math.round(Number(value));
                  return num.toString();
                }}
                yAxisMin={chartData.minValue}
                yAxisMax={chartData.maxValue}
              />
            </View>
          </ScrollView>

          {/* Quick Stats */}
          <View style={styles.chartStats}>
            <View style={styles.chartStat}>
              <Text style={styles.chartStatLabel}>Highest</Text>
              <Text style={[styles.chartStatValue, { color: getMetricColor() }]}>
                {Math.max(...chartData.datasets[0].data.filter(v => v > 0)) || '--'}
              </Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.chartStatLabel}>Lowest</Text>
              <Text style={[styles.chartStatValue, { color: getMetricColor() }]}>
                {Math.min(...chartData.datasets[0].data.filter(v => v > 0)) || '--'}
              </Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.chartStatLabel}>Average</Text>
              <Text style={[styles.chartStatValue, { color: getMetricColor() }]}>
                {Math.round(chartData.datasets[0].data.filter(v => v > 0).reduce((a, b) => a + b, 0) / 
                  chartData.datasets[0].data.filter(v => v > 0).length) || '--'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <EmptyState
          icon="chart-line"
          title="No Data Available"
          message={`No ${selectedMetric === 'heartRate' ? 'heart rate' : 'blood pressure'} records found for this period`}
          buttonText="Add Reading"
          onPress={() => router.push('/(app)/(patient)/health/add')}
        />
      )}

      {/* Records List */}
      {healthData?.data?.length > 0 && (
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Recent Readings</Text>
            <Text style={styles.listCount}>{healthData.data.length} total</Text>
          </View>

          {healthData.data.slice(0, 5).map((record, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recordCard}
              onPress={() => router.push({
                pathname: '/(app)/(patient)/health/[id]',
                params: { id: record.id }
              })}
            >
              <View style={styles.recordHeader}>
                <View style={styles.recordDateTime}>
                  <Icon name="calendar" size={14} color="#7f8c8d" />
                  <Text style={styles.recordDate}>
                    {new Date(record.recordedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.recordDateTime}>
                  <Icon name="clock-outline" size={14} color="#7f8c8d" />
                  <Text style={styles.recordTime}>
                    {new Date(record.recordedAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </View>
              
              <View style={styles.recordValues}>
                <View style={styles.recordValueItem}>
                  <Icon name="heart" size={16} color="#e74c3c" />
                  <Text style={styles.recordValueText}>
                    {record.heartRate || '--'} <Text style={styles.recordValueUnit}>bpm</Text>
                  </Text>
                </View>

                <View style={styles.recordValueItem}>
                  <Icon name="water" size={16} color="#3498db" />
                  <Text style={styles.recordValueText}>
                    {record.systolic && record.diastolic 
                      ? `${record.systolic}/${record.diastolic}` 
                      : '--/--'}
                    <Text style={styles.recordValueUnit}> mmHg</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {healthData.data.length > 5 && (
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All {healthData.data.length} Records</Text>
              <Icon name="arrow-right" size={20} color="#3498db" />
            </TouchableOpacity>
          )}
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
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  summaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
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
    fontWeight: '500',
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
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  metricText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  metricTextActive: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 10,
    color: '#95a5a6',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#95a5a6',
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -20,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  chartStat: {
    alignItems: 'center',
  },
  chartStatLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  chartStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  listCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  recordDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginLeft: 6,
  },
  recordTime: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  recordValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recordValueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  recordValueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 6,
  },
  recordValueUnit: {
    fontSize: 11,
    fontWeight: 'normal',
    color: '#95a5a6',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  viewAllText: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: '500',
    marginRight: 8,
  },
});