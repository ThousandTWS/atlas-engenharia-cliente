const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const formatCepBR = (raw: string): string => {
  const digits = onlyDigits(String(raw || '')).slice(0, 8);
  if (!digits) return '';
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const formatPhoneBR = (raw: string): string => {
  const digits = onlyDigits(String(raw || ''));
  if (!digits) return '';

  const ddd = digits.slice(0, 2);
  const body = digits.slice(2, 11);

  if (digits.length <= 2) {
    return `(${ddd}`;
  }

  if (digits.length <= 6) {
    return `(${ddd}) ${body}`;
  }

  const isMobile = body.length >= 9;
  const firstPartLength = isMobile ? 5 : 4;
  const first = body.slice(0, firstPartLength);
  const last = body.slice(firstPartLength, firstPartLength + 4);

  if (!last) {
    return `(${ddd}) ${first}`;
  }

  return `(${ddd}) ${first}-${last}`;
};

export const formatCpfCnpjBR = (raw: string): string => {
  const digits = onlyDigits(String(raw || ''));
  if (!digits) return '';

  const limited = digits.slice(0, 14);

  if (limited.length <= 11) {
    // CPF: 000.000.000-00
    const p1 = limited.slice(0, 3);
    const p2 = limited.slice(3, 6);
    const p3 = limited.slice(6, 9);
    const p4 = limited.slice(9, 11);

    if (limited.length <= 3) return p1;
    if (limited.length <= 6) return `${p1}.${p2}`;
    if (limited.length <= 9) return `${p1}.${p2}.${p3}`;
    return `${p1}.${p2}.${p3}-${p4}`;
  }

  // CNPJ: 00.000.000/0000-00
  const p1 = limited.slice(0, 2);
  const p2 = limited.slice(2, 5);
  const p3 = limited.slice(5, 8);
  const p4 = limited.slice(8, 12);
  const p5 = limited.slice(12, 14);

  if (limited.length <= 2) return p1;
  if (limited.length <= 5) return `${p1}.${p2}`;
  if (limited.length <= 8) return `${p1}.${p2}.${p3}`;
  if (limited.length <= 12) return `${p1}.${p2}.${p3}/${p4}`;
  return `${p1}.${p2}.${p3}/${p4}-${p5}`;
};

export const normalizePhoneBR = (value: unknown) => formatPhoneBR(String(value ?? ''));
export const normalizeCpfCnpjBR = (value: unknown) => formatCpfCnpjBR(String(value ?? ''));
export const normalizeCepBR = (value: unknown) => formatCepBR(String(value ?? ''));
