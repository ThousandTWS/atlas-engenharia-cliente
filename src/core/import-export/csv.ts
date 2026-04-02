export type CsvPrimitive = string | number | boolean | null | undefined | Date;
export type CsvRecord = Record<string, CsvPrimitive>;

export type CsvDelimiter = ',' | ';';

const normalizeValue = (value: CsvPrimitive): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
};

const escapeCsvValue = (value: CsvPrimitive, delimiter: CsvDelimiter): string => {
  const rawValue = normalizeValue(value);
  const shouldEscape = rawValue.includes('"') || rawValue.includes('\n') || rawValue.includes(delimiter);
  if (shouldEscape) {
    return `"${rawValue.replace(/"/g, '""')}"`;
  }
  return rawValue;
};

export const buildCsv = (
  rows: CsvRecord[],
  columns?: string[],
  options?: { delimiter?: CsvDelimiter; includeBom?: boolean },
): string => {
  const delimiter = options?.delimiter ?? ';';
  if (!rows.length) {
    const headers = columns ?? [];
    const content = headers.join(delimiter);
    return options?.includeBom ? `\uFEFF${content}` : content;
  }

  const headers = columns && columns.length > 0
    ? columns
    : Object.keys(rows[0]);

  const lines = [headers.map((header) => escapeCsvValue(header, delimiter)).join(delimiter)];

  rows.forEach((row) => {
    const line = headers.map((header) => escapeCsvValue(row[header], delimiter)).join(delimiter);
    lines.push(line);
  });

  const content = lines.join('\n');
  return options?.includeBom ? `\uFEFF${content}` : content;
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

const parseCsvLine = (line: string, delimiter: CsvDelimiter): string[] => {
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

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const detectDelimiter = (headerLine: string): CsvDelimiter => {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  return semicolonCount >= commaCount ? ';' : ',';
};

export const parseCsvToRecords = (csvText: string): Record<string, string>[] => {
  const text = csvText.replace(/^\uFEFF/, '');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
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
