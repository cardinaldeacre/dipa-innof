'use client';

import {useState, useMemo} from 'react';
import {Users, TrendingDown, ShieldCheck, Award, Calendar, Target} from 'lucide-react';
import {calculatePeopleAnalytics, EmployeeRow} from '@/lib/engine/analytics';
import MetricCard from './dashboard/MetricCard';
import Sidebar, {NAV_ITEMS, TabId} from './dashboard/Sidebar';
import TopHeader from './dashboard/TopHeader';
import OverviewTab from './dashboard/tabs/OverviewTab';
import StabilityTab from './dashboard/tabs/StabilityTab';
import HiringTab from './dashboard/tabs/HiringTab';
import DepartmentTab from './dashboard/tabs/DepartmentTab';
import QualityTab from './dashboard/tabs/QualityTab';

interface Props {
	employees: EmployeeRow[];
	requisitionsCount: number;
	candidatesCount: number;
	userEmail?: string;
	isHrAdmin?: boolean;
}

export default function DashboardClient({
	employees,
	userEmail = 'Internal User',
	isHrAdmin = true,
}: Props) {
	const [activeTab, setActiveTab] = useState<TabId>('overview');
	const [cutoffDate, setCutoffDate] = useState<string>('2026-10-27');
	const [selectedDept, setSelectedDept] = useState<string>('ALL');
	const [selectedType, setSelectedType] = useState<string>('ALL');
	const [includeInterns, setIncludeInterns] = useState<boolean>(true);
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
			includeInterns,
		});
	}, [employees, cutoffDate, selectedDept, selectedType, includeInterns]);

	const activeTabTitle = NAV_ITEMS.find((i) => i.id === activeTab)?.label || 'Dashboard';

	const handleExportCSV = () => {
		const headers = [
			'Month',
			'Opening HC',
			'New Hire',
			'Voluntary Exit',
			'Involuntary Exit',
			'Total Exit',
			'Closing HC',
			'Turnover (%)',
			'Voluntary TO (%)',
			'Involuntary TO (%)',
			'Monthly Retention (%)',
		];
		const rows = analytics.monthlyTable.map((m) => [
			m.month,
			m.openingHc,
			m.newHire,
			m.voluntaryExit,
			m.involuntaryExit,
			m.totalExit,
			m.closingHc,
			m.turnoverRate,
			m.voluntaryTurnoverRate,
			m.involuntaryTurnoverRate,
			m.retentionRate,
		]);
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			[headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const link = document.createElement('a');
		link.setAttribute('href', encodeURI(csvContent));
		link.setAttribute('download', `Dipa_Workforce_Movement_${cutoffDate}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex">
			<Sidebar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				isSidebarOpen={isSidebarOpen}
				setIsSidebarOpen={setIsSidebarOpen}
				qualityIssuesCount={analytics.qualityIssues.length}
				userEmail={userEmail}
				isHrAdmin={isHrAdmin}
			/>

			<div className="flex-1 flex flex-col min-w-0">
				<TopHeader
					activeTabTitle={activeTabTitle}
					setIsSidebarOpen={setIsSidebarOpen}
					includeInterns={includeInterns}
					setIncludeInterns={setIncludeInterns}
					cutoffDate={cutoffDate}
					setCutoffDate={setCutoffDate}
					selectedDept={selectedDept}
					setSelectedDept={setSelectedDept}
					departments={departments}
					selectedType={selectedType}
					setSelectedType={setSelectedType}
					employmentTypes={employmentTypes}
					onExportCSV={handleExportCSV}
				/>

				<main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
					{/* 8 Kartu KPI Utama */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-1">
									<span className="text-xs font-bold text-gray-700 dark:text-gray-200">
										Closing Headcount
									</span>
									<div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
										<Users className="w-4 h-4" />
									</div>
								</div>
								<p className="text-[11px] text-gray-500 mb-2">
									Opening 1 Jan: {analytics.summary.openingHeadcountYear} orang
								</p>
							</div>
							<div>
								<div className="text-2xl font-extrabold text-gray-900 dark:text-white">
									{analytics.summary.activeHeadcount}{' '}
									<span className="text-xs font-normal text-gray-500">aktif</span>
								</div>
								<div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
									<span>
										New Hire: <b className="text-emerald-500">+{analytics.summary.hiresYTD}</b> |
										Exit: <b className="text-red-500">-{analytics.summary.exitsYTD}</b>
									</span>
									<span className="font-bold">
										Net:{' '}
										{analytics.summary.netChangeYTD >= 0
											? `+${analytics.summary.netChangeYTD}`
											: analytics.summary.netChangeYTD}
									</span>
								</div>
							</div>
						</div>

						<MetricCard
							title="1. YTD Turnover (Company)"
							subtitle="Periode Aktual: Jan – Bulan Berjalan"
							metric={analytics.summary.turnoverYTDCompany}
							icon={TrendingDown}
						/>
						<MetricCard
							title="2. YTD Turnover (KPI)"
							subtitle="Periode KPI: Mar – Bulan Berjalan"
							metric={analytics.summary.turnoverYTDKPI}
							icon={Target}
							highlightKPI
						/>
						<MetricCard
							title="3. YTD Retention (Company)"
							subtitle="Baseline: Cohort Aktif 1 Januari"
							metric={analytics.summary.retentionYTDCompany}
							icon={ShieldCheck}
						/>
						<MetricCard
							title="4. YTD Retention (KPI)"
							subtitle="Baseline: Cohort Aktif 1 Maret"
							metric={analytics.summary.retentionYTDKPI}
							icon={Target}
							highlightKPI
						/>
						<MetricCard
							title="5. Monthly Turnover Rate"
							subtitle={`Bulan Berjalan (${cutoffDate.slice(0, 7)})`}
							metric={analytics.summary.monthlyTurnoverMetric}
							icon={Calendar}
						/>
						<MetricCard
							title="6. Monthly Retention Rate"
							subtitle={`Cohort Awal Bulan (${cutoffDate.slice(0, 7)})`}
							metric={analytics.summary.monthlyRetentionMetric}
							icon={ShieldCheck}
						/>
						<MetricCard
							title="7. 90-Day New Hire Retention"
							subtitle="Observasi Cohort ≥ 90 Hari"
							metric={analytics.summary.retention90Day}
							icon={Award}
						/>
					</div>

					{/* Render Tab secara Modular */}
					{activeTab === 'overview' && (
						<OverviewTab monthlyTable={analytics.monthlyTable} year={cutoffDate.slice(0, 4)} />
					)}
					{activeTab === 'turnover' && <StabilityTab analytics={analytics} />}
					{activeTab === 'newhire' && (
						<HiringTab analytics={analytics} year={cutoffDate.slice(0, 4)} />
					)}
					{activeTab === 'department' && (
						<DepartmentTab departmentBreakdown={analytics.departmentBreakdown} />
					)}
					{activeTab === 'quality' && <QualityTab qualityIssues={analytics.qualityIssues} />}
				</main>
			</div>
		</div>
	);
}
