export interface LetterChapter {
  id: number;
  title: string;
  subtitle: string;
  text: string[];
  icon: string;
  quote?: string;
  specialEffect?: 'twilight-lights' | 'golden-confetti' | 'leaves-canada';
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
