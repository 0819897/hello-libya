import PickImage from './PickImage';
import { choiceSuite } from './testkit';

choiceSuite('PickImage', PickImage, {
  id: 'q1', type: 'pick-image', wordEn: 'mum', promptText: 'mum', promptWord: { en: 'mum', ar: 'أمي', emoji: '👩' },
  answer: 'mum', explainAr: 'mum = أمي',
  options: [{ id: 'mum', emoji: '👩' }, { id: 'dad', emoji: '👨' }, { id: 'sister', emoji: '👧' }, { id: 'book', emoji: '📘' }],
}, '👩', '👨');
