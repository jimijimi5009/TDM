export const ENVIRONMENTS = ["Q1", "Q2", "Q3", "Q4", "Q5", "PROD"];

export const SERVICE_TYPES = [
    { value: "patient-rest-services", label: "Patient Rest Services" }
];

export const API_ENDPOINTS = {
    SCHEMA: '/api/service-schema',
    EXECUTE: '/api/service-execute',
    CREATE: '/api/service-create',
    CREATE_INTAKE: '/api/create-intake-data',
} as const;
