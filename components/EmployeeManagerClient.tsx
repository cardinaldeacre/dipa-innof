'use client';

import {useState, useMemo, useEffect} from 'react';
import Link from 'next/link';
import {
	Search,
	UserPlus,
	Edit3,
	Trash2,
	ArrowLeft,
	X,
	CheckCircle,
	AlertCircle,
	Loader2,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import {EmployeeRow} from '@/lib/engine/analytics';
import {saveEmployeeAction, deleteEmployeeAction} from '@/app/admin/employees/actions';

export default function EmployeeManagerClient({
	initialEmployees,
}: {
	initialEmployees: EmployeeRow[];
}) {
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingEmp, setEditingEmp] = useState<EmployeeRow | null>(null);
	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState<{success: boolean; message: string} | null>(null);

	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	useEffect(() => {
		setCurrentPage(1);
	}, [search, statusFilter]);

	const filteredEmployees = useMemo(() => {
		let result = initialEmployees;

		if (statusFilter !== 'ALL') {
			result = result.filter((e) => {
				const isExited = e.status?.toLowerCase() === 'inactive' || !!e.exit_date;
				return statusFilter === 'Active' ? !isExited : isExited;
			});
		}

		if (search.trim().length >= 3) {
			const s = search.toLowerCase();
			result = result.filter(
				(e) =>
					e.employee_name?.toLowerCase().includes(s) ||
					e.employee_id?.toLowerCase().includes(s) ||
					e.department?.toLowerCase().includes(s)
			);
		}

		return result;
	}, [initialEmployees, search, statusFilter]);

	const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
	const currentData = filteredEmployees.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const openAddModal = () => {
		setEditingEmp(null);
		setFeedback(null);
		setIsModalOpen(true);
	};

	const openEditModal = (emp: EmployeeRow) => {
		setEditingEmp(emp);
		setFeedback(null);
		setIsModalOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setFeedback(null);

		const formData = new FormData(e.currentTarget);
		const res = await saveEmployeeAction(formData);
		setFeedback(res);
		setLoading(false);

		if (res.success) {
			setTimeout(() => setIsModalOpen(false), 900);
		}
	};

	const handleDelete = async (empId: string, empName: string) => {
		if (
			!confirm(
				`Yakin ingin menghapus data ${empName} (${empId})? Catatan: Menurut aturan HR, karyawan resign sebaiknya di-set Exit Date, bukan dihapus.`
			)
		) {
			return;
		}
		const res = await deleteEmployeeAction(empId);
		alert(res.message);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-8">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
					<div className="flex items-center gap-4">
						<Link
							className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							href="/">
							<ArrowLeft className="w-5 h-5" />
						</Link>
						<div>
							<h1 className="text-xl font-bold">Kelola Data Karyawan</h1>
							<p className="text-xs text-gray-500">
								Input karyawan baru, update kelulusan probation, atau catat karyawan resign tanpa
								Excel.
							</p>
						</div>
					</div>

					<button
						onClick={openAddModal}
						className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer">
						<UserPlus className="w-4 h-4" />+ Tambah Karyawan Baru
					</button>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
					<div className="relative flex-1 min-w-60">
						<Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							placeholder="Ketik minimal 3 huruf untuk mencari nama, ID, atau departemen..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:border-emerald-500"
						/>
					</div>

					<div className="flex items-center gap-2 text-xs">
						{(['ALL', 'Active', 'Inactive'] as const).map((st) => (
							<button
								key={st}
								onClick={() => setStatusFilter(st)}
								className={`px-3.5 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
									statusFilter === st
										? 'bg-emerald-600 text-white'
										: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
								}`}>
								{st === 'ALL' ? `Semua (${initialEmployees.length})` : st}
							</button>
						))}
					</div>
				</div>

				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse text-sm">
							<thead>
								<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
									<th className="py-3.5 px-5">ID</th>
									<th className="py-3.5 px-5">Nama & Jabatan</th>
									<th className="py-3.5 px-5">Departemen</th>
									<th className="py-3.5 px-5">Status</th>
									<th className="py-3.5 px-5">Join Date</th>
									<th className="py-3.5 px-5">Probation</th>
									<th className="py-3.5 px-5">Exit Info</th>
									<th className="py-3.5 px-5 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
								{currentData.length > 0 ? (
									currentData.map((emp) => {
										const isExited = emp.status?.toLowerCase() === 'inactive' || !!emp.exit_date;
										return (
											<tr
												key={emp.employee_id}
												className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
												<td className="py-3.5 px-5 font-mono text-xs font-bold">
													{emp.employee_id}
												</td>
												<td className="py-3.5 px-5">
													<div className="font-semibold">{emp.employee_name}</div>
													<div className="text-xs text-gray-500">{emp.job_title || '-'}</div>
												</td>
												<td className="py-3.5 px-5 text-xs font-medium">{emp.department || '-'}</td>
												<td className="py-3.5 px-5">
													<span
														className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
															isExited
																? 'bg-red-500/10 text-red-500'
																: 'bg-emerald-500/10 text-emerald-500'
														}`}>
														{isExited ? 'Exited' : 'Active'}
													</span>
												</td>
												<td className="py-3.5 px-5 text-xs">
													{emp.join_date?.slice(0, 10) || '-'}
												</td>
												<td className="py-3.5 px-5 text-xs">
													{emp.probation_outcome || 'Pending'}
												</td>
												<td className="py-3.5 px-5 text-xs text-gray-500">
													{emp.exit_date ? (
														<div>
															<span className="text-red-400 font-medium">
																{emp.exit_date.slice(0, 10)}
															</span>
															<div className="text-[11px]">
																{emp.exit_reason || emp.exit_type || 'No Reason'}
															</div>
														</div>
													) : (
														'-'
													)}
												</td>
												<td className="py-3.5 px-5 text-right space-x-2">
													<button
														onClick={() => openEditModal(emp)}
														className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
														title="Edit / Catat Exit">
														<Edit3 className="w-4 h-4" />
													</button>
													<button
														onClick={() => handleDelete(emp.employee_id, emp.employee_name)}
														className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
														title="Hapus Baris">
														<Trash2 className="w-4 h-4" />
													</button>
												</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan={8} className="py-8 text-center text-gray-500">
											Pencarian tidak menemukan hasil.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					<div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs">
						<span className="text-gray-500 font-medium">
							Menampilkan {filteredEmployees.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}{' '}
							- {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} dari{' '}
							{filteredEmployees.length} data
						</span>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
								<ChevronLeft className="w-4 h-4" />
							</button>
							<span className="font-semibold px-2 text-gray-600 dark:text-gray-300">
								Halaman {currentPage} dari {totalPages}
							</span>
							<button
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								disabled={currentPage === totalPages}
								className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			</div>

			{isModalOpen && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
					<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
						<div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
							<h2 className="text-lg font-bold">
								{editingEmp ? `Edit Data: ${editingEmp.employee_name}` : 'Tambah Karyawan Baru'}
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
								<X className="w-5 h-5" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="block font-semibold mb-1">Employee ID *</label>
									<input
										name="employee_id"
										defaultValue={editingEmp?.employee_id || ''}
										readOnly={!!editingEmp}
										placeholder="Contoh: DP2610080"
										required
										className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
									/>
								</div>
								<div>
									<label className="block font-semibold mb-1">Nama Lengkap *</label>
									<input
										name="employee_name"
										defaultValue={editingEmp?.employee_name || ''}
										required
										className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
									/>
								</div>
								<div>
									<label className="block font-semibold mb-1">Departemen *</label>
									<input
										name="department"
										defaultValue={editingEmp?.department || ''}
										placeholder="Contoh: UI/UX Designer, Development, HR"
										required
										className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
									/>
								</div>
								<div>
									<label className="block font-semibold mb-1">Job Title / Level</label>
									<input
										name="job_title"
										defaultValue={editingEmp?.job_title || ''}
										placeholder="Contoh: Staff, Senior, Lead"
										className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
									/>
								</div>
								<div>
									<label className="block font-semibold mb-1">Tanggal Join (Masuk) *</label>
									<input
										type="date"
										name="join_date"
										defaultValue={editingEmp?.join_date?.slice(0, 10) || ''}
										required
										className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
									/>
								</div>
								<div>
									<label className="block font-semibold mb-1">Tipe & Status Kontrak</label>
									<select
										name="employment_type"
										defaultValue={editingEmp?.employment_type || 'Full-time'}
										className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950">
										<option value="Full-time">Full-time</option>
										<option value="Contract">Contract</option>
										<option value="Internship">Internship</option>
										<option value="Part-time">Part-time</option>
									</select>
								</div>
								<div>
									<label className="block font-semibold mb-1">Hasil Probation</label>
									<select
										name="probation_outcome"
										defaultValue={editingEmp?.probation_outcome || 'Passed'}
										className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950">
										<option value="Pending">Pending (Sedang Berjalan)</option>
										<option value="Passed">Passed (Lulus)</option>
										<option value="Failed">Failed (Tidak Lulus)</option>
										<option value="Not Applicable">Not Applicable</option>
									</select>
								</div>
								<div>
									<label className="block font-semibold mb-1">Status Keaktifan</label>
									<select
										name="status"
										defaultValue={editingEmp?.status || 'Active'}
										className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950">
										<option value="Active">Active (Masih Bekerja)</option>
										<option value="Inactive">Inactive (Sudah Resign / Exit)</option>
									</select>
								</div>
							</div>

							{/* Pencatatan Karyawan Keluar */}
							<div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3 mt-4">
								<p className="font-bold text-red-500">
									Pencatatan Karyawan Keluar (Isi jika Resign / Exit)
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div>
										<label className="block font-medium mb-1">Tanggal Exit</label>
										<input
											type="date"
											name="exit_date"
											defaultValue={editingEmp?.exit_date?.slice(0, 10) || ''}
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950"
										/>
									</div>
									<div>
										<label className="block font-medium mb-1">Tipe Exit</label>
										<select
											name="exit_type"
											defaultValue={editingEmp?.exit_type || ''}
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950">
											<option value="">-- Pilih Tipe --</option>
											<option value="Voluntary">Voluntary (Resign Sendiri)</option>
											<option value="Involuntary">Involuntary (Diberhentikan)</option>
											<option value="Contract Non-Renewal">Contract Non-Renewal</option>
											<option value="Probation Non-Continuation">Gagal Probation</option>
										</select>
									</div>
									<div>
										<label className="block font-medium mb-1">Alasan Keluar</label>
										<select
											name="exit_reason"
											defaultValue={editingEmp?.exit_reason || ''}
											className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950">
											<option value="">-- Pilih Alasan --</option>
											<option value="Compensation">Compensation</option>
											<option value="Career Growth">Career Growth</option>
											<option value="Workload">Workload</option>
											<option value="Management">Management</option>
											<option value="Culture">Culture</option>
											<option value="Personal">Personal / Family</option>
											<option value="Performance">Performance</option>
											<option value="Other">Other</option>
										</select>
									</div>
								</div>
							</div>

							{feedback && (
								<div
									className={`p-3 rounded-lg flex items-center gap-2 font-medium ${
										feedback.success
											? 'bg-emerald-500/10 text-emerald-500'
											: 'bg-red-500/10 text-red-500'
									}`}>
									{feedback.success ? (
										<CheckCircle className="w-4 h-4 shrink-0" />
									) : (
										<AlertCircle className="w-4 h-4 shrink-0" />
									)}
									<span>{feedback.message}</span>
								</div>
							)}

							<div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold">
									Batal
								</button>
								<button
									type="submit"
									disabled={loading}
									className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 cursor-pointer">
									{loading && <Loader2 className="w-4 h-4 animate-spin" />}
									Simpan Perubahan
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
