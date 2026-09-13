import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Disc3 } from 'lucide-react';
import { LetterChapter } from '../types';

interface LetterModalProps {
  chapter: LetterChapter | null;
  onContinue: () => void;
}

export const LetterModal: React.FC<LetterModalProps> = ({ chapter, onContinue }) => {
  if (!chapter) return null;

  const isParentsChapter = chapter.id === 4;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className="w-full max-w-xl house-panel rounded-3xl p-6 md:p-8 text-slate-100 relative my-auto shadow-2xl border border-amber-400/40"
      >
        {/* Top Floating Star Badge */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-game px-5 py-1.5 rounded-full shadow-lg border border-amber-200">
          <span className="text-lg">⭐</span>
          <span className="text-xs tracking-wider uppercase font-bold">Estrella {chapter.id} Desbloqueada</span>
        </div>

        {/* Chapter Header */}
        <div className="text-center mt-2 mb-5">
          <div className="text-3xl mb-1.5 flex justify-center">{chapter.icon}</div>
          <h2 className="font-game text-2xl md:text-3xl text-white tracking-wide">
            {chapter.title}
          </h2>
          <p className="text-amber-400 text-xs md:text-sm font-semibold tracking-wider font-display uppercase mt-1">
            {chapter.subtitle}
          </p>
        </div>

        {/* Symbolic representation for parents if chapter 4 */}
        {isParentsChapter && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 p-4 rounded-2xl bg-slate-800/80 border border-amber-300/30 flex flex-col items-center justify-center text-center"
          >
            <div className="flex items-center justify-center gap-6 mb-2">
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center shadow-lg shadow-amber-400/40 border border-amber-200"
              >
                <span className="text-sm">✨</span>
              </motion.div>
              <span className="text-xs font-bold text-amber-300 tracking-widest uppercase font-display">
                Dos luces en el cielo
              </span>
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2.6, delay: 1.3, ease: 'easeInOut' }}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-300 to-amber-100 flex items-center justify-center shadow-lg shadow-yellow-300/40 border border-amber-200"
              >
                <span className="text-sm">✨</span>
              </motion.div>
            </div>
            <p className="text-xs text-slate-300 italic">
              "Dos angelitos acompañando tus pasos, cuidándote y alumbrándote el camino en cada escenario."
            </p>
          </motion.div>
        )}

        {/* Letter Paragraphs */}
        <div className="space-y-3.5 text-sm md:text-base leading-relaxed text-slate-200 max-h-[48vh] overflow-y-auto px-1 py-1 font-normal">
          {chapter.text.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * index }}
              className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/60 leading-relaxed shadow-xs text-slate-100"
            >
              {paragraph}
            </motion.p>
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
