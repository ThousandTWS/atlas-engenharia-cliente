import React from 'react';
import { App, Button, Divider, Drawer, Input, Modal, Space, Tabs, Tag, Tooltip, Typography } from 'antd';
import {
  CodeOutlined,
  CompressOutlined,
  CopyOutlined,
  ExpandOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { renderPdfTemplate } from '../utils/pdfTemplate';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';

const { Text } = Typography;

export type PdfTemplatePlaceholder = {
  key: string;
  label?: string;
  description?: string;
};

export interface PdfTemplateEditorModalProps {
  open: boolean;
  title: string;
  confirmLoading?: boolean;
  okText?: string;
  cancelText?: string;
  onCancel: () => void;
  onSave: () => void | Promise<void>;
  variant?: 'modal' | 'drawer';

  templateName: string;
  templateHtml: string;
  onChangeName: (value: string) => void;
  onChangeHtml: (value: string) => void;

  helperText?: React.ReactNode;
  placeholders?: PdfTemplatePlaceholder[];
  previewVariables?: Record<string, string>;
  defaultTabKey?: 'editor' | 'preview' | 'placeholders';
}

export const PdfTemplateEditorModal: React.FC<PdfTemplateEditorModalProps> = ({
  open,
  title,
  confirmLoading,
  okText = 'Salvar template',
  cancelText = 'Cancelar',
  onCancel,
  onSave,
  variant = 'modal',
  templateName,
  templateHtml,
  onChangeName,
  onChangeHtml,
  helperText,
  placeholders = [],
  previewVariables = {},
  defaultTabKey = 'editor',
}) => {
  const { message } = App.useApp();
  const [tabKey, setTabKey] = React.useState<'editor' | 'preview' | 'placeholders'>(defaultTabKey);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [baseline, setBaseline] = React.useState({ name: '', html: '' });

  const textareaRef = React.useRef<any>(null);
  const aceRef = React.useRef<React.ComponentRef<typeof AceEditor> | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setTabKey(defaultTabKey);
    setIsFullscreen(false);
    setBaseline({ name: templateName, html: templateHtml });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isDirty = open && (templateName !== baseline.name || templateHtml !== baseline.html);

  const previewHtml = React.useMemo(() => {
    if (!templateHtml?.trim()) {
      return '';
    }
    return renderPdfTemplate(templateHtml, previewVariables);
  }, [templateHtml, previewVariables]);

  const insertAtCursor = (value: string) => {
    const aceEditor = aceRef.current?.editor;
    if (aceEditor) {
      try {
        setTabKey('editor');
        aceEditor.focus();
        aceEditor.insert(value);
        return;
      } catch {
        // Fall back to textarea insertion.
      }
    }

    const textArea = textareaRef.current?.resizableTextArea?.textArea as HTMLTextAreaElement | undefined;
    if (!textArea) {
      onChangeHtml(`${templateHtml || ''}${value}`);
      return;
    }

    const start = textArea.selectionStart ?? (templateHtml || '').length;
    const end = textArea.selectionEnd ?? start;
    const next = `${(templateHtml || '').slice(0, start)}${value}${(templateHtml || '').slice(end)}`;
    onChangeHtml(next);

    requestAnimationFrame(() => {
      try {
        textArea.focus();
        const cursor = start + value.length;
        textArea.setSelectionRange(cursor, cursor);
      } catch {
        // Ignore selection issues in older browsers.
      }
    });
  };

  const openFind = () => {
    const aceEditor = aceRef.current?.editor;
    if (!aceEditor) {
      return;
    }
    try {
      setTabKey('editor');
      aceEditor.focus();
      aceEditor.execCommand('find');
    } catch {
      // Ignore search failures.
    }
  };

  const openReplace = () => {
    const aceEditor = aceRef.current?.editor;
    if (!aceEditor) {
      return;
    }
    try {
      setTabKey('editor');
      aceEditor.focus();
      aceEditor.execCommand('replace');
    } catch {
      // Ignore replace failures.
    }
  };

  const handleCancel = () => {
    if (!isDirty) {
      onCancel();
      return;
    }

    Modal.confirm({
      title: 'Descartar alterações?',
      content: 'Você tem alterações não salvas. Fechar agora vai perder essas mudanças.',
      okText: 'Descartar',
      cancelText: 'Continuar editando',
      okButtonProps: { danger: true },
      onOk: onCancel,
    });
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success('Copiado.');
    } catch {
      message.error('Não foi possível copiar.');
    }
  };

  const content = (
    <div className="atlas-pdf-template-editor">
      <div className="atlas-pdf-template-toolbar">
        <Space size={10} wrap>
          {helperText ? (
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: 6 }} />
              {helperText}
            </Text>
          ) : null}
          <Text type="secondary" className="atlas-pdf-template-kbd-hint">
            Ctrl+F buscar • Ctrl+H substituir
          </Text>
        </Space>

        <Space size={8} wrap>
          <Tooltip title="Buscar (Ctrl+F)">
            <Button
              className="atlas-services-button"
              icon={<SearchOutlined />}
              onClick={openFind}
            />
          </Tooltip>
          <Tooltip title="Substituir (Ctrl+H)">
            <Button
              className="atlas-services-button"
              icon={<SwapOutlined />}
              onClick={openReplace}
            />
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Sair do modo tela cheia' : 'Tela cheia'}>
            <Button
              className="atlas-services-button"
              icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={() => setIsFullscreen((current) => !current)}
            />
          </Tooltip>
          <Tooltip title="Abrir prévia">
            <Button
              className="atlas-services-button"
              icon={<EyeOutlined />}
              onClick={() => setTabKey('preview')}
              disabled={!templateHtml.trim()}
            />
          </Tooltip>
          {placeholders.length ? (
            <Tooltip title="Ver placeholders">
              <Button
                className="atlas-services-button"
                icon={<CodeOutlined />}
                onClick={() => setTabKey('placeholders')}
              />
            </Tooltip>
          ) : null}
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Input
          className="atlas-services-input"
          placeholder="Nome do template"
          value={templateName}
          onChange={(event) => onChangeName(event.target.value)}
        />

        <Tabs
          activeKey={tabKey}
          onChange={(key) => setTabKey(key as typeof tabKey)}
          items={[
            {
              key: 'editor',
              label: 'Editor',
              children: (
                <div className="atlas-pdf-template-ace">
                  <AceEditor
                    ref={aceRef}
                    mode="html"
                    theme="github"
                    width="100%"
                    height={isFullscreen ? '70vh' : '460px'}
                    value={templateHtml}
                    onChange={(value) => onChangeHtml(value)}
                    name="atlas-pdf-template-ace-editor"
                    editorProps={{ $blockScrolling: true }}
                    setOptions={{
                      useWorker: false,
                      showPrintMargin: false,
                      tabSize: 2,
                      enableBasicAutocompletion: true,
                      enableLiveAutocompletion: true,
                      enableSnippets: true,
                    }}
                  />
                  <Input.TextArea
                    ref={textareaRef}
                    className="atlas-services-input atlas-pdf-template-textarea atlas-pdf-template-textarea-fallback"
                    rows={isFullscreen ? 28 : 18}
                    placeholder="<html>...</html>"
                    value={templateHtml}
                    onChange={(event) => onChangeHtml(event.target.value)}
                  />
                </div>
              ),
            },
            {
              key: 'preview',
              label: 'Prévia',
              children: previewHtml ? (
                <iframe
                  className="atlas-pdf-template-preview"
                  title="Prévia do template"
                  sandbox=""
                  srcDoc={previewHtml}
                />
              ) : (
                <div className="atlas-pdf-template-empty">
                  <Text type="secondary">Escreva/cole um HTML para ver a prévia.</Text>
                </div>
              ),
            },
            ...(placeholders.length
              ? [
                  {
                    key: 'placeholders',
                    label: 'Placeholders',
                    children: (
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        <Text type="secondary">
                          Clique para inserir no cursor. Use o ícone para copiar.
                        </Text>

                        <div className="atlas-pdf-template-placeholders">
                          {placeholders.map((item) => {
                            const token = `{{${item.key}}}`;
                            const label = item.label ? `${item.label} ` : '';
                            return (
                              <div key={item.key} className="atlas-pdf-template-placeholder">
                                <Button
                                  size="small"
                                  className="atlas-services-button"
                                  onClick={() => insertAtCursor(token)}
                                >
                                  {token}
                                </Button>
                                <Tooltip title="Copiar">
                                  <Button
                                    size="small"
                                    className="atlas-services-button"
                                    icon={<CopyOutlined />}
                                    onClick={() => void copyToClipboard(token)}
                                  />
                                </Tooltip>
                                <div className="atlas-pdf-template-placeholder-meta">
                                  <Text strong>{label}{item.key}</Text>
                                  {item.description ? (
                                    <Text type="secondary">{item.description}</Text>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Space>
                    ),
                  } as const,
                ]
              : []),
          ]}
        />
      </Space>
    </div>
  );

  const headerTitle = (
    <Space size={10} align="center">
      <span>{title}</span>
      {isDirty ? <Tag color="gold">Alterações pendentes</Tag> : null}
    </Space>
  );

  if (variant === 'drawer') {
    return (
      <Drawer
        open={open}
        onClose={handleCancel}
        placement="right"
        title={headerTitle}
        width={isFullscreen ? '100vw' : 920}
        className="atlas-services-drawer atlas-pdf-template-drawer"
        mask
        maskStyle={{ background: 'rgba(15, 23, 42, 0.35)' }}
        extra={null}
        footer={(
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} size={8} wrap>
            <Button className="atlas-services-button" onClick={handleCancel}>
              {cancelText}
            </Button>
            <Button
              className="atlas-services-button atlas-services-button-primary"
              type="primary"
              onClick={() => void onSave()}
              loading={confirmLoading}
              disabled={!templateHtml.trim()}
            >
              {okText}
            </Button>
          </Space>
        )}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      onOk={onSave}
      okText={okText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
      title={headerTitle}
      width={isFullscreen ? '100vw' : 980}
      centered={!isFullscreen}
      className="atlas-services-modal"
      wrapClassName={isFullscreen ? 'atlas-pdf-template-modal-fullscreen' : undefined}
      okButtonProps={{ className: 'atlas-services-button atlas-services-button-primary', disabled: !templateHtml.trim() }}
      cancelButtonProps={{ className: 'atlas-services-button' }}
    >
      {content}
    </Modal>
  );
};
