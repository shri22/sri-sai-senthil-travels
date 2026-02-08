// Production API Configuration
export const API_BASE_URL = 'https://srisaisenthiltravels.cloud';

export async function getApiBaseUrl(): Promise<string> {
  return API_BASE_URL;
}
