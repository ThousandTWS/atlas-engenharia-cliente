/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Input,
  Space,
  Table,
  Typography,
} from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { MenuProps } from 'antd';
import type {
  ColumnGroupType,
  ColumnType,
  ColumnsType,
  SortOrder,
  TablePaginationConfig,
} from 'antd/es/table/interface';
import type { TableProps } from 'antd';
import { FilterOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { authService } from '../../../core/services/auth/authService';
import { subscribeUserUpdated } from '../../../core/events/userObserver';
import { buildCsv, downloadCsv, type CsvRecord } from '../../../core/services/import-export/csv';

type FilterValue = React.Key[] | null;

type PersistedSorter = {
  columnKey: string;
  order: SortOrder;
} | null;

type TablePrefs = {
  hiddenColumnKeys: string[];
  columnWidths: Record<string, number>;
  filters: Record<string, React.Key[] | null>;
  sorter: PersistedSorter;
};

const DEFAULT_PREFS: TablePrefs = {
  hiddenColumnKeys: [],
  columnWidths: {},
  filters: {},
  sorter: null,
};

const safeJsonParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const getColumnKey = <T,>(column: ColumnType<T>, index: number): string => {
  const key = column.key ?? column.dataIndex;
  if (Array.isArray(key)) return key.join('.');
  if (typeof key === 'number') return String(key);
  if (typeof key === 'string' && key.trim()) return key;
  return `col_${index}`;
};

const getRecordValue = <T,>(
  record: T,
  dataIndex: ColumnType<T>['dataIndex'],
): unknown => {
  if (!dataIndex) return undefined;
  if (Array.isArray(dataIndex)) {
    let current: any = record as any;
    for (const part of dataIndex) {
      if (current == null) return undefined;
      current = current[part as any];
    }
    return current;
  }
  return (record as any)[dataIndex as any];
};

const normalizePrimitive = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

const isLikelyDate = (value: unknown): boolean => {
  if (!value) return false;
  if (value instanceof Date) return true;
  if (typeof value !== 'string') return false;
  const parsed = dayjs(value);
  return parsed.isValid() && value.length >= 8;
};

const isLikelyNumber = (value: unknown): boolean => typeof value === 'number' && Number.isFinite(value);

type ExcelFilterMode = 'list' | 'dateMonth' | 'numberRange';

type ExcelFilterConfig<T> = {
  mode: ExcelFilterMode;
  options?: { key: string; label: string }[];
  optionsLoader?: () => Promise<{ key: string; label: string }[]>;
  getValue: (record: T) => unknown;
};

type ExcelColumnExtras<T> = {
  excel?: {
    disable?: boolean;
    mode?: ExcelFilterMode;
    value?: (record: T) => unknown;
    optionsLoader?: (params: { tableId: string; columnKey: string }) => Promise<{ key: string; label: string }[]>;
  };
};

export type ExcelColumnType<T> = ColumnType<T> & ExcelColumnExtras<T>;

type ExcelColumnsType<T> = Array<ExcelColumnType<T> | ColumnGroupType<T>>;

export type ExcelLikeTableProps<T> = Omit<TableProps<T>, 'columns'> & {
  tableId: string;
  columns: ExcelColumnsType<T>;
  persistState?: boolean;
  showColumnSettings?: boolean;
  exportFilename?: string;
  showExport?: boolean;
};

const buildStorageKey = (userId: string, tableId: string) => `atlas.tablePrefs.${userId}.${tableId}`;

const useUserId = (): string => {
  const [userId, setUserId] = React.useState(() => {
    const user = authService.getCurrentUser();
    return user?.id ? String(user.id) : 'anon';
  });

  React.useEffect(() => {
    const unsubscribe = subscribeUserUpdated((user) => {
      setUserId(user?.id ? String(user.id) : 'anon');
    });
    return unsubscribe;
  }, []);

  return userId;
};

const buildFilterConfig = <T,>(
  column: ExcelColumnType<T>,
  dataSource: readonly T[],
  columnKey: string,
  tableId: string,
): ExcelFilterConfig<T> | null => {
  if (!column.dataIndex && !column.excel?.value) return null;

  const getValue = (record: T) =>
    column.excel?.value ? column.excel.value(record) : getRecordValue(record, column.dataIndex);

  const sample = dataSource.find((row) => {
    const v = getValue(row);
    return v !== undefined && v !== null && normalizePrimitive(v) !== '';
  });
  const sampleValue = sample ? getValue(sample) : undefined;

  const forcedMode = column.excel?.mode;
  if (forcedMode) {
    if (forcedMode === 'list') {
      if (column.excel?.optionsLoader) {
        return { mode: 'list', options: [], optionsLoader: () => column.excel!.optionsLoader!({ tableId, columnKey }), getValue };
      }

      const unique = new Map<string, string>();
      for (const row of dataSource) {
        const raw = getValue(row);
        const key = normalizePrimitive(raw);
        unique.set(key, key || '(vazio)');
        if (unique.size >= 500) break;
      }
      const options = Array.from(unique.entries())
        .map(([key, label]) => ({ key, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { numeric: true, sensitivity: 'base' }));
      return { mode: 'list', options, getValue };
    }

    return { mode: forcedMode, getValue };
  }

  if (isLikelyNumber(sampleValue)) {
    return { mode: 'numberRange', getValue };
  }

  if (isLikelyDate(sampleValue)) {
    if (column.excel?.optionsLoader) {
      return { mode: 'dateMonth', options: [], optionsLoader: () => column.excel!.optionsLoader!({ tableId, columnKey }), getValue };
    }

    const unique = new Map<string, string>();
    for (const row of dataSource) {
      const raw = getValue(row);
      const parsed = dayjs(raw as any);
      if (!parsed.isValid()) continue;
      const key = parsed.format('YYYY-MM');
      unique.set(key, parsed.format('MMM/YYYY'));
      if (unique.size >= 240) break;
    }
    const options = Array.from(unique.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => b.key.localeCompare(a.key));
    return { mode: 'dateMonth', options, getValue };
  }

  const unique = new Map<string, string>();
  for (const row of dataSource) {
    const raw = getValue(row);
    const key = normalizePrimitive(raw);
    unique.set(key, key || '(vazio)');
    if (unique.size >= 500) break;
  }
  const options = Array.from(unique.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { numeric: true, sensitivity: 'base' }));

  if (column.excel?.optionsLoader) {
    return { mode: 'list', options: [], optionsLoader: () => column.excel!.optionsLoader!({ tableId, columnKey }), getValue };
  }

  return { mode: 'list', options, getValue };
};

const guessSorter = <T,>(
  column: ExcelColumnType<T>,
  dataSource: readonly T[],
): ColumnType<T>['sorter'] | undefined => {
  if (!column.dataIndex && !column.excel?.value) return undefined;

  const getValue = (record: T) =>
    column.excel?.value ? column.excel.value(record) : getRecordValue(record, column.dataIndex);

  const sample = dataSource.find((row) => {
    const v = getValue(row);
    return v !== undefined && v !== null && normalizePrimitive(v) !== '';
  });
  const sampleValue = sample ? getValue(sample) : undefined;

  if (isLikelyNumber(sampleValue)) {
    return (a: T, b: T) => Number(getValue(a) || 0) - Number(getValue(b) || 0);
  }

  if (isLikelyDate(sampleValue)) {
    return (a: T, b: T) => {
      const av = dayjs(getValue(a) as any);
      const bv = dayjs(getValue(b) as any);
      return av.valueOf() - bv.valueOf();
    };
  }

  return (a: T, b: T) =>
    normalizePrimitive(getValue(a)).localeCompare(normalizePrimitive(getValue(b)), 'pt-BR', {
      numeric: true,
      sensitivity: 'base',
    });
};

type ResizableHeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  width?: number;
  columnKey?: string;
  onResizeColumn?: (key: string, nextWidth: number) => void;
};

