import React, { useEffect, useRef, useState } from 'react';
import { RetroPlatformerEngine } from './game/GameEngine';
import { LETTER_CHAPTERS, EASTER_EGGS_INITIAL } from './data/letterData';
import { LetterChapter, EasterEgg } from './types';
import { StartScreen, type DeviceMode } from './components/StartScreen';
import { LetterModal } from './components/LetterModal';
import { VictoryModal } from './components/VictoryModal';
import { TouchControls } from './components/TouchControls';
import { GameHUD } from './components/GameHUD';
import { RotateCcw, Smartphone } from 'lucide-react';
import { toggleMute, getMuteState, startBackgroundMusic, stopBackgroundMusic } from './audio/soundEffects';
import {
  registerSoundCloudWidget,
  playSoundCloudTrack,
  pauseSoundCloudTrack,
  setSoundCloudVolume,
  isSoundCloudPlaying
} from './audio/soundcloudManager';

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>;
};

type FullscreenRoot = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

const requestMobileLandscape = async () => {
  const root = document.documentElement as FullscreenRoot;

  try {
    if (!document.fullscreenElement && root.requestFullscreen) {
      await root.requestFullscreen({ navigationUI: 'hide' });
    } else if (!document.fullscreenElement && root.webkitRequestFullscreen) {
      await root.webkitRequestFullscreen();
    }
  } catch {
    // Some mobile browsers (notably iPhone Safari) do not allow page fullscreen.
  }

  try {
    const orientation = window.screen.orientation as LockableOrientation | undefined;
    if (orientation?.lock) {
      await orientation.lock('landscape');
    }
  } catch {
    // The rotate-device overlay remains as the cross-browser fallback.
  }
};

