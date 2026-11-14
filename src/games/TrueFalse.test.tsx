import TrueFalse from './TrueFalse';
import { choiceSuite } from './testkit';

choiceSuite('TrueFalse', TrueFalse, {
  id: 'q1', type: 'true-false', wordEn: 'pen', promptWord: { en: 'pen', ar: 'قلم', emoji: '🖊️' },
  promptText: 'This is a ruler.', answer: 'false', explainAr: 'This is a pen.',
  options: [{ id: 'true', text: 'صح' }, { id: 'false', text: 'خطأ' }],
}, 'خطأ', 'صح');
