export interface EmployeeRow {
	employee_id: string;
	employee_name: string;
	job_title: string | null;
	department: string | null;
	status: string | null;
	employee_status: string | null;
	employment_type: string | null;
	gender: string | null;
	join_date: string | null;
	years_of_service: number | null;
	probation_start_date: string | null;
	probation_end_date: string | null;
	probation_outcome: string | null;
	exit_date: string | null;
	exit_type: string | null;
	exit_reason: string | null;
}

export interface MetricResult {
	value: number | null;
	numerator: number;
	denominator: number;
	periodStart: string;
	periodEnd: string;
	status: 'valid' | 'insufficient_data' | 'data_quality_issue';
	formula: string;
	target?: string;
}

export interface DataQualityIssue {
	employee_id: string;
	employee_name: string;
	issue_type: string;
	description: string;
}

// Helper: Cek apakah karyawan aktif pada tanggal tertentu
// Aturan: Join <= targetDate, dan (Exit > targetDate atau belum Exit)
export function isActiveOnDate(emp: EmployeeRow, targetDateStr: string): boolean {
	if (!emp.join_date) return false;
	const join = emp.join_date.slice(0, 10);
	if (join > targetDateStr) return false;

	if (emp.exit_date) {
		const exit = emp.exit_date.slice(0, 10);
		// Sesuai Data Governance Rule #1: Exit dihitung pada tanggal efektif terakhir bekerja
		if (exit <= targetDateStr) return false;
	} else if (emp.status && emp.status.toLowerCase() === 'inactive') {
		return false;
	}
	return true;
}

// Helper: Klasifikasi Exit Type sesuai Blueprint 2.0 (Bagian 2.1 - 2.3)
export function classifyExitCategory(
	exitType: string | null
): 'voluntary' | 'involuntary' | 'other' {
	if (!exitType) return 'other';
	const t = exitType.trim().toLowerCase().replace(/-/g, ' ');
	if (t === 'voluntary' || t === 'voluntary resignation') {
		return 'voluntary';
	}
	if (
		t === 'involuntary' ||
		t === 'involuntary termination' ||
		t === 'contract non renewal' ||
		t === 'probation non continuation' ||
		t === 'failed probation'
	) {
		return 'involuntary';
	}
	return 'other';
}

