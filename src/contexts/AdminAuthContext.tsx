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
      console.log('Attempting admin login for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Admin auth error:', error);

        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password.' };
        } else if (error.message.includes('Email not confirmed')) {
          return { error: 'Email not confirmed.' };
        } else if (error.message.includes('Too many requests')) {
          return { error: 'Too many login attempts. Please try again later.' };
        } else if (error.message.includes('User not found')) {
          return { error: 'User not found. Please check the email address.' };
        } else {
          return { error: `Login failed: ${error.message}` };
        }
      }

      if (!data.user) {
        console.error('No user data returned from auth');
        return { error: 'Login failed: No user data received.' };
      }

      console.log('User authenticated successfully:', data.user.id);

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, email, is_active')
        .eq('id', data.user.id)
        .single();

      console.log('Profile data:', profile);
      console.log('Profile error:', profileError);

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        await supabase.auth.signOut();
        return { error: 'Admin profile not found. Please contact system administrator.' };
      }

      if (!profile) {
        console.error('No profile found for user');
        await supabase.auth.signOut();
        return { error: 'Admin profile not found. Please contact system administrator.' };
      }

      if (!profile.is_active) {
        console.error('Admin account is deactivated');
        await supabase.auth.signOut();
        return { error: 'Admin account is deactivated.' };
      }

      if (!profile.role || !['admin', 'super_admin'].includes(profile.role)) {
        console.error('User does not have admin role:', profile.role);
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

      console.log('Admin login successful:', adminData);
      setAdmin(adminData);
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during admin login:', error);
      return { error: 'An unexpected error occurred during login.' };
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