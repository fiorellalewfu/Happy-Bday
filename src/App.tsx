import React, { useEffect, useRef, useState } from 'react';
import { RetroPlatformerEngine } from './game/GameEngine';
import { LETTER_CHAPTERS, EASTER_EGGS_INITIAL } from './data/letterData';
import { LetterChapter, EasterEgg } from './types';
import { StartScreen } from './components/StartScreen';
import { LetterModal } from './components/LetterModal';
import { VictoryModal } from './components/VictoryModal';
import { TouchControls } from './components/TouchControls';
import { GameHUD } from './components/GameHUD';
import { toggleMute, getMuteState, startBackgroundMusic, stopBackgroundMusic } from './audio/soundEffects';
import {
  registerSoundCloudWidget,
  playSoundCloudTrack,
  pauseSoundCloudTrack,
  setSoundCloudVolume,
  isSoundCloudPlaying
} from './audio/soundcloudManager';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scIframeRef = useRef<HTMLIFrameElement>(null);
  const engineRef = useRef<RetroPlatformerEngine | null>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [starsCount, setStarsCount] = useState(0);
  const [currentChapter, setCurrentChapter] = useState<LetterChapter | null>(null);
  const [isVictory, setIsVictory] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [easterEggs, setEasterEggs] = useState<EasterEgg[]>(EASTER_EGGS_INITIAL);
  const [recentEggNotification, setRecentEggNotification] = useState<EasterEgg | null>(null);

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
        onStarCollect: (starIndex, chapter) => {
          setCurrentChapter(chapter);
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
  const handleStartGame = () => {
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

  // Handle Replay
  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none touch-none">
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
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          easterEggs={easterEggs}
          recentEggNotification={recentEggNotification}
        />
      )}

      {/* On-Screen Mobile Touch Controls */}
      {gameStarted && !currentChapter && !isVictory && (
        <TouchControls onControlChange={handleTouchControl} />
      )}

      {/* Letter Reading Modal on Star Collect */}
      {currentChapter && (
        <LetterModal
          chapter={currentChapter}
          onContinue={handleContinueAdventure}
        />
      )}

      {/* Final Victory / Celebration Modal */}
      {isVictory && <VictoryModal onRestart={handleRestart} />}
    </div>
  );
}
