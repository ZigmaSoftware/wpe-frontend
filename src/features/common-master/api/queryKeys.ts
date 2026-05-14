export const commonMasterKeys = {
  continents: (search: string) => ["common-masters", "continents", search] as const,
  countries: (page: number, pageSize: number, search: string, filters?: string) =>
    ["common-masters", "countries", page, pageSize, search, filters] as const,
  states: (page?: number, pageSize?: number, search?: string, filters?: string) =>
    ["common-masters", "states", page, pageSize, search, filters] as const,
  cities: (page: number, pageSize: number, search: string, filters?: string) =>
    ["common-masters", "cities", page, pageSize, search, filters] as const,
  taxes: (page: number, pageSize: number, search: string, filters?: string) =>
    ["common-masters", "taxes", page, pageSize, search, filters] as const,
  currencies: (page: number, pageSize: number, search: string, filters?: string) =>
    ["common-masters", "currencies", page, pageSize, search, filters] as const,
  customers: (page: number, pageSize: number, search: string, filters?: string) =>
    ["common-masters", "customers", page, pageSize, search, filters] as const,
  customer: (id: string | number) => ["common-masters", "customer", id] as const,
  customerDocuments: (customerId: string | number) => ["common-masters", "customer-documents", customerId] as const,
  suppliers: (page: number, pageSize: number, search: string, filters?: string) =>
    ["common-masters", "suppliers", page, pageSize, search, filters] as const,
  supplier: (id: string | number) => ["common-masters", "supplier", id] as const,
  supplierDocuments: (supplierId: string | number) => ["common-masters", "supplier-documents", supplierId] as const,
  companies: (page: number, pageSize: number, search: string, filters?: string) =>
    ["common-masters", "companies", page, pageSize, search, filters] as const,
  company: (id: string | number) => ["common-masters", "company", id] as const,
  projects: (page: number, pageSize: number, search: string, filters?: string) =>
    ["common-masters", "projects", page, pageSize, search, filters] as const,
  project: (id: string | number) => ["common-masters", "project", id] as const,
  lookup: (name: string, parent?: string | number | null) => ["common-masters", "lookup", name, parent] as const,
};