const releaseMobileDisplayMode = async () => {
  try {
    window.screen.orientation?.unlock();
  } catch {
    // Orientation may not have been locked by this browser.
  }

  const fullscreenDocument = document as FullscreenDocument;
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (fullscreenDocument.webkitFullscreenElement && fullscreenDocument.webkitExitFullscreen) {
      await fullscreenDocument.webkitExitFullscreen();
    }
  } catch {
    // Returning to the menu still works if the browser controls fullscreen itself.
  }
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scIframeRef = useRef<HTMLIFrameElement>(null);
  const engineRef = useRef<RetroPlatformerEngine | null>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isPortrait, setIsPortrait] = useState(() => window.innerHeight > window.innerWidth);
  const [starsCount, setStarsCount] = useState(0);
  const [discCount, setDiscCount] = useState(0);
  const [michelleUnlocked, setMichelleUnlocked] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<LetterChapter | null>(null);
  const [isSuperDJ, setIsSuperDJ] = useState(false);
  const [canFly, setCanFly] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [easterEggs, setEasterEggs] = useState<EasterEgg[]>(EASTER_EGGS_INITIAL);
  const [recentEggNotification, setRecentEggNotification] = useState<EasterEgg | null>(null);

  useEffect(() => {
    const updateOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.screen.orientation?.addEventListener('change', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.screen.orientation?.removeEventListener('change', updateOrientation);
    };
  }, []);

  // Initialize SoundCloud Widget iframe
  useEffect(() => {
    if (scIframeRef.current) {
      registerSoundCloudWidget(scIframeRef.current, () => {
        console.log("SoundCloud Widget for JONAMS Sunday Session VIII ready.");
      });
    }
  }, []);

  // Initialize 3D Retro Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new RetroPlatformerEngine(
      containerRef.current,
      LETTER_CHAPTERS,
      EASTER_EGGS_INITIAL,
      {
        onStarCollect: (starIndex, chapter, superDJActive, flightActive) => {
          setCurrentChapter(chapter);
          if (superDJActive) {
            setIsSuperDJ(true);
          }
          if (flightActive) {
            setCanFly(true);
          }
        },
        onEvolution: () => {
          setIsSuperDJ(true);
        },
        onFlightUnlocked: () => {
          setCanFly(true);
        },
        onEasterEggFound: (egg) => {
          setEasterEggs((prev) =>
            prev.map((e) => (e.id === egg.id ? { ...e, found: true } : e))
          );
          setRecentEggNotification(egg);
          setTimeout(() => {
            setRecentEggNotification((curr) => (curr?.id === egg.id ? null : curr));
          }, 4500);
        },
        onReachGoal: () => {
          setIsVictory(true);
        },
        onStarCountUpdate: (count) => {
          setStarsCount(count);
        },
        onDiscCountUpdate: (count) => {
          setDiscCount(count);
        },
        onMichelleUnlocked: () => {
          setMichelleUnlocked(true);
        }
      }
    );

    engineRef.current = engine;
    engine.setPaused(true); // Paused until user clicks "Comenzar Aventura"

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Handle Game Start
  const handleStartGame = async (selectedDevice: DeviceMode) => {
    setDeviceMode(selectedDevice);
    const landscapeRequest = selectedDevice === 'mobile'
      ? requestMobileLandscape()
      : Promise.resolve();

    setGameStarted(true);
    if (engineRef.current) {
      engineRef.current.setPaused(false);
    }

    // Play Jonathan's real DJ track
    playSoundCloudTrack();

    // Fallback Web Audio groove in case SoundCloud needs user gesture or is blocked
    setTimeout(() => {
      if (!isSoundCloudPlaying()) {
        startBackgroundMusic();
      }
    }, 1200);

    await landscapeRequest;
    if (selectedDevice === 'mobile') {
      setIsPortrait(window.innerHeight > window.innerWidth);
    }
  };

  // Handle Letter Modal dismissal ("Seguir avanzando")
  const handleContinueAdventure = () => {
    setCurrentChapter(null);
    if (engineRef.current) {
      engineRef.current.resumeAfterStar();
    }
  };

  // Handle Sound Toggle
  const handleToggleSound = () => {
    const nextMuteState = toggleMute();
    setIsMuted(nextMuteState);

    if (nextMuteState) {
      pauseSoundCloudTrack();
      stopBackgroundMusic();
    } else {
      playSoundCloudTrack();
    }
  };

  // Handle Touch Controls
  const handleTouchControl = (control: 'left' | 'right' | 'jump', active: boolean) => {
    if (engineRef.current) {
      engineRef.current.setInput(control, active);
    }
  };

  const handleBackToMenu = async () => {
    engineRef.current?.setInput('left', false);
    engineRef.current?.setInput('right', false);
    engineRef.current?.setInput('jump', false);
    engineRef.current?.setPaused(true);
    pauseSoundCloudTrack();
    stopBackgroundMusic();
    setGameStarted(false);
    await releaseMobileDisplayMode();
  };

  // Handle Replay
  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="game-shell relative w-screen h-screen overflow-hidden bg-slate-950 select-none touch-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Embedded SoundCloud Widget Player (Official SoundCloud Stream for JONAMS Sunday Session VIII) */}
      <div className="fixed -top-96 left-0 opacity-0 pointer-events-none" aria-hidden="true">
        <iframe
          ref={scIframeRef}
          id="sc-widget-player"
          width="100%"
          height="166"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1906593230&color=%23f59e0b&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false"
        />
      </div>

      {/* Start Screen */}
      {!gameStarted && <StartScreen onStart={handleStartGame} />}

      {/* In-Game HUD */}
      {gameStarted && (
        <GameHUD
          starsCount={starsCount}
          totalStars={5}
          discCount={discCount}
          totalDiscs={11}
          michelleUnlocked={michelleUnlocked}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onBackToMenu={handleBackToMenu}
          easterEggs={easterEggs}
          recentEggNotification={recentEggNotification}
          isSuperDJ={isSuperDJ}
          canFly={canFly}
        />
      )}

      {/* On-Screen Mobile Touch Controls */}
      {gameStarted && deviceMode === 'mobile' && !currentChapter && !isVictory && (
        <TouchControls onControlChange={handleTouchControl} canFly={canFly} />
      )}

      {/* Cross-browser fallback when automatic landscape lock is unavailable. */}
      {gameStarted && deviceMode === 'mobile' && isPortrait && (
        <div className="rotate-device-overlay fixed inset-0 z-[100] flex items-center justify-center p-6 text-center">
          <div className="rotate-device-card rounded-3xl p-7 max-w-sm w-full">
            <div className="rotate-phone-visual mx-auto mb-4" aria-hidden="true">
              <Smartphone className="w-12 h-12" />
              <RotateCcw className="rotate-phone-arrow w-7 h-7" />
            </div>
            <h2 className="font-game text-2xl text-white mb-2">Gira tu celular</h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              Esta aventura está diseñada para jugarse horizontalmente. Desactiva el bloqueo de rotación y gira el teléfono.
            </p>
            <button
              type="button"
              onClick={handleBackToMenu}
              className="rotate-back-button mt-5 mx-auto px-5 py-2.5 rounded-xl font-game text-sm uppercase flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Atrás al menú</span>
            </button>
          </div>
        </div>
      )}

      {/* Letter Reading Modal on Star Collect */}
      {currentChapter && (
        <LetterModal
          chapter={currentChapter}
          onContinue={handleContinueAdventure}
          isSuperDJ={isSuperDJ}
          canFly={canFly}
        />
      )}

      {/* Final Victory / Celebration Modal */}
      {isVictory && <VictoryModal onRestart={handleRestart} />}
    </div>
  );
}
