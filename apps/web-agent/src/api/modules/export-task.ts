import { requestClient } from '#/api/request';

const XLSX_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface AgentExportTask {
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
  ): Promise<AgentExportTask | null | undefined>;
  fetchRunning(): Promise<AgentExportTask | null>;
  fetchCompleted(): Promise<AgentExportTask[]>;
  deleteCompleted(objectKey: string): Promise<void>;
  cancel(taskId: string): Promise<AgentExportTask>;
  downloadFile(objectKey: string, fileName: string): Promise<void>;
}

export function createExportApi(basePath: string): ExportTaskApi {
  const path = basePath.replace(/\/$/, '');
  return {
    async submit(params) {
      return requestClient.post<AgentExportTask | null | undefined>(
        `${path}/submit`,
        { params },
      );
    },
    async fetchRunning() {
      const data = await requestClient.get<AgentExportTask | null>(
        `${path}/running`,
      );
      return data ?? null;
    },
    async fetchCompleted() {
      const data = await requestClient.get<AgentExportTask[]>(
        `${path}/completed`,
      );
      return data ?? [];
    },
    async deleteCompleted(objectKey) {
      await requestClient.post(`${path}/completed/delete`, { objectKey });
    },
    async cancel(taskId) {
      return requestClient.post<AgentExportTask>(`${path}/cancel`, { taskId });
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

export const payOrderExportApi = createExportApi('/payOrderExport/task');
export const passagePayOrderExportApi = createExportApi(
  '/payOrderPassageExport/task',
);
export const agentHistoryExportApi = createExportApi('/agentHistoryExport/task');
export const mchPrepaidHistoryExportApi = createExportApi(
  '/mchPrepaidHistoryExport/task',
);
export const agentDayStatExportApi = createExportApi(
  '/agentDayStatExport/task',
);
