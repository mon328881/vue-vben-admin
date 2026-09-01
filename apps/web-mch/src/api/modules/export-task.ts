import { requestClient } from '#/api/request';

const XLSX_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface MchExportTask {
  objectKey: string;
  fileName: string;
  startedAt?: string;
  finishedAt?: string;
  operator?: string;
  totalRows?: number;
  status?: number;
  taskId?: string;
  progress?: number;
  reused?: boolean;
  cancellable?: boolean;
  errMsg?: string;
  rowKey?: string;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export interface ExportTaskApi {
  submit(
    params: Record<string, unknown>,
  ): Promise<MchExportTask | null | undefined>;
  fetchRunning(): Promise<MchExportTask | null>;
  fetchCompleted(): Promise<MchExportTask[]>;
  deleteCompleted(objectKey: string): Promise<void>;
  cancel(taskId: string): Promise<MchExportTask>;
  downloadFile(objectKey: string, fileName: string): Promise<void>;
}

export function createExportApi(basePath: string): ExportTaskApi {
  const path = basePath.replace(/\/$/, '');
  return {
    async submit(params) {
      return requestClient.post<MchExportTask | null | undefined>(
        `${path}/submit`,
        { params },
      );
    },
    async fetchRunning() {
      const data = await requestClient.get<MchExportTask | null>(
        `${path}/running`,
      );
      return data ?? null;
    },
    async fetchCompleted() {
      const data = await requestClient.get<MchExportTask[]>(
        `${path}/completed`,
      );
      return data ?? [];
    },
    async deleteCompleted(objectKey) {
      await requestClient.post(`${path}/completed/delete`, { objectKey });
    },
    async cancel(taskId) {
      return requestClient.post<MchExportTask>(`${path}/cancel`, { taskId });
    },
    async downloadFile(objectKey, fileName) {
      const buf = await requestClient.get<ArrayBuffer>(`${path}/download`, {
        params: { objectKey, fileName },
        responseReturn: 'body',
        responseType: 'arraybuffer',
      });
      if (!buf || buf.byteLength === 0) throw new Error('文件为空');
      triggerDownload(
        new Blob([buf], { type: XLSX_TYPE }),
        fileName || 'export.xlsx',
      );
    },
  };
}

/** 商户端实际使用的异步导出（不含运营端路径） */
export const EXPORT_PATHS = {
  PAY_ORDER: '/payOrderExport/task',
  MCH_HISTORY: '/mchHistoryExport/task',
  MCH_PREPAID_HISTORY: '/mchPrepaidHistoryExport/task',
} as const;

export const payOrderExportApi = createExportApi(EXPORT_PATHS.PAY_ORDER);
export const mchHistoryExportApi = createExportApi(EXPORT_PATHS.MCH_HISTORY);
export const mchPrepaidHistoryExportApi = createExportApi(
  EXPORT_PATHS.MCH_PREPAID_HISTORY,
);
