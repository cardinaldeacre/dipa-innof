import {UserCheck, AlertTriangle, TrendingDown} from 'lucide-react';
import MetricCard from '../MetricCard';

export default function HiringTab({analytics, year}: {analytics: any; year: string}) {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<MetricCard
					title="Probation Pass Rate"
					subtitle="Karyawan dengan Completed Outcome"
					metric={analytics.summary.probationPassRate}
					icon={UserCheck}
				/>
				<MetricCard
					title="Failed Probation Rate"
					subtitle="Gagal Probation ÷ Completed Outcome"
					metric={analytics.summary.failedProbationRate}
					icon={AlertTriangle}
				/>
				<MetricCard
					title="New Hire Attrition Rate (YTD)"
					subtitle="New Hire Exit ÷ Total New Hire Cohort"
					metric={analytics.summary.newHireAttritionRate}
					icon={TrendingDown}
				/>
			</div>

			<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
				<div className="p-5 border-b border-gray-200 dark:border-gray-800">
					<h2 className="text-base font-bold">Hiring Effectiveness Table ({year})</h2>
					<p className="text-xs text-gray-500">
						Karyawan yang masih menjalani probation (Pending) tidak masuk ke denominator Pass/Failed
						Rate.
					</p>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse text-sm">
						<thead>
							<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
								<th className="py-3 px-5">Period</th>
								<th className="py-3 px-5">New Hire</th>
								<th className="py-3 px-5">Passed</th>
								<th className="py-3 px-5">Failed</th>
								<th className="py-3 px-5">Pending</th>
								<th className="py-3 px-5">Pass Rate</th>
								<th className="py-3 px-5">Failed Rate</th>
								<th className="py-3 px-5">Cohort Attrition</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
							{analytics.hiringEffectivenessTable.map((q: any) => (
								<tr key={q.period} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
									<td className="py-3 px-5 font-bold">{q.period}</td>
									<td className="py-3 px-5 font-semibold">{q.newHire}</td>
									<td className="py-3 px-5 text-emerald-500 font-semibold">{q.passed}</td>
									<td className="py-3 px-5 text-red-500 font-semibold">{q.failed}</td>
									<td className="py-3 px-5 text-gray-400">{q.pending}</td>
									<td className="py-3 px-5 font-bold text-emerald-500">
										{q.passRate !== null ? `${q.passRate}%` : 'N/A'}
									</td>
									<td className="py-3 px-5 font-bold text-red-500">
										{q.failedRate !== null ? `${q.failedRate}%` : 'N/A'}
									</td>
									<td className="py-3 px-5 text-amber-500">
										{q.attritionRate !== null ? `${q.attritionRate}%` : 'N/A'}
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
