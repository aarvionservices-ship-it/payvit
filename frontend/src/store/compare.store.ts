import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CompareState {
  loanIds: string[];
  cardIds: string[];
  addLoan: (id: string) => boolean;
  removeLoan: (id: string) => void;
  clearLoans: () => void;
  addCard: (id: string) => boolean;
  removeCard: (id: string) => void;
  clearCards: () => void;
  isComparingLoan: (id: string) => boolean;
  isComparingCard: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      loanIds: [],
      cardIds: [],
      
      addLoan: (id: string) => {
        const { loanIds, cardIds } = get();
        if (loanIds.includes(id)) return true;
        if (loanIds.length >= 5) return false;
        // Enforce only loans if cards are present
        if (cardIds.length > 0) {
           set({ cardIds: [], loanIds: [id] });
        } else {
           set({ loanIds: [...loanIds, id] });
        }
        return true;
      },
      
      removeLoan: (id: string) => {
        const { loanIds } = get();
        set({ loanIds: loanIds.filter((lid) => lid !== id) });
      },
      
      clearLoans: () => set({ loanIds: [] }),
      
      addCard: (id: string) => {
        const { cardIds, loanIds } = get();
        if (cardIds.includes(id)) return true;
        if (cardIds.length >= 5) return false;
        // Enforce only cards if loans are present
        if (loanIds.length > 0) {
           set({ loanIds: [], cardIds: [id] });
        } else {
           set({ cardIds: [...cardIds, id] });
        }
        return true;
      },
      
      removeCard: (id: string) => {
        const { cardIds } = get();
        set({ cardIds: cardIds.filter((cid) => cid !== id) });
      },
      
      clearCards: () => set({ cardIds: [] }),
      
      isComparingLoan: (id: string) => get().loanIds.includes(id),
      isComparingCard: (id: string) => get().cardIds.includes(id),
    }),
    {
      name: 'payvit-compare-storage',
    }
  )
);

