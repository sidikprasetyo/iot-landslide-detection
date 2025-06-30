"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo, RefObject } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { AlertTriangle, AlertCircle, CheckCircle, BatteryFull, BatteryMedium, BatteryLow, PlugZap, Unplug } from "lucide-react";
import { useSensorData } from "@/lib/hooks/useSensorData";
import { useWebSocketSensorData } from "@/lib/hooks/useWebSocketSensorData";
import { WebSocketStatus } from "@/components/WebSocketStatus";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface SensorGaugeProps {
  value: number;
  unit: string;
  min?: number;
  max?: number;
  dangerThreshold?: number;
  warningThreshold?: number;
}

// SensorGauge Component dengan throttle untuk performa
const SensorGauge :  React.FC<SensorGaugeProps> = ({ 
  value, 
  unit, 
  min = 0, 
  max = 100,
  dangerThreshold,
  warningThreshold,
}) => {
  // Use dynamic sizes based on screen width
  const getSizeClass = () => {
    return "w-[95%] xs:w-[90%] md:w-[110%] lg:w-[105%] xl:w-[78%] 2xl:w-[92%] 3xl:w-[108%] h-[95%] xs:h-[90%] md:h-[110%] lg:h-[105%] xl:h-[78%] 2xl:h-[92%] 3xl:h-[108%]";
  };

  // Dynamic strokeWidth based on screen size - dikonfigurasi ke object
  const strokeWidthConfig = useMemo(() => ({
    base: 22,
    xs: 23,      // 370px
    md: 21,      // 768px
    lg: 22,      // 1024px
    xl: 23,      // 1280px
    '2xl': 25,   // 1536px
    '3xl': 33,   // 1700px
}), []); // ✅ Tidak berubah di setiap render


  const [strokeWidth, setStrokeWidth] = useState(strokeWidthConfig.base);
  // const gaugeRef = useRef<HTMLDivElement>(null);

  // Throttle function untuk mengurangi beban resize events
  const throttle = <T extends (...args: unknown[]) => unknown>(
    func: T, 
    delay: number
  ) => {
    let lastCall = 0;
    return function(this: unknown, ...args: Parameters<T>): ReturnType<T> | undefined {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return undefined;
      }
      lastCall = now;
      return func.apply(this, args) as ReturnType<T>;
    };
  };

  // Update strokeWidth when screen size changes dengan throttle
  useEffect(() => {
    const updateStrokeWidth = () => {
      const width = window.innerWidth;
      
      if (width >= 1700) setStrokeWidth(strokeWidthConfig['3xl']);
      else if (width >= 1536) setStrokeWidth(strokeWidthConfig['2xl']);
      else if (width >= 1280) setStrokeWidth(strokeWidthConfig.xl);
      else if (width >= 1024) setStrokeWidth(strokeWidthConfig.lg);
      else if (width >= 768) setStrokeWidth(strokeWidthConfig.md);
      else if (width >= 390) setStrokeWidth(strokeWidthConfig.xs);
      else setStrokeWidth(strokeWidthConfig.base);
    };

    const throttledUpdate = throttle(updateStrokeWidth, 100);

    updateStrokeWidth(); // Initial call
    window.addEventListener('resize', throttledUpdate);
    return () => window.removeEventListener('resize', throttledUpdate);
  }, [strokeWidthConfig]);
  
  // First, correctly define the hook to handle the null possibility:
  interface GaugeDimensions {
    radius: number;
    circumference: number;
    viewBoxSize: number;
  }
  
  // Update the type definition to better match React's ref typing
  const useGaugeCalculations = (
    element: React.RefObject<HTMLDivElement | null>, 
    strokeW: number
  ): GaugeDimensions => {
    const [dimensions, setDimensions] = useState<GaugeDimensions>({
      radius: 0,
      circumference: 0,
      viewBoxSize: 0
    });
  
    useEffect(() => {
      if (element.current) {
        const size = element.current.getBoundingClientRect().width;
        const padding = strokeW;
        const viewBoxSize = size + (padding * 2);
        const newRadius = (size - strokeW) / 2;
        
        setDimensions({
          radius: newRadius,
          circumference: 2 * Math.PI * newRadius,
          viewBoxSize
        });
      }
    }, [element, strokeW]);
  
    return dimensions;
  };
  
  // Define the ref as usual
  const gaugeRef = useRef<HTMLDivElement>(null);
  
  // Use a type assertion when passing to the hook
  const { radius, circumference, viewBoxSize } = useGaugeCalculations(gaugeRef as RefObject<HTMLDivElement>, strokeWidth);

  // Normalize value to percentage
  const normalizedValue = ((value - min) / (max - min)) * 100;
  const progress = ((100 - normalizedValue) / 100) * circumference;

  // Determine color based on thresholds with memoization
  const getColor = useCallback(() => {
    if (dangerThreshold && value >= dangerThreshold) return "text-red-500";
    if (warningThreshold && value >= warningThreshold) return "text-yellow-500";
    return "text-green-500";
  }, [value, dangerThreshold, warningThreshold]);

  const colorClass = getColor();

  return (
    <div className="flex flex-col items-center">
      <div ref={gaugeRef} className={`relative ${getSizeClass()}`}>
        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          aria-label={`Gauge showing ${value} ${unit}`}
        >
          {/* Background circle */}
          <circle
            className="text-gray-200 stroke-[#E9ECEF] dark:stroke-[#495057]"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
          />
          {/* Progress circle */}
          <circle
            className={`${colorClass} transition-all duration-300 ease-in-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={viewBoxSize / 2}
            cy={viewBoxSize / 2}
          />
        </svg>
        {/* Value and unit display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl md:text-xl lg:text-2xl 2xl:text-3xl 3xl:text-4xl font-bold">
          {value.toFixed(2)} {unit}
        </span>
      </div>
      </div>
    </div>
  );
};

interface TiltStatusProps {
  value: number;
}

// Status components with memoization
const TiltStatus = React.memo(({ value } : TiltStatusProps) => {
    const getStatusDetails = () => {
      if (value <= 15) {
        return {
          text: "Normal",
          color: "text-green-500"
        };
      } else if (value <= 30) {
        return {
          text: "Significant Tilt",
          color: "text-yellow-500"
        };
      } else {
        return {
          text: "Extreme Tilt",
          color: "text-red-500"
        };
      }
    };
  
    const status = getStatusDetails();
  
    return (
      <CardDescription className={`${status.color} mb-3 -mt-5 md:-mt-4 lg:-mt-3 xl:-mt-6 text-lg md:text-base 2xl:text-xl 3xl:text-3xl font-semibold text-center`}>
        {status.text}
      </CardDescription>
    );
});

TiltStatus.displayName = "TiltStatus";

interface RainStatusProps {
  value: number;
}

const RainStatus = React.memo(({ value } : RainStatusProps) => {
    const getStatusDetails = () => {
      if (value === 0) {
        return {
          text: "No Rain",
          color: "text-gray-500"
        };
      } else if (value > 0 && value <= 5) {
        return {
          text: "Light Rain",
          color: "text-green-500"
        };
      } else if (value > 5 && value <= 10) {
        return {
          text: "Moderate Rain",
          color: "text-yellow-500"
        };
      } else {
        return {
          text: "Heavy Rain",
          color: "text-red-500"
        };
      }
    };
    const status = getStatusDetails();
  
    return (
      <CardDescription className={`${status.color} mb-3 -mt-5 md:-mt-4 lg:-mt-3 xl:-mt-6 text-lg md:text-base 2xl:text-xl 3xl:text-3xl font-semibold text-center`}>
        {status.text}
      </CardDescription>
    );
});

RainStatus.displayName = "RainStatus";

interface SoiilStatusProps {
  value: number;
}

const SoilStatus = React.memo(({ value } : SoiilStatusProps) => {
    const getStatusDetails = () => {
      if (value <= 40) {
        return {
          text: "Normal",
          color: "text-green-500"
        };
      } else if (value <= 70) {
        return {
          text: "Moist Soil",
          color: "text-yellow-500"
        };
      } else {
        return {
          text: "Wet Soil",
          color: "text-red-500"
        };
      }
    };
    const status = getStatusDetails();
  
    return (
      <CardDescription className={`${status.color} mb-3 -mt-5 md:-mt-4 lg:-mt-3 xl:-mt-6 text-lg md:text-base 2xl:text-xl 3xl:text-3xl font-semibold text-center`}>
        {status.text}
      </CardDescription>
    );
});

SoilStatus.displayName = "SoilStatus";

interface InfoRowProps {
    label: string;
    children: React.ReactNode;
}

// InfoRow component with better naming and props
const InfoRow = React.memo(({ label, children } : InfoRowProps) => (
    <div className="flex items-center mb-1 3xl:mb-3">
        <span className="text-gray-800 dark:text-gray-100 text-sm md:text-xs lg:text-sm xl:text-base 2xl:text-xl 3xl:text-2xl font-bold w-32 md:w-28 lg:w-32 xl:w-40 2xl:w-48 3xl:w-60">
            {label} :
        </span>
        <span className="text-gray-800 dark:text-gray-100 xl:-ms-3 text-sm md:text-xs lg:text-sm xl:text-base 2xl:text-xl 3xl:text-2xl font-bold flex items-center gap-1">
            {children}
        </span>
    </div>
));

InfoRow.displayName = "InfoRow";

interface PowerSourceIndicatorProps {
    source: string;
    battery: number;
}

const PowerSourceIndicator = React.memo(({ source, battery } : PowerSourceIndicatorProps) => {
    if (source === "USB") {
        return (
            <>
                <PlugZap className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 -ms-1" />
                <span className="text-gray-800 dark:text-gray-100">Connected</span>
            </>
        );
    } 
    else if (source === "Battery") {
      return (
        <>
                {battery >= 75 ? (
                    <>
                        <BatteryFull className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 -ms-1 -translate-y-1 -rotate-90 text-green-500" />
                        <span className="text-green-500">Battery</span>
                    </>
                ) : battery >= 30 ? (
                    <>
                        <BatteryMedium className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 -ms-1 -translate-y-1 -rotate-90 text-yellow-500" />
                        <span className="text-yellow-500">Battery</span>
                    </>
                ) : (
                    <>
                        <BatteryLow className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 -ms-1 -translate-y-1 -rotate-90 text-red-500" />
                        <span className="text-red-500">Battery</span>
                    </>
                )}
            </>
    );
    }
    else {
      return (
        <>
            <Unplug className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 -ms-1" />
            <span className="text-gray-800 dark:text-gray-100">Disconnected</span>
        </>
    );
    }
});

PowerSourceIndicator.displayName = "PowerSourceIndicator";

interface StatusIndicatorProps {
    tilt: number;
    rainfall: number;
    moisture: number;
}

// Component untuk status indicator yang dioptimalkan
const StatusIndicator = React.memo(({ tilt, rainfall, moisture} : StatusIndicatorProps) => {
    const getStatus = useCallback(() => {
        const isWetCondition = rainfall > 10 || moisture > 70;
        
        // Extreme tilt cases
        if (tilt > 30) {
            return {
                icon: AlertTriangle,
                color: "text-red-500",
                mainText: "CRITICAL DANGER",
                text: isWetCondition ? "Extreme tilt with wet condition" : "Extreme tilt"
            };
        }
        
        // Significant tilt cases
        if (tilt > 15 && tilt <= 30) {
            return {
                icon: AlertCircle,
                color: "text-yellow-500",
                mainText: "HIGH ALERT",
                text: isWetCondition ? "Significant tilt with wet condition" : "Significant tilt"
            };
        }
        
        // Wet condition only
        if (isWetCondition) {
            return {
                icon: AlertCircle,
                color: "text-yellow-500",
                mainText: "ALERT",
                text: "Very wet condition"
            };
        }
        
        // Safe condition
        return {
            icon: CheckCircle,
            color: "text-green-500",
            mainText: "SAFE",
            text: "Normal conditions"
        };
    }, [tilt, rainfall, moisture]);

    const status = getStatus();
    const IconComponent = status.icon;

    return (
        <div className="flex flex-col items-center mb-3 lg:mb-1 xl:mb-2 mt-5 md:mt-3 lg:mt-2 xl:mt-4 2xl:mt-8">
            <IconComponent className={`${status.color} w-[75px] h-[75px] md:w-[62px] md:h-[62px] lg:w-[100px] lg:h-[100px] 2xl:w-[115px] 2xl:h-[115px] 3xl:w-[130px] 3xl:h-[130px]`} />
            <p className={`${status.color} font-bold text-xl xs:text-2xl md:text-xl lg:text-3xl 2xl:text-4xl 3xl:text-5xl`}>
                {status.mainText}
            </p>
            <p className="text-gray-800 dark:text-gray-100 text-center -mt-1 xs:text-base 2xl:text-xl 3xl:text-2xl font-bold">
                {status.text}
            </p>
        </div>
    );
});

StatusIndicator.displayName = "StatusIndicator";

interface SensorData {
  isStale: boolean;
  powerSource: string;
  battery: number;
  tilt: number;
  rainfall: number;
  moisture: number;
}

interface SystemStatusCardProps {
  sensorData: SensorData;
  isConnected: boolean;
}

const INACTIVE_THRESHOLD = 5000; // Contoh threshold untuk menentukan status

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ sensorData, isConnected }) => {
  const [systemState, setSystemState] = useState<string>("Initializing");
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Update lastActivity ketika menerima data sensor baru yang tidak stale
  useEffect(() => {
    if (sensorData && !sensorData.isStale) {
      setLastActivity(Date.now());
    }
  }, [sensorData]);

  // Logic yang diperbarui untuk menentukan system state
  useEffect(() => {
    const evaluateSystemState = () => {
      if (!isConnected || sensorData.isStale) {
        return "Disconnected";
      }

      const timeSinceLastActivity = Date.now() - lastActivity;

      if (timeSinceLastActivity > INACTIVE_THRESHOLD) {
        return "Inactive";
      }

      return "Running";
    };

    setSystemState(evaluateSystemState());

    const intervalId = setInterval(() => {
      setSystemState(evaluateSystemState());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isConnected, lastActivity, sensorData]);

  return (
    <Card className="bg-white dark:bg-[#1A1E23] md:col-span-1">
      <CardHeader className="3xl:mb-3">
        <CardTitle className="text-gray-800 dark:text-gray-100 text-lg md:text-base lg:text-xl xl:text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-center">
          Current State
        </CardTitle>
      </CardHeader>
      <CardContent className="-mt-2">
        <InfoRow label="Power Resources">
          <PowerSourceIndicator
            source={sensorData.powerSource}
            battery={sensorData.battery}
          />
        </InfoRow>
        <InfoRow label="System State &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;">
          <span
            className={
              systemState === "Running"
                ? "text-green-500"
                : systemState === "Inactive"
                ? "text-yellow-500"
                : systemState === "Initializing"
                ? "text-blue-500"
                : "text-red-500"
            }
          >
            {systemState}
          </span>
        </InfoRow>
        <StatusIndicator
          tilt={sensorData.tilt}
          rainfall={sensorData.rainfall}
          moisture={sensorData.moisture}
        />
      </CardContent>
    </Card>
  );
};

// Daily pattern chart component dijalankan dengan data
interface CustomizedLabelProps {
  x: number;
  y: number;
  value: number;
  dataKey: string;
}

const CustomizedLabel: React.FC<CustomizedLabelProps> = ({ x, y, value, dataKey }) => {
  const colors: Record<string, string> = {
    tilt: "#ef4444",
    rainfall: "#3b82f6",
    moisture: "#22c55e",
  };

  const displayValue = value.toFixed(1); // value sudah bertipe number

  return (
    <text 
      x={x} 
      y={y} 
      dy={-5} 
      fill={colors[dataKey] || "#000"} 
      fontSize={12} 
      textAnchor="middle"
    >
      {displayValue}
    </text>
  );
};

interface DataPoint {
  time: string;
  tilt: number;
  rainfall: number;
  moisture: number;
}

interface DailyPatternChartProps {
  data: DataPoint[];
}

const DailyPatternChart: React.FC<DailyPatternChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[25vh] md:h-[16vh] lg:h-[32vh]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: -5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            fontSize={10} 
            tick={{ fill: "#FF00FF" }} 
            interval={"preserveStartEnd"} 
          />
          <YAxis 
            fontSize={10} 
            tick={{ fill: "#FF00FF" }} 
            domain={['auto', 'auto']}
            label={{ 
              value: "Values", 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: 18, fill: "#FF00FF" }
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #FF00FF",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#FF00FF",
            }}
            formatter={(value: number | string, name: string) => {
              const units: Record<string, string> = {
                tilt: "°",
                rainfall: "mm/h",
                moisture: "%"
              };

              // Pastikan value adalah number sebelum memanggil toFixed
              const numericValue = typeof value === "number" ? value : parseFloat(value);

              return [`${numericValue.toFixed(2)} ${units[name] || ""}`, name];
            }}
          />
          <Legend />
          <Line
            type="monotone" 
            dataKey="tilt" 
            name="Tilt Angle(°)" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={{ r: 2, fill: "#ef4444", stroke: "#ef4444" }} 
            activeDot={{ r: 4, fill: "#ef4444", stroke: "#ef4444" }}
            label={(props) => <CustomizedLabel {...props} dataKey="tilt" />} 
          />
          <Line
            type="monotone" 
            dataKey="rainfall" 
            name="Rain Intensity (mm/h)" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={{ r: 2, fill: "#3b82f6", stroke: "#3b82f6" }} 
            activeDot={{ r: 4, fill: "#3b82f6", stroke: "#3b82f6" }}
            label={(props) => <CustomizedLabel {...props} dataKey="rainfall" />}
          />
          <Line 
            type="monotone"
            dataKey="moisture"
            name="Soil Moisture (%)"
            stroke="#22c55e"
            strokeWidth={2} 
            dot={{ r: 2, fill: "#22c55e", stroke: "#22c55e" }} 
            activeDot={{ r: 4, fill: "#22c55e", stroke: "#22c55e" }}
            label={(props) => <CustomizedLabel {...props} dataKey="moisture" />} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// HomePage component yang lengkap
const HomePage = () => {
  const { dailyPatternData } = useSensorData();
  const { 
    sensorData, 
    isConnected, 
    error,
  } = useWebSocketSensorData('ws://192.168.152.100:81');

  return (
    <div className="mx-4 mt-2 md:mx-8 lg:mx-12 md:mt-3">
      {/* WebSocket Connection Status */}
      <div className="flex justify-end mb-2">
        <WebSocketStatus 
          isConnected={isConnected} 
          error={error}
        />
      </div>
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* First row of cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-4 lg:mb-6">
      <SystemStatusCard sensorData={{ ...sensorData, isStale: sensorData.isStale ?? false }} isConnected={isConnected} />
        <Card className="bg-white dark:bg-[#1A1E23] md:col-span-1">
          <CardHeader className="pb-0">
            <CardTitle className="text-gray-800 dark:text-gray-100 text-lg md:text-xl font-bold text-center">
              Tilt Angle
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center pt-2">
            <SensorGauge 
              value={sensorData.tilt}
              unit="°"
              min={0}
              max={90}
              dangerThreshold={30.1}
              warningThreshold={15.1}
            />
          </CardContent>
          <TiltStatus value={sensorData.tilt} />
        </Card>
        
        <Card className="bg-white dark:bg-[#1A1E23] md:col-span-1">
          <CardHeader className="pb-0">
            <CardTitle className="text-gray-800 dark:text-gray-100 text-lg md:text-xl font-bold text-center">
              Rain Intensity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center pt-2">
            <SensorGauge 
              value={sensorData.rainfall}
              unit="mm/h"
              min={0}
              max={50}
              dangerThreshold={10.1}
              warningThreshold={5.1}
            />
          </CardContent>
          <RainStatus value={sensorData.rainfall} />
        </Card>
      </div>

      {/* Second row of cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white dark:bg-[#1A1E23] md:col-span-1">
          <CardHeader className="-mb-2 md:-mb-5">
            <CardTitle className="text-gray-800 dark:text-gray-100 text-lg md:text-base xl:text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-center">
              Soil Moisture
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <SensorGauge 
              value={sensorData.moisture}
              unit="%"
              min={0}
              max={100}
              dangerThreshold={70.1}
              warningThreshold={40.1}
            />
          </CardContent>
          <SoilStatus value={sensorData.moisture} />
        </Card>
        <Card className="bg-white dark:bg-[#1A1E23] md:col-span-2">
          <CardHeader className="-mb-4">
            <CardTitle className="text-gray-800 dark:text-gray-100 text-sm md:text-lg lg:text-xl font-bold">
              Daily Pattern
            </CardTitle>
            <CardDescription className="text-gray-400 dark:text-gray-300">
              Tilt, rainfall, and moisture relationship on one day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DailyPatternChart data={dailyPatternData}/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;