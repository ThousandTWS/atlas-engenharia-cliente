import type { CsvDelimiter, CsvRecord } from "../csv";

export interface UseCsvExportOptions<TItem> {
  filename: string;
  mapData: (item: TItem) => CsvRecord;
  columns?: string[];
  delimiter?: CsvDelimiter;
  includeBom?: boolean;
}
