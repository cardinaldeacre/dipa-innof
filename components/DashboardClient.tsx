'use client';

import {useState, useMemo} from 'react';
import Link from 'next/link';
import {
	ResponsiveContainer,
	ComposedChart,
	Line,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	Legend,
	BarChart,
	Cell,
} from 'recharts';
import {
	Users,
	TrendingDown,
	ShieldCheck,
	Award,
	AlertTriangle,
	Upload,
	Download,
	UserPlus,
	Info,
	LogOut,
	Menu,
	X,
	LayoutDashboard,
	PieChart,
	UserCheck,
	Building2,
	Database,
} from 'lucide-react';
import {calculatePeopleAnalytics, EmployeeRow, MetricResult} from '@/lib/engine/analytics';
import {logoutAction} from '@/app/login/actions';

interface Props {
	employees: EmployeeRow[];
	requisitionsCount: number;
	candidatesCount: number;
	userEmail?: string;
	isHrAdmin?: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function DashboardClient({
	employees,
	requisitionsCount,
	candidatesCount,
	userEmail = 'Internal User',
	isHrAdmin = true,
}: Props) {
	const [activeTab, setActiveTab] = useState<
		'overview' | 'turnover' | 'newhire' | 'department' | 'quality'
	>('overview');
	const [cutoffDate, setCutoffDate] = useState<string>('2026-10-27');
	const [selectedDept, setSelectedDept] = useState<string>('ALL');
	const [selectedType, setSelectedType] = useState<string>('ALL');
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const departments = useMemo(() => {
		const set = new Set(employees.map((e) => e.department).filter(Boolean) as string[]);
		return ['ALL', ...Array.from(set).sort()];
	}, [employees]);

	const employmentTypes = useMemo(() => {
		const set = new Set(employees.map((e) => e.employment_type).filter(Boolean) as string[]);
		return ['ALL', ...Array.from(set).sort()];
	}, [employees]);

	const analytics = useMemo(() => {
		return calculatePeopleAnalytics(employees, {
			cutoffDate,
			department: selectedDept,
			employmentType: selectedType,
		});
	}, [employees, cutoffDate, selectedDept, selectedType]);

	const navItems = [
		{id: 'overview', label: 'Executive Overview', icon: LayoutDashboard},
		{id: 'turnover', label: 'Retention & Turnover', icon: PieChart},
		{id: 'newhire', label: 'New Hire & Probation', icon: UserCheck},
		{id: 'department', label: 'Department Analysis', icon: Building2},
		{
			id: 'quality',
			label: 'Data Quality Log',
			icon: AlertTriangle,
			badge: analytics.qualityIssues.length,
		},
	] as const;

	const activeTabTitle = navItems.find((i) => i.id === activeTab)?.label || 'Dashboard';

	const handleExportCSV = () => {
		const headers = [
			'Department',
			'Active Headcount',
			'Hires YTD',
			'Exits YTD',
			'Total Historical Exits',
		];
		const rows = analytics.departmentBreakdown.map((d) => [
			`"${d.department}"`,
			d.activeHc,
			d.hiresYTD,
			d.exitsYTD,
			d.totalExitsAllTime,
		]);
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			[headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `People_Analytics_Summary_${cutoffDate}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const MetricCard = ({
		title,
		metric,
		icon: Icon,
		suffix = '%',
	}: {
		title: string;
		metric: MetricResult;
		icon: any;
		suffix?: string;
	}) => (
		<div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
			<div className="flex items-center justify-between mb-3">
				<span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
				<div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
					<Icon className="w-5 h-5" />
				</div>
			</div>

			<div>
				<div className="text-3xl font-extrabold text-gray-900 dark:text-white">
					{metric.value !== null ? `${metric.value}${suffix}` : 'N/A'}
				</div>
				<div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
					<span>
						Num: <b>{metric.numerator}</b> | Denom: <b>{metric.denominator}</b>
					</span>
					<span
						title={metric.formula}
						className="flex items-center gap-1 cursor-help text-emerald-600 dark:text-emerald-400">
						<Info className="w-3.5 h-3.5" /> Rumus
					</span>
				</div>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex">
			{isSidebarOpen && (
				<div
					onClick={() => setIsSidebarOpen(false)}
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
				/>
			)}

			<aside
				className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
					isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
				}`}>
				<div className="p-5 space-y-6 overflow-y-auto">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
								<Database className="w-5 h-5" />
							</div>
							<div>
								<h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
									Dipa Inhouse
								</h1>
								<p className="text-[11px] text-gray-500 dark:text-gray-400">
									People Analytics Engine
								</p>
							</div>
						</div>

						<button
							onClick={() => setIsSidebarOpen(false)}
							className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
							<X className="w-5 h-5" />
						</button>
					</div>

					<div>
						<p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
							Menu Analitik
						</p>
						<nav className="space-y-1">
							{navItems.map((item) => {
								const Icon = item.icon;
								const isActive = activeTab === item.id;
								return (
									<button
										key={item.id}
										onClick={() => {
											setActiveTab(item.id);
											setIsSidebarOpen(false);
										}}
										className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
											isActive
												? 'bg-emerald-600 text-white shadow-sm'
												: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70'
										}`}>
										<div className="flex items-center gap-3">
											<Icon className="w-4 h-4 shrink-0" />
											<span>{item.label}</span>
										</div>
										{'badge' in item && item.badge ? (
											<span
												className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
													isActive ? 'bg-white text-emerald-700' : 'bg-amber-500/15 text-amber-500'
												}`}>
												{item.badge}
											</span>
										) : null}
									</button>
								);
							})}
						</nav>
					</div>

					{isHrAdmin && (
						<div>
							<p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
								Manajemen Data (HR)
							</p>
							<div className="space-y-1.5">
								<Link
									href="/admin/employees"
									className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
									<UserPlus className="w-4 h-4 shrink-0" />
									<span>Kelola Data Karyawan</span>
								</Link>
								<Link
									href="/admin/import"
									className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
									<Upload className="w-4 h-4 shrink-0" />
									<span>Import / Update Excel</span>
								</Link>
							</div>
						</div>
					)}
				</div>

				<div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
					<div className="px-2">
						<p className="text-xs font-bold text-gray-900 dark:text-white truncate">{userEmail}</p>
						<span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
							{isHrAdmin ? 'HR Admin Access' : 'BOD Viewer Access'}
						</span>
					</div>

					<form action={logoutAction}>
						<button
							type="submit"
							className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
							<LogOut className="w-4 h-4" />
							<span>Keluar (Logout)</span>
						</button>
					</form>
				</div>
			</aside>

			<div className="flex-1 flex flex-col min-w-0">
				<header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<button
								onClick={() => setIsSidebarOpen(true)}
								className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden cursor-pointer"
								aria-label="Buka Menu">
								<Menu className="w-5 h-5" />
							</button>
							<div>
								<h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
									{activeTabTitle}
								</h2>
								<p className="text-[11px] text-gray-500 hidden sm:block">
									Data dihitung otomatis berdasarkan filter posisi tanggal cut-off
								</p>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2.5 text-xs w-full sm:w-auto justify-end">
							<div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/70 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
								<span className="text-gray-500 font-medium">Cut-off:</span>
								<input
									type="date"
									value={cutoffDate}
									onChange={(e) => setCutoffDate(e.target.value)}
									className="bg-transparent font-semibold focus:outline-none"
								/>
							</div>

							<select
								value={selectedDept}
								onChange={(e) => setSelectedDept(e.target.value)}
								className="bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 font-medium focus:outline-none">
								{departments.map((d) => (
									<option key={d} value={d}>
										{d === 'ALL' ? 'Semua Departemen' : d}
									</option>
								))}
							</select>

							<select
								value={selectedType}
								onChange={(e) => setSelectedType(e.target.value)}
								className="bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 font-medium focus:outline-none">
								{employmentTypes.map((t) => (
									<option key={t} value={t}>
										{t === 'ALL' ? 'Semua Tipe' : t}
									</option>
								))}
							</select>

							<button
								onClick={handleExportCSV}
								className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
								<Download className="w-4 h-4" />
								<span className="hidden sm:inline">Export CSV</span>
							</button>
						</div>
					</div>
				</header>

				<main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 flex-1">
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
						<div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
							<div className="flex items-center justify-between mb-3">
								<span className="text-sm font-medium text-gray-500 dark:text-gray-400">
									Active Headcount
								</span>
								<div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
									<Users className="w-5 h-5" />
								</div>
							</div>
							<div>
								<div className="text-3xl font-extrabold text-gray-900 dark:text-white">
									{analytics.summary.activeHeadcount}{' '}
									<span className="text-sm font-normal text-gray-500">orang</span>
								</div>
								<div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
									<span>
										Hires YTD: <b className="text-emerald-500">+{analytics.summary.hiresYTD}</b> |
										Exits YTD: <b className="text-red-500">-{analytics.summary.exitsYTD}</b>
									</span>
									<span className="font-semibold">
										Net:{' '}
										{analytics.summary.netChangeYTD >= 0
											? `+${analytics.summary.netChangeYTD}`
											: analytics.summary.netChangeYTD}
									</span>
								</div>
							</div>
						</div>

						<MetricCard
							title="Turnover Rate (YTD)"
							metric={analytics.summary.turnoverYTD}
							icon={TrendingDown}
						/>
						<MetricCard
							title="Retention Rate (YTD Cohort)"
							metric={analytics.summary.retentionYTD}
							icon={ShieldCheck}
						/>
						<MetricCard
							title="90-Day New Hire Retention"
							metric={analytics.summary.retention90Day}
							icon={Award}
						/>
					</div>

					{activeTab === 'overview' && (
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
								<h2 className="text-base font-bold mb-1">
									Tren Headcount, Hires & Exits Bulanan ({cutoffDate.slice(0, 4)})
								</h2>
								<p className="text-xs text-gray-500 mb-6">
									Pergerakan jumlah karyawan aktif dan keluar-masuk sepanjang tahun berjalan.
								</p>
								<div className="h-72">
									<ResponsiveContainer width="100%" height="100%">
										<ComposedChart data={analytics.monthlyTrend}>
											<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
											<XAxis dataKey="month" fontSize={12} />
											<YAxis fontSize={12} />
											<Tooltip />
											<Legend />
											<Bar dataKey="hires" name="Hires Baru" fill="#10b981" radius={[4, 4, 0, 0]} />
											<Bar
												dataKey="exits"
												name="Exits / Resign"
												fill="#ef4444"
												radius={[4, 4, 0, 0]}
											/>
											<Line
												type="monotone"
												dataKey="hcEnd"
												name="Active Headcount"
												stroke="#3b82f6"
												strokeWidth={3}
											/>
										</ComposedChart>
									</ResponsiveContainer>
								</div>
							</div>

							<div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
								<div>
									<h2 className="text-base font-bold mb-1">Ringkasan Rekrutmen & Kualitas Data</h2>
									<p className="text-xs text-gray-500 mb-6">
										Status pipeline dari seluruh sheet yang terhubung.
									</p>

									<div className="space-y-4">
										<div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
											<span className="text-xs text-gray-500">Probation Pass Rate</span>
											<span className="text-lg font-bold text-emerald-500">
												{analytics.summary.probationPassRate.value !== null
													? `${analytics.summary.probationPassRate.value}%`
													: 'N/A'}
											</span>
										</div>
										<div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
											<span className="text-xs text-gray-500">Total Job Requisitions</span>
											<span className="text-lg font-bold">{requisitionsCount} Posisi</span>
										</div>
										<div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
											<span className="text-xs text-gray-500">Total Kandidat Pelamar</span>
											<span className="text-lg font-bold">{candidatesCount} Kandidat</span>
										</div>
									</div>
								</div>

								{analytics.qualityIssues.length > 0 && (
									<div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
										<AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
										<div>
											<p className="font-bold">
												Terdeteksi {analytics.qualityIssues.length} Catatan Kualitas Data
											</p>
											<p className="mt-0.5">
												Buka menu Data Quality Log di sidebar kiri untuk melihat detail baris.
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{activeTab === 'turnover' && (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
								<h2 className="text-base font-bold mb-1">Exit Berdasarkan Alasan (Exit Reason)</h2>
								<p className="text-xs text-gray-500 mb-6">
									Menjawab mengapa karyawan keluar dari Dipa Inhouse.
								</p>
								<div className="h-72">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={analytics.exitByReason} layout="vertical" margin={{left: 30}}>
											<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
											<XAxis type="number" fontSize={12} />
											<YAxis dataKey="name" type="category" fontSize={11} width={110} />
											<Tooltip />
											<Bar dataKey="count" name="Jumlah Exit" radius={[0, 6, 6, 0]}>
												{analytics.exitByReason.map((_, idx) => (
													<Cell key={idx} fill={COLORS[idx % COLORS.length]} />
												))}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>

							<div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
								<h2 className="text-base font-bold mb-1">
									Tenure Saat Exit (Masa Kerja Saat Resign)
								</h2>
								<p className="text-xs text-gray-500 mb-6">
									Distribusi masa kerja karyawan yang keluar.
								</p>
								<div className="h-72">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={analytics.exitByTenure}>
											<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
											<XAxis dataKey="name" fontSize={11} />
											<YAxis fontSize={12} />
											<Tooltip />
											<Bar
												dataKey="count"
												name="Jumlah Karyawan"
												fill="#f59e0b"
												radius={[6, 6, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>
					)}

					{activeTab === 'newhire' && (
						<div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
							<h2 className="text-base font-bold mb-2">Evaluasi New Hire & Probation</h2>
							<p className="text-xs text-gray-500 mb-6">
								Karyawan yang belum mencapai hari ke-90 pada tanggal cut-off ({cutoffDate}) otomatis
								dikecualikan dari denominator 90-Day Retention.
							</p>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
									<p className="text-xs text-gray-500">Eligible 90-Day Cohort (12 Bln Terakhir)</p>
									<p className="text-2xl font-bold mt-1">
										{analytics.summary.retention90Day.denominator} Karyawan
									</p>
								</div>
								<div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
									<p className="text-xs text-gray-500">Lolos ≥ 90 Hari Pertama</p>
									<p className="text-2xl font-bold text-emerald-500 mt-1">
										{analytics.summary.retention90Day.numerator} Karyawan
									</p>
								</div>
								<div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
									<p className="text-xs text-gray-500">Probation Pass Rate</p>
									<p className="text-2xl font-bold text-blue-500 mt-1">
										{analytics.summary.probationPassRate.value ?? 0}% (
										{analytics.summary.probationPassRate.numerator}/
										{analytics.summary.probationPassRate.denominator})
									</p>
								</div>
							</div>
						</div>
					)}

					{activeTab === 'department' && (
						<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
							<div className="p-6 border-b border-gray-200 dark:border-gray-800">
								<h2 className="text-base font-bold">Breakdown Headcount & Exit per Departemen</h2>
								<p className="text-xs text-gray-500">
									Menampilkan posisi aktif per tanggal cut-off ({cutoffDate}) dan riwayat keluar.
								</p>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse text-sm">
									<thead>
										<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
											<th className="py-3.5 px-6">Departemen</th>
											<th className="py-3.5 px-6">Active Headcount</th>
											<th className="py-3.5 px-6">Hires (YTD)</th>
											<th className="py-3.5 px-6">Exits (YTD)</th>
											<th className="py-3.5 px-6">Total Historical Exits</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
										{analytics.departmentBreakdown.map((d) => (
											<tr key={d.department} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
												<td className="py-3.5 px-6 font-semibold">{d.department}</td>
												<td className="py-3.5 px-6 font-bold text-blue-500">{d.activeHc}</td>
												<td className="py-3.5 px-6 text-emerald-500">+{d.hiresYTD}</td>
												<td className="py-3.5 px-6 text-red-500">{d.exitsYTD}</td>
												<td className="py-3.5 px-6 text-gray-500">{d.totalExitsAllTime}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{activeTab === 'quality' && (
						<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
							<div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
								<div>
									<h2 className="text-base font-bold">Data Quality Log & Anomali Database</h2>
									<p className="text-xs text-gray-500">
										Sistem tidak menebak data yang hilang secara diam-diam. Berikut daftar record
										yang perlu dilengkapi HR:
									</p>
								</div>
								<span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
									{analytics.qualityIssues.length} Issues Found
								</span>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse text-sm">
									<thead>
										<tr className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500">
											<th className="py-3.5 px-6">Employee ID</th>
											<th className="py-3.5 px-6">Nama Karyawan</th>
											<th className="py-3.5 px-6">Tipe Masalah</th>
											<th className="py-3.5 px-6">Keterangan Detail</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
										{analytics.qualityIssues.length === 0 ? (
											<tr>
												<td colSpan={4} className="py-8 text-center text-gray-500">
													🎉 Semua data bersih dan valid! Tidak ada anomali ditemukan.
												</td>
											</tr>
										) : (
											analytics.qualityIssues.map((issue, idx) => (
												<tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
													<td className="py-3.5 px-6 font-mono text-xs">{issue.employee_id}</td>
													<td className="py-3.5 px-6 font-medium">{issue.employee_name}</td>
													<td className="py-3.5 px-6">
														<span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-500">
															{issue.issue_type}
														</span>
													</td>
													<td className="py-3.5 px-6 text-gray-500 text-xs">{issue.description}</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
