import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Disc3 } from 'lucide-react';
import { LetterChapter } from '../types';

interface LetterModalProps {
  chapter: LetterChapter | null;
  onContinue: () => void;
  isSuperDJ?: boolean;
  canFly?: boolean;
}

export const LetterModal: React.FC<LetterModalProps> = ({ chapter, onContinue, isSuperDJ, canFly }) => {
  if (!chapter) return null;

  const isParentsChapter = chapter.id === 4 || chapter.specialEffect === 'celestial-flight';
  const isEvolutionChapter = chapter.id === 2 || chapter.specialEffect === 'dj-evolution';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="w-full max-w-xl max-h-[94vh] overflow-y-auto house-panel rounded-3xl p-4 sm:p-6 md:p-8 text-slate-100 relative my-auto shadow-2xl border border-amber-400/40"
      >
        {/* Top Floating Star Badge */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-game px-5 py-1.5 rounded-full shadow-lg border border-amber-200">
          <span className="text-xs tracking-wider uppercase font-bold">Estrella {chapter.id} Desbloqueada</span>
        </div>

        {/* Chapter Header (Sin íconos artificiales) */}
        <div className="text-center mt-3 mb-5">
          <h2 className="font-game text-2xl md:text-3xl text-white tracking-wide">
            {chapter.title}
          </h2>
          <p className="text-amber-400 text-xs md:text-sm font-semibold tracking-wider font-display uppercase mt-1">
            {chapter.subtitle}
          </p>
        </div>

        {/* DJ Evolution Announcement for Chapter 2 */}
        {isEvolutionChapter && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/25 to-sky-500/20 border border-amber-300/40 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-display mb-1">
              Modo Super DJ Desbloqueado
            </span>
            <p className="text-xs text-slate-200 leading-snug">
              Alcanzaste la estrella del hombre en el que te has convertido. Jonathan activa sus audífonos de DJ, aura estelar y estela rítmica.
            </p>
          </motion.div>
        )}

        {/* Symbolic representation for parents & Celestial Flight Power for Chapter 4 */}
        {isParentsChapter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-4 p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-slate-900/90 border border-amber-300/40 flex flex-col items-center justify-center text-center shadow-lg shadow-amber-400/10"
          >
            <span className="text-xs font-bold text-amber-300 tracking-widest uppercase font-display mb-1">
              Vuelo Celestial • Dos Luces en el Cielo
            </span>
            <p className="text-sm font-handwriting text-amber-200/95 text-lg leading-snug mb-1.5">
              "Dos angelitos que cuidan tus pasos te otorgan alas de luz."
            </p>
            <p className="text-[11px] text-slate-300 leading-snug bg-slate-900/60 px-3 py-1.5 rounded-xl border border-amber-400/20">
              Mantén presionado <strong className="text-white">SALTAR</strong> (Espacio, W o botón táctil) para elevarte y volar por el festival.
            </p>
          </motion.div>
        )}

        {/* Letter Paragraphs (Tipografía Manuscrita y Poética) */}
        <div className="space-y-3.5 max-h-[48vh] overflow-y-auto px-1 py-1 font-normal">
          {chapter.text.map((paragraph, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * index }}
              className="bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-amber-400/20 shadow-xs"
            >
              <p className="font-handwriting text-2xl sm:text-3xl text-amber-50/95 leading-[1.65]">
                {paragraph}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="mt-6 pt-3 border-t border-slate-700/60 flex items-center justify-end">
          <button
            id="btn-continue-adventure"
            onClick={onContinue}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-game text-base md:text-lg rounded-xl retro-btn uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            <span>Seguir Avanzando</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
