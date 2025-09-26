'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { unexpectedStopCheckIn } from '@/ai/flows/unexpected-stop-check-in';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Bot, CheckCircle, Shield, Timer, Zap } from 'lucide-react';

type Status = 'safe' | 'timer_active' | 'alert_sent' | 'check_in_sent';
type Location = { lat: number, lon: number } | null;

const MOCK_USER_PHONE = '+15550001111';
const MOCK_GUARDIAN_PHONE = '+15552223333';
const UNEXPECTED_STOP_THRESHOLD_S = 30; // 30 seconds

export function DashboardClient() {
  const { toast } = useToast();

  const [timerDuration, setTimerDuration] = useState(20);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [status, setStatus] = useState<Status>('safe');
  const [battery, setBattery] = useState(92);
  const [isRecording, setIsRecording] = useState(false);

  const [location, setLocation] = useState<Location>(null);
  const [lastLocation, setLastLocation] = useState<Location>(null);
  const [stoppedTime, setStoppedTime] = useState(0);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (timerDuration > 0) {
      setIsTimerActive(true);
      setStatus('timer_active');
      setTimerRemaining(timerDuration * 60);
      toast({
        title: 'Home-Safe Timer Started',
        description: `Your location is being shared with guardians for ${timerDuration} minutes.`,
      });
    }
  };

  const stopTimer = (reason: 'safe' | 'expired') => {
    setIsTimerActive(false);
    setStatus('safe');
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (reason === 'safe') {
      toast({
        title: "You've arrived safely!",
        description: 'The Home-Safe timer has been stopped.',
      });
    } else if (reason === 'expired') {
      setStatus('alert_sent');
      toast({
        title: 'Timer Expired: Alert Sent',
        description: "You didn't check in. An alert has been sent to your guardians.",
        variant: 'destructive',
      });
    }
  };

  const triggerSilentAlert = () => {
    setStatus('alert_sent');
    setIsRecording(true);
    toast({
      title: 'Emergency Alert Activated',
      description: 'Your location and live audio are being sent to your guardians and emergency services.',
      variant: 'destructive',
    });
    setTimeout(() => setIsRecording(false), 5000);
  };

  const handleUnexpectedStop = useCallback(async () => {
    if (!location || !lastLocation || status === 'alert_sent') return;

    try {
      const result = await unexpectedStopCheckIn({
        latitude: location.lat,
        longitude: location.lon,
        lastKnownLatitude: lastLocation.lat,
        lastKnownLongitude: lastLocation.lon,
        timeStopped: stoppedTime,
        guardianPhoneNumber: MOCK_GUARDIAN_PHONE,
        userPhoneNumber: MOCK_USER_PHONE,
      });

      if (result.shouldSendCheckIn) {
        setStatus('check_in_sent');
        toast({
          title: 'Automated Check-in Sent',
          description: "It looks like you've stopped unexpectedly. We've sent a check-in text to your guardian.",
        });
      }
    } catch (error) {
      console.error('AI check-in failed:', error);
      toast({
        title: 'AI Check-in Error',
        description: 'Could not perform the automated check-in.',
        variant: 'destructive',
      });
    }
  }, [location, lastLocation, stoppedTime, toast, status]);

  useEffect(() => {
    if (isTimerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            stopTimer('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerActive]);

  useEffect(() => {
    const simulateLocation = () => {
      setLastLocation(location);
      const shouldMove = Math.random() > 0.3 || !isTimerActive; 
      setLocation(prev => {
        if (!prev || shouldMove) {
          return {
            lat: 34.0522 + (Math.random() - 0.5) * 0.01,
            lon: -118.2437 + (Math.random() - 0.5) * 0.01,
          };
        }
        return prev;
      });
    };
    if (location === null) {
      simulateLocation();
    }
    locationIntervalRef.current = setInterval(simulateLocation, 5000);

    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [location, isTimerActive]);

  useEffect(() => {
    if (location && lastLocation && location.lat === lastLocation.lat && location.lon === lastLocation.lon) {
      setStoppedTime(prev => prev + 5);
    } else {
      setStoppedTime(0);
    }
    
    if (stoppedTime >= UNEXPECTED_STOP_THRESHOLD_S) {
      handleUnexpectedStop();
      setStoppedTime(0);
    }
  }, [location, lastLocation, stoppedTime, handleUnexpectedStop]);

  const getStatusInfo = () => {
    switch(status) {
      case 'safe': return { text: 'All Systems Safe', icon: <CheckCircle className="mr-2" /> };
      case 'timer_active': return { text: 'Timer Active', icon: <Timer className="mr-2 text-primary" /> };
      case 'check_in_sent': return { text: 'Check-in Sent', icon: <Bot className="mr-2 text-accent" /> };
      case 'alert_sent': return { text: 'Emergency Alert Sent', icon: <AlertTriangle className="mr-2 text-destructive" /> };
      default: return { text: 'Standby', icon: <Shield className="mr-2"/>};
    }
  }
  const statusInfo = getStatusInfo();

  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Timer className="mr-2 text-primary" /> Home-Safe Timer</CardTitle>
              <CardDescription>Set a timer for your journey. We'll alert your guardians if you don't check in.</CardDescription>
            </CardHeader>
            <CardContent>
              {isTimerActive ? (
                <div className="text-center">
                  <p className="text-muted-foreground">Time Remaining</p>
                  <h2 className="text-6xl font-bold tracking-tighter text-primary">{formatTime(timerRemaining)}</h2>
                </div>
              ) : (
                <div className="flex items-end gap-4">
                  <div className="flex-grow">
                    <label htmlFor="duration" className="text-sm font-medium text-muted-foreground">Duration (minutes)</label>
                    <Input
                      id="duration"
                      type="number"
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(parseInt(e.target.value, 10))}
                      min="1"
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={startTimer} size="lg">Start Timer</Button>
                </div>
              )}
            </CardContent>
            {isTimerActive && (
              <CardFooter>
                <Button onClick={() => stopTimer('safe')} className="w-full" size="lg" variant="secondary">
                  <CheckCircle className="mr-2" /> I'm Safe
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Shield className="mr-2 text-destructive" /> Emergency Activation</CardTitle>
              <CardDescription>Silently alert guardians and start recording audio evidence.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive" size="lg" className="w-full h-24 text-xl" onClick={triggerSilentAlert}>
                    <div className="flex flex-col items-center justify-center">
                        <AlertTriangle className="h-8 w-8 mb-1" />
                        <span>Silent Alert</span>
                    </div>
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Device Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center text-lg font-semibold">
                    {statusInfo.icon}
                    <span>{statusInfo.text}</span>
                </div>
                 {isRecording && <Badge variant="destructive" className="animate-pulse w-full justify-center py-2">LIVE AUDIO RECORDING</Badge>}

                <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center"><Zap className="mr-2 h-4 w-4" /> Companion Battery</span>
                        <span className="font-medium">{battery}%</span>
                    </div>
                    <Progress value={battery} />
                </div>
                
                 <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Location</span>
                        <Badge variant="secondary">Live</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground/80 p-2 bg-muted rounded-md font-mono">
                        {location ? `Lat: ${location.lat.toFixed(4)}, Lon: ${location.lon.toFixed(4)}` : 'Acquiring...'}
                    </div>
                 </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
