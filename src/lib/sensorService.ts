import { supabase } from './supabase';
import { SensorData } from '../types/sensor';

// Fungsi untuk mendapatkan data sensor 24 jam terakhir
export async function fetchLast24HoursSensorData(): Promise<SensorData[]> {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    console.log('Fetching data since:', twentyFourHoursAgo.toISOString());
    
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Supabase error in fetchLast24HoursSensorData:', error);
      throw error;
    }
    
    console.log('Data received from Supabase:', data);
    console.log('Number of records:', data?.length || 0);
    
    // Periksa jika data kosong dan berikan log yang jelas
    if (!data || data.length === 0) {
      console.warn('No data found in the last 24 hours');
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchLast24HoursSensorData:', error);
    return [];
  }
}

// Fungsi untuk mendapatkan data sensor terbaru
export async function fetchLatestSensorData(): Promise<SensorData | null> {
  try {
    console.log('Fetching latest sensor data...');
    
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // Jika error adalah "No rows returned", itu berarti tabel kosong - log ini sebagai warning, bukan error
      if (error.code === 'PGRST116') {
        console.warn('No data found in sensor_data table');
        return null;
      }
      
      console.error('Supabase error in fetchLatestSensorData:', error);
      throw error;
    }
    
    console.log('Latest data received:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchLatestSensorData:', error);
    return null;
  }
}

export async function fetchSensorData(): Promise<SensorData[]> {
  try {
    console.log('Fetching all sensor data...');
    
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching sensor data:', error);
      throw error;
    }
    
    console.log('All sensor data received, count:', data?.length || 0);
    
    // Ubah format data untuk kompatibilitas dengan kode yang ada
    return data.map(item => ({
      ...item,
      time: new Date(item.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      tilt: item.tilt_angle,
      rainfall: item.rain_intensity,
      moisture: item.soil_moisture
    }));
  } catch (error) {
    console.error('Error in fetchSensorData:', error);
    return [];
  }
}

export async function fetchSensorDataByTimeRange(hours: number): Promise<SensorData[]> {
  try {
    console.log(`Fetching sensor data for the last ${hours} hours...`);
    
    // Jika hours adalah 0, ambil semua data
    if (hours === 0) {
      return fetchSensorData();
    }
    
    // Hitung timestamp untuk filter
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
    console.log('Cutoff time:', cutoffTime);
    
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .gte('created_at', cutoffTime)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching sensor data by time range:', error);
      throw error;
    }
    
    console.log(`Received ${data?.length || 0} records for the last ${hours} hours`);
    
    // Ubah format data untuk kompatibilitas dengan kode yang ada
    return data.map(item => ({
      ...item,
      time: new Date(item.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      tilt: item.tilt_angle,
      rainfall: item.rain_intensity,
      moisture: item.soil_moisture
    }));
  } catch (error) {
    console.error('Error in fetchSensorDataByTimeRange:', error);
    return [];
  }
}

// Fungsi untuk setup realtime subscription
export function subscribeToSensorData(callback: (payload: any) => void) {
  console.log('Setting up realtime subscription for sensor_data table');
  
  const subscription = supabase
    .channel('table-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_data'
      },
      (payload) => {
        console.log('New sensor data received from subscription:', payload);
        
        // Pastikan payload.new ada dan memiliki struktur yang diharapkan
        if (payload.new && typeof payload.new === 'object') {
          console.log('Processing new data:', payload.new);
          callback(payload.new);
        } else {
          console.error('Received invalid payload structure:', payload);
        }
      }
    )
    .subscribe();
  
  console.log('Subscription set up successfully');
  return subscription;
}