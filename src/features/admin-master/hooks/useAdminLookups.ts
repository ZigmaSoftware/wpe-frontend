import { useQuery } from "@tanstack/react-query";
import { adminMasterApi } from "@/features/admin-master/api/adminMasterApi";
import { adminMasterKeys } from "@/features/admin-master/api/queryKeys";

export const useMainScreenOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("main-screens"),
    queryFn: adminMasterApi.listMainScreenLookup,
  });

export const useScreenSectionOptions = (mainScreenId?: number | null) =>
  useQuery({
    queryKey: adminMasterKeys.lookup("screen-sections", mainScreenId ?? "all"),
    queryFn: () => adminMasterApi.lookupScreenSections(mainScreenId),
    enabled: mainScreenId !== undefined,
  });

export const useUserScreenOptions = (mainScreenId?: number | null, screenSectionId?: number | null) =>
  useQuery({
    queryKey: adminMasterKeys.lookup("user-screens", `${mainScreenId ?? "all"}-${screenSectionId ?? "all"}`),
    queryFn: () => adminMasterApi.lookupUserScreens({ mainScreenId, screenSectionId }),
  });

export const useUserCreationSelectOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("user-creation-select-options"),
    queryFn: adminMasterApi.lookupUserCreationSelectOptions,
  });

export const useUserCreationDepartmentOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("user-creation-departments"),
    queryFn: adminMasterApi.lookupUserCreationDepartments,
  });

export const useUserCreationRoleOptions = (departmentId?: number | null) =>
  useQuery({
    queryKey: adminMasterKeys.lookup("user-creation-roles", departmentId ?? "all"),
    queryFn: () => adminMasterApi.lookupUserCreationRoles(departmentId),
    enabled: Boolean(departmentId),
  });

export const useUserTypeOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("user-types"),
    queryFn: adminMasterApi.lookupUserTypes,
  });

export const useUserTypeDepartmentOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("user-type-departments"),
    queryFn: adminMasterApi.lookupUserTypeDepartments,
  });

export const useUserTypeRoleOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("user-type-roles"),
    queryFn: adminMasterApi.lookupUserTypeRoles,
  });

export const useCompanyOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("companies"),
    queryFn: adminMasterApi.listCompaniesForSelect,
  });
