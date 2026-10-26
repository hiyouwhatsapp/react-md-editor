/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MDEditor from '../core/src';
import MDEditorCommon from '../core/src/index.common';
import MDEditorNoHighlight from '../core/src/index.nohighlight';

const largeImage = `![image](data:image/png;base64,${'a'.repeat(100_000)})`;
const editors = [
  ['default', MDEditor],
  ['common', MDEditorCommon],
] as const;

describe.each(editors)('%s editor with large markdown', (_mode, Editor) => {
  it('uses a visible textarea instead of highlighting large base64 images', () => {
    const { container } = render(
      <Editor preview="edit" value={largeImage} textareaProps={{ 'aria-label': 'markdown input' }} />,
    );

    const input = screen.getByRole('textbox', { name: 'markdown input' });
    expect(input).toHaveValue(largeImage);
    expect(container.querySelector('.w-md-editor-text-pre')).not.toBeInTheDocument();
    expect(input).toHaveStyle({ overflow: 'auto', WebkitTextFillColor: 'initial' });
  });

  it('restores highlighting when the value gets smaller', () => {
    const { container, rerender } = render(
      <Editor preview="edit" value={largeImage} textareaProps={{ 'aria-label': 'markdown input' }} />,
    );

    expect(container.querySelector('.w-md-editor-text-pre')).not.toBeInTheDocument();
    rerender(<Editor preview="edit" value="**short text**" textareaProps={{ 'aria-label': 'markdown input' }} />);

    expect(screen.getByRole('textbox', { name: 'markdown input' })).toHaveValue('**short text**');
    expect(container.querySelector('.w-md-editor-text-pre')).toBeInTheDocument();
  });

  it('keeps large markdown editable', () => {
    const onChange = jest.fn();
    const { container } = render(
      <Editor preview="edit" value={largeImage} onChange={onChange} textareaProps={{ 'aria-label': 'markdown input' }} />,
    );
    const nextValue = largeImage + '\\nmore text';
    fireEvent.change(screen.getByRole('textbox', { name: 'markdown input' }), { target: { value: nextValue } });

    expect(onChange).toHaveBeenCalledWith(nextValue, expect.anything(), expect.anything());
    expect(container.querySelector('.w-md-editor-text-pre')).not.toBeInTheDocument();
  });
});

it('keeps the nohighlight editor as a plain textarea', () => {
  const { container } = render(
    <MDEditorNoHighlight preview="edit" value={largeImage} textareaProps={{ 'aria-label': 'markdown input' }} />,
  );
  expect(screen.getByRole('textbox', { name: 'markdown input' })).toHaveValue(largeImage);
  expect(container.querySelector('.w-md-editor-text-pre')).not.toBeInTheDocument();
});
