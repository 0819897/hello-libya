import type { FC } from 'react';
import type { GameProps, GameType } from '../types';
import PickImage from './PickImage';
import ListenPick from './ListenPick';
import Match from './Match';
import OrderSentence from './OrderSentence';
import FillBlank from './FillBlank';
import Spell from './Spell';
import TrueFalse from './TrueFalse';

export const registry: Partial<Record<GameType, FC<GameProps>>> = {
  'pick-image': PickImage,
  'listen-pick': ListenPick,
  match: Match,
  'order-sentence': OrderSentence,
  'fill-blank': FillBlank,
  spell: Spell,
  'true-false': TrueFalse,
};
