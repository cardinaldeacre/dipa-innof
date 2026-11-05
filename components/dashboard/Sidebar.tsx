import Link from 'next/link';
import {
	Database,
	X,
	LayoutDashboard,
	PieChart,
	UserCheck,
	Building2,
	AlertTriangle,
	UserPlus,
	Upload,
	LogOut,
} from 'lucide-react';
import {logoutAction} from '@/app/login/actions';

export type TabId = 'overview' | 'turnover' | 'newhire' | 'department' | 'quality';

interface SidebarProps {
	activeTab: TabId;
	setActiveTab: (tab: TabId) => void;
	isSidebarOpen: boolean;
	setIsSidebarOpen: (open: boolean) => void;
	qualityIssuesCount: number;
	userEmail: string;
	isHrAdmin: boolean;
}

export const NAV_ITEMS = [
	{id: 'overview' as const, label: '1. Workforce Movement', icon: LayoutDashboard},
	{id: 'turnover' as const, label: '2. Stability (TO & Retention)', icon: PieChart},
	{id: 'newhire' as const, label: '3. Hiring Effectiveness', icon: UserCheck},
	{id: 'department' as const, label: '4. Department Matrix', icon: Building2},
	{id: 'quality' as const, label: '5. Data Governance Log', icon: AlertTriangle},
];

export default function Sidebar({
	activeTab,
	setActiveTab,
	isSidebarOpen,
	setIsSidebarOpen,
	qualityIssuesCount,
	userEmail,
	isHrAdmin,
}: SidebarProps) {
	return (
		<>
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
								<p className="text-[11px] text-emerald-500 font-semibold">Blueprint 2.0 Engine</p>
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
							Domain Analitik
						</p>
						<nav className="space-y-1">
							{NAV_ITEMS.map((item) => {
								const Icon = item.icon;
								const isActive = activeTab === item.id;
								const showBadge = item.id === 'quality' && qualityIssuesCount > 0;
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
										{showBadge && (
											<span
												className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
													isActive ? 'bg-white text-emerald-700' : 'bg-amber-500/15 text-amber-500'
												}`}>
												{qualityIssuesCount}
											</span>
										)}
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
		</>
	);
}
