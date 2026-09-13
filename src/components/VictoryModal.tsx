import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, RotateCcw, BookOpen, Disc3, ExternalLink } from 'lucide-react';
import { LETTER_CHAPTERS } from '../data/letterData';
import { playVictoryFanfare } from '../audio/soundEffects';
import { JONAMS_TRACK_META } from '../audio/soundcloudManager';

interface VictoryModalProps {
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ onRestart }) => {
  const [showFullLetter, setShowFullLetter] = useState(false);

  useEffect(() => {
    playVictoryFanfare();

    // Trigger celebratory festival fireworks
    const duration = 4.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 32, spread: 360, ticks: 75, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: number = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 45 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 } });
    }, 280);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 35 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 240 }}
        className="w-full max-w-2xl house-panel rounded-3xl p-6 md:p-8 text-slate-100 relative my-auto shadow-2xl border border-amber-400/40"
      >
        {/* Header Ribbon */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-5xl mb-2 flex justify-center drop-shadow-lg"
          >
            ⭐
          </motion.div>

          <div className="inline-block bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-game px-6 py-1.5 rounded-2xl shadow-lg border border-amber-200 mb-2">
            <h1 className="text-xl md:text-2xl tracking-wider uppercase">
              ¡Misión Cumplida, Jonathan!
            </h1>
          </div>
          <p className="text-amber-400 text-xs md:text-sm font-semibold tracking-wider font-display uppercase">
            Las 5 Estrellas Han Sido Reunidas en el Mainstage
          </p>
        </div>

        {/* Modal Body */}
        {!showFullLetter ? (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 text-center">
              <h2 className="font-game text-xl text-white mb-2">
                ¡Feliz Cumpleaños, Hermano!
              </h2>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                Has recorrido cada plataforma, superado cada salto y recolectado los 5 recuerdos que forman esta carta.
                Gracias por tu música, tu energía inagotable, tu disciplina y por ser ese hermano y líder con el que siempre se puede contar.
              </p>
            </div>

            {/* SoundCloud Track Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800/90 to-amber-950/40 border border-amber-400/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-amber-400/40 shadow">
                  <img
                    src={JONAMS_TRACK_META.artwork}
                    alt="JonaMS Cover"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-amber-400 font-bold uppercase font-display truncate">
                    Track: {JONAMS_TRACK_META.title}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    Por {JONAMS_TRACK_META.artist} en SoundCloud
                  </div>
                </div>
              </div>

              <a
                href={JONAMS_TRACK_META.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3.5 py-2 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-400/30"
              >
                <span>Ver Set</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-read-full-letter"
                onClick={() => setShowFullLetter(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-game text-base rounded-2xl border border-slate-600 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Leer Carta Completa</span>
              </button>

              <button
                id="btn-restart-game"
                onClick={onRestart}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-game text-base rounded-2xl retro-btn shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 uppercase"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Jugar de Nuevo</span>
              </button>
            </div>
          </div>
        ) : (
          /* Complete letter scroll view */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <h2 className="font-game text-lg text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>La Carta Completa para Jonathan</span>
              </h2>
              <button
                onClick={() => setShowFullLetter(false)}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
              >
                ← Volver al resumen
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
              {LETTER_CHAPTERS.map((chap) => (
                <div key={chap.id} className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/50">
                  <div className="flex items-center gap-2 font-game text-base text-amber-400 mb-2">
                    <span>{chap.icon}</span>
                    <span>Capítulo {chap.id}: {chap.title}</span>
                  </div>
                  <div className="space-y-2 text-xs md:text-sm text-slate-200 leading-relaxed">
                    {chap.text.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-700/60 flex justify-end">
              <button
                onClick={() => setShowFullLetter(false)}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-game text-sm rounded-xl transition-all"
              >
                Cerrar Lectura
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
