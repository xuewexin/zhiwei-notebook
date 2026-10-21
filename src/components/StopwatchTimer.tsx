import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface StopwatchTimerProps {
  initialSeconds?: number;
  onTimeChange?: (seconds: number) => void;
  autoStart?: boolean;
  className?: string;
  themeColor?: string;
  label?: string;
}

export const formatTimerSeconds = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${String(h).padStart(2, '0')}:${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const StopwatchTimer: React.FC<StopwatchTimerProps> = ({
  initialSeconds = 0,
  onTimeChange,
  autoStart = true,
  className = '',
  themeColor = '#1e56a0',
  label = '做题计时'
}) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          onTimeChange?.(next);
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, onTimeChange]);

  const toggleRun = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    onTimeChange?.(0);
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs text-xs select-none ${className}`}
    >
      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        {label && <span className="text-[11px] font-medium hidden sm:inline">{label}:</span>}
        <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs min-w-[38px] text-center">
          {formatTimerSeconds(seconds)}
        </span>
      </div>

      <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-1.5">
        <button
          type="button"
          onClick={toggleRun}
          className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title={isRunning ? '暂停计时' : '继续计时'}
        >
          {isRunning ? (
            <Pause className="w-3 h-3 text-amber-500 fill-amber-500" />
          ) : (
            <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="重置归零"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
