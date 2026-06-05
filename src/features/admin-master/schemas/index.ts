import { z } from "zod";

const optionalString = () => z.string().trim().optional().or(z.literal("")).nullable();
const optionalNumber = () => z.coerce.number().optional().nullable();

export const mainScreenSchema = z.object({
  screen_name: z.string().trim().min(1, "Screen name is required."),
  code: optionalString(),
  order_no: z.coerce.number().min(1, "Order no is required."),
  is_active: z.boolean(),
});

export const screenSectionSchema = z.object({
  main_screen: z.coerce.number().min(1, "Main screen is required."),
  section_name: z.string().trim().min(1, "Section name is required."),
  code: optionalString(),
  order_no: z.coerce.number().min(1, "Order no is required."),
  is_active: z.boolean(),
  description: optionalString(),
});

export const userScreenSchema = z.object({
  main_screen: z.coerce.number().min(1, "Main screen is required."),
  screen_section: z.coerce.number().min(1, "Screen section is required."),
  screen_name: z.string().trim().min(1, "Screen name is required."),
  code: optionalString(),
  route_path: optionalString(),
  order_no: z.coerce.number().min(1, "Order no is required."),
  icon: optionalString(),
  description: optionalString(),
  is_active: z.boolean(),
  available_actions: z.array(z.enum(["add", "update", "list", "delete", "view", "print"])).min(1, "Select at least one action."),
});

export const userTypeSchema = z.object({
  department: z.coerce.number().min(1, "Department is required."),
  role: z.coerce.number().min(1, "Role is required."),
  is_active: z.boolean(),
});

export const staffCreationSchema = z.object({
  staff_code: z.string().trim().min(1, "Employee ID is required."),
  name: z.string().trim().min(1, "Name is required."),
  age: z.coerce.number().min(1, "Age is required."),
  department: z.coerce.number().min(1, "Department is required."),
  role: z.coerce.number().min(1, "Role is required."),
  mobile: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number."),
  email: z.string().trim().email("Enter a valid email."),
  joining_date: optionalString(),
  gender: z.enum(["male", "female", "other"]).optional().or(z.literal("")).nullable(),
  address: optionalString(),
  emergency_contact_no: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Enter a valid emergency contact number.")
    .optional()
    .or(z.literal(""))
    .nullable(),
  photo: z.instanceof(File).nullable().optional(),
  photo_url: z.string().optional(),
  is_active: z.boolean(),
  remarks: optionalString(),
});

export const userCreationSchema = z
  .object({
    staff: z.coerce.number().min(1, "Staff is required."),
    user_type: z.coerce.number().min(1, "User type is required."),
    company: z.coerce.number().min(1, "Company is required."),
    username: z.string().trim().min(1, "Username is required."),
    password: z.string().optional().or(z.literal("")),
    confirm_password: z.string().optional().or(z.literal("")),
    mobile_no: z.string().trim().optional().or(z.literal("")).nullable(),
    email: z.string().email("Enter a valid email.").optional().or(z.literal("")).nullable(),
    account_status: z.enum(["active", "inactive", "locked"]),
  })
  .superRefine((values, ctx) => {
    if (values.password && values.password !== values.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Confirm password does not match.",
      });
    }
  });

export const userScreenPermissionSchema = z.object({
  user_type: z.coerce.number().min(1, "User type is required."),
  scope_type: z.enum(["main_screen", "section", "screen"]),
  main_screen: z.coerce.number().min(1, "Main screen is required."),
  screen_section: optionalNumber(),
  user_screen: optionalNumber(),
  action_permissions: z.object({
    all: z.boolean().optional(),
    add: z.boolean().optional(),
    update: z.boolean().optional(),
    list: z.boolean().optional(),
    delete: z.boolean().optional(),
    view: z.boolean().optional(),
    print: z.boolean().optional(),
  }),
  is_active: z.boolean(),
});

export type MainScreenFormValues = z.infer<typeof mainScreenSchema>;
export type ScreenSectionFormValues = z.infer<typeof screenSectionSchema>;
export type UserScreenFormValues = z.infer<typeof userScreenSchema>;
export type UserTypeFormValues = z.infer<typeof userTypeSchema>;
export type StaffCreationFormValues = z.infer<typeof staffCreationSchema>;
export type UserCreationFormValues = z.infer<typeof userCreationSchema>;
export type UserScreenPermissionFormValues = z.infer<typeof userScreenPermissionSchema>;
