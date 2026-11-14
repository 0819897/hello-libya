export type Word = { en: string; ar: string; emoji?: string; image?: string; audio?: string; abstract?: boolean };
export type Blank = { text: string; answer: string; distractors: [string, string] }; // text contains "___"
export type GameType = 'pick-image' | 'listen-pick' | 'match' | 'order-sentence' | 'fill-blank'
  | 'spell' | 'true-false' | 'drag-order' | 'world-map' | 'clock' | 'stall';
export type GameSpec = { type: GameType; count?: number; config?: Record<string, unknown> };
export type Lesson = {
  id: string; title: string; titleAr: string; words: Word[];
  grammar?: { explainAr: string; examples: string[] };
  sentences?: string[]; blanks?: Blank[];
  games: GameSpec[]; challenge: { count: number; types: GameType[] };
};
export type LessonRef = { id: string; file: string; title: string; titleAr: string };
export type UnitIndex = { id: string; title: string; titleAr: string; status: 'open' | 'soon';
  kind: 'unit' | 'big-challenge'; lessons: LessonRef[] };
export type GradeIndex = { id: string; titleAr: string; levelTitleAr: string; units: UnitIndex[] };
export type GradeEntry = { id: string; titleAr: string; levelTitleAr: string; status: 'open' | 'soon'; index?: string };
export type Option = { id: string; text?: string; emoji?: string; image?: string };
export type Question = {
  id: string; type: GameType; wordEn?: string;
  promptText?: string; promptWord?: Word; listen?: boolean;
  options?: Option[]; pairs?: { left: Option; right: Option }[]; tiles?: string[];
  answer: string | string[]; explainAr?: string; config?: Record<string, unknown>;
};
export type GameResult = { correct: boolean; attempts: number };
export type GameProps = { question: Question; onDone: (r: GameResult) => void };
export type Progress = {
  name: string; avatar: string; mode: 'student' | 'self';
  points: number; lessons: Record<string, { stars: 0 | 1 | 2 | 3; bestPct: number }>;
  streak: { count: number; lastDay: string }; // lastDay = local YYYY-MM-DD, '' if none
  badges: string[]; mistakes: string[]; learned: string[]; // word.en values
  imported: Lesson[]; teacherMode: boolean; sound: boolean;
};
