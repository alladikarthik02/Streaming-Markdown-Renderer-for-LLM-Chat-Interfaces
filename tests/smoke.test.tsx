import { render, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Markdown } from '../src/index.js';
afterEach(cleanup);
it('mounts and unmounts the public component', () => {
  const view = render(<Markdown source="Ready" />);
  expect(view.getByText('Ready')).toBeTruthy();
  view.unmount();
  expect(view.container.innerHTML).toBe('');
});
