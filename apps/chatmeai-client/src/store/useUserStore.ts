import { create } from 'zustand'

const PLACEHOLDER_NAME = 'Usuário'
const PLACEHOLDER_EMAIL = 'usuario@example.com'

interface UserState {
  name: string
  email: string
  resetUser: () => void
}

export const useUserStore = create<UserState>()((set) => ({
  name: PLACEHOLDER_NAME,
  email: PLACEHOLDER_EMAIL,
  resetUser: () => set({ name: PLACEHOLDER_NAME, email: PLACEHOLDER_EMAIL }),
}))
