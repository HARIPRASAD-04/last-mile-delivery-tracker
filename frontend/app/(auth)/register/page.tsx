'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button, Input, Card } from '@/components/ui';
import { Truck, Mail, Lock, User, Phone, MapPin } from 'lucide-react';

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push(user.role === 'ADMIN' ? '/admin' : user.role === 'AGENT' ? '/agent' : '/customer');
    }
  }, [user, authLoading, router]);

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.push('/customer');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#E0E5EC]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E0E5EC] text-[#6C63FF] shadow-[7px_7px_14px_rgba(163,177,198,0.6),-7px_-7px_14px_rgba(255,255,255,0.5)]">
              <Truck size={24} />
            </div>
            <span className="font-display font-extrabold text-2xl text-[#3D4852] tracking-tight">LastMile</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-[#3D4852]">Create Your Account</h1>
          <p className="text-sm text-[#6B7280]">Start tracking and scheduling deliveries today</p>
        </div>

        <Card className="p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-[#E0E5EC] text-xs font-medium text-[#b94040] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] ring-1 ring-[rgba(185,64,64,0.3)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              label="Full Name"
              placeholder="Priya Sharma"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              icon={<User size={16} />}
              required
            />
            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              icon={<Mail size={16} />}
              required
            />
            <Input
              id="phone"
              label="Phone Number"
              type="tel"
              placeholder="+91-9800000000"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              icon={<Phone size={16} />}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="min 6 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              icon={<Lock size={16} />}
              required
            />
            <Input
              id="address"
              label="Default Delivery Address"
              placeholder="12, Marine Drive, Mumbai"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              icon={<MapPin size={16} />}
            />

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Create Account
              </Button>
            </div>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#6C63FF] hover:text-[#8B84FF] transition-colors"
            >
              Already have an account? Sign in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
