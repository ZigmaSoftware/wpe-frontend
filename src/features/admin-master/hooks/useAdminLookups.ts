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

export const useStaffOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("staff"),
    queryFn: adminMasterApi.lookupStaff,
  });

export const useUserTypeOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("user-types"),
    queryFn: adminMasterApi.lookupUserTypes,
  });

export const useCompanyOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("companies"),
    queryFn: adminMasterApi.listCompaniesForSelect,
  });

export const useDepartmentOptions = () =>
  useQuery({
    queryKey: adminMasterKeys.lookup("departments"),
    queryFn: adminMasterApi.lookupDepartments,
  });
