import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { users } from '@/data/users';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

afterEach(() => document.documentElement.classList.remove('dark'));

it('renders the dashboard at /', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  expect(screen.getByText('Revenue')).toBeInTheDocument();
});

it('lists every user in the table', () => {
  renderAt('/tables');
  expect(screen.getByRole('heading', { name: 'Tables' })).toBeInTheDocument();
  expect(screen.getAllByRole('row')).toHaveLength(users.length + 1);
});

it('toggles dark mode on the settings page', () => {
  renderAt('/settings');
  fireEvent.click(screen.getByRole('button', { name: /switch to dark/i }));
  expect(document.documentElement).toHaveClass('dark');
  expect(screen.getByRole('button', { name: /switch to light/i })).toBeInTheDocument();
});

it('navigates with the main nav', () => {
  renderAt('/');
  fireEvent.click(screen.getByRole('link', { name: 'Tables' }));
  expect(screen.getByRole('heading', { name: 'Tables' })).toBeInTheDocument();
});
