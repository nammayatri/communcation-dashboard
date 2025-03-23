export interface MerchantCity {
  merchantShortId: string;
  operatingCity: string[];
}

export interface UserRole {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobileCountryCode: string;
  mobileNumber: string;
  role: UserRole;
  availableMerchants: string[];
  availableCitiesForMerchant: MerchantCity[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  authToken: string;
  city: string;
  is2faEnabled: boolean;
  is2faMandatory: boolean;
  merchantId: string;
  message: string;
} 