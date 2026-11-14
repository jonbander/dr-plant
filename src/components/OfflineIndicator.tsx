import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Wifi, Sparkles, CheckCircle2 } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-300 text-xs font-medium backdrop-blur-sm animate-pulse">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>يعمل بدون نت 100% (Offline)</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>المعالج العصبي مفعّل محلياً</span>
        </div>
      )}
    </div>
  );
};
