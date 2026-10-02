'use client';

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

interface ChartProps {
  data: any[];
  config: {
    type?: 'bar' | 'line' | 'pie';
    xKey?: string;
    yKey?: string;
    title?: string;
  };
}

const COLORS = ['#2563EB', '#0D9488', '#F59E0B', '#8B5CF6', '#EC4899', '#0284C7'];

export default function DynamicChart({ data, config }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No chart data available for this query
      </div>
    );
  }

  // Derive sensible keys if missing
  const keys = Object.keys(data[0] || {});
  const xKey = config.xKey && keys.includes(config.xKey) ? config.xKey : keys[0];
  const yKey = config.yKey && keys.includes(config.yKey) ? config.yKey : (keys[1] || keys[0]);
  const chartType = config.type || 'bar';

  const formatTooltipValue = (value: any) => {
    if (typeof value === 'number') {
      return `₹${Number(value).toLocaleString('en-IN')}`;
    }
    return value;
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          {config.title || 'Visual Sales Analytics'}
        </h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200">
          {data.length} records · {chartType.toUpperCase()}
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey={xKey} stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0F172A', fontWeight: 500 }}
                formatter={formatTooltipValue}
              />
              <Line type="monotone" dataKey={yKey} stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 5 }} />
            </LineChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                paddingAngle={4}
                label={(entry) => entry[xKey]}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={formatTooltipValue}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#64748B' }} />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey={xKey}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                tickFormatter={(v) => `₹${Number(v) >= 100000 ? `${(Number(v) / 100000).toFixed(1)}L` : v}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0F172A', fontWeight: 500 }}
                formatter={formatTooltipValue}
              />
              <Bar dataKey={yKey} fill="#2563EB" radius={[6, 6, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={index === 0 ? '#1D4ED8' : '#3B82F6'} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
