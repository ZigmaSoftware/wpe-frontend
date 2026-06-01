import {
  Building2,
  Globe2,
  Landmark,
  Map,
  MapPinned,
  PackageSearch,
  ReceiptText,
  Users,
  type LucideIcon,
} from "lucide-react";

export const COMMON_MASTERS_ROUTE = "/masters/common-masters";

export type CommonModuleDefinition = {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
};

export const commonModuleDefinitions: CommonModuleDefinition[] = [
  {
    to: "/masters/continents",
    icon: Globe2,
    label: "Continent",
    description: "Manage continent master records.",
  },
  {
    to: "/masters/countries",
    icon: Map,
    label: "Country",
    description: "Manage countries and currency mapping.",
  },
  {
    to: "/masters/states",
    icon: MapPinned,
    label: "State",
    description: "Manage states mapped to countries.",
  },
  {
    to: "/masters/cities",
    icon: Landmark,
    label: "City",
    description: "Manage cities, pincodes, and city types.",
  },
  {
    to: "/masters/taxes",
    icon: ReceiptText,
    label: "Tax",
    description: "Configure tax percentages by country.",
  },
  {
    to: "/masters/currencies",
    icon: ReceiptText,
    label: "Currency",
    description: "Manage currency names, symbols, and country mapping.",
  },
  {
    to: "/masters/customers",
    icon: Users,
    label: "Customer Creations",
    description: "Create and maintain customer master records.",
  },
  {
    to: "/masters/suppliers",
    icon: PackageSearch,
    label: "Supplier Creations",
    description: "Create and maintain supplier master records.",
  },
  {
    to: "/masters/companies",
    icon: Building2,
    label: "Company",
    description: "Manage company profile and statutory information.",
  },
];
