import {EmployeeRow, isActiveOnDate} from './analytics';

export interface TalentAssessmentRow {
	employee_id: string;
	kpi_current_month: number | null;
	kpi_period: string | null;
	behavior_lead_score: number | null;
	behavior_period: string | null;
	behavior_evaluator: string | null;
	skill_map_score: number | null;
	skill_level: string | null;
	skill_period: string | null;
	updated_at?: string;
}

export type TalentDataStatus = 'Complete' | 'Pending Assessment' | 'Not Available';

export interface EnrichedTalentMember {
	employee_id: string;
	employee_name: string;
	department: string;
	job_title: string;
	kpi_current_month: number | null;
	kpi_period: string | null;
	behavior_lead_score: number | null;
	behavior_period: string | null;
	behavior_evaluator: string | null;
	skill_map_score: number | null;
	skill_level: string | null;
	skill_period: string | null;
	data_status: TalentDataStatus;
	missing_fields: string[];
	experimental_proxy_score: number | null; // 60% Behavior + 40% Skill
	performance_bucket: 'Low' | 'Moderate' | 'High' | null;
	potential_proxy_bucket: 'Low' | 'Moderate' | 'High' | null;
	box_label: string | null;
}

export const TALENT_CONFIG = {
	kpiThresholds: {
		high: 85, // >= 85% = High Performance
		moderate: 70, // 70% - 84.9% = Moderate, < 70% = Low
	},
	scoreThresholds: {
		high: 4.0, // >= 4.0 (Skala 1-5) = High
		moderate: 3.0, // 3.0 - 3.99 = Moderate, < 3.0 = Low
	},
	experimentalWeights: {
		behavior: 0.6, // 60% Behavior Lead Score
		skill: 0.4, // 40% Skill Map Score
	},
};

const BOX_NAMES: Record<string, string> = {
	'High-High': 'Box 9: Star / Top Talent',
	'Moderate-High': 'Box 8: High Potential',
	'Low-High': 'Box 7: Enigma / Unproven',
	'High-Moderate': 'Box 6: High Performer',
	'Moderate-Moderate': 'Box 5: Core Player',
	'Low-Moderate': 'Box 4: Dilemma / Inconsistent',
	'High-Low': 'Box 3: Solid Professional',
	'Moderate-Low': 'Box 2: Effective / Specialist',
	'Low-Low': 'Box 1: Underperformer / Risk',
};

