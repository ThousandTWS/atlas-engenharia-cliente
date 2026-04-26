import type { NotificationItem } from "./NotificationCenterContext";
import type { NotificationRulePreview } from "./types";

const addDays = (baseDate: Date, amount: number) => {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate.toISOString();
};

export const notificationRuleCatalog = [
  {
    id: "finance-installment-due",
    category: "financial" as const,
    label: "Parcela a vencer",
    description:
      "Gera alerta quando uma parcela estiver próxima do vencimento.",
  },
  {
    id: "technical-service-stalled",
    category: "technical" as const,
    label: "Serviço parado",
    description:
      "Gera alerta quando um serviço ficar sem atualização por X dias.",
  },
];

const buildPreviewRules = (): NotificationRulePreview[] => {
  const now = new Date();

  return [
    {
      id: "finance-installment-due",
      category: "financial",
      type: "warning",
      title: "Parcela do fornecedor vence em 3 dias",
      description:
        "Regra automática de demonstração para parcelas próximas do vencimento.",
      timestamp: addDays(now, 3),
    },
    {
      id: "technical-service-stalled",
      category: "technical",
      type: "error",
      title: "Serviço de vistoria está sem movimentação há 7 dias",
      description:
        "Regra automática de demonstração para serviços parados além do limite.",
      timestamp: now.toISOString(),
    },
  ];
};

export const buildAutomaticNotifications = (): NotificationItem[] =>
  buildPreviewRules().map((rule) => ({
    id: `auto-${rule.id}`,
    title: rule.title,
    description: rule.description,
    timestamp: rule.timestamp,
    type: rule.type,
    category: rule.category,
    origin: "automatic",
    ruleId: rule.id,
    read: false,
    confirmedAt: undefined,
    source: "client",
  }));
