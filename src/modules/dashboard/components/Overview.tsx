"use client"

import { 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Area,
  AreaChart
} from "recharts"

const data = [
  { name: "ม.ค.", revenue: 12000 },
  { name: "ก.พ.", revenue: 21000 },
  { name: "มี.ค.", revenue: 18000 },
  { name: "เม.ย.", revenue: 24000 },
  { name: "พ.ค.", revenue: 32000 },
  { name: "มิ.ย.", revenue: 45000 },
  { name: "ก.ค.", revenue: 41000 },
  { name: "ส.ค.", revenue: 52000 },
  { name: "ก.ย.", revenue: 48000 },
  { name: "ต.ค.", revenue: 61000 },
  { name: "พ.ย.", revenue: 58000 },
  { name: "ธ.ค.", revenue: 72000 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-4 min-w-[160px]">
        <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">รายได้</span>
            <span className="text-sm font-bold text-sky-600">฿{payload[0].value.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke="#E2E8F0" 
        />
        <XAxis
          dataKey="name"
          stroke="#94A3B8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          fontWeight={500}
        />
        <YAxis
          stroke="#94A3B8"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
          tickMargin={8}
          fontWeight={500}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#0ea5e9"
          strokeWidth={3}
          fill="url(#colorRevenue)"
          activeDot={{ 
            r: 6, 
            strokeWidth: 3, 
            stroke: '#fff',
            fill: '#0ea5e9',
            style: { filter: 'drop-shadow(0 2px 4px rgba(14, 165, 233, 0.4))' }
          }}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
