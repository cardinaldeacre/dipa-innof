import {AlertTriangle, Lock} from 'lucide-react';
import {EnrichedTalentMember} from '@/lib/engine/talentMapping';

interface GridCell {
	key: string;
	perf: string;
	pot: string;
	title: string;
	count: number;
	percentage: number;
	members: EnrichedTalentMember[];
}

interface NineBoxProps {
	experimentalMode: boolean;
	completeCount: number;
	gridCells: GridCell[];
	selectedBoxKey: string | null;
	setSelectedBoxKey: (key: string | null) => void;
}

export default function NineBoxMatrix({
	experimentalMode,
	completeCount,
	gridCells,
	selectedBoxKey,
	setSelectedBoxKey,
}: NineBoxProps) {
	return (
		<div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h2 className="text-base font-bold flex items-center gap-2">
						<span>HAV / 9-Box Matrix</span>
						{experimentalMode ? (
							<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
								Indicative / Experimental Mapping
							</span>
						) : (
							<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-200 dark:bg-gray-800 text-gray-500">
								Safe Placeholder Mode
							</span>
						)}
					</h2>
					<p className="text-xs text-gray-500 mt-0.5">
						{experimentalMode
							? 'Sumbu X = Current-Month KPI (Provisional) | Sumbu Y (Proxy Hipotesis) = 60% Behavior + 40% Skill Map. Klik kotak untuk memfilter tabel.'
							: 'Pemetaan 9-Box berada dalam mode Placeholder sesuai standar Safe Pilot.'}
					</p>
				</div>

				{selectedBoxKey && (
					<button
						onClick={() => setSelectedBoxKey(null)}
						className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold hover:bg-gray-200 cursor-pointer">
						Reset Filter Kotak ({selectedBoxKey})
					</button>
				)}
			</div>

			{experimentalMode ? (
				<>
					<div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2.5">
						<AlertTriangle className="w-4 h-4 flex-shrink-0" />
						<span>
							<b>Catatan Governance P&C:</b> Plot ini adalah simulasi eksperimental dari{' '}
							<b>{completeCount} karyawan</b> yang datanya lengkap. Karyawan berstatus{' '}
							<i>Pending Assessment / N/A</i> tidak dipaksa masuk ke dalam kotak. Bukan keputusan
							final promosi.
						</span>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
						{gridCells.map((cell) => {
							const isSelected = selectedBoxKey === cell.key;
							return (
								<div
									key={cell.key}
									onClick={() => setSelectedBoxKey(isSelected ? null : cell.key)}
									className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[125px] ${
										isSelected
											? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/5'
											: 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 hover:border-gray-400'
									}`}>
									<div>
										<div className="flex items-center justify-between gap-2">
											<span className="text-xs font-bold text-gray-800 dark:text-gray-100">
												{cell.title}
											</span>
											<span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
												{cell.count} org ({cell.percentage}%)
											</span>
										</div>
										<p className="text-[11px] text-gray-400 mt-1">
											Perf: <b>{cell.perf}</b> • Proxy (60B+40S): <b>{cell.pot}</b>
										</p>
									</div>

									<div className="mt-3 flex flex-wrap gap-1">
										{cell.members.slice(0, 4).map((m) => (
											<span
												key={m.employee_id}
												className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 truncate max-w-[120px]">
												{m.employee_name}
											</span>
										))}
										{cell.members.length > 4 && (
											<span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-500">
												+{cell.members.length - 4} lainnya
											</span>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</>
			) : (
				<div className="py-12 px-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 text-center space-y-2">
					<Lock className="w-8 h-8 text-gray-400 mx-auto" />
					<p className="text-sm font-bold">Grid 9-Box Berada dalam Mode Standby (Safe Pilot)</p>
					<p className="text-xs text-gray-500 max-w-lg mx-auto">
						Sesuai Blueprint Pilot 2026, sumbu Potential belum dikunci secara definitif. Gunakan
						toggle <b>Experimental 9-Box Preview</b> di atas jika ingin menguji simulasi hipotesis
						60% Behavior + 40% Skill Map.
					</p>
				</div>
			)}
		</div>
	);
}
