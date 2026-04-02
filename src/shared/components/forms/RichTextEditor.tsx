import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ClearOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useLayout } from '../layout/LayoutContext';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
}

const hasHtmlTag = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeIncomingValue = (value?: string) => {
  const content = value ?? '';
  if (!content.trim()) {
    return '';
  }

  if (hasHtmlTag(content)) {
    return content;
  }

  return content
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br>');
};

const isEmptyHtml = (value: string) => {
  const normalized = value
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, '')
    .replace(/<div><\/div>/gi, '')
    .replace(/<p><\/p>/gi, '')
    .replace(/\s/g, '')
    .replace(/<[^>]*>/g, '');

  return normalized.length === 0;
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Digite aqui...',
  minHeight = 120,
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useLayout();

  const normalizedValue = useMemo(() => normalizeIncomingValue(value), [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  }, [normalizedValue]);

  const emitChange = useCallback(() => {
    if (!onChange || !editorRef.current) {
      return;
    }

    const html = editorRef.current.innerHTML;
    if (isEmptyHtml(html)) {
      editorRef.current.innerHTML = '';
      onChange('');
      return;
    }

    onChange(html);
  }, [onChange]);

  const executeCommand = useCallback(
    (command: string) => {
      if (disabled) {
        return;
      }

      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      editor.focus();
      document.execCommand(command, false);
      emitChange();
    },
    [disabled, emitChange],
  );

  const toolbarItems = [
    { key: 'bold', label: 'Negrito', icon: <BoldOutlined />, command: 'bold' },
    { key: 'italic', label: 'Itálico', icon: <ItalicOutlined />, command: 'italic' },
    { key: 'underline', label: 'Sublinhado', icon: <UnderlineOutlined />, command: 'underline' },
    { key: 'unordered', label: 'Lista', icon: <UnorderedListOutlined />, command: 'insertUnorderedList' },
    { key: 'ordered', label: 'Lista numerada', icon: <OrderedListOutlined />, command: 'insertOrderedList' },
    { key: 'clear', label: 'Limpar formatação', icon: <ClearOutlined />, command: 'removeFormat' },
  ];

  return (
    <div className="prevent-rich-editor">
      <div className="prevent-rich-editor-toolbar">
        <Space size={4} wrap>
          {toolbarItems.map((item) => (
            <Tooltip key={item.key} title={item.label}>
              <Button
                size="small"
                type="text"
                disabled={disabled}
                className="prevent-rich-editor-btn"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => executeCommand(item.command)}
              >
                {item.icon}
              </Button>
            </Tooltip>
          ))}
        </Space>
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        className="prevent-rich-editor-content"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        aria-label={placeholder}
        style={{
          minHeight,
          background: isDarkMode ? '#171C2A' : '#fff',
          color: isDarkMode ? '#E2E8F0' : '#334155',
        }}
        onInput={emitChange}
        onBlur={emitChange}
      />
    </div>
  );
};
