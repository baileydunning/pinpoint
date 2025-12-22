import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '@/hooks/useGame';
import { SatelliteViewer } from '@/components/game/SatelliteViewer';
import { WorldMap } from '@/components/game/WorldMap';
import { ResultScreen } from '@/components/game/ResultScreen';
import { Globe } from 'lucide-react';

const Index = () => {
  const { state, actions, constants } = useGame();

  if (!state.puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <Globe className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pinpoint - Satellite Geography Game</title>
        <meta
          name="description"
          content="Pinpoint is a geography puzzle game. Observe satellite imagery and place your pin on the world map."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <AnimatePresence mode="wait">
          {state.phase === 'viewing' && (
            <motion.div
              key="viewing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-screen p-4 md:p-6"
            >
              <div className="h-full max-w-4xl mx-auto flex flex-col">
                <SatelliteViewer
                  lat={state.puzzle.location.lat}
                  lng={state.puzzle.location.lng}
                  zoomLevel={constants.getLeafletZoom()}
                  zoomStep={state.zoomStep}
                  maxZoomSteps={constants.MAX_ZOOM_STEPS}
                  onZoomIn={actions.zoomIn}
                  onZoomOut={actions.zoomOut}
                  onPlacePin={actions.openMap}
                />
              </div>
            </motion.div>
          )}

          {state.phase === 'placing' && (
            <motion.div
              key="placing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-screen p-4 md:p-6"
            >
              <div className="h-full max-w-5xl mx-auto flex flex-col">
                <WorldMap
                  guess={state.guess}
                  onPlacePin={actions.placePin}
                  onSubmit={actions.submitGuess}
                  onBack={actions.backToViewing}
                />
              </div>
            </motion.div>
          )}

          {state.phase === 'result' && state.guess && state.result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-screen p-4 md:p-6"
            >
              <div className="h-full max-w-3xl mx-auto">
                <ResultScreen
                  puzzle={state.puzzle}
                  guess={state.guess}
                  result={state.result}
                  maxZoom={constants.MAX_ZOOM_STEPS}
                  onPlayAgain={actions.playAgain}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Index;
