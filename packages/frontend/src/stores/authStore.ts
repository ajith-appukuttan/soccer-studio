import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization } from '@shared/types';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (user: User, organization: Organization, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateOrganization: (organization: Partial<Organization>) => void;
  setLoading: (loading: boolean) => void;
  loginDev: () => void; // Development login for quick testing
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      organization: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (user, organization, token) => {
        set({
          user,
          organization,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          organization: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      updateOrganization: (orgData) => {
        const currentOrg = get().organization;
        if (currentOrg) {
          set({
            organization: { ...currentOrg, ...orgData },
          });
        }
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      loginDev: () => {
        // Create a realistic test user for development/testing
        const testUser: User = {
          id: 'test-user-001',
          email: 'coach@testemail.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'COACH',
          organizationId: 'test-org-001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const testOrganization: Organization = {
          id: 'test-org-001',
          name: 'Manchester United Academy',
          domain: 'manchester-united',
          plan: 'ENTERPRISE',
          maxUsers: 50,
          maxStorageGB: 500,
          features: ['advanced_annotations', 'ai_analysis', 'collaboration', 'exports'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          user: testUser,
          organization: testOrganization,
          token: 'test-session-' + Date.now(),
          isAuthenticated: true,
          isLoading: false,
        });
      },

    }),
    {
      name: 'soccer-training-auth',
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);