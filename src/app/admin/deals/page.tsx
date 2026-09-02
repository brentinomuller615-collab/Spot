'use client';

import React, { useState } from 'react';

// Basic static layout for admin until a real DB is hooked up
export default function AdminDealsPage() {
  const [activeTab, setActiveTab] = useState<'businesses' | 'deals'>('businesses');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Spot Admin — Deals</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage businesses and promotional deals for the local area.</p>
        </header>

        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('businesses')}
              className={`flex-1 py-4 px-6 font-bold text-center ${activeTab === 'businesses' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              Businesses
            </button>
            <button 
              onClick={() => setActiveTab('deals')}
              className={`flex-1 py-4 px-6 font-bold text-center ${activeTab === 'deals' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              Active Deals
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'businesses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Registered Businesses</h2>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                    + Add Business
                  </button>
                </div>
                
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
                      <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <tr>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">The Daily Grind</td>
                        <td className="px-6 py-4 text-slate-500">Cafe</td>
                        <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">Active</span></td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-600 hover:underline">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">Burger Joint</td>
                        <td className="px-6 py-4 text-slate-500">Restaurant</td>
                        <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">Active</span></td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-600 hover:underline">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'deals' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Active Deals</h2>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                    + Create Deal
                  </button>
                </div>
                
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
                      <tr>
                        <th className="px-6 py-3">Business</th>
                        <th className="px-6 py-3">Deal Title</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <tr>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">The Daily Grind</td>
                        <td className="px-6 py-4 text-slate-500">Coffee + Croissant — R45</td>
                        <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">Active</span></td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-600 hover:underline">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">Burger Joint</td>
                        <td className="px-6 py-4 text-slate-500">Free Fries with any Smash Burger</td>
                        <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">Active</span></td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-600 hover:underline">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
