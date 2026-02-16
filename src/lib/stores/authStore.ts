import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type GuestAction =
  | 'tileChat'
  | 'contactChat'
  | 'regenerate'
  | 'createContact'
  | 'createWorkspace'
  | 'createTile';

export interface UsageResult {
  action: GuestAction;
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
}

type UsageCounts = Record<GuestAction, number>;

interface AuthState {
  // Estado de usuário
  user: { role: 'guest' | 'member'; isPaid?: boolean; plan?: string } | null;
  isAuthenticated: boolean;

  // Limites de uso (definidos por role)
  limits: Record<GuestAction, number>;

  // Contadores de uso atuais
  usage: UsageCounts;

  // Ações
  canPerformAction: (action: string) => boolean;
  evaluateUsage: (action: GuestAction) => UsageResult;
  consumeUsage: (action: GuestAction) => UsageResult;
  setUsage: (newUsage: Partial<UsageCounts>) => void;
  resetUsage: () => void;
  setUser: (user: { role: 'guest' | 'member'; isPaid?: boolean; plan?: string } | null) => void;
  startCheckout: () => boolean;

  // Legacy compatibility
  isMember: boolean;
  isGuest: boolean;
}

// Limites por tipo de usuário
const GUEST_LIMITS: Record<GuestAction, number> = {
  tileChat: 5,
  contactChat: 5,
  regenerate: 5,
  createContact: 5,
  createWorkspace: 3,
  createTile: 20,
};

const MEMBER_LIMITS: Record<GuestAction, number> = {
  tileChat: 50,
  contactChat: 50,
  regenerate: 20,
  createContact: 5,
  createWorkspace: 3,
  createTile: 20,
};

const USAGE_VERSION = 2;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      limits: GUEST_LIMITS,
      usage: {
        tileChat: 0,
        contactChat: 0,
        regenerate: 0,
        createContact: 0,
        createWorkspace: 0,
        createTile: 0,
      },

      // Getters computados (legacy compatibility)
      get isMember(): boolean {
        const { user } = get();
        return user?.role === 'member';
      },

      get isGuest(): boolean {
        const { user } = get();
        return !user || user.role === 'guest';
      },

      // Ações
      canPerformAction: (action: string): boolean => {
        const { user, usage, limits } = get();

        // Members têm acesso ilimitado
        if (user?.role === 'member') return true;

        // Guests verificam limites
        const guestAction = action as GuestAction;
        const currentUsage = usage[guestAction] || 0;
        const limit = limits[guestAction] || 0;

        return currentUsage < limit;
      },

      evaluateUsage: (action: GuestAction): UsageResult => {
        const { usage, limits, user } = get();

        const used = usage[action] || 0;
        const limit = limits[action] || 0;
        const allowed = user?.role === 'member' || used < limit;
        const remaining = user?.role === 'member' ? Infinity : Math.max(0, limit - used);

        return {
          action,
          allowed,
          used,
          remaining,
          limit: user?.role === 'member' ? Infinity : limit,
        };
      },

      consumeUsage: (action: GuestAction): UsageResult => {
        const { user, usage, limits } = get();

        // Optimistic update for everyone (guests AND members)
        const newUsage = {
          ...usage,
          [action]: (usage[action] || 0) + 1,
        };

        set({ usage: newUsage });

        return {
          action,
          allowed: true, // Já verificado anteriormente
          used: newUsage[action],
          remaining: user?.role === 'member' ? Infinity : Math.max(0, (limits[action] || 0) - newUsage[action]),
          limit: limits[action] || 0,
        };
      },

      setUsage: (newUsage: Partial<UsageCounts>) => {
        set((state) => ({
          usage: { ...state.usage, ...newUsage }
        }));
      },

      resetUsage: (): void => {
        set({
          usage: {
            tileChat: 0,
            contactChat: 0,
            regenerate: 0,
            createContact: 0,
            createWorkspace: 0,
            createTile: 0,
          }
        });
      },

      setUser: (user: { role: 'guest' | 'member'; isPaid?: boolean } | null): void => {
        const isAuthenticated = !!user;
        const limits = user?.role === 'member' ? MEMBER_LIMITS : GUEST_LIMITS;

        set({
          user,
          isAuthenticated,
          limits,
        });
      },

      startCheckout: (): boolean => {
        const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL;
        if (checkoutUrl && typeof window !== 'undefined') {
          window.location.href = checkoutUrl;
          return true;
        }
        return false;
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      // Partialize para persistir apenas dados de guest
      partialize: (state) => {
        // Só persistir dados se for guest
        if (state.user?.role !== 'guest') {
          return {
            usage: {
              tileChat: 0,
              contactChat: 0,
              regenerate: 0,
              createContact: 0,
              createWorkspace: 0,
              createTile: 0,
            }
          };
        }

        return {
          usage: state.usage,
        };
      },
      // Usar versão customizada para controle de reset diário
      version: USAGE_VERSION,
      migrate: (persistedState: unknown, version: number) => {
        if (version !== USAGE_VERSION) {
          return {
            ...(persistedState as Record<string, unknown>),
            usage: {
              tileChat: 0,
              contactChat: 0,
              regenerate: 0,
              createContact: 0,
              createWorkspace: 0,
              createTile: 0,
            }
          };
        }
        return persistedState;
      },
    }
  )
);

// Hooks auxiliares para facilitar uso
export const useUser = () => useAuthStore((state) => state.user);
export const useIsMember = () => useAuthStore((state) => state.isMember);
export const useIsGuest = () => useAuthStore((state) => state.isGuest);
export const useUsage = () => useAuthStore((state) => state.usage);
export const useLimits = () => useAuthStore((state) => state.limits);
export const useCanPerformAction = () => useAuthStore((state) => state.canPerformAction);
