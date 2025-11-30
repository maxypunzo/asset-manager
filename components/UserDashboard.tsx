// components/UserDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Profile = { id: string; full_name: string | null; role: 'admin' | 'user' };
type Category = { id: string; name: string };
type Department = { id: string; name: string };
type Asset = {
  id: string;
  asset_name: string;
  cost: number;
  date_purchased: string;
  category: Category | null;
  department: Department | null;
};

export default function UserDashboard({ profile }: { profile: Profile }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [form, setForm] = useState({
    asset_name: '',
    category_id: '',
    department_id: '',
    date_purchased: '',
    cost: ''
  });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const { data: cat } = await supabase.from('categories').select('*').order('name');
    const { data: dep } = await supabase.from('departments').select('*').order('name');
    const { data: assetRows } = await supabase
      .from('assets')
      .select('id, asset_name, cost, date_purchased, categories(*), departments(*)')
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false });

    setCategories(cat || []);
    setDepartments(dep || []);
    setAssets(
      (assetRows || []).map((a: any) => ({
        id: a.id,
        asset_name: a.asset_name,
        cost: a.cost,
        date_purchased: a.date_purchased,
        category: a.categories,
        department: a.departments
      }))
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('assets').insert({
      asset_name: form.asset_name,
      category_id: form.category_id || null,
      department_id: form.department_id || null,
      date_purchased: form.date_purchased,
      cost: parseFloat(form.cost),
      created_by: profile.id
    });
    setLoading(false);
    if (!error) {
      setForm({ asset_name: '', category_id: '', department_id: '', date_purchased: '', cost: '' });
      await loadData();
    } else {
      console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Create New Asset</h2>
        <input
          className="border p-2 w-full mb-2"
          placeholder="Asset Name"
          value={form.asset_name}
          onChange={e => setForm({ ...form, asset_name: e.target.value })}
        />
        <select
          className="border p-2 w-full mb-2"
          value={form.category_id}
          onChange={e => setForm({ ...form, category_id: e.target.value })}
        >
          <option value="">Select Category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="border p-2 w-full mb-2"
          value={form.department_id}
          onChange={e => setForm({ ...form, department_id: e.target.value })}
        >
          <option value="">Select Department</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input
          type="date"
          className="border p-2 w-full mb-2"
          value={form.date_purchased}
          onChange={e => setForm({ ...form, date_purchased: e.target.value })}
        />
        <input
          type="number"
          step="0.01"
          className="border p-2 w-full mb-2"
          placeholder="Cost"
          value={form.cost}
          onChange={e => setForm({ ...form, cost: e.target.value })}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? 'Saving...' : 'Save Asset'}
        </button>
      </form>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">My Assets</h2>
        {assets.length === 0 && <p className="text-sm text-gray-500">No assets yet.</p>}
        <ul className="space-y-2">
          {assets.map(a => (
            <li key={a.id} className="border p-2 rounded flex justify-between">
              <div>
                <div className="font-medium">{a.asset_name}</div>
                <div className="text-xs text-gray-600">
                  {a.category?.name || 'No category'} · {a.department?.name || 'No department'}
                </div>
              </div>
              <div className="text-right text-sm">
                <div>${a.cost}</div>
                <div className="text-xs text-gray-500">{a.date_purchased}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
