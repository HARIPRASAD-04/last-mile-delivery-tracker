'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button, Input } from '@/components/ui';
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
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Truck size={28} className="text-indigo-600" />
            <span className="font-bold text-xl text-gray-900">LastMile Tracker</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Start tracking deliveries today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
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
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              icon={<Mail size={16} />}
              required
            />
            <Input
              id="phone"
              label="Phone number"
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
              label="Default Address"
              placeholder="Your delivery address"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              icon={<MapPin size={16} />}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
