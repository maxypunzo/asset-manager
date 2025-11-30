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

type SimpleUser = {
  id: string;
  full_name: string | null; // we are using this as email
  role: 'admin' | 'user';
};

export default function AdminDashboard({ profile }: { profile: Profile }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);

  const [newCategory, setNewCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  // create user form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);

    // Categories
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (catError) console.error(catError);
    setCategories(catData || []);

    // Departments
    const { data: depData, error: depError } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (depError) console.error(depError);
    setDepartments(depData || []);

    // Assets
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

    if (assetError) console.error(assetError);
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

    // Users (from profiles)
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('created_at', { ascending: true });

    if (userError) console.error(userError);
    setUsers((userData || []) as SimpleUser[]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
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
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

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

  // ✅ CREATE USER (Auth + profile role)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      setMessage('Email and password are required for new users.');
      return;
    }

    setLoading(true);
    setMessage(null);

    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: newUserEmail.trim(),
      password: newUserPassword.trim()
    });

    if (error) {
      console.error(error);
      setMessage('Error creating user: ' + error.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      // 2. Update profile role (and store email in full_name if you like)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: newUserEmail.trim(), role: newUserRole })
        .eq('id', userId);

      if (profileError) {
        console.error(profileError);
        setMessage('User created, but failed to update profile role.');
      } else {
        setMessage('User created successfully.');
      }
    } else {
      setMessage('User created, but user id was not returned.');
    }

    // reset form and reload users
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('user');
    await loadData();
    setLoading(false);
  };

  //Change user role
    const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error(error);
      setMessage('Error updating user role');
    } else {
      setMessage('User role updated successfully.');
      await loadData(); // refresh users list
    }

    setLoading(false);
  };


  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* INFO BAR */}
      <div className="bg-white text-slate-900 p-4 rounded shadow flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Logged in as Admin</p>
          <p className="font-semibold">{profile.full_name || 'Admin User'}</p>
        </div>
        {loading && <div className="text-xs text-gray-500">Loading…</div>}
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-2 rounded">
          {message}
        </div>
      )}

      {/* 🔹 CREATE USERS SECTION */}
      <div className="bg-white text-slate-900 p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Create New User</h2>
        <form
          onSubmit={handleCreateUser}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              className="border border-slate-300 rounded-md p-2 w-full bg-slate-50 text-slate-900"
              placeholder="user@example.com"
              value={newUserEmail}
              onChange={e => setNewUserEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              className="border border-slate-300 rounded-md p-2 w-full bg-slate-50 text-slate-900"
              placeholder="Password"
              value={newUserPassword}
              onChange={e => setNewUserPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Role
            </label>
            <select
              className="border border-slate-300 rounded-md p-2 w-full bg-slate-50 text-slate-900"
              value={newUserRole}
              onChange={e => setNewUserRole(e.target.value as 'admin' | 'user')}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              disabled={loading}
            >
              Create User
            </button>
          </div>
        </form>

        {/* Users list */}
        <h3 className="font-semibold mt-6 mb-2 text-sm">Existing Users</h3>
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-slate-200 px-2 py-1 text-left">Email</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isSelf = u.id === profile.id; // optional: avoid changing own role
                  return (
                    <tr key={u.id}>
                      <td className="border border-slate-200 px-2 py-1">
                        {u.full_name || '—'}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        <select
                          className="border border-slate-300 rounded-md p-1 bg-slate-50 text-slate-900 text-xs"
                          value={u.role}
                          disabled={loading || isSelf}
                          onChange={e =>
                            handleUpdateUserRole(
                              u.id,
                              e.target.value as 'admin' | 'user'
                            )
                          }
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        {isSelf && (
                          <span className="ml-2 text-[10px] text-gray-500">
                            (you)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CATEGORIES + DEPARTMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white text-slate-900 p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Asset Categories</h2>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-3">
            <input
              className="border border-slate-300 rounded-md p-2 flex-1 bg-slate-50 text-slate-900"
              placeholder="New category name"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
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
              <li key={c.id} className="border-b border-slate-200 py-1">
                {c.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Departments */}
        <div className="bg-white text-slate-900 p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Departments</h2>
          <form onSubmit={handleAddDepartment} className="flex gap-2 mb-3">
            <input
              className="border border-slate-300 rounded-md p-2 flex-1 bg-slate-50 text-slate-900"
              placeholder="New department name"
              value={newDepartment}
              onChange={e => setNewDepartment(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
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
              <li key={d.id} className="border-b border-slate-200 py-1">
                {d.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ALL ASSETS */}
      <div className="bg-white text-slate-900 p-4 rounded shadow">
        <h2 className="font-semibold mb-3">All Assets</h2>
        {assets.length === 0 ? (
          <p className="text-sm text-gray-500">No assets available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200">
              <thead className="bg-gray-50 text-slate-900">
                <tr>
                  <th className="border border-slate-200 px-2 py-1 text-left">Asset Name</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Category</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Department</th>
                  <th className="border border-slate-200 px-2 py-1 text-right">Cost</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Date Purchased</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Created By</th>
                  <th className="border border-slate-200 px-2 py-1 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id}>
                    <td className="border border-slate-200 px-2 py-1">{a.asset_name}</td>
                    <td className="border border-slate-200 px-2 py-1">
                      {a.category_name || <span className="text-gray-400">–</span>}
                    </td>
                    <td className="border border-slate-200 px-2 py-1">
                      {a.department_name || <span className="text-gray-400">–</span>}
                    </td>
                    <td className="border border-slate-200 px-2 py-1 text-right">
                      ${a.cost?.toFixed ? a.cost.toFixed(2) : a.cost}
                    </td>
                    <td className="border border-slate-200 px-2 py-1">{a.date_purchased}</td>
                    <td className="border border-slate-200 px-2 py-1">
                      {a.created_by_name || <span className="text-gray-400">Unknown</span>}
                    </td>
                    <td className="border border-slate-200 px-2 py-1 text-center">
                      <button
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
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