import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Drawer,
  Input,
  Space,
  Tabs,
  Tag,
  Typography,
  Divider,
} from "antd";
import {
  AudioOutlined,
  CompassOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  FileImageOutlined,
  GoogleOutlined,
  LoadingOutlined,
  MessageOutlined,
  PictureOutlined,
  RadarChartOutlined,
  SearchOutlined,
  SendOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../../../shared/components/layout/LayoutContext";
import { useGlobalAiDrawer } from "../context/GlobalAiDrawerContext";
import {
  sendGlobalAiMessage,
  type GlobalAiMessage,
} from "../services/globalAiService";
import { useNotificationCenter } from "../../../core/notifications/NotificationCenterContext";

const { Text, Title } = Typography;

interface AiCapabilityItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "enabled" | "preview";
}

const CAPABILITIES: AiCapabilityItem[] = [
  {
    id: "nano-banana-edit",
    title: "Nano banana powered app",
    description:
      "Edição de fotos por texto: adicionar objetos, remover fundo e trocar estilo.",
    icon: <PictureOutlined />,
    status: "preview",
  },
  {
    id: "voice-conversation",
    title: "Create conversational voice apps",
    description:
      "Experiências conversacionais com voz usando APIs de Live Audio.",
    icon: <AudioOutlined />,
    status: "preview",
  },
  {
    id: "veo-image-animation",
    title: "Animate images with Veo",
    description:
      "Anime imagens para criar anúncios dinâmicos e conteúdo audiovisual.",
    icon: <VideoCameraOutlined />,
    status: "enabled",
  },
  {
    id: "google-search-live",
    title: "Use Google Search data",
    description:
      "Contexto com dados atuais de busca para fatos, notícias e validação.",
    icon: <SearchOutlined />,
    status: "preview",
  },
  {
    id: "google-maps-live",
    title: "Use Google Maps data",
    description: "Integração com locais, rotas e direções em tempo real.",
    icon: <EnvironmentOutlined />,
    status: "preview",
  },
  {
    id: "nano-banana-pro",
    title: "Generate images with Nano Banana Pro",
    description:
      "Geração de imagens de alta qualidade para assets e peças visuais.",
    icon: <FileImageOutlined />,
    status: "preview",
  },
  {
    id: "gemini-intelligence",
    title: "Gemini intelligence in your app",
    description:
      "Análise, edição, síntese e execução de tarefas inteligentes no app.",
    icon: <GoogleOutlined />,
    status: "enabled",
  },
  {
    id: "context-aware-chatbot",
    title: "AI powered chatbot",
    description:
      "Chat contextual com memória de conversa para suporte e operação.",
    icon: <MessageOutlined />,
    status: "enabled",
  },
  {
    id: "prompt-video-generation",
    title: "Prompt based video generation",
    description: "Transforme briefings e descrições em vídeos curtos.",
    icon: <VideoCameraOutlined />,
    status: "preview",
  },
  {
    id: "aspect-ratio-control",
    title: "Control image aspect ratios",
    description:
      "Controle de formatos para assets verticais, horizontais e quadrados.",
    icon: <CompassOutlined />,
    status: "preview",
  },
  {
    id: "image-understanding",
    title: "Analyze images",
    description:
      "Leitura de imagens para extração de dados, tradução e resumo.",
    icon: <FileImageOutlined />,
    status: "enabled",
  },
  {
    id: "flash-lite",
    title: "Fast AI responses",
    description: "Respostas em tempo real para autocomplete e agentes rápidos.",
    icon: <ThunderboltOutlined />,
    status: "enabled",
  },
  {
    id: "video-understanding",
    title: "Video understanding",
    description: "Resumo de vídeos longos com highlights e momentos-chave.",
    icon: <VideoCameraOutlined />,
    status: "preview",
  },
  {
    id: "audio-transcription",
    title: "Transcribe audio",
    description: "Transcrição de áudio em tempo real para operação e suporte.",
    icon: <AudioOutlined />,
    status: "preview",
  },
  {
    id: "thinking-mode",
    title: "Think more when needed",
    description: "Modo de raciocínio estendido para consultas complexas.",
    icon: <RadarChartOutlined />,
    status: "enabled",
  },
  {
    id: "text-to-speech",
    title: "Generate speech",
    description:
      "Síntese de voz para leitura de conteúdo e assistentes por áudio.",
    icon: <AudioOutlined />,
    status: "preview",
  },
];

