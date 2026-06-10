import { ADMIN_MASTERS_ROUTE } from "@/features/admin-master/utils/routes";
import { BLENDING_ROUTE, BLENDING_STOCK_ROUTE, BLENDING_STORE_REQUEST_ROUTE, BLENDING_TRANSACTIONS_ROUTE } from "@/features/blending/utils/routes";
import { COMMON_MASTERS_ROUTE } from "@/features/common-master/utils/routes";
import { DEVICE_LABEL_MASTERS_ROUTE } from "@/features/device-label-masters/utils/routes";
import { GRN_PROCESS_ROUTE, GRN_ROUTE, GRN_STATUS_ROUTE } from "@/features/grn/utils/routes";
import { INVENTORY_ROUTE, PRODUCTION_INVENTORY_ROUTE, STORE_INVENTORY_ROUTE } from "@/features/items/utils/routes";
import { PRODUCTION_MASTERS_ROUTE } from "@/features/production-masters/utils/routes";
import { PRODUCTION_AD_WEIGHTAGE_ROUTE, PRODUCTION_BL_BLENDING_ROUTE, PRODUCTION_GL_GRANULATION_ROUTE, PRODUCTION_PR_PRODUCTION_ROUTE, PRODUCTION_ROUTE } from "@/features/production/utils/routes";
import { REQUESTS_ROUTE, REQUESTS_STORE_REQUEST_ROUTE } from "@/features/requests/utils/routes";
import { RECIPE_BOM_MASTERS_ROUTE } from "@/features/recipe-bom-masters/utils/routes";
import { STORE_REQUEST_ROUTE, STORE_ROUTE, STORE_STOCK_ROUTE, STORE_TRANSACTIONS_ROUTE } from "@/features/store/utils/routes";
import {
  INVENTORY_STORE_MASTERS_ROUTE,
  WPE_ITEM_VARIANTS_ROUTE,
  WPE_PRODUCT_SUBTYPES_ROUTE,
  WPE_PRODUCT_TYPES_ROUTE,
} from "@/features/wpe-masters/constants";

export const DASHBOARD_SCREEN_CODES = ["dashboard-home"] as const;

export const ADMIN_SCREEN_CODES = {
  mainScreens: ["main-screen-master"] as const,
  screenSections: ["screen-section-master"] as const,
  userScreens: ["user-screen-master"] as const,
  departments: ["department-master"] as const,
  designations: ["designation-master"] as const,
  staffCreation: ["staff-creation-master"] as const,
  roles: ["role-master"] as const,
  userTypeMapping: ["user-type-master"] as const,
  userCreation: ["user-account-master", "user-creation-master"] as const,
  userTypePermissions: ["user-permission-master", "user-screen-permission-master"] as const,
};

export const WORKSPACE_SCREEN_CODES = {
  storeInventory: ["inventory-store-inventory-workspace"] as const,
  productionInventory: ["inventory-production-inventory-workspace"] as const,
  blendingStock: ["blending-stock-workspace"] as const,
  requestsStoreRequest: [
    "requests-store-request-workspace",
    "store-request",
    "blending-store-request-workspace",
  ] as const,
  blendingTransactions: ["blending-transactions-workspace"] as const,
  productionAdWeightage: ["production-ad-weightage-workspace"] as const,
  productionBlBlending: ["production-bl-blending-workspace"] as const,
  productionGlGranulation: ["production-gl-granulation-workspace"] as const,
  productionPrProduction: ["production-pr-production-workspace"] as const,
  storeStock: ["store-stock-workspace"] as const,
  storeRequest: ["store-request-workspace"] as const,
  storeTransactions: ["store-transactions-workspace"] as const,
  grnProcess: ["grn-process-workspace"] as const,
  grnStatus: ["grn-status-workspace"] as const,
  contacts: ["contacts-workspace"] as const,
  regrind: ["regrind-workspace"] as const,
};

