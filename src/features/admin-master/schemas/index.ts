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

export const staffSchema = z.object({
  staff_name: z.string().trim().min(1, "Staff name is required."),
  mobile_no: z.string().trim().optional().or(z.literal("")).nullable(),
  email: z.string().email("Enter a valid email.").optional().or(z.literal("")).nullable(),
  department: optionalNumber(),
  designation: optionalString(),
  is_active: z.boolean(),
});

export const userTypeSchema = z.object({
  user_type: z.string().trim().min(1, "User type is required."),
  code: optionalString(),
  is_active: z.boolean(),
  under_users: optionalString(),
  company_wise: z.boolean(),
  project_wise: z.boolean(),
  department_wise: z.boolean(),
  user_wise: z.boolean(),
});

export const userAccountSchema = z
  .object({
    staff: z.coerce.number().min(1, "Staff is required."),
    username: z.string().trim().min(1, "Username is required."),
    password: z.string().optional().or(z.literal("")),
    confirm_password: z.string().optional().or(z.literal("")),
    user_type: z.coerce.number().min(1, "User type is required."),
    mobile_no: z.string().trim().optional().or(z.literal("")).nullable(),
    email: z.string().email("Enter a valid email.").optional().or(z.literal("")).nullable(),
    first_name: optionalString(),
    last_name: optionalString(),
    company: optionalNumber(),
    department: optionalNumber(),
    project: optionalString(),
    under_users: optionalString(),
    account_status: z.enum(["active", "inactive", "locked"]),
    force_password_change: z.boolean(),
    is_team_head: z.boolean(),
    team_members: z.array(z.number()).default([]),
    designation: optionalString(),
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

export const userPermissionSchema = z.object({
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
export type StaffFormValues = z.infer<typeof staffSchema>;
export type UserTypeFormValues = z.infer<typeof userTypeSchema>;
export type UserAccountFormValues = z.infer<typeof userAccountSchema>;
export type UserPermissionFormValues = z.infer<typeof userPermissionSchema>;
