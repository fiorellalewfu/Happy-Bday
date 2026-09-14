import React, { useEffect, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Play, Pause, Disc3, Headphones } from 'lucide-react';
import { EasterEgg } from '../types';
import {
  JONAMS_TRACK_META,
  toggleSoundCloudTrack,
  isSoundCloudPlaying,
  onSoundCloudPlayStateChange
} from '../audio/soundcloudManager';

interface GameHUDProps {
  starsCount: number;
  totalStars: number;
  discCount: number;
  totalDiscs: number;
  michelleUnlocked?: boolean;
  isMuted: boolean;
  onToggleSound: () => void;
  onBackToMenu: () => void;
  easterEggs: EasterEgg[];
  recentEggNotification: EasterEgg | null;
  isSuperDJ?: boolean;
  canFly?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  starsCount,
  totalStars,
  discCount,
  totalDiscs,
  michelleUnlocked,
  isMuted,
  onToggleSound,
  onBackToMenu,
  easterEggs,
  recentEggNotification,
  isSuperDJ,
  canFly
}) => {
  const [isPlayingSC, setIsPlayingSC] = useState(false);

  useEffect(() => {
    const unsub = onSoundCloudPlayStateChange((playing) => {
      setIsPlayingSC(playing);
    });
    return unsub;
  }, []);

  const handleToggleTrack = () => {
    toggleSoundCloudTrack();
  };

  return (
    <div className="absolute inset-x-0 top-3 pointer-events-none z-30 px-3 md:px-6 flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between gap-2">
        {/* Star Counter & Super DJ Badge */}
        <div className="flex items-center gap-2">
          {/* Star Counter (House Neon Pill) */}
          <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-amber-400/40 shadow-xl">
            <span className="text-xl animate-bounce">⭐</span>
            <div className="font-game text-lg md:text-xl text-yellow-300 tracking-wider">
              {starsCount} / {totalStars}
            </div>
          </div>

          {/* Super DJ Mode Indicator */}
          {isSuperDJ && (
            <div className="pointer-events-auto flex items-center gap-1.5 bg-gradient-to-r from-amber-500/25 via-pink-500/25 to-sky-500/25 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-300/70 shadow-lg shadow-amber-400/20 animate-pulse">
              <Headphones className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider font-display hidden xs:inline">
                Super DJ
              </span>
            </div>
          )}

          {/* Celestial Flight Power Indicator */}
          {canFly && (
            <div className="pointer-events-auto flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/30 via-amber-400/25 to-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-yellow-300/80 shadow-lg shadow-yellow-300/30 animate-pulse">
              <span className="text-sm">🕊️</span>
              <span className="text-[11px] font-bold text-yellow-200 uppercase tracking-wider font-display hidden xs:inline">
                Vuelo Activo
              </span>
            </div>
          )}
        </div>

        {/* DJ Track Player Bar (JONAMS - Sunday Session VIII) */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-400/30 shadow-xl max-w-[260px] md:max-w-none">
          <div className="flex items-center gap-2">
            <button
              id="btn-play-pause-track"
              onClick={handleToggleTrack}
              title={isPlayingSC ? 'Pausar track' : 'Reproducir track'}
              className="w-8 h-8 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 flex items-center justify-center transition-all cursor-pointer"
            >
              {isPlayingSC ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white leading-tight">
                <span className="text-amber-400 font-display">JONAMS</span>
                <span className="text-slate-400">—</span>
                <span className="truncate max-w-[130px]">{JONAMS_TRACK_META.title}</span>
              </div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">House Session</span>
            </div>
          </div>

          {/* Animated EQ Bars */}
          <div className="flex items-end gap-0.5 h-4 w-4 pb-0.5">
            <span className={`w-0.5 bg-amber-400 rounded-full ${isPlayingSC ? 'animate-eq-1' : 'h-1.5'}`} />
            <span className={`w-0.5 bg-amber-400 rounded-full ${isPlayingSC ? 'animate-eq-2' : 'h-3'}`} />
            <span className={`w-0.5 bg-amber-400 rounded-full ${isPlayingSC ? 'animate-eq-3' : 'h-2'}`} />
            <span className={`w-0.5 bg-amber-400 rounded-full ${isPlayingSC ? 'animate-eq-4' : 'h-1'}`} />
          </div>
        </div>

        {/* Easter Eggs Badges & Sound Toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Easter Eggs Badges */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/60 shadow-lg">
            {easterEggs.map((egg) => (
              <span
                key={egg.id}
                title={`${egg.title}: ${egg.description}`}
                className={`text-base transition-all duration-300 ${
                  egg.found ? 'scale-110 opacity-100 filter-none' : 'opacity-25 grayscale scale-90'
                }`}
              >
                {egg.emoji}
              </span>
            ))}
          </div>

          <button
            id="btn-back-to-menu"
            onClick={onBackToMenu}
            aria-label="Volver al menú principal"
            title="Volver al menú principal"
            className="game-back-button h-9 md:h-10 px-2.5 md:px-3 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md rounded-2xl border border-orange-400/35 text-white flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-orange-300" />
            <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Atrás</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            className="w-9 h-9 md:w-10 md:h-10 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md rounded-2xl border border-amber-400/30 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Optional vinyl collection — intentionally quieter than the story counter. */}
      <div className="flex items-center gap-2 self-start -mt-0.5">
        <div className={`music-disc-counter ${discCount === totalDiscs ? 'is-complete' : ''}`}>
          <Disc3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Discos</span>
          <strong>{discCount}/{totalDiscs}</strong>
        </div>

        {michelleUnlocked && (
          <div className="michelle-unlock-pill" role="status">
            <span aria-hidden="true">💖</span>
            <span>Michelle desbloqueada</span>
            <span aria-hidden="true">💋</span>
          </div>
        )}
      </div>

      {/* Easter Egg Discovery Toast Notification */}
      {recentEggNotification && (
        <div className="self-center pointer-events-auto animate-bounce mt-2 bg-slate-900/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-amber-400/60 flex items-center gap-3 max-w-sm">
          <span className="text-2xl">{recentEggNotification.emoji}</span>
          <div>
            <div className="font-game text-xs uppercase tracking-wider text-amber-300">
              ¡Detalle Especial Encontrado!
            </div>
            <div className="text-xs font-medium text-slate-200">
              {recentEggNotification.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
