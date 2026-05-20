import type { ReactNode } from "react";

export type PanelSize = "sm" | "md" | "lg" | "xl";

export type PanelConfig = {
  title: string;
  description?: string;
  size?: PanelSize;
  stickyFooter?: boolean;
};

export type FilterConfig = {
  id: string;
  label: string;
  content: ReactNode;
};

export type FormFieldConfig = {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
};

export type CrudPageConfig = {
  title: string;
  description?: string;
  searchPlaceholder?: string;
  createLabel?: string;
  panel?: PanelConfig;
  filters?: FilterConfig[];
};

export type PermissionMatrixColumn<TKey extends string = string> = {
  key: TKey;
  label: string;
  shortLabel: string;
  kind: "radio-all" | "radio-self" | "checkbox" | "toggle";
};

export type PermissionMatrixConfig<TRow, TKey extends string = string> = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  columns: Array<PermissionMatrixColumn<TKey>>;
  getRowKey: (row: TRow) => string | number;
  getRowLabel: (row: TRow) => string;
  getRowSecondaryLabel?: (row: TRow) => string | null | undefined;
};

export type RouteMeta = {
  path: string;
  title: string;
  navLabel?: string;
  section?: string;
  screenCode?: string;
  guardAction?: "add" | "update" | "list" | "delete" | "view" | "print";
};