const ResizableHeaderCell: React.FC<ResizableHeaderCellProps> = ({
  width,
  columnKey,
  onResizeColumn,
  children,
  ...rest
}) => {
  const startXRef = React.useRef<number | null>(null);
  const startWidthRef = React.useRef<number | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!columnKey || !onResizeColumn) return;
    startXRef.current = event.clientX;
    startWidthRef.current = width ?? (event.currentTarget.parentElement?.getBoundingClientRect().width ?? null);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  };

  const onPointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!columnKey || !onResizeColumn) return;
    if (startXRef.current === null || startWidthRef.current === null) return;
    const delta = event.clientX - startXRef.current;
    const nextWidth = Math.max(80, Math.round(startWidthRef.current + delta));
    onResizeColumn(columnKey, nextWidth);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLSpanElement>) => {
    startXRef.current = null;
    startWidthRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <th
      {...rest}
      className={[rest.className, columnKey ? 'atlas-excel-resizable' : undefined].filter(Boolean).join(' ')}
      style={{
        ...rest.style,
        width,
      }}
    >
      {children}
      {columnKey && onResizeColumn ? (
        <span
          className="atlas-excel-resize-handle"
          role="separator"
          aria-orientation="vertical"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      ) : null}
    </th>
  );
};

type ListFilterDropdownProps = {
  title?: React.ReactNode;
  options: { key: string; label: string }[];
  loading?: boolean;
  onRequestOptions?: () => void;
  selectedKeys: React.Key[];
  setSelectedKeys: (keys: React.Key[]) => void;
  confirm: () => void;
  clearFilters?: () => void;
  close: () => void;
  onSortAsc?: () => void;
  onSortDesc?: () => void;
};

