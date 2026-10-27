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
}

export interface DataQualityIssue {
	employee_id: string;
	employee_name: string;
	issue_type: string;
	description: string;
}

export function isActiveOnDate(emp: EmployeeRow, targetDateStr: string): boolean {
	if (!emp.join_date) return false;
	const join = emp.join_date.slice(0, 10);
	if (join > targetDateStr) return false;

	if (emp.exit_date) {
		const exit = emp.exit_date.slice(0, 10);
		if (exit <= targetDateStr) return false;
	} else if (emp.status && emp.status.toLowerCase() === 'inactive') {
		return false;
	}
	return true;
}

function addDays(dateStr: string, days: number): string {
	const d = new Date(dateStr + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

export function calculatePeopleAnalytics(
	allEmployees: EmployeeRow[],
	filters: {
		cutoffDate: string;
		department?: string;
		employmentType?: string;
	}
) {
	const {cutoffDate, department, employmentType} = filters;
	const yearStart = `${cutoffDate.slice(0, 4)}-01-01`;
	const cutoffYear = Number(cutoffDate.slice(0, 4));
	const cutoffMonth = Number(cutoffDate.slice(5, 7));

	const employees = allEmployees.filter((e) => {
		if (department && department !== 'ALL' && e.department !== department) return false;
		if (employmentType && employmentType !== 'ALL' && e.employment_type !== employmentType)
			return false;
		return true;
	});

	const activeEmployees = employees.filter((e) => isActiveOnDate(e, cutoffDate));
	const activeHeadcount = activeEmployees.length;

	const hiresYTDList = employees.filter(
		(e) =>
			e.join_date && e.join_date.slice(0, 10) >= yearStart && e.join_date.slice(0, 10) <= cutoffDate
	);
	const exitsYTDList = employees.filter(
		(e) =>
			e.exit_date && e.exit_date.slice(0, 10) >= yearStart && e.exit_date.slice(0, 10) <= cutoffDate
	);

	const hiresYTD = hiresYTDList.length;
	const exitsYTD = exitsYTDList.length;
	const netChangeYTD = hiresYTD - exitsYTD;

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
	const monthlyTrend: Array<{
		month: string;
		hcStart: number;
		hcEnd: number;
		avgHc: number;
		hires: number;
		exits: number;
		turnoverRate: number;
	}> = [];

	for (let m = 1; m <= cutoffMonth; m++) {
		const mStr = String(m).padStart(2, '0');
		const mStart = `${cutoffYear}-${mStr}-01`;
		const lastDay = new Date(Date.UTC(cutoffYear, m, 0)).toISOString().slice(0, 10);
		const mEnd = m === cutoffMonth && cutoffDate < lastDay ? cutoffDate : lastDay;

		const hcStart = employees.filter((e) => isActiveOnDate(e, mStart)).length;
		const hcEnd = employees.filter((e) => isActiveOnDate(e, mEnd)).length;
		const avgHc = (hcStart + hcEnd) / 2;

		const mHires = employees.filter(
			(e) => e.join_date && e.join_date.slice(0, 10) >= mStart && e.join_date.slice(0, 10) <= mEnd
		).length;
		const mExits = employees.filter(
			(e) => e.exit_date && e.exit_date.slice(0, 10) >= mStart && e.exit_date.slice(0, 10) <= mEnd
		).length;

		const mTurnover = avgHc > 0 ? Number(((mExits / avgHc) * 100).toFixed(2)) : 0;

		monthlyTrend.push({
			month: monthNames[m - 1],
			hcStart,
			hcEnd,
			avgHc: Number(avgHc.toFixed(1)),
			hires: mHires,
			exits: mExits,
			turnoverRate: mTurnover,
		});
	}

	const avgMonthlyHcYTD =
		monthlyTrend.length > 0
			? monthlyTrend.reduce((acc, cur) => acc + cur.avgHc, 0) / monthlyTrend.length
			: 0;

	const turnoverYTD: MetricResult = {
		value: avgMonthlyHcYTD > 0 ? Number(((exitsYTD / avgMonthlyHcYTD) * 100).toFixed(2)) : null,
		numerator: exitsYTD,
		denominator: Number(avgMonthlyHcYTD.toFixed(2)),
		periodStart: yearStart,
		periodEnd: cutoffDate,
		status: avgMonthlyHcYTD > 0 ? 'valid' : 'insufficient_data',
		formula: 'Exit YTD ÷ Rata-rata Monthly Avg Headcount × 100%',
	};

	const jan1Cohort = employees.filter((e) => isActiveOnDate(e, yearStart));
	const jan1Retained = jan1Cohort.filter((e) => isActiveOnDate(e, cutoffDate));

	const retentionYTD: MetricResult = {
		value:
			jan1Cohort.length > 0
				? Number(((jan1Retained.length / jan1Cohort.length) * 100).toFixed(2))
				: null,
		numerator: jan1Retained.length,
		denominator: jan1Cohort.length,
		periodStart: yearStart,
		periodEnd: cutoffDate,
		status: jan1Cohort.length > 0 ? 'valid' : 'insufficient_data',
		formula: 'Anggota Cohort 1 Jan yang masih aktif ÷ Total Cohort 1 Jan × 100%',
	};

	const oneYearBeforeCutoff = `${cutoffYear - 1}-${cutoffDate.slice(5, 10)}`;
	const eligible90DayHires = employees.filter((e) => {
		if (!e.join_date) return false;
		const join = e.join_date.slice(0, 10);
		if (join < oneYearBeforeCutoff || join > cutoffDate) return false;
		const day90 = addDays(join, 90);
		return day90 <= cutoffDate;
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
		formula: 'New Hire bertahan s/d hari ke-90 ÷ Eligible New Hire (≥90 hari) × 100%',
	};

	const probationPassed = employees.filter(
		(e) => e.probation_outcome && e.probation_outcome.toLowerCase() === 'passed'
	).length;
	const probationFailed = employees.filter(
		(e) => e.probation_outcome && e.probation_outcome.toLowerCase() === 'failed'
	).length;
	const probationTotalDecided = probationPassed + probationFailed;

	const probationPassRate: MetricResult = {
		value:
			probationTotalDecided > 0
				? Number(((probationPassed / probationTotalDecided) * 100).toFixed(2))
				: null,
		numerator: probationPassed,
		denominator: probationTotalDecided,
		periodStart: 'All-time',
		periodEnd: cutoffDate,
		status: probationTotalDecided > 0 ? 'valid' : 'insufficient_data',
		formula: 'Passed ÷ (Passed + Failed) × 100%',
	};

	const deptMap = new Map<
		string,
		{
			department: string;
			activeHc: number;
			hiresYTD: number;
			exitsYTD: number;
			totalExitsAllTime: number;
		}
	>();
	employees.forEach((e) => {
		const dept = e.department || 'Unassigned';
		if (!deptMap.has(dept)) {
			deptMap.set(dept, {
				department: dept,
				activeHc: 0,
				hiresYTD: 0,
				exitsYTD: 0,
				totalExitsAllTime: 0,
			});
		}
		const item = deptMap.get(dept)!;
		if (isActiveOnDate(e, cutoffDate)) item.activeHc++;
		if (
			e.join_date &&
			e.join_date.slice(0, 10) >= yearStart &&
			e.join_date.slice(0, 10) <= cutoffDate
		)
			item.hiresYTD++;
		if (
			e.exit_date &&
			e.exit_date.slice(0, 10) >= yearStart &&
			e.exit_date.slice(0, 10) <= cutoffDate
		)
			item.exitsYTD++;
		if (e.exit_date && e.exit_date.slice(0, 10) <= cutoffDate) item.totalExitsAllTime++;
	});
	const departmentBreakdown = Array.from(deptMap.values()).sort((a, b) => b.activeHc - a.activeHc);

	const allHistoricalExits = employees.filter(
		(e) => e.exit_date && e.exit_date.slice(0, 10) <= cutoffDate
	);

	const exitReasonMap = new Map<string, number>();
	const exitTypeMap = new Map<string, number>();
	const tenureExitMap: Record<string, number> = {
		'< 90 Hari (Probation)': 0,
		'3 - 12 Bulan': 0,
		'1 - 3 Tahun': 0,
		'> 3 Tahun': 0,
	};

	allHistoricalExits.forEach((e) => {
		const reason = e.exit_reason || 'Missing / Unknown';
		const type = e.exit_type || 'Unspecified';
		exitReasonMap.set(reason, (exitReasonMap.get(reason) || 0) + 1);
		exitTypeMap.set(type, (exitTypeMap.get(type) || 0) + 1);

		if (e.join_date && e.exit_date) {
			const days =
				(new Date(e.exit_date).getTime() - new Date(e.join_date).getTime()) / (1000 * 60 * 60 * 24);
			if (days < 90) tenureExitMap['< 90 Hari (Probation)']++;
			else if (days <= 365) tenureExitMap['3 - 12 Bulan']++;
			else if (days <= 365 * 3) tenureExitMap['1 - 3 Tahun']++;
			else tenureExitMap['> 3 Tahun']++;
		}
	});

	const exitByReason = Array.from(exitReasonMap.entries()).map(([name, count]) => ({name, count}));
	const exitByType = Array.from(exitTypeMap.entries()).map(([name, count]) => ({name, count}));
	const exitByTenure = Object.entries(tenureExitMap).map(([name, count]) => ({name, count}));

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
		if ((e.status?.toLowerCase() === 'inactive' || e.exit_date) && !e.exit_reason) {
			qualityIssues.push({
				employee_id: e.employee_id,
				employee_name: e.employee_name,
				issue_type: 'Missing Exit Reason',
				description:
					'Karyawan sudah keluar (Exited), namun alasan keluar (Exit Reason) belum diisi.',
			});
		}
	});

	return {
		summary: {
			activeHeadcount,
			hiresYTD,
			exitsYTD,
			netChangeYTD,
			turnoverYTD,
			retentionYTD,
			retention90Day,
			probationPassRate,
		},
		monthlyTrend,
		departmentBreakdown,
		exitByReason,
		exitByType,
		exitByTenure,
		qualityIssues,
	};
}
