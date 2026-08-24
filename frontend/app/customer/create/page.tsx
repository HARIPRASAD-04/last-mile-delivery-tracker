'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/Sidebar';
import { Card, Button, Input, Select, LoadingState, toast } from '@/components/ui';
import { admin as adminApi, orders as ordersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Area, PriceBreakdown } from '@/types';
import { Package, Calculator, CheckCircle, ArrowRight, MapPin, Weight } from 'lucide-react';

export default function CustomerCreateOrderPage() {
  const { isCustomer, loading: authLoading } = useAuth();
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    pickup_address: '', pickup_area_id: '',
    drop_address: '', drop_area_id: '',
    length: '', width: '', height: '', actual_weight: '',
    order_type: 'B2C', payment_type: 'PREPAID',
  });

  useEffect(() => { if (!authLoading && !isCustomer) router.push('/login'); }, [authLoading, isCustomer, router]);

  useEffect(() => {
    if (!isCustomer) return;
    adminApi.areas().then((a: any) => setAreas(a)).finally(() => setAreasLoading(false));
  }, [isCustomer]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleCalculate = async () => {
    const required = ['pickup_area_id', 'drop_area_id', 'length', 'width', 'height', 'actual_weight'];
    if (required.some(f => !(form as any)[f])) {
      toast('Please fill all fields', 'error'); return;
    }
    setCalculating(true);
    setPricing(null);
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
    if (!pricing) { toast('Please calculate price first', 'error'); return; }
    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        pickup_address: form.pickup_address || areas.find(a => a.id === parseInt(form.pickup_area_id))?.name || 'Pickup',
        pickup_area_id: parseInt(form.pickup_area_id),
        drop_address: form.drop_address || areas.find(a => a.id === parseInt(form.drop_area_id))?.name || 'Delivery',
        drop_area_id: parseInt(form.drop_area_id),
        length: parseFloat(form.length), width: parseFloat(form.width),
        height: parseFloat(form.height), actual_weight: parseFloat(form.actual_weight),
        order_type: form.order_type, payment_type: form.payment_type,
      }) as any;
      toast(`Order created! Tracking: ${order.tracking_number}`);
      router.push(`/customer/orders/${order.id}`);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  if (authLoading || !isCustomer) return <LoadingState />;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Delivery</h1>
        <p className="text-gray-500 text-sm mb-6">Fill in the details to get a price estimate before confirming</p>

        <div className="space-y-5">
          {/* Pickup */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><MapPin size={11} className="text-white" /></div>
              Pickup
            </h3>
            <div className="space-y-3">
              <Input label="Pickup Address" value={form.pickup_address} onChange={set('pickup_address')} placeholder="Enter full pickup address" />
              <Select
                label="Pickup Area"
                options={areas.map(a => ({ value: a.id, label: `${a.name}${a.postal_code ? ` (${a.postal_code})` : ''} — ${a.zone?.code}` }))}
                value={form.pickup_area_id}
                onChange={set('pickup_area_id')}
                placeholder="Select pickup area..."
              />
            </div>
          </Card>

          {/* Delivery */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"><MapPin size={11} className="text-white" /></div>
              Delivery
            </h3>
            <div className="space-y-3">
              <Input label="Delivery Address" value={form.drop_address} onChange={set('drop_address')} placeholder="Enter full delivery address" />
              <Select
                label="Delivery Area"
                options={areas.map(a => ({ value: a.id, label: `${a.name}${a.postal_code ? ` (${a.postal_code})` : ''} — ${a.zone?.code}` }))}
                value={form.drop_area_id}
                onChange={set('drop_area_id')}
                placeholder="Select delivery area..."
              />
            </div>
          </Card>

          {/* Package */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Weight size={16} /> Package Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Length (cm)" type="number" step="0.1" value={form.length} onChange={set('length')} placeholder="40" />
              <Input label="Width (cm)" type="number" step="0.1" value={form.width} onChange={set('width')} placeholder="30" />
              <Input label="Height (cm)" type="number" step="0.1" value={form.height} onChange={set('height')} placeholder="20" />
              <Input label="Weight (kg)" type="number" step="0.1" value={form.actual_weight} onChange={set('actual_weight')} placeholder="5.0" />
            </div>
          </Card>

          {/* Order options */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Order Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Order Type"
                options={[{ value: 'B2C', label: 'B2C (Personal)' }, { value: 'B2B', label: 'B2B (Business)' }]}
                value={form.order_type} onChange={set('order_type')}
              />
              <Select
                label="Payment Type"
                options={[{ value: 'PREPAID', label: 'Prepaid' }, { value: 'COD', label: 'Cash on Delivery' }]}
                value={form.payment_type} onChange={set('payment_type')}
              />
            </div>
          </Card>

          {/* Calculate button */}
          <Button onClick={handleCalculate} loading={calculating} variant="secondary" className="w-full" size="lg" icon={<Calculator size={16} />}>
            Calculate Delivery Charge
          </Button>

          {/* Price breakdown */}
          {pricing && (
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={20} className="text-indigo-600" />
                <h3 className="font-semibold text-indigo-900">Delivery Charge Breakdown</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Route</p>
                  <p className="font-semibold text-gray-900">{pricing.pickup_zone} → {pricing.drop_zone}</p>
                  <p className="text-xs text-gray-400">{pricing.is_intra_zone ? 'Intra-Zone' : 'Inter-Zone'}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Chargeable Weight</p>
                  <p className="font-semibold text-gray-900">{pricing.chargeable_weight} kg</p>
                  <p className="text-xs text-gray-400">max({pricing.actual_weight}kg, {pricing.volumetric_weight}kg vol.)</p>
                </div>
              </div>

              <div className="bg-white/70 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Base Charge</span><span>{formatCurrency(pricing.base_charge)}</span>
                </div>
                {pricing.cod_surcharge > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>COD Surcharge</span><span>{formatCurrency(pricing.cod_surcharge)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span className="text-indigo-900">Total</span>
                  <span className="text-indigo-700">{formatCurrency(pricing.total_charge)}</span>
                </div>
              </div>

              <Button onClick={handleSubmit} loading={submitting} className="w-full mt-4" size="lg" icon={<ArrowRight size={16} />}>
                Confirm & Place Order
              </Button>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
