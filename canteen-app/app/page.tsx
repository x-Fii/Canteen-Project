"use client";
import { useState, useEffect } from 'react';

export default function MenuPage() {
  const [selectedLevel, setSelectedLevel] = useState('Level 1');
  const [items, setItems] = useState([]);
  const categories = ['Main Course', 'Dessert', 'Beverage', 'Snacks'];

  useEffect(() => {
    fetch(`/api/menu?level=${selectedLevel}`)
      .then(res => res.json())
      .then(data => setItems(data));
  }, [selectedLevel]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center px-8">
        <span className="font-bold text-xl text-blue-600">Campus Canteen</span>
        <a href="/admin" className="text-gray-500 text-sm">Admin Login</a>
      </header>

      {/* Level Filter */}
      <div className="bg-white border-b p-6 text-center">
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">Select Level</h2>
        <div className="flex justify-center gap-4">
          {['Level 1', 'Level 2', 'Level 3'].map(lvl => (
            <button 
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-6 py-2 rounded-full border transition ${selectedLevel === lvl ? 'bg-blue-600 text-white' : 'border-blue-600 text-blue-600'}`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards */}
      <main className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map(cat => (
          <div key={cat} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-blue-600 p-3 text-white text-center font-bold uppercase">{cat}</div>
            <div className="p-4">
              {items.filter((i: any) => i.category === cat).map((item: any) => (
                <div key={item.id} className="flex justify-between border-b py-2">
                  <span>{item.name}</span>
                  <span className="font-bold text-green-600">RM {item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}