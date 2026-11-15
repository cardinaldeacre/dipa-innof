import {EmployeeRow, isActiveOnDate} from './analytics';

// Legacy v1 Row (tetap didukung sebagai fallback otomatis)
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

// Granular v2 Rows (Workbook v2 - 4 Sheet)
export interface TalentKpiRow {
	id?: string;
	employee_id: string | null;
	employee_name: string;
	kpi_period: string;
	kpi_score: number | null;
	score_status?: string | null;
	is_provisional?: boolean | null;
	notes?: string | null;
	source_file?: string | null;
	source_sheet?: string | null;
	source_row?: number | null;
	updated_at?: string;
}

export interface TalentBehaviorRow {
	id?: string;
	employee_id: string | null;
	employee_name: string;
	assessment_period: string;
	evaluator?: string | null;
	dim_1: number | null;
	dim_2: number | null;
	dim_3: number | null;
	dim_4: number | null;
	dim_5: number | null;
	dim_6: number | null;
	dim_7: number | null;
	source_overall_score?: number | null;
	score_status?: string | null;
	evidence?: string | null;
	source_file?: string | null;
	source_sheet?: string | null;
	source_row?: number | null;
	updated_at?: string;
}

export interface TalentSkillRow {
	id?: string;
	employee_id: string | null;
	employee_name: string;
	assessment_period: string;
	competency_name: string;
	is_applicable?: boolean | null;
	self_score: number | null;
	lead_score: number | null;
	final_score: number | null;
	target_score: number | null;
	one_on_one_confirmed?: boolean | null;
	calibration_status?: string | null;
	evaluator?: string | null;
	notes?: string | null;
	source_file?: string | null;
	source_sheet?: string | null;
	source_row?: number | null;
	updated_at?: string;
}

export interface EnrichedSkillCompetency {
	competency_name: string;
	is_applicable: boolean;
	self_score: number | null;
	lead_score: number | null;
	final_score: number | null;
	target_score: number | null;
	delta: number | null; // Self - Lead
	gap: number | null; // Final - Target
	normalized_score: number | null; // 0 | 40 | 70 | 85 | 100
	one_on_one_confirmed: boolean;
	status: 'Assessed' | 'Calibrated' | 'Pending Calibration' | 'Incomplete Data' | 'Not Applicable';
}

// 8 Status Data Resmi sesuai Spesifikasi Revisi 2
export type TalentDataStatus =
	| 'Complete'
	| 'Pending Assessment'
	| 'Pending Calibration'
	| 'Incomplete Data'
	| 'Not Applicable'
	| 'Not Available'
	| 'Provisional'
	| 'Needs Review';

export type BucketLevel = 'Low' | 'Medium' | 'High';

export type JobLevelType =
	| 'Intern'
	| 'Junior Staff'
	| 'Staff'
	| 'Senior Staff'
	| 'Junior Lead'
	| 'Senior Lead'
	| 'Needs Confirmation';

export type JobLevelBasis = 'Derived' | 'Confirmed by P&C' | 'Needs Confirmation';

export interface EnrichedTalentMember {
	employee_id: string;
	is_id_pending: boolean;
	employee_name: string;
	department: string;
	job_title: string;
	job_level: JobLevelType;
	job_level_basis: JobLevelBasis;
	is_intern: boolean;

	// 1. Sumbu X — Performance (KPI Kuartalan)
	kpi_raw: number | null;
	kpi_current_month: number | null; // Alias kompatibilitas
	kpi_period: string | null;
	kpi_status: TalentDataStatus | 'CONFLICT';
	kpi_is_invalid: boolean;

	// 2. Komponen Behavior (7 Dimensi Skala 1-5 -> 0-100)
	behavior_dimensions: (number | null)[];
	behavior_DimensionsFilledCount: number;
	behavior_raw_avg: number | null;
	behavior_lead_score: number | null; // Alias kompatibilitas
	behavior_normalized_100: number | null;
	behavior_method_label: '7-Dimension Average' | 'Source overall' | null;
	behavior_period: string | null;
	behavior_evaluator: string | null;
	behavior_evidence: string | null;
	behavior_status: TalentDataStatus | 'CONFLICT';

