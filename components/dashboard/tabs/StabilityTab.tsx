import {
	ResponsiveContainer,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Bar,
	Cell,
} from 'recharts';
import {TrendingDown, AlertTriangle} from 'lucide-react';
import MetricCard from '../MetricCard';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function StabilityTab({analytics}: {analytics: any}) {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<MetricCard
					title="Voluntary Turnover Rate (YTD)"
					subtitle="Keputusan karyawan sendiri (Resign)"
					metric={analytics.summary.voluntaryTurnoverYTD}
					icon={TrendingDown}
				/>
				<MetricCard
					title="Involuntary Turnover Rate (YTD)"
					subtitle="Keputusan perusahaan (Failed Probation, Non-Renewal, Termination)"
					metric={analytics.summary.involuntaryTurnoverYTD}
					icon={AlertTriangle}
				/>
			</div>

			<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
				<div className="p-5 border-b border-gray-200 dark:border-gray-800">
					<h2 className="text-base font-bold">Monthly Metrics Table</h2>
					<p className="text-xs text-gray-500">
						Rincian persentase Total Turnover, Voluntary TO, Involuntary TO, dan Monthly Retention
						setiap bulan.
					</p>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse text-sm">
						<thead>
							<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
								<th className="py-3 px-5">Month</th>
								<th className="py-3 px-5">Average HC</th>
								<th className="py-3 px-5">Turnover (%)</th>
								<th className="py-3 px-5">Voluntary TO (%)</th>
								<th className="py-3 px-5">Involuntary TO (%)</th>
								<th className="py-3 px-5">Monthly Retention (%)</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
							{analytics.monthlyTable.map((m: any) => (
								<tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
									<td className="py-3 px-5 font-bold">{m.month}</td>
									<td className="py-3 px-5 text-gray-500">{m.avgHc}</td>
									<td className="py-3 px-5 font-bold text-red-500">{m.turnoverRate}%</td>
									<td className="py-3 px-5 text-amber-500">{m.voluntaryTurnoverRate}%</td>
									<td className="py-3 px-5 text-rose-500">{m.involuntaryTurnoverRate}%</td>
									<td className="py-3 px-5 font-bold text-emerald-500">{m.retentionRate}%</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
					<h2 className="text-base font-bold mb-1">Distribusi Exit Reason</h2>
					<p className="text-xs text-gray-500 mb-4">
						Alasan keluar berdasarkan kategori standar HR.
					</p>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={analytics.exitByReason} layout="vertical" margin={{left: 30}}>
								<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
								<XAxis type="number" fontSize={12} />
								<YAxis dataKey="name" type="category" fontSize={11} width={120} />
								<Tooltip />
								<Bar dataKey="count" name="Jumlah Exit" radius={[0, 6, 6, 0]}>
									{analytics.exitByReason.map((_: any, idx: number) => (
										<Cell key={idx} fill={COLORS[idx % COLORS.length]} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
					<h2 className="text-base font-bold mb-1">Distribusi Exit Type</h2>
					<p className="text-xs text-gray-500 mb-4">
						Perbandingan Voluntary, Involuntary, Non-Renewal & Probation.
					</p>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={analytics.exitByType}>
								<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
								<XAxis dataKey="name" fontSize={11} />
								<YAxis fontSize={12} />
								<Tooltip />
								<Bar dataKey="count" name="Jumlah Exit" fill="#3b82f6" radius={[6, 6, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
}
