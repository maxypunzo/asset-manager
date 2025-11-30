// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminDashboard from '@/components/AdminDashboard';
import UserDashboard from '@/components/UserDashboard';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  full_name: string | null;
  role: 'admin' | 'user';
};

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setProfile(data as Profile);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return <p>Loading...</p>;
  if (!profile) return <p>No profile found.</p>;

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">
          Dashboard – {profile.role === 'admin' ? 'Admin' : 'User'}
        </h1>
        <button
          className="text-sm underline"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/');
          }}
        >
          Logout
        </button>
      </div>

      {profile.role === 'admin' ? (
        <AdminDashboard profile={profile} />
      ) : (
        <UserDashboard profile={profile} />
      )}
    </div>
  );
}
