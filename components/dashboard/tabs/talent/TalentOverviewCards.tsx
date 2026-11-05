import {Users, Activity, Award, CheckCircle2} from 'lucide-react';

interface OverviewProps {
	overview: {
		totalMembers: number;
		kpiAvailable: number;
		kpiCoveragePct: number;
		behaviorAssessed: number;
		behaviorCoveragePct: number;
		pendingBehaviorCount: number;
		skillAvailable: number;
		skillCoveragePct: number;
		completeCount: number;
		completenessPct: number;
	};
}

export default function TalentOverviewCards({overview}: OverviewProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
				<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
					<span>Total Active Population</span>
					<Users className="w-4 h-4 text-blue-500" />
				</div>
				<div className="text-2xl font-extrabold">{overview.totalMembers}</div>
				<p className="text-[11px] text-gray-400 mt-1">Denominator populasi aktif</p>
			</div>

			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
				<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
					<span>Current-Month KPI</span>
					<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500">
						Provisional
					</span>
				</div>
				<div className="text-2xl font-extrabold">
					{overview.kpiAvailable}{' '}
					<span className="text-xs font-normal text-gray-400">({overview.kpiCoveragePct}%)</span>
				</div>
				<p className="text-[11px] text-gray-400 mt-1">Skala 1–100% (Snapshot)</p>
			</div>

			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
				<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
					<span>Behavior Assessed</span>
					<Activity className="w-4 h-4 text-purple-500" />
				</div>
				<div className="text-2xl font-extrabold">
					{overview.behaviorAssessed}{' '}
					<span className="text-xs font-normal text-gray-400">
						({overview.behaviorCoveragePct}%)
					</span>
				</div>
				<p className="text-[11px] text-amber-500 mt-1">
					{overview.pendingBehaviorCount} Pending Assessment
				</p>
			</div>

			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
				<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
					<span>Skill Map Available</span>
					<Award className="w-4 h-4 text-emerald-500" />
				</div>
				<div className="text-2xl font-extrabold">
					{overview.skillAvailable}{' '}
					<span className="text-xs font-normal text-gray-400">({overview.skillCoveragePct}%)</span>
				</div>
				<p className="text-[11px] text-gray-400 mt-1">Indikator Kompetensi (1–5)</p>
			</div>

			<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-emerald-500/30 shadow-sm">
				<div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">
					<span>Complete Data (3/3)</span>
					<CheckCircle2 className="w-4 h-4" />
				</div>
				<div className="text-2xl font-extrabold text-emerald-500">
					{overview.completeCount}{' '}
					<span className="text-xs font-normal text-gray-400">({overview.completenessPct}%)</span>
				</div>
				<p className="text-[11px] text-gray-400 mt-1">Siap diuji pada 9-Box</p>
			</div>
		</div>
	);
}
