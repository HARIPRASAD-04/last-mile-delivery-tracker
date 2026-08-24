'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingState } from '@/components/ui';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'AGENT') {
        router.push('/agent');
      } else {
        router.push('/customer');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <LoadingState message="Loading your dashboard..." />
    </div>
  );
}
