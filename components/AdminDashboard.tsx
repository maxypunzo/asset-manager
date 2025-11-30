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
  category_name: string | null;
  department_name: string | null;
  created_by_name: string | null;
};

export default function AdminDashboard({ profile }: { profile: Profile }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [newCategory, setNewCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    setMessage(null);

    // Categories
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (catError) {
      console.error(catError);
      setMessage('Error loading categories');
    } else {
      setCategories(catData || []);
    }

    // Departments
    const { data: depData, error: depError } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (depError) {
      console.error(depError);
      setMessage('Error loading departments');
    } else {
      setDepartments(depData || []);
    }

    // Assets – join categories, departments, profiles for display
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .select(
        `
        id,
        asset_name,
        cost,
        date_purchased,
        categories ( name ),
        departments ( name ),
        profiles ( full_name )
      `
      )
      .order('created_at', { ascending: false });

    if (assetError) {
      console.error(assetError);
      setMessage('Error loading assets');
    } else {
      setAssets(
        (assetData || []).map((row: any) => ({
          id: row.id,
          asset_name: row.asset_name,
          cost: row.cost,
          date_purchased: row.date_purchased,
          category_name: row.categories?.name ?? null,
          department_name: row.departments?.name ?? null,
          created_by_name: row.profiles?.full_name ?? null
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from('categories').insert({
      name: newCategory.trim()
    });

    if (error) {
      console.error(error);
      setMessage('Error adding category');
    } else {
      setNewCategory('');
      await loadData();
      setMessage('Category created successfully');
    }
    setLoading(false);
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.trim()) return;

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from('departments').insert({
      name: newDepartment.trim()
    });

    if (error) {
      console.error(error);
      setMessage('Error adding department');
    } else {
      setNewDepartment('');
      await loadData();
      setMessage('Department created successfully');
    }
    setLoading(false);
  };

  const handleDeleteAsset = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this asset?');
    if (!confirm) return;

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from('assets').delete().eq('id', id);

    if (error) {
      console.error(error);
      setMessage('Error deleting asset');
    } else {
      setMessage('Asset deleted successfully');
      await loadData();
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Optional info */}
      <div className="bg-white p-4 rounded shadow flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Logged in as Admin</p>
          <p className="font-semibold">{profile.full_name || 'Admin User'}</p>
        </div>
        {loading && <div className="text-xs text-gray-500">Loading...</div>}
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded">
          {message}
        </div>
      )}

      {/* Top grid: Categories + Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Asset Categories</h2>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-3">
            <input
              className="border p-2 flex-1"
              placeholder="New category name"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
              disabled={loading}
            >
              Add
            </button>
          </form>
          <ul className="space-y-1 text-sm">
            {categories.length === 0 && (
              <li className="text-gray-500">No categories yet.</li>
            )}
            {categories.map(c => (
              <li key={c.id} className="border-b py-1">
                {c.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Departments */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Departments</h2>
          <form onSubmit={handleAddDepartment} className="flex gap-2 mb-3">
            <input
              className="border p-2 flex-1"
              placeholder="New department name"
              value={newDepartment}
              onChange={e => setNewDepartment(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
              disabled={loading}
            >
              Add
            </button>
          </form>
          <ul className="space-y-1 text-sm">
            {departments.length === 0 && (
              <li className="text-gray-500">No departments yet.</li>
            )}
            {departments.map(d => (
              <li key={d.id} className="border-b py-1">
                {d.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Assets table */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">All Assets</h2>
        {assets.length === 0 ? (
          <p className="text-sm text-gray-500">No assets available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-2 py-1 text-left">Asset Name</th>
                  <th className="border px-2 py-1 text-left">Category</th>
                  <th className="border px-2 py-1 text-left">Department</th>
                  <th className="border px-2 py-1 text-right">Cost</th>
                  <th className="border px-2 py-1 text-left">Date Purchased</th>
                  <th className="border px-2 py-1 text-left">Created By</th>
                  <th className="border px-2 py-1 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id}>
                    <td className="border px-2 py-1">{a.asset_name}</td>
                    <td className="border px-2 py-1">
                      {a.category_name || <span className="text-gray-400">–</span>}
                    </td>
                    <td className="border px-2 py-1">
                      {a.department_name || <span className="text-gray-400">–</span>}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      ${a.cost?.toFixed ? a.cost.toFixed(2) : a.cost}
                    </td>
                    <td className="border px-2 py-1">{a.date_purchased}</td>
                    <td className="border px-2 py-1">
                      {a.created_by_name || <span className="text-gray-400">Unknown</span>}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handleDeleteAsset(a.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
