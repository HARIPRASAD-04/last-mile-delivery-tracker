'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button, Input, Card } from '@/components/ui';
import { Truck, Mail, Lock, Eye, EyeOff, ShieldCheck, Zap, Layers, MapPin } from 'lucide-react';

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
    <div className="min-h-screen flex bg-[#E0E5EC]">
      {/* Left — Neumorphic showcase panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-[#E0E5EC]">
        {/* Abstract Neumorphic background decoration — concentric floating depth circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full shadow-[inset_20px_20px_40px_rgba(163,177,198,0.5),inset_-20px_-20px_40px_rgba(255,255,255,0.6)] pointer-events-none animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full shadow-[15px_15px_30px_rgba(163,177,198,0.5),-15px_-15px_30px_rgba(255,255,255,0.6)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full shadow-[inset_10px_10px_20px_rgba(163,177,198,0.6),inset_-10px_-10px_20px_rgba(255,255,255,0.7)] pointer-events-none" />

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E0E5EC] text-[#6C63FF] shadow-[7px_7px_14px_rgba(163,177,198,0.6),-7px_-7px_14px_rgba(255,255,255,0.5)]">
            <Truck size={24} />
          </div>
          <div>
            <span className="font-display font-extrabold text-xl text-[#3D4852] tracking-tight">LastMile</span>
            <span className="text-xs text-[#6B7280] block font-medium">Delivery Management</span>
          </div>
        </div>

        {/* Main hero message */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h2 className="font-display font-extrabold text-4xl text-[#3D4852] leading-tight tracking-tight">
            Tactile Intelligence for Last-Mile Logistics
          </h2>
          <p className="text-[#6B7280] text-base leading-relaxed">
            Real-time tracking, intelligent agent assignment, and deterministic delivery risk evaluation molded into a unified, physical design system.
          </p>

          <div className="grid grid-cols-2 gap-5 pt-4">
            {[
              { label: 'Orders Tracked', value: '10,000+', icon: <Layers size={18} className="text-[#6C63FF]" /> },
              { label: 'Active Agents', value: '500+', icon: <Truck size={18} className="text-[#38B2AC]" /> },
              { label: 'Delivery Zones', value: '50+', icon: <MapPin size={18} className="text-[#c07b28]" /> },
              { label: 'Success Rate', value: '97.3%', icon: <ShieldCheck size={18} className="text-[#38B2AC]" /> },
            ].map(s => (
              <div
                key={s.label}
                className="p-5 rounded-[24px] bg-[#E0E5EC] shadow-[7px_7px_14px_rgba(163,177,198,0.6),-7px_-7px_14px_rgba(255,255,255,0.5)] flex items-center gap-3.5"
              >
                <div className="p-2.5 rounded-xl bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]">
                  {s.icon}
                </div>
                <div>
                  <p className="font-display font-bold text-xl text-[#3D4852]">{s.value}</p>
                  <p className="text-xs text-[#6B7280] font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-[#6B7280] font-medium">
          © 2026 LastMile Delivery Management System
        </p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#E0E5EC]">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-3 mb-2 lg:hidden">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#E0E5EC] text-[#6C63FF] shadow-[5px_5px_10px_rgba(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
                <Truck size={20} />
              </div>
              <span className="font-display font-bold text-xl text-[#3D4852]">LastMile</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-[#3D4852]">Welcome Back</h1>
            <p className="text-sm text-[#6B7280]">Sign in to access your dashboard</p>
          </div>

          <Card className="p-8 space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-[#E0E5EC] text-xs font-medium text-[#b94040] shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] ring-1 ring-[rgba(185,64,64,0.3)]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="space-y-1.5">
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
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="text-xs text-[#6C63FF] hover:text-[#8B84FF] font-medium flex items-center gap-1 mt-1 transition-colors"
                  >
                    {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showPw ? 'Hide' : 'Show'} password
                  </button>
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign in
              </Button>
            </form>

            <div className="text-center pt-2">
              <Link
                href="/register"
                className="text-xs font-semibold text-[#6C63FF] hover:text-[#8B84FF] transition-colors"
              >
                Don&apos;t have an account? Register here
              </Link>
            </div>
          </Card>

          {/* Demo credentials */}
          <div className="p-6 rounded-[28px] bg-[#E0E5EC] shadow-[7px_7px_14px_rgba(163,177,198,0.6),-7px_-7px_14px_rgba(255,255,255,0.5)]">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Zap size={14} className="text-[#6C63FF]" />
              Quick Demo Login
            </p>
            <div className="space-y-2.5">
              {[
                { role: 'Admin', email: 'admin@demo.com', password: 'admin123', color: 'text-[#6C63FF]' },
                { role: 'Customer', email: 'customer@demo.com', password: 'customer123', color: 'text-[#38B2AC]' },
                { role: 'Agent', email: 'agent1@demo.com', password: 'agent123', color: 'text-[#c07b28]' },
              ].map(d => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => fillDemo(d.email, d.password)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#E0E5EC] shadow-[4px_4px_8px_rgba(163,177,198,0.6),-4px_-4px_8px_rgba(255,255,255,0.5)] hover:shadow-[inset_3px_3px_6px_rgba(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] transition-all duration-200 flex items-center justify-between text-left group"
                >
                  <div>
                    <span className={`text-xs font-bold ${d.color}`}>{d.role}</span>
                    <span className="text-xs text-[#6B7280] ml-2 font-mono">{d.email}</span>
                  </div>
                  <span className="text-xs text-[#6C63FF] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Fill →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
