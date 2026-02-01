'use client';

import { useEffect, useState, useRef } from 'react';
import { Terminal, Play, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { LoadingScreen } from '@/components/ui/loading-bar';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface ScraperProgressResponse {
  message: string;
  response: {
    current_phase: string;
    elapsed_time: string;
    last_log: string;
    percentage: string;
    processed: number;
    total: number;
  };
  running: boolean;
  status: string;
}

export default function ForceRunScraperPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useSelector((state: RootState) => state.auth);
  const [data, setData] = useState<ScraperProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const shouldPoll = useRef(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Poll for progress
  useEffect(() => {
    if (!user) return;

    let intervalId: NodeJS.Timeout;

    const fetchProgress = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/webhook/scraper`);
        if (!res.ok) throw new Error('Failed to fetch status');
        
        const json: ScraperProgressResponse = await res.json();
        setData(json);
        
        // Enable polling if scraper is running
        if (json.running) {
          shouldPoll.current = true;
        }
        
        // Add last log to history if it's new
        if (json.response?.last_log) {
          setLogs(prev => {
            if (prev[prev.length - 1] !== json.response.last_log) {
              return [...prev, json.response.last_log].slice(-100); // Keep last 100 logs
            }
            return prev;
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Initial fetch to check status
    fetchProgress();

    // Poll every 2000ms if scraper is running
    intervalId = setInterval(() => {
      if (shouldPoll.current) {
        fetchProgress();
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [user]);

  // Auto-scroll logs within container only
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const startScraper = async () => {
    setIsLoading(true);
    setError(null);
    setLogs([]); // Clear previous logs
    try {
      const res = await fetch(`${API_BASE_URL}/webhook/scraper`, {
        method: 'POST',
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
           // Already running, just enable polling
           shouldPoll.current = true;
        } else {
          throw new Error(json.message || 'Failed to start scraper');
        }
      } else {
        // Successfully started, enable polling
        shouldPoll.current = true;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'GET': return 'text-blue-400';
      case 'BUILD': return 'text-yellow-400';
      case 'CLEAN': return 'text-red-400';
      case 'SETUP': return 'text-purple-400';
      default: return 'text-green-400';
    }
  };

  const percentageValue = data?.response?.percentage 
    ? parseFloat(data.response.percentage.replace('%', '')) 
    : 0;

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="w-full bg-background text-foreground">
      <div className="max-w-6xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Scraper Control Panel</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm font-mono">
                <span className={`w-2 h-2 rounded-full ${data?.running ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`}></span>
                <span className="text-muted-foreground">{data?.running ? 'Running' : 'Idle'}</span>
             </div>
             {data?.running ? (
               <Button 
                 variant="destructive" 
                 size="sm"
                 className="font-mono"
                 disabled
               >
                 <Square className="w-3 h-3 mr-2" />
                 Stop (Locked)
               </Button>
             ) : (
               <Button 
                onClick={startScraper}
                disabled={isLoading}
                size="sm"
                className="font-mono"
              >
                {isLoading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Play className="w-3 h-3 mr-2" />}
                Start Scraper
              </Button>
             )}
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-lg">
            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Phase</div>
            <div className={`text-lg font-bold ${getPhaseColor(data?.response?.current_phase || '')}`}>
              {data?.response?.current_phase || 'Ready'}
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg">
            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Elapsed Time</div>
            <div className="text-lg font-bold font-mono">
              {data?.response?.elapsed_time || '0s'}
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg">
            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Progress</div>
            <div className="text-lg font-bold font-mono">
              {data?.response?.processed || 0}
              <span className="text-sm text-muted-foreground ml-1">/ {data?.response?.total || 0}</span>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg">
             <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Complete</div>
             <div className="text-lg font-bold font-mono">
               {data?.response?.percentage || '0%'}
             </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
           <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-mono">{Math.round(percentageValue)}%</span>
           </div>
           
           {/* Progress Bar */}
           <div className="h-3 w-full bg-secondary border border-border relative overflow-hidden rounded-full">
              <div 
                className="h-full bg-primary relative transition-all duration-300 ease-out"
                style={{ width: `${percentageValue}%` }}
              >
                  {data?.running && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  )}
              </div>
           </div>
        </div>

        {/* Terminal Output */}
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-[500px]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/50">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Live Output</span>
          </div>
          <div 
            ref={logsContainerRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-muted/20"
          >
            {logs.length === 0 ? (
               <div className="text-muted-foreground italic">Waiting for output...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="break-all border-l-2 border-transparent hover:border-primary/50 pl-2 py-0.5 transition-colors">
                  <span className="text-muted-foreground mr-2">[{i + 1}]</span>
                  <span className={
                    log.includes('Success') ? 'text-green-600 dark:text-green-400' : 
                    log.includes('Failed') ? 'text-red-600 dark:text-red-400' : 
                    log.includes('Skipped') ? 'text-yellow-600 dark:text-yellow-400' : 
                    'text-foreground'
                  }>
                    {log}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
        
        {error && (
            <div className="bg-destructive/10 border border-destructive/50 p-4 rounded-lg text-destructive text-sm">
                <strong>Error:</strong> {error}
            </div>
        )}

      </div>
    </div>
  );
}
