import { User } from "@/types";
import { create } from "zustand";

type UserType = {
    user: User | null;
    token: string | null;

    setUser: (user: User | null) => void;
    setToken: (string: string) => void;

};

export const useAuth = create<UserType>((set) => ({
    user: null,
    token: null,

    setUser: (user) => set({
        user: user
    }),
    setToken: (token) => set({
        token: token
    }),
}));