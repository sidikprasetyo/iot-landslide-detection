export interface SensorData {
  id: number;
  created_at: string;
  tilt_angle: number;
  rain_intensity: number;
  soil_moisture: number;
  battery_percentage: number;
  power_source: string;
  time?: string;
}

// For use with the Supabase client
export interface Database {
  public: {
    Tables: {
      sensor_data: {
        Row: SensorData;
        Insert: Omit<SensorData, 'id' | 'created_at'> & { 
          id?: number;
          created_at?: string;
        };
        Update: Partial<Omit<SensorData, 'id' | 'created_at'>> & { 
          id?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Format for UI display
export interface FormattedSensorData {
  tilt: number;
  rainfall: number;
  moisture: number;
  battery: number;
  powerSource: string;
  lastUpdated: string;
}

// Daily pattern data format for the chart
export interface DailyPatternData {
  time: string;
  tilt: number;
  rainfall: number;
  moisture: number;
}