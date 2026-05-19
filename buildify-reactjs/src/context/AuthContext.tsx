import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import supabase from '../services/supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signup: (email: string, password: string, fullName: string, referredBy?: string) => Promise<unknown>;
    login: (email: string, password: string) => Promise<unknown>;
    logout: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    async function signup(email: string, password: string, fullName: string, referredBy?: string) {
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    full_name: fullName,
                    referred_by: referredBy || null
                }
            }
        });
        if (error) throw error;
        return data;
    }

    async function login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    async function getAccessToken() {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return null;

        // Check if token expires within the next 5 minutes
        const expiresAt = session.expires_at; // Unix timestamp in seconds
        const now = Math.floor(Date.now() / 1000);
        
        if (expiresAt && expiresAt - now < 300) {
            // Token is expired or about to expire — refresh it
            const { data: { session: refreshed }, error } = await supabase.auth.refreshSession();
            if (error || !refreshed) {
                // Refresh failed — clear user state so they get redirected to login
                console.warn('[Auth] Session refresh failed:', error?.message);
                setUser(null);
                return null;
            }
            setUser(refreshed.user);
            return refreshed.access_token;
        }
        
        return session.access_token;
    }

    return (
        <AuthContext.Provider value={{ user, loading, signup, login, logout, getAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
