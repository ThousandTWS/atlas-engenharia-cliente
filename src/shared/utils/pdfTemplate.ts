const escapeHtml = (value: string) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const renderPdfTemplate = (templateHtml: string, variables: Record<string, string>) => {
  let html = String(templateHtml || '');
  Object.entries(variables).forEach(([key, raw]) => {
    const value = raw ?? '';
    html = html.replaceAll(`{{${key}}}`, value);
  });

  // Replace missing placeholders with empty string (best-effort)
  html = html.replace(/{{\s*[\w.-]+\s*}}/g, '');
  return html;
};

export const toSafeTextVar = (value: unknown) => escapeHtml(String(value ?? ''));

