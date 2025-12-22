import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Target, MapPin, Map, Trash2, Trophy, Building2, Flag, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStats, getResults, getTopCountriesByAccuracy, getTopCountries, getContinentDistribution, clearAllStats, getUniqueCities } from '@/lib/statsManager';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const StatsPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const stats = getStats();
  const results = getResults();
  const topCountries = getTopCountriesByAccuracy(stats, 5);
  const mostVisitedCountries = getTopCountries(stats, 5);
  const continents = getContinentDistribution(stats);
  const uniqueCountries = Object.keys(stats.countriesVisited).length;
  const uniqueCities = getUniqueCities(results);

  const formatDistance = (km: number) => {
    if (!isFinite(km) || km === 0) return '—';
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km).toLocaleString()} km`;
  };

  const handleClearStats = () => {
    clearAllStats();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div key={refreshKey} className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl">Statistics</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={stats.totalRounds === 0}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all statistics?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your game history and statistics. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearStats} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear Stats
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </motion.div>

        {stats.totalRounds === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-xl mb-2">No games played yet</h2>
            <p className="text-muted-foreground mb-6">Play your first round to start tracking your progress.</p>
            <Link to="/">
              <Button>Start Playing</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Overview - Row 1 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Rounds</p>
                <p className="font-display text-2xl">{stats.totalRounds}</p>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Best</p>
                <p className="font-display text-2xl text-primary">{formatDistance(stats.bestDistance)}</p>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Worst</p>
                <p className="font-display text-2xl">{formatDistance(stats.worstDistance)}</p>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Average</p>
                <p className="font-display text-2xl">{formatDistance(stats.totalRounds > 0 ? results.reduce((sum, r) => sum + r.distanceKm, 0) / results.length : 0)}</p>
              </div>
            </motion.div>

            {/* Overview - Row 2 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Countries</p>
                <p className="font-display text-2xl">{uniqueCountries}</p>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cities</p>
                <p className="font-display text-2xl">{uniqueCities.length}</p>
              </div>
            </motion.div>

            {/* Best Guesses by Country */}
            {topCountries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-lg p-5 border border-border"
              >
                <h3 className="font-display text-lg mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Best Guesses by Country
                </h3>
                <div className="space-y-3">
                  {topCountries.map(({ country, stats: countryStats }, index) => {
                    // Find zoom level from results if not in stats
                    const zoomLevel = countryStats.bestZoomLevel ?? 
                      results.find(r => r.country === country && r.distanceKm === countryStats.bestDistance)?.zoomLevel;
                    return (
                      <div key={country} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            index === 0 ? 'bg-primary/20 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium">{country}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {zoomLevel !== undefined && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <ZoomOut className="h-3 w-3" />
                              {zoomLevel}x
                            </span>
                          )}
                          <span className="text-primary font-semibold">{formatDistance(countryStats.bestDistance)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Continent Distribution */}
            {continents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-lg p-5 border border-border"
              >
                <h3 className="font-display text-lg mb-4 flex items-center gap-2">
                  <Map className="h-4 w-4 text-primary" />
                  Continents Explored
                </h3>
                <div className="space-y-3">
                  {continents.map(({ continent, count, percentage }) => (
                    <div key={continent} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{continent}</span>
                        <span className="text-muted-foreground">{count} rounds ({percentage}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Most Visited Countries */}
            {mostVisitedCountries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-lg p-5 border border-border"
              >
                <h3 className="font-display text-lg mb-4 flex items-center gap-2">
                  <Flag className="h-4 w-4 text-primary" />
                  Most Visited Countries
                </h3>
                <div className="space-y-3">
                  {mostVisitedCountries.map(({ country, stats: countryStats }, index) => (
                    <div key={country} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === 0 ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium">{country}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{countryStats.count} rounds</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Results */}
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card rounded-lg p-5 border border-border"
              >
                <h3 className="font-display text-lg mb-4">Recent Rounds</h3>
                <div className="space-y-2">
                  {results.slice(-10).reverse().map((result, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {result.city || result.state || result.country || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {result.country && (result.city || result.state) 
                            ? `${result.country} • ${result.date}`
                            : result.date
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm flex-shrink-0">
                        <span className="text-muted-foreground">{result.zoomLevel}x</span>
                        <span className="font-medium">{formatDistance(result.distanceKm)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;