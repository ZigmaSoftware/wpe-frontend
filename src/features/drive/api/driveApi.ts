import { coreApi } from "@/lib/api";
import { unwrapSuccessEnvelope } from "@/lib/api-helpers";
import type { ApiSuccessEnvelope } from "@/lib/types";

export type DriveFileRecord = {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
  modifiedTime?: string | null;
  webViewLink?: string | null;
  isGoogleNative?: boolean;
};

export type DriveFileList = {
  files: DriveFileRecord[];
};

let driveCsrfToken: string | null = null;

const DRIVE_LIST_URL = "/api/drive/";

const updateCsrfToken = (headers: Headers) => {
  const nextToken = headers.get("x-csrftoken");
  if (nextToken) {
    driveCsrfToken = nextToken;
  }
  return driveCsrfToken;
};

const ensureDriveCsrfToken = async () => {
  if (driveCsrfToken) {
    return driveCsrfToken;
  }

  const response = await coreApi.get<ApiSuccessEnvelope<DriveFileList>>(DRIVE_LIST_URL, {
    withCredentials: true,
  });
  return updateCsrfToken(response.headers);
};

const withDriveCsrf = async () => {
  const token = await ensureDriveCsrfToken();
  return token ? { "X-CSRFToken": token } : {};
};

const buildGoogleDriveViewUrl = (fileId: string) => `https://drive.google.com/file/d/${fileId}/view`;

export const driveApi = {
  listFiles: async () => {
    const response = await coreApi.get<ApiSuccessEnvelope<DriveFileList>>(DRIVE_LIST_URL, {
      withCredentials: true,
    });
    updateCsrfToken(response.headers);
    return unwrapSuccessEnvelope(response.data);
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await coreApi.post<ApiSuccessEnvelope<{ file: DriveFileRecord }>>(
      "/api/drive/upload/",
      formData,
      {
        withCredentials: true,
        headers: await withDriveCsrf(),
      },
    );
    updateCsrfToken(response.headers);
    return unwrapSuccessEnvelope(response.data);
  },

  deleteFile: async ({ id, permanent = true }: { id: string; permanent?: boolean }) => {
    const response = await coreApi.post<ApiSuccessEnvelope<Record<string, never>>>(
      "/api/drive/delete/",
      { id, permanent },
      {
        withCredentials: true,
        headers: await withDriveCsrf(),
      },
    );
    updateCsrfToken(response.headers);
    return unwrapSuccessEnvelope(response.data);
  },

  downloadFile: async (file: DriveFileRecord) => {
    const openedWindow = window.open(file.webViewLink || buildGoogleDriveViewUrl(file.id), "_blank", "noopener,noreferrer");
    if (!openedWindow) {
      throw new Error("Browser blocked the Google Drive window. Allow pop-ups and try again.");
    }
  },
};
