import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Play, BarChart2, Info, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatsPanel } from './StatsPanel';
import { getStats } from '@/lib/statsManager';
import { getSavedMaps } from '@/lib/savedMaps';

interface MenuScreenProps {
  onStart: () => void;
}

export const MenuScreen = ({ onStart }: MenuScreenProps) => {
  const navigate = useNavigate();
  const [showStats, setShowStats] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  const stats = getStats();
  const savedMaps = getSavedMaps();

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        {showStats ? (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 p-6 max-w-2xl mx-auto w-full"
          >
            <StatsPanel onClose={() => setShowStats(false)} />
          </motion.div>
        ) : showAbout ? (
          <motion.div
            key="about"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 p-6 max-w-xl mx-auto w-full"
          >
            <AboutPanel onClose={() => setShowAbout(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6"
          >
            {/* Logo and Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground text-background rounded-full mb-6">
                <MapPin className="h-8 w-8" />
              </div>
              <h1 className="font-display text-5xl md:text-6xl tracking-tight mb-3">
                Pinpoint
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                A calm spatial puzzle game. Observe, decide, place your pin.
              </p>
            </motion.div>

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm"
            >
              <Button
                variant="editorial"
                size="xl"
                onClick={onStart}
                className="w-full gap-3"
              >
                <Play className="h-5 w-5" />
                Start Game
              </Button>
            </motion.div>

            {/* Quick Stats */}
            {stats.totalRounds > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  {stats.totalRounds} rounds played · {formatMedian(stats.medianDistance)} median
                </p>
              </motion.div>
            )}

            {/* Secondary Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 flex items-center gap-4"
            >
              <Button variant="ghost" size="sm" onClick={() => setShowStats(true)} className="gap-2">
                <BarChart2 className="h-4 w-4" />
                Stats
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/collection')} className="gap-2">
                <Globe className="h-4 w-4" />
                Collection {savedMaps.length > 0 && `(${savedMaps.length})`}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAbout(true)} className="gap-2">
                <Info className="h-4 w-4" />
                How to Play
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AboutPanel = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="h-full flex flex-col"
  >
    <div className="flex items-center justify-between mb-8">
      <Button variant="ghost" onClick={onClose} className="gap-2">
        ← Back
      </Button>
      <h2 className="font-display text-xl">How to Play</h2>
      <div className="w-20" />
    </div>

    <div className="space-y-6 text-muted-foreground">
      <section>
        <h3 className="font-medium text-foreground mb-2">The Challenge</h3>
        <p className="text-sm leading-relaxed">
          Each round presents real satellite imagery at close zoom. Your task is to identify 
          the location and place a single pin on the world map.
        </p>
      </section>

      <section>
        <h3 className="font-medium text-foreground mb-2">Zooming</h3>
        <p className="text-sm leading-relaxed">
          You can zoom out to reveal more context, but this affects your result. 
          The challenge is knowing when you have enough information to guess.
        </p>
      </section>

      <section>
        <h3 className="font-medium text-foreground mb-2">Placing Your Pin</h3>
        <p className="text-sm leading-relaxed">
          Click "Place Your Pin" when ready. On the world map, click to position your guess. 
          Once confirmed, your guess is final for that round.
        </p>
      </section>

      <section>
        <h3 className="font-medium text-foreground mb-2">Results</h3>
        <p className="text-sm leading-relaxed">
          After each round, you'll see the distance between your guess and the actual location. 
          Results are shown in distance bands rather than scores.
        </p>
      </section>
    </div>
  </motion.div>
);

const formatMedian = (km: number) => {
  if (!isFinite(km) || km === 0) return '—';
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
};
