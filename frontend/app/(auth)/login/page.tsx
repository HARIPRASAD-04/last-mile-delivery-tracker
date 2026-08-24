'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button, Input } from '@/components/ui';
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push(user.role === 'ADMIN' ? '/admin' : user.role === 'AGENT' ? '/agent' : '/customer');
    }
  }, [user, authLoading, router]);

  // Don't render during auth check
  if (authLoading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setForm({ email, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur p-2.5 rounded-xl">
            <Truck size={24} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">LastMile Tracker</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart Last-Mile<br />Delivery Platform
          </h2>
          <p className="text-indigo-200 text-lg">
            Intelligent delivery management with real-time tracking, 
            smart agent assignment, and delivery risk intelligence.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Orders Tracked', value: '10,000+' },
              { label: 'Active Agents', value: '500+' },
              { label: 'Delivery Zones', value: '50+' },
              { label: 'Success Rate', value: '97.3%' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-indigo-200 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-sm">© 2026 LastMile Delivery Platform</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4 lg:hidden">
              <Truck size={28} className="text-indigo-600" />
              <span className="font-bold text-xl text-gray-900">LastMile Tracker</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="space-y-1">
                <Input
                  id="password"
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  icon={<Lock size={16} />}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showPw ? 'Hide' : 'Show'} password
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign in
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/register" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Don&apos;t have an account? Register
              </Link>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">🎯 Demo Credentials</p>
            <div className="space-y-2">
              {[
                { role: 'Admin', email: 'admin@demo.com', password: 'admin123', color: 'indigo' },
                { role: 'Customer', email: 'customer@demo.com', password: 'customer123', color: 'emerald' },
                { role: 'Agent', email: 'agent1@demo.com', password: 'agent123', color: 'amber' },
              ].map(d => (
                <button
                  key={d.role}
                  onClick={() => fillDemo(d.email, d.password)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-gray-700">{d.role}</span>
                    <span className="text-xs text-gray-400 ml-2">{d.email}</span>
                  </div>
                  <span className="text-xs text-indigo-500">Click to fill →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
