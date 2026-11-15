import {Users, Activity, Award, CheckCircle2, AlertCircle} from 'lucide-react';

interface OverviewProps {
	overview: {
		totalMembers: number;
		kpiEligibleDenominator?: number;
		internExcludedFromKpiCount?: number;
		kpiAvailable: number;
		kpiCoveragePct: number;
		behaviorAssessed: number;
		behaviorCoveragePct: number;
		pendingBehaviorCount: number;
		skillAvailable: number;
		skillCoveragePct: number;
		pendingCalibrationCount?: number;
		needsReviewCount?: number;
		completeCount: number;
		completenessPct: number;
	};
}

export default function TalentOverviewCards({overview}: OverviewProps) {
	const kpiDenom = overview.kpiEligibleDenominator ?? overview.totalMembers;
	const internCount = overview.internExcludedFromKpiCount ?? 0;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
				<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
					<span>Active Population</span>
					<Users className="w-4 h-4 text-blue-500" />
				</div>
				<div className="text-2xl font-extrabold">{overview.totalMembers}</div>
				<p className="text-[11px] text-gray-400 mt-1">
					KPI Eligible: <b>{kpiDenom}</b> {internCount > 0 ? `(${internCount} Intern N/A)` : ''}
				</p>
			</div>

			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
				<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
					<span>Quarterly KPI (Sumbu X)</span>
					<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-500">
						YYYY-Qn
					</span>
				</div>
				<div className="text-2xl font-extrabold">
					{overview.kpiAvailable}/{kpiDenom}{' '}
					<span className="text-xs font-normal text-gray-400">({overview.kpiCoveragePct}%)</span>
				</div>
				<p className="text-[11px] text-gray-400 mt-1">Maks 100% (Intern dikeluarkan)</p>
			</div>

			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
				<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
					<span>Behavior (7 Dimensi)</span>
					<Activity className="w-4 h-4 text-purple-500" />
				</div>
				<div className="text-2xl font-extrabold">
					{overview.behaviorAssessed}{' '}
					<span className="text-xs font-normal text-gray-400">
						({overview.behaviorCoveragePct}%)
					</span>
				</div>
				<p className="text-[11px] text-amber-500 mt-1">
					{overview.pendingBehaviorCount} belum lengkap 7 dimensi
				</p>
			</div>

			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
				<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
					<span>Skill Map (L1–L4 Gap)</span>
					<Award className="w-4 h-4 text-emerald-500" />
				</div>
				<div className="text-2xl font-extrabold">
					{overview.skillAvailable}{' '}
					<span className="text-xs font-normal text-gray-400">({overview.skillCoveragePct}%)</span>
				</div>
				<p className="text-[11px] text-amber-500 mt-1">
					{overview.pendingCalibrationCount
						? `${overview.pendingCalibrationCount} Pending Calibration (|Δ| ≥ 2)`
						: 'Konversi Gap 0/40/70/85/100'}
				</p>
			</div>

			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-emerald-500/30 shadow-sm">
				<div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">
					<span>Complete & Validated</span>
					<CheckCircle2 className="w-4 h-4" />
				</div>
				<div className="text-2xl font-extrabold text-emerald-500">
					{overview.completeCount}{' '}
					<span className="text-xs font-normal text-gray-400">({overview.completenessPct}%)</span>
				</div>
				<p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
					{overview.needsReviewCount ? (
						<span className="text-red-500 font-semibold flex items-center gap-1">
							<AlertCircle className="w-3 h-3" /> {overview.needsReviewCount} Needs Review
						</span>
					) : (
						'Siap di-plot ke 9-Box Matrix'
					)}
				</p>
			</div>
		</div>
	);
}
