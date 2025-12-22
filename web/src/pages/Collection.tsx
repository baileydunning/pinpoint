import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Trash2, Layers, Globe, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSavedMaps, deleteMap, SavedMap } from '@/lib/savedMaps';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type MapLayer = 'satellite' | 'streets' | 'terrain' | 'dark';

const mapLayers: Record<MapLayer, { name: string; url: string; attribution: string }> = {
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  streets: {
    name: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  terrain: {
    name: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
  },
};

const Collection = () => {
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<SavedMap | null>(null);
  const [layer, setLayer] = useState<MapLayer>('satellite');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Load saved maps on mount
  useEffect(() => {
    setSavedMaps(getSavedMaps());
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    tileLayerRef.current = L.tileLayer(mapLayers[layer].url, {
      attribution: mapLayers[layer].attribution,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update tile layer when layer changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    tileLayerRef.current = L.tileLayer(mapLayers[layer].url, {
      attribution: mapLayers[layer].attribution,
    }).addTo(mapRef.current);
  }, [layer]);

  // Update markers when savedMaps or selectedMap changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for all saved maps
    savedMaps.forEach(map => {
      const marker = L.marker([map.lat, map.lng])
        .addTo(mapRef.current!)
        .bindPopup(`<div class="text-center"><p class="font-medium">${map.displayName}</p></div>`)
        .on('click', () => setSelectedMap(map));
      
      markersRef.current.push(marker);
    });
  }, [savedMaps]);

  // Fly to selected map
  useEffect(() => {
    if (!mapRef.current || !selectedMap) return;

    mapRef.current.flyTo([selectedMap.lat, selectedMap.lng], 12, {
      duration: 1.5,
    });
  }, [selectedMap]);

  const handleDelete = (id: string) => {
    deleteMap(id);
    setSavedMaps(getSavedMaps());
    if (selectedMap?.id === id) {
      setSelectedMap(null);
    }
    toast.success('Location removed from collection');
  };

  const handleSelectMap = (map: SavedMap) => {
    setSelectedMap(map);
  };

  const handleViewAll = () => {
    setSelectedMap(null);
    if (mapRef.current) {
      mapRef.current.flyTo([20, 0], 2, { duration: 1 });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border-b border-border"
      >
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Globe className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl">Collection</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Layers className="h-4 w-4" />
                {mapLayers[layer].name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={layer} onValueChange={(v) => setLayer(v as MapLayer)}>
                {Object.entries(mapLayers).map(([key, { name }]) => (
                  <DropdownMenuRadioItem key={key} value={key}>
                    {name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar with saved locations */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border p-4 overflow-y-auto max-h-[40vh] md:max-h-none"
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Saved Locations ({savedMaps.length})
          </h2>
          
          {savedMaps.length === 0 ? (
            <div className="text-center py-8">
              <Map className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No saved locations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Save locations from game results to explore them here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {savedMaps.map((map) => (
                  <motion.div
                    key={map.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMap?.id === map.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleSelectMap(map)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{map.displayName}</p>
                        {map.country && map.displayName !== map.country && (
                          <p className="text-xs text-muted-foreground">{map.country}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(map.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {map.lat.toFixed(2)}°, {map.lng.toFixed(2)}°
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.aside>

        {/* Map View */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="h-full w-full min-h-[50vh]" />

          {/* Selected location info overlay */}
          {selectedMap && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4"
            >
              <h3 className="font-display text-lg mb-1">{selectedMap.displayName}</h3>
              {selectedMap.country && selectedMap.displayName !== selectedMap.country && (
                <p className="text-sm text-muted-foreground mb-2">{selectedMap.country}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{selectedMap.lat.toFixed(4)}°, {selectedMap.lng.toFixed(4)}°</span>
                {selectedMap.distanceKm !== undefined && (
                  <span>Guessed within {selectedMap.distanceKm < 10 ? selectedMap.distanceKm.toFixed(1) : Math.round(selectedMap.distanceKm)} km</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={handleViewAll}
              >
                View All Locations
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;