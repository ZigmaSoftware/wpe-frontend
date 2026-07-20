import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ApiSuccessEnvelope } from "@/lib/types";

export type TaskTrackerRow = {
  _row: number;
  cells: string[];
};

export type TaskTrackerSheet = {
  headers: string[];
  rows: TaskTrackerRow[];
};

let taskTrackerCsrfToken: string | null = null;

const TASK_TRACKER_LIST_URL = "/api/task-tracker/";

const updateCsrfToken = (headers: Headers) => {
  const nextToken = headers.get("x-csrftoken");
  if (nextToken) {
    taskTrackerCsrfToken = nextToken;
  }
  return taskTrackerCsrfToken;
};

const ensureTaskTrackerCsrfToken = async () => {
  if (taskTrackerCsrfToken) {
    return taskTrackerCsrfToken;
  }

  const response = await coreApi.get<ApiSuccessEnvelope<TaskTrackerSheet>>(TASK_TRACKER_LIST_URL, {
    withCredentials: true,
  });
  return updateCsrfToken(response.headers);
};

const withTaskTrackerCsrf = async () => {
  const token = await ensureTaskTrackerCsrfToken();
  return token ? { "X-CSRFToken": token } : {};
};

export const taskTrackerApi = {
  listRows: async () => {
    const response = await coreApi.get<ApiSuccessEnvelope<TaskTrackerSheet>>(TASK_TRACKER_LIST_URL, {
      withCredentials: true,
    });
    updateCsrfToken(response.headers);
    return unwrapSuccessEnvelope(response.data);
  },

  addRow: async (cells: string[]) => {
    const response = await coreApi.post<ApiSuccessEnvelope<Record<string, never>>>(
      "/api/task-tracker/add/",
      { cells },
      {
        withCredentials: true,
        headers: await withTaskTrackerCsrf(),
      },
    );
    updateCsrfToken(response.headers);
    return unwrapSuccessEnvelope(response.data);
  },

  updateRow: async (row: number, cells: string[]) => {
    const response = await coreApi.post<ApiSuccessEnvelope<Record<string, never>>>(
      "/api/task-tracker/update/",
      { row, cells },
      {
        withCredentials: true,
        headers: await withTaskTrackerCsrf(),
      },
    );
    updateCsrfToken(response.headers);
    return unwrapSuccessEnvelope(response.data);
  },

  deleteRow: async (row: number) => {
    const response = await coreApi.post<ApiSuccessEnvelope<Record<string, never>>>(
      "/api/task-tracker/delete/",
      { row },
      {
        withCredentials: true,
        headers: await withTaskTrackerCsrf(),
      },
    );
    updateCsrfToken(response.headers);
    return unwrapSuccessEnvelope(response.data);
  },
};
