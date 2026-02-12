"use client";
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ id: null, name: '', price: '', category: 'Main Course', canteenLevel: 'Level 1' });

  // Categories & Levels constants
  const categories = ['Main Course', 'Dessert', 'Beverage', 'Snacks'];
  const levels = ['Level 1', 'Level 2', 'Level 3'];

  // Fetch items on load
  const fetchItems = async () => {
    const res = await fetch('/api/menu');
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PUT' : 'POST';
    await fetch('/api/menu', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setFormData({ id: null, name: '', price: '', category: 'Main Course', canteenLevel: 'Level 1' });
    fetchItems();
  };

  const deleteItem = async (id: number) => {
    if (confirm('Are you sure?')) {
      await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
      fetchItems();
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between">
        <h1 className="text-2xl font-bold">Canteen Admin Panel</h1>
        <a href="/" className="hover:underline">View Live Site</a>
      </nav>

      <div className="container mx-auto p-6">
        {/* Form Section */}
        <div className="bg-white rounded-lg text-black shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{formData.id ? 'Edit Item' : 'Add New Item'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Food Name"
              className="border p-2 rounded"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required 
            />
            <input 
              type="number" step="0.01" placeholder="Price"
              className="border p-2 rounded"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required 
            />
            <select
              className="border p-2 rounded"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              aria-label="Category"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="border p-2 rounded"
              value={formData.canteenLevel}
              onChange={(e) => setFormData({...formData, canteenLevel: e.target.value})}
              aria-label="Canteen Level"
            >
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="flex gap-2">
              <button className="bg-blue-500 text-white px-4 py-2 rounded">{formData.id ? 'Update' : 'Add'}</button>
              {formData.id && <button type="button" onClick={() => setFormData({id:null, name:'', price:'', category:'Main Course', canteenLevel:'Level 1'})} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>}
            </div>
          </form>
        </div>

        {/* Table Section */}
        <div className="bg-white text-black rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Level</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Price</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-t">
                  <td className="p-4">{item.canteenLevel}</td>
                  <td className="p-4">{item.category}</td>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4">RM {item.price.toFixed(2)}</td>
                  <td className="p-4">
                    <button onClick={() => setFormData(item)} className="text-blue-600 mr-4">Edit</button>
                    <button onClick={() => deleteItem(item.id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}