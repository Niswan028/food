import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile, UserRole } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error) {
      console.error('Profile fetch error:', error.message);
      return;
    }
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setSession(data.session ?? null);
      setUser(sessionUser);
      if (sessionUser) {
        fetchProfile(sessionUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        (async () => {
          await fetchProfile(newSession.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    const authUser = data?.user ?? null;

    if (error || !authUser) {
      return { error: error?.message ?? 'Invalid email or password' };
    }

    setSession({ user: authUser } as Session);
    setUser(authUser as User);
    setProfile(authUser as Profile);
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role, phone } },
    });
    if (error) return { error: error.message };

    const userId = data.user?.id;
    if (!userId) return { error: 'User creation failed. Please try again.' };

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        console.warn('Auto sign-in after signup failed:', signInError.message);
      }
    }

    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName,
      role,
      phone,
    }, { onConflict: 'id' });
    if (profileErr) return { error: profileErr.message };

    if (role === 'farmer') {
      const { error: farmerProfileErr } = await supabase.from('farmer_profiles').upsert({
        id: `farmer-profile-${Date.now()}`,
        user_id: userId,
        farm_name: `${fullName}'s Farm`,
        location: 'Pending admin review',
        state: 'Pending',
        farm_size_acres: 0,
        crops_grown: [],
        certifications: [],
        verification_status: 'pending',
        document_url: null,
        bio: 'Farm profile is waiting for admin verification before the farmer can list produce.',
      }, { onConflict: 'user_id' });
      if (farmerProfileErr) return { error: farmerProfileErr.message };
    }

    setSession({ user: data.user } as Session);
    setUser(data.user as User);
    setProfile({ ...data.user, full_name: fullName, role, phone, avatar_url: null, created_at: new Date().toISOString() } as Profile);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
