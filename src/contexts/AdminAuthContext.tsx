import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing admin session
  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Check if user has admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role && ['admin', 'super_admin'].includes(profile.role)) {
          const adminData: Admin = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || 'Admin',
            role: profile.role as 'admin' | 'super_admin',
            created_at: session.user.created_at
          };
          setAdmin(adminData);
        }
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
          await supabase.auth.signOut();
          return { error: 'Access denied. Admin privileges required.' };
        }

        const adminData: Admin = {
          id: data.user.id,
          email: data.user.email!,
          full_name: profile.full_name || 'Admin',
          role: profile.role as 'admin' | 'super_admin',
          created_at: data.user.created_at
        };

        setAdmin(adminData);
        return { error: null };
      }

      return { error: 'Login failed' };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAdmin(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AdminAuthContextType = {
    admin,
    loading,
    signIn,
    signOut,
    isAdmin: !!admin
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};