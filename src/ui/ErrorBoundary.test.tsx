import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never { throw new Error('boom'); }

test('a crashing screen shows the Arabic recovery button, not a blank page', () => {
  const err = vi.spyOn(console, 'error').mockImplementation(() => {});
  render(<ErrorBoundary><Boom /></ErrorBoundary>);
  expect(screen.getByRole('button', { name: /حدث خطأ، اضغط للعودة/ })).toBeInTheDocument();
  err.mockRestore();
});
