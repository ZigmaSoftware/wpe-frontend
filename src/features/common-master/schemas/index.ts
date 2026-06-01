import { z } from "zod";

const optionalString = () => z.string().trim().optional().or(z.literal("")).nullable();
const optionalEmail = () => z.string().email("Enter a valid email.").optional().or(z.literal("")).nullable();
const optionalUrl = () => z.string().url("Enter a valid URL.").optional().or(z.literal("")).nullable();
const optionalNumberId = () => z.coerce.number().optional().nullable();

const mobileRegex = /^[6-9]\d{9}$/;
const phoneRegex = /^[0-9+\-() ]{7,15}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const swiftRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/i;
const pincodeRegex = /^[1-9][0-9]{5}$/;

const optionalMobile = () =>
  z.string().trim().optional().or(z.literal("")).nullable().refine((value) => !value || mobileRegex.test(value), "Enter a valid mobile number.");
const optionalPhone = () =>
  z.string().trim().optional().or(z.literal("")).nullable().refine((value) => !value || phoneRegex.test(value), "Enter a valid phone number.");
const optionalPincode = () =>
  z.string().trim().optional().or(z.literal("")).nullable().refine((value) => !value || pincodeRegex.test(value), "Enter a valid pincode.");
const requiredPincode = () =>
  z.string().trim().min(1, "Pincode is required.").refine((value) => pincodeRegex.test(value), "Enter a valid pincode.");
const optionalPan = () =>
  z.string().trim().toUpperCase().optional().or(z.literal("")).nullable().refine((value) => !value || panRegex.test(value), "Enter a valid PAN.");
const optionalGst = () =>
  z.string().trim().toUpperCase().optional().or(z.literal("")).nullable().refine((value) => !value || gstRegex.test(value), "Enter a valid GST number.");
const optionalIfsc = () =>
  z.string().trim().toUpperCase().optional().or(z.literal("")).nullable().refine((value) => !value || ifscRegex.test(value), "Enter a valid IFSC code.");
const optionalSwift = () =>
  z.string().trim().toUpperCase().optional().or(z.literal("")).nullable().refine((value) => !value || swiftRegex.test(value), "Enter a valid SWIFT code.");

const optionalFile = z.instanceof(File).optional().nullable();

const addressSchema = z.object({
  same_as_billing: z.boolean().default(false),
  name: optionalString(),
  address: optionalString(),
  country: optionalNumberId(),
  state: optionalNumberId(),
  city: optionalNumberId(),
  pincode: optionalPincode(),
  contact_name: optionalString(),
  contact_no: optionalPhone(),
  gst_number: optionalGst(),
  gst_status: z.enum(["registered", "unregistered", "provisional"]).default("unregistered"),
  ecc_no: optionalString(),
}).superRefine((values, ctx) => {
  if (values.same_as_billing) {
    return;
  }
  if (!values.name) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["name"], message: "Address name is required." });
  }
  if (values.state && !values.country) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["country"], message: "Country is required before selecting a state." });
  }
  if (values.city && !values.state) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["state"], message: "State is required before selecting a city." });
  }
});

export const continentSchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Continent name is required."),
  order_no: z.coerce.number().min(1).default(1),
  status: z.boolean(),
});

export const countrySchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  continent: z.coerce.number().min(1, "Continent is required."),
  name: z.string().trim().min(1, "Country name is required."),
  currency: z.coerce.number().min(1, "Currency is required."),
  status: z.boolean(),
});

export const stateSchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  country: z.coerce.number().min(1, "Country is required."),
  name: z.string().trim().min(1, "State name is required."),
  is_active: z.boolean(),
});

export const citySchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  country: z.coerce.number().min(1, "Country is required."),
  state: z.coerce.number().min(1, "State is required."),
  name: z.string().trim().min(1, "City name is required."),
  pincode: requiredPincode(),
  city_type: optionalNumberId(),
  is_active: z.boolean(),
});

export const taxSchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  country: z.coerce.number().min(1, "Country is required."),
  name: z.string().trim().min(1, "Tax name is required."),
  value: z.coerce.number().min(0, "Tax value cannot be negative.").max(100, "Tax percentage must be between 0 and 100."),
  is_active: z.boolean(),
});

export const currencySchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  country: z.coerce.number().min(1, "Country is required."),
  name: z.string().trim().min(1, "Currency name is required."),
  symbol: z.string().trim().min(1, "Currency symbol is required."),
  is_active: z.boolean(),
});

