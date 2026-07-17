export type AxiosRequestHeaders = Record<string, string>;

export type InternalAxiosRequestConfig = {
  baseURL?: string;
  url?: string;
  method?: string;
  headers?: AxiosRequestHeaders;
  params?: Record<string, unknown>;
  data?: unknown;
  withCredentials?: boolean;
  _retry?: boolean;
};

export type AxiosResponse<T = unknown> = {
  data: T;
  status: number;
  statusText: string;
  config: InternalAxiosRequestConfig;
  headers: Headers;
};

export class AxiosError<T = unknown> extends Error {
  isAxiosError = true;
  config?: InternalAxiosRequestConfig;
  response?: AxiosResponse<T>;

  constructor(message: string, config?: InternalAxiosRequestConfig, response?: AxiosResponse<T>) {
    super(message);
    this.name = "AxiosError";
    this.config = config;
    this.response = response;
  }
}

type RequestInterceptor = (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
type ResponseSuccessInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
type ResponseErrorInterceptor = (error: AxiosError) => unknown;

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const buildUrl = (config: InternalAxiosRequestConfig) => {
  const rawUrl = config.url ?? "";
  const base = config.baseURL ?? "";
  const target = isAbsoluteUrl(rawUrl) ? rawUrl : `${base}${rawUrl}`;
  const url = new URL(target, window.location.origin);

  for (const [key, value] of Object.entries(config.params ?? {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  return url.toString();
};

const parseResponseBody = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const runResponsePipeline = async (
  response: AxiosResponse,
  successHandlers: Array<ResponseSuccessInterceptor | undefined>,
) => {
  let current = response;
  for (const handler of successHandlers) {
    if (!handler) {
      continue;
    }
    current = await handler(current);
  }
  return current;
};

const runErrorPipeline = async (
  error: AxiosError,
  errorHandlers: Array<ResponseErrorInterceptor | undefined>,
) => {
  let currentError = error;

  for (const handler of errorHandlers) {
    if (!handler) {
      continue;
    }

    try {
      return await handler(currentError);
    } catch (nextError) {
      currentError = nextError as AxiosError;
    }
  }

  throw currentError;
};

type AxiosInstance = {
  <T = unknown>(config: InternalAxiosRequestConfig): Promise<AxiosResponse<T>>;
  defaults: InternalAxiosRequestConfig;
  interceptors: {
    request: {
      handlers: RequestInterceptor[];
      use: (handler: RequestInterceptor) => number;
    };
    response: {
      successHandlers: Array<ResponseSuccessInterceptor | undefined>;
      errorHandlers: Array<ResponseErrorInterceptor | undefined>;
      use: (onFulfilled?: ResponseSuccessInterceptor, onRejected?: ResponseErrorInterceptor) => number;
    };
  };
  get: <T = unknown>(url: string, config?: InternalAxiosRequestConfig) => Promise<AxiosResponse<T>>;
  post: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) => Promise<AxiosResponse<T>>;
  put: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) => Promise<AxiosResponse<T>>;
  patch: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) => Promise<AxiosResponse<T>>;
  delete: <T = unknown>(url: string, config?: InternalAxiosRequestConfig) => Promise<AxiosResponse<T>>;
};

const create = (defaults: InternalAxiosRequestConfig = {}): AxiosInstance => {
  const requestHandlers: RequestInterceptor[] = [];
  const responseSuccessHandlers: Array<ResponseSuccessInterceptor | undefined> = [];
  const responseErrorHandlers: Array<ResponseErrorInterceptor | undefined> = [];

  const dispatch = async <T = unknown>(initialConfig: InternalAxiosRequestConfig) => {
    let config: InternalAxiosRequestConfig = {
      ...defaults,
      ...initialConfig,
      headers: {
        ...(defaults.headers ?? {}),
        ...(initialConfig.headers ?? {}),
      },
    };

    for (const handler of requestHandlers) {
      config = await handler(config);
    }

    const url = buildUrl(config);
    const method = (config.method ?? "GET").toUpperCase();
    const headers = { ...(config.headers ?? {}) };

    let body: BodyInit | undefined;
    if (config.data instanceof FormData) {
      body = config.data;
    } else if (config.data !== undefined && method !== "GET") {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      body = JSON.stringify(config.data);
    }

    const nativeResponse = await fetch(url, {
      method,
      headers,
      body,
      credentials: config.withCredentials ? "include" : "same-origin",
    });

    const payload = await parseResponseBody(nativeResponse);
    const response: AxiosResponse<T> = {
      data: payload as T,
      status: nativeResponse.status,
      statusText: nativeResponse.statusText,
      config,
      headers: nativeResponse.headers,
    };

    if (!nativeResponse.ok) {
      const error = new AxiosError<T>(
        typeof payload === "object" && payload && "detail" in (payload as Record<string, unknown>)
          ? String((payload as Record<string, unknown>).detail)
          : `Request failed with status ${nativeResponse.status}`,
        config,
        response,
      );
      return runErrorPipeline(error, responseErrorHandlers) as Promise<AxiosResponse<T>>;
    }

    return runResponsePipeline(response, responseSuccessHandlers) as Promise<AxiosResponse<T>>;
  };

  const instance = (dispatch as AxiosInstance);
  instance.defaults = defaults;
  instance.interceptors = {
    request: {
      handlers: requestHandlers,
      use: (handler) => requestHandlers.push(handler) - 1,
    },
    response: {
      successHandlers: responseSuccessHandlers,
      errorHandlers: responseErrorHandlers,
      use: (onFulfilled, onRejected) => {
        responseSuccessHandlers.push(onFulfilled);
        responseErrorHandlers.push(onRejected);
        return responseSuccessHandlers.length - 1;
      },
    },
  };

  instance.get = (url, config = {}) => dispatch({ ...config, method: "GET", url });
  instance.post = (url, data, config = {}) => dispatch({ ...config, method: "POST", url, data });
  instance.put = (url, data, config = {}) => dispatch({ ...config, method: "PUT", url, data });
  instance.patch = (url, data, config = {}) => dispatch({ ...config, method: "PATCH", url, data });
  instance.delete = (url, config = {}) => dispatch({ ...config, method: "DELETE", url });

  return instance;
};

const axios = {
  create,
  post: <T = unknown>(url: string, data?: unknown, config?: InternalAxiosRequestConfig) =>
    create().post<T>(url, data, config),
  isAxiosError: (value: unknown): value is AxiosError =>
    Boolean(value) && typeof value === "object" && (value as AxiosError).isAxiosError === true,
  AxiosError,
};

export default axios;
