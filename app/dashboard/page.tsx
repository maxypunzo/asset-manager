// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import UserDashboard from '@/components/UserDashboard';

type Profile = { id: string; full_name: string | null; role: 'admin' | 'user' };

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(data as Profile);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <p>Loading...</p>;
  if (!profile) return <p>No profile found.</p>;

  return profile.role === 'admin' ? (
    <AdminDashboard profile={profile} />
  ) : (
    <UserDashboard profile={profile} />
  );
}
