import { coreApi } from "@/lib/api";
import type {
  ApiMutationResponse,
  CityListRow,
  CityRecord,
  CityTypeOption,
  CompanyListRow,
  CompanyLookup,
  CompanyRecord,
  ContinentRecord,
  CountryListRow,
  CountryRecord,
  CurrencyRecord,
  CustomerRecord,
  DRFPaginatedResponse,
  DatatableResponse,
  DocumentRecord,
  LookupOption,
  PaginatedResult,
  ProjectListRow,
  ProjectRecord,
  StateListRow,
  StateRecord,
  SupplierRecord,
  TableParams,
  TaxListRow,
  TaxRecord,
} from "@/features/common-master/types";

const toQueryParams = ({ page, pageSize, search, ordering, filters }: TableParams) => ({
  page,
  page_size: pageSize,
  search: search || undefined,
  ordering: ordering || undefined,
  ...(filters ?? {}),
});

const normalizePaginated = <T>(payload: DRFPaginatedResponse<T> | DatatableResponse<T> | T[]): PaginatedResult<T> => {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, filtered: payload.length, next: null, previous: null };
  }
  if ("results" in payload) {
    return {
      items: payload.results,
      total: payload.count,
      filtered: payload.count,
      next: payload.next,
      previous: payload.previous,
    };
  }
  return {
    items: payload.data ?? [],
    total: Number(payload.recordsTotal ?? payload.data?.length ?? 0),
    filtered: Number(payload.recordsFiltered ?? payload.data?.length ?? 0),
    next: null,
    previous: null,
  };
};

const normalizeListPayload = <T>(payload: DRFPaginatedResponse<T> | DatatableResponse<T> | T[]) =>
  normalizePaginated(payload).items;

const unwrapMutation = <T>(payload: ApiMutationResponse<T> | T): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload as T;
};

const withStatus = <T extends { is_active?: boolean; status?: boolean }>(record: T) => ({
  ...record,
  status: record.status ?? Boolean(record.is_active),
});

const toContinentRecord = (record: ContinentRecord): ContinentRecord => withStatus(record);
const toCountryRecord = (record: CountryRecord): CountryRecord => withStatus(record);

const buildFormData = (value: unknown, formData = new FormData(), parentKey?: string): FormData => {
  if (value === undefined || value === null || value === "") {
    return formData;
  }
  if (value instanceof File) {
    formData.append(parentKey ?? "file", value);
    return formData;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      buildFormData(item, formData, `${parentKey ?? ""}[${index}]`);
    });
    return formData;
  }
  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, nestedValue]) => {
      buildFormData(nestedValue, formData, parentKey ? `${parentKey}.${key}` : key);
    });
    return formData;
  }
  formData.append(parentKey ?? "value", String(value));
  return formData;
};

