import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ZoomOut, Target, RotateCcw, BarChart3, Bookmark, BookmarkCheck, Crosshair } from 'lucide-react';
import { LogoImg } from '@/components/LogoImg';
import { Button } from '@/components/ui/button';
import { WorldMap } from './WorldMap';
import { Puzzle } from '@/lib/gameData';
import { reverseGeocodeDetailed, DetailedLocation } from '@/lib/landChecker';
import { saveMap, isMapSaved } from '@/lib/savedMaps';
import { countryToContinent } from '@/lib/statsManager';

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
  const [guessLocation, setGuessLocation] = useState<DetailedLocation | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    reverseGeocodeDetailed(puzzle.location.lat, puzzle.location.lng).then(setLocation);
    reverseGeocodeDetailed(guess.lat, guess.lng).then(setGuessLocation);
    setIsSaved(isMapSaved(puzzle.location.lat, puzzle.location.lng));
  }, [puzzle.location.lat, puzzle.location.lng, guess.lat, guess.lng]);

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

  // Helper to determine if guess is in same country/continent using mapping
  const extraBandLabel = useMemo(() => {
    if (location && guessLocation) {
      if (location.country && guessLocation.country && location.country === guessLocation.country) {
        return 'Same Country';
      } else {
        const actualContinent = countryToContinent[location.country || ''] || null;
        const guessContinent = countryToContinent[guessLocation.country || ''] || null;
        if (actualContinent && guessContinent && actualContinent === guessContinent) {
          return 'Same Continent';
        }
      }
    }
    return null;
  }, [location, guessLocation]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 max-w-2xl mx-auto w-full sm:gap-6 sm:p-6 md:gap-8 md:p-8 mb-8 pb-8">
      {/* Result Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center p-4 rounded-lg border-2 ${tierStyles[result.distanceBand.tier]} sm:p-6 md:p-8`}
      >
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-1 break-words">
          {result.distanceBand.label}
        </h2>
        {extraBandLabel && (
          <p className="text-xs sm:text-sm mt-2 text-foreground font-medium">{extraBandLabel}</p>
        )}
        <p className="text-xs sm:text-sm opacity-80">
          {formatDistance(result.distanceKm)} away
        </p>
      </motion.div>

      {/* Location Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-3 bg-card rounded-lg border border-border sm:p-4 md:p-6"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <LogoImg className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground text-sm sm:text-base md:text-lg">
              {location?.displayName || 'Loading...'}
            </p>
            {location?.country && location.displayName !== location.country && (
              <p className="text-xs sm:text-sm text-muted-foreground">{location.country}</p>
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
        className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3"
      >
        <div className="bg-card rounded-lg p-3 border border-border sm:p-4 md:p-6">
          <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground mb-1 sm:mb-2">
            <Target className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Distance</span>
          </div>
          <p className="font-display text-base sm:text-xl font-semibold text-foreground">
            {formatDistance(result.distanceKm)}
          </p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border sm:p-4 md:p-6">
          <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground mb-1 sm:mb-2">
            <Crosshair className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Your Guess</span>
          </div>
          <p className="font-display text-xs sm:text-sm font-semibold text-foreground">
            {formatCoords(guess.lat, guess.lng)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {guessLocation?.displayName || 'Looking up...'}
          </p>
        </div>
        <div className="bg-card rounded-lg p-3 border border-border sm:p-4 md:p-6">
          <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground mb-1 sm:mb-2">
            <ZoomOut className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Zooms</span>
          </div>
          <p className="font-display text-base sm:text-xl font-semibold text-foreground">
            {result.zoomUsed}<span className="text-xs sm:text-sm font-normal text-muted-foreground">/{maxZoom - 1}</span>
          </p>
        </div>
      </motion.div>
      
      {/* Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 min-h-[140px] sm:min-h-[180px] rounded-lg overflow-hidden border border-border"
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
        className="flex flex-col gap-2 sm:flex-row sm:gap-3"
      >
        <Button 
          onClick={handleSaveMap}
          variant={isSaved ? "secondary" : "outline"}
          size="lg" 
          className="gap-2 w-full sm:w-auto"
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
          className="flex-1 gap-2 w-full sm:w-auto"
        >
          <BarChart3 className="h-4 w-4" />
          Stats
        </Button>
        <Button onClick={onPlayAgain} size="lg" className="flex-1 gap-2 w-full sm:w-auto">
          <RotateCcw className="h-4 w-4" />
          Play Again
        </Button>
      </motion.div>
    </div>
  );
};
