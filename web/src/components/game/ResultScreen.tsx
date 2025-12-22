import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ZoomOut, Target, RotateCcw, BarChart3, Bookmark, BookmarkCheck, Crosshair } from 'lucide-react';
import { LogoImg } from '@/components/LogoImg';
import { Button } from '@/components/ui/button';
import { WorldMap } from './WorldMap';
import { Puzzle } from '@/lib/gameData';
import { reverseGeocodeDetailed, DetailedLocation } from '@/lib/landChecker';
import { saveMap, isMapSaved } from '@/lib/savedMaps';

interface ResultScreenProps {
  puzzle: Puzzle;
  guess: { lat: number; lng: number };
  result: {
    distanceKm: number;
    distanceBand: { label: string; tier: 'excellent' | 'good' | 'fair' | 'far' };
    zoomUsed: number;
  };
  maxZoom: number;
  onPlayAgain: () => void;
}

const tierStyles = {
  excellent: 'bg-primary/10 border-primary text-primary',
  good: 'bg-accent/10 border-accent text-accent-foreground',
  fair: 'bg-secondary border-secondary text-secondary-foreground',
  far: 'bg-muted border-muted-foreground/20 text-muted-foreground',
};

export const ResultScreen = ({
  puzzle,
  guess,
  result,
  maxZoom,
  onPlayAgain,
}: ResultScreenProps) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<DetailedLocation | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    reverseGeocodeDetailed(puzzle.location.lat, puzzle.location.lng).then(setLocation);
    setIsSaved(isMapSaved(puzzle.location.lat, puzzle.location.lng));
  }, [puzzle.location.lat, puzzle.location.lng]);

  const handleSaveMap = () => {
    if (!location) return;
    
    saveMap({
      lat: puzzle.location.lat,
      lng: puzzle.location.lng,
      country: location.country,
      city: location.city,
      state: location.state,
      landmark: location.landmark,
      displayName: location.displayName,
      distanceKm: result.distanceKm,
    });
    
    setIsSaved(true);
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km).toLocaleString()} km`;
  };

  const formatCoords = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Result Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center p-6 rounded-lg border-2 ${tierStyles[result.distanceBand.tier]}`}
      >
        <h2 className="font-display text-3xl font-bold mb-1">
          {result.distanceBand.label}
        </h2>
        <p className="text-sm opacity-80">
          {formatDistance(result.distanceKm)} away
        </p>
      </motion.div>

      {/* Location Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 bg-card rounded-lg border border-border"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <LogoImg className="h-12 w-12" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">
              {location?.displayName || 'Loading...'}
            </p>
            {location?.country && location.displayName !== location.country && (
              <p className="text-sm text-muted-foreground">{location.country}</p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">
              {formatCoords(puzzle.location.lat, puzzle.location.lng)}
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Distance</span>
          </div>
          <p className="font-display text-xl font-semibold text-foreground">
            {formatDistance(result.distanceKm)}
          </p>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Crosshair className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Your Guess</span>
          </div>
          <p className="font-display text-sm font-semibold text-foreground">
            {formatCoords(guess.lat, guess.lng)}
          </p>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ZoomOut className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Zooms</span>
          </div>
          <p className="font-display text-xl font-semibold text-foreground">
            {result.zoomUsed}<span className="text-sm font-normal text-muted-foreground">/{maxZoom - 1}</span>
          </p>
        </div>
      </motion.div>
      
      {/* Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 min-h-[180px] rounded-lg overflow-hidden border border-border"
      >
        <WorldMap
          guess={guess}
          actualLocation={{
            lat: puzzle.location.lat,
            lng: puzzle.location.lng,
          }}
          showResult
          onPlacePin={() => {}}
          onSubmit={() => {}}
          onBack={() => {}}
        />
      </motion.div>
      
      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3"
      >
        <Button 
          onClick={handleSaveMap}
          variant={isSaved ? "secondary" : "outline"}
          size="lg" 
          className="gap-2"
          disabled={isSaved || !location}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              Save
            </>
          )}
        </Button>
        <Button 
          onClick={() => navigate('/stats')} 
          variant="outline" 
          size="lg" 
          className="flex-1 gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Stats
        </Button>
        <Button onClick={onPlayAgain} size="lg" className="flex-1 gap-2">
          <RotateCcw className="h-4 w-4" />
          Play Again
        </Button>
      </motion.div>
    </div>
  );
};