const ListFilterDropdown: React.FC<ListFilterDropdownProps> = ({
  title,
  options,
  loading,
  onRequestOptions,
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
  close,
  onSortAsc,
  onSortDesc,
}) => {
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    onRequestOptions?.();
  }, [onRequestOptions]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = React.useMemo(
    () =>
      normalizedQuery
        ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
        : options,
    [normalizedQuery, options],
  );

  const selectedSet = React.useMemo(() => new Set(selectedKeys.map(String)), [selectedKeys]);
  const toggleAll = (event: CheckboxChangeEvent) => {
    if (event.target.checked) {
      setSelectedKeys(filteredOptions.map((option) => option.key));
    } else {
      setSelectedKeys([]);
    }
  };

  const allChecked = filteredOptions.length > 0 && filteredOptions.every((opt) => selectedSet.has(opt.key));
  const someChecked = filteredOptions.some((opt) => selectedSet.has(opt.key)) && !allChecked;

  return (
    <div style={{ padding: 12, width: 320 }}>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {title ? <Typography.Text strong>{title}</Typography.Text> : null}
        <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button size="small" onClick={onSortAsc} disabled={!onSortAsc}>
            Ordenar ↑
          </Button>
          <Button size="small" onClick={onSortDesc} disabled={!onSortDesc}>
            Ordenar ↓
          </Button>
        </Space>
        <Input
          size="small"
          placeholder="Buscar..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          allowClear
        />
        <div style={{ maxHeight: 260, overflow: 'auto', paddingRight: 4 }}>
          <Checkbox
            indeterminate={someChecked}
            checked={allChecked}
            onChange={toggleAll}
            style={{ marginBottom: 8 }}
            disabled={Boolean(loading) && filteredOptions.length === 0}
          >
            (Selecionar tudo)
          </Checkbox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {loading && options.length === 0 ? (
              <Typography.Text type="secondary">Carregando opções...</Typography.Text>
            ) : null}
            {filteredOptions.map((option) => (
              <Checkbox
                key={option.key}
                checked={selectedSet.has(option.key)}
                onChange={(event) => {
                  const next = new Set(selectedSet);
                  if (event.target.checked) next.add(option.key);
                  else next.delete(option.key);
                  setSelectedKeys(Array.from(next));
                }}
                disabled={Boolean(loading) && options.length === 0}
              >
                {option.label}
              </Checkbox>
            ))}
            {filteredOptions.length === 0 ? (
              <Typography.Text type="secondary">Nenhum valor encontrado.</Typography.Text>
            ) : null}
          </div>
        </div>
        <Divider style={{ margin: '6px 0' }} />
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            onClick={() => {
              clearFilters?.();
              setSelectedKeys([]);
              confirm();
              close();
            }}
          >
            Limpar
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => {
              confirm();
              close();
            }}
          >
            Aplicar
          </Button>
        </Space>
      </Space>
    </div>
  );
};