export const COMMON_MASTER_SCREEN_CODES = {
  continents: ["continent-master"] as const,
  countries: ["country-master"] as const,
  states: ["state-master"] as const,
  cities: ["city-master"] as const,
  taxes: ["tax-master"] as const,
  currencies: ["currency-master"] as const,
  customers: ["customer-master"] as const,
  suppliers: ["supplier-master"] as const,
  companies: ["company-master"] as const,
};

export const INVENTORY_STORE_MASTER_SCREEN_CODES = {
  productTypes: ["wpe-product-type-master"] as const,
  productSubtypes: ["wpe-product-subtype-master"] as const,
  units: ["unit-master"] as const,
  itemCreations: ["item-creation-master"] as const,
  stores: ["store-master"] as const,
  warehouses: ["warehouse-master"] as const,
  locations: ["location-master"] as const,
  productionTypes: ["production-type-master"] as const,
  saleTypes: ["sale-type-master"] as const,
  purchaseTypes: ["purchase-type-master"] as const,
};

export const INVENTORY_STORE_ITEM_HIERARCHY_SCREEN_CODES = [
  ...INVENTORY_STORE_MASTER_SCREEN_CODES.productTypes,
  ...INVENTORY_STORE_MASTER_SCREEN_CODES.productSubtypes,
  ...INVENTORY_STORE_MASTER_SCREEN_CODES.itemCreations,
] as const;

export const PRODUCTION_MASTER_SCREEN_CODES = {
  profileCreations: ["profile-creation-master"] as const,
  profileSizes: ["profile-size-master"] as const,
  colorCreations: ["color-creation-master"] as const,
  machineCreations: ["machine-creation-master"] as const,
  workCentreCreations: ["work-centre-creation-master"] as const,
  productionLines: ["production-line-master"] as const,
  binCreations: ["bin-creation-master"] as const,
  bagCreations: ["bag-creation-master"] as const,
  packingTypes: ["packing-type-master"] as const,
  packingMaterials: ["packing-material-master"] as const,
};

export const RECIPE_BOM_MASTER_SCREEN_CODES = {
  recipeCreations: ["recipe-creation-master"] as const,
  recipeItemCreations: ["recipe-item-creation-master"] as const,
  bomCreations: ["bom-creation-master"] as const,
  bomItemCreations: ["bom-item-creation-master"] as const,
};

export const DEVICE_LABEL_MASTER_SCREEN_CODES = {
  weighmentScaleCreations: ["weighment-scale-master"] as const,
  printerCreations: ["printer-master"] as const,
  qrLabelTemplates: ["qr-label-template-master"] as const,
  serialPortConfigurations: ["serial-port-configuration-master"] as const,
};

const uniqueCodes = (...groups: ReadonlyArray<readonly string[]>) =>
  Array.from(new Set(groups.flatMap((group) => group))) as string[];

export const WORKSPACE_GROUP_SCREEN_CODES = {
  inventory: uniqueCodes(WORKSPACE_SCREEN_CODES.storeInventory, WORKSPACE_SCREEN_CODES.productionInventory),
  blending: uniqueCodes(WORKSPACE_SCREEN_CODES.blendingStock, WORKSPACE_SCREEN_CODES.blendingTransactions),
  requests: uniqueCodes(WORKSPACE_SCREEN_CODES.requestsStoreRequest),
  production: uniqueCodes(
    WORKSPACE_SCREEN_CODES.productionAdWeightage,
    WORKSPACE_SCREEN_CODES.productionBlBlending,
    WORKSPACE_SCREEN_CODES.productionGlGranulation,
    WORKSPACE_SCREEN_CODES.productionPrProduction,
  ),
  store: uniqueCodes(
    WORKSPACE_SCREEN_CODES.storeStock,
    WORKSPACE_SCREEN_CODES.storeRequest,
    WORKSPACE_SCREEN_CODES.storeTransactions,
  ),
  grn: uniqueCodes(WORKSPACE_SCREEN_CODES.grnProcess, WORKSPACE_SCREEN_CODES.grnStatus),
  contacts: uniqueCodes(WORKSPACE_SCREEN_CODES.contacts),
  regrind: uniqueCodes(WORKSPACE_SCREEN_CODES.regrind),
};

