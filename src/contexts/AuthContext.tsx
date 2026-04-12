import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any }>;
  signUpWithPhone: (phone: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone || "" },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signUpWithPhone = async (phone: string, password: string, fullName: string) => {
    const fakeEmail = `${phone.replace(/[^0-9]/g, "")}@whatsapp.guest`;
    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });
    // Auto sign-in after signup for phone users (no email to confirm)
    if (!error && data?.user && !data.session) {
      const signInResult = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
      return { error: signInResult.error };
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithPhone = async (phone: string, password: string) => {
    const fakeEmail = `${phone.replace(/[^0-9]/g, "")}@whatsapp.guest`;
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signUpWithPhone, signIn, signInWithPhone, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
