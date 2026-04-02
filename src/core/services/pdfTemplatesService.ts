import apiClient from '../api/apiClient';

export interface PdfTemplateRecord {
  id: number;
  key: string;
  name: string;
  html: string;
  updatedAt?: string;
}

export const pdfTemplatesService = {
  async getByKey(key: string) {
    const response = await apiClient.get<PdfTemplateRecord>(`/pdf-templates/${key}`);
    return response.data;
  },

  async upsert(key: string, payload: { name: string; html: string }) {
    const response = await apiClient.put<PdfTemplateRecord>(`/pdf-templates/${key}`, {
      id: null,
      key,
      name: payload.name,
      html: payload.html,
      updatedAt: null,
    });
    return response.data;
  },
};