export const MASTER_GROUP_SCREEN_CODES = {
  admin: uniqueCodes(
    ADMIN_SCREEN_CODES.mainScreens,
    ADMIN_SCREEN_CODES.screenSections,
    ADMIN_SCREEN_CODES.userScreens,
    ADMIN_SCREEN_CODES.departments,
    ADMIN_SCREEN_CODES.designations,
    ADMIN_SCREEN_CODES.staffCreation,
    ADMIN_SCREEN_CODES.roles,
    ADMIN_SCREEN_CODES.userTypeMapping,
    ADMIN_SCREEN_CODES.userCreation,
    ADMIN_SCREEN_CODES.userTypePermissions,
  ),
  common: uniqueCodes(
    COMMON_MASTER_SCREEN_CODES.continents,
    COMMON_MASTER_SCREEN_CODES.countries,
    COMMON_MASTER_SCREEN_CODES.states,
    COMMON_MASTER_SCREEN_CODES.cities,
    COMMON_MASTER_SCREEN_CODES.taxes,
    COMMON_MASTER_SCREEN_CODES.currencies,
    COMMON_MASTER_SCREEN_CODES.customers,
    COMMON_MASTER_SCREEN_CODES.suppliers,
    COMMON_MASTER_SCREEN_CODES.companies,
  ),
  inventoryStore: uniqueCodes(
    INVENTORY_STORE_MASTER_SCREEN_CODES.productTypes,
    INVENTORY_STORE_MASTER_SCREEN_CODES.productSubtypes,
    INVENTORY_STORE_MASTER_SCREEN_CODES.units,
    INVENTORY_STORE_MASTER_SCREEN_CODES.itemCreations,
    INVENTORY_STORE_MASTER_SCREEN_CODES.stores,
    INVENTORY_STORE_MASTER_SCREEN_CODES.warehouses,
    INVENTORY_STORE_MASTER_SCREEN_CODES.locations,
    INVENTORY_STORE_MASTER_SCREEN_CODES.productionTypes,
    INVENTORY_STORE_MASTER_SCREEN_CODES.saleTypes,
    INVENTORY_STORE_MASTER_SCREEN_CODES.purchaseTypes,
  ),
  production: uniqueCodes(
    PRODUCTION_MASTER_SCREEN_CODES.profileCreations,
    PRODUCTION_MASTER_SCREEN_CODES.profileSizes,
    PRODUCTION_MASTER_SCREEN_CODES.colorCreations,
    PRODUCTION_MASTER_SCREEN_CODES.machineCreations,
    PRODUCTION_MASTER_SCREEN_CODES.workCentreCreations,
    PRODUCTION_MASTER_SCREEN_CODES.productionLines,
    PRODUCTION_MASTER_SCREEN_CODES.binCreations,
    PRODUCTION_MASTER_SCREEN_CODES.bagCreations,
    PRODUCTION_MASTER_SCREEN_CODES.packingTypes,
    PRODUCTION_MASTER_SCREEN_CODES.packingMaterials,
  ),
  recipeBom: uniqueCodes(
    RECIPE_BOM_MASTER_SCREEN_CODES.recipeCreations,
    RECIPE_BOM_MASTER_SCREEN_CODES.recipeItemCreations,
    RECIPE_BOM_MASTER_SCREEN_CODES.bomCreations,
    RECIPE_BOM_MASTER_SCREEN_CODES.bomItemCreations,
  ),
  deviceLabel: uniqueCodes(
    DEVICE_LABEL_MASTER_SCREEN_CODES.weighmentScaleCreations,
    DEVICE_LABEL_MASTER_SCREEN_CODES.printerCreations,
    DEVICE_LABEL_MASTER_SCREEN_CODES.qrLabelTemplates,
    DEVICE_LABEL_MASTER_SCREEN_CODES.serialPortConfigurations,
  ),
};

