import {
  inject,
  onActivated,
  onDeactivated,
  onUnmounted,
  provide,
  ref,
  type InjectionKey,
  type Ref,
} from 'vue';

import { Modal, message } from 'ant-design-vue';

import {
  type ExportTaskApi,
  type MchExportTask,
  agentHistoryExportApi,
  agentStatExportApi,
  mchHistoryExportApi,
  mchListExportApi,
  mchPrepaidHistoryExportApi,
  mchProductStatExportApi,
  mchStatExportApi,
  passageGroupExportApi,
  passageHistoryExportApi,
  passagePrepaidHistoryExportApi,
  passageStatExportApi,
  payOrderExportApi,
  platStatExportApi,
  productStatExportApi,
} from '#/api/modules/export-task';

export const EXPORT_POLL_MS = 2000;
export const EXPORT_CANCEL_POLL_MS = 1000;
export const EXPORT_POLL_MAX_FAILURES = 3;

export const EXPORT_STATUS = {
  PENDING: 0,
  RUNNING: 1,
  SUCCESS: 2,
  FAIL: 3,
  CANCEL_REQUESTED: 4,
  CANCELLED: 5,
} as const;

export const EXPORT_MSG = {
  submit: '报表导出已开始，请等待完成后点击「报表下载列表」下载',
  reused: '已有报表正在导出，请等待完成后点击「报表下载列表」下载',
  done: '导出完成，请点击「报表下载列表」下载',
  alreadyRunning: '已有导出任务进行中，请等待完成后再试',
  submitFailed: '提交导出失败',
  loadListFailed: '加载报表列表失败',
  downloadFailed: '下载失败',
  deleteFailed: '删除失败',
  missingFile: '缺少文件信息，请重新导出',
  emptyFile: '文件为空',
  cancelRequested: '已提交中止请求，正在停止导出',
  cancelFailed: '中止导出失败，请稍后重试',
  pollFailed: '轮询导出状态失败，请打开报表下载列表查看或重新导出',
};

export const DEFAULT_REPORT_LIST_TITLE = '报表下载列表（仅保留当日近10条）';

/** 按 export API 类型全局互斥（同类型跨 Tab 仅一条） */
const activeExportKeys = new Set<string>();

function tryAcquireExportKey(key: string): boolean {
  if (activeExportKeys.has(key)) return false;
  activeExportKeys.add(key);
  return true;
}

function releaseExportKey(key: string) {
  activeExportKeys.delete(key);
}

export interface ExportControl {
  cancellable: Ref<boolean>;
  cancelling: Ref<boolean>;
  cancellationRequested: Ref<boolean>;
  confirmCancel: () => void;
}

export const EXPORT_CONTROL_KEY: InjectionKey<ExportControl> =
  Symbol('async-export-control');

export function useExportControl(): ExportControl | null {
  return inject(EXPORT_CONTROL_KEY, null);
}

export interface UseAsyncExportTaskOptions {
  api: ExportTaskApi;
  /** 同类型导出全局唯一，如 mch-history */
  exportKey: string;
  pollMs?: number;
  messages?: Partial<typeof EXPORT_MSG>;
  reportListTitle?: string;
}

