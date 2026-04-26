import type { CepLookupResult } from "./types";


const onlyDigits = (value: string) => String(value || '').replace(/\D/g, '');

export const cepService = {
  async lookup(rawCep: string): Promise<CepLookupResult | null> {
    const cep = onlyDigits(rawCep).slice(0, 8);
    if (cep.length !== 8) {
      return null;
    }

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Falha ao consultar CEP.');
    }

    const data = await response.json() as any;
    if (data?.erro) {
      return null;
    }

    return {
      cep: data.cep || '',
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  },
};
