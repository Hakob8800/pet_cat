import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { getAnalytics } from '../../api/client'

interface Summary {
  todayOrders: number
  todayRevenue: number
  activeOrders: number
  weekOrders: number
  weekRevenue: number
}

interface TopItem {
  name: string
  totalQuantity: number
  totalRevenue: number
}

interface DailyStat {
  date: string
  revenue: number
  orderCount: number
}

interface Analytics {
  summary: Summary
  topItems: TopItem[]
  revenueByDay: DailyStat[]
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface KpiCardProps {
  label: string
  value: string
  sub?: string
}

function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

export default function Analytics() {
  const { id: restaurantId } = useParams()
  const [data, setData] = useState<Analytics | null>(null)
  const [days, setDays] = useState<7 | 30>(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!restaurantId) return
    setLoading(true)
    getAnalytics(Number(restaurantId), days)
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [restaurantId, days])

  const chartData = data?.revenueByDay.map((s) => ({
    date: formatShortDate(s.date),
    revenue: Number(s.revenue),
    orders: s.orderCount,
  })) ?? []

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-semibold">Analytics</h1>
          </div>
          <div className="flex gap-2">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  days === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {d === 7 ? '7 days' : '30 days'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                label="Today's orders"
                value={String(data.summary.todayOrders)}
              />
              <KpiCard
                label="Today's revenue"
                value={formatMoney(data.summary.todayRevenue)}
              />
              <KpiCard
                label="Active orders"
                value={String(data.summary.activeOrders)}
                sub="not yet completed"
              />
              <KpiCard
                label={`Revenue (${days}d)`}
                value={formatMoney(data.summary.weekRevenue)}
                sub={`${data.summary.weekOrders} orders`}
              />
            </div>

            {/* Revenue chart */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Revenue by day
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={days === 7 ? 32 : 14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatMoney(Number(value)), 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top items */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Top dishes ({days === 7 ? 'last 7 days' : 'last 30 days'})
              </h2>
              {data.topItems.length === 0 ? (
                <p className="text-gray-400 text-sm">No orders in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Dish</th>
                      <th className="pb-2 font-medium text-right">Qty</th>
                      <th className="pb-2 font-medium text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topItems.map((item, idx) => (
                      <tr key={item.name} className="border-b last:border-0">
                        <td className="py-2.5 text-gray-400 w-6">{idx + 1}</td>
                        <td className="py-2.5 font-medium text-gray-800">{item.name}</td>
                        <td className="py-2.5 text-right text-gray-600">{item.totalQuantity}</td>
                        <td className="py-2.5 text-right font-semibold text-gray-900">
                          {formatMoney(item.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
