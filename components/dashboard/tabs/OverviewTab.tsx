import {
	ResponsiveContainer,
	ComposedChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	Bar,
	Line,
} from 'recharts';

export default function OverviewTab({monthlyTable, year}: {monthlyTable: any[]; year: string}) {
	return (
		<div className="space-y-6">
			<div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
				<h2 className="text-base font-bold mb-1">
					Grafik Pergerakan Headcount, New Hire & Exit ({year})
				</h2>
				<p className="text-xs text-gray-500 mb-6">
					Rekonsiliasi visual antara karyawan masuk, keluar, dan Closing Headcount setiap bulan.
				</p>
				<div className="h-72">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={monthlyTable}>
							<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
							<XAxis dataKey="month" fontSize={12} />
							<YAxis fontSize={12} />
							<Tooltip />
							<Legend />
							<Bar dataKey="newHire" name="New Hire" fill="#10b981" radius={[4, 4, 0, 0]} />
							<Bar dataKey="totalExit" name="Total Exit" fill="#ef4444" radius={[4, 4, 0, 0]} />
							<Line
								type="monotone"
								dataKey="closingHc"
								name="Closing HC"
								stroke="#3b82f6"
								strokeWidth={3}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
				<div className="p-5 border-b border-gray-200 dark:border-gray-800">
					<h2 className="text-base font-bold">Workforce Movement Table (Rekonsiliasi Bulanan)</h2>
					<p className="text-xs text-gray-500">
						Closing HC = Opening HC + New Hire - Total Employee Exit.
					</p>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse text-sm">
						<thead>
							<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
								<th className="py-3 px-5">Month</th>
								<th className="py-3 px-5">Opening HC</th>
								<th className="py-3 px-5">New Hire</th>
								<th className="py-3 px-5">Voluntary Exit</th>
								<th className="py-3 px-5">Involuntary Exit</th>
								<th className="py-3 px-5">Total Exit</th>
								<th className="py-3 px-5">Closing HC</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
							{monthlyTable.map((m) => (
								<tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
									<td className="py-3 px-5 font-bold">{m.month}</td>
									<td className="py-3 px-5">{m.openingHc}</td>
									<td className="py-3 px-5 text-emerald-500 font-semibold">+{m.newHire}</td>
									<td className="py-3 px-5 text-amber-500">{m.voluntaryExit}</td>
									<td className="py-3 px-5 text-red-500">{m.involuntaryExit}</td>
									<td className="py-3 px-5 font-bold text-red-500">{m.totalExit}</td>
									<td className="py-3 px-5 font-bold text-blue-500">{m.closingHc}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
