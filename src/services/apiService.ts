import { API_ENDPOINTS } from "@/constants";

interface FetchOptions {
  method?: string;
  body?: any;
}

const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { method = "GET", body } = options;
  const response = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const apiService = {
  fetchSchema: (environment: string, serviceType: string) =>
    apiFetch(
      `${API_ENDPOINTS.SCHEMA}?environment=${environment}&serviceType=${serviceType}`
    ),

  executeQuery: (environment: string, serviceType: string, selectedColumnNames: string[], filters?: Record<string, string>) =>
    apiFetch(API_ENDPOINTS.EXECUTE, {
      method: "POST",
      body: { environment, serviceType, selectedColumnNames, filters: filters || {} },
    }),

  createData: (environment: string, serviceType: string, dataFields: any[]) =>
    apiFetch(API_ENDPOINTS.CREATE, {
      method: "POST",
      body: { environment, serviceType, dataFields },
    }),

  createIntakeData: (environment: string, serviceType: string) =>
    apiFetch(API_ENDPOINTS.CREATE_INTAKE, {
      method: "POST",
      body: { environment, serviceType },
    }),
};