const customerContactSchema = z.object({
  id: z.number().optional(),
  contact_person_name: z.string().trim().min(1, "Contact person name is required."),
  designation: optionalString(),
  email: optionalEmail(),
  mobile_no: optionalMobile(),
  is_active: z.boolean().default(true),
});

const customerBankSchema = z.object({
  id: z.number().optional(),
  bank_name: z.string().trim().min(1, "Bank name is required."),
  bank_address: optionalString(),
  ifsc_code: optionalIfsc(),
  beneficiary_account_name: z.string().trim().min(1, "Beneficiary account name is required."),
  account_number: z.string().trim().min(1, "Account number is required."),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

const supplierContactSchema = z.object({
  id: z.number().optional(),
  contact_person_name: z.string().trim().min(1, "Contact person name is required."),
  designation: optionalString(),
  email: optionalEmail(),
  mobile_no: optionalMobile(),
  landline: optionalPhone(),
  department: optionalString(),
  is_active: z.boolean().default(true),
});

const supplierBankSchema = z.object({
  id: z.number().optional(),
  bank_name: z.string().trim().min(1, "Bank name is required."),
  account_number: z.string().trim().min(1, "Account number is required."),
  account_holder_name: z.string().trim().min(1, "Account holder name is required."),
  bank_address: optionalString(),
  ifsc_code: optionalIfsc(),
  swift_code: optionalSwift(),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

const statutorySchema = z.object({
  ecc_no: optionalString(),
  commissionerate: optionalString(),
  division: optionalString(),
  range_name: optionalString(),
  cst_no: optionalString(),
  tin_no: optionalString(),
  service_tax_no: optionalString(),
  iec_code: optionalString(),
  cin_no: optionalString(),
  tan_no: optionalString(),
});

export const customerSchema = z.object({
  customer_name: z.string().trim().min(1, "Customer name is required."),
  customer_group: z.enum(["international", "domestic"]),
  customer_division: optionalString(),
  currency: optionalNumberId(),
  country: optionalNumberId(),
  state: optionalNumberId(),
  city: optionalNumberId(),
  address: optionalString(),
  pincode: optionalPincode(),
  mobile_no: optionalMobile(),
  phone_no: optionalPhone(),
  email: optionalEmail(),
  pan_number: optionalPan(),
  gst_number: optionalGst(),
  gst_registered: z.boolean().default(false),
  gst_provisional: z.boolean().default(false),
  customer_status: z.enum(["active", "inactive", "blocked"]).default("active"),
  website: optionalUrl(),
  remarks: optionalString(),
  credit_limit: z.coerce.number().min(0, "Credit limit cannot be negative.").default(0),
  payment_terms: optionalString(),
  customer_since: optionalString(),
  contact_persons: z.array(customerContactSchema).default([]),
  statutory_detail: statutorySchema.nullable().default(null),
  bank_details: z.array(customerBankSchema).default([]),
  billing_address: addressSchema.nullable().default(null),
  shipping_address: addressSchema.nullable().default(null),
}).superRefine((values, ctx) => {
  if (values.state && !values.country) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["country"], message: "Country is required before selecting a state." });
  }
  if (values.city && !values.state) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["state"], message: "State is required before selecting a city." });
  }
  if (values.gst_registered && !values.gst_number) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gst_number"], message: "GST number is required when GST is registered." });
  }
  if (values.gst_provisional && !values.gst_registered) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gst_provisional"], message: "GST provisional requires GST registration." });
  }
});

export const customerDocumentSchema = z.object({
  customer: z.coerce.number().min(1),
  document_type: z.string().trim().min(1, "Document type is required."),
  file: optionalFile,
  remarks: optionalString(),
  is_active: z.boolean().default(true),
});

