import FillBlank from './FillBlank';
import { choiceSuite } from './testkit';

choiceSuite('FillBlank', FillBlank, {
  id: 'q1', type: 'fill-blank', promptText: 'Reem is in ___ 4.', answer: 'Grade', explainAr: 'Reem is in Grade 4.',
  options: [{ id: 'age', text: 'age' }, { id: 'Grade', text: 'Grade' }, { id: 'mum', text: 'mum' }],
}, 'Grade', 'mum');