type NumberFilterDropdownProps = {
  title?: React.ReactNode;
  selectedKeys: React.Key[];
  setSelectedKeys: (keys: React.Key[]) => void;
  confirm: () => void;
  clearFilters?: () => void;
  close: () => void;
  onSortAsc?: () => void;
  onSortDesc?: () => void;
};

const NUMBER_RANGE_PREFIX = 'range:';

const serializeNumberRange = (min?: number | null, max?: number | null, onlyPositive?: boolean) =>
  `${NUMBER_RANGE_PREFIX}${min ?? ''}:${max ?? ''}:${onlyPositive ? '1' : ''}`;

const parseNumberRange = (value: string) => {
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

const NumberRangeFilterDropdown: React.FC<NumberFilterDropdownProps> = ({
  title,
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
  close,
  onSortAsc,
  onSortDesc,
}) => {
  const currentSerialized = selectedKeys.map(String).find((key) => key.startsWith(NUMBER_RANGE_PREFIX));
  const parsed = currentSerialized ? parseNumberRange(currentSerialized) : null;
  const [min, setMin] = React.useState<string>(parsed?.min == null ? '' : String(parsed.min));
  const [max, setMax] = React.useState<string>(parsed?.max == null ? '' : String(parsed.max));
  const [onlyPositive, setOnlyPositive] = React.useState<boolean>(Boolean(parsed?.onlyPositive));

  const apply = () => {
    const minNum = min.trim() === '' ? null : Number(min.replace(',', '.'));
    const maxNum = max.trim() === '' ? null : Number(max.replace(',', '.'));
    const serialized = serializeNumberRange(
      Number.isFinite(minNum as number) ? (minNum as number) : null,
      Number.isFinite(maxNum as number) ? (maxNum as number) : null,
      onlyPositive,
    );
    setSelectedKeys([serialized]);
    confirm();
    close();
  };

  const clear = () => {
    clearFilters?.();
    setMin('');
    setMax('');
    setOnlyPositive(false);
    setSelectedKeys([]);
    confirm();
    close();
  };

  return (
    <div style={{ padding: 12, width: 320 }}>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {title ? <Typography.Text strong>{title}</Typography.Text> : null}
        <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button size="small" onClick={onSortAsc} disabled={!onSortAsc}>
            Ordenar ↑
          </Button>
          <Button size="small" onClick={onSortDesc} disabled={!onSortDesc}>
            Ordenar ↓
          </Button>
        </Space>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input
            size="small"
            placeholder="Valor mínimo"
            value={min}
            onChange={(event) => setMin(event.target.value)}
          />
          <Input
            size="small"
            placeholder="Valor máximo"
            value={max}
            onChange={(event) => setMax(event.target.value)}
          />
          <Checkbox checked={onlyPositive} onChange={(event) => setOnlyPositive(event.target.checked)}>
            Somente maior que zero
          </Checkbox>
        </Space>
        <Divider style={{ margin: '6px 0' }} />
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button size="small" onClick={clear}>
            Limpar
          </Button>
          <Button size="small" type="primary" onClick={apply}>
            Aplicar
          </Button>
        </Space>
      </Space>
    </div>
  );
};

export function ExcelLikeTable<T extends object>({
  tableId,
  columns,
  dataSource,
  persistState = true,
  showColumnSettings = true,
  exportFilename,
  showExport = true,
  onChange,
  ...rest
}: ExcelLikeTableProps<T>) {
  const userId = useUserId();
  const storageKey = React.useMemo(() => buildStorageKey(userId, tableId), [tableId, userId]);

  const [prefs, setPrefs] = React.useState<TablePrefs>(() => {
    if (!persistState) return DEFAULT_PREFS;
    const stored = safeJsonParse<TablePrefs>(localStorage.getItem(storageKey));
    return stored ? { ...DEFAULT_PREFS, ...stored } : DEFAULT_PREFS;
  });

  React.useEffect(() => {
    if (!persistState) return;
    const stored = safeJsonParse<TablePrefs>(localStorage.getItem(storageKey));
    setPrefs(stored ? { ...DEFAULT_PREFS, ...stored } : DEFAULT_PREFS);
  }, [persistState, storageKey]);

  React.useEffect(() => {
    if (!persistState) return;
    localStorage.setItem(storageKey, JSON.stringify(prefs));
  }, [persistState, prefs, storageKey]);

  const setHiddenColumnKeys = (hiddenColumnKeys: string[]) =>
    setPrefs((prev) => ({ ...prev, hiddenColumnKeys }));

  const setColumnWidth = (columnKey: string, width: number) =>
    setPrefs((prev) => ({ ...prev, columnWidths: { ...prev.columnWidths, [columnKey]: width } }));

  const setSortState = (columnKey: string, order: SortOrder) =>
    setPrefs((prev) => ({ ...prev, sorter: order ? { columnKey, order } : null }));

  const resolvedData = (dataSource ?? []) as readonly T[];

  const filterConfigs = React.useMemo(() => {
    const map = new Map<string, ExcelFilterConfig<T>>();
    columns.forEach((col, index) => {
      const column = col as ExcelColumnType<T>;
      const key = getColumnKey(column, index);
      if (column.excel?.disable) return;
      if (!column.dataIndex && !column.excel?.value) return;
      if (column.filters || column.filterDropdown) return;
      const config = buildFilterConfig(column, resolvedData, key, tableId);
      if (config) map.set(key, config);
    });
    return map;
  }, [columns, resolvedData, tableId]);

  const [remoteOptions, setRemoteOptions] = React.useState<Record<string, { key: string; label: string }[]>>({});
  const [remoteLoading, setRemoteLoading] = React.useState<Record<string, boolean>>({});

  const requestOptions = React.useCallback(async (columnKey: string, loader: () => Promise<{ key: string; label: string }[]>) => {
    if (remoteOptions[columnKey]?.length) {
      return;
    }
    if (remoteLoading[columnKey]) {
      return;
    }

    setRemoteLoading((prev) => ({ ...prev, [columnKey]: true }));
    try {
      const options = await loader();
      setRemoteOptions((prev) => ({ ...prev, [columnKey]: options || [] }));
    } catch {
      setRemoteOptions((prev) => ({ ...prev, [columnKey]: [] }));
    } finally {
      setRemoteLoading((prev) => ({ ...prev, [columnKey]: false }));
    }
  }, [remoteLoading, remoteOptions]);

  const enhancedColumns = React.useMemo(() => {
    const result: ColumnsType<T> = [];
    columns.forEach((raw, index) => {
      const column = raw as ExcelColumnType<T>;
      const columnKey = getColumnKey(column, index);

      if (showColumnSettings && prefs.hiddenColumnKeys.includes(columnKey)) {
        return;
      }

      const widthOverride = prefs.columnWidths[columnKey];
      const next: ExcelColumnType<T> = { ...column };
      next.key = columnKey;
      if (widthOverride) next.width = widthOverride;

      if (!next.sorter && !next.excel?.disable) {
        const guessed = guessSorter(next, resolvedData);
        if (guessed) next.sorter = guessed;
      }

      if (persistState && prefs.sorter?.columnKey === columnKey && !next.sortOrder) {
        next.sortOrder = prefs.sorter.order;
      }

      const filterConfig = filterConfigs.get(columnKey);
      if (filterConfig) {
        const currentFilteredValue = prefs.filters[columnKey];
        if (persistState && next.filteredValue === undefined && Object.prototype.hasOwnProperty.call(prefs.filters, columnKey)) {
          next.filteredValue = (currentFilteredValue ?? null) as FilterValue;
        }

        next.filterIcon = (filtered) => <FilterOutlined style={filtered ? { color: '#1677ff' } : undefined} />;
        next.filterMultiple = true;

        next.onFilter = (value, record) => {
          const raw = filterConfig.getValue(record);

          if (filterConfig.mode === 'dateMonth') {
            const parsed = dayjs(raw as any);
            if (!parsed.isValid()) return false;
            return parsed.format('YYYY-MM') === String(value);
          }

          if (filterConfig.mode === 'numberRange') {
            const serialized = String(value);
            const parsed = parseNumberRange(serialized);
            if (!parsed) return true;
            const numeric = Number(raw ?? 0);
            if (!Number.isFinite(numeric)) return false;
            if (parsed.onlyPositive && numeric <= 0) return false;
            if (parsed.min != null && numeric < parsed.min) return false;
            if (parsed.max != null && numeric > parsed.max) return false;
            return true;
          }

          const needle = String(value);
          const hay = normalizePrimitive(raw);
          if (needle === '') return hay === '';
          return hay === needle;
        };

        next.filterDropdown = (dropdownProps) => {
          const titleNode = typeof next.title === 'function' ? undefined : next.title;
          const onSortAsc = next.sorter
            ? () => {
              setSortState(columnKey, 'ascend');
              dropdownProps.close();
            }
            : undefined;
          const onSortDesc = next.sorter
            ? () => {
              setSortState(columnKey, 'descend');
              dropdownProps.close();
            }
            : undefined;

          if (filterConfig.mode === 'numberRange') {
            return (
              <NumberRangeFilterDropdown
                title={titleNode}
                selectedKeys={dropdownProps.selectedKeys}
                setSelectedKeys={dropdownProps.setSelectedKeys}
                confirm={dropdownProps.confirm}
                clearFilters={dropdownProps.clearFilters}
                close={dropdownProps.close}
                onSortAsc={onSortAsc}
                onSortDesc={onSortDesc}
              />
            );
          }

          const options = filterConfig.options ?? [];
          const resolvedOptions = filterConfig.optionsLoader
            ? (remoteOptions[columnKey] ?? options)
            : options;
          const loadingOptions = filterConfig.optionsLoader ? Boolean(remoteLoading[columnKey]) : false;
          const onRequestOptions = filterConfig.optionsLoader
            ? () => { void requestOptions(columnKey, filterConfig.optionsLoader!); }
            : undefined;

          return (
            <ListFilterDropdown
              title={titleNode}
              options={resolvedOptions}
              loading={loadingOptions}
              onRequestOptions={onRequestOptions}
              selectedKeys={dropdownProps.selectedKeys}
              setSelectedKeys={dropdownProps.setSelectedKeys}
              confirm={dropdownProps.confirm}
              clearFilters={dropdownProps.clearFilters}
              close={dropdownProps.close}
              onSortAsc={onSortAsc}
              onSortDesc={onSortDesc}
            />
          );
        };
      }

      next.onHeaderCell = (col: any) => ({
        width: col.width,
        columnKey,
        onResizeColumn: showColumnSettings ? setColumnWidth : undefined,
      });

      result.push(next);
    });
    return result;
  }, [columns, filterConfigs, persistState, prefs, resolvedData, showColumnSettings]);

  const exportCsv = React.useCallback(() => {
    const cols = enhancedColumns as ExcelColumnType<T>[];
    const rows = (resolvedData ?? []) as T[];

    const exportable = cols
      .filter((col) => (col.dataIndex || col.excel?.value) && col.excel?.disable !== true)
      .map((col, index) => ({ col, index, key: getColumnKey(col, index) }));

    const headers = exportable.map(({ col, key }) => {
      if (typeof col.title === 'string' && col.title.trim()) return col.title;
      return key;
    });

    const formattedRows: CsvRecord[] = rows.map((record) => {
      const mapped: CsvRecord = {};
      exportable.forEach(({ col, index }) => {
        const header = headers[index] ?? getColumnKey(col, index);
        const raw = col.excel?.value ? col.excel.value(record) : getRecordValue(record, col.dataIndex);
        if (raw === null || raw === undefined) {
          mapped[header] = '';
          return;
        }
        if (typeof raw === 'number' && Number.isFinite(raw)) {
          mapped[header] = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 20 }).format(raw);
          return;
        }
        if (isLikelyDate(raw)) {
          const parsed = dayjs(raw as any);
          mapped[header] = parsed.isValid() ? parsed.format('DD/MM/YYYY') : normalizePrimitive(raw);
          return;
        }
        mapped[header] = normalizePrimitive(raw);
      });
      return mapped;
    });

    const csv = buildCsv(formattedRows, headers, { delimiter: ';', includeBom: true });
    const filename = exportFilename || `${tableId}-${dayjs().format('YYYY-MM-DD')}`;
    downloadCsv(csv, filename);
  }, [enhancedColumns, exportFilename, resolvedData, tableId]);

  const columnSettingsItems = React.useMemo<MenuProps['items']>(() => {
    const selectableColumns = columns
      .map((col, index) => ({ col: col as ExcelColumnType<T>, key: getColumnKey(col as any, index) }))
      .filter(({ col }) => {
        const title = col.title;
        return Boolean(title) && !(col.excel?.disable);
      });

    return [
      {
        key: 'header',
        label: (
          <div style={{ padding: '4px 4px 0' }}>
            <Typography.Text strong>Colunas</Typography.Text>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' as const },
      ...selectableColumns.map(({ col, key }) => ({
        key,
        label: (
          <Checkbox checked={!prefs.hiddenColumnKeys.includes(key)}>
            {typeof col.title === 'string' ? col.title : 'Coluna'}
          </Checkbox>
        ),
      })),
      { type: 'divider' as const },
      {
        key: 'reset',
        label: 'Resetar colunas',
      },
    ];
  }, [columns, prefs.hiddenColumnKeys]);

  const onColumnSettingsClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'reset') {
      setPrefs((prev) => ({
        ...prev,
        hiddenColumnKeys: [],
        columnWidths: {},
      }));
      return;
    }

    const columnKey = String(key);
    setHiddenColumnKeys(
      prefs.hiddenColumnKeys.includes(columnKey)
        ? prefs.hiddenColumnKeys.filter((k) => k !== columnKey)
        : [...prefs.hiddenColumnKeys, columnKey],
    );
  };

  const handleChange: TableProps<T>['onChange'] = (pagination, filters, sorter, extra) => {
    if (persistState) {
      setPrefs((prev) => ({
        ...prev,
        filters: Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, (value ?? null) as React.Key[] | null]),
        ),
        sorter: (() => {
          const sortValue = Array.isArray(sorter) ? sorter[0] : sorter;
          const columnKey = sortValue?.columnKey ? String(sortValue.columnKey) : '';
          const order = (sortValue?.order ?? null) as SortOrder;
          return columnKey && order ? { columnKey, order } : null;
        })(),
      }));
    }

    onChange?.(pagination as TablePaginationConfig, filters as any, sorter as any, extra as any);
  };

  return (
    <div style={{ width: '100%' }}>
      {showColumnSettings || showExport ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 12px' }}>
          <Space>
            {showExport ? (
              <Button size="small" onClick={exportCsv} disabled={!resolvedData.length}>
                Exportar
              </Button>
            ) : null}
          <Dropdown
            trigger={['click']}
            menu={{
              items: columnSettingsItems,
              onClick: onColumnSettingsClick,
            }}
          >
            {showColumnSettings ? (
              <Button size="small" icon={<SettingOutlined />}>
                Colunas
              </Button>
            ) : <span />}
          </Dropdown>
          </Space>
        </div>
      ) : null}

      <Table
        {...rest}
        columns={enhancedColumns}
        dataSource={dataSource}
        onChange={handleChange}
        components={{
          ...(rest.components ?? {}),
          header: {
            ...(rest.components?.header ?? {}),
            cell: ResizableHeaderCell,
          },
        }}
      />
    </div>
  );
}