export function calculateTalentMapping(
	allEmployees: EmployeeRow[],
	assessments: TalentAssessmentRow[],
	filters: {
		cutoffDate: string;
		department?: string;
		level?: string;
		period?: string;
		includeInterns?: boolean;
	}
) {
	const {
		cutoffDate,
		department = 'ALL',
		level = 'ALL',
		period = 'ALL',
		includeInterns = true,
	} = filters;

	const activeEmployees = allEmployees.filter((e) => {
		if (!isActiveOnDate(e, cutoffDate)) return false;
		if (!includeInterns) {
			const isIntern =
				e.employment_type?.toLowerCase().includes('intern') ||
				e.employee_status?.toLowerCase().includes('intern');
			if (isIntern) return false;
		}
		if (department !== 'ALL' && e.department !== department) return false;
		if (level !== 'ALL' && (e.job_title || 'Unassigned') !== level) return false;
		return true;
	});

	const assessmentMap = new Map<string, TalentAssessmentRow>();
	assessments.forEach((a) => assessmentMap.set(a.employee_id, a));

	let members: EnrichedTalentMember[] = activeEmployees.map((emp) => {
		const rec = assessmentMap.get(emp.employee_id);

		const kpi =
			rec?.kpi_current_month !== undefined && rec?.kpi_current_month !== null
				? Number(rec.kpi_current_month)
				: null;
		const beh =
			rec?.behavior_lead_score !== undefined && rec?.behavior_lead_score !== null
				? Number(rec.behavior_lead_score)
				: null;
		const skill =
			rec?.skill_map_score !== undefined && rec?.skill_map_score !== null
				? Number(rec.skill_map_score)
				: null;

		const missing: string[] = [];
		if (kpi === null) missing.push('Current-Month KPI');
		if (beh === null) missing.push('Behavior Lead Score');
		if (skill === null) missing.push('Skill Map');

		// - Complete: Ketiganya tersedia
		// - Pending Assessment: Behavior belum diisi Lead (atau baru sebagian yang terisi)
		// - Not Available: Sama sekali belum ada data
		let status: TalentDataStatus = 'Complete';
		if (kpi === null && beh === null && skill === null) {
			status = 'Not Available';
		} else if (missing.length > 0) {
			status = 'Pending Assessment';
		}

		// Klasifikasi Sumbu X (Current-Month KPI Snapshot: 1-100%)
		let perfBucket: 'Low' | 'Moderate' | 'High' | null = null;
		if (kpi !== null) {
			if (kpi >= TALENT_CONFIG.kpiThresholds.high) perfBucket = 'High';
			else if (kpi >= TALENT_CONFIG.kpiThresholds.moderate) perfBucket = 'Moderate';
			else perfBucket = 'Low';
		}

		let proxyScore: number | null = null;
		let potBucket: 'Low' | 'Moderate' | 'High' | null = null;

		if (beh !== null && skill !== null) {
			proxyScore = Number(
				(
					beh * TALENT_CONFIG.experimentalWeights.behavior +
					skill * TALENT_CONFIG.experimentalWeights.skill
				).toFixed(2)
			);
			if (proxyScore >= TALENT_CONFIG.scoreThresholds.high) potBucket = 'High';
			else if (proxyScore >= TALENT_CONFIG.scoreThresholds.moderate) potBucket = 'Moderate';
			else potBucket = 'Low';
		}

		const boxKey = perfBucket && potBucket ? `${perfBucket}-${potBucket}` : null;

		return {
			employee_id: emp.employee_id,
			employee_name: emp.employee_name,
			department: emp.department || 'Unassigned',
			job_title: emp.job_title || 'Unassigned',
			kpi_current_month: kpi,
			kpi_period: rec?.kpi_period || null,
			behavior_lead_score: beh,
			behavior_period: rec?.behavior_period || null,
			behavior_evaluator: rec?.behavior_evaluator || null,
			skill_map_score: skill,
			skill_level: rec?.skill_level || emp.job_title || null,
			skill_period: rec?.skill_period || null,
			data_status: status,
			missing_fields: missing,
			experimental_proxy_score: proxyScore,
			performance_bucket: perfBucket,
			potential_proxy_bucket: potBucket,
			box_label: boxKey ? BOX_NAMES[boxKey] : null,
		};
	});

	if (period !== 'ALL') {
		members = members.filter(
			(m) => m.kpi_period === period || m.behavior_period === period || m.skill_period === period
		);
	}

	const totalMembers = members.length;
	const kpiAvailable = members.filter((m) => m.kpi_current_month !== null).length;
	const behaviorAssessed = members.filter((m) => m.behavior_lead_score !== null).length;
	const skillAvailable = members.filter((m) => m.skill_map_score !== null).length;
	const completeCount = members.filter((m) => m.data_status === 'Complete').length;
	const pendingBehaviorCount = totalMembers - behaviorAssessed;

	const pct = (num: number) =>
		totalMembers > 0 ? Number(((num / totalMembers) * 100).toFixed(1)) : 0;

	const gridCells = [
		{perf: 'Low', pot: 'High', title: 'Box 7: Enigma / Unproven', color: 'amber'},
		{perf: 'Moderate', pot: 'High', title: 'Box 8: High Potential', color: 'emerald'},
		{perf: 'High', pot: 'High', title: 'Box 9: Star / Top Talent', color: 'emerald'},
		{perf: 'Low', pot: 'Moderate', title: 'Box 4: Dilemma / Inconsistent', color: 'amber'},
		{perf: 'Moderate', pot: 'Moderate', title: 'Box 5: Core Player', color: 'blue'},
		{perf: 'High', pot: 'Moderate', title: 'Box 6: High Performer', color: 'emerald'},
		{perf: 'Low', pot: 'Low', title: 'Box 1: Underperformer / Risk', color: 'red'},
		{perf: 'Moderate', pot: 'Low', title: 'Box 2: Effective / Specialist', color: 'blue'},
		{perf: 'High', pot: 'Low', title: 'Box 3: Solid Professional', color: 'blue'},
	].map((cell) => {
		const matched = members.filter(
			(m) =>
				m.data_status === 'Complete' &&
				m.performance_bucket === cell.perf &&
				m.potential_proxy_bucket === cell.pot
		);
		return {
			...cell,
			key: `${cell.perf}-${cell.pot}`,
			count: matched.length,
			percentage:
				completeCount > 0 ? Number(((matched.length / completeCount) * 100).toFixed(1)) : 0,
			members: matched,
		};
	});

	return {
		overview: {
			totalMembers,
			kpiAvailable,
			kpiCoveragePct: pct(kpiAvailable),
			behaviorAssessed,
			behaviorCoveragePct: pct(behaviorAssessed),
			pendingBehaviorCount,
			skillAvailable,
			skillCoveragePct: pct(skillAvailable),
			completeCount,
			completenessPct: pct(completeCount),
		},
		members,
		gridCells,
	};
}