	// 3. Komponen Skill Map (Per Kompetensi L1-L4 -> Gap -> 0-100)
	skill_competencies: EnrichedSkillCompetency[];
	skill_applicable_count: number;
	skill_raw_final_avg: number | null;
	skill_map_score: number | null; // Alias kompatibilitas
	skill_normalized_100: number | null;
	skill_level: string | null;
	skill_period: string | null;
	skill_status: TalentDataStatus | 'CONFLICT';

	// 4. Sumbu Y — Capability Score & Klasifikasi 9-Box
	capability_score: number | null;
	experimental_proxy_score: number | null; // Alias kompatibilitas
	performance_bucket: BucketLevel | null;
	capability_bucket: BucketLevel | null;
	potential_proxy_bucket: BucketLevel | null; // Alias kompatibilitas
	box_key: string | null;
	box_label: string | null;

	// 5. Governance & Validation Status
	data_status: TalentDataStatus;
	has_conflict: boolean;
	missing_fields: string[];
	review_notes: string[];
}

export const TALENT_CONFIG = {
	kpiThresholds: {
		high: 100, // >= 100% = High (99 tidak dibulatkan ke 100)
		medium: 80, // 80% sampai < 100% = Medium, < 80% = Low
	},
	skillGapConversion: {
		gapMinus2OrLess: 0, // <= -2 -> 0
		gapMinus1: 40, // -1 -> 40
		gapZero: 70, // 0 -> 70
		gapPlus1: 85, // +1 -> 85
		gapPlus2OrMore: 100, // >= +2 -> 100
	},
	capabilityWeights: {
		skill: 0.6, // 60% Skill Score (0-100)
		behavior: 0.4, // 40% Behavior Score_100 (0-100)
	},
	capabilityThresholds: {
		high: 80, // 80 - 100 = High
		medium: 60, // 60 - 79.99 = Medium, 0 - 59.99 = Low
	},
	behaviorDimensionNames: [
		'1. Ownership & Accountability',
		'2. Collaboration & Communication',
		'3. Craftsmanship & Quality',
		'4. Problem Solving & Initiative',
		'5. Adaptability & Growth Mindset',
		'6. Client / User Centricity',
		'7. Leadership & Mentorship',
	],
};

const BOX_NAMES: Record<string, string> = {
	'High-High': 'Box 9: Star / Top Capability & Performance',
	'Medium-High': 'Box 8: High Capability / Strong Performer',
	'Low-High': 'Box 7: High Capability / Underperforming',
	'High-Medium': 'Box 6: High Performer / Core Specialist',
	'Medium-Medium': 'Box 5: Core Player / Solid Contributor',
	'Low-Medium': 'Box 4: Inconsistent / Needs Support',
	'High-Low': 'Box 3: High Output / Capability Gap',
	'Medium-Low': 'Box 2: Effective / Developing Capability',
	'Low-Low': 'Box 1: Underperformer / High Risk',
};

export function deriveJobLevel(
	emp: EmployeeRow & {job_level?: string | null; job_level_basis?: string | null}
): {
	job_level: JobLevelType;
	job_level_basis: JobLevelBasis;
	is_intern: boolean;
} {
	const empStatus = (emp.employee_status || '').toLowerCase();
	const empType = (emp.employment_type || '').toLowerCase();
	const title = (emp.job_title || '').trim();
	const titleLower = title.toLowerCase();

	const isIntern =
		empStatus === 'internship' ||
		empStatus.includes('intern') ||
		empType.includes('intern') ||
		titleLower.includes('intern');

	if (emp.job_level && emp.job_level_basis === 'Confirmed by P&C') {
		return {
			job_level: emp.job_level as JobLevelType,
			job_level_basis: 'Confirmed by P&C',
			is_intern: isIntern || emp.job_level === 'Intern',
		};
	}

	if (isIntern) {
		return {job_level: 'Intern', job_level_basis: 'Derived', is_intern: true};
	}
	if (/\b(junior\s+lead|jr\.?\s+lead)\b/i.test(titleLower)) {
		return {job_level: 'Junior Lead', job_level_basis: 'Derived', is_intern: false};
	}
	if (/\b(senior\s+lead|sr\.?\s+lead)\b/i.test(titleLower)) {
		return {job_level: 'Senior Lead', job_level_basis: 'Derived', is_intern: false};
	}
	if (/\blead\b/i.test(titleLower)) {
		return {
			job_level: 'Needs Confirmation',
			job_level_basis: 'Needs Confirmation',
			is_intern: false,
		};
	}
	if (/\b(junior|jr\.?)\b/i.test(titleLower)) {
		return {job_level: 'Junior Staff', job_level_basis: 'Derived', is_intern: false};
	}
	if (/\b(senior|sr\.?)\b/i.test(titleLower)) {
		return {job_level: 'Senior Staff', job_level_basis: 'Derived', is_intern: false};
	}
	return {job_level: 'Staff', job_level_basis: 'Derived', is_intern: false};
}

