import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { RotateCcw, Disc3, ExternalLink } from 'lucide-react';
import { playVictoryFanfare } from '../audio/soundEffects';
import { JONAMS_TRACK_META } from '../audio/soundcloudManager';

interface VictoryModalProps {
  onRestart: () => void;
}

type VictoryView = 'summary' | 'live-dj' | 'full-letter';

export const VictoryModal: React.FC<VictoryModalProps> = ({ onRestart }) => {
  const [viewMode, setViewMode] = useState<VictoryView>('summary');

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

  // When user chooses Live DJ mode, show a sleek floating festival banner so Jonathan mixing is 100% visible!
  if (viewMode === 'live-dj') {
    return (
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 border border-amber-400/60 backdrop-blur-md shadow-2xl max-w-[94vw]"
      >
        <div className="flex items-center gap-2.5 text-amber-300 font-game text-xs sm:text-sm mr-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="uppercase tracking-wider">
            EN VIVO: JONATHAN EN EL MAINSTAGE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-back-to-summary"
            onClick={() => setViewMode('summary')}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-game text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer uppercase font-bold"
          >
            <span>Mensaje & Carta</span>
          </button>

          <button
            id="btn-restart-from-live"
            onClick={onRestart}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-game text-xs rounded-xl border border-slate-600 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer uppercase"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 240 }}
        className="w-full max-w-2xl house-panel rounded-3xl p-6 md:p-8 text-slate-100 relative my-auto shadow-2xl border border-amber-400/40"
      >
        {/* Header Ribbon */}
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-game px-6 py-2 rounded-2xl shadow-lg border border-amber-200 mb-2">
            <h1 className="text-xl md:text-2xl tracking-wider uppercase">
              ¡Misión Cumplida, Jonathan!
            </h1>
          </div>
          <p className="text-amber-400 text-xs md:text-sm font-semibold tracking-wider font-display uppercase">
            Las 5 Estrellas Han Sido Reunidas • Jonathan en la Mesa DJ
          </p>
        </div>

        {/* Modal Body */}
        {viewMode === 'summary' ? (
          <div className="space-y-4">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 text-center">
              <h2 className="font-game text-xl text-white mb-2">
                ¡Feliz Cumpleaños, Hermano!
              </h2>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                Has recorrido cada plataforma, superado cada salto y alcanzado la cabina del Mainstage.
                Ahora estás mezclando tu propio Set List en vivo, haciendo vibrar la pista con tu música y pasión inagotable.
              </p>
            </div>

            {/* Live DJ Showcase Action */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900/90 to-amber-950/60 border border-cyan-400/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0">
                  <Disc3 className="w-7 h-7 text-cyan-400 animate-spin" />
                </div>
                <div>
                  <div className="text-sm text-cyan-300 font-game uppercase">
                    Jonathan está mezclando en vivo
                  </div>
                  <div className="text-xs text-slate-300">
                    Mira a Jonathan detrás de los CDJs con sus audífonos y luces de festival.
                  </div>
                </div>
              </div>

              <button
                id="btn-view-dj-live"
                onClick={() => setViewMode('live-dj')}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-game text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 uppercase font-bold"
              >
                <span>Ver Set en Vivo</span>
              </button>
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
                <span>SoundCloud</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-read-full-letter"
                onClick={() => setViewMode('full-letter')}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-game text-base rounded-2xl border border-slate-600 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
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
          /* Vista de Carta Completa Manuscrita y Poética (Sin íconos AI, tipografía caligráfica natural) */
          <div className="space-y-4">
            {/* Cabecera sutil de navegación */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-400/20">
              <span className="text-xs uppercase tracking-widest text-amber-300 font-display font-semibold">
                Carta a Jonathan
              </span>
              <button
                id="btn-back-from-letter"
                onClick={() => setViewMode('summary')}
                className="text-xs text-amber-300 hover:text-amber-200 font-medium cursor-pointer underline transition-colors"
              >
                Volver al resumen
              </button>
            </div>

            {/* Pliego de Carta Manuscrita */}
            <div className="letter-parchment rounded-2xl p-6 sm:p-9 shadow-inner border border-amber-300/40 max-h-[58vh] overflow-y-auto pr-2 sm:pr-4 select-text">
              <div className="font-handwriting text-2xl sm:text-3xl text-stone-900 leading-[1.8] space-y-6">
                <p className="font-semibold text-3xl sm:text-4xl text-stone-950">
                  Querido Jonathan,
                </p>

                <p>
                  Hoy estoy muy contenta de tener la oportunidad de escribirte y de poder poner en palabras tantas emociones, recuerdos y sentimientos que aparecen cuando pienso en ti.
                </p>

                <p>
                  En esta nueva vuelta al sol, me emociona mucho pensar en el hombre en el que te has convertido. Te veo haciendo lo que te gusta, haciendo música como DJ, siguiendo tus pasiones, cuidándote y también guiando al Moisés por el buen camino del ejercicio. Estoy muy orgullosa de ti, hermanito.
                </p>

                <p>
                  También me hace feliz saber que estás cerca de nuestros hermanos, que se tienen los unos a los otros, que se cuidan y siguen alimentando ese amor tan especial de esta familia loca que tenemos. Yo te pienso mucho y te extraño muchísimo.
                </p>

                <p>
                  A veces recuerdo cuando eras pequeño y siento que disfruté tanto esa etapa tuya. Para mí siempre vas a tener algo de ese leoncito de la familia, lleno de energía, personalidad y vida.
                </p>

                <p>
                  Y también siento que mamá y papá siguen de alguna manera cerquita de ti, como dos angelitos acompañando tus pasos, cuidándote y alumbrándote el camino. Me imagino que, si pudieran verte hoy y ver en el hombre en el que te has convertido, estarían tan orgullosos de ti como lo estoy yo.
                </p>

                <p>
                  Espero de corazón que algún día puedas venir a verme aquí a Canadá y que podamos volver a compartir juntos.
                </p>

                <p>
                  Y como decía la mamá, mi mayor deseo para ti es que seas feliz. Que pongas tu vida en manos de tu propia felicidad, que sigas escogiendo aquello que te haga bien y que nunca dejes de construir una vida que realmente se sienta tuya.
                </p>

                <div className="pt-4 space-y-1 text-right">
                  <p className="font-semibold text-3xl sm:text-4xl text-stone-950">
                    Te quiero muchísimo, hermano.
                  </p>
                  <p className="text-xl sm:text-2xl text-stone-700 italic">
                    Con todo mi amor siempre,
                  </p>
                  <p className="font-semibold text-2xl sm:text-3xl text-stone-900">
                    Tu hermana
                  </p>
                </div>
              </div>
            </div>

            {/* Controles inferiores limpios y sobrios */}
            <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setViewMode('live-dj')}
                className="px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-display text-xs font-semibold rounded-xl border border-cyan-400/40 transition-all cursor-pointer"
              >
                Ver Set en Vivo en el Mainstage
              </button>
              <button
                onClick={() => setViewMode('summary')}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-game text-sm rounded-xl transition-all cursor-pointer shadow-md"
              >
                Cerrar Carta
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