export function useAsyncExportTask(options: UseAsyncExportTaskOptions) {
  const { api, exportKey, pollMs = EXPORT_POLL_MS } = options;
  const cancelPollMs = Math.min(pollMs, EXPORT_CANCEL_POLL_MS);
  const messages = { ...EXPORT_MSG, ...(options.messages ?? {}) };
  const reportListTitle = options.reportListTitle ?? DEFAULT_REPORT_LIST_TITLE;

  const exportLoading = ref(false);
  const exportProgress = ref(0);
  const reportListVisible = ref(false);
  const reportListLoading = ref(false);
  const reportListEmptyHint = ref('');
  const hasReportDownloads = ref(false);
  const completedExports = ref<MchExportTask[]>([]);
  const exportCancellable = ref(false);
  const cancelLoading = ref(false);
  const cancellationRequested = ref(false);
  const runningTaskId = ref<string | null>(null);
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let pollFailureCount = 0;
  let exportKeyHeld = false;

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function releaseHeldKey() {
    if (exportKeyHeld) {
      releaseExportKey(exportKey);
      exportKeyHeld = false;
    }
  }

  function isActive(task: MchExportTask | null | undefined) {
    return (
      task != null &&
      (task.status === EXPORT_STATUS.PENDING ||
        task.status === EXPORT_STATUS.RUNNING ||
        task.status === EXPORT_STATUS.CANCEL_REQUESTED)
    );
  }

  function isTerminal(task: MchExportTask | null | undefined) {
    return (
      !!task &&
      (task.status === EXPORT_STATUS.SUCCESS ||
        task.status === EXPORT_STATUS.FAIL ||
        task.status === EXPORT_STATUS.CANCELLED)
    );
  }

  function applyRunningTask(task: MchExportTask | null | undefined) {
    runningTaskId.value = task?.taskId ?? null;
    cancellationRequested.value =
      task?.status === EXPORT_STATUS.CANCEL_REQUESTED;
    exportCancellable.value =
      task?.status === EXPORT_STATUS.RUNNING &&
      task.cancellable === true &&
      !!runningTaskId.value;
  }

  function clearRunningTask() {
    runningTaskId.value = null;
    exportCancellable.value = false;
    cancellationRequested.value = false;
  }

  function mapCompleted(list: MchExportTask[]) {
    return list.map((item, index) => ({
      ...item,
      rowKey: `${item.startedAt}_${item.finishedAt}_${index}`,
    }));
  }

  async function refreshCompleted() {
    const list = (await api.fetchCompleted()) ?? [];
    completedExports.value = mapCompleted(list);
    hasReportDownloads.value = list.length > 0;
    return list;
  }

  async function syncReportDownloadAvailability() {
    try {
      const list = (await api.fetchCompleted()) ?? [];
      hasReportDownloads.value = list.length > 0;
    } catch (error) {
      console.error('检查报表下载列表失败', error);
      hasReportDownloads.value = false;
    }
  }

  async function openReportList(hint?: string) {
    if (hint !== undefined) reportListEmptyHint.value = hint;
    reportListVisible.value = true;
    reportListLoading.value = true;
    completedExports.value = [];
    try {
      await refreshCompleted();
      if (completedExports.value.length === 0 && !reportListEmptyHint.value) {
        reportListEmptyHint.value =
          '暂无已完成报表。若导出刚提交，请稍候刷新列表；若导出失败，请重新导出。';
      }
    } catch (error) {
      console.error('加载报表列表失败', error);
      reportListEmptyHint.value =
        reportListEmptyHint.value || messages.loadListFailed;
      message.error(messages.loadListFailed);
    } finally {
      reportListLoading.value = false;
    }
  }

  async function handleExportFailure(errMsg: string) {
    stopPoll();
    pollFailureCount = 0;
    exportLoading.value = false;
    clearRunningTask();
    releaseHeldKey();
    message.error(errMsg);
    await openReportList(errMsg);
  }

  async function finishExportTask(task: MchExportTask) {
    stopPoll();
    pollFailureCount = 0;
    exportLoading.value = false;
    clearRunningTask();
    releaseHeldKey();
    exportProgress.value =
      task.status === EXPORT_STATUS.SUCCESS ? 100 : exportProgress.value;
    if (task.status === EXPORT_STATUS.SUCCESS) {
      message.success(messages.done);
      reportListEmptyHint.value = '';
      await refreshCompleted();
    } else if (task.status === EXPORT_STATUS.FAIL) {
      await handleExportFailure(task.errMsg || '导出失败');
    } else if (task.status === EXPORT_STATUS.CANCELLED) {
      message.info('导出任务已中止');
      reportListEmptyHint.value = '导出任务已中止，未生成报表文件。';
      await openReportList(reportListEmptyHint.value);
    }
  }

  function startPoll(intervalMs = pollMs) {
    stopPoll();
    pollFailureCount = 0;
    pollTimer = setInterval(() => {
      void (async () => {
        try {
          const task = await api.fetchRunning();
          pollFailureCount = 0;
          if (!task) {
            const wasLoading = exportLoading.value;
            if (wasLoading) exportLoading.value = false;
            clearRunningTask();
            releaseHeldKey();
            stopPoll();
            if (wasLoading) {
              exportProgress.value = 100;
              try {
                const list = await refreshCompleted();
                if (list.length > 0) {
                  message.success(messages.done);
                }
              } catch (error) {
                console.error('刷新报表下载列表失败', error);
              }
            }
            return;
          }
          exportProgress.value = task.progress ?? 0;
          applyRunningTask(task);
          if (isTerminal(task)) await finishExportTask(task);
          else if (!isActive(task)) {
            exportLoading.value = false;
            clearRunningTask();
            releaseHeldKey();
            stopPoll();
          }
        } catch (error) {
          pollFailureCount += 1;
          console.error('轮询导出任务失败', error);
          if (pollFailureCount >= EXPORT_POLL_MAX_FAILURES) {
            await handleExportFailure(messages.pollFailed);
          }
        }
      })();
    }, intervalMs);
  }

  async function restoreRunningTask() {
    try {
      const task = await api.fetchRunning();
      if (!task || isTerminal(task)) {
        await syncReportDownloadAvailability();
        return;
      }
      if (!isActive(task)) return;
      exportLoading.value = true;
      exportProgress.value = task.progress ?? 0;
      applyRunningTask(task);
      startPoll(
        task.status === EXPORT_STATUS.CANCEL_REQUESTED
          ? cancelPollMs
          : pollMs,
      );
    } catch (error) {
      console.error('恢复导出任务失败', error);
    }
  }

  async function submitExport(params: Record<string, unknown>) {
    if (exportLoading.value) {
      message.warning(messages.alreadyRunning);
      return;
    }
    if (!tryAcquireExportKey(exportKey)) {
      message.warning(messages.alreadyRunning);
      return;
    }
    exportKeyHeld = true;
    try {
      exportLoading.value = true;
      exportProgress.value = 0;
      reportListEmptyHint.value = '';
      const task = await api.submit(params);
      if (!task) {
        exportLoading.value = false;
        releaseHeldKey();
        await handleExportFailure(messages.submitFailed);
        return;
      }
      if (task.reused) message.info(messages.reused);
      else message.info(messages.submit);
      exportProgress.value = task.progress ?? 0;
      applyRunningTask(task);
      if (isTerminal(task)) await finishExportTask(task);
      else if (isActive(task)) startPoll();
      else {
        exportLoading.value = false;
        releaseHeldKey();
      }
    } catch (error) {
      exportLoading.value = false;
      releaseHeldKey();
      console.error('提交导出失败', error);
      await handleExportFailure(messages.submitFailed);
    }
  }

  async function cancelExport() {
    const taskId = runningTaskId.value;
    if (!taskId || !exportCancellable.value || cancelLoading.value) return;
    cancelLoading.value = true;
    try {
      const task = await api.cancel(taskId);
      exportProgress.value = task?.progress ?? exportProgress.value;
      exportLoading.value = true;
      applyRunningTask(task);
      startPoll(cancelPollMs);
      message.success(messages.cancelRequested);
    } catch (error) {
      console.error('中止导出任务失败', error);
      message.error(messages.cancelFailed);
    } finally {
      cancelLoading.value = false;
    }
  }

  function confirmCancelExport() {
    if (!runningTaskId.value || !exportCancellable.value || cancelLoading.value)
      return;
    Modal.confirm({
      title: '确认中止导出？',
      content:
        '中止后本次导出不会生成报表，已产生的临时数据将被清理。确定继续吗？',
      okText: '确认中止',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        void cancelExport();
      },
    });
  }

  provide(EXPORT_CONTROL_KEY, {
    cancellable: exportCancellable,
    cancelling: cancelLoading,
    cancellationRequested,
    confirmCancel: confirmCancelExport,
  });

  async function downloadFile(row: MchExportTask) {
    if (!row?.objectKey) {
      message.error(messages.missingFile);
      return;
    }
    try {
      await api.downloadFile(row.objectKey, row.fileName);
    } catch (error) {
      console.error('下载导出文件失败', error);
      message.error(
        error instanceof Error && error.message === '文件为空'
          ? messages.emptyFile
          : messages.downloadFailed,
      );
    }
  }

  async function deleteCompletedItem(row: MchExportTask) {
    if (!row?.objectKey) {
      message.error('缺少文件信息');
      return;
    }
    try {
      await api.deleteCompleted(row.objectKey);
      message.success('已删除');
      await refreshCompleted();
      if (!hasReportDownloads.value) reportListVisible.value = false;
    } catch (error) {
      console.error('删除报表失败', error);
      message.error(messages.deleteFailed);
    }
  }

  onActivated(() => {
    void restoreRunningTask();
    void syncReportDownloadAvailability();
  });

  onDeactivated(() => {
    stopPoll();
  });

  onUnmounted(() => {
    stopPoll();
  });

  return {
    exportLoading,
    exportProgress,
    reportListVisible,
    reportListLoading,
    reportListEmptyHint,
    reportListTitle,
    hasReportDownloads,
    completedExports,
    exportCancellable,
    cancelLoading,
    cancellationRequested,
    confirmCancelExport,
    submitExport,
    restoreRunningTask,
    syncReportDownloadAvailability,
    openReportList,
    refreshCompleted,
    downloadFile,
    deleteCompletedItem,
  };
}

