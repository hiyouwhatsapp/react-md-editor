/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MDEditor from '../core/src';

function TestEditor({ value: initialValue, continueListsOnEnter }: { value: string; continueListsOnEnter?: boolean }) {
  const [value, setValue] = React.useState(initialValue);
  return (
    <MDEditor
      preview="edit"
      value={value}
      onChange={(next) => setValue(next ?? '')}
      continueListsOnEnter={continueListsOnEnter}
    />
  );
}

function pressEnter(textarea: HTMLTextAreaElement) {
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  return fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', keyCode: 13 });
}

it.each(['- 안녕하세요', '* item', '12. item', '- [x] done', '- '])(
  'leaves Enter to the browser when list continuation is disabled for %s',
  (value) => {
    render(<TestEditor value={value} continueListsOnEnter={false} />);
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');

    expect(pressEnter(textarea)).toBe(true);
    expect(textarea).toHaveValue(value);
  },
);

it('keeps list continuation enabled by default', () => {
  render(<TestEditor value="12. item" />);
  const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');

  expect(pressEnter(textarea)).toBe(false);
  expect(textarea).toHaveValue('12. item\n13. ');
});

it('uses the latest list continuation setting without remounting the textarea', () => {
  const { rerender } = render(<TestEditor value="- item" />);
  const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');

  rerender(<TestEditor value="- item" continueListsOnEnter={false} />);
  expect(screen.getByRole('textbox')).toBe(textarea);
  expect(pressEnter(textarea)).toBe(true);

  rerender(<TestEditor value="- item" continueListsOnEnter />);
  expect(pressEnter(textarea)).toBe(false);
  expect(textarea).toHaveValue('- item\n- ');
});
