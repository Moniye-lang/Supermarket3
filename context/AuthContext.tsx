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

function parseJwt(token: string): any {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        return payload;
    } catch {
        return null;
    }
}

function isTokenExpired(token: string): boolean {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("token") || localStorage.getItem("workerToken");
        const savedUser = localStorage.getItem("user");

        if (savedToken) {
            if (isTokenExpired(savedToken)) {
                console.warn("Stored auth token has expired. Clearing session.");
                localStorage.removeItem("token");
                localStorage.removeItem("workerToken");
                localStorage.removeItem("user");
                setToken(null);
                setUser(null);
            } else {
                setToken(savedToken);
                // Ensure active token is in both keys for interoperability
                localStorage.setItem("token", savedToken);
                if (savedUser) {
                    try {
                        setUser(JSON.parse(savedUser));
                    } catch {
                        localStorage.removeItem("user");
                    }
                } else {
                    const payload = parseJwt(savedToken);
                    if (payload && payload.id) {
                        const fallbackUser: UserType = {
                            _id: payload.id,
                            id: payload.id,
                            name: payload.role === "admin" ? "Admin" : "Store Staff",
                            email: payload.email || "",
                            role: payload.role || "customer",
                        };
                        setUser(fallbackUser);
                        localStorage.setItem("user", JSON.stringify(fallbackUser));
                    }
                }
            }
        }
        setLoading(false);
    }, []);

    const login = (userData: UserType, userToken: string) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem("token", userToken);
        if (userData.role === "worker" || userData.role === "rider" || userData.role === "admin") {
            localStorage.setItem("workerToken", userToken);
        }
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("workerToken");
            localStorage.removeItem("user");
            localStorage.removeItem("cart");
            localStorage.removeItem("pending_cart_product");
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
