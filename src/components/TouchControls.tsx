import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

interface TouchControlsProps {
  onControlChange: (control: 'left' | 'right' | 'jump', active: boolean) => void;
  canFly?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onControlChange, canFly }) => {
  const handleTouch = (
    control: 'left' | 'right' | 'jump',
    active: boolean,
    e: React.TouchEvent | React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onControlChange(control, active);
  };

  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none z-30 px-4 flex items-end justify-between select-none">
      {/* Directional Pad (Left & Right) */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          id="btn-touch-left"
          aria-label="Caminar a la izquierda"
          onTouchStart={(e) => handleTouch('left', true, e)}
          onTouchEnd={(e) => handleTouch('left', false, e)}
          onTouchCancel={(e) => handleTouch('left', false, e)}
          onMouseDown={(e) => handleTouch('left', true, e)}
          onMouseUp={(e) => handleTouch('left', false, e)}
          onMouseLeave={(e) => handleTouch('left', false, e)}
          className="w-16 h-16 sm:w-18 sm:h-18 bg-slate-900/60 active:bg-amber-500/80 backdrop-blur-md rounded-2xl border-2 border-white/40 active:border-white text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
        >
          <ArrowLeft className="w-8 h-8 stroke-[3]" />
        </button>

        <button
          id="btn-touch-right"
          aria-label="Caminar a la derecha"
          onTouchStart={(e) => handleTouch('right', true, e)}
          onTouchEnd={(e) => handleTouch('right', false, e)}
          onTouchCancel={(e) => handleTouch('right', false, e)}
          onMouseDown={(e) => handleTouch('right', true, e)}
          onMouseUp={(e) => handleTouch('right', false, e)}
          onMouseLeave={(e) => handleTouch('right', false, e)}
          className="w-16 h-16 sm:w-18 sm:h-18 bg-slate-900/60 active:bg-amber-500/80 backdrop-blur-md rounded-2xl border-2 border-white/40 active:border-white text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
        >
          <ArrowRight className="w-8 h-8 stroke-[3]" />
        </button>
      </div>

      {/* Jump / Fly Button */}
      <div className="pointer-events-auto flex flex-col items-center">
        {canFly && (
          <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest font-display animate-pulse mb-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-yellow-400/40">
            ¡Mantén para Volar! ✨
          </span>
        )}
        <button
          id="btn-touch-jump"
          aria-label={canFly ? 'Volar y Saltar' : 'Saltar'}
          onTouchStart={(e) => handleTouch('jump', true, e)}
          onTouchEnd={(e) => handleTouch('jump', false, e)}
          onTouchCancel={(e) => handleTouch('jump', false, e)}
          onMouseDown={(e) => handleTouch('jump', true, e)}
          onMouseUp={(e) => handleTouch('jump', false, e)}
          onMouseLeave={(e) => handleTouch('jump', false, e)}
          className={`w-20 h-20 sm:w-22 sm:h-22 ${
            canFly
              ? 'bg-gradient-to-tr from-yellow-400 via-amber-300 to-white text-slate-950 shadow-amber-300/60 shadow-2xl border-4 border-yellow-200 animate-pulse'
              : 'bg-gradient-to-tr from-amber-500 to-yellow-400 active:from-yellow-400 active:to-amber-500 text-slate-900 border-3 border-white shadow-xl'
          } rounded-3xl flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer font-game`}
        >
          <ArrowUp className="w-8 h-8 stroke-[3]" />
          <span className="text-xs uppercase tracking-wider font-bold -mt-1">
            {canFly ? 'Volar' : 'Saltar'}
          </span>
        </button>
      </div>
    </div>
  );
};
