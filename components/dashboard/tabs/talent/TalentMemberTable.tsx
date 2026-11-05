import {Search, Download, Eye, Edit3, ChevronLeft, ChevronRight} from 'lucide-react';
import {EnrichedTalentMember} from '@/lib/engine/talentMapping';
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

	// Reset ke halaman 1 setiap kali filter/search berubah
	useEffect(() => {
		setCurrentPage(1);
	}, [search, selectedLevel, selectedPeriod, statusFilter, members.length]);

	const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));

	// Pastikan currentPage tidak melebihi totalPages (misal setelah filter mempersempit data)
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

	// Generate nomor halaman dengan ellipsis
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
					<h2 className="text-base font-bold">Member Talent & Competency Dataset</h2>
					<p className="text-xs text-gray-500">
						Menampilkan ketiga indikator secara independen beserta kelengkapan dan metadata
						periodenya.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2 text-xs">
					<div className="relative">
						<Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							placeholder="Cari nama / ID..."
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
								{lv === 'ALL' ? 'Semua Level / Jabatan' : lv}
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
						<option value="ALL">Semua Status Data</option>
						<option value="Complete">Complete (3/3)</option>
						<option value="Pending Assessment">Pending Assessment</option>
						<option value="Not Available">Not Available</option>
					</select>

					<button
						onClick={onExportCSV}
						className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer">
						<Download className="w-3.5 h-3.5" />
						<span>Export Talent CSV</span>
					</button>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse text-sm">
					<thead>
						<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
							<th className="py-3.5 px-5">Member</th>
							<th className="py-3.5 px-5">Dept & Level</th>
							<th className="py-3.5 px-5">Current-Month KPI (1–100%)</th>
							<th className="py-3.5 px-5">Behavior Lead Score (1–5)</th>
							<th className="py-3.5 px-5">Skill Map (1–5)</th>
							<th className="py-3.5 px-5">Data Status</th>
							{experimentalMode && <th className="py-3.5 px-5">Experimental Box</th>}
							<th className="py-3.5 px-5 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
						{paginatedMembers.length === 0 ? (
							<tr>
								<td
									colSpan={experimentalMode ? 8 : 7}
									className="py-10 px-5 text-center text-sm text-gray-400 italic">
									Tidak ada data yang cocok dengan filter.
								</td>
							</tr>
						) : (
							paginatedMembers.map((m) => (
								<tr key={m.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
									<td className="py-3.5 px-5">
										<div className="font-semibold">{m.employee_name}</div>
										<div className="text-xs font-mono text-gray-400">{m.employee_id}</div>
									</td>
									<td className="py-3.5 px-5 text-xs">
										<div className="font-medium">{m.department}</div>
										<div className="text-gray-400">{m.job_title}</div>
									</td>
									<td className="py-3.5 px-5">
										{m.kpi_current_month !== null ? (
											<div>
												<span className="font-bold text-blue-500">{m.kpi_current_month}%</span>
												<span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 font-semibold">
													Provisional
												</span>
												{m.kpi_period && (
													<div className="text-[11px] text-gray-400">Periode: {m.kpi_period}</div>
												)}
											</div>
										) : (
											<span className="text-xs text-gray-400 italic">N/A</span>
										)}
									</td>
									<td className="py-3.5 px-5">
										{m.behavior_lead_score !== null ? (
											<div>
												<span className="font-bold text-purple-500">{m.behavior_lead_score}</span>
												<span className="text-xs text-gray-400"> / 5.0</span>
												{m.behavior_period && (
													<div className="text-[11px] text-gray-400">
														{m.behavior_period}{' '}
														{m.behavior_evaluator ? `• ${m.behavior_evaluator}` : ''}
													</div>
												)}
											</div>
										) : (
											<span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-500">
												Pending Assessment
											</span>
										)}
									</td>
									<td className="py-3.5 px-5">
										{m.skill_map_score !== null ? (
											<div>
												<span className="font-bold text-emerald-500">{m.skill_map_score}</span>
												<span className="text-xs text-gray-400"> / 5.0</span>
												{m.skill_period && (
													<div className="text-[11px] text-gray-400">Periode: {m.skill_period}</div>
												)}
											</div>
										) : (
											<span className="text-xs text-gray-400 italic">N/A</span>
										)}
									</td>
									<td className="py-3.5 px-5">
										<span
											className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
												m.data_status === 'Complete'
													? 'bg-emerald-500/10 text-emerald-500'
													: m.data_status === 'Pending Assessment'
														? 'bg-amber-500/10 text-amber-500'
														: 'bg-gray-500/10 text-gray-400'
											}`}>
											{m.data_status}
										</span>
									</td>
									{experimentalMode && (
										<td className="py-3.5 px-5 text-xs">
											{m.box_label ? (
												<div>
													<div className="font-bold text-gray-800 dark:text-gray-200">
														{m.box_label}
													</div>
													<div className="text-[11px] text-gray-400">
														Proxy Score: {m.experimental_proxy_score}
													</div>
												</div>
											) : (
												<span className="text-gray-400 italic">Belum Lengkap</span>
											)}
										</td>
									)}
									<td className="py-3.5 px-5 text-right space-x-1.5">
										<button
											onClick={() => onViewDetail(m)}
											className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 cursor-pointer"
											title="Lihat Detail Sumber Skor">
											<Eye className="w-4 h-4" />
										</button>
										{isHrAdmin && (
											<button
												onClick={() => onEditMember(m)}
												className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 cursor-pointer"
												title="Input / Edit Skor Manual">
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

			{/* Pagination Footer */}
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
						className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
						title="Halaman sebelumnya">
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
						className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
						title="Halaman berikutnya">
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
