import {X, Loader2} from 'lucide-react';
import {EnrichedTalentMember} from '@/lib/engine/talentMapping';

interface ModalsProps {
	detailMember: EnrichedTalentMember | null;
	setDetailMember: (m: EnrichedTalentMember | null) => void;
	editingMember: EnrichedTalentMember | null;
	setEditingMember: (m: EnrichedTalentMember | null) => void;
	onSaveManual: (e: React.FormEvent<HTMLFormElement>) => void;
	saving: boolean;
	feedback: {success: boolean; message: string} | null;
}

export default function TalentModals({
	detailMember,
	setDetailMember,
	editingMember,
	setEditingMember,
	onSaveManual,
	saving,
	feedback,
}: ModalsProps) {
	return (
		<>
			{detailMember && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
						<div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
							<div>
								<h3 className="text-base font-bold">{detailMember.employee_name}</h3>
								<p className="text-xs text-gray-500">
									{detailMember.employee_id} • {detailMember.department} ({detailMember.job_title})
								</p>
							</div>
							<button
								onClick={() => setDetailMember(null)}
								className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-3 text-xs">
							<div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-1">
								<div className="flex justify-between font-bold">
									<span>1. Current Performance Snapshot (Provisional)</span>
									<span className="text-blue-500">
										{detailMember.kpi_current_month !== null
											? `${detailMember.kpi_current_month}%`
											: 'N/A'}
									</span>
								</div>
								<p className="text-gray-500">
									Periode: {detailMember.kpi_period || 'Tidak tercatat'}
								</p>
							</div>

							<div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-1">
								<div className="flex justify-between font-bold">
									<span>2. Behavior Indicator (Lead Score)</span>
									<span className="text-purple-500">
										{detailMember.behavior_lead_score !== null
											? `${detailMember.behavior_lead_score} / 5.0`
											: 'Pending Assessment'}
									</span>
								</div>
								<p className="text-gray-500">
									Periode: {detailMember.behavior_period || '-'} • Evaluator:{' '}
									{detailMember.behavior_evaluator || '-'}
								</p>
							</div>

							<div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-1">
								<div className="flex justify-between font-bold">
									<span>3. Competency Indicator (Skill Map)</span>
									<span className="text-emerald-500">
										{detailMember.skill_map_score !== null
											? `${detailMember.skill_map_score} / 5.0`
											: 'N/A'}
									</span>
								</div>
								<p className="text-gray-500">
									Periode: {detailMember.skill_period || '-'} • Ekspektasi Level:{' '}
									{detailMember.skill_level || '-'}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{editingMember && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
					<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
						<div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
							<div>
								<h3 className="text-base font-bold">Input / Update Talent Mapping</h3>
								<p className="text-xs text-gray-500">
									{editingMember.employee_name} ({editingMember.employee_id}) — Kosongkan field jika
									belum dinilai (Pending).
								</p>
							</div>
							<button
								onClick={() => setEditingMember(null)}
								className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
								<X className="w-5 h-5" />
							</button>
						</div>

						<form onSubmit={onSaveManual} className="mt-4 space-y-4 text-xs">
							<input type="hidden" name="employee_id" value={editingMember.employee_id} />

							<div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
								<p className="font-bold text-blue-500">
									1. Current-Month KPI Snapshot (Provisional)
								</p>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block font-medium mb-1">Skor KPI (1 - 100%)</label>
										<input
											type="number"
											step="0.01"
											min="0"
											max="100"
											name="kpi_current_month"
											defaultValue={editingMember.kpi_current_month ?? ''}
											placeholder="Contoh: 88.5"
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
									<div>
										<label className="block font-medium mb-1">Periode KPI</label>
										<input
											type="text"
											name="kpi_period"
											defaultValue={editingMember.kpi_period || '2026-10'}
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
								</div>
							</div>

							<div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
								<p className="font-bold text-purple-500">2. Behavior Assessment (Lead Score)</p>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div>
										<label className="block font-medium mb-1">Lead Score (1.0 - 5.0)</label>
										<input
											type="number"
											step="0.01"
											min="1"
											max="5"
											name="behavior_lead_score"
											defaultValue={editingMember.behavior_lead_score ?? ''}
											placeholder="Kosong = Pending"
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
									<div>
										<label className="block font-medium mb-1">Periode Behavior</label>
										<input
											type="text"
											name="behavior_period"
											defaultValue={editingMember.behavior_period || '2026-H2'}
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
									<div>
										<label className="block font-medium mb-1">Evaluator / Lead</label>
										<input
											type="text"
											name="behavior_evaluator"
											defaultValue={editingMember.behavior_evaluator || ''}
											placeholder="Contoh: Lead Design"
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
								</div>
							</div>

							<div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
								<p className="font-bold text-emerald-500">3. Competency Indicator (Skill Map)</p>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div>
										<label className="block font-medium mb-1">Skill Score (1.0 - 5.0)</label>
										<input
											type="number"
											step="0.01"
											min="1"
											max="5"
											name="skill_map_score"
											defaultValue={editingMember.skill_map_score ?? ''}
											placeholder="Contoh: 4.2"
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
									<div>
										<label className="block font-medium mb-1">Ekspektasi Level</label>
										<input
											type="text"
											name="skill_level"
											defaultValue={editingMember.skill_level || editingMember.job_title || ''}
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
									<div>
										<label className="block font-medium mb-1">Periode Skill Map</label>
										<input
											type="text"
											name="skill_period"
											defaultValue={editingMember.skill_period || '2026-Q3'}
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
								</div>
							</div>

							{feedback && (
								<div
									className={`p-3 rounded-lg font-medium ${
										feedback.success
											? 'bg-emerald-500/10 text-emerald-500'
											: 'bg-red-500/10 text-red-500'
									}`}>
									{feedback.message}
								</div>
							)}

							<div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
								<button
									type="button"
									onClick={() => setEditingMember(null)}
									className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold">
									Batal
								</button>
								<button
									type="submit"
									disabled={saving}
									className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 cursor-pointer">
									{saving && <Loader2 className="w-4 h-4 animate-spin" />}
									Simpan Skor
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
