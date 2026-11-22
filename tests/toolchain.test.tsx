import { render, screen } from '@testing-library/react';

it('compiles TSX through babel-jest', () => {
  render(<p>hello</p>);
  expect(screen.getByText('hello')).toBeInTheDocument();
});
