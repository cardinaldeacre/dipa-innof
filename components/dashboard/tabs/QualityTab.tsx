import {DataQualityIssue} from '@/lib/engine/analytics';

export default function QualityTab({qualityIssues}: {qualityIssues: DataQualityIssue[]}) {
	return (
		<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
			<div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
				<div>
					<h2 className="text-base font-bold">Data Governance & Quality Validator</h2>
					<p className="text-xs text-gray-500">
						Daftar record karyawan yang belum memenuhi syarat Data Governance Blueprint 2.0:
					</p>
				</div>
				<span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
					{qualityIssues.length} Issues Found
				</span>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse text-sm">
					<thead>
						<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
							<th className="py-3.5 px-6">Employee ID</th>
							<th className="py-3.5 px-6">Nama Karyawan</th>
							<th className="py-3.5 px-6">Tipe Masalah</th>
							<th className="py-3.5 px-6">Keterangan Detail</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
						{qualityIssues.length === 0 ? (
							<tr>
								<td colSpan={4} className="py-8 text-center text-gray-500">
									🎉 Semua data bersih dan sesuai standar Data Governance Blueprint 2.0!
								</td>
							</tr>
						) : (
							qualityIssues.map((issue, idx) => (
								<tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
									<td className="py-3.5 px-6 font-mono text-xs">{issue.employee_id}</td>
									<td className="py-3.5 px-6 font-medium">{issue.employee_name}</td>
									<td className="py-3.5 px-6">
										<span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-500">
											{issue.issue_type}
										</span>
									</td>
									<td className="py-3.5 px-6 text-gray-500 text-xs">{issue.description}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
