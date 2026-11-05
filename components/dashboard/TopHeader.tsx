import {Menu, Download} from 'lucide-react';

interface TopHeaderProps {
	activeTabTitle: string;
	setIsSidebarOpen: (open: boolean) => void;
	includeInterns: boolean;
	setIncludeInterns: (val: boolean) => void;
	cutoffDate: string;
	setCutoffDate: (val: string) => void;
	selectedDept: string;
	setSelectedDept: (val: string) => void;
	departments: string[];
	selectedType: string;
	setSelectedType: (val: string) => void;
	employmentTypes: string[];
	onExportCSV: () => void;
}

export default function TopHeader({
	activeTabTitle,
	setIsSidebarOpen,
	includeInterns,
	setIncludeInterns,
	cutoffDate,
	setCutoffDate,
	selectedDept,
	setSelectedDept,
	departments,
	selectedType,
	setSelectedType,
	employmentTypes,
	onExportCSV,
}: TopHeaderProps) {
	return (
		<header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<button
						onClick={() => setIsSidebarOpen(true)}
						className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden cursor-pointer">
						<Menu className="w-5 h-5" />
					</button>
					<div>
						<h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
							{activeTabTitle}
						</h2>
						<p className="text-[11px] text-gray-500 hidden sm:block">
							Company Period: Jan–Des • KPI Measurement Period: Mar–Des 2026
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 text-xs">
					<label className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/70 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
						<input
							type="checkbox"
							checked={includeInterns}
							onChange={(e) => setIncludeInterns(e.target.checked)}
							className="rounded text-emerald-600 focus:ring-0"
						/>
						<span className="font-medium">Include Intern</span>
					</label>

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
						className="bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 font-medium">
						{departments.map((d) => (
							<option key={d} value={d}>
								{d === 'ALL' ? 'Semua Dept' : d}
							</option>
						))}
					</select>

					<select
						value={selectedType}
						onChange={(e) => setSelectedType(e.target.value)}
						className="bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 font-medium">
						{employmentTypes.map((t) => (
							<option key={t} value={t}>
								{t === 'ALL' ? 'Semua Tipe' : t}
							</option>
						))}
					</select>

					<button
						onClick={onExportCSV}
						className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
						<Download className="w-4 h-4" />
						<span className="hidden sm:inline">Export CSV</span>
					</button>
				</div>
			</div>
		</header>
	);
}