export function convertSkillGapToScore(gap: number): number {
	const roundedGap = Math.round(gap);
	if (roundedGap <= -2) return TALENT_CONFIG.skillGapConversion.gapMinus2OrLess;
	if (roundedGap === -1) return TALENT_CONFIG.skillGapConversion.gapMinus1;
	if (roundedGap === 0) return TALENT_CONFIG.skillGapConversion.gapZero;
	if (roundedGap === 1) return TALENT_CONFIG.skillGapConversion.gapPlus1;
	return TALENT_CONFIG.skillGapConversion.gapPlus2OrMore;
}

export function classifyPerformanceBucket(kpiScore: number | null): BucketLevel | null {
	if (kpiScore === null || isNaN(kpiScore) || kpiScore < 0 || kpiScore > 100) return null;
	if (kpiScore >= TALENT_CONFIG.kpiThresholds.high) return 'High';
	if (kpiScore >= TALENT_CONFIG.kpiThresholds.medium) return 'Medium';
	return 'Low';
}

export function classifyCapabilityBucket(capScore: number | null): BucketLevel | null {
	if (capScore === null || isNaN(capScore)) return null;
	if (capScore >= TALENT_CONFIG.capabilityThresholds.high) return 'High';
	if (capScore >= TALENT_CONFIG.capabilityThresholds.medium) return 'Medium';
	return 'Low';
}

export interface GranularTalentDataset {
	kpiRows?: TalentKpiRow[];
	behaviorRows?: TalentBehaviorRow[];
	skillRows?: TalentSkillRow[];
}

