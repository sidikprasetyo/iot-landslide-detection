import { useState, useEffect, useRef, useCallback } from 'react';

// Define sensor data types
export interface SensorData {
  tilt: number;
  rainfall: number;
  moisture: number;
  powerSource: 'USB' | 'Battery' | 'Disconnected'; 
  battery: number;
  timestamp?: string;
  isStale?: boolean; 
}

interface WebSocketSensorDataResult {
  sensorData: SensorData;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  reconnect: () => void;
}

// Default values for sensor data
const defaultSensorData: SensorData = {
  tilt: 0,
  rainfall: 0,
  moisture: 0,
  powerSource: "Disconnected", 
  battery: 0,
  isStale: true
};

export const useWebSocketSensorData = (
  wsUrl: string = 'ws://192.168.90.46:81'
): WebSocketSensorDataResult => {
  const [sensorData, setSensorData] = useState<SensorData>(defaultSensorData);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const lastUpdatedRef = useRef<number>(0);
  
  // Prevent rapid UI updates during reconnection attempts
  const isReconnectingRef = useRef<boolean>(false);

  // WebSocket instance reference
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  
  // Connection health check interval
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      setSensorData(prev => ({
        ...prev,
        tilt: data.tilt_angle ?? prev.tilt,
        rainfall: data.rain_intensity ?? prev.rainfall,
        moisture: data.soil_moisture ?? prev.moisture,
        powerSource: data.power_source ?? prev.powerSource,
        battery: data.battery_percentage ?? prev.battery,
        timestamp: new Date().toISOString(),
        isStale: false 
      }));

      lastUpdatedRef.current = Date.now();
      setLoading(false);
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }, []);

  // Mark data as stale when disconnected
  const markDataAsStale = useCallback(() => {
    // Only update UI if not in reconnecting state to prevent flickering
    if (!isReconnectingRef.current) {
      setSensorData(prev => ({
        ...prev,
        tilt: 0,
        rainfall: 0,
        moisture: 0,
        powerSource: "Disconnected",
        isStale: true
      }));
    }
  }, []);

  // Function to connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!isComponentMounted.current) return;
    
    // Set reconnecting flag to prevent UI flicker during reconnection attempts
    isReconnectingRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      try {
        wsRef.current.close();
      } catch {
        // Ignore errors when closing connection
      }
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isComponentMounted.current) {
          ws.close();
          return;
        }
        console.log('✅ WebSocket Connected!');
        setIsConnected(true);
        // Clear reconnecting flag on successful connection
        isReconnectingRef.current = false;
      };

      ws.onmessage = handleMessage;

      ws.onerror = () => {
        if (!isComponentMounted.current) return;
        
        console.log('⚠️ WebSocket Error: Connection unavailable');
        setIsConnected(false);
        
        // Only mark data as stale after a delay to prevent flickering
        if (!isReconnectingRef.current) {
          markDataAsStale();
        }
      };

      ws.onclose = (event) => {
        if (!isComponentMounted.current) return;
        
        const closeReason = event.wasClean 
          ? 'Connection closed normally' 
          : 'Connection lost';
          
        console.log(`🔴 WebSocket Disconnected: ${closeReason}. Reconnecting in 5s...`);
        setIsConnected(false);
        
        // Wait for a longer time before trying to reconnect to prevent rapid cycles
        if (isComponentMounted.current) {
          // Only schedule reconnect if we're not already reconnecting
          if (!isReconnectingRef.current) {
            isReconnectingRef.current = true;
            reconnectTimeoutRef.current = setTimeout(() => {
              // If we're still reconnecting after timeout, mark data as stale
              if (isReconnectingRef.current) {
                markDataAsStale();
              }
              connectWebSocket();
            }, 5000);
          }
        }
      };
    } catch {
      if (!isComponentMounted.current) return;
      
      console.log('❌ WebSocket connection failed: Cannot establish connection');
      setLoading(false);
      setIsConnected(false);
      
      // Mark data as stale if connection fails
      markDataAsStale();

      if (isComponentMounted.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          isReconnectingRef.current = false; // Reset the flag after timeout
          connectWebSocket();
        }, 5000);
      }
    }
  }, [wsUrl, handleMessage, markDataAsStale]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    setLoading(true);
    setError(null);
    connectWebSocket();
  }, [connectWebSocket]);

  // Set up health check interval to detect stale connections
  useEffect(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    healthCheckIntervalRef.current = setInterval(() => {
      // If connected but no data received for 5 seconds, assume connection is dead
      if (isConnected && Date.now() - lastUpdatedRef.current > 5000) {
        console.log('🔴 Connection appears dead: No data received for 5 seconds');
        setIsConnected(false);
        
        // Only mark data as stale if we're not in a reconnecting state
        if (!isReconnectingRef.current) {
          markDataAsStale();
        }
        
        // Try to reconnect
        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch {
            // Ignore errors when closing
          }
          wsRef.current = null;
        }
        
        // Force reconnection
        if (isComponentMounted.current) {
          connectWebSocket();
        }
      }
      
      // Also check if WebSocket is actually connected
      if (isConnected && wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
        console.log('🔴 WebSocket not in OPEN state despite isConnected being true');
        setIsConnected(false);
        
        // Only mark data as stale if we're not in a reconnecting state
        if (!isReconnectingRef.current) {
          markDataAsStale();
        }
      }
    }, 2000);

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
    };
  }, [isConnected, markDataAsStale, connectWebSocket]);

  // Initialize WebSocket connection when component mounts
  useEffect(() => {
    isComponentMounted.current = true;
    connectWebSocket();

    // Cleanup when component unmounts
    return () => {
      isComponentMounted.current = false;
      
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // Ignore errors when closing
        }
        wsRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
    };
  }, [connectWebSocket]);

  return {
    sensorData,
    isConnected,
    loading,
    error,
    reconnect
  };
};