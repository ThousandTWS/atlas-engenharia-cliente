import apiClient from '../../../core/api/apiClient';

export interface DashboardValueByType {
  tipo: string;
  valor: number;
}

export interface DashboardValueBySituation {
  situacao: string;
  quantidade: number;
}

export interface DashboardValueByProvider {
  prestador: string;
  valor: number;
}

export interface DashboardDurationBySituation {
  situacao: string;
  dias: number;
}

export interface DashboardForecastPoint {
  periodo: string;
  dataReferencia: string;
  valor: number;
}

export interface DashboardSummary {
  dataInicial: string;
  dataFinal: string;
  financeiro: {
    receitaContratada: number;
    totalRecebido: number;
    aReceberEmAberto: number;
    custosDiretos: number;
    custosIndiretos: number;
    custosFixos: number;
    custosTotais: number;
    lucroLiquidoEstimado: number;
    margemPercentual: number;
  };
  carteira: {
    servicosAtivos: number;
    novosServicosNoPeriodo: number;
    concluidosNoPeriodo: number;
    canceladosNoPeriodo: number;
    taxaCancelamentoPercentual: number;
    servicosPorSituacao: DashboardValueBySituation[];
    ticketMedioPorTipo: DashboardValueByType[];
  };
  contasReceber: {
    parcelasAVencerEm7Dias: number;
    parcelasAVencerEm30Dias: number;
    parcelasEmAtraso: number;
    previsaoCaixa60Dias: DashboardForecastPoint[];
  };
  prestadores: {
    custosDiretosPeriodo: number;
    custosIndiretosPeriodo: number;
    aPagarPorPrestador: DashboardValueByProvider[];
    topPrestadoresPorCusto: DashboardValueByProvider[];
  };
  operacional: {
    tempoMedioConclusaoPorTipo: DashboardValueByType[];
    tempoMedioPorSituacao: DashboardDurationBySituation[];
    etapasComMaiorGargalo: DashboardDurationBySituation[];
    servicosParadosHaMaisDe30Dias: number;
  };
}

class ExecutiveDashboardService {
  private readonly primaryTimeoutMs = 45000;
  private readonly retryTimeoutMs = 90000;

  private isTimeoutError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error || '');
    return message.toLowerCase().includes('timeout');
  }

  async getSummary(dataInicial: string, dataFinal: string): Promise<DashboardSummary> {
    try {
      const response = await apiClient.get<DashboardSummary>('/dashboard/resumo', {
        params: { dataInicial, dataFinal },
        timeout: this.primaryTimeoutMs,
      });
      return response.data;
    } catch (error: unknown) {
      if (!this.isTimeoutError(error)) {
        throw error;
      }

      const retryResponse = await apiClient.get<DashboardSummary>('/dashboard/resumo', {
        params: { dataInicial, dataFinal },
        timeout: this.retryTimeoutMs,
      });
      return retryResponse.data;
    }
  }
}

export const executiveDashboardService = new ExecutiveDashboardService();
