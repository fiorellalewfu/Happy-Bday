import React from 'react';
import { Play, Disc3, Headphones, Monitor, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { JONAMS_TRACK_META } from '../audio/soundcloudManager';

interface StartScreenProps {
  onStart: (deviceMode: DeviceMode) => void;
}

export type DeviceMode = 'desktop' | 'mobile';

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const fireworks = ['firework-one', 'firework-two', 'firework-three', 'firework-four'];
  const [deviceMode, setDeviceMode] = React.useState<DeviceMode>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820 ? 'mobile' : 'desktop';
  });

  return (
    <div className="start-screen-overlay absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto overflow-x-hidden">
      <div className="opening-fireworks" aria-hidden="true">
        {fireworks.map((firework) => (
          <span key={firework} className={`opening-firework ${firework}`}>
            {Array.from({ length: 12 }, (_, spark) => (
              <i
                key={spark}
                style={{ '--spark-angle': `${spark * 30}deg` } as React.CSSProperties}
              />
            ))}
          </span>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="start-screen-panel w-full max-w-lg house-panel rounded-3xl p-6 md:p-8 text-center relative overflow-hidden text-slate-100"
      >
        {/* Ambient neon light glow */}
        <div className="start-glow-coral absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none" />
        <div className="start-glow-electric absolute -bottom-16 -left-16 w-36 h-36 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          animate={{ y: [0, -5, 0], rotate: [-3, 3, -3], scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
          className="birthday-cake-emblem mx-auto mb-3"
          aria-label="Torta de cumpleaños"
        >
          🎂
        </motion.div>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs tracking-widest uppercase font-semibold text-amber-400 font-display">
            Edición Especial de Cumpleaños
          </span>
        </div>
        <h1 className="start-screen-title font-game text-3xl md:text-4xl text-white mb-5 tracking-wide">
          JONAMS: Un Viaje de Ritmo y Luz
        </h1>

        {/* Device mode selection */}
        <div className="device-mode-picker mb-5" role="group" aria-label="Selecciona dónde vas a jugar">
          <span className="device-mode-label">¿Dónde vas a jugar?</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              aria-pressed={deviceMode === 'desktop'}
              onClick={() => setDeviceMode('desktop')}
              className={`device-mode-option ${deviceMode === 'desktop' ? 'is-selected' : ''}`}
            >
              <Monitor className="w-5 h-5" />
              <span>PC</span>
            </button>
            <button
              type="button"
              aria-pressed={deviceMode === 'mobile'}
              onClick={() => setDeviceMode('mobile')}
              className={`device-mode-option ${deviceMode === 'mobile' ? 'is-selected' : ''}`}
            >
              <Smartphone className="w-5 h-5" />
              <span>Celular</span>
              <small>Horizontal</small>
            </button>
          </div>
        </div>

        {/* DJ Track Badge (Jonathan's real SoundCloud track) */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-800/80 border border-amber-400/30 flex items-center gap-3.5 text-left">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-amber-400/40 bg-slate-900 shadow-md">
            <img
              src={JONAMS_TRACK_META.artwork}
              alt="JonaMS Cover"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Disc3 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Soundtrack Oficial</span>
            </div>
            <div className="text-sm font-bold text-white truncate">
              {JONAMS_TRACK_META.title}
            </div>
            <div className="text-xs text-slate-400 font-medium truncate">
              Por <span className="text-amber-300 font-semibold">{JONAMS_TRACK_META.artist}</span> (Sundaystgo)
            </div>
          </div>

          {/* Equalizer animation preview */}
          <div className="flex items-end gap-1 h-6 w-7 pb-1">
            <span className="w-1 bg-amber-400 rounded-full animate-eq-1" />
            <span className="w-1 bg-amber-400 rounded-full animate-eq-2" />
            <span className="w-1 bg-amber-400 rounded-full animate-eq-3" />
            <span className="w-1 bg-amber-400 rounded-full animate-eq-4" />
          </div>
        </div>

        {/* Start Button */}
        <button
          id="btn-start-adventure"
          onClick={() => onStart(deviceMode)}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-game text-xl md:text-2xl rounded-2xl retro-btn uppercase flex items-center justify-center gap-3 cursor-pointer shadow-xl transform active:scale-95 transition-all"
        >
          <Play className="w-6 h-6 fill-current" />
          {deviceMode === 'mobile' ? 'Comenzar en Celular' : 'Comenzar Aventura'}
        </button>

        {/* Instructions / Controls */}
        {deviceMode === 'desktop' ? (
          <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-around gap-2.5 text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50">
              <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 border border-slate-700">← →</span>
              <span>o</span>
              <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 border border-slate-700">A / D</span>
              <span>Caminar</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/50">
              <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 border border-slate-700">ESPACIO</span>
              <span>Saltar</span>
            </div>
          </div>
        ) : (
          <div className="mobile-mode-hint mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-center gap-2 text-xs font-medium">
            <Smartphone className="w-4 h-4" />
            <span>Controles táctiles con el celular en horizontal</span>
          </div>
        )}

        {deviceMode === 'desktop' && (
          <div className="mt-2.5 text-[11px] text-slate-400 flex items-center justify-center">
            <span>También puedes elegir el modo celular</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
