import { create } from 'zustand';

type AuthStore = {
    type: "LOGIN" | "REGISTER";
    setType: (type: "LOGIN" | "REGISTER") => void;

    modal: boolean;
    setModal: (modal: boolean) => void;

    login: string;
    setLogin: (headers: string) => void;

    password: string;
    setPassword: (password: string) => void;
};

export const useAuth = create<AuthStore>((set) => ({
    type: "LOGIN",
    setType: (type) => set({ type }),

    modal: false,
    setModal: (modal) => set({ modal }),

    login: "",
    setLogin: (email) => set({ login: email }),

    password: "",
    setPassword: (password) => set({ password }),

}));