export const routeScreenCodeMap: Record<string, readonly string[]> = {
  "/app": DASHBOARD_SCREEN_CODES,
  "/app/dashboard": DASHBOARD_SCREEN_CODES,
  "/dashboard": DASHBOARD_SCREEN_CODES,
  [STORE_INVENTORY_ROUTE]: WORKSPACE_SCREEN_CODES.storeInventory,
  [PRODUCTION_INVENTORY_ROUTE]: WORKSPACE_SCREEN_CODES.productionInventory,
  [BLENDING_STOCK_ROUTE]: WORKSPACE_SCREEN_CODES.blendingStock,
  [BLENDING_STORE_REQUEST_ROUTE]: WORKSPACE_SCREEN_CODES.requestsStoreRequest,
  [BLENDING_TRANSACTIONS_ROUTE]: WORKSPACE_SCREEN_CODES.blendingTransactions,
  [PRODUCTION_AD_WEIGHTAGE_ROUTE]: WORKSPACE_SCREEN_CODES.productionAdWeightage,
  [PRODUCTION_BL_BLENDING_ROUTE]: WORKSPACE_SCREEN_CODES.productionBlBlending,
  [PRODUCTION_GL_GRANULATION_ROUTE]: WORKSPACE_SCREEN_CODES.productionGlGranulation,
  [PRODUCTION_PR_PRODUCTION_ROUTE]: WORKSPACE_SCREEN_CODES.productionPrProduction,
  [REQUESTS_STORE_REQUEST_ROUTE]: WORKSPACE_SCREEN_CODES.requestsStoreRequest,
  [STORE_STOCK_ROUTE]: WORKSPACE_SCREEN_CODES.storeStock,
  [STORE_REQUEST_ROUTE]: WORKSPACE_SCREEN_CODES.storeRequest,
  [STORE_TRANSACTIONS_ROUTE]: WORKSPACE_SCREEN_CODES.storeTransactions,
  [GRN_PROCESS_ROUTE]: WORKSPACE_SCREEN_CODES.grnProcess,
  [GRN_STATUS_ROUTE]: WORKSPACE_SCREEN_CODES.grnStatus,
  "/app/contacts": WORKSPACE_SCREEN_CODES.contacts,
  "/app/regrind": WORKSPACE_SCREEN_CODES.regrind,
  [ADMIN_MASTERS_ROUTE]: MASTER_GROUP_SCREEN_CODES.admin,
  "/admin/main-screens": ADMIN_SCREEN_CODES.mainScreens,
  "/admin/screen-sections": ADMIN_SCREEN_CODES.screenSections,
  "/admin/user-screens": ADMIN_SCREEN_CODES.userScreens,
  "/wpe-masters/departments": ADMIN_SCREEN_CODES.departments,
  "/wpe-masters/designations": ADMIN_SCREEN_CODES.designations,
  "/admin/staff-creation": ADMIN_SCREEN_CODES.staffCreation,
  "/wpe-masters/roles": ADMIN_SCREEN_CODES.roles,
  "/admin/user-types": ADMIN_SCREEN_CODES.userTypeMapping,
  "/admin/user-creation": ADMIN_SCREEN_CODES.userCreation,
  "/admin/user-screen-permission": ADMIN_SCREEN_CODES.userTypePermissions,
  [COMMON_MASTERS_ROUTE]: MASTER_GROUP_SCREEN_CODES.common,
  "/masters/continents": COMMON_MASTER_SCREEN_CODES.continents,
  "/masters/countries": COMMON_MASTER_SCREEN_CODES.countries,
  "/masters/states": COMMON_MASTER_SCREEN_CODES.states,
  "/masters/cities": COMMON_MASTER_SCREEN_CODES.cities,
  "/masters/taxes": COMMON_MASTER_SCREEN_CODES.taxes,
  "/masters/currencies": COMMON_MASTER_SCREEN_CODES.currencies,
  "/masters/customers": COMMON_MASTER_SCREEN_CODES.customers,
  "/masters/suppliers": COMMON_MASTER_SCREEN_CODES.suppliers,
  "/masters/companies": COMMON_MASTER_SCREEN_CODES.companies,
  [INVENTORY_STORE_MASTERS_ROUTE]: MASTER_GROUP_SCREEN_CODES.inventoryStore,
  [WPE_PRODUCT_TYPES_ROUTE]: INVENTORY_STORE_ITEM_HIERARCHY_SCREEN_CODES,
  [WPE_PRODUCT_SUBTYPES_ROUTE]: INVENTORY_STORE_MASTER_SCREEN_CODES.productSubtypes,
  [WPE_ITEM_VARIANTS_ROUTE]: INVENTORY_STORE_MASTER_SCREEN_CODES.itemCreations,
  "/wpe-masters/units": INVENTORY_STORE_MASTER_SCREEN_CODES.units,
  "/wpe-masters/item-creations": INVENTORY_STORE_MASTER_SCREEN_CODES.itemCreations,
  "/wpe-masters/stores": INVENTORY_STORE_MASTER_SCREEN_CODES.stores,
  "/wpe-masters/warehouses": INVENTORY_STORE_MASTER_SCREEN_CODES.warehouses,
  "/wpe-masters/locations": INVENTORY_STORE_MASTER_SCREEN_CODES.locations,
  "/wpe-masters/production-types": INVENTORY_STORE_MASTER_SCREEN_CODES.productionTypes,
  "/wpe-masters/sale-types": INVENTORY_STORE_MASTER_SCREEN_CODES.saleTypes,
  "/wpe-masters/purchase-types": INVENTORY_STORE_MASTER_SCREEN_CODES.purchaseTypes,
  [PRODUCTION_MASTERS_ROUTE]: MASTER_GROUP_SCREEN_CODES.production,
  [`${PRODUCTION_MASTERS_ROUTE}/profile-creations`]: PRODUCTION_MASTER_SCREEN_CODES.profileCreations,
  [`${PRODUCTION_MASTERS_ROUTE}/profile-sizes`]: PRODUCTION_MASTER_SCREEN_CODES.profileSizes,
  [`${PRODUCTION_MASTERS_ROUTE}/color-creations`]: PRODUCTION_MASTER_SCREEN_CODES.colorCreations,
  [`${PRODUCTION_MASTERS_ROUTE}/machine-creations`]: PRODUCTION_MASTER_SCREEN_CODES.machineCreations,
  [`${PRODUCTION_MASTERS_ROUTE}/work-centre-creations`]: PRODUCTION_MASTER_SCREEN_CODES.workCentreCreations,
  [`${PRODUCTION_MASTERS_ROUTE}/production-lines`]: PRODUCTION_MASTER_SCREEN_CODES.productionLines,
  [`${PRODUCTION_MASTERS_ROUTE}/bin-creations`]: PRODUCTION_MASTER_SCREEN_CODES.binCreations,
  [`${PRODUCTION_MASTERS_ROUTE}/bag-creations`]: PRODUCTION_MASTER_SCREEN_CODES.bagCreations,
  [`${PRODUCTION_MASTERS_ROUTE}/packing-types`]: PRODUCTION_MASTER_SCREEN_CODES.packingTypes,
  [`${PRODUCTION_MASTERS_ROUTE}/packing-materials`]: PRODUCTION_MASTER_SCREEN_CODES.packingMaterials,
  [RECIPE_BOM_MASTERS_ROUTE]: MASTER_GROUP_SCREEN_CODES.recipeBom,
  [`${RECIPE_BOM_MASTERS_ROUTE}/recipe-creations`]: RECIPE_BOM_MASTER_SCREEN_CODES.recipeCreations,
  [`${RECIPE_BOM_MASTERS_ROUTE}/recipe-item-creations`]: RECIPE_BOM_MASTER_SCREEN_CODES.recipeItemCreations,
  [`${RECIPE_BOM_MASTERS_ROUTE}/bom-creations`]: RECIPE_BOM_MASTER_SCREEN_CODES.bomCreations,
  [`${RECIPE_BOM_MASTERS_ROUTE}/bom-item-creations`]: RECIPE_BOM_MASTER_SCREEN_CODES.bomItemCreations,
  [DEVICE_LABEL_MASTERS_ROUTE]: MASTER_GROUP_SCREEN_CODES.deviceLabel,
  [`${DEVICE_LABEL_MASTERS_ROUTE}/weighment-scale-creations`]: DEVICE_LABEL_MASTER_SCREEN_CODES.weighmentScaleCreations,
  [`${DEVICE_LABEL_MASTERS_ROUTE}/printer-creations`]: DEVICE_LABEL_MASTER_SCREEN_CODES.printerCreations,
  [`${DEVICE_LABEL_MASTERS_ROUTE}/qr-label-templates`]: DEVICE_LABEL_MASTER_SCREEN_CODES.qrLabelTemplates,
  [`${DEVICE_LABEL_MASTERS_ROUTE}/serial-port-configurations`]: DEVICE_LABEL_MASTER_SCREEN_CODES.serialPortConfigurations,
};

