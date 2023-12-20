import { render, screen } from '@testing-library/react';
import IPC from './image-processor-chatgpt/App';

test('renders learn react link', () => {
  render(<IPC />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
