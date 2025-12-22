import { motion } from 'framer-motion';
import { ArrowLeft, Target, ZoomOut, Map, TrendingUp, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStats, getTopCountries, getContinentDistribution } from '@/lib/statsManager';

interface StatsPanelProps {
  onClose: () => void;
}

export const StatsPanel = ({ onClose }: StatsPanelProps) => {
  const stats = getStats();
  const topCountries = getTopCountries(stats, 3);
  const continents = getContinentDistribution(stats);
  const uniqueCountries = Object.keys(stats.countriesVisited).length;
  
  const formatDistance = (km: number) => {
    if (!isFinite(km) || km === 0) return '—';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km).toLocaleString()} km`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={onClose} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="font-display text-xl">Your Progress</h2>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-8">
        {/* Overview Stats */}
        <section>
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-3 w-3" />
            Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Rounds"
              value={stats.totalRounds.toString()}
            />
            <StatCard
              label="Countries"
              value={uniqueCountries.toString()}
              icon={<Flag className="h-4 w-4" />}
            />
            <StatCard
              label="Best Distance"
              value={formatDistance(stats.bestDistance)}
              icon={<Target className="h-4 w-4" />}
            />
            <StatCard
              label="Avg. Zoom"
              value={stats.averageZoomLevel.toFixed(1) + 'x'}
              icon={<ZoomOut className="h-4 w-4" />}
            />
          </div>
        </section>

        {/* Continents */}
        {continents.length > 0 && (
          <section>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <Map className="h-3 w-3" />
              Continents
            </h3>
            <div className="flex flex-wrap gap-2">
              {continents.map(({ continent, count }) => (
                <span
                  key={continent}
                  className="bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                >
                  {continent}: {count}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Top Countries */}
        {topCountries.length > 0 && (
          <section>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <Flag className="h-3 w-3" />
              Top Countries
            </h3>
            <div className="space-y-2">
              {topCountries.map(({ country, stats: countryStats }) => (
                <div
                  key={country}
                  className="bg-card border border-border rounded p-3 flex items-center justify-between"
                >
                  <span className="font-medium text-sm">{country}</span>
                  <span className="text-xs text-muted-foreground">
                    {countryStats.count} rounds • Best: {formatDistance(countryStats.bestDistance)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
};

const StatCard = ({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon?: React.ReactNode;
}) => (
  <div className="bg-card rounded-lg p-4 border border-border">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {icon}
      <span className="text-xs uppercase tracking-wide">{label}</span>
    </div>
    <p className="font-display text-xl">{value}</p>
    {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
  </div>
);
