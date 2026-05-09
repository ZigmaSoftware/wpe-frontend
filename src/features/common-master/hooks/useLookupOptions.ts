import { useQuery } from "@tanstack/react-query";
import { commonMasterApi } from "@/features/common-master/api/commonMasterApi";
import { commonMasterKeys } from "@/features/common-master/api/queryKeys";

export const useCountryOptions = () =>
  useQuery({
    queryKey: commonMasterKeys.lookup("countries"),
    queryFn: commonMasterApi.listCountryOptions,
  });

export const useStateOptions = (countryId?: number | null) =>
  useQuery({
    queryKey: commonMasterKeys.lookup("states", countryId ?? "all"),
    queryFn: () => (countryId ? commonMasterApi.listStatesByCountry(countryId) : Promise.resolve([])),
    enabled: Boolean(countryId),
  });

export const useCityOptions = (countryId?: number | null, stateId?: number | null) =>
  useQuery({
    queryKey: commonMasterKeys.lookup("cities", `${countryId ?? "all"}-${stateId ?? "all"}`),
    queryFn: () => commonMasterApi.listCityLookup({ country: countryId, state: stateId }),
    enabled: Boolean(countryId && stateId),
  });

export const useCityTypeOptions = () =>
  useQuery({
    queryKey: commonMasterKeys.lookup("city-types"),
    queryFn: commonMasterApi.listCityTypes,
  });

export const useContinentOptions = () =>
  useQuery({
    queryKey: commonMasterKeys.lookup("continents"),
    queryFn: commonMasterApi.listContinents,
  });

export const useCurrencyOptions = () =>
  useQuery({
    queryKey: commonMasterKeys.lookup("currencies"),
    queryFn: commonMasterApi.listCurrencyOptions,
  });

export const useCompanyOptions = () =>
  useQuery({
    queryKey: commonMasterKeys.lookup("companies"),
    queryFn: commonMasterApi.listCompanyLookup,
  });

export const useApplicationTypeOptions = () =>
  useQuery({
    queryKey: commonMasterKeys.lookup("application-types"),
    queryFn: commonMasterApi.listApplicationTypes,
  });

export const useCustomerOptions = () =>
  useQuery({
    queryKey: commonMasterKeys.lookup("customers"),
    queryFn: commonMasterApi.listCustomerOptions,
  });

export const useSupplierOptions = () =>
  useQuery({
    queryKey: commonMasterKeys.lookup("suppliers"),
    queryFn: commonMasterApi.listSupplierOptions,
  });
