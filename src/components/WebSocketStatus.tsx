import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface WebSocketStatusProps {
  isConnected: boolean;
  error?: string | null;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ isConnected }) => {
  return (
    <div className="flex items-center">
      {isConnected ? (
        <>
          <Wifi className="h-5 w-5 text-green-500 mr-2 animate-pulse" />
          <span className="text-green-500 font-medium text-sm">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-500 font-medium text-sm">Disconnected</span>
        </>
      )}
    </div>
  );
};