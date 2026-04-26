import { useCallback, useState } from "react";
import {
  buildCsv,
  downloadCsv,
  parseCsvToRecords,
} from "./csv";
import type { UseCsvExportOptions } from "./types";

export const useCsvExport = <TItem>({
  filename,
  mapData,
  columns,
  delimiter = ";",
  includeBom = true,
}: UseCsvExportOptions<TItem>) => {
  const [exporting, setExporting] = useState(false);

  const exportRows = useCallback(
    (rows: TItem[]) => {
      setExporting(true);

      try {
        const mappedRows = rows.map(mapData);
        const csv = buildCsv(mappedRows, columns, { delimiter, includeBom });
        downloadCsv(csv, filename);
      } finally {
        setExporting(false);
      }
    },
    [columns, delimiter, filename, includeBom, mapData],
  );

  return { exportRows, exporting };
};

interface UseCsvImportOptions<TItem> {
  mapRecord: (row: Record<string, string>, index: number) => TItem;
  onImported: (rows: TItem[]) => Promise<void> | void;
}

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Falha ao ler arquivo CSV."));
    reader.readAsText(file, "utf-8");
  });

export const useCsvImport = <TItem>({
  mapRecord,
  onImported,
}: UseCsvImportOptions<TItem>) => {
  const [importing, setImporting] = useState(false);

  const importFile = useCallback(
    async (file: File) => {
      setImporting(true);

      try {
        const content = await readFileAsText(file);
        const rows = parseCsvToRecords(content).map(mapRecord);
        await onImported(rows);
      } finally {
        setImporting(false);
      }
    },
    [mapRecord, onImported],
  );

  return { importFile, importing };
};

export const useExport = useCsvExport;
export const useImport = useCsvImport;