function createHook(api: ExportTaskApi, exportKey: string) {
  return () => useAsyncExportTask({ api, exportKey });
}

export const usePayOrderExport = createHook(payOrderExportApi, 'pay-order');
export const useMchListExport = createHook(mchListExportApi, 'mch-list');
export const useMchHistoryExport = createHook(
  mchHistoryExportApi,
  'mch-history',
);
export const useMchPrepaidHistoryExport = createHook(
  mchPrepaidHistoryExportApi,
  'mch-prepaid-history',
);
export const usePassageHistoryExport = createHook(
  passageHistoryExportApi,
  'passage-history',
);
export const useAgentHistoryExport = createHook(
  agentHistoryExportApi,
  'agent-history',
);
export const usePassagePrepaidHistoryExport = createHook(
  passagePrepaidHistoryExportApi,
  'passage-prepaid-history',
);
export const usePassageGroupExport = createHook(
  passageGroupExportApi,
  'passage-group',
);
export const useMchStatExport = createHook(mchStatExportApi, 'mch-stat');
export const useMchProductStatExport = createHook(
  mchProductStatExportApi,
  'mch-product-stat',
);
export const useProductStatExport = createHook(
  productStatExportApi,
  'product-stat',
);
export const usePlatStatExport = createHook(platStatExportApi, 'plat-stat');
export const useAgentStatExport = createHook(agentStatExportApi, 'agent-stat');
export const usePassageStatExport = createHook(
  passageStatExportApi,
  'passage-stat',
);