export const supplierSchema = z.object({
  supplier_name: z.string().trim().min(1, "Supplier name is required."),
  supplier_group: optionalString(),
  currency: optionalNumberId(),
  reference: optionalString(),
  country: optionalNumberId(),
  state: optionalNumberId(),
  city: optionalNumberId(),
  pincode: optionalPincode(),
  address: optionalString(),
  corporate_address: optionalString(),
  mobile_no: optionalMobile(),
  phone_no: optionalPhone(),
  fax_no: optionalPhone(),
  pan_number: optionalPan(),
  gst_number: optionalGst(),
  gst_registration_date: optionalString(),
  gst_status: z.enum(["registered", "unregistered", "provisional"]).default("unregistered"),
  email: optionalEmail(),
  website: optionalUrl(),
  msme_type: z.enum(["micro", "small", "medium", "not_applicable"]).default("not_applicable"),
  arn_no: optionalString(),
  payment_terms: optionalString(),
  credit_days: z.coerce.number().min(0, "Credit days cannot be negative.").default(0),
  vendor_rating: z.coerce.number().min(0, "Vendor rating cannot be negative.").max(5, "Vendor rating must be between 0 and 5.").default(0),
  remarks: optionalString(),
  contact_persons: z.array(supplierContactSchema).default([]),
  statutory_detail: statutorySchema.nullable().default(null),
  bank_details: z.array(supplierBankSchema).default([]),
  billing_address: addressSchema.nullable().default(null),
  shipping_address: addressSchema.nullable().default(null),
}).superRefine((values, ctx) => {
  if (values.state && !values.country) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["country"], message: "Country is required before selecting a state." });
  }
  if (values.city && !values.state) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["state"], message: "State is required before selecting a city." });
  }
  if (values.gst_status !== "unregistered" && !values.gst_number) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["gst_number"], message: "GST number is required for the selected GST status." });
  }
});

export const supplierDocumentSchema = z.object({
  supplier: z.coerce.number().min(1),
  document_type: z.string().trim().min(1, "Document type is required."),
  file: optionalFile,
  remarks: optionalString(),
  is_active: z.boolean().default(true),
});

export const companySchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Company name is required."),
  gst_number: optionalGst(),
  pan_number: optionalPan(),
  address: z.string().trim().min(1, "Company address is required."),
  country: z.coerce.number().min(1, "Country is required."),
  state: z.coerce.number().min(1, "State is required."),
  city: z.coerce.number().min(1, "City is required."),
  pincode: requiredPincode(),
  contact_person: optionalString(),
  mobile_no: optionalPhone(),
  email: z.string().trim().email("Enter a valid email."),
  logo: optionalFile,
  document: optionalFile,
  is_active: z.boolean(),
}).superRefine((values, ctx) => {
  if (values.state && !values.country) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["country"], message: "Country is required before selecting a state." });
  }
  if (values.city && !values.state) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["state"], message: "State is required before selecting a city." });
  }
});

export const projectSchema = z.object({
  company: z.coerce.number().min(1, "Company is required."),
  name: z.string().trim().min(1, "Project name is required."),
  code: z.string().trim().min(1, "Project code is required."),
  client_name: optionalString(),
  application_type: optionalNumberId(),
  capacity: optionalString(),
  duration: optionalString(),
  project_date: z.string().min(1, "Project date is required."),
  country: optionalNumberId(),
  state: optionalNumberId(),
  city: optionalNumberId(),
  address: optionalString(),
  latitude: optionalString(),
  longitude: optionalString(),
  pincode: optionalPincode(),
  pan_number: optionalPan(),
  gst_number: optionalGst(),
  gst_reg_date: optionalString(),
  contact_person: optionalString(),
  contact_number: optionalPhone(),
  contact_email: optionalEmail(),
  website: optionalUrl(),
  description: optionalString(),
  is_active: z.boolean(),
}).superRefine((values, ctx) => {
  if (values.state && !values.country) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["country"], message: "Country is required before selecting a state." });
  }
  if (values.city && !values.state) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["state"], message: "State is required before selecting a city." });
  }
});

export type ContinentFormValues = z.infer<typeof continentSchema>;
export type CountryFormValues = z.infer<typeof countrySchema>;
export type StateFormValues = z.infer<typeof stateSchema>;
export type CityFormValues = z.infer<typeof citySchema>;
export type TaxFormValues = z.infer<typeof taxSchema>;
export type CurrencyFormValues = z.infer<typeof currencySchema>;
export type CustomerFormValues = z.infer<typeof customerSchema>;
export type CustomerDocumentFormValues = z.infer<typeof customerDocumentSchema>;
export type SupplierFormValues = z.infer<typeof supplierSchema>;
export type SupplierDocumentFormValues = z.infer<typeof supplierDocumentSchema>;
export type CompanyFormValues = z.infer<typeof companySchema>;
export type ProjectFormValues = z.infer<typeof projectSchema>;