export const getRouteScreenCodes = (path: string) => routeScreenCodeMap[path] ?? [];

const screenCodeRoutePathMap = {
  ...Object.entries(routeScreenCodeMap).reduce<Record<string, string>>((acc, [path, codes]) => {
    for (const code of codes) {
      acc[code] = path;
    }
    return acc;
  }, {}),
  "dashboard-home": "/app/dashboard",
  "item-creation-master": WPE_PRODUCT_TYPES_ROUTE,
  "requests-store-request-workspace": REQUESTS_STORE_REQUEST_ROUTE,
  "store-request": REQUESTS_STORE_REQUEST_ROUTE,
  "blending-store-request-workspace": REQUESTS_STORE_REQUEST_ROUTE,
};

export const getRoutePathForScreenCode = (screenCode: string, backendRoutePath?: string | null) => {
  if (backendRoutePath && backendRoutePath.trim().startsWith("/")) {
    return backendRoutePath.trim();
  }

  return screenCodeRoutePathMap[screenCode] ?? "/dashboard";
};

export const appRouteScreenCodeGroups = {
  dashboard: DASHBOARD_SCREEN_CODES,
  inventoryWorkspace: WORKSPACE_GROUP_SCREEN_CODES.inventory,
  blendingWorkspace: WORKSPACE_GROUP_SCREEN_CODES.blending,
  requestsWorkspace: WORKSPACE_GROUP_SCREEN_CODES.requests,
  productionWorkspace: WORKSPACE_GROUP_SCREEN_CODES.production,
  storeWorkspace: WORKSPACE_GROUP_SCREEN_CODES.store,
  grnWorkspace: WORKSPACE_GROUP_SCREEN_CODES.grn,
  contactsWorkspace: WORKSPACE_GROUP_SCREEN_CODES.contacts,
  regrindWorkspace: WORKSPACE_GROUP_SCREEN_CODES.regrind,
  adminMasters: MASTER_GROUP_SCREEN_CODES.admin,
  commonMasters: MASTER_GROUP_SCREEN_CODES.common,
  inventoryStoreMasters: MASTER_GROUP_SCREEN_CODES.inventoryStore,
  productionMasters: MASTER_GROUP_SCREEN_CODES.production,
  recipeBomMasters: MASTER_GROUP_SCREEN_CODES.recipeBom,
  deviceLabelMasters: MASTER_GROUP_SCREEN_CODES.deviceLabel,
};

export const appRoutePaths = {
  dashboard: "/app/dashboard",
  blendingRoot: BLENDING_ROUTE,
  inventoryRoot: INVENTORY_ROUTE,
  productionRoot: PRODUCTION_ROUTE,
  requestsRoot: REQUESTS_ROUTE,
  storeRoot: STORE_ROUTE,
  grnRoot: GRN_ROUTE,
};
