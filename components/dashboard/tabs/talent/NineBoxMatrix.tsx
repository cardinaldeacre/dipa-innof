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
						<span>HAV / 9-Box Matrix (Performance × Capability)</span>
						{experimentalMode ? (
							<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
								P&C Validation Approved — Indicative / Experimental
							</span>
						) : (
							<span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500">
								Validation Gate Locked (Review Mode)
							</span>
						)}
					</h2>
					<p className="text-xs text-gray-500 mt-0.5">
						{experimentalMode
							? 'Sumbu X = Performance (KPI Kuartalan: Low <80, Med 80–<100, High 100) | Sumbu Y = Capability Score (60% Skill + 40% Behavior_100: Low 0–59, Med 60–79, High 80–100).'
							: 'Plot 9-Box dikunci sampai hasil validasi data ditinjau dan tombol "P&C Validation Approved (Activate Scoring)" diaktifkan.'}
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
						<AlertTriangle className="w-4 h-4 shrink-0" />
						<span>
							<b>Catatan Governance P&C:</b> Sumbu Y adalah <b>Capability Score</b> (60% Skill + 40%
							Behavior), <u>bukan Potential</u>. Hanya <b>{completeCount} member</b> dengan status{' '}
							<i>Complete / Provisional</i> yang di-plot. Member berstatus{' '}
							<i>Pending Calibration / Incomplete / ID Pending</i> tidak dipaksa masuk ke kotak.
						</span>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
						{gridCells.map((cell) => {
							const isSelected = selectedBoxKey === cell.key;
							return (
								<div
									key={cell.key}
									onClick={() => setSelectedBoxKey(isSelected ? null : cell.key)}
									className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-31.25 ${
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
											Performance: <b>{cell.perf}</b> • Capability (60S+40B): <b>{cell.pot}</b>
										</p>
									</div>

									<div className="mt-3 flex flex-wrap gap-1">
										{cell.members.slice(0, 4).map((m) => (
											<span
												key={m.employee_id}
												className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 truncate max-w-32.5">
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
					<Lock className="w-8 h-8 text-amber-500 mx-auto" />
					<p className="text-sm font-bold">
						Validation Gate Aktif — Menunggu Persetujuan P&C (Activate Scoring)
					</p>
					<p className="text-xs text-gray-500 max-w-xl mx-auto">
						Sesuai Bagian 5.6 Spesifikasi, silakan tinjau kelengkapan data, status kalibrasi
						(|Delta| &ge; 2), dan validasi ID pada tabel di bawah terlebih dahulu sebelum
						mengaktifkan switch <b>P&C Validation Approved (Activate Scoring)</b> di kanan atas.
					</p>
				</div>
			)}
		</div>
	);
}
