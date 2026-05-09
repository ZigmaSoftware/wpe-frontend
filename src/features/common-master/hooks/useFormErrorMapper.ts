import { AxiosError } from "axios";
import { FieldValues, Path, UseFormSetError } from "react-hook-form";

export const applyBackendErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) => {
  if (!(error instanceof AxiosError) || !error.response?.data || typeof error.response.data !== "object") {
    return;
  }

  Object.entries(error.response.data as Record<string, unknown>).forEach(([field, value]) => {
    const message = Array.isArray(value) ? String(value[0]) : typeof value === "string" ? value : "";
    if (!message) {
      return;
    }
    setError(field as Path<T>, { type: "server", message });
  });
};
