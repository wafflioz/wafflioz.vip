import { render, screen } from '@testing-library/react';
import App from './App';

// The DOM test covers the fallback. The real shader runs in a browser with WebGL.
jest.mock('ogl', () => ({}));

test('shows the landing page when WebGL is unavailable', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Wafflioz' })).toBeInTheDocument();
  expect(screen.getByText('Distributed GPU compute')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /motion/i })).not.toBeInTheDocument();
});
