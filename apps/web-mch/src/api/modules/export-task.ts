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
      // responseReturn: 'body' bypasses { code, data } unwrap so ArrayBuffer is kept
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

export const EXPORT_PATHS = {
  PAY_ORDER: '/payOrderExport/task',
  MCH_LIST: '/mchListExport/task',
  MCH_HISTORY: '/mchHistoryExport/task',
  MCH_PREPAID_HISTORY: '/mchPrepaidHistoryExport/task',
  PASSAGE_HISTORY: '/passageHistoryExport/task',
  AGENT_HISTORY: '/agentHistoryExport/task',
  PASSAGE_PREPAID_HISTORY: '/passagePrepaidHistoryExport/task',
  PASSAGE_GROUP: '/passageGroupExport/task',
  MCH_STAT: '/mchStatExport/task',
  MCH_PRODUCT_STAT: '/mchProductStatExport/task',
  PRODUCT_STAT: '/productStatExport/task',
  PLAT_STAT: '/platStatExport/task',
  AGENT_STAT: '/agentStatExport/task',
  PASSAGE_STAT: '/passageStatExport/task',
} as const;

export const payOrderExportApi = createExportApi(EXPORT_PATHS.PAY_ORDER);
export const mchListExportApi = createExportApi(EXPORT_PATHS.MCH_LIST);
export const mchHistoryExportApi = createExportApi(EXPORT_PATHS.MCH_HISTORY);
export const mchPrepaidHistoryExportApi = createExportApi(
  EXPORT_PATHS.MCH_PREPAID_HISTORY,
);
export const passageHistoryExportApi = createExportApi(
  EXPORT_PATHS.PASSAGE_HISTORY,
);
export const agentHistoryExportApi = createExportApi(
  EXPORT_PATHS.AGENT_HISTORY,
);
export const passagePrepaidHistoryExportApi = createExportApi(
  EXPORT_PATHS.PASSAGE_PREPAID_HISTORY,
);
export const passageGroupExportApi = createExportApi(
  EXPORT_PATHS.PASSAGE_GROUP,
);
export const mchStatExportApi = createExportApi(EXPORT_PATHS.MCH_STAT);
export const mchProductStatExportApi = createExportApi(
  EXPORT_PATHS.MCH_PRODUCT_STAT,
);
export const productStatExportApi = createExportApi(EXPORT_PATHS.PRODUCT_STAT);
export const platStatExportApi = createExportApi(EXPORT_PATHS.PLAT_STAT);
export const agentStatExportApi = createExportApi(EXPORT_PATHS.AGENT_STAT);
export const passageStatExportApi = createExportApi(EXPORT_PATHS.PASSAGE_STAT);
