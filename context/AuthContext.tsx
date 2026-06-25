"use client";

import { createContext, useState, useEffect, ReactNode } from "react";

interface UserType {
    _id: string;
    name: string;
    email: string;
    role?: string;
    [key: string]: any;
}

interface AuthContextType {
    user: UserType | null;
    token: string | null;
    loading: boolean;
    login: (userData: UserType, userToken: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    login: () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (savedToken && savedUser) {
            setToken(savedToken);
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const login = (userData: UserType, userToken: string) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem("token", userToken);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("cart");
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