export function calculateTalentMapping(
	allEmployees: EmployeeRow[],
	legacyAssessments: TalentAssessmentRow[],
	filters: {
		cutoffDate: string;
		department?: string;
		level?: string;
		period?: string;
		includeInterns?: boolean;
	},
	granularData?: GranularTalentDataset
) {
	const {
		cutoffDate,
		department = 'ALL',
		level = 'ALL',
		period = 'ALL',
		includeInterns = true,
	} = filters;

	const kpiRows = granularData?.kpiRows || [];
	const behaviorRows = granularData?.behaviorRows || [];
	const skillRows = granularData?.skillRows || [];

	const activeEmployees = allEmployees.filter((e) => {
		if (!isActiveOnDate(e, cutoffDate)) return false;
		const {is_intern, job_level} = deriveJobLevel(e as any);
		if (!includeInterns && is_intern) return false;
		if (department !== 'ALL' && e.department !== department) return false;
		if (level !== 'ALL' && job_level !== level && (e.job_title || 'Unassigned') !== level) {
			return false;
		}
		return true;
	});

	const legacyMap = new Map<string, TalentAssessmentRow>();
	legacyAssessments.forEach((a) => legacyMap.set(a.employee_id, a));

	const normalizeName = (name: string) => name.trim().toLowerCase();

	const members: EnrichedTalentMember[] = activeEmployees.map((emp) => {
		const empId = (emp.employee_id || '').trim();
		const empNameNorm = normalizeName(emp.employee_name || '');
		const isEmpIdPending = !empId || empId.toLowerCase().includes('pending');
		const {job_level, job_level_basis, is_intern} = deriveJobLevel(emp as any);
		const legacy = legacyMap.get(empId);

		const reviewNotes: string[] = [];
		const missingFields: string[] = [];
		let hasConflict = false;
		let hasIdPendingMatch = isEmpIdPending;

		if (job_level_basis === 'Needs Confirmation') {
			reviewNotes.push('Job Level (Lead) memerlukan konfirmasi P&C (Junior/Senior Lead).');
		}

		// 1. EVALUASI KPI DATA (Sumbu X - Kuartalan YYYY-Qn)
		let matchedKpis = kpiRows.filter((r) => {
			const rId = (r.employee_id || '').trim();
			if (rId && rId === empId) return true;
			if (!rId && normalizeName(r.employee_name || '') === empNameNorm) return true;
			return false;
		});

		if (period !== 'ALL') {
			const byPeriod = matchedKpis.filter((r) => r.kpi_period === period);
			if (byPeriod.length > 0) matchedKpis = byPeriod;
		} else if (matchedKpis.length > 1) {
			const latestPeriod = [...matchedKpis].sort((a, b) =>
				(b.kpi_period || '').localeCompare(a.kpi_period || '')
			)[0].kpi_period;
			matchedKpis = matchedKpis.filter((r) => r.kpi_period === latestPeriod);
		}

		let kpiRaw: number | null = null;
		let kpiPeriod: string | null = null;
		let kpiStatus: TalentDataStatus | 'CONFLICT' = 'Not Available';
		let kpiIsInvalid = false;

		if (is_intern) {
			kpiStatus = 'Not Applicable';
		} else if (matchedKpis.length > 1) {
			hasConflict = true;
			kpiStatus = 'CONFLICT';
			kpiPeriod = matchedKpis[0].kpi_period;
			reviewNotes.push(
				`CONFLICT: Terdapat ${matchedKpis.length} baris KPI pada periode ${kpiPeriod}.`
			);
		} else if (matchedKpis.length === 1) {
			const kRec = matchedKpis[0];
			kpiPeriod = kRec.kpi_period || null;
			if (!kRec.employee_id || kRec.employee_id.trim() === '') {
				hasIdPendingMatch = true;
				reviewNotes.push('ID Pending pada baris KPI_Data (dicocokkan via Nama Lengkap).');
			}
			if (kRec.kpi_score !== null && kRec.kpi_score !== undefined) {
				const num = Number(kRec.kpi_score);
				if (num > 100 || num < 0 || isNaN(num)) {
					kpiIsInvalid = true;
					kpiRaw = num;
					kpiStatus = 'Needs Review';
					reviewNotes.push(`Nilai KPI (${num}%) tidak valid (melebihi 100% atau < 0%).`);
				} else {
					kpiRaw = num;
					kpiStatus = kRec.score_status === 'Provisional' ? 'Provisional' : 'Complete';
				}
			} else {
				kpiStatus = (kRec.score_status as TalentDataStatus) || 'Pending Assessment';
				missingFields.push('KPI Score');
			}
		} else if (
			legacy &&
			legacy.kpi_current_month !== null &&
			legacy.kpi_current_month !== undefined
		) {
			const num = Number(legacy.kpi_current_month);
			kpiPeriod = legacy.kpi_period || '2026-Q2';
			if (num > 100 || num < 0) {
				kpiIsInvalid = true;
				kpiRaw = num;
				kpiStatus = 'Needs Review';
			} else {
				kpiRaw = num;
				kpiStatus = 'Complete';
			}
		} else {
			kpiStatus = 'Not Available';
			missingFields.push('KPI Score');
		}

		// 2. EVALUASI BEHAVIOR ASSESSMENT (7 Dimensi Skala 1-5 -> 0-100)
		let matchedBeh = behaviorRows.filter((r) => {
			const rId = (r.employee_id || '').trim();
			if (rId && rId === empId) return true;
			if (!rId && normalizeName(r.employee_name || '') === empNameNorm) return true;
			return false;
		});

		if (period !== 'ALL') {
			const byPeriod = matchedBeh.filter((r) => r.assessment_period === period);
			if (byPeriod.length > 0) matchedBeh = byPeriod;
		} else if (matchedBeh.length > 1) {
			const latestPeriod = [...matchedBeh].sort((a, b) =>
				(b.assessment_period || '').localeCompare(a.assessment_period || '')
			)[0].assessment_period;
			matchedBeh = matchedBeh.filter((r) => r.assessment_period === latestPeriod);
		}

		let behDims: (number | null)[] = [null, null, null, null, null, null, null];
		let behFilledCount = 0;
		let behRawAvg: number | null = null;
		let behNorm100: number | null = null;
		let behMethodLabel: '7-Dimension Average' | 'Source overall' | null = null;
		let behPeriod: string | null = null;
		let behEvaluator: string | null = null;
		let behEvidence: string | null = null;
		let behStatus: TalentDataStatus | 'CONFLICT' = 'Not Available';

		if (matchedBeh.length > 1) {
			hasConflict = true;
			behStatus = 'CONFLICT';
			behPeriod = matchedBeh[0].assessment_period;
			reviewNotes.push(
				`CONFLICT: Terdapat ${matchedBeh.length} baris Behavior pada periode ${behPeriod}.`
			);
		} else if (matchedBeh.length === 1) {
			const bRec = matchedBeh[0];
			behPeriod = bRec.assessment_period || '2026';
			behEvaluator = bRec.evaluator || null;
			behEvidence = bRec.evidence || null;

			if (!bRec.employee_id || bRec.employee_id.trim() === '') {
				hasIdPendingMatch = true;
				reviewNotes.push(
					'ID Pending pada baris Behavior_Assessment (dicocokkan via Nama Lengkap).'
				);
			}

			behDims = [
				bRec.dim_1 !== null && bRec.dim_1 !== undefined ? Number(bRec.dim_1) : null,
				bRec.dim_2 !== null && bRec.dim_2 !== undefined ? Number(bRec.dim_2) : null,
				bRec.dim_3 !== null && bRec.dim_3 !== undefined ? Number(bRec.dim_3) : null,
				bRec.dim_4 !== null && bRec.dim_4 !== undefined ? Number(bRec.dim_4) : null,
				bRec.dim_5 !== null && bRec.dim_5 !== undefined ? Number(bRec.dim_5) : null,
				bRec.dim_6 !== null && bRec.dim_6 !== undefined ? Number(bRec.dim_6) : null,
				bRec.dim_7 !== null && bRec.dim_7 !== undefined ? Number(bRec.dim_7) : null,
			];
			const validDims = behDims.filter((d): d is number => d !== null && !isNaN(d));
			behFilledCount = validDims.length;

			if (behFilledCount === 7) {
				const sum = validDims.reduce((acc, v) => acc + v, 0);
				const avg = sum / 7;
				behRawAvg = Number(avg.toFixed(2));
				behNorm100 = Number(((behRawAvg / 5) * 100).toFixed(2));
				behMethodLabel = '7-Dimension Average';
				behStatus = 'Complete';
			} else if (behFilledCount > 0 && behFilledCount < 7) {
				behStatus = 'Incomplete Data';
				missingFields.push(`Behavior (${behFilledCount}/7 dimensi)`);
				reviewNotes.push(
					`Behavior Assessment baru terisi ${behFilledCount}/7 dimensi (wajib 7 dimensi lengkap).`
				);
			} else if (bRec.source_overall_score !== null && bRec.source_overall_score !== undefined) {
				const overall = Number(bRec.source_overall_score);
				behRawAvg = Number(overall.toFixed(2));
				behNorm100 = Number(((behRawAvg / 5) * 100).toFixed(2));
				behMethodLabel = 'Source overall';
				behStatus = 'Complete';
			} else {
				behStatus = 'Pending Assessment';
				missingFields.push('Behavior Assessment');
			}
		} else if (
			legacy &&
			legacy.behavior_lead_score !== null &&
			legacy.behavior_lead_score !== undefined
		) {
			const overall = Number(legacy.behavior_lead_score);
			behRawAvg = Number(overall.toFixed(2));
			behNorm100 = Number(((behRawAvg / 5) * 100).toFixed(2));
			behMethodLabel = 'Source overall';
			behPeriod = legacy.behavior_period || '2026';
			behEvaluator = legacy.behavior_evaluator || null;
			behStatus = 'Complete';
		} else {
			behStatus = 'Pending Assessment';
			missingFields.push('Behavior Assessment');
		}

		// 3. EVALUASI SKILL MAP DATA (Granular Kompetensi L1-L4 -> Gap -> 0-100)
		let matchedSkills = skillRows.filter((r) => {
			const rId = (r.employee_id || '').trim();
			if (rId && rId === empId) return true;
			if (!rId && normalizeName(r.employee_name || '') === empNameNorm) return true;
			return false;
		});

		if (period !== 'ALL') {
			const byPeriod = matchedSkills.filter((r) => r.assessment_period === period);
			if (byPeriod.length > 0) matchedSkills = byPeriod;
		} else if (matchedSkills.length > 0) {
			const latestPeriod = [...matchedSkills].sort((a, b) =>
				(b.assessment_period || '').localeCompare(a.assessment_period || '')
			)[0].assessment_period;
			matchedSkills = matchedSkills.filter((r) => r.assessment_period === latestPeriod);
		}

		let enrichedSkills: EnrichedSkillCompetency[] = [];
		let skillApplicableCount = 0;
		let skillRawFinalAvg: number | null = null;
		let skillNorm100: number | null = null;
		let skillPeriod: string | null = null;
		let skillStatus: TalentDataStatus | 'CONFLICT' = 'Not Available';

		if (matchedSkills.length > 0) {
			skillPeriod = matchedSkills[0].assessment_period || '2026';
			const seenCompetencies = new Set<string>();
			let duplicateCompetency = false;

			enrichedSkills = matchedSkills.map((s) => {
				if (!s.employee_id || s.employee_id.trim() === '') {
					hasIdPendingMatch = true;
				}
				const compKey = (s.competency_name || '').trim().toLowerCase();
				if (seenCompetencies.has(compKey)) duplicateCompetency = true;
				seenCompetencies.add(compKey);

				const isApp = s.is_applicable !== false && s.calibration_status !== 'Not Applicable';
				const self =
					s.self_score !== null && s.self_score !== undefined ? Number(s.self_score) : null;
				const lead =
					s.lead_score !== null && s.lead_score !== undefined ? Number(s.lead_score) : null;
				const final =
					s.final_score !== null && s.final_score !== undefined ? Number(s.final_score) : null;
				const target =
					s.target_score !== null && s.target_score !== undefined ? Number(s.target_score) : null;

				const delta = self !== null && lead !== null ? Number((self - lead).toFixed(2)) : null;
				const gap = final !== null && target !== null ? Number((final - target).toFixed(2)) : null;
				const confirmed = Boolean(s.one_on_one_confirmed);

				if (!isApp) {
					return {
						competency_name: s.competency_name,
						is_applicable: false,
						self_score: self,
						lead_score: lead,
						final_score: final,
						target_score: target,
						delta,
						gap,
						normalized_score: null,
						one_on_one_confirmed: confirmed,
						status: 'Not Applicable',
					};
				}

				const needsCalibration =
					(delta !== null && Math.abs(delta) >= 2 && !confirmed) ||
					s.calibration_status === 'Pending Calibration';

				if (needsCalibration) {
					return {
						competency_name: s.competency_name,
						is_applicable: true,
						self_score: self,
						lead_score: lead,
						final_score: final,
						target_score: target,
						delta,
						gap,
						normalized_score: null,
						one_on_one_confirmed: confirmed,
						status: 'Pending Calibration',
					};
				}

				if (final === null || target === null || gap === null) {
					return {
						competency_name: s.competency_name,
						is_applicable: true,
						self_score: self,
						lead_score: lead,
						final_score: final,
						target_score: target,
						delta,
						gap,
						normalized_score: null,
						one_on_one_confirmed: confirmed,
						status: 'Incomplete Data',
					};
				}

				return {
					competency_name: s.competency_name,
					is_applicable: true,
					self_score: self,
					lead_score: lead,
					final_score: final,
					target_score: target,
					delta,
					gap,
					normalized_score: convertSkillGapToScore(gap),
					one_on_one_confirmed: confirmed,
					status: confirmed || (delta !== null && Math.abs(delta) >= 2) ? 'Calibrated' : 'Assessed',
				};
			});

			if (duplicateCompetency) {
				hasConflict = true;
				skillStatus = 'CONFLICT';
				reviewNotes.push(
					'CONFLICT: Terdapat kompetensi duplikat pada periode Skill Map yang sama.'
				);
			} else {
				const applicableList = enrichedSkills.filter((c) => c.is_applicable);
				skillApplicableCount = applicableList.length;

				const hasPendingCal = applicableList.some((c) => c.status === 'Pending Calibration');
				const hasIncomplete = applicableList.some((c) => c.status === 'Incomplete Data');

				if (applicableList.length === 0) {
					skillStatus = 'Not Applicable';
				} else if (hasPendingCal) {
					skillStatus = 'Pending Calibration';
					missingFields.push('Skill Calibration (|Delta| >= 2)');
					reviewNotes.push(
						'Terdapat kompetensi dengan |Self - Lead| >= 2 yang belum dikonfirmasi 1-on-1 (Pending Calibration).'
					);
				} else if (hasIncomplete) {
					skillStatus = 'Incomplete Data';
					missingFields.push('Skill Final/Target Score');
					reviewNotes.push(
						'Terdapat kompetensi applicable yang belum memiliki Final atau Target Score.'
					);
				} else {
					const normSum = applicableList.reduce((acc, c) => acc + (c.normalized_score || 0), 0);
					const rawSum = applicableList.reduce((acc, c) => acc + (c.final_score || 0), 0);
					skillNorm100 = Number((normSum / applicableList.length).toFixed(2));
					skillRawFinalAvg = Number((rawSum / applicableList.length).toFixed(2));
					skillStatus = 'Complete';
				}
			}
		} else if (legacy && legacy.skill_map_score !== null && legacy.skill_map_score !== undefined) {
			const raw = Number(legacy.skill_map_score);
			skillRawFinalAvg = Number(raw.toFixed(2));
			skillNorm100 = Number(((raw / 5) * 100).toFixed(2));
			skillPeriod = legacy.skill_period || '2026';
			skillStatus = 'Complete';
		} else {
			skillStatus = 'Not Available';
			missingFields.push('Skill Map');
		}

		// 4. PENENTUAN 8 STATUS DATA RESMI & SKOR CAPABILITY / 9-BOX
		let overallStatus: TalentDataStatus = 'Complete';

		if (
			hasConflict ||
			kpiIsInvalid ||
			hasIdPendingMatch ||
			job_level_basis === 'Needs Confirmation'
		) {
			overallStatus = 'Needs Review';
		} else if (is_intern && skillStatus === 'Not Available') {
			overallStatus = 'Not Applicable';
		} else if (
			(kpiStatus === 'Not Available' || is_intern) &&
			behStatus === 'Pending Assessment' &&
			skillStatus === 'Not Available'
		) {
			overallStatus = 'Not Available';
		} else if (skillStatus === 'Pending Calibration') {
			overallStatus = 'Pending Calibration';
		} else if (behStatus === 'Incomplete Data' || skillStatus === 'Incomplete Data') {
			overallStatus = 'Incomplete Data';
		} else if (
			behStatus === 'Pending Assessment' ||
			(!is_intern && kpiStatus === 'Pending Assessment') ||
			(!is_intern && kpiStatus === 'Not Available') ||
			skillStatus === 'Not Available'
		) {
			overallStatus = 'Pending Assessment';
		} else if (is_intern) {
			overallStatus = 'Not Applicable';
		} else if (kpiStatus === 'Provisional') {
			overallStatus = 'Provisional';
		} else {
			overallStatus = 'Complete';
		}

		const perfBucket: BucketLevel | null =
			!is_intern && !hasConflict && !hasIdPendingMatch && !kpiIsInvalid
				? classifyPerformanceBucket(kpiRaw)
				: null;

		let capabilityScore: number | null = null;
		let capBucket: BucketLevel | null = null;

		if (
			!hasConflict &&
			!hasIdPendingMatch &&
			skillNorm100 !== null &&
			behNorm100 !== null &&
			skillStatus === 'Complete' &&
			behStatus === 'Complete'
		) {
			capabilityScore = Number(
				(
					skillNorm100 * TALENT_CONFIG.capabilityWeights.skill +
					behNorm100 * TALENT_CONFIG.capabilityWeights.behavior
				).toFixed(2)
			);
			capBucket = classifyCapabilityBucket(capabilityScore);
		}

		const canPlotNineBox =
			(overallStatus === 'Complete' || overallStatus === 'Provisional') &&
			perfBucket !== null &&
			capBucket !== null;

		const boxKey = canPlotNineBox ? `${perfBucket}-${capBucket}` : null;

		return {
			employee_id: emp.employee_id,
			is_id_pending: hasIdPendingMatch,
			employee_name: emp.employee_name,
			department: emp.department || 'Unassigned',
			job_title: emp.job_title || 'Unassigned',
			job_level,
			job_level_basis,
			is_intern,

			kpi_raw: kpiRaw,
			kpi_current_month: kpiRaw,
			kpi_period: kpiPeriod,
			kpi_status: kpiStatus,
			kpi_is_invalid: kpiIsInvalid,

			behavior_dimensions: behDims,
			behavior_DimensionsFilledCount: behFilledCount,
			behavior_raw_avg: behRawAvg,
			behavior_lead_score: behRawAvg,
			behavior_normalized_100: behNorm100,
			behavior_method_label: behMethodLabel,
			behavior_period: behPeriod,
			behavior_evaluator: behEvaluator,
			behavior_evidence: behEvidence,
			behavior_status: behStatus,

			skill_competencies: enrichedSkills,
			skill_applicable_count: skillApplicableCount,
			skill_raw_final_avg: skillRawFinalAvg,
			skill_map_score: skillNorm100,
			skill_normalized_100: skillNorm100,
			skill_level: job_level,
			skill_period: skillPeriod,
			skill_status: skillStatus,

			capability_score: capabilityScore,
			experimental_proxy_score: capabilityScore,
			performance_bucket: perfBucket,
			capability_bucket: capBucket,
			potential_proxy_bucket: capBucket,
			box_key: boxKey,
			box_label: boxKey ? BOX_NAMES[boxKey] : null,

			data_status: overallStatus,
			has_conflict: hasConflict,
			missing_fields: missingFields,
			review_notes: reviewNotes,
		};
	});

	const totalMembers = members.length;
	const kpiEligibleDenominator = members.filter((m) => !m.is_intern).length;
	const kpiAvailable = members.filter(
		(m) => !m.is_intern && m.kpi_raw !== null && !m.kpi_is_invalid
	).length;
	const internExcludedFromKpiCount = members.filter((m) => m.is_intern).length;

	const behaviorAssessed = members.filter((m) => m.behavior_normalized_100 !== null).length;
	const pendingBehaviorCount = totalMembers - behaviorAssessed;

	const skillAvailable = members.filter((m) => m.skill_normalized_100 !== null).length;
	const pendingCalibrationCount = members.filter(
		(m) => m.data_status === 'Pending Calibration'
	).length;
	const needsReviewCount = members.filter((m) => m.data_status === 'Needs Review').length;

	const completeCount = members.filter(
		(m) => m.data_status === 'Complete' || m.data_status === 'Provisional'
	).length;

	const pct = (num: number, denom: number) =>
		denom > 0 ? Number(((num / denom) * 100).toFixed(1)) : 0;

	const gridCells = [
		{perf: 'Low', pot: 'High', title: 'Box 7: High Capability / Low Perf', color: 'amber'},
		{perf: 'Medium', pot: 'High', title: 'Box 8: High Capability / Med Perf', color: 'emerald'},
		{perf: 'High', pot: 'High', title: 'Box 9: Star / Top Talent', color: 'emerald'},
		{perf: 'Low', pot: 'Medium', title: 'Box 4: Inconsistent / Dilemma', color: 'amber'},
		{perf: 'Medium', pot: 'Medium', title: 'Box 5: Core Player', color: 'blue'},
		{perf: 'High', pot: 'Medium', title: 'Box 6: High Performer', color: 'emerald'},
		{perf: 'Low', pot: 'Low', title: 'Box 1: Underperformer / Risk', color: 'red'},
		{perf: 'Medium', pot: 'Low', title: 'Box 2: Effective / Developing', color: 'blue'},
		{perf: 'High', pot: 'Low', title: 'Box 3: Solid Specialist', color: 'blue'},
	].map((cell) => {
		const matched = members.filter(
			(m) =>
				(m.data_status === 'Complete' || m.data_status === 'Provisional') &&
				m.performance_bucket === cell.perf &&
				m.capability_bucket === cell.pot
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
			kpiEligibleDenominator,
			internExcludedFromKpiCount,
			kpiAvailable,
			kpiCoveragePct: pct(kpiAvailable, kpiEligibleDenominator),
			behaviorAssessed,
			behaviorCoveragePct: pct(behaviorAssessed, totalMembers),
			pendingBehaviorCount,
			skillAvailable,
			skillCoveragePct: pct(skillAvailable, totalMembers),
			pendingCalibrationCount,
			needsReviewCount,
			completeCount,
			completenessPct: pct(completeCount, kpiEligibleDenominator || totalMembers),
		},
		members,
		gridCells,
	};
}
