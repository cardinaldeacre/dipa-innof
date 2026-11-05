export default function DepartmentTab({departmentBreakdown}: {departmentBreakdown: any[]}) {
	return (
		<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
			<div className="p-6 border-b border-gray-200 dark:border-gray-800">
				<h2 className="text-base font-bold">Employee Movement per Departemen (YTD)</h2>
				<p className="text-xs text-gray-500">
					Rekonsiliasi Opening HC, New Hire, Voluntary/Involuntary Exit, dan Closing HC per divisi.
				</p>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse text-sm">
					<thead>
						<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
							<th className="py-3.5 px-6">Departemen</th>
							<th className="py-3.5 px-6">Opening HC (1 Jan)</th>
							<th className="py-3.5 px-6">New Hire (YTD)</th>
							<th className="py-3.5 px-6">Voluntary Exit</th>
							<th className="py-3.5 px-6">Involuntary Exit</th>
							<th className="py-3.5 px-6">Total Exit (YTD)</th>
							<th className="py-3.5 px-6">Closing HC</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
						{departmentBreakdown.map((d) => (
							<tr key={d.department} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
								<td className="py-3.5 px-6 font-semibold">{d.department}</td>
								<td className="py-3.5 px-6">{d.openingHc}</td>
								<td className="py-3.5 px-6 text-emerald-500 font-semibold">+{d.hiresYTD}</td>
								<td className="py-3.5 px-6 text-amber-500">{d.voluntaryExitsYTD}</td>
								<td className="py-3.5 px-6 text-rose-500">{d.involuntaryExitsYTD}</td>
								<td className="py-3.5 px-6 text-red-500 font-bold">{d.exitsYTD}</td>
								<td className="py-3.5 px-6 font-bold text-blue-500">{d.activeHc}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
