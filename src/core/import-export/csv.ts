export type CsvPrimitive = string | number | boolean | null | undefined | Date;
export type CsvRecord = Record<string, CsvPrimitive>;

const normalizeValue = (value: CsvPrimitive): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
};

const escapeCsvValue = (value: CsvPrimitive): string => {
  const rawValue = normalizeValue(value);
  if (/["\n,;]/.test(rawValue)) {
    return `"${rawValue.replace(/"/g, '""')}"`;
  }
  return rawValue;
};

export const buildCsv = (rows: CsvRecord[], columns?: string[]): string => {
  if (!rows.length) {
    const headers = columns ?? [];
    return headers.join(',');
  }

  const headers = columns && columns.length > 0
    ? columns
    : Object.keys(rows[0]);

  const lines = [headers.map((header) => escapeCsvValue(header)).join(',')];

  rows.forEach((row) => {
    const line = headers.map((header) => escapeCsvValue(row[header])).join(',');
    lines.push(line);
  });

  return lines.join('\n');
};

export const downloadCsv = (csv: string, filename: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

export const parseCsvToRecords = (csvText: string): Record<string, string>[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = values[index] ?? '';
      return accumulator;
    }, {});
  });
};

export const toNumber = (value: string) => {
  const cleaned = value.replace(/[^\d,.-]/g, '');
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
