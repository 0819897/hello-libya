import ListenPick from './ListenPick';
import { choiceSuite } from './testkit';

choiceSuite('ListenPick', ListenPick, {
  id: 'q1', type: 'listen-pick', wordEn: 'dad', promptWord: { en: 'dad', ar: 'أبي' }, listen: true,
  answer: 'dad', explainAr: 'dad = أبي',
  options: [{ id: 'mum', text: 'mum' }, { id: 'dad', text: 'dad' }, { id: 'age', text: 'age' }, { id: 'grade', text: 'grade' }],
}, 'dad', 'age');