function addDays(dateStr: string, days: number): string {
	const d = new Date(dateStr + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

function prevDay(dateStr: string): string {
	return addDays(dateStr, -1);
}

export function calculatePeopleAnalytics(
	allEmployees: EmployeeRow[],
	filters: {
		cutoffDate: string; // YYYY-MM-DD
		department?: string;
		employmentType?: string;
		includeInterns?: boolean;
	}
) {
	const {cutoffDate, department, employmentType, includeInterns = true} = filters;
	const cutoffYear = Number(cutoffDate.slice(0, 4));
	const cutoffMonth = Number(cutoffDate.slice(5, 7));
	const yearStart = `${cutoffYear}-01-01`;
	const kpiStart = `${cutoffYear}-03-01`; // Periode KPI dimulai 1 Maret

	// 1. Filter Populasi Workforce (Rule #7 & #8: Konsistensi Populasi & Opsi Intern)
	const employees = allEmployees.filter((e) => {
		if (!includeInterns) {
			const isIntern =
				e.employment_type?.toLowerCase().includes('intern') ||
				e.employee_status?.toLowerCase().includes('intern');
			if (isIntern) return false;
		}
		if (department && department !== 'ALL' && e.department !== department) return false;
		if (employmentType && employmentType !== 'ALL' && e.employment_type !== employmentType)
			return false;
		return true;
	});

	// 2. Bangun Tabel Bulanan (Workforce Movement & Monthly Metrics Table: Jan s/d Bulan Cut-off)
	const monthNames = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'Mei',
		'Jun',
		'Jul',
		'Agu',
		'Sep',
		'Okt',
		'Nov',
		'Des',
	];
	const monthlyTable: Array<{
		monthIndex: number;
		month: string;
		openingHc: number;
		newHire: number;
		voluntaryExit: number;
		involuntaryExit: number;
		otherExit: number;
		totalExit: number;
		closingHc: number;
		avgHc: number;
		turnoverRate: number;
		voluntaryTurnoverRate: number;
		involuntaryTurnoverRate: number;
		retentionRate: number;
		openingCohortExits: number;
	}> = [];

	for (let m = 1; m <= cutoffMonth; m++) {
		const mStr = String(m).padStart(2, '0');
		const mStart = `${cutoffYear}-${mStr}-01`;
		const lastDayOfMonth = new Date(Date.UTC(cutoffYear, m, 0)).toISOString().slice(0, 10);
		const mEnd = m === cutoffMonth && cutoffDate < lastDayOfMonth ? cutoffDate : lastDayOfMonth;

		// Opening HC = Karyawan yang sudah aktif tepat sebelum bulan dimulai (H-1)
		// Sehingga New Hire yang masuk tanggal 1 bulan tersebut masuk sebagai New Hire, bukan Opening Cohort
		const openingDateRef = prevDay(mStart);
		const openingCohort = employees.filter((e) => isActiveOnDate(e, openingDateRef));
		const openingHc = openingCohort.length;

		// New Hire bulan ini
		const mHiresList = employees.filter(
			(e) => e.join_date && e.join_date.slice(0, 10) >= mStart && e.join_date.slice(0, 10) <= mEnd
		);
		const newHire = mHiresList.length;

		// Exits bulan ini (Setiap employee hanya dihitung 1x berdasarkan exit_date)
		const mExitsList = employees.filter(
			(e) => e.exit_date && e.exit_date.slice(0, 10) >= mStart && e.exit_date.slice(0, 10) <= mEnd
		);

		let voluntaryExit = 0;
		let involuntaryExit = 0;
		let otherExit = 0;

		mExitsList.forEach((e) => {
			const cat = classifyExitCategory(e.exit_type);
			if (cat === 'voluntary') voluntaryExit++;
			else if (cat === 'involuntary') involuntaryExit++;
			else otherExit++;
		});

		const totalExit = mExitsList.length;
		const closingHc = employees.filter((e) => isActiveOnDate(e, mEnd)).length;
		const avgHc = (openingHc + closingHc) / 2;

		// Monthly Turnover Rates (Bagian 2.1 - 2.4)
		const turnoverRate = avgHc > 0 ? Number(((totalExit / avgHc) * 100).toFixed(2)) : 0;
		const voluntaryTurnoverRate =
			avgHc > 0 ? Number(((voluntaryExit / avgHc) * 100).toFixed(2)) : 0;
		const involuntaryTurnoverRate =
			avgHc > 0 ? Number(((involuntaryExit / avgHc) * 100).toFixed(2)) : 0;

		// Monthly Retention Rate (Bagian 3.1): (Opening HC - Opening Cohort Exit) / Opening HC * 100%
		// New hire yang bergabung di tengah bulan tidak masuk denominator maupun numerator
		const openingCohortExits = openingCohort.filter(
			(e) => e.exit_date && e.exit_date.slice(0, 10) >= mStart && e.exit_date.slice(0, 10) <= mEnd
		).length;
		const retentionRate =
			openingHc > 0 ? Number((((openingHc - openingCohortExits) / openingHc) * 100).toFixed(2)) : 0;

		monthlyTable.push({
			monthIndex: m,
			month: monthNames[m - 1],
			openingHc,
			newHire,
			voluntaryExit,
			involuntaryExit,
			otherExit,
			totalExit,
			closingHc,
			avgHc: Number(avgHc.toFixed(2)),
			turnoverRate,
			voluntaryTurnoverRate,
			involuntaryTurnoverRate,
			retentionRate,
			openingCohortExits,
		});
	}

	// Ambil data bulan terakhir (Bulan Berjalan) untuk Main KPI Cards #5 & #6
	const currentMonthData = monthlyTable[monthlyTable.length - 1];

	const monthlyTurnoverMetric: MetricResult = {
		value: currentMonthData ? currentMonthData.turnoverRate : null,
		numerator: currentMonthData ? currentMonthData.totalExit : 0,
		denominator: currentMonthData ? currentMonthData.avgHc : 0,
		periodStart: `${cutoffDate.slice(0, 7)}-01`,
		periodEnd: cutoffDate,
		status: currentMonthData && currentMonthData.avgHc > 0 ? 'valid' : 'insufficient_data',
		formula: 'Monthly Total Exit ÷ Monthly Average HC × 100%',
	};

	const monthlyRetentionMetric: MetricResult = {
		value: currentMonthData ? currentMonthData.retentionRate : null,
		numerator: currentMonthData
			? currentMonthData.openingHc - currentMonthData.openingCohortExits
			: 0,
		denominator: currentMonthData ? currentMonthData.openingHc : 0,
		periodStart: `${cutoffDate.slice(0, 7)}-01`,
		periodEnd: cutoffDate,
		status: currentMonthData && currentMonthData.openingHc > 0 ? 'valid' : 'insufficient_data',
		formula: '(Opening HC - Opening Cohort Exit) ÷ Opening HC × 100%',
	};

	// 3. YTD Turnover Rate - Company (Januari s/d Bulan Berjalan - Bagian 2.5)
	const exitsYTDList = employees.filter(
		(e) =>
			e.exit_date && e.exit_date.slice(0, 10) >= yearStart && e.exit_date.slice(0, 10) <= cutoffDate
	);
	const hiresYTDList = employees.filter(
		(e) =>
			e.join_date && e.join_date.slice(0, 10) >= yearStart && e.join_date.slice(0, 10) <= cutoffDate
	);
	const avgHcYTDCompany =
		monthlyTable.length > 0
			? monthlyTable.reduce((acc, cur) => acc + cur.avgHc, 0) / monthlyTable.length
			: 0;

	const turnoverYTDCompany: MetricResult = {
		value:
			avgHcYTDCompany > 0
				? Number(((exitsYTDList.length / avgHcYTDCompany) * 100).toFixed(2))
				: null,
		numerator: exitsYTDList.length,
		denominator: Number(avgHcYTDCompany.toFixed(2)),
		periodStart: yearStart,
		periodEnd: cutoffDate,
		status: avgHcYTDCompany > 0 ? 'valid' : 'insufficient_data',
		formula: 'Total Exit YTD (Jan–Sekarang) ÷ Average HC YTD (Jan–Sekarang) × 100%',
	};

	// Voluntary & Involuntary YTD (Company)
	const volExitsYTD = exitsYTDList.filter(
		(e) => classifyExitCategory(e.exit_type) === 'voluntary'
	).length;
	const involExitsYTD = exitsYTDList.filter(
		(e) => classifyExitCategory(e.exit_type) === 'involuntary'
	).length;

	const voluntaryTurnoverYTD: MetricResult = {
		value: avgHcYTDCompany > 0 ? Number(((volExitsYTD / avgHcYTDCompany) * 100).toFixed(2)) : null,
		numerator: volExitsYTD,
		denominator: Number(avgHcYTDCompany.toFixed(2)),
		periodStart: yearStart,
		periodEnd: cutoffDate,
		status: avgHcYTDCompany > 0 ? 'valid' : 'insufficient_data',
		formula: 'Voluntary Exit YTD ÷ Average HC YTD × 100%',
	};

	const involuntaryTurnoverYTD: MetricResult = {
		value:
			avgHcYTDCompany > 0 ? Number(((involExitsYTD / avgHcYTDCompany) * 100).toFixed(2)) : null,
		numerator: involExitsYTD,
		denominator: Number(avgHcYTDCompany.toFixed(2)),
		periodStart: yearStart,
		periodEnd: cutoffDate,
		status: avgHcYTDCompany > 0 ? 'valid' : 'insufficient_data',
		formula:
			'Involuntary Exit YTD (Termasuk Failed Probation & Non-Renewal) ÷ Average HC YTD × 100%',
	};

	// 4. YTD Turnover Rate - KPI (Maret s/d Bulan Berjalan - Bagian 2.6)
	const kpiMonths = monthlyTable.filter((m) => m.monthIndex >= 3);
	const avgHcKPI =
		kpiMonths.length > 0
			? kpiMonths.reduce((acc, cur) => acc + cur.avgHc, 0) / kpiMonths.length
			: 0;
	const exitsKPIList =
		cutoffDate >= kpiStart
			? employees.filter(
					(e) =>
						e.exit_date &&
						e.exit_date.slice(0, 10) >= kpiStart &&
						e.exit_date.slice(0, 10) <= cutoffDate
				)
			: [];

	const turnoverYTDKPI: MetricResult = {
		value:
			cutoffDate >= kpiStart && avgHcKPI > 0
				? Number(((exitsKPIList.length / avgHcKPI) * 100).toFixed(2))
				: null,
		numerator: exitsKPIList.length,
		denominator: Number(avgHcKPI.toFixed(2)),
		periodStart: kpiStart,
		periodEnd: cutoffDate,
		status: cutoffDate >= kpiStart && avgHcKPI > 0 ? 'valid' : 'insufficient_data',
		formula: 'Total Exit sejak 1 Maret ÷ Average HC Bulanan sejak Maret × 100%',
	};

	// 5. YTD Retention Rate - Company (Bagian 3.2: Baseline 1 Januari Opening Cohort)
	const janOpeningCohort = employees.filter((e) => isActiveOnDate(e, yearStart));
	const janCohortExitsYTD = janOpeningCohort.filter(
		(e) =>
			e.exit_date && e.exit_date.slice(0, 10) >= yearStart && e.exit_date.slice(0, 10) <= cutoffDate
	).length;
	const janCohortRetained = janOpeningCohort.length - janCohortExitsYTD;

	const retentionYTDCompany: MetricResult = {
		value:
			janOpeningCohort.length > 0
				? Number(((janCohortRetained / janOpeningCohort.length) * 100).toFixed(2))
				: null,
		numerator: janCohortRetained,
		denominator: janOpeningCohort.length,
		periodStart: yearStart,
		periodEnd: cutoffDate,
		status: janOpeningCohort.length > 0 ? 'valid' : 'insufficient_data',
		formula: '(January Opening Cohort - January Cohort Exit YTD) ÷ January Opening Cohort × 100%',
	};

	// 6. YTD Retention Rate - KPI (Bagian 3.3: Baseline 1 Maret Opening Cohort, Target >92%)
	const marOpeningCohort = employees.filter((e) => isActiveOnDate(e, kpiStart));
	const marCohortExitsKPI =
		cutoffDate >= kpiStart
			? marOpeningCohort.filter(
					(e) =>
						e.exit_date &&
						e.exit_date.slice(0, 10) >= kpiStart &&
						e.exit_date.slice(0, 10) <= cutoffDate
				).length
			: 0;
	const marCohortRetained = marOpeningCohort.length - marCohortExitsKPI;

	const retentionYTDKPI: MetricResult = {
		value:
			cutoffDate >= kpiStart && marOpeningCohort.length > 0
				? Number(((marCohortRetained / marOpeningCohort.length) * 100).toFixed(2))
				: null,
		numerator: marCohortRetained,
		denominator: marOpeningCohort.length,
		periodStart: kpiStart,
		periodEnd: cutoffDate,
		status: cutoffDate >= kpiStart && marOpeningCohort.length > 0 ? 'valid' : 'insufficient_data',
		formula: '(March Opening Cohort - March Cohort Exit YTD) ÷ March Opening Cohort × 100%',
		target: '> 92%',
	};

	// 7. Hiring Effectiveness Metrics (Bagian 4.1 - 4.4)
	// 7a. 90-Day New Hire Retention (Hanya yang sudah mencapai observasi 90 hari)
	const oneYearBeforeCutoff = `${cutoffYear - 1}-${cutoffDate.slice(5, 10)}`;
	const eligible90DayHires = employees.filter((e) => {
		if (!e.join_date) return false;
		const join = e.join_date.slice(0, 10);
		if (join < oneYearBeforeCutoff || join > cutoffDate) return false;
		return addDays(join, 90) <= cutoffDate;
	});

	const retained90DayHires = eligible90DayHires.filter((e) => {
		const day90 = addDays(e.join_date!.slice(0, 10), 90);
		return isActiveOnDate(e, day90);
	});

	const retention90Day: MetricResult = {
		value:
			eligible90DayHires.length > 0
				? Number(((retained90DayHires.length / eligible90DayHires.length) * 100).toFixed(2))
				: null,
		numerator: retained90DayHires.length,
		denominator: eligible90DayHires.length,
		periodStart: oneYearBeforeCutoff,
		periodEnd: cutoffDate,
		status: eligible90DayHires.length > 0 ? 'valid' : 'insufficient_data',
		formula: 'New Hire Still Active at Day 90 ÷ Eligible New Hire Cohort (≥90 Hari) × 100%',
	};

	// 7b. Probation Pass Rate & Failed Probation Rate (Hanya dari Completed Probation Outcome)
	const probationPassed = employees.filter(
		(e) => e.probation_outcome?.toLowerCase() === 'passed'
	).length;
	const probationFailed = employees.filter(
		(e) => e.probation_outcome?.toLowerCase() === 'failed'
	).length;
	const probationCompleted = probationPassed + probationFailed;

	const probationPassRate: MetricResult = {
		value:
			probationCompleted > 0
				? Number(((probationPassed / probationCompleted) * 100).toFixed(2))
				: null,
		numerator: probationPassed,
		denominator: probationCompleted,
		periodStart: 'All-time',
		periodEnd: cutoffDate,
		status: probationCompleted > 0 ? 'valid' : 'insufficient_data',
		formula: 'New Hire Passed Probation ÷ Total Completed Probation Outcome × 100%',
	};

	const failedProbationRate: MetricResult = {
		value:
			probationCompleted > 0
				? Number(((probationFailed / probationCompleted) * 100).toFixed(2))
				: null,
		numerator: probationFailed,
		denominator: probationCompleted,
		periodStart: 'All-time',
		periodEnd: cutoffDate,
		status: probationCompleted > 0 ? 'valid' : 'insufficient_data',
		formula: 'Failed Probation ÷ Total Completed Probation Outcome × 100%',
	};

	// 7c. New Hire Attrition Rate (YTD Hiring Cohort)
	const newHireExitsYTD = hiresYTDList.filter(
		(e) => e.exit_date && e.exit_date.slice(0, 10) <= cutoffDate
	).length;

	const newHireAttritionRate: MetricResult = {
		value:
			hiresYTDList.length > 0
				? Number(((newHireExitsYTD / hiresYTDList.length) * 100).toFixed(2))
				: null,
		numerator: newHireExitsYTD,
		denominator: hiresYTDList.length,
		periodStart: yearStart,
		periodEnd: cutoffDate,
		status: hiresYTDList.length > 0 ? 'valid' : 'insufficient_data',
		formula: 'New Hire Exit ÷ Total New Hire in Cohort × 100%',
	};

	// 7d. Tabel Hiring Effectiveness per Kuartal (Q1 - Q4 di tahun berjalan)
	const quarters = [
		{period: 'Q1 (Jan–Mar)', start: `${cutoffYear}-01-01`, end: `${cutoffYear}-03-31`},
		{period: 'Q2 (Apr–Jun)', start: `${cutoffYear}-04-01`, end: `${cutoffYear}-06-30`},
		{period: 'Q3 (Jul–Sep)', start: `${cutoffYear}-07-01`, end: `${cutoffYear}-09-30`},
		{period: 'Q4 (Okt–Des)', start: `${cutoffYear}-10-01`, end: `${cutoffYear}-12-31`},
	];

	const hiringEffectivenessTable = quarters.map((q) => {
		const qHires = employees.filter(
			(e) =>
				e.join_date &&
				e.join_date.slice(0, 10) >= q.start &&
				e.join_date.slice(0, 10) <= q.end &&
				e.join_date.slice(0, 10) <= cutoffDate
		);
		const passed = qHires.filter((e) => e.probation_outcome?.toLowerCase() === 'passed').length;
		const failed = qHires.filter((e) => e.probation_outcome?.toLowerCase() === 'failed').length;
		const completed = passed + failed;
		const newHireExits = qHires.filter(
			(e) => e.exit_date && e.exit_date.slice(0, 10) <= cutoffDate
		).length;

		return {
			period: q.period,
			newHire: qHires.length,
			passed,
			failed,
			pending: qHires.length - completed,
			passRate: completed > 0 ? Number(((passed / completed) * 100).toFixed(1)) : null,
			failedRate: completed > 0 ? Number(((failed / completed) * 100).toFixed(1)) : null,
			attritionRate:
				qHires.length > 0 ? Number(((newHireExits / qHires.length) * 100).toFixed(1)) : null,
		};
	});

	// 8. Breakdown per Departemen
	const deptMap = new Map<
		string,
		{
			department: string;
			openingHc: number;
			activeHc: number;
			hiresYTD: number;
			voluntaryExitsYTD: number;
			involuntaryExitsYTD: number;
			exitsYTD: number;
		}
	>();

	employees.forEach((e) => {
		const dept = e.department || 'Unassigned';
		if (!deptMap.has(dept)) {
			deptMap.set(dept, {
				department: dept,
				openingHc: 0,
				activeHc: 0,
				hiresYTD: 0,
				voluntaryExitsYTD: 0,
				involuntaryExitsYTD: 0,
				exitsYTD: 0,
			});
		}
		const item = deptMap.get(dept)!;
		if (isActiveOnDate(e, prevDay(yearStart))) item.openingHc++;
		if (isActiveOnDate(e, cutoffDate)) item.activeHc++;
		if (
			e.join_date &&
			e.join_date.slice(0, 10) >= yearStart &&
			e.join_date.slice(0, 10) <= cutoffDate
		) {
			item.hiresYTD++;
		}
		if (
			e.exit_date &&
			e.exit_date.slice(0, 10) >= yearStart &&
			e.exit_date.slice(0, 10) <= cutoffDate
		) {
			item.exitsYTD++;
			const cat = classifyExitCategory(e.exit_type);
			if (cat === 'voluntary') item.voluntaryExitsYTD++;
			else if (cat === 'involuntary') item.involuntaryExitsYTD++;
		}
	});
	const departmentBreakdown = Array.from(deptMap.values()).sort((a, b) => b.activeHc - a.activeHc);

	// 9. Breakdown Exit Reason & Exit Type (Historis s/d Cut-off)
	const allHistoricalExits = employees.filter(
		(e) => e.exit_date && e.exit_date.slice(0, 10) <= cutoffDate
	);
	const exitReasonMap = new Map<string, number>();
	const exitTypeMap = new Map<string, number>();

	allHistoricalExits.forEach((e) => {
		const reason = e.exit_reason || 'Other / Missing';
		const type = e.exit_type || 'Other';
		exitReasonMap.set(reason, (exitReasonMap.get(reason) || 0) + 1);
		exitTypeMap.set(type, (exitTypeMap.get(type) || 0) + 1);
	});

	const exitByReason = Array.from(exitReasonMap.entries())
		.map(([name, count]) => ({name, count}))
		.sort((a, b) => b.count - a.count);

	const exitByType = Array.from(exitTypeMap.entries())
		.map(([name, count]) => ({name, count}))
		.sort((a, b) => b.count - a.count);

	// 10. Data Quality Validator
	const qualityIssues: DataQualityIssue[] = [];
	allEmployees.forEach((e) => {
		if (!e.join_date) {
			qualityIssues.push({
				employee_id: e.employee_id,
				employee_name: e.employee_name,
				issue_type: 'Missing Join Date',
				description: 'Tanggal masuk (Join Date) kosong.',
			});
		}
		if (e.join_date && e.exit_date && e.exit_date.slice(0, 10) < e.join_date.slice(0, 10)) {
			qualityIssues.push({
				employee_id: e.employee_id,
				employee_name: e.employee_name,
				issue_type: 'Invalid Exit Date',
				description: `Exit Date (${e.exit_date}) lebih awal dari Join Date (${e.join_date}).`,
			});
		}
		if (e.status?.toLowerCase() === 'active' && e.exit_date) {
			qualityIssues.push({
				employee_id: e.employee_id,
				employee_name: e.employee_name,
				issue_type: 'Status Conflict',
				description: `Status tertulis Active, tetapi memiliki Exit Date (${e.exit_date}).`,
			});
		}
		if (
			(e.status?.toLowerCase() === 'inactive' || e.exit_date) &&
			(!e.exit_type || !e.exit_reason)
		) {
			qualityIssues.push({
				employee_id: e.employee_id,
				employee_name: e.employee_name,
				issue_type: 'Incomplete Exit Data',
				description: 'Karyawan sudah keluar, namun Exit Type atau Exit Reason belum lengkap.',
			});
		}
	});

	const activeHeadcount = employees.filter((e) => isActiveOnDate(e, cutoffDate)).length;
	const openingHeadcountYear = employees.filter((e) =>
		isActiveOnDate(e, prevDay(yearStart))
	).length;

	return {
		summary: {
			openingHeadcountYear,
			activeHeadcount,
			hiresYTD: hiresYTDList.length,
			exitsYTD: exitsYTDList.length,
			netChangeYTD: hiresYTDList.length - exitsYTDList.length,
			// 7 Main KPI Cards (Blueprint 2.0 Section 6)
			turnoverYTDCompany,
			turnoverYTDKPI,
			retentionYTDCompany,
			retentionYTDKPI,
			monthlyTurnoverMetric,
			monthlyRetentionMetric,
			retention90Day,
			// Supporting KPIs
			voluntaryTurnoverYTD,
			involuntaryTurnoverYTD,
			probationPassRate,
			failedProbationRate,
			newHireAttritionRate,
		},
		monthlyTable,
		hiringEffectivenessTable,
		departmentBreakdown,
		exitByReason,
		exitByType,
		qualityIssues,
	};
}
