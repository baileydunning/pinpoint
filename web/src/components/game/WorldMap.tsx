import { useState, useCallback, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  useMapContext,
  useZoomPanContext,
} from 'react-simple-maps';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface WorldMapProps {
  guess: { lat: number; lng: number } | null;
  actualLocation?: { lat: number; lng: number } | null;
  showResult?: boolean;
  onPlacePin: (lat: number, lng: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function ClickCapture({
  disabled,
  onPlacePin,
}: {
  disabled: boolean;
  onPlacePin: (lat: number, lng: number) => void;
}) {
  const { projection, width, height } = useMapContext() as any;
  const { x, y, k } = useZoomPanContext() as any;

  const handleClick = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      if (disabled) return;

      const svg = event.currentTarget.ownerSVGElement;
      if (!svg) return;

      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;

      const p = pt.matrixTransform(ctm.inverse());

      // Undo ZoomableGroup transform to get coordinates in the projection's coordinate space
      const px = (p.x - x) / k;
      const py = (p.y - y) / k;

      const inverted = projection?.invert?.([px, py]);
      if (!inverted) return;

      const [lng, lat] = inverted as [number, number];
      onPlacePin(clamp(lat, -85, 85), clamp(lng, -180, 180));
    },
    [disabled, onPlacePin, projection, x, y, k]
  );

  // Make the clickable area large enough to cover the viewport even after pans/zooms.
  return (
    <rect
      x={-width * 2}
      y={-height * 2}
      width={width * 5}
      height={height * 5}
      fill="transparent"
      onClick={handleClick}
      style={{ cursor: disabled ? 'default' : 'crosshair' }}
    />
  );
}

export const WorldMap = memo(({
  guess,
  actualLocation,
  showResult,
  onPlacePin,
  onSubmit,
  onBack,
}: WorldMapProps) => {
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleMoveEnd = useCallback((pos: { coordinates: [number, number]; zoom: number }) => {
    setPosition(pos);
  }, []);

  const clearGuess = useCallback(() => {
    onPlacePin(0, 0);
  }, [onPlacePin]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  }, [onSubmit]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      {!showResult && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <span className="text-sm text-muted-foreground">Click to place your pin</span>

          {guess && guess.lat !== 0 ? (
            <Button variant="ghost" onClick={clearGuess} size="sm" className="gap-2">
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      )}

      {/* Map Container */}
      <div className="relative flex-1 bg-secondary/30 rounded-lg overflow-hidden border border-border">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [0, 30],
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={8}
          >
            <ClickCapture disabled={!!showResult} onPlacePin={onPlacePin} />

            {/* Render-only layer (no hover highlighting) */}
            <g style={{ pointerEvents: 'none' }}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="hsl(var(--muted))"
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Guess Marker */}
              {guess && guess.lat !== 0 && (
                <Marker coordinates={[guess.lng, guess.lat]}>
                  <g>
                    <circle
                      r={8 / position.zoom}
                      fill="hsl(var(--primary))"
                      stroke="hsl(var(--primary-foreground))"
                      strokeWidth={2 / position.zoom}
                    />
                    <circle r={3 / position.zoom} fill="hsl(var(--primary-foreground))" />
                  </g>
                </Marker>
              )}

              {/* Actual Location Marker */}
              {showResult && actualLocation && (
                <Marker coordinates={[actualLocation.lng, actualLocation.lat]}>
                  <g>
                    <circle
                      r={10 / position.zoom}
                      fill="hsl(var(--accent))"
                      stroke="hsl(var(--accent-foreground))"
                      strokeWidth={2 / position.zoom}
                    />
                    <circle r={4 / position.zoom} fill="hsl(var(--accent-foreground))" />
                  </g>
                </Marker>
              )}
            </g>
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom controls hint */}
        {!showResult && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            Scroll to zoom, drag to pan
          </div>
        )}
      </div>

      {/* Submit Button */}
      {guess && guess.lat !== 0 && !showResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button size="lg" onClick={handleSubmit} className="w-full gap-2" disabled={submitting}>
            <Check className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Confirm Location'}
          </Button>
        </motion.div>
      )}
    </div>
  );
});

WorldMap.displayName = 'WorldMap';
