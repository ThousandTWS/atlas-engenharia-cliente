import React, { useCallback, useEffect, useRef, useState } from 'react';
import { App, Avatar, Button, Card, Input, Space, Typography } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { AdsChatContextSnapshot } from '../services/adsDashboardFacade';
import { adsDashboardFacade } from '../services/adsDashboardFacade';
import { sendGeminiMessage, type GeminiChatMessage } from '../services/geminiChatService';
import { useLayout } from '../../../shared/components/layout/LayoutContext';
import { useNotificationCenter } from '../../../core/notifications/NotificationCenterContext';

const { Text } = Typography;

const friendlyErrorMessage = (error: unknown) => {
  const rawMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  if (rawMessage.includes('VITE_GEMINI_API_KEY')) {
    return 'Integração Gemini indisponível. Configure a chave Gemini ou endpoint de chat no n8n.';
  }

  return rawMessage;
};

export const GeminiChatCard: React.FC = () => {
  const { message } = App.useApp();
  const { isDarkMode } = useLayout();
  const { open } = useNotificationCenter();
  const streamRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<GeminiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [sending, setSending] = useState(false);
  const [context, setContext] = useState<AdsChatContextSnapshot>({
    campaigns: [],
    performance: [],
  });

  const loadContext = useCallback(async () => {
    setLoadingContext(true);
    try {
      const snapshot = await adsDashboardFacade.getChatContext('30d');
      setContext(snapshot);
    } catch (error) {
      console.error('GeminiChat: falha ao carregar contexto', error);
      message.error('Não foi possível carregar o contexto do chat.');
    } finally {
      setLoadingContext(false);
    }
  }, [message]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  useEffect(() => {
    const container = streamRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sending]);

  const sendPrompt = useCallback(async (prompt: string) => {
    const sanitized = prompt.trim();
    if (!sanitized || sending) {
      return;
    }

    const nextMessages = [...messages, { role: 'user' as const, content: sanitized }];
    setMessages(nextMessages);
    setInputValue('');
    setSending(true);

    try {
      const answer = await sendGeminiMessage({
        prompt: sanitized,
        history: nextMessages.slice(-12),
        context,
      });

      setMessages((current) => [...current, { role: 'assistant', content: answer }]);
      open({
        title: 'Resposta Gemini recebida',
        description: 'Chat IA processou sua pergunta.',
        type: 'success',
        showToast: false,
      });
    } catch (error) {
      const errorMessage = friendlyErrorMessage(error);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: `Não consegui responder agora. ${errorMessage}` },
      ]);
      message.error('Falha ao consultar Gemini.');
    } finally {
      setSending(false);
    }
  }, [context, message, messages, open, sending]);

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: isDarkMode ? '0 14px 36px #00000033' : '0 12px 30px #0F172A12',
        background: isDarkMode ? 'linear-gradient(145deg, #091225 0%, #0F172A 100%)' : '#fff',
        border: `1px solid ${isDarkMode ? '#253452' : '#DCE6F3'}`,
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: 16 }}>
        {messages.length > 0 && (
          <div
            ref={streamRef}
            style={{
              border: `1px solid ${isDarkMode ? '#2A3A5C' : '#E2E8F0'}`,
              borderRadius: 12,
              height: 420,
              overflowY: 'auto',
              padding: 12,
              background: isDarkMode ? '#071022' : '#F8FAFC',
              marginBottom: 12,
            }}
          >
            <Space orientation="vertical" size={10} style={{ width: '100%' }}>
              {messages.map((item, index) => {
                const isUser = item.role === 'user';

                return (
                  <div
                    key={`${item.role}-${index}`}
                    style={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '88%',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-start',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                      }}
                    >
                      <Avatar
                        size="small"
                        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                        style={{
                          background: isUser ? '#64748B' : '#4285F4',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <Text style={{ fontSize: 11, color: isDarkMode ? '#8EA5C7' : '#64748B' }}>
                          {isUser ? 'Você' : 'Gemini'}
                        </Text>
                        <div
                          style={{
                            marginTop: 2,
                            borderRadius: 12,
                            padding: '10px 12px',
                            border: `1px solid ${isUser
                              ? (isDarkMode ? '#2E3D63' : '#CBD5E1')
                              : (isDarkMode ? '#28436F' : '#C8DBFF')}`,
                            background: isUser
                              ? (isDarkMode ? '#141F35' : '#E9EEF7')
                              : (isDarkMode ? '#0D1B33' : '#EEF4FF'),
                          }}
                        >
                          <Text style={{ whiteSpace: 'pre-wrap' }}>{item.content}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Space>
          </div>
        )}

        <div
          style={{
            border: `1px solid ${isDarkMode ? '#2A3A5C' : '#CBD5E1'}`,
            borderRadius: 12,
            background: isDarkMode ? '#111B31' : '#FFFFFF',
            padding: 10,
          }}
        >
          <Input.TextArea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Pergunte sobre orçamento, conversão, testes A/B, segmentação e otimização de campanha..."
            autoSize={{ minRows: 3, maxRows: 6 }}
            disabled={sending || loadingContext}
            className="prevent-form-input"
            style={{ border: 'none', boxShadow: 'none' }}
            onPressEnter={(event) => {
              if (!event.shiftKey) {
                event.preventDefault();
                void sendPrompt(inputValue);
              }
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Enter envia • Shift + Enter quebra linha
            </Text>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => sendPrompt(inputValue)}
              loading={sending}
              disabled={loadingContext}
            >
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
