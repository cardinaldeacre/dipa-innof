import {Search, Download, Eye, Edit3, ChevronLeft, ChevronRight} from 'lucide-react';
import {EnrichedTalentMember, TalentDataStatus} from '@/lib/engine/talentMapping';
import {useState, useMemo, useEffect} from 'react';

interface TableProps {
	members: EnrichedTalentMember[];
	levels: string[];
	periods: string[];
	selectedLevel: string;
	setSelectedLevel: (v: string) => void;
	selectedPeriod: string;
	setSelectedPeriod: (v: string) => void;
	statusFilter: string;
	setStatusFilter: (v: string) => void;
	search: string;
	setSearch: (v: string) => void;
	experimentalMode: boolean;
	isHrAdmin: boolean;
	onExportCSV: () => void;
	onViewDetail: (m: EnrichedTalentMember) => void;
	onEditMember: (m: EnrichedTalentMember) => void;
}

const PAGE_SIZE = 20;

const STATUS_BADGE_STYLE: Record<TalentDataStatus, string> = {
	Complete: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
	Provisional: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
	'Pending Calibration': 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
	'Pending Assessment': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
	'Incomplete Data': 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
	'Needs Review': 'bg-red-500/10 text-red-500 border border-red-500/20',
	'Not Applicable': 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
	'Not Available': 'bg-gray-500/10 text-gray-400',
};

