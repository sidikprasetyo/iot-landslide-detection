import { useState, useEffect } from 'react';
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
  const formatSensorData = (data: SensorData): FormattedSensorData => {
    return {
      tilt: data.tilt_angle,
      rainfall: data.rain_intensity,
      moisture: data.soil_moisture,
      battery: data.battery_percentage,
      powerSource: data.power_source,
      lastUpdated: data.created_at
    };
  };

  const processDailyPatternData = async () => {
    try {
      const data = await fetchLast24HoursSensorData();
  
      if (data && Array.isArray(data) && data.length > 0) {
        // Pastikan data diurutkan dari yang terbaru ke yang lama
        const sortedData = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
        // Ambil hanya 8 data terbaru
        const latestData = sortedData.slice(0, 8).reverse(); // Ambil 8 data terbaru
  
        // Format data agar sesuai untuk chart
        const formattedData: DailyPatternData[] = latestData.map(item => ({
          time: new Date(item.created_at).toLocaleTimeString(), // Format jam:menit
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
  };  

  // Load initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);

      const latestData = await fetchLatestSensorData();
      
      if (latestData)
        setSensorData(formatSensorData(latestData));
      await processDailyPatternData();
    } catch {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    const subscription = subscribeToSensorData((newData) => {

      setSensorData(formatSensorData(newData));

      processDailyPatternData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { sensorData, dailyPatternData, loading, error };
};
