import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Dumbbell } from 'lucide-react';
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
  const isBrothersChapter = chapter.id === 3;
  const isCanadaChapter = chapter.id === 5 || chapter.specialEffect === 'leaves-canada';
  const isMushroomChapter = chapter.id === 1;
  const unlockBadgeText = isMushroomChapter
    ? `Hongo ${chapter.id} desbloqueado`
    : isBrothersChapter
      ? 'Mancuerna mágica desbloqueada'
      : isParentsChapter
        ? 'Corazón celestial desbloqueado'
        : isCanadaChapter
          ? 'Hoja de maple desbloqueada'
        : `Estrella ${chapter.id} desbloqueada`;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 25 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className={`w-full max-w-xl house-panel rounded-3xl p-6 md:p-8 text-slate-100 relative my-auto shadow-2xl border border-amber-400/40 ${isMushroomChapter ? 'mushroom-letter' : ''} ${isEvolutionChapter ? 'evolution-letter' : ''} ${isBrothersChapter ? 'brothers-letter' : ''} ${isParentsChapter ? 'parents-letter' : ''} ${isCanadaChapter ? 'canada-letter' : ''}`}
      >
        {isEvolutionChapter && (
          <div className="dj-magic-aura" aria-hidden="true">
            <span className="dj-magic-ring dj-magic-ring-one" />
            <span className="dj-magic-ring dj-magic-ring-two" />
            <span className="dj-magic-star dj-magic-star-one">✦</span>
            <span className="dj-magic-star dj-magic-star-two">✦</span>
            <span className="dj-magic-star dj-magic-star-three">✦</span>
            <span className="dj-magic-star dj-magic-star-four">✦</span>
          </div>
        )}

        {isBrothersChapter && (
          <div className="brother-sports-motif" aria-hidden="true">
            <Dumbbell className="brother-dumbbell brother-dumbbell-one" />
            <Dumbbell className="brother-dumbbell brother-dumbbell-two" />
            <span className="brother-gym-line brother-gym-line-one" />
            <span className="brother-gym-line brother-gym-line-two" />
          </div>
        )}

        {isCanadaChapter && (
          <div className="canada-maple-motif" aria-hidden="true">
            <span className="canada-floating-leaf canada-leaf-one">🍁</span>
            <span className="canada-floating-leaf canada-leaf-two">🍁</span>
            <span className="canada-floating-leaf canada-leaf-three">🍁</span>
          </div>
        )}

        {/* Top Floating Star Badge */}
        <div className="letter-unlock-badge absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-game px-5 py-1.5 rounded-full shadow-lg border border-amber-200">
          <span className="text-lg leading-none" aria-hidden="true">{chapter.icon}</span>
          <span className="text-xs tracking-wider uppercase font-bold">{unlockBadgeText}</span>
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

        {/* Brother Companion Announcement for Chapter 3 */}
        {isBrothersChapter && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 240 }}
            className="brother-unlock-banner mb-4 p-4 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="brother-unlock-icon" aria-hidden="true">
              <Dumbbell className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] font-display mt-2 mb-1">
              Compañero desbloqueado
            </span>
            <p className="font-handwriting text-xl sm:text-2xl leading-snug text-white">
              Se une a tu aventura tu compañero y mejor amigo de la vida:
              <strong className="block text-cyan-300 text-2xl sm:text-3xl mt-0.5">tu hermano, tu bro.</strong>
            </p>
            <span className="brother-follow-chip mt-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
              Juntos hasta el final • Te seguirá en la aventura
            </span>
          </motion.div>
        )}

        {/* Symbolic representation for parents & Celestial Flight Power for Chapter 4 */}
        {isParentsChapter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="parent-flight-banner mb-4 p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-slate-900/90 border border-amber-300/40 flex flex-col items-center justify-center text-center shadow-lg shadow-amber-400/10"
          >
            <div className="parent-name-constellations" aria-label="Constelaciones de Gregorio y Victoria">
              <span><i>✦</i> GREGORIO <i>✦</i></span>
              <b aria-hidden="true">♡</b>
              <span><i>✦</i> VICTORIA <i>✦</i></span>
            </div>
            <span className="text-xs font-bold text-amber-300 tracking-widest uppercase font-display mb-1">
              Vuelo Celestial • Gregorio y Victoria
            </span>
            <p className="text-sm font-handwriting text-amber-200/95 text-lg leading-snug mb-1.5">
              "Dos luces eternas que cuidan tus pasos te otorgan alas de luz."
            </p>
            <p className="text-[11px] text-slate-300 leading-snug bg-slate-900/60 px-3 py-1.5 rounded-xl border border-amber-400/20">
              Mantén presionado <strong className="text-white">SALTAR</strong> para elevarte. Vuela hacia lo alto y encontrarás sus nombres escritos entre las estrellas.
            </p>
          </motion.div>
        )}

        {/* Canadian Maple Announcement for Chapter 5 */}
        {isCanadaChapter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 230 }}
            className="canada-unlock-banner mb-4 p-4 rounded-2xl flex flex-col items-center justify-center text-center"
          >
            <span className="canada-maple-emblem" aria-hidden="true">🍁</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] font-display mt-2 mb-1 text-red-200">
              Camino a Canadá
            </span>
            <p className="font-handwriting text-xl sm:text-2xl leading-snug text-white">
              Una hoja de maple ilumina el camino hacia ese abrazo pendiente.
            </p>
            <span className="canada-destination-chip mt-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
              Destino: Canadá • Nos volveremos a encontrar
            </span>
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
