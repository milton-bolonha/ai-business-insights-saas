import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type GuestAction =
  | 'tileChat'
  | 'contactChat'
  | 'regenerate'
  | 'createContact'
  | 'createWorkspace'
  | 'createTile'
  | 'wmsAiAssistant'
  | 'wmsInventoryCount'
  | 'ordersCount'
  | 'staffCount';

export interface UsageResult {
  action: GuestAction;
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
}

type UsageCounts = Record<GuestAction, number> & {
  creditsUsed?: number;
  creditsTotal?: number;
};

interface AuthState {
  // Estado de usuário
  user: { id?: string; role: 'guest' | 'member'; globalRole?: string; isPaid?: boolean; plan?: string } | null;
  isAuthenticated: boolean;

  // Limites de uso (definidos por role)
  limits: Record<GuestAction, number> & { creditsTotal?: number };

  // Contadores de uso atuais
  usage: UsageCounts;

  // Ações
  canPerformAction: (action: string) => boolean;
  evaluateUsage: (action: GuestAction) => UsageResult;
  consumeUsage: (action: GuestAction) => UsageResult;
  setUsage: (newUsage: Partial<UsageCounts>) => void;
  resetUsage: () => void;
  setUser: (user: { id?: string; role: 'guest' | 'member'; globalRole?: string; isPaid?: boolean; plan?: string } | null) => void;
  startCheckout: () => boolean;

  // Legacy compatibility
  isMember: boolean;
  isGuest: boolean;
}

const MEMBER_LIMITS: Record<GuestAction, number> = {
  tileChat: 50,
  contactChat: 50,
  regenerate: 20,
  createContact: 5,
  createWorkspace: 3,
  createTile: 20,
  wmsAiAssistant: 50,
  wmsInventoryCount: 100,
  ordersCount: 100,
  staffCount: 50,
};

const USAGE_VERSION = 2;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      limits: MEMBER_LIMITS,
      usage: {
        tileChat: 0,
        contactChat: 0,
        regenerate: 0,
        createContact: 0,
        createWorkspace: 0,
        createTile: 0,
        wmsAiAssistant: 0,
        wmsInventoryCount: 0,
        ordersCount: 0,
        staffCount: 0,
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

        // No access for non-members
        if (user?.role !== 'member') return false;

        // Member/Business logic: Enforce Credit Limits
        // Cost map (mirrors backend usage-service.ts)
        const costs: Record<string, number> = {
            createTile: 5,
            tileChat: 2,
            contactChat: 2,
            regenerate: 5,
            createContact: 1,
            createWorkspace: 10,
            wmsAiAssistant: 5,
            wmsInventoryCount: 1,
            ordersCount: 2,
            staffCount: 1,
        };

        const cost = costs[action] || 0;
        const total = (usage as any).creditsTotal || (limits as any).creditsTotal || 0;
        const used = (usage as any).creditsUsed || 0;

        return (used + cost) <= total;
      },

      evaluateUsage: (action: GuestAction): UsageResult => {
        const { usage, limits, user } = get();

        const used = usage[action] || 0;
        const limit = limits[action] || 0;
        
        // Cost check for members
        const costs: Record<string, number> = {
            createTile: 5,
            tileChat: 2,
            contactChat: 2,
            regenerate: 5,
            createContact: 1,
            createWorkspace: 10,
            wmsAiAssistant: 5,
            wmsInventoryCount: 1,
            ordersCount: 2,
            staffCount: 1,
        };
        const cost = costs[action] || 0;
        const totalCredits = (usage as any).creditsTotal || (limits as any).creditsTotal || 0;
        const usedCredits = (usage as any).creditsUsed || 0;

        const allowed = user?.role === 'member' && (usedCredits + cost <= totalCredits);

        const remaining = user?.role === 'member' 
            ? Math.floor((totalCredits - usedCredits) / (cost || 1)) 
            : 0;

        return {
          action,
          allowed,
          used,
          remaining,
          limit: user?.role === 'member' ? totalCredits : limit,
        };
      },

      consumeUsage: (action: GuestAction): UsageResult => {
        const { user, usage, limits } = get();
        
        const costs: Record<string, number> = {
            createTile: 5,
            tileChat: 2,
            contactChat: 2,
            regenerate: 5,
            createContact: 1,
            createWorkspace: 10,
            wmsAiAssistant: 5,
            wmsInventoryCount: 1,
            ordersCount: 2,
            staffCount: 1,
        };
        const cost = costs[action] || 0;

        // Optimistic update for everyone
        const newUsage = {
          ...usage,
          [action]: (usage[action] || 0) + 1,
          creditsUsed: ((usage as any).creditsUsed || 0) + cost
        };

        set({ usage: newUsage });

        return {
          action,
          allowed: true, 
          used: newUsage[action],
          remaining: user?.role === 'member' ? Math.floor((((usage as any).creditsTotal || 0) - newUsage.creditsUsed) / (cost || 1)) : 0,
          limit: (limits as any).creditsTotal || 0,
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
            wmsAiAssistant: 0,
            wmsInventoryCount: 0,
            ordersCount: 0,
            staffCount: 0,
          }
        });
      },

      setUser: (user: { id?: string; role: 'guest' | 'member'; isPaid?: boolean } | null): void => {
        const isAuthenticated = !!user;
        const limits = MEMBER_LIMITS;

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
      // Partialize para persistir dados do Guest e também a FLAG de pagamento do Member
      partialize: (state) => {
        // Se o member recarregou a página sem o Clerk, a claim de "member"
        // que colocamos na "success" flag do Stripe DEVE ser mantida localmente.
        return {
          usage: state.usage,
          user: state.user, // MANTÉM OS DADOS DE ACESSO DO USUÁRIO ENTRE REFRESHES
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
              wmsAiAssistant: 0,
              wmsInventoryCount: 0,
              ordersCount: 0,
              staffCount: 0,
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