export default function TalentMemberTable({
	members,
	levels,
	periods,
	selectedLevel,
	setSelectedLevel,
	selectedPeriod,
	setSelectedPeriod,
	statusFilter,
	setStatusFilter,
	search,
	setSearch,
	experimentalMode,
	isHrAdmin,
	onExportCSV,
	onViewDetail,
	onEditMember,
}: TableProps) {
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		setCurrentPage(1);
	}, [search, selectedLevel, selectedPeriod, statusFilter, members.length]);

	const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages);
		}
	}, [currentPage, totalPages]);

	const paginatedMembers = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return members.slice(start, start + PAGE_SIZE);
	}, [members, currentPage]);

	const startItem = members.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
	const endItem = Math.min(currentPage * PAGE_SIZE, members.length);

	const pageNumbers = useMemo(() => {
		const pages: (number | 'ellipsis')[] = [];
		const maxVisible = 5;
		if (totalPages <= maxVisible + 2) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
			return pages;
		}
		pages.push(1);
		let start = Math.max(2, currentPage - 1);
		let end = Math.min(totalPages - 1, currentPage + 1);
		if (currentPage <= 3) {
			start = 2;
			end = 4;
		}
		if (currentPage >= totalPages - 2) {
			start = totalPages - 3;
			end = totalPages - 1;
		}
		if (start > 2) pages.push('ellipsis');
		for (let i = start; i <= end; i++) pages.push(i);
		if (end < totalPages - 1) pages.push('ellipsis');
		pages.push(totalPages);
		return pages;
	}, [currentPage, totalPages]);

	return (
		<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
			<div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-base font-bold">HAV Summary & Scoring Table (Revisi 2)</h2>
					<p className="text-xs text-gray-500">
						Menyimpan terpisah antara Skor Asli (Raw), Skor Normalisasi (0–100), dan Klasifikasi
						beserta 8 Status Data Resmi.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 text-xs">
					<div className="relative">
						<Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							placeholder="Cari nama / ID / level..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
						/>
					</div>

					<select
						value={selectedLevel}
						onChange={(e) => setSelectedLevel(e.target.value)}
						className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium">
						{levels.map((lv) => (
							<option key={lv} value={lv}>
								{lv === 'ALL' ? 'Semua Job Level' : lv}
							</option>
						))}
					</select>

					{periods.length > 1 && (
						<select
							value={selectedPeriod}
							onChange={(e) => setSelectedPeriod(e.target.value)}
							className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium">
							{periods.map((p) => (
								<option key={p} value={p}>
									{p === 'ALL' ? 'Semua Periode' : `Periode: ${p}`}
								</option>
							))}
						</select>
					)}

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-medium">
						<option value="ALL">Semua 8 Status Data</option>
						<option value="Complete">1. Complete</option>
						<option value="Pending Assessment">2. Pending Assessment</option>
						<option value="Pending Calibration">3. Pending Calibration (|Δ| ≥ 2)</option>
						<option value="Incomplete Data">4. Incomplete Data</option>
						<option value="Not Applicable">5. Not Applicable (Intern)</option>
						<option value="Not Available">6. Not Available</option>
						<option value="Provisional">7. Provisional</option>
						<option value="Needs Review">8. Needs Review / Conflict</option>
					</select>

					<button
						onClick={onExportCSV}
						className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer">
						<Download className="w-3.5 h-3.5" />
						<span>Export CSV v2</span>
					</button>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse text-sm">
					<thead>
						<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
							<th className="py-3.5 px-4">Member</th>
							<th className="py-3.5 px-4">Dept & Job Level</th>
							<th className="py-3.5 px-4">Sumbu X: KPI (YYYY-Qn)</th>
							<th className="py-3.5 px-4">Behavior (1–5 → 0–100)</th>
							<th className="py-3.5 px-4">Skill Map (Gap → 0–100)</th>
							<th className="py-3.5 px-4">Official Status</th>
							{experimentalMode && <th className="py-3.5 px-4">Capability & 9-Box</th>}
							<th className="py-3.5 px-4 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
						{paginatedMembers.length === 0 ? (
							<tr>
								<td
									colSpan={experimentalMode ? 8 : 7}
									className="py-10 px-5 text-center text-sm text-gray-400 italic">
									Tidak ada data member yang cocok dengan filter.
								</td>
							</tr>
						) : (
							paginatedMembers.map((m) => (
								<tr key={m.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
									<td className="py-3.5 px-4">
										<div className="font-semibold">{m.employee_name}</div>
										<div className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
											<span>{m.employee_id}</span>
											{m.is_id_pending && (
												<span className="px-1.5 py-0.2 rounded text-[10px] font-sans font-bold bg-red-500/10 text-red-500">
													ID Pending
												</span>
											)}
										</div>
									</td>

									<td className="py-3.5 px-4 text-xs">
										<div className="font-medium">{m.department}</div>
										<div className="text-gray-400">{m.job_title}</div>
										<div className="mt-0.5 flex items-center gap-1">
											<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
												{m.job_level}
											</span>
											<span className="text-[10px] text-gray-400">({m.job_level_basis})</span>
										</div>
									</td>

									{/* Sumbu X: KPI */}
									<td className="py-3.5 px-4 text-xs">
										{m.is_intern ? (
											<span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-500/10 text-gray-400">
												Not Applicable (Intern)
											</span>
										) : m.kpi_status === 'CONFLICT' ? (
											<span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-500">
												CONFLICT
											</span>
										) : m.kpi_raw !== null ? (
											<div>
												<span
													className={`text-sm font-bold ${
														m.kpi_is_invalid ? 'text-red-500' : 'text-blue-500'
													}`}>
													{m.kpi_raw}%
												</span>
												{m.performance_bucket && (
													<span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-500 font-bold">
														{m.performance_bucket}
													</span>
												)}
												<div className="text-[11px] text-gray-400">
													Periode: {m.kpi_period || '2026-Q2'}
												</div>
											</div>
										) : (
											<span className="text-gray-400 italic">Not Available</span>
										)}
									</td>

									{/* Behavior 7 Dimensi */}
									<td className="py-3.5 px-4 text-xs">
										{m.behavior_status === 'CONFLICT' ? (
											<span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-500">
												CONFLICT
											</span>
										) : m.behavior_raw_avg !== null && m.behavior_normalized_100 !== null ? (
											<div>
												<div>
													<span className="text-sm font-bold text-purple-500">
														{m.behavior_normalized_100}
													</span>
													<span className="text-gray-400"> / 100</span>
													<span className="ml-1.5 text-[11px] text-gray-400">
														(Raw: <b>{m.behavior_raw_avg}</b>/5)
													</span>
												</div>
												<div className="text-[11px] text-gray-400">
													{m.behavior_period || '2026'}
													{m.behavior_evaluator ? ` • ${m.behavior_evaluator}` : ''}
												</div>
											</div>
										) : m.behavior_status === 'Incomplete Data' ? (
											<span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-500/10 text-orange-500">
												Incomplete ({m.behavior_DimensionsFilledCount}/7 Dim)
											</span>
										) : (
											<span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-500">
												Pending Assessment
											</span>
										)}
									</td>

									{/* Skill Map Gap */}
									<td className="py-3.5 px-4 text-xs">
										{m.skill_status === 'CONFLICT' ? (
											<span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-500">
												CONFLICT
											</span>
										) : m.skill_status === 'Pending Calibration' ? (
											<div>
												<span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-500">
													Pending Calibration (|Δ| ≥ 2)
												</span>
												<div className="text-[10px] text-gray-400 mt-0.5">
													Menunggu konfirmasi 1-on-1
												</div>
											</div>
										) : m.skill_status === 'Incomplete Data' ? (
											<span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-500/10 text-orange-500">
												Incomplete Data (Missing Final)
											</span>
										) : m.skill_normalized_100 !== null ? (
											<div>
												<span className="text-sm font-bold text-emerald-500">
													{m.skill_normalized_100}
												</span>
												<span className="text-gray-400"> / 100</span>
												{m.skill_raw_final_avg !== null && (
													<span className="ml-1.5 text-[11px] text-gray-400">
														(Avg L: <b>{m.skill_raw_final_avg}</b>/4)
													</span>
												)}
												<div className="text-[11px] text-gray-400">
													{m.skill_applicable_count > 0
														? `${m.skill_applicable_count} kompetensi • ${m.skill_period || '2026'}`
														: `Periode: ${m.skill_period || '2026'}`}
												</div>
											</div>
										) : (
											<span className="text-gray-400 italic">Not Available</span>
										)}
									</td>

									{/* 8 Official Status */}
									<td className="py-3.5 px-4">
										<span
											className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block ${
												STATUS_BADGE_STYLE[m.data_status]
											}`}>
											{m.data_status}
										</span>
									</td>

									{/* Capability & 9-Box */}
									{experimentalMode && (
										<td className="py-3.5 px-4 text-xs">
											{m.capability_score !== null ? (
												<div>
													<div className="font-bold text-gray-900 dark:text-white">
														Cap: {m.capability_score}{' '}
														<span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-500">
															{m.capability_bucket}
														</span>
													</div>
													<div className="text-[11px] text-gray-500 mt-0.5">
														{m.box_label || 'Not Plotted'}
													</div>
												</div>
											) : (
												<span className="text-gray-400 italic">No Score Produced</span>
											)}
										</td>
									)}

									<td className="py-3.5 px-4 text-right space-x-1.5">
										<button
											onClick={() => onViewDetail(m)}
											className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 cursor-pointer"
											title="Lihat Rincian Granular (7 Dimensi & Gap Skill)">
											<Eye className="w-4 h-4" />
										</button>
										{isHrAdmin && (
											<button
												onClick={() => onEditMember(m)}
												className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 cursor-pointer"
												title="Input / Edit Skor Granular Revisi 2">
												<Edit3 className="w-4 h-4" />
											</button>
										)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
				<div className="text-gray-500">
					Menampilkan{' '}
					<span className="font-semibold text-gray-700 dark:text-gray-300">{startItem}</span>–
					<span className="font-semibold text-gray-700 dark:text-gray-300">{endItem}</span> dari{' '}
					<span className="font-semibold text-gray-700 dark:text-gray-300">{members.length}</span>{' '}
					member
				</div>

				<div className="flex items-center gap-1">
					<button
						onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
						disabled={currentPage === 1}
						className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
						<ChevronLeft className="w-4 h-4" />
					</button>

					{pageNumbers.map((p, idx) =>
						p === 'ellipsis' ? (
							<span key={`e-${idx}`} className="px-2 text-gray-400 select-none">
								…
							</span>
						) : (
							<button
								key={p}
								onClick={() => setCurrentPage(p)}
								className={`min-w-8 px-2.5 py-1.5 rounded-lg border font-semibold cursor-pointer ${
									currentPage === p
										? 'bg-blue-600 border-blue-600 text-white'
										: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
								}`}>
								{p}
							</button>
						)
					)}

					<button
						onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
						disabled={currentPage === totalPages}
						className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
