import {useState, useEffect} from 'react';
import {X, Loader2, Plus, Trash2, AlertTriangle} from 'lucide-react';
import {EnrichedTalentMember, TALENT_CONFIG} from '@/lib/engine/talentMapping';

interface ModalsProps {
	detailMember: EnrichedTalentMember | null;
	setDetailMember: (m: EnrichedTalentMember | null) => void;
	editingMember: EnrichedTalentMember | null;
	setEditingMember: (m: EnrichedTalentMember | null) => void;
	onSaveManual: (e: React.FormEvent<HTMLFormElement>) => void;
	saving: boolean;
	feedback: {success: boolean; message: string} | null;
}

interface EditableSkillRow {
	competency_name: string;
	is_applicable: boolean;
	self_score: number | null;
	lead_score: number | null;
	final_score: number | null;
	target_score: number | null;
	one_on_one_confirmed: boolean;
}

const DEFAULT_UIUX_SKILLS: EditableSkillRow[] = [
	{
		competency_name: 'User Research & Synthesis',
		is_applicable: true,
		self_score: 3,
		lead_score: 3,
		final_score: 3,
		target_score: 3,
		one_on_one_confirmed: true,
	},
	{
		competency_name: 'Interaction & Visual Design',
		is_applicable: true,
		self_score: 3,
		lead_score: 3,
		final_score: 3,
		target_score: 3,
		one_on_one_confirmed: true,
	},
	{
		competency_name: 'Design System & Prototyping',
		is_applicable: true,
		self_score: 3,
		lead_score: 3,
		final_score: 3,
		target_score: 3,
		one_on_one_confirmed: true,
	},
];

