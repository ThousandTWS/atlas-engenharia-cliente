import apiClient from '../../core/api/apiClient';
import type { PaginatedResponse } from '../../core/services/genericService';
import { formatCpfCnpjBR, formatPhoneBR } from '../../shared/utils/inputFormat';

export type ServiceKind = 'AVCB' | 'CLCB' | 'OBRAS' | 'PROCESSOS_ADM';
export type SubtypeConfig = Record<ServiceKind, string[]>;

export interface BudgetRecord {
  id: number;
  code: string;
  phone: string;
  serviceType: ServiceKind;
  totalValue: number;
  createdAt: string;
}

export interface ProviderRecord {
  id: number;
  name: string;
  document: string;
  phone: string;
  email: string;
  paymentMethod: string;
  paymentCondition?: string;
  pixKey: string;
  bank: string;
  agency: string;
  account: string;
  createdAt: string;
}

export interface PaymentConditionRecord {
  id: number;
  label: string;
  installments: number;
}

export interface PaymentInstallment {
  id?: number;
  number: number;
  value: number;
  date: string;
  method: string;
}

export interface LinkedProviderRecord {
  id?: number;
  providerId?: number;
  providerName: string;
  provisionedValue: number;
  effectiveValue?: number;
  confirmed?: boolean;
}

export interface ServiceRegistrationRecord {
  id: number;
  code: string;
  clientId?: number | null;
  serviceType: ServiceKind;
  subtype: string;
  linkedBudgetId?: number | null;
  linkedBudgetCode?: string | null;
  entryDate: string;
  initialSituation: string;
  companyDocument: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  companyAddress: string;
  serviceAddress: string;
  sameAddressAsCompany: boolean;
  contractValue: number;
  contractDate: string;
  paymentConditionId?: number | null;
  paymentConditionLabel: string;
  invoiceValue?: number;
  installments: PaymentInstallment[];
  providers: LinkedProviderRecord[];
  createdAt: string;
}

interface ServiceSubtypeConfigDto {
  tipoServico: ServiceKind;
  subtipos: string[];
}

const emptySubtypeConfig = (): SubtypeConfig => ({
  AVCB: [],
  CLCB: [],
  OBRAS: [],
  PROCESSOS_ADM: [],
});

const mapBudget = (item: any): BudgetRecord => ({
  id: item.id,
  code: item.codigo,
  phone: formatPhoneBR(item.telefone || ''),
  serviceType: item.tipoServico,
  totalValue: Number(item.valorTotal || 0),
  createdAt: item.createdAt,
});

const mapProvider = (item: any): ProviderRecord => ({
  id: item.id,
  name: item.nome || '',
  document: formatCpfCnpjBR(item.cnpjCpf || ''),
  phone: formatPhoneBR(item.telefone || ''),
  email: item.email || '',
  paymentMethod: item.metodoPagamento || '',
  paymentCondition: item.condicaoPagamento || '',
  pixKey: item.chavePix || '',
  bank: item.banco || '',
  agency: item.agencia || '',
  account: item.conta || '',
  createdAt: item.createdAt,
});

const mapPaymentCondition = (item: any): PaymentConditionRecord => ({
  id: item.id,
  label: item.nome,
  installments: item.quantidadeParcelas,
});

const mapService = (item: any): ServiceRegistrationRecord => ({
  id: item.id,
  code: item.codigo,
  clientId: item.clienteId,
  serviceType: item.tipoServico,
  subtype: item.subtipo,
  linkedBudgetId: item.orcamentoId,
  linkedBudgetCode: item.orcamentoCodigo,
  entryDate: item.dataEntrada,
  initialSituation: item.situacaoInicial,
  companyDocument: formatCpfCnpjBR(item.documentoEmpresa || ''),
  companyName: item.razaoSocialEmpresa,
  contactName: item.contatoEmpresa || '',
  phone: formatPhoneBR(item.telefone || ''),
  email: item.email || '',
  companyAddress: item.enderecoEmpresa || '',
  serviceAddress: item.enderecoServico || '',
  sameAddressAsCompany: Boolean(item.mesmoEnderecoEmpresa),
  contractValue: Number(item.valorContrato || 0),
  contractDate: item.dataContrato,
  paymentConditionId: item.condicaoPagamentoId,
  paymentConditionLabel: item.nomeCondicaoPagamento || '',
  invoiceValue: Number(item.valorNotaFiscal || 0),
  installments: (item.parcelas || []).map((parcela: any) => ({
    id: parcela.id,
    number: parcela.numeroParcela,
    value: Number(parcela.valor || 0),
    date: parcela.dataVencimento,
    method: parcela.formaPagamento || '',
  })),
  providers: (item.prestadores || []).map((provider: any) => ({
    id: provider.id,
    providerId: provider.prestadorId,
    providerName: provider.nomePrestador || '',
    provisionedValue: Number(provider.valorProvisionado || 0),
    effectiveValue: Number(provider.valorEfetivo || 0),
    confirmed: Boolean(provider.confirmado),
  })),
  createdAt: item.createdAt,
});

