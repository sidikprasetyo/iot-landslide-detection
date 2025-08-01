"use client";

import React, { useState, useEffect, useCallback, FC } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layers, Database, FileDown, Download, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchSensorData, fetchSensorDataByTimeRange, subscribeToSensorData } from "@/lib/sensorService";
import { DailyPatternData, SensorData } from "@/types/sensor";

interface CustomizedLabelProps {
  x: number;
  y: number;
  value: string | number;
  dataKey: string;
}

// Custom label component for charts
const CustomizedLabel: FC<CustomizedLabelProps> = ({ x, y, value, dataKey }) => {
  const colors: Record<string, string> = {
    tilt: "#ef4444",
    rainfall: "#3b82f6",
    moisture: "#22c55e",
  };
  
  const displayValue = parseFloat(String(value)).toFixed(2);
  
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
  tilt?: number;
  rainfall?: number;
  moisture?: number;
}

interface DataChartProps {
  data: DataPoint[]; // Array berisi objek DataPoint
  dataKey: keyof DataPoint; // Memastikan hanya memilih key yang valid
  color: string;
  name: string;
  unit?: string;
}

// Component for charts with shared logic
const DataChart = ({ data, dataKey, color, name, unit }: DataChartProps) => {
  return (
    <div className="w-full h-[25vh] md:h-[16vh] lg:h-[34vh]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 0,
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
              value: `${name} (${unit})`, 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: 15, fill: "#FF00FF" }
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #FF00FF",
              borderRadius: "15px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#FF00FF"
            }}
            formatter={(value) => [`${Number(value).toFixed(2)} ${unit}`, name]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            name={name} 
            stroke={color} 
            strokeWidth={2} 
            dot={{ r: 2, fill: color, stroke: color }} 
            activeDot={{ r: 4, fill: color, stroke: color }}
            label={(props) => <CustomizedLabel {...props} dataKey={dataKey} />} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard = () => {
  const [tiltRainData, setTiltRainData] = useState<SensorData[]>([]);
    const [moistureData, setMoistureData] = useState<SensorData[]>([]);
    const [allData, setAllData] = useState<SensorData[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [totalData, setTotalData] = useState<SensorData[]>([]);
    const [timeFilter, setTimeFilter] = useState("all");
    const [, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);


    // Fungsi untuk load data spesifik chart
    const loadChartData = useCallback(async () => {
      setLoading(true);
      try {
          let filteredData;
          
          // Ambil data berdasarkan filter waktu yang dipilih
          if (timeFilter === "all") {
              filteredData = await fetchSensorData();
          } else {
              filteredData = await fetchSensorDataByTimeRange(parseInt(timeFilter));
          }
          
          // Ambil 8 data terbaru dari hasil yang sudah difilter
          const latest8Data = filteredData.slice(-8);
          setTiltRainData(latest8Data);
          
          // Ambil 16 data terbaru dari hasil yang sudah difilter
          const latest16Data = filteredData.slice(-16);
          setMoistureData(latest16Data);
          
          setLastUpdated(new Date());
      } catch (error) {
          console.error("Error loading chart data:", error);
      } finally {
          setLoading(false);
      }
  }, [timeFilter]); // ✅ Pastikan `timeFilter` sebagai dependensi
  
  const loadAllData = useCallback(async () => {
      setLoading(true);
      try {
          const allDataResult = await fetchSensorData();
          setTotalData(allDataResult);
          
          let filteredDataResult;
          if (timeFilter === "all") {
              filteredDataResult = allDataResult;
          } else {
              filteredDataResult = await fetchSensorDataByTimeRange(parseInt(timeFilter));
          }
          
          setAllData(filteredDataResult);
          setLastUpdated(new Date());
      } catch (error) {
          console.error("Error loading all data:", error);
      } finally {
          setLoading(false);
      }
  }, [timeFilter]); // ✅ Pastikan `timeFilter` sebagai dependensi
  
  // Setup Supabase realtime subscription
  useEffect(() => {
      loadChartData();
      loadAllData();
  
      const subscription = subscribeToSensorData(async (payload) => {
          console.log("Received realtime update:", payload);
          await loadChartData();
          await loadAllData();
      });
  
      return () => {
          subscription.unsubscribe();
      };
  }, [timeFilter, loadChartData, loadAllData]); // ✅ Tambahkan `loadChartData` & `loadAllData` sebagai dependensi  

    // Refresh data manual
    const refreshData = async () => {
      setIsRefreshing(true); // Aktifkan animasi saat tombol diklik
      try {
          await loadChartData();
          await loadAllData();
      } finally {
          setTimeout(() => {
              setIsRefreshing(false); // Nonaktifkan animasi setelah selesai refresh
          }, 800); // Beri delay kecil agar animasi terlihat
      }
  };

    // Gunakan data yang sesuai untuk masing-masing chart
    const filteredData = allData;
    
    // Calculate stats from current data
    const calculateStats = (data: DailyPatternData[]) => {
      if (data.length === 0) {
        return {
          avgTilt: "0.00",
          avgRainfall: "0.00",
          avgMoisture: "0.00",
          currentTilt: "0.00",
          currentRainfall: "0.00",
          currentMoisture: "0.00",
          maxTilt: "0.00",
          maxRainfall: "0.00",
          maxMoisture: "0.00"
        };
      }
      
      // Menghitung rata-rata dari data
      const avgTilt = data.reduce((acc, curr) => acc + curr.tilt, 0) / data.length;
      const avgRainfall = data.reduce((acc, curr) => acc + curr.rainfall, 0) / data.length;
      const avgMoisture = data.reduce((acc, curr) => acc + curr.moisture, 0) / data.length;
      
      // Current values (latest readings)
      const currentTilt = data[data.length - 1].tilt;
      const currentRainfall = data[data.length - 1].rainfall;
      const currentMoisture = data[data.length - 1].moisture;
      
      // Max values
      const maxTilt = Math.max(...data.map(item => item.tilt));
      const maxRainfall = Math.max(...data.map(item => item.rainfall));
      const maxMoisture = Math.max(...data.map(item => item.moisture));
      
      return {
        avgTilt: avgTilt.toFixed(2),
        avgRainfall: avgRainfall.toFixed(2),
        avgMoisture: avgMoisture.toFixed(2),
        currentTilt: currentTilt.toFixed(2),
        currentRainfall: currentRainfall.toFixed(2),
        currentMoisture: currentMoisture.toFixed(2),
        maxTilt: maxTilt.toFixed(2),
        maxRainfall: maxRainfall.toFixed(2),
        maxMoisture: maxMoisture.toFixed(2)
      };
    };
    
    const convertedData: DailyPatternData[] = filteredData.map((data) => ({
      tilt: data.tilt_angle, 
      rainfall: data.rain_intensity, 
      moisture: data.soil_moisture,
      time: data.created_at,
    }));    
    
    const stats = calculateStats(convertedData);    
    
    // Batas maksimum sesuai permintaan
    const tiltMaxLimit = 90;
    const rainMaxLimit = 30;
    const moistureMaxLimit = 100;
  
    // Hitung persentase untuk progress bar
    const tiltPercentage = (Number(stats.currentTilt) / Number(tiltMaxLimit)) * 100;
    const rainPercentage = (Number(stats.currentRainfall) / Number(rainMaxLimit)) * 100;
    const moisturePercentage = (Number(stats.currentMoisture) / Number(moistureMaxLimit)) * 100;

    // Export data to CSV
  const exportToCSV = () => {
    const headers = ["Date", "Time", "Tilt (°)", "Rainfall (mm/h)", "Soil Moisture (%)"];
        const csvRows = [
            headers.join(','),
            ...allData.map(row => 
              [
                new Date(row.created_at).toLocaleString(), 
                row.tilt_angle.toFixed(1), 
                row.rain_intensity.toFixed(1), 
                row.soil_moisture.toFixed(1)
              ].join(',')
            )
        ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `landslide-data-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-4 mt-2 md:mx-8 lg:mx-12 md:mt-3">
      {/* Header area with filters and controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100">System Data</h1>
                {lastUpdated ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                  No data available
                </p>
              )}
              </div>
              
              <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0 ">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Time Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data</SelectItem>
                    <SelectItem value="1">Last Hour</SelectItem>
                    <SelectItem value="6">Last 6 Hours</SelectItem>
                    <SelectItem value="12">Last 12 Hours</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={refreshData}
                  disabled={isRefreshing} // Gunakan isRefreshing bukan loading
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={exportToCSV}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </div>

      {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
              <Card className="h-auto bg-white dark:bg-[#1A1E23]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-800 dark:text-gray-100 text-xs md:text-base lg:text-lg font-bold">Amount of Data</CardTitle>
                    <Database className="w-5 h-5 md:w-6 md:h-6 text-gray-800 dark:text-gray-100" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <p className="text-gray-800 dark:text-gray-100 text-xl md:text-2xl lg:text-3xl font-black">{totalData.length}</p>
                    <p className="text-xs text-gray-800 dark:text-gray-100">Total records</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="h-auto bg-white dark:bg-[#1A1E23]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-800 dark:text-gray-100 text-xs md:text-base lg:text-lg font-bold">Filtered Data</CardTitle>
                    <Layers className="w-5 h-5 md:w-6 md:h-6 text-gray-800 dark:text-gray-100" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <p className="text-gray-800 dark:text-gray-100 text-xl md:text-2xl lg:text-3xl font-black">{filteredData.length}</p>
                    <p className="text-xs text-gray-800 dark:text-gray-100">{timeFilter === "all" ? "All records" : `Last ${timeFilter}h`}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="h-auto bg-white dark:bg-[#1A1E23]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-800 dark:text-gray-100 text-xs md:text-base lg:text-lg font-bold">Soil Tilt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <div className="flex items-baseline">
                      <p className="text-gray-800 dark:text-gray-100 text-xl md:text-2xl lg:text-3xl font-black">{stats.currentTilt}°</p>
                      <span className="text-xs ml-1 text-gray-800 dark:text-gray-100">avg: {stats.avgTilt}°</span>
                    </div>
                    <Progress value={tiltPercentage} className="h-2 w-full bg-[#E9ECEF] dark:bg-[#495057] mt-2 [&>div]:bg-[#ef4444]" />
                    <p className="text-xs text-gray-800 dark:text-gray-100 mt-1">Current / Maximum: {tiltMaxLimit}°</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="h-auto bg-white dark:bg-[#1A1E23]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-800 dark:text-gray-100 text-xs md:text-base lg:text-lg font-bold">Rain Intensity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <div className="flex items-baseline">
                      <p className="text-gray-800 dark:text-gray-100 text-xl md:text-2xl lg:text-3xl font-black">{stats.currentRainfall}</p>
                      <span className="text-xs ml-1 text-gray-800 dark:text-gray-100">mm/h</span>
                    </div>
                    <Progress value={rainPercentage} className="h-2 w-full bg-[#E9ECEF] dark:bg-[#495057] mt-2 [&>div]:bg-[#3b82f6]" />
                    <p className="text-xs text-gray-800 dark:text-gray-100 mt-1">Current / Maximum: {rainMaxLimit} mm/h</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="h-auto bg-white dark:bg-[#1A1E23]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-800 dark:text-gray-100 text-xs md:text-base lg:text-lg font-bold">Soil Moisture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col">
                    <div className="flex items-baseline">
                      <p className="text-gray-800 dark:text-gray-100 text-xl md:text-2xl lg:text-3xl font-black">{stats.currentMoisture}</p>
                      <span className="text-xs ml-1 text-gray-800 dark:text-gray-100">%</span>
                    </div>
                    <Progress value={moisturePercentage} className="h-2 w-full bg-[#E9ECEF] dark:bg-[#495057] mt-2 [&>div]:bg-[#22c55e]" />
                    <p className="text-xs text-grayy-800 dark:text-gray-100 mt-1">Current / Maximum: {moistureMaxLimit}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
      {/* Chart and data tabs */}
            <Tabs defaultValue="charts" className="mt-4">
              <TabsList className="mb-2">
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
              </TabsList>
              
              {/* Tabs Content untuk Charts */}
            <TabsContent value="charts" className="space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white dark:bg-[#1A1E23]">
                    <CardHeader>
                      <CardTitle className="text-gray-800 dark:text-gray-100 text-sm md:text-lg lg:text-xl font-bold">Soil Tilt</CardTitle>
                      <CardDescription>
                        Current: {stats.currentTilt}° | Max: {stats.maxTilt}° | 
                        {timeFilter === "all" ? " Showing latest 8 records" : ` Filtered by last ${timeFilter}h (Showing latest 8 records)`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DataChart 
                        data={tiltRainData as DataPoint[]} 
                        dataKey="tilt" 
                        color="#ef4444" 
                        name="Tilt Angle" 
                        unit="°" 
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white dark:bg-[#1A1E23]">
                    <CardHeader>
                      <CardTitle className="text-gray-800 dark:text-gray-100 text-sm md:text-lg lg:text-xl font-bold">Rain Intensity</CardTitle>
                      <CardDescription>
                        Current: {stats.currentRainfall} mm/h | Max: {stats.maxRainfall}° mm/h | 
                        {timeFilter === "all" ? " Showing latest 8 records" : ` Filtered by last ${timeFilter}h (Showing latest 8 records)`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DataChart 
                        data={tiltRainData as DataPoint[]} 
                        dataKey="rainfall" 
                        color="#3b82f6" 
                        name="Rain Intensity" 
                        unit="mm/h" 
                      />
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white dark:bg-[#1A1E23] md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-gray-800 dark:text-gray-100 text-sm md:text-lg lg:text-xl font-bold">Soil Moisture</CardTitle>
                      <CardDescription>
                        Current: {stats.currentMoisture} % | Max: {stats.maxMoisture} % | 
                        {timeFilter === "all" ? " Showing latest 8 records" : ` Filtered by last ${timeFilter}h (Showing latest 8 records)`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DataChart 
                        data={moistureData as DataPoint[]} 
                        dataKey="moisture" 
                        color="#22c55e" 
                        name="Soil Moisture" 
                        unit="%" 
                      />
                    </CardContent>
                  </Card>
                </div>
            </TabsContent>
              
              <TabsContent value="data" className="mb-8">
                <Card className="bg-white dark:bg-[#1A1E23]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-800 dark:text-gray-100 text-sm md:text-lg lg:text-xl font-bold">Data Table</CardTitle>
                      <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center gap-1">
                        <FileDown className="w-4 h-4" />
                        Export
                      </Button>
                    </div>
                    <CardDescription>Showing {filteredData.length} records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto max-h-[400px]">
                      <Table className="border-2">
                        <TableHeader className="sticky top-0 bg-[#22c55e] border-2 z-10">
                          <TableRow>
                            <TableHead className="text-gray-100 text-xs sm:text-sm border-2 font-semibold text-center">Date</TableHead>
                            <TableHead className="text-gray-100 text-xs sm:text-sm border-2 font-semibold text-center">Time</TableHead>
                            <TableHead className="text-gray-100 text-right text-xs sm:text-sm border-2 font-semibold text-center">Tilt (°)</TableHead>
                            <TableHead className="text-gray-100 text-right text-xs sm:text-sm border-2 font-semibold text-center">Rain (mm/h)</TableHead>
                            <TableHead className="text-gray-100 text-right text-xs sm:text-sm border-2 font-semibold text-center">Moisture (%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((row, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-gray-800 dark:text-gray-100 text-xs sm:text-sm text-center border-2">
                                {new Date(row.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="font-medium text-gray-800 dark:text-gray-100 text-xs sm:text-sm text-center border-2">
                                {new Date(row.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                              </TableCell>
                              <TableCell className="font-medium text-gray-800 dark:text-gray-100 text-xs sm:text-sm text-center border-2">
                                {row.tilt_angle.toFixed(1)}
                              </TableCell>
                              <TableCell className="font-medium text-gray-800 dark:text-gray-100 text-xs sm:text-sm text-center border-2">
                                {row.rain_intensity.toFixed(1)}
                              </TableCell>
                              <TableCell className="font-medium text-gray-800 dark:text-gray-100 text-xs sm:text-sm text-center border-2">
                                {row.soil_moisture.toFixed(1)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
    </div>
  );
};

export default Dashboard;
