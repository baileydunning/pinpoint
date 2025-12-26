import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomIn, ZoomOut, MapPin, HelpCircle, BarChart2, Layers, Bookmark, Calendar, Trophy, CheckCircle, Clock } from 'lucide-react';
import { LogoImg } from '@/components/LogoImg';
import { getTimeUntilNextPuzzle } from '@/lib/dailyPuzzle';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface SatelliteViewerProps {
  lat: number;
  lng: number;
  zoomLevel: number;
  zoomStep: number;
  maxZoomSteps: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPlacePin: () => void;
  gameMode?: 'daily' | 'practice';
  dailyCompleted?: boolean;
  onStartDaily?: () => Promise<boolean | void>;
}

type MapStyle = 'satellite' | 'physical' | 'relief';

const mapStyles: Record<MapStyle, { name: string; url: string; maxZoom: number }> = {
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
  },
  physical: {
    name: 'Physical',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 8,
  },
  relief: {
    name: 'Shaded Relief',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 13,
  },
};

export const SatelliteViewer = ({
  lat,
  lng,
  zoomLevel,
  zoomStep,
  maxZoomSteps,
  onZoomIn,
  onZoomOut,
  onPlacePin,
  gameMode = 'practice',
  dailyCompleted = false,
  onStartDaily,
}: SatelliteViewerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [mapStyleState, setMapStyle] = useState<MapStyle>('satellite');
  const [countdown, setCountdown] = useState(getTimeUntilNextPuzzle());
  // Fallback to 'satellite' if stored style no longer exists (e.g., after HMR)
  const mapStyle: MapStyle = mapStyles[mapStyleState] ? mapStyleState : 'satellite';

  // Update countdown every second when daily is completed
  useEffect(() => {
    if (!dailyCompleted) return;
    const interval = setInterval(() => {
      setCountdown(getTimeUntilNextPuzzle());
    }, 1000);
    return () => clearInterval(interval);
  }, [dailyCompleted]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: zoomLevel,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
        boxZoom: false,
      });

      tileLayerRef.current = L.tileLayer(mapStyles[mapStyle].url, {
        maxZoom: mapStyles[mapStyle].maxZoom,
      }).addTo(mapRef.current);
    }

    return () => {};
  }, []);

  // Handle map style changes
  useEffect(() => {
    if (mapRef.current && tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = L.tileLayer(mapStyles[mapStyle].url, {
        maxZoom: mapStyles[mapStyle].maxZoom,
      }).addTo(mapRef.current);
    }
  }, [mapStyle]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], zoomLevel, { animate: true, duration: 0.5 });
    }
  }, [zoomLevel, lat, lng]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleDailyClick = async () => {
    if (dailyCompleted) {
      toast.info("You've already completed today's challenge!", {
        description: "Come back tomorrow for a new puzzle.",
      });
      return;
    }
    if (onStartDaily) {
      await onStartDaily();
    }
  };

  const zoomsRemaining = maxZoomSteps - 1 - zoomStep;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <LogoImg className="h-16 w-16" />
          </div>
          <div>
            <h1 className="font-display text-xl">Pinpoint</h1>
            <p className="text-xs text-muted-foreground">
              {gameMode === 'daily' ? 'Daily Challenge' : 'Guess The Location'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Daily Challenge Button */}
          {gameMode === 'practice' && onStartDaily && (
            dailyCompleted ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
                <Clock className="h-4 w-4" />
                <span className="font-mono">
                  {countdown.hours.toString().padStart(2, '0')}:
                  {countdown.minutes.toString().padStart(2, '0')}:
                  {countdown.seconds.toString().padStart(2, '0')}
                </span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDailyClick}
                className="gap-2 border-primary/50 hover:bg-primary/10"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Daily Challenge</span>
              </Button>
            )
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(true)}
            className="h-9 w-9"
            aria-label="How to play"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Link to="/highscores">
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="High Scores">
              <Trophy className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/collection">
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Collection">
              <Bookmark className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/stats">
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Stats">
              <BarChart2 className="h-5 w-5" />
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/50 p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg p-6 max-w-md w-full border border-border shadow-lg"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="font-display text-2xl mb-4">How to Play</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-1">Observe</h3>
                  <p>You start with a close-up satellite view of a location somewhere in the world.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Zoom Out</h3>
                  <p>Use the zoom controls to reveal more context. You have {maxZoomSteps - 1} zoom levels available.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Place Your Pin</h3>
                  <p>When ready, click the map button and place your guess on the world map.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Results</h3>
                  <p>See how close you got. The less zoom you use, the more impressive your guess.</p>
                </div>
              </div>
              <Button onClick={() => setShowHelp(false)} className="w-full mt-6">
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Satellite Map Container */}
      <div className="relative flex-1 bg-foreground/5 overflow-hidden rounded-lg border border-border">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Zoom indicator */}
        <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm rounded px-3 py-2 border border-border z-[1000]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Zoom</span>
            <div className="flex gap-1">
              {Array.from({ length: maxZoomSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-sm transition-colors ${
                    i <= zoomStep ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Map style selector */}
        <div className="absolute top-3 right-3 z-[1001]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2 bg-background backdrop-blur-sm border border-border">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">{mapStyles[mapStyle].name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[1002] bg-popover pointer-events-auto">
              {(Object.keys(mapStyles) as MapStyle[]).map((style) => (
                <DropdownMenuItem
                  key={style}
                  onClick={() => setMapStyle(style)}
                  className={mapStyle === style ? 'bg-accent' : ''}
                >
                  {mapStyles[style].name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Crosshair */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
          <div className="w-10 h-10 rounded-full border-2 border-primary/50" />
          <div className="absolute w-1 h-1 rounded-full bg-primary" />
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-background rounded-lg p-1 border border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={onZoomIn}
              disabled={zoomStep === 0}
              className="h-9 w-9"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onZoomOut}
              disabled={zoomStep >= maxZoomSteps - 1}
              className="h-9 w-9"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="hidden sm:block">
            <p className="text-sm font-medium">
              {zoomStep === 0 ? 'Closest view' : `${zoomStep}x zoomed out`}
            </p>
            <p className="text-xs text-muted-foreground">
              {zoomsRemaining > 0 ? `${zoomsRemaining} zoom${zoomsRemaining !== 1 ? 's' : ''} remaining` : 'Max zoom reached'}
            </p>
          </div>
        </div>
        
        <Button onClick={onPlacePin} className="gap-2">
          <MapPin className="h-4 w-4" />
          Place Pin
        </Button>
      </div>
    </div>
  );
};