export default function TalentModals({
	detailMember,
	setDetailMember,
	editingMember,
	setEditingMember,
	onSaveManual,
	saving,
	feedback,
}: ModalsProps) {
	const [skillRows, setSkillRows] = useState<EditableSkillRow[]>([]);

	useEffect(() => {
		if (editingMember) {
			if (editingMember.skill_competencies && editingMember.skill_competencies.length > 0) {
				setSkillRows(
					editingMember.skill_competencies.map((c) => ({
						competency_name: c.competency_name,
						is_applicable: c.is_applicable,
						self_score: c.self_score,
						lead_score: c.lead_score,
						final_score: c.final_score,
						target_score: c.target_score,
						one_on_one_confirmed: c.one_on_one_confirmed,
					}))
				);
			} else {
				setSkillRows(DEFAULT_UIUX_SKILLS);
			}
		}
	}, [editingMember]);

	const updateSkillRow = (idx: number, field: keyof EditableSkillRow, value: any) => {
		setSkillRows((prev) => prev.map((r, i) => (i === idx ? {...r, [field]: value} : r)));
	};

	const addSkillRow = () => {
		setSkillRows((prev) => [
			...prev,
			{
				competency_name: '',
				is_applicable: true,
				self_score: null,
				lead_score: null,
				final_score: null,
				target_score: 3,
				one_on_one_confirmed: false,
			},
		]);
	};

	const removeSkillRow = (idx: number) => {
		setSkillRows((prev) => prev.filter((_, i) => i !== idx));
	};

	return (
		<>
			{detailMember && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
					<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
							<div>
								<h3 className="text-base font-bold">{detailMember.employee_name}</h3>
								<p className="text-xs text-gray-500">
									{detailMember.employee_id} • {detailMember.department} • {detailMember.job_title}{' '}
									(<b>{detailMember.job_level}</b> — {detailMember.job_level_basis})
								</p>
							</div>
							<button
								onClick={() => setDetailMember(null)}
								className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
								<X className="w-5 h-5" />
							</button>
						</div>

						{detailMember.review_notes.length > 0 && (
							<div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs space-y-1">
								<div className="font-bold flex items-center gap-1.5">
									<AlertTriangle className="w-4 h-4" /> Catatan Validasi Data (Data_Validation):
								</div>
								<ul className="list-disc list-inside space-y-0.5">
									{detailMember.review_notes.map((n, idx) => (
										<li key={idx}>{n}</li>
									))}
								</ul>
							</div>
						)}

						<div className="space-y-4 text-xs">
							{/* 1. KPI */}
							<div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-1">
								<div className="flex justify-between font-bold">
									<span>
										1. Sumbu X — Quarterly KPI Performance ({detailMember.kpi_period || 'N/A'})
									</span>
									<span className="text-blue-500">
										{detailMember.is_intern
											? 'Not Applicable (Intern)'
											: detailMember.kpi_raw !== null
												? `${detailMember.kpi_raw}% (${detailMember.performance_bucket || 'Invalid'})`
												: 'Not Available'}
									</span>
								</div>
								<p className="text-gray-500">
									Threshold Sumbu X: Low &lt; 80 | Medium 80 – &lt;100 | High = 100 (maks 100%, 99
									tidak dibulatkan).
								</p>
							</div>

							{/* 2. Behavior 7 Dimensi */}
							<div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-2">
								<div className="flex justify-between font-bold">
									<span>
										2. Behavior Assessment — 7 Dimensi ({detailMember.behavior_period || '2026'})
									</span>
									<span className="text-purple-500">
										{detailMember.behavior_normalized_100 !== null
											? `Normalized: ${detailMember.behavior_normalized_100}/100 (Raw Avg: ${detailMember.behavior_raw_avg}/5.0)`
											: detailMember.behavior_status}
									</span>
								</div>
								<p className="text-gray-500">
									Evaluator: <b>{detailMember.behavior_evaluator || '-'}</b> • Metode:{' '}
									<b>{detailMember.behavior_method_label || '7 Dimensi'}</b>
								</p>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
									{TALENT_CONFIG.behaviorDimensionNames.map((label, idx) => {
										const val = detailMember.behavior_dimensions[idx];
										return (
											<div
												key={label}
												className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
												<span className="text-gray-600 dark:text-gray-300">{label}</span>
												<span className="font-bold text-purple-500">
													{val !== null && val !== undefined ? `${val} / 5` : '-'}
												</span>
											</div>
										);
									})}
								</div>
								{detailMember.behavior_evidence && (
									<p className="text-gray-500 pt-1">
										<b>Evidence:</b> {detailMember.behavior_evidence}
									</p>
								)}
							</div>

							{/* 3. Skill Map Granular */}
							<div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-2">
								<div className="flex justify-between font-bold">
									<span>
										3. Competency Skill Map — Level L1–L4 ({detailMember.skill_period || '2026'})
									</span>
									<span className="text-emerald-500">
										{detailMember.skill_normalized_100 !== null
											? `Skill Score: ${detailMember.skill_normalized_100}/100`
											: detailMember.skill_status}
									</span>
								</div>
								<p className="text-gray-500">
									Rumus Gap = Final − Target (≤-2→0, -1→40, 0→70, +1→85, ≥+2→100). Jika |Self −
									Lead| ≥ 2 belum 1-on-1 → Pending Calibration.
								</p>

								{detailMember.skill_competencies.length > 0 ? (
									<div className="overflow-x-auto pt-1">
										<table className="w-full text-left border-collapse text-[11px]">
											<thead>
												<tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
													<th className="py-1.5 px-2">Kompetensi</th>
													<th className="py-1.5 px-2">Self</th>
													<th className="py-1.5 px-2">Lead</th>
													<th className="py-1.5 px-2">Δ (S-L)</th>
													<th className="py-1.5 px-2">Final</th>
													<th className="py-1.5 px-2">Target</th>
													<th className="py-1.5 px-2">Gap (F-T)</th>
													<th className="py-1.5 px-2">Norm</th>
													<th className="py-1.5 px-2">Status</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
												{detailMember.skill_competencies.map((c, i) => (
													<tr key={i}>
														<td className="py-1.5 px-2 font-medium">{c.competency_name}</td>
														<td className="py-1.5 px-2">{c.self_score ?? '-'}</td>
														<td className="py-1.5 px-2">{c.lead_score ?? '-'}</td>
														<td className="py-1.5 px-2 font-mono">
															{c.delta !== null ? (c.delta > 0 ? `+${c.delta}` : c.delta) : '-'}
														</td>
														<td className="py-1.5 px-2 font-bold">{c.final_score ?? '-'}</td>
														<td className="py-1.5 px-2">{c.target_score ?? '-'}</td>
														<td className="py-1.5 px-2 font-mono">
															{c.gap !== null ? (c.gap > 0 ? `+${c.gap}` : c.gap) : '-'}
														</td>
														<td className="py-1.5 px-2 font-bold text-emerald-500">
															{c.normalized_score ?? '-'}
														</td>
														<td className="py-1.5 px-2">{c.status}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								) : (
									<p className="text-gray-400 italic">
										Belum ada rincian per kompetensi di tabel granular.
									</p>
								)}
							</div>

							{/* 4. Capability Summary */}
							<div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-wrap items-center justify-between gap-2">
								<div>
									<div className="font-bold text-emerald-600 dark:text-emerald-400">
										4. Sumbu Y — Capability Score (60% Skill + 40% Behavior_100)
									</div>
									<div className="text-[11px] text-gray-500">
										Threshold: Low 0–59 | Medium 60–79 | High 80–100 (Indicative, Bukan Potential)
									</div>
								</div>
								<div className="text-right">
									<div className="text-base font-extrabold text-emerald-500">
										{detailMember.capability_score !== null
											? `${detailMember.capability_score} / 100 (${detailMember.capability_bucket})`
											: 'No Score Produced'}
									</div>
									<div className="text-[11px] text-gray-500">
										{detailMember.box_label || `Status: ${detailMember.data_status}`}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{editingMember && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
					<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
						<div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
							<div>
								<h3 className="text-base font-bold">Input / Update Granular Talent Mapping</h3>
								<p className="text-xs text-gray-500">
									{editingMember.employee_name} ({editingMember.employee_id}) • Job Level:{' '}
									<b>{editingMember.job_level}</b>
								</p>
							</div>
							<button
								onClick={() => setEditingMember(null)}
								className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
								<X className="w-5 h-5" />
							</button>
						</div>

						<form onSubmit={onSaveManual} className="mt-4 space-y-4 text-xs">
							<input type="hidden" name="employee_id" value={editingMember.employee_id} />
							<input type="hidden" name="employee_name" value={editingMember.employee_name} />
							<input
								type="hidden"
								name="skill_competencies_json"
								value={JSON.stringify(skillRows)}
							/>

							{/* 1. KPI Kuartalan */}
							<div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
								<p className="font-bold text-blue-500">
									1. KPI_Data — Sumbu X Performance Kuartalan (YYYY-Qn)
								</p>
								{editingMember.is_intern ? (
									<p className="text-amber-500 font-medium">
										Member ini berstatus Intern (Not Applicable untuk KPI dan otomatis dikeluarkan
										dari denominator KPI).
									</p>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div>
											<label className="block font-medium mb-1">
												Rata-rata KPI Periode (0 – 100%)
											</label>
											<input
												type="number"
												step="0.01"
												min="0"
												max="100"
												name="kpi_current_month"
												defaultValue={editingMember.kpi_raw ?? ''}
												placeholder="Contoh: 92 (Kosongkan jika belum ada)"
												className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
											/>
										</div>
										<div>
											<label className="block font-medium mb-1">Periode KPI (YYYY-Qn)</label>
											<input
												type="text"
												name="kpi_period"
												defaultValue={editingMember.kpi_period || '2026-Q2'}
												placeholder="2026-Q2"
												className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
											/>
										</div>
									</div>
								)}
							</div>

							{/* 2. Behavior Assessment 7 Dimensi */}
							<div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
								<p className="font-bold text-purple-500">
									2. Behavior_Assessment — 7 Dimensi Skala 1–5 (Wajib Lengkap 7 Dimensi)
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div>
										<label className="block font-medium mb-1">Periode Tahunan (YYYY)</label>
										<input
											type="text"
											name="behavior_period"
											defaultValue={editingMember.behavior_period || '2026'}
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
									<div>
										<label className="block font-medium mb-1">Evaluator / Lead</label>
										<input
											type="text"
											name="behavior_evaluator"
											defaultValue={editingMember.behavior_evaluator || 'Rakha Labib Ramadhan'}
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
									<div>
										<label className="block font-medium mb-1">Evidence / Catatan</label>
										<input
											type="text"
											name="behavior_evidence"
											defaultValue={editingMember.behavior_evidence || ''}
											placeholder="Link / catatan evidence..."
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
									{TALENT_CONFIG.behaviorDimensionNames.map((dimName, i) => (
										<div key={dimName} className="flex items-center justify-between gap-2">
											<label className="text-gray-600 dark:text-gray-300 truncate">{dimName}</label>
											<input
												type="number"
												step="0.1"
												min="1"
												max="5"
												name={`dim_${i + 1}`}
												defaultValue={editingMember.behavior_dimensions[i] ?? ''}
												placeholder="1-5"
												className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-center font-bold"
											/>
										</div>
									))}
								</div>
							</div>

							{/* 3. Skill Map Granular per Kompetensi (L1-L4) */}
							<div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<p className="font-bold text-emerald-500">
											3. Skill_Map_Data — Per Kompetensi Level L1–L4 (Angka 1–4)
										</p>
										<p className="text-[11px] text-gray-500">
											Jika |Self − Lead| ≥ 2, centang <b>1-on-1 Confirmed</b> setelah kalibrasi
											selesai.
										</p>
									</div>
									<div className="flex items-center gap-2">
										<input
											type="text"
											name="skill_period"
											defaultValue={editingMember.skill_period || '2026'}
											className="w-20 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-center"
											title="Periode Skill Map"
										/>
										<button
											type="button"
											onClick={addSkillRow}
											className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-semibold flex items-center gap-1 hover:bg-emerald-500/20 cursor-pointer">
											<Plus className="w-3.5 h-3.5" /> Tambah Kompetensi
										</button>
									</div>
								</div>

								<div className="space-y-2">
									{skillRows.map((row, idx) => {
										const delta =
											row.self_score !== null && row.lead_score !== null
												? Math.abs(row.self_score - row.lead_score)
												: 0;
										const needsCal = delta >= 2 && !row.one_on_one_confirmed;

										return (
											<div
												key={idx}
												className={`p-2.5 rounded-xl border grid grid-cols-1 sm:grid-cols-12 gap-2 items-center ${
													needsCal
														? 'border-purple-500/40 bg-purple-500/5'
														: 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30'
												}`}>
												<div className="sm:col-span-4">
													<input
														type="text"
														value={row.competency_name}
														onChange={(e) => updateSkillRow(idx, 'competency_name', e.target.value)}
														placeholder="Nama Kompetensi..."
														className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
													/>
												</div>
												<div className="sm:col-span-1">
													<input
														type="number"
														min="1"
														max="4"
														value={row.self_score ?? ''}
														onChange={(e) =>
															updateSkillRow(
																idx,
																'self_score',
																e.target.value === '' ? null : Number(e.target.value)
															)
														}
														placeholder="Self"
														title="Self Score (1-4)"
														className="w-full px-1.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-center"
													/>
												</div>
												<div className="sm:col-span-1">
													<input
														type="number"
														min="1"
														max="4"
														value={row.lead_score ?? ''}
														onChange={(e) =>
															updateSkillRow(
																idx,
																'lead_score',
																e.target.value === '' ? null : Number(e.target.value)
															)
														}
														placeholder="Lead"
														title="Lead Score (1-4)"
														className="w-full px-1.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-center"
													/>
												</div>
												<div className="sm:col-span-1">
													<input
														type="number"
														min="1"
														max="4"
														value={row.final_score ?? ''}
														onChange={(e) =>
															updateSkillRow(
																idx,
																'final_score',
																e.target.value === '' ? null : Number(e.target.value)
															)
														}
														placeholder="Final"
														title="Final Score (1-4)"
														className="w-full px-1.5 py-1.5 rounded-lg border border-emerald-500/50 bg-white dark:bg-gray-950 text-center font-bold"
													/>
												</div>
												<div className="sm:col-span-1">
													<input
														type="number"
														min="1"
														max="4"
														value={row.target_score ?? ''}
														onChange={(e) =>
															updateSkillRow(
																idx,
																'target_score',
																e.target.value === '' ? null : Number(e.target.value)
															)
														}
														placeholder="Tgt"
														title="Target Level (1-4)"
														className="w-full px-1.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-center"
													/>
												</div>
												<div className="sm:col-span-3 flex items-center gap-2 text-[11px]">
													<label className="flex items-center gap-1 cursor-pointer">
														<input
															type="checkbox"
															checked={row.one_on_one_confirmed}
															onChange={(e) =>
																updateSkillRow(idx, 'one_on_one_confirmed', e.target.checked)
															}
														/>
														<span>1-on-1 Done</span>
													</label>
													<label className="flex items-center gap-1 cursor-pointer text-gray-400">
														<input
															type="checkbox"
															checked={!row.is_applicable}
															onChange={(e) =>
																updateSkillRow(idx, 'is_applicable', !e.target.checked)
															}
														/>
														<span>N/A</span>
													</label>
												</div>
												<div className="sm:col-span-1 text-right">
													<button
														type="button"
														onClick={() => removeSkillRow(idx)}
														className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer">
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</div>
											</div>
										);
									})}
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
									className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold cursor-pointer">
									Batal
								</button>
								<button
									type="submit"
									disabled={saving}
									className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 cursor-pointer">
									{saving && <Loader2 className="w-4 h-4 animate-spin" />}
									Simpan Granular
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
