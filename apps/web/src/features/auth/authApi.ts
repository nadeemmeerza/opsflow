import { apiSlice } from '@/store/api/apiSlice';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: AuthUser;
  };
  timestamp: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation } = authApi;