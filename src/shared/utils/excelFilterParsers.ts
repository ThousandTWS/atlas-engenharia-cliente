export type ExcelNumberRange = {
  min: number | null;
  max: number | null;
  onlyPositive: boolean;
};

const NUMBER_RANGE_PREFIX = 'range:';

export const parseExcelNumberRange = (value: string): ExcelNumberRange | null => {
  if (!value.startsWith(NUMBER_RANGE_PREFIX)) return null;
  const body = value.slice(NUMBER_RANGE_PREFIX.length);
  const [minRaw, maxRaw, posRaw] = body.split(':');
  const min = minRaw ? Number(minRaw) : null;
  const max = maxRaw ? Number(maxRaw) : null;
  const onlyPositive = posRaw === '1';

  return {
    min: Number.isFinite(min as number) ? (min as number) : null,
    max: Number.isFinite(max as number) ? (max as number) : null,
    onlyPositive,
  };
};

