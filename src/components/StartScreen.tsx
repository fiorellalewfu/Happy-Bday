import React from 'react';
import { Play, Disc3, Headphones, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { JONAMS_TRACK_META } from '../audio/soundcloudManager';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="w-full max-w-lg house-panel rounded-3xl p-6 md:p-8 text-center relative overflow-hidden text-slate-100"
      >
        {/* Ambient neon light glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Crystalline Golden Star Icon with House Rings */}
        <motion.div
          animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 border-2 border-amber-300/60 text-4xl"
        >
          ⭐
        </motion.div>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xs tracking-widest uppercase font-semibold text-amber-400 font-display">
            Edición Especial de Cumpleaños
          </span>
        </div>
        <h1 className="font-game text-3xl md:text-4xl text-white mb-2 tracking-wide">
          Las 5 Estrellas de Jonathan
        </h1>

        <p className="text-slate-300 text-sm md:text-base mb-5 leading-relaxed">
          Un recorrido 3D que une la nostalgia de los clásicos, la vibra de la música house y 5 recuerdos que guardan esta carta para ti.
        </p>

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
          onClick={onStart}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-game text-xl md:text-2xl rounded-2xl retro-btn uppercase flex items-center justify-center gap-3 cursor-pointer shadow-xl transform active:scale-95 transition-all"
        >
          <Play className="w-6 h-6 fill-current" />
          Comenzar Aventura
        </button>

        {/* Instructions / Controls */}
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

        <div className="mt-2.5 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>En celular: botones táctiles en pantalla</span>
        </div>
      </motion.div>
    </div>
  );
};
