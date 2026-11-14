import type { Lesson, Word } from '../types';

const w = (en: string, emoji = '⭐', extra: Partial<Word> = {}): Word => ({ en, ar: en + '-ar', emoji, ...extra });
const challenge = () => ({ count: 8, types: ['listen-pick', 'pick-image', 'spell'] as Lesson['challenge']['types'] });

export const lesson4: Lesson = { id: 'l4', title: 'T', titleAr: 'ت', games: [], challenge: challenge(),
  words: [w('mum', '👩'), w('dad', '👨'), w('sister', '👧'), w('book', '📘')] };
export const lesson10: Lesson = { id: 'l10', title: 'T', titleAr: 'ت', games: [], challenge: challenge(),
  words: ['pen', 'ruler', 'book', 'paper', 'crayon', 'marker', 'shop', 'milk', 'apples', 'tea']
    .map((en, i) => w(en, ['🖊️', '📏', '📘', '📄', '🖍️', '🖌️', '🏪', '🥛', '🍎', '🍵'][i])) };
export const withAbstract: Lesson = { ...lesson10, id: 'wa',
  words: [...lesson10.words.slice(0, 5), w('whose', '❓', { abstract: true }), { en: 'nopic', ar: 'nopic-ar' }] };
export const withSentences: Lesson = { ...lesson4, id: 'ws',
  sentences: ['My sister has long black hair.', 'Hello, I am Ali.'],
  blanks: [{ text: 'I am in ___ 4.', answer: 'Grade', distractors: ['age', 'mum'] }] };