const QUICK_PROMPTS = [
  "Crie um plano de automação IA para meu app com prioridade de entrega.",
  "Como usar Search + Maps para um agente corporativo?",
  "Me dê um roadmap de multimodal (imagem, vídeo e voz).",
];

const INITIAL_MESSAGE: GlobalAiMessage = {
  role: "assistant",
  content:
    "Sou o Atlas AI global. Posso te ajudar com chat, imagem, vídeo, voz, Google Search, Google Maps e automações.",
};

const mapErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Erro desconhecido";
  if (message.includes("VITE_GEMINI_API_KEY")) {
    return "Integração Gemini não configurada. Defina VITE_GEMINI_API_KEY ou endpoint de chat no n8n.";
  }

  return message;
};

export const GlobalAiAssistantDrawer: React.FC = () => {
  const { isDarkMode, isMobile } = useLayout();
  const { unreadCount } = useNotificationCenter();
  const { isOpen, closeDrawer } = useGlobalAiDrawer();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<GlobalAiMessage[]>([
    INITIAL_MESSAGE,
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const streamRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = streamRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const globalContext = useMemo(
    () => ({
      route: location.pathname,
      timestamp: new Date().toISOString(),
      unreadNotifications: unreadCount,
      capabilitiesEnabled: CAPABILITIES.filter(
        (item) => item.status === "enabled",
      ).map((item) => item.title),
    }),
    [location.pathname, unreadCount],
  );

  const sendPrompt = async (prompt: string) => {
    const sanitized = prompt.trim();
    if (!sanitized || sending) {
      return;
    }

    const nextHistory = [
      ...messages,
      { role: "user" as const, content: sanitized },
    ];
    setMessages(nextHistory);
    setInputValue("");
    setSending(true);

    try {
      const answer = await sendGlobalAiMessage({
        prompt: sanitized,
        history: nextHistory.slice(-16),
        context: globalContext,
      });

      setMessages((current) => [
        ...current,
        { role: "assistant", content: answer },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Falha no processamento. ${mapErrorMessage(error)}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const clearConversation = () => {
    setMessages([INITIAL_MESSAGE]);
    setInputValue("");
  };

  const modelLabel = useMemo(() => {
    const rawModel = (
      import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash"
    ).trim();
    return rawModel
      .replace(/^gemini/i, "Gemini")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  return (
    <Drawer
      title={
        <Space align="center">
          <Avatar
            icon={<GoogleOutlined />}
            style={{ background: "#EAF1FF", color: "#4285F4" }}
          />
          <div>
            <Text
              style={{
                fontSize: 12,
                color: isDarkMode ? "#9EB3D3" : "#64748B",
              }}
            >
              Supercharge your apps with AI
            </Text>
            <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
              Atlas AI Global
            </Title>
          </div>
        </Space>
      }
      open={isOpen}
      onClose={closeDrawer}
      width={isMobile ? "100%" : 560}
      extra={
        <Tag
          className="atlas-status-badge atlas-status-badge-info"
          bordered={false}
        >
          <span className="atlas-status-badge-dot" />
          {modelLabel}
        </Tag>
      }
      styles={{
        body: {
          padding: 12,
          background: isDarkMode ? "#0A0F1C" : "#F8FAFC",
        },
        header: {
          background: isDarkMode ? "#0F172A" : "#FFFFFF",
          borderBottom: `1px solid ${isDarkMode ? "#253452" : "#E2E8F0"}`,
        },
      }}
    >
      <Tabs
        defaultActiveKey="chat"
        items={[
          {
            key: "chat",
            label: "Chat",
            children: (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Space wrap>
                  {QUICK_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      size="small"
                      className="ads-refresh-button"
                      onClick={() => sendPrompt(prompt)}
                      disabled={sending}
                    >
                      {prompt}
                    </Button>
                  ))}
                </Space>

                <div
                  ref={streamRef}
                  style={{
                    height: 360,
                    overflowY: "auto",
                    border: `1px solid ${isDarkMode ? "#253452" : "#E2E8F0"}`,
                    borderRadius: 12,
                    background: isDarkMode ? "#071022" : "#FFFFFF",
                    padding: 12,
                  }}
                >
                  <Space
                    direction="vertical"
                    size={10}
                    style={{ width: "100%" }}
                  >
                    {messages.map((item, index) => {
                      const isUser = item.role === "user";

                      return (
                        <div
                          key={`${item.role}-${index}`}
                          style={{
                            display: "flex",
                            justifyContent: isUser ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "90%",
                              display: "flex",
                              gap: 8,
                              flexDirection: isUser ? "row-reverse" : "row",
                              alignItems: "flex-start",
                            }}
                          >
                            <Avatar
                              size="small"
                              icon={
                                isUser ? <UserOutlined /> : <GoogleOutlined />
                              }
                              style={{
                                background: isUser ? "#64748B" : "#4285F4",
                              }}
                            />
                            <div>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: isDarkMode ? "#8EA5C7" : "#64748B",
                                }}
                              >
                                {isUser ? "Você" : "Atlas AI"}
                              </Text>
                              <div
                                style={{
                                  marginTop: 2,
                                  borderRadius: 12,
                                  padding: "10px 12px",
                                  border: `1px solid ${
                                    isUser
                                      ? isDarkMode
                                        ? "#2E3D63"
                                        : "#CBD5E1"
                                      : isDarkMode
                                        ? "#28436F"
                                        : "#C8DBFF"
                                  }`,
                                  background: isUser
                                    ? isDarkMode
                                      ? "#141F35"
                                      : "#E9EEF7"
                                    : isDarkMode
                                      ? "#0D1B33"
                                      : "#EEF4FF",
                                }}
                              >
                                <Text style={{ whiteSpace: "pre-wrap" }}>
                                  {item.content}
                                </Text>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {sending && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-start",
                        }}
                      >
                        <Space size={8}>
                          <Avatar
                            size="small"
                            icon={<GoogleOutlined />}
                            style={{ background: "#4285F4" }}
                          />
                          <div
                            style={{
                              borderRadius: 12,
                              padding: "8px 12px",
                              border: `1px solid ${isDarkMode ? "#28436F" : "#C8DBFF"}`,
                              background: isDarkMode ? "#0D1B33" : "#EEF4FF",
                            }}
                          >
                            <Space size={6}>
                              <LoadingOutlined />
                              <Text>Analisando...</Text>
                            </Space>
                          </div>
                        </Space>
                      </div>
                    )}
                  </Space>
                </div>

                <div
                  style={{
                    border: `1px solid ${isDarkMode ? "#2A3A5C" : "#CBD5E1"}`,
                    borderRadius: 12,
                    background: isDarkMode ? "#111B31" : "#FFFFFF",
                    padding: 10,
                  }}
                >
                  <Input.TextArea
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="Peça análises, plano de IA, automações e próximos passos..."
                    disabled={sending}
                    className="atlas-form-input"
                    style={{ border: "none", boxShadow: "none" }}
                    onPressEnter={(event) => {
                      if (!event.shiftKey) {
                        event.preventDefault();
                        void sendPrompt(inputValue);
                      }
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 8,
                    }}
                  >
                    <Space size={8}>
                      <Button
                        className="ads-refresh-button"
                        icon={<DeleteOutlined />}
                        onClick={clearConversation}
                      >
                        Limpar
                      </Button>
                      <Button
                        className="ads-refresh-button"
                        icon={<MessageOutlined />}
                        onClick={() => navigate("/gestao-ads/chat")}
                      >
                        Abrir tela completa
                      </Button>
                    </Space>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={() => sendPrompt(inputValue)}
                      loading={sending}
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
              </Space>
            ),
          },
          {
            key: "capabilities",
            label: "Capacidades",
            children: (
              <div
                style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}
              >
                <Text type="secondary">
                  Stack global de recursos multimodais para incorporar IA em
                  qualquer módulo.
                </Text>
                <Divider style={{ margin: "12px 0" }} />
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  {CAPABILITIES.map((capability) => (
                    <Card
                      key={capability.id}
                      size="small"
                      style={{
                        borderRadius: 12,
                        border: `1px solid ${isDarkMode ? "#2A3A5C" : "#E2E8F0"}`,
                        background: isDarkMode ? "#0F172A" : "#FFFFFF",
                      }}
                      styles={{ body: { padding: 12 } }}
                    >
                      <div style={{ display: "flex", gap: 10 }}>
                        <Avatar
                          size="small"
                          icon={capability.icon}
                          style={{
                            background: isDarkMode ? "#13233C" : "#EAF1FF",
                            color: "#4285F4",
                            marginTop: 2,
                          }}
                        />
                        <div style={{ width: "100%" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <Text strong>{capability.title}</Text>
                            <Tag
                              bordered={false}
                              className={`atlas-status-badge ${
                                capability.status === "enabled"
                                  ? "atlas-status-badge-success"
                                  : "atlas-status-badge-info"
                              }`}
                            >
                              <span className="atlas-status-badge-dot" />
                              {capability.status === "enabled"
                                ? "Ativo"
                                : "Preview"}
                            </Tag>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {capability.description}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};