export const commonMasterApi = {
  listContinents: async () => {
    const response = await coreApi.get<DRFPaginatedResponse<ContinentRecord> | DatatableResponse<ContinentRecord> | ContinentRecord[]>(
      "/api/masters/continents/",
    );
    return normalizeListPayload(response.data).map(toContinentRecord);
  },
  createContinent: async (payload: Partial<ContinentRecord>) => {
    const response = await coreApi.post<ApiMutationResponse<ContinentRecord>>("/api/masters/continents/create/", {
      ...payload,
      is_active: payload.status,
    });
    return unwrapMutation(response.data);
  },
  updateContinent: async (id: number, payload: Partial<ContinentRecord>) => {
    const response = await coreApi.put<ApiMutationResponse<ContinentRecord>>(`/api/masters/continents/${id}/`, {
      ...payload,
      is_active: payload.status,
    });
    return unwrapMutation(response.data);
  },
  toggleContinent: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/continents/${id}/toggle/`, {});
    return response.data;
  },
  deleteContinent: async (id: number) => {
    await coreApi.delete(`/api/masters/continents/${id}/`);
  },

  listCountries: async (params: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<CountryRecord> | DatatableResponse<CountryRecord>>("/api/masters/countries/", {
      params: toQueryParams(params),
    });
    const normalized = normalizePaginated(response.data);
    return {
      ...normalized,
      items: normalized.items.map((record, index) => ({
        id: record.id,
        sno: (params.page - 1) * params.pageSize + index + 1,
        country_name: record.name,
        country_code: record.code,
        continent: record.continent_name ?? "-",
        currency: "-",
        status: (record.status ?? record.is_active) ? "Active" : "Inactive",
      })) satisfies CountryListRow[],
    };
  },
  getCountry: async (id: number) => {
    const response = await coreApi.get<CountryRecord>(`/api/masters/countries/${id}/`);
    return toCountryRecord(response.data);
  },
  createCountry: async (payload: Partial<CountryRecord>) => {
    const response = await coreApi.post<ApiMutationResponse<CountryRecord>>("/api/masters/countries/create/", {
      ...payload,
      is_active: payload.status,
    });
    return unwrapMutation(response.data);
  },
  updateCountry: async (id: number, payload: Partial<CountryRecord>) => {
    const response = await coreApi.put<ApiMutationResponse<CountryRecord>>(`/api/masters/countries/${id}/`, {
      ...payload,
      is_active: payload.status,
    });
    return unwrapMutation(response.data);
  },
  toggleCountry: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/countries/${id}/toggle/`, {});
    return response.data;
  },
  deleteCountry: async (id: number) => {
    await coreApi.delete(`/api/masters/countries/${id}/`);
  },
  listCountryOptions: async () => {
    const response = await coreApi.get<DRFPaginatedResponse<LookupOption> | DatatableResponse<LookupOption> | LookupOption[]>(
      "/api/masters/countries/dropdown/",
    );
    return normalizeListPayload(response.data);
  },

  listStates: async (params?: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<StateRecord> | DatatableResponse<StateRecord> | StateRecord[]>("/api/masters/states/", {
      params: params ? toQueryParams(params) : undefined,
    });
    const normalized = normalizePaginated(response.data);
    return normalized.items.map((record, index) => ({
      id: record.id,
      sno: params ? (params.page - 1) * params.pageSize + index + 1 : index + 1,
      country: record.country_name ?? "-",
      state_name: record.name,
      is_active: record.is_active,
    })) satisfies StateListRow[];
  },
  getState: async (id: number) => {
    const response = await coreApi.get<StateRecord>(`/api/masters/states/${id}/`);
    return response.data;
  },
  createState: async (payload: Partial<StateRecord>) => {
    const response = await coreApi.post<ApiMutationResponse<StateRecord>>("/api/masters/states/create/", payload);
    return unwrapMutation(response.data);
  },
  updateState: async (id: number, payload: Partial<StateRecord>) => {
    const response = await coreApi.put<ApiMutationResponse<StateRecord>>(`/api/masters/states/${id}/`, payload);
    return unwrapMutation(response.data);
  },
  toggleState: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/states/${id}/toggle/`, {});
    return response.data;
  },
  deleteState: async (id: number) => {
    await coreApi.delete(`/api/masters/states/${id}/`);
  },
  listStateLookup: async () => {
    const response = await coreApi.get<DRFPaginatedResponse<LookupOption> | DatatableResponse<LookupOption> | LookupOption[]>(
      "/api/masters/states/lookup/",
    );
    return normalizeListPayload(response.data);
  },
  listStatesByCountry: async (countryId: number) => {
    const response = await coreApi.get<DRFPaginatedResponse<LookupOption> | DatatableResponse<LookupOption> | LookupOption[]>(
      `/api/masters/states/by-country/${countryId}/`,
    );
    return normalizeListPayload(response.data);
  },

  listCities: async (params: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<CityRecord> | DatatableResponse<CityRecord>>("/api/masters/cities/list/", {
      params: toQueryParams(params),
    });
    const normalized = normalizePaginated(response.data);
    return {
      ...normalized,
      items: normalized.items.map((record, index) => ({
        id: record.id,
        sno: (params.page - 1) * params.pageSize + index + 1,
        city: record.name,
        state: record.state_name ?? "-",
        country: record.country_name ?? "-",
        pincode: record.pincode ?? "",
        status: record.is_active,
      })) satisfies CityListRow[],
    };
  },
  listCityRecords: async (params: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<CityRecord> | DatatableResponse<CityRecord>>("/api/masters/cities/", {
      params: toQueryParams(params),
    });
    return normalizePaginated(response.data);
  },
  listCityLookup: async (filters?: Record<string, string | number | boolean | null | undefined>) => {
    const response = await coreApi.get<DRFPaginatedResponse<LookupOption> | DatatableResponse<LookupOption> | LookupOption[]>(
      "/api/masters/cities/lookup/",
      { params: filters },
    );
    return normalizeListPayload(response.data);
  },
  getCity: async (id: number) => {
    const response = await coreApi.get<CityRecord>(`/api/masters/cities/${id}/`);
    return response.data;
  },
  createCity: async (payload: Partial<CityRecord>) => {
    const response = await coreApi.post<ApiMutationResponse<CityRecord>>("/api/masters/cities/create/", payload);
    return unwrapMutation(response.data);
  },
  updateCity: async (id: number, payload: Partial<CityRecord>) => {
    const response = await coreApi.put<ApiMutationResponse<CityRecord>>(`/api/masters/cities/${id}/`, payload);
    return unwrapMutation(response.data);
  },
  toggleCity: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/cities/${id}/toggle/`, {});
    return response.data;
  },
  deleteCity: async (id: number) => {
    await coreApi.delete(`/api/masters/cities/${id}/`);
  },
  listCityTypes: async () => {
    const response = await coreApi.get<DRFPaginatedResponse<CityTypeOption> | DatatableResponse<CityTypeOption> | CityTypeOption[]>(
      "/api/masters/cities/types/",
    );
    return normalizeListPayload(response.data);
  },

  listTaxes: async (params: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<TaxRecord> | DatatableResponse<TaxRecord>>("/api/masters/taxes/", {
      params: toQueryParams(params),
    });
    const normalized = normalizePaginated(response.data);
    return {
      ...normalized,
      items: normalized.items.map((record, index) => ({
        id: record.id,
        sno: (params.page - 1) * params.pageSize + index + 1,
        tax_name: record.name,
        tax_value: Number(record.value),
        country: record.country_name ?? "Global",
        status: record.is_active,
      })) satisfies TaxListRow[],
    };
  },
  getTax: async (id: number) => {
    const response = await coreApi.get<TaxRecord>(`/api/masters/taxes/${id}/`);
    return response.data;
  },
  createTax: async (payload: Partial<TaxRecord>) => {
    const response = await coreApi.post<ApiMutationResponse<TaxRecord>>("/api/masters/taxes/create/", payload);
    return unwrapMutation(response.data);
  },
  updateTax: async (id: number, payload: Partial<TaxRecord>) => {
    const response = await coreApi.put<ApiMutationResponse<TaxRecord>>(`/api/masters/taxes/${id}/`, payload);
    return unwrapMutation(response.data);
  },
  toggleTax: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/taxes/${id}/toggle/`, {});
    return response.data;
  },
  deleteTax: async (id: number) => {
    await coreApi.delete(`/api/masters/taxes/${id}/`);
  },

  listCurrencies: async (params: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<CurrencyRecord> | DatatableResponse<CurrencyRecord>>("/api/masters/currencies/", {
      params: toQueryParams(params),
    });
    return normalizePaginated(response.data);
  },
  getCurrency: async (id: number) => {
    const response = await coreApi.get<CurrencyRecord>(`/api/masters/currencies/${id}/`);
    return response.data;
  },
  createCurrency: async (payload: Partial<CurrencyRecord>) => {
    const response = await coreApi.post<ApiMutationResponse<CurrencyRecord>>("/api/masters/currencies/create/", payload);
    return unwrapMutation(response.data);
  },
  updateCurrency: async (id: number, payload: Partial<CurrencyRecord>) => {
    const response = await coreApi.put<ApiMutationResponse<CurrencyRecord>>(`/api/masters/currencies/${id}/`, payload);
    return unwrapMutation(response.data);
  },
  toggleCurrency: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/currencies/${id}/toggle/`, {});
    return response.data;
  },
  deleteCurrency: async (id: number) => {
    await coreApi.delete(`/api/masters/currencies/${id}/`);
  },
  listCurrencyOptions: async () => {
    const response = await coreApi.get<DRFPaginatedResponse<LookupOption> | DatatableResponse<LookupOption> | LookupOption[]>(
      "/api/masters/currencies/lookup/",
    );
    return normalizeListPayload(response.data);
  },

  listCustomers: async (params: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<CustomerRecord> | DatatableResponse<CustomerRecord>>("/api/masters/customers/", {
      params: toQueryParams(params),
    });
    return normalizePaginated(response.data);
  },
  getCustomer: async (id: number) => {
    const response = await coreApi.get<CustomerRecord>(`/api/masters/customers/${id}/`);
    return response.data;
  },
  createCustomer: async (payload: Partial<CustomerRecord>) => {
    const response = await coreApi.post<ApiMutationResponse<CustomerRecord>>("/api/masters/customers/create/", payload);
    return unwrapMutation(response.data);
  },
  updateCustomer: async (id: number, payload: Partial<CustomerRecord>) => {
    const response = await coreApi.put<ApiMutationResponse<CustomerRecord>>(`/api/masters/customers/${id}/`, payload);
    return unwrapMutation(response.data);
  },
  toggleCustomer: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/customers/${id}/toggle/`, {});
    return response.data;
  },
  deleteCustomer: async (id: number) => {
    await coreApi.delete(`/api/masters/customers/${id}/`);
  },
  listCustomerOptions: async () => {
    const response = await coreApi.get<DRFPaginatedResponse<LookupOption> | DatatableResponse<LookupOption> | LookupOption[]>(
      "/api/masters/customers/lookup/",
    );
    return normalizeListPayload(response.data);
  },
  listCustomerDocuments: async (customerId: number) => {
    const response = await coreApi.get<DRFPaginatedResponse<DocumentRecord> | DatatableResponse<DocumentRecord> | DocumentRecord[]>(
      "/api/masters/customer-documents/",
      { params: { customer: customerId, page_size: 200 } },
    );
    return normalizeListPayload(response.data);
  },
  createCustomerDocument: async (payload: Record<string, unknown>) => {
    const response = await coreApi.post<ApiMutationResponse<DocumentRecord>>(
      "/api/masters/customer-documents/",
      buildFormData(payload),
    );
    return unwrapMutation(response.data);
  },
  updateCustomerDocument: async (id: number, payload: Record<string, unknown>) => {
    const response = await coreApi.put<ApiMutationResponse<DocumentRecord>>(
      `/api/masters/customer-documents/${id}/`,
      buildFormData(payload),
    );
    return unwrapMutation(response.data);
  },
  toggleCustomerDocument: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/customer-documents/${id}/toggle/`, {});
    return response.data;
  },
  deleteCustomerDocument: async (id: number) => {
    await coreApi.delete(`/api/masters/customer-documents/${id}/`);
  },

  listSuppliers: async (params: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<SupplierRecord> | DatatableResponse<SupplierRecord>>("/api/masters/suppliers/", {
      params: toQueryParams(params),
    });
    return normalizePaginated(response.data);
  },
  getSupplier: async (id: number) => {
    const response = await coreApi.get<SupplierRecord>(`/api/masters/suppliers/${id}/`);
    return response.data;
  },
  createSupplier: async (payload: Partial<SupplierRecord>) => {
    const response = await coreApi.post<ApiMutationResponse<SupplierRecord>>("/api/masters/suppliers/create/", payload);
    return unwrapMutation(response.data);
  },
  updateSupplier: async (id: number, payload: Partial<SupplierRecord>) => {
    const response = await coreApi.put<ApiMutationResponse<SupplierRecord>>(`/api/masters/suppliers/${id}/`, payload);
    return unwrapMutation(response.data);
  },
  toggleSupplier: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/suppliers/${id}/toggle/`, {});
    return response.data;
  },
  deleteSupplier: async (id: number) => {
    await coreApi.delete(`/api/masters/suppliers/${id}/`);
  },
  listSupplierOptions: async () => {
    const response = await coreApi.get<DRFPaginatedResponse<LookupOption> | DatatableResponse<LookupOption> | LookupOption[]>(
      "/api/masters/suppliers/lookup/",
    );
    return normalizeListPayload(response.data);
  },
  listSupplierDocuments: async (supplierId: number) => {
    const response = await coreApi.get<DRFPaginatedResponse<DocumentRecord> | DatatableResponse<DocumentRecord> | DocumentRecord[]>(
      "/api/masters/supplier-documents/",
      { params: { supplier: supplierId, page_size: 200 } },
    );
    return normalizeListPayload(response.data);
  },
  createSupplierDocument: async (payload: Record<string, unknown>) => {
    const response = await coreApi.post<ApiMutationResponse<DocumentRecord>>(
      "/api/masters/supplier-documents/",
      buildFormData(payload),
    );
    return unwrapMutation(response.data);
  },
  updateSupplierDocument: async (id: number, payload: Record<string, unknown>) => {
    const response = await coreApi.put<ApiMutationResponse<DocumentRecord>>(
      `/api/masters/supplier-documents/${id}/`,
      buildFormData(payload),
    );
    return unwrapMutation(response.data);
  },
  toggleSupplierDocument: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/supplier-documents/${id}/toggle/`, {});
    return response.data;
  },
  deleteSupplierDocument: async (id: number) => {
    await coreApi.delete(`/api/masters/supplier-documents/${id}/`);
  },

  listCompanies: async (params: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<CompanyRecord> | DatatableResponse<CompanyRecord>>("/api/masters/company/", {
      params: toQueryParams(params),
    });
    const normalized = normalizePaginated(response.data);
    return {
      ...normalized,
      items: normalized.items.map((record, index) => ({
        id: record.id,
        sno: (params.page - 1) * params.pageSize + index + 1,
        company_name: record.name,
        company_code: record.code,
        state: record.state_name ?? "",
        city: record.city_name ?? "",
        pincode: record.pincode ?? "",
        latitude: record.latitude ?? "",
        longitude: record.longitude ?? "",
        logo: record.logo_url ?? "",
        document: record.document_url ?? "",
        status: record.is_active ? "Active" : "Inactive",
      })) satisfies CompanyListRow[],
    };
  },
  getCompany: async (id: number) => {
    const response = await coreApi.get<CompanyRecord>(`/api/masters/company/${id}/`);
    return response.data;
  },
  createCompany: async (payload: FormData | Record<string, unknown>) => {
    const response = await coreApi.post<ApiMutationResponse<CompanyRecord>>(
      "/api/masters/company/create/",
      payload instanceof FormData ? payload : buildFormData(payload),
    );
    return unwrapMutation(response.data);
  },
  updateCompany: async (id: number, payload: FormData | Record<string, unknown>) => {
    const response = await coreApi.put<ApiMutationResponse<CompanyRecord>>(
      `/api/masters/company/${id}/`,
      payload instanceof FormData ? payload : buildFormData(payload),
    );
    return unwrapMutation(response.data);
  },
  toggleCompany: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/company/${id}/toggle/`, {});
    return response.data;
  },
  deleteCompany: async (id: number) => {
    await coreApi.delete(`/api/masters/company/${id}/`);
  },
  listCompanyLookup: async () => {
    const response = await coreApi.get<DRFPaginatedResponse<CompanyLookup> | DatatableResponse<CompanyLookup> | CompanyLookup[]>(
      "/api/masters/companies/lookup/",
    );
    return normalizeListPayload(response.data);
  },

  listProjects: async (params: TableParams) => {
    const response = await coreApi.get<DRFPaginatedResponse<ProjectRecord> | DatatableResponse<ProjectRecord>>("/api/masters/projects/", {
      params: toQueryParams(params),
    });
    const normalized = normalizePaginated(response.data);
    return {
      ...normalized,
      items: normalized.items.map((record, index) => ({
        id: record.id,
        sno: (params.page - 1) * params.pageSize + index + 1,
        company_name: record.company_name ?? "-",
        project_name: record.name,
        project_code: record.code,
        client_name: record.client_name ?? "",
        application_type: record.application_type_name ?? "",
        capacity: record.capacity ?? "",
        state: record.state_name ?? "",
        city: record.city_name ?? "",
        contact_person: record.contact_person ?? "",
        contact_number: record.contact_number ?? "",
        status: record.is_active ? "Active" : "Inactive",
      })) satisfies ProjectListRow[],
    };
  },
  getProject: async (id: number) => {
    const response = await coreApi.get<ProjectRecord>(`/api/masters/projects/${id}/`);
    return response.data;
  },
  createProject: async (payload: Partial<ProjectRecord>) => {
    const response = await coreApi.post<ApiMutationResponse<ProjectRecord>>("/api/masters/projects/create/", payload);
    return unwrapMutation(response.data);
  },
  updateProject: async (id: number, payload: Partial<ProjectRecord>) => {
    const response = await coreApi.put<ApiMutationResponse<ProjectRecord>>(`/api/masters/projects/${id}/`, payload);
    return unwrapMutation(response.data);
  },
  toggleProject: async (id: number) => {
    const response = await coreApi.patch(`/api/masters/projects/${id}/toggle/`, {});
    return response.data;
  },
  deleteProject: async (id: number) => {
    await coreApi.delete(`/api/masters/projects/${id}/`);
  },
  listApplicationTypes: async () => {
    const response = await coreApi.get<DRFPaginatedResponse<LookupOption> | DatatableResponse<LookupOption> | LookupOption[]>(
      "/api/masters/projects/application-types/",
    );
    return normalizeListPayload(response.data);
  },
};
