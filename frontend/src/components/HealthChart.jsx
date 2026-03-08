import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const screenWidth = Dimensions.get('window').width;

const HealthChart = ({ data, labels, title, color = '#3498db' }) => {
  // If no data or empty data, show empty state
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="chart-line" size={50} color="#bdc3c7" />
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  // Calculate min and max for better visualization
  const validData = data.filter(val => val && !isNaN(val));
  if (validData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="chart-line" size={50} color="#bdc3c7" />
        <Text style={styles.emptyText}>No valid data</Text>
      </View>
    );
  }

  const minValue = Math.min(...validData);
  const maxValue = Math.max(...validData);
  const padding = Math.round((maxValue - minValue) * 0.1) || 10;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => color + Math.round(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#fff',
    },
    propsForLabels: {
      fontSize: 10,
      fontWeight: '500',
    },
    formatYLabel: (value) => Math.round(value).toString(),
  };

  // Format data for chart
  const chartData = {
    labels: labels || [],
    datasets: [
      {
        data: data,
        color: (opacity = 1) => color + Math.round(opacity * 255).toString(16).padStart(2, '0'),
        strokeWidth: 2,
      },
    ],
    legend: [title],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            width={Math.max(screenWidth - 40, labels.length * 50)}
            height={220}
            chartConfig={chartConfig}
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
            segments={5}
            formatYLabel={(value) => Math.round(value).toString()}
          />
        </View>
      </ScrollView>

      {/* Statistics Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={[styles.statValue, { color }]}>
            {Math.round(validData.reduce((a, b) => a + b, 0) / validData.length)}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Highest</Text>
          <Text style={[styles.statValue, { color }]}>{maxValue}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Lowest</Text>
          <Text style={[styles.statValue, { color }]}>{minValue}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Readings</Text>
          <Text style={[styles.statValue, { color }]}>{validData.length}</Text>
        </View>
      </View>

      {/* Legend for color meaning (optional) */}
      {title.includes('Heart') && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
            <Text style={styles.legendText}>Normal Range (60-100)</Text>
          </View>
        </View>
      )}

      {title.includes('Blood') && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3498db' }]} />
            <Text style={styles.legendText}>Systolic (Normal: 90-120)</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    paddingRight: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  statBox: {
    alignItems: 'center',
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
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#95a5a6',
  },
});

export default HealthChart;