'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, Button, Input, Select, LoadingState, toast } from '@/components/ui';
import { admin as adminApi, orders as ordersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Area, Zone, PriceBreakdown } from '@/types';
import { Package, Calculator, CheckCircle, ArrowRight } from 'lucide-react';

export default function AdminCreateOrderPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer_id: '',
    pickup_address: '', pickup_area_id: '',
    drop_address: '', drop_area_id: '',
    length: '', width: '', height: '', actual_weight: '',
    order_type: 'B2C', payment_type: 'PREPAID',
  });

  useEffect(() => { if (!authLoading && !isAdmin) router.push('/login'); }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([adminApi.areas() as Promise<Area[]>, adminApi.customers() as Promise<any[]>])
      .then(([a, c]) => { setAreas(a); setCustomers(c); })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleCalculate = async () => {
    if (!form.pickup_area_id || !form.drop_area_id || !form.length || !form.actual_weight) {
      toast('Please fill all package details', 'error'); return;
    }
    setCalculating(true);
    try {
      const result = await ordersApi.calculate({
        pickup_area_id: parseInt(form.pickup_area_id),
        drop_area_id: parseInt(form.drop_area_id),
        length: parseFloat(form.length), width: parseFloat(form.width),
        height: parseFloat(form.height), actual_weight: parseFloat(form.actual_weight),
        order_type: form.order_type, payment_type: form.payment_type,
      }) as PriceBreakdown;
      setPricing(result);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setCalculating(false); }
  };

  const handleSubmit = async () => {
    if (!pricing || !form.customer_id) { toast('Please calculate price and select customer', 'error'); return; }
    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        customer_id: parseInt(form.customer_id),
        pickup_address: form.pickup_address,
        pickup_area_id: parseInt(form.pickup_area_id),
        drop_address: form.drop_address,
        drop_area_id: parseInt(form.drop_area_id),
        length: parseFloat(form.length), width: parseFloat(form.width),
        height: parseFloat(form.height), actual_weight: parseFloat(form.actual_weight),
        order_type: form.order_type, payment_type: form.payment_type,
      }) as any;
      toast(`Order created: ${order.tracking_number}`);
      router.push(`/admin/orders/${order.id}`);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  if (authLoading || !isAdmin) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Order (Admin)</h1>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Customer</h3>
            <Select
              label="Select Customer"
              options={customers.map(c => ({ value: c.id, label: `${c.user?.name} — ${c.user?.email}` }))}
              value={form.customer_id}
              onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
              placeholder="Select customer..."
              required
            />
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Pickup Details</h3>
            <div className="space-y-4">
              <Input label="Pickup Address" value={form.pickup_address} onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))} placeholder="Full pickup address" />
              <Select
                label="Pickup Area"
                options={areas.map(a => ({ value: a.id, label: `${a.name} — ${a.zone?.code || ''}` }))}
                value={form.pickup_area_id}
                onChange={e => setForm(f => ({ ...f, pickup_area_id: e.target.value }))}
                placeholder="Select area..."
              />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Delivery Details</h3>
            <div className="space-y-4">
              <Input label="Delivery Address" value={form.drop_address} onChange={e => setForm(f => ({ ...f, drop_address: e.target.value }))} placeholder="Full delivery address" />
              <Select
                label="Delivery Area"
                options={areas.map(a => ({ value: a.id, label: `${a.name} — ${a.zone?.code || ''}` }))}
                value={form.drop_area_id}
                onChange={e => setForm(f => ({ ...f, drop_area_id: e.target.value }))}
                placeholder="Select area..."
              />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Package & Order Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Length (cm)" type="number" value={form.length} onChange={e => setForm(f => ({...f, length: e.target.value}))} placeholder="40" />
              <Input label="Width (cm)" type="number" value={form.width} onChange={e => setForm(f => ({...f, width: e.target.value}))} placeholder="30" />
              <Input label="Height (cm)" type="number" value={form.height} onChange={e => setForm(f => ({...f, height: e.target.value}))} placeholder="20" />
              <Input label="Actual Weight (kg)" type="number" value={form.actual_weight} onChange={e => setForm(f => ({...f, actual_weight: e.target.value}))} placeholder="5.0" />
              <Select label="Order Type" options={[{value:'B2C',label:'B2C'},{value:'B2B',label:'B2B'}]} value={form.order_type} onChange={e => setForm(f => ({...f, order_type: e.target.value}))} />
              <Select label="Payment Type" options={[{value:'PREPAID',label:'Prepaid'},{value:'COD',label:'Cash on Delivery'}]} value={form.payment_type} onChange={e => setForm(f => ({...f, payment_type: e.target.value}))} />
            </div>

            <Button onClick={handleCalculate} loading={calculating} variant="secondary" className="mt-4" icon={<Calculator size={14} />}>
              Calculate Price
            </Button>
          </Card>

          {pricing && (
            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-indigo-600" />
                Price Breakdown
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Route</span><span className="font-medium">{pricing.pickup_zone} → {pricing.drop_zone} ({pricing.is_intra_zone ? 'Intra' : 'Inter'}-Zone)</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Actual Weight</span><span>{pricing.actual_weight} kg</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Volumetric Weight</span><span>{pricing.volumetric_weight} kg</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Chargeable Weight</span><span className="font-medium">{pricing.chargeable_weight} kg</span></div>
                <hr className="border-indigo-200" />
                <div className="flex justify-between"><span className="text-gray-600">Base Charge</span><span>{formatCurrency(pricing.base_charge)}</span></div>
                {pricing.cod_surcharge > 0 && <div className="flex justify-between"><span className="text-gray-600">COD Surcharge</span><span>{formatCurrency(pricing.cod_surcharge)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t border-indigo-200 pt-2 mt-2">
                  <span className="text-indigo-900">Total</span>
                  <span className="text-indigo-700">{formatCurrency(pricing.total_charge)}</span>
                </div>
              </div>

              <Button onClick={handleSubmit} loading={submitting} className="w-full mt-4" size="lg" icon={<ArrowRight size={16} />}>
                Confirm & Create Order
              </Button>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
