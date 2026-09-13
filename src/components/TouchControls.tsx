import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Feather } from 'lucide-react';

interface TouchControlsProps {
  onControlChange: (control: 'left' | 'right' | 'jump', active: boolean) => void;
  canFly?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onControlChange, canFly }) => {
  const [leftActive, setLeftActive] = useState(false);
  const [rightActive, setRightActive] = useState(false);
  const [jumpActive, setJumpActive] = useState(false);

  // Ref to track active directions to avoid redundant callbacks
  const activeDirRef = useRef<'left' | 'right' | null>(null);
  const activeJumpRef = useRef<boolean>(false);
  const dpadRef = useRef<HTMLDivElement>(null);
  const dpadTouchIdRef = useRef<number | null>(null);
  const jumpTouchIdRef = useRef<number | null>(null);

  const triggerHaptic = (duration = 10) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(duration);
      }
    } catch {
      // Ignore vibration errors
    }
  };

  const setDirection = useCallback((dir: 'left' | 'right' | null) => {
    if (activeDirRef.current === dir) return;

    if (activeDirRef.current) {
      onControlChange(activeDirRef.current, false);
    }
    activeDirRef.current = dir;

    if (dir) {
      onControlChange(dir, true);
      triggerHaptic(12);
      if (dir === 'left') {
        setLeftActive(true);
        setRightActive(false);
      } else {
        setRightActive(true);
        setLeftActive(false);
      }
    } else {
      setLeftActive(false);
      setRightActive(false);
    }
  }, [onControlChange]);

  const setJump = useCallback((active: boolean) => {
    if (activeJumpRef.current === active) return;
    activeJumpRef.current = active;
    setJumpActive(active);
    onControlChange('jump', active);
    if (active) {
      triggerHaptic(15);
    }
  }, [onControlChange]);

  // Clean up inputs on unmount
  useEffect(() => {
    return () => {
      if (activeDirRef.current) {
        onControlChange(activeDirRef.current, false);
      }
      if (activeJumpRef.current) {
        onControlChange('jump', false);
      }
    };
  }, [onControlChange]);

  // D-Pad Touch Handlers (Supports sliding between Left and Right smoothly)
  const handleDpadTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!dpadRef.current) return;
    const touch = e.changedTouches[0];
    dpadTouchIdRef.current = touch.identifier;

    const rect = dpadRef.current.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const isLeft = touchX < rect.width / 2;
    setDirection(isLeft ? 'left' : 'right');
  };

  const handleDpadTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!dpadRef.current || dpadTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === dpadTouchIdRef.current) {
        const rect = dpadRef.current.getBoundingClientRect();
        // Check if still within touch vertical bounds +/- 30px
        if (touch.clientY < rect.top - 40 || touch.clientY > rect.bottom + 40) {
          setDirection(null);
          return;
        }
        const touchX = touch.clientX - rect.left;
        const isLeft = touchX < rect.width / 2;
        setDirection(isLeft ? 'left' : 'right');
        break;
      }
    }
  };

  const handleDpadTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === dpadTouchIdRef.current) {
        dpadTouchIdRef.current = null;
        setDirection(null);
        break;
      }
    }
  };

  // Jump Touch Handlers
  const handleJumpTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    jumpTouchIdRef.current = touch.identifier;
    setJump(true);
  };

  const handleJumpTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === jumpTouchIdRef.current) {
        jumpTouchIdRef.current = null;
        setJump(false);
        break;
      }
    }
  };

  // Mouse fallback for testing touch controls with a mouse/trackpad
  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setDirection('left');
  };
  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setDirection('right');
  };
  const handleMouseUpDir = (e: React.MouseEvent) => {
    e.preventDefault();
    setDirection(null);
  };

  const handleMouseDownJump = (e: React.MouseEvent) => {
    e.preventDefault();
    setJump(true);
  };
  const handleMouseUpJump = (e: React.MouseEvent) => {
    e.preventDefault();
    setJump(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 pb-safe pointer-events-none z-30 px-3 sm:px-6 flex items-end justify-between select-none">
      {/* Directional Pad Container: Unified rocker supporting dual touch & slide */}
      <div
        ref={dpadRef}
        id="touch-dpad-container"
        onTouchStart={handleDpadTouchStart}
        onTouchMove={handleDpadTouchMove}
        onTouchEnd={handleDpadTouchEnd}
        onTouchCancel={handleDpadTouchEnd}
        className="pointer-events-auto flex items-center bg-slate-900/80 backdrop-blur-md p-1.5 rounded-3xl border border-amber-400/40 shadow-2xl touch-control-btn"
      >
        {/* Left Action Button */}
        <button
          id="btn-touch-left"
          type="button"
          aria-label="Caminar a la izquierda"
          onMouseDown={handleMouseDownLeft}
          onMouseUp={handleMouseUpDir}
          onMouseLeave={handleMouseUpDir}
          className={`w-15 h-15 xs:w-17 xs:h-17 sm:w-18 sm:h-18 rounded-2xl flex flex-col items-center justify-center transition-all duration-75 touch-control-btn cursor-pointer ${
            leftActive
              ? 'bg-amber-400 text-slate-950 scale-95 shadow-lg shadow-amber-400/50'
              : 'bg-slate-800/80 text-amber-200/90 hover:bg-slate-700/80'
          }`}
        >
          <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.8]" />
          <span className="text-[9px] uppercase tracking-wider font-bold -mt-0.5">Izq</span>
        </button>

        <div className="w-1.5 h-8 bg-slate-700/40 mx-0.5 rounded-full" />

        {/* Right Action Button */}
        <button
          id="btn-touch-right"
          type="button"
          aria-label="Caminar a la derecha"
          onMouseDown={handleMouseDownRight}
          onMouseUp={handleMouseUpDir}
          onMouseLeave={handleMouseUpDir}
          className={`w-15 h-15 xs:w-17 xs:h-17 sm:w-18 sm:h-18 rounded-2xl flex flex-col items-center justify-center transition-all duration-75 touch-control-btn cursor-pointer ${
            rightActive
              ? 'bg-amber-400 text-slate-950 scale-95 shadow-lg shadow-amber-400/50'
              : 'bg-slate-800/80 text-amber-200/90 hover:bg-slate-700/80'
          }`}
        >
          <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.8]" />
          <span className="text-[9px] uppercase tracking-wider font-bold -mt-0.5">Der</span>
        </button>
      </div>

      {/* Jump / Fly Action Button */}
      <div className="pointer-events-auto flex flex-col items-center">
        {canFly && (
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest font-display animate-pulse mb-1.5 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-amber-400/50 shadow-md flex items-center gap-1">
            <Feather className="w-3 h-3 text-yellow-300" />
            <span>Mantén para Volar</span>
          </span>
        )}
        <button
          id="btn-touch-jump"
          type="button"
          aria-label={canFly ? 'Volar y Saltar' : 'Saltar'}
          onTouchStart={handleJumpTouchStart}
          onTouchEnd={handleJumpTouchEnd}
          onTouchCancel={handleJumpTouchEnd}
          onMouseDown={handleMouseDownJump}
          onMouseUp={handleMouseUpJump}
          onMouseLeave={handleMouseUpJump}
          className={`w-18 h-18 xs:w-20 xs:h-20 sm:w-22 sm:h-22 rounded-3xl flex flex-col items-center justify-center font-game shadow-2xl transition-all duration-75 touch-control-btn cursor-pointer ${
            canFly
              ? jumpActive
                ? 'bg-gradient-to-tr from-yellow-300 via-amber-200 to-white text-slate-950 scale-95 shadow-amber-300/80 border-2 border-white'
                : 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-white text-slate-950 shadow-amber-300/50 border-2 border-yellow-200/80'
              : jumpActive
              ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 scale-95 shadow-amber-400/60 border-2 border-white'
              : 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 shadow-xl border border-white/60'
          }`}
        >
          {canFly ? (
            <Feather className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.6]" />
          ) : (
            <ArrowUp className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
          )}
          <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold -mt-0.5">
            {canFly ? 'Volar' : 'Saltar'}
          </span>
        </button>
      </div>
    </div>
  );
};
