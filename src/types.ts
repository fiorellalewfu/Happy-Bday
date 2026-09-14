export interface LetterChapter {
  id: number;
  title: string;
  subtitle: string;
  text: string[];
  icon: string;
  quote?: string;
  specialEffect?: 'twilight-lights' | 'golden-confetti' | 'leaves-canada' | 'dj-evolution' | 'celestial-flight';
}

export interface EasterEgg {
  id: string;
  title: string;
  description: string;
  emoji: string;
  x: number;
  y: number;
  found: boolean;
}

export interface GameControlState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface GameEngineCallbacks {
  onStarCollect: (starIndex: number, chapter: LetterChapter, isSuperDJ: boolean, canFly: boolean) => void;
  onEasterEggFound: (egg: EasterEgg) => void;
  onReachGoal: () => void;
  onStarCountUpdate: (count: number) => void;
  onDiscCountUpdate?: (count: number) => void;
  onMichelleUnlocked?: () => void;
  onEvolution?: () => void;
  onFlightUnlocked?: () => void;
}