export const cadastrosApi = {
  async getBudgets(params?: { codigo?: string; telefone?: string; tipoServico?: ServiceKind; size?: number; page?: number }) {
    const response = await apiClient.get<PaginatedResponse<any>>('/orcamentos', { params });
    return {
      ...response.data,
      content: response.data.content.map(mapBudget),
    };
  },

  async saveBudget(item: Partial<BudgetRecord> & Pick<BudgetRecord, 'phone' | 'serviceType' | 'totalValue'>) {
    const payload = {
      telefone: item.phone,
      tipoServico: item.serviceType,
      valorTotal: item.totalValue,
    };
    const response = item.id
      ? await apiClient.put<any>(`/orcamentos/${item.id}`, payload)
      : await apiClient.post<any>('/orcamentos', payload);
    return mapBudget(response.data);
  },

  async getProviders(params?: { termo?: string; size?: number; page?: number }) {
    const response = await apiClient.get<PaginatedResponse<any>>('/prestadores', { params });
    return {
      ...response.data,
      content: response.data.content.map(mapProvider),
    };
  },

  async saveProvider(item: Partial<ProviderRecord>) {
    const payload: any = {
      nome: item.name,
      cnpjCpf: item.document,
      telefone: item.phone,
      email: item.email,
      metodoPagamento: item.paymentMethod,
      chavePix: item.pixKey,
      banco: item.bank,
      agencia: item.agency,
      conta: item.account,
    };

    if (item.paymentCondition?.trim()) {
      payload.condicaoPagamento = item.paymentCondition.trim();
    }
    const response = item.id
      ? await apiClient.put<any>(`/prestadores/${item.id}`, payload)
      : await apiClient.post<any>('/prestadores', payload);
    return mapProvider(response.data);
  },

  async getPaymentConditions() {
    const response = await apiClient.get<any[]>('/condicoes-pagamento');
    return response.data.map(mapPaymentCondition);
  },

  async getSubtypeConfig() {
    const response = await apiClient.get<ServiceSubtypeConfigDto[]>('/cadastro-servicos/subtipos');
    return response.data.reduce<SubtypeConfig>((acc, item) => ({
      ...acc,
      [item.tipoServico]: item.subtipos || [],
    }), emptySubtypeConfig());
  },

  async savePaymentCondition(item: Partial<PaymentConditionRecord> & Pick<PaymentConditionRecord, 'label' | 'installments'>) {
    const payload = {
      nome: item.label,
      quantidadeParcelas: item.installments,
    };
    const response = item.id
      ? await apiClient.put<any>(`/condicoes-pagamento/${item.id}`, payload)
      : await apiClient.post<any>('/condicoes-pagamento', payload);
    return mapPaymentCondition(response.data);
  },

  async getServices(params?: { codigo?: string; documentoEmpresa?: string; tipoServico?: ServiceKind; size?: number; page?: number }) {
    const response = await apiClient.get<PaginatedResponse<any>>('/cadastro-servicos', { params });
    return {
      ...response.data,
      content: response.data.content.map(mapService),
    };
  },

  async saveService(item: ServiceRegistrationRecord) {
    const payload = {
      id: item.id,
      codigo: item.code,
      clienteId: item.clientId,
      orcamentoId: item.linkedBudgetId,
      orcamentoCodigo: item.linkedBudgetCode,
      condicaoPagamentoId: item.paymentConditionId,
      tipoServico: item.serviceType,
      subtipo: item.subtype,
      dataEntrada: item.entryDate,
      situacaoInicial: item.initialSituation,
      documentoEmpresa: item.companyDocument,
      razaoSocialEmpresa: item.companyName,
      contatoEmpresa: item.contactName,
      telefone: item.phone,
      email: item.email,
      enderecoEmpresa: item.companyAddress,
      enderecoServico: item.serviceAddress,
      mesmoEnderecoEmpresa: item.sameAddressAsCompany,
      valorContrato: item.contractValue,
      dataContrato: item.contractDate,
      nomeCondicaoPagamento: item.paymentConditionLabel,
      valorNotaFiscal: item.invoiceValue,
      parcelas: item.installments.map((installment) => ({
        id: installment.id,
        numeroParcela: installment.number,
        valor: installment.value,
        dataVencimento: installment.date,
        formaPagamento: installment.method,
      })),
      prestadores: item.providers.map((provider) => ({
        id: provider.id,
        prestadorId: provider.providerId,
        nomePrestador: provider.providerName,
        valorProvisionado: provider.provisionedValue,
        valorEfetivo: provider.effectiveValue,
        confirmado: provider.confirmed,
      })),
    };

    const response = item.id
      ? await apiClient.put<any>(`/cadastro-servicos/${item.id}`, payload)
      : await apiClient.post<any>('/cadastro-servicos', payload);
    return mapService(response.data);
  },
};
