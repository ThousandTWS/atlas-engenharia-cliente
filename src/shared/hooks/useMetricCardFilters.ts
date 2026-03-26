import { useCallback, useState } from 'react';
import type { Dayjs } from 'dayjs';
import type { MetricGroupingOption, MetricPeriodOption } from '../utils/metricSeries';
import { createDefaultCustomRange } from '../utils/metricSeries';

export interface MetricCardFilters {
  period: MetricPeriodOption;
  grouping: MetricGroupingOption;
  customRange: [Dayjs | null, Dayjs | null] | null;
}

const createDefaultState = (defaults?: Partial<Pick<MetricCardFilters, 'period' | 'grouping'>>): MetricCardFilters => ({
  period: defaults?.period ?? '6m',
  grouping: defaults?.grouping ?? 'monthly',
  customRange: null,
});

export const useMetricCardFilters = (
  ids: readonly string[],
  defaults?: Partial<Pick<MetricCardFilters, 'period' | 'grouping'>>,
) => {
  const [filters, setFilters] = useState<Record<string, MetricCardFilters>>(() => (
    Object.fromEntries(ids.map((id) => [id, createDefaultState(defaults)]))
  ));

  const setPeriod = useCallback((id: string, period: MetricPeriodOption) => {
    setFilters((current) => {
      const previous = current[id] ?? createDefaultState(defaults);
      const nextCustomRange = period === 'custom' && !previous.customRange
        ? createDefaultCustomRange()
        : previous.customRange;

      return {
        ...current,
        [id]: {
          ...previous,
          period,
          customRange: nextCustomRange,
        },
      };
    });
  }, [defaults]);

  const setGrouping = useCallback((id: string, grouping: MetricGroupingOption) => {
    setFilters((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? createDefaultState(defaults)),
        grouping,
      },
    }));
  }, [defaults]);

  const setCustomRange = useCallback((id: string, customRange: [Dayjs | null, Dayjs | null] | null) => {
    setFilters((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? createDefaultState(defaults)),
        customRange,
      },
    }));
  }, [defaults]);

  return {
    filters,
    setPeriod,
    setGrouping,
    setCustomRange,
  };
};

