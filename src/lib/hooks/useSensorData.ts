import { useState, useEffect, useCallback } from 'react';
import { 
  fetchLatestSensorData, 
  fetchLast24HoursSensorData, 
  subscribeToSensorData 
} from '@/lib/sensorService';
import { SensorData, FormattedSensorData, DailyPatternData } from '@/types/sensor';

export const useSensorData = () => {
  const [sensorData, setSensorData] = useState<FormattedSensorData>({
    tilt: 0,
    rainfall: 0,
    moisture: 0,
    battery: 0,
    powerSource: 'Battery',
    lastUpdated: new Date().toISOString()
  });

  const [dailyPatternData, setDailyPatternData] = useState<DailyPatternData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert raw sensor data to formatted data
  const formatSensorData = (data: SensorData): FormattedSensorData => ({
    tilt: data.tilt_angle,
    rainfall: data.rain_intensity,
    moisture: data.soil_moisture,
    battery: data.battery_percentage,
    powerSource: data.power_source,
    lastUpdated: data.created_at
  });

  const processDailyPatternData = useCallback(async () => {
    try {
      const data = await fetchLast24HoursSensorData();

      if (data && Array.isArray(data) && data.length > 0) {
        const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const latestData = sortedData.slice(0, 8).reverse();

        const formattedData: DailyPatternData[] = latestData.map(item => ({
          time: new Date(item.created_at).toLocaleTimeString(),
          tilt: Number(item.tilt_angle) || 0,
          rainfall: Number(item.rain_intensity) || 0,
          moisture: Number(item.soil_moisture) || 0
        }));

        setDailyPatternData(formattedData);
      } else {
        setDailyPatternData([]);
      }
    } catch {
      setError("Failed to process daily pattern data");
      setDailyPatternData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const latestData = await fetchLatestSensorData();

      if (latestData) setSensorData(formatSensorData(latestData));
      await processDailyPatternData();
    } catch {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, [processDailyPatternData]);

  const defaultSensorData: SensorData = {
    id: 0,
    created_at: new Date().toISOString(),
    tilt_angle: 0,
    rain_intensity: 0,
    soil_moisture: 0,
    battery_percentage: 0,
    power_source: 'Battery'
  };

  useEffect(() => {
    loadInitialData();

    const subscription = subscribeToSensorData((newData) => {
      setSensorData(formatSensorData(newData?.new ?? defaultSensorData));

      processDailyPatternData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadInitialData, processDailyPatternData]);

  return { sensorData, dailyPatternData, loading, error };
};
