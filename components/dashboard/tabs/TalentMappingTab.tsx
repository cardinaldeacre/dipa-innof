'use client';

import {useState, useMemo} from 'react';
import {Lock, CheckCircle2} from 'lucide-react';
import {EmployeeRow} from '@/lib/engine/analytics';
import {
	TalentAssessmentRow,
	TalentKpiRow,
	TalentBehaviorRow,
	TalentSkillRow,
	calculateTalentMapping,
	EnrichedTalentMember,
} from '@/lib/engine/talentMapping';
import {
	saveTalentAssessmentAction,
	togglePcValidationApprovalAction,
} from '@/app/admin/talent/actions';
import TalentOverviewCards from './talent/TalentOverviewCards';
import NineBoxMatrix from './talent/NineBoxMatrix';
import TalentMemberTable from './talent/TalentMemberTable';
import TalentModals from './talent/TalentModals';

interface Props {
	employees: EmployeeRow[];
	assessments: TalentAssessmentRow[];
	kpiRows?: TalentKpiRow[];
	behaviorRows?: TalentBehaviorRow[];
	skillRows?: TalentSkillRow[];
	initialValidationApproved?: boolean;
	userEmail?: string;
	cutoffDate: string;
	selectedDept: string;
	includeInterns: boolean;
	isHrAdmin: boolean;
}

export default function TalentMappingTab({
	employees,
	assessments,
	kpiRows = [],
	behaviorRows = [],
	skillRows = [],
	initialValidationApproved = false,
	userEmail = '',
	cutoffDate,
	selectedDept,
	includeInterns,
	isHrAdmin,
}: Props) {
	const [validationApproved, setValidationApproved] = useState<boolean>(initialValidationApproved);
	const [togglingGate, setTogglingGate] = useState<boolean>(false);
	const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
	const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
	const [statusFilter, setStatusFilter] = useState<string>('ALL');
	const [selectedBoxKey, setSelectedBoxKey] = useState<string | null>(null);
	const [search, setSearch] = useState<string>('');

	const [detailMember, setDetailMember] = useState<EnrichedTalentMember | null>(null);
	const [editingMember, setEditingMember] = useState<EnrichedTalentMember | null>(null);
	const [saving, setSaving] = useState(false);
	const [feedback, setFeedback] = useState<{success: boolean; message: string} | null>(null);

	const talentData = useMemo(() => {
		return calculateTalentMapping(
			employees,
			assessments,
			{
				cutoffDate,
				department: selectedDept,
				level: selectedLevel,
				period: selectedPeriod,
				includeInterns,
			},
			{kpiRows, behaviorRows, skillRows}
		);
	}, [
		employees,
		assessments,
		kpiRows,
		behaviorRows,
		skillRows,
		cutoffDate,
		selectedDept,
		selectedLevel,
		selectedPeriod,
		includeInterns,
	]);

	const levels = useMemo(() => {
		return [
			'ALL',
			'Intern',
			'Junior Staff',
			'Staff',
			'Senior Staff',
			'Junior Lead',
			'Senior Lead',
			'Needs Confirmation',
		];
	}, []);

	const periods = useMemo(() => {
		const s = new Set<string>();
		kpiRows.forEach((r) => r.kpi_period && s.add(r.kpi_period));
		behaviorRows.forEach((r) => r.assessment_period && s.add(r.assessment_period));
		skillRows.forEach((r) => r.assessment_period && s.add(r.assessment_period));
		assessments.forEach((a) => {
			if (a.kpi_period) s.add(a.kpi_period);
			if (a.behavior_period) s.add(a.behavior_period);
			if (a.skill_period) s.add(a.skill_period);
		});
		return ['ALL', ...Array.from(s).sort()];
	}, [kpiRows, behaviorRows, skillRows, assessments]);

	const filteredMembers = useMemo(() => {
		return talentData.members.filter((m) => {
			if (statusFilter !== 'ALL' && m.data_status !== statusFilter) return false;
			if (selectedBoxKey && m.box_key !== selectedBoxKey) return false;
			if (search.trim().length >= 2) {
				const q = search.toLowerCase();
				return (
					m.employee_name.toLowerCase().includes(q) ||
					m.employee_id.toLowerCase().includes(q) ||
					m.department.toLowerCase().includes(q) ||
					m.job_level.toLowerCase().includes(q)
				);
			}
			return true;
		});
	}, [talentData.members, statusFilter, selectedBoxKey, search]);

	const handleToggleValidationGate = async (checked: boolean) => {
		setTogglingGate(true);
		setValidationApproved(checked);
		if (!checked) setSelectedBoxKey(null);
		await togglePcValidationApprovalAction(checked, userEmail);
		setTogglingGate(false);
	};

	const handleExportTalentCSV = () => {
		const headers = [
			'Employee ID',
			'Employee Name',
			'Department',
			'Job Title',
			'Job Level',
			'Job Level Basis',
			'KPI Raw (%)',
			'KPI Period',
			'Performance Bucket',
			'Behavior Raw (1-5)',
			'Behavior Normalized (0-100)',
			'Behavior Period',
			'Behavior Evaluator',
			'Skill Raw Avg (1-4)',
			'Skill Normalized (0-100)',
			'Skill Period',
			'Capability Score (60S+40B)',
			'Capability Bucket',
			'Official Data Status',
			'Indicative 9-Box',
		];
		const rows = filteredMembers.map((m) => [
			m.employee_id,
			`"${m.employee_name}"`,
			`"${m.department}"`,
			`"${m.job_title}"`,
			m.job_level,
			m.job_level_basis,
			m.is_intern ? 'Not Applicable' : m.kpi_raw !== null ? `${m.kpi_raw}%` : 'N/A',
			m.kpi_period || 'N/A',
			m.performance_bucket || 'N/A',
			m.behavior_raw_avg !== null ? m.behavior_raw_avg : 'Pending Assessment',
			m.behavior_normalized_100 !== null ? m.behavior_normalized_100 : 'N/A',
			m.behavior_period || 'N/A',
			`"${m.behavior_evaluator || 'N/A'}"`,
			m.skill_raw_final_avg !== null ? m.skill_raw_final_avg : 'N/A',
			m.skill_normalized_100 !== null ? m.skill_normalized_100 : 'N/A',
			m.skill_period || 'N/A',
			validationApproved && m.capability_score !== null ? m.capability_score : 'Locked / N/A',
			validationApproved && m.capability_bucket ? m.capability_bucket : 'Locked / N/A',
			m.data_status,
			validationApproved && m.box_label ? `"${m.box_label} (Indicative)"` : 'Not Classified',
		]);
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			[headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const link = document.createElement('a');
		link.setAttribute('href', encodeURI(csvContent));
		link.setAttribute('download', `Dipa_Talent_Mapping_Rev2_${cutoffDate}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleSaveManual = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSaving(true);
		setFeedback(null);
		const res = await saveTalentAssessmentAction(new FormData(e.currentTarget));
		setFeedback(res);
		setSaving(false);
		if (res.success) setTimeout(() => setEditingMember(null), 800);
	};

	return (
		<div className="space-y-6">
			<div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-wrap items-center justify-between gap-4">
				<div className="space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-600 text-white">
							Pilot 2026 — Revisi 2
						</span>
						<h3 className="text-sm font-bold text-gray-900 dark:text-white">
							Talent Mapping (HAV / 9-Box) — Evidence-Based Capability & Performance
						</h3>
					</div>
					<p className="text-xs text-gray-600 dark:text-gray-300">
						<b>Sumbu X:</b> KPI Kuartalan (Low &lt;80, Med 80–&lt;100, High 100) •{' '}
						<b>Sumbu Y (Capability):</b> 60% Skill (Gap Konversi) + 40% Behavior (7 Dimensi).{' '}
						<i>Build from available evidence.</i>
					</p>
				</div>

				<div className="flex items-center gap-3">
					<label
						className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-sm text-xs font-bold transition-all ${
							validationApproved
								? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
								: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200'
						} ${isHrAdmin ? 'cursor-pointer' : 'opacity-80 cursor-not-allowed'}`}>
						<input
							type="checkbox"
							disabled={!isHrAdmin || togglingGate}
							checked={validationApproved}
							onChange={(e) => handleToggleValidationGate(e.target.checked)}
							className="rounded text-emerald-600 focus:ring-0"
						/>
						{validationApproved ? (
							<CheckCircle2 className="w-4 h-4 text-emerald-500" />
						) : (
							<Lock className="w-4 h-4 text-amber-500" />
						)}
						<span>P&C Validation Approved (Activate Scoring)</span>
					</label>
				</div>
			</div>

			<TalentOverviewCards overview={talentData.overview} />

			<NineBoxMatrix
				experimentalMode={validationApproved}
				completeCount={talentData.overview.completeCount}
				gridCells={talentData.gridCells}
				selectedBoxKey={selectedBoxKey}
				setSelectedBoxKey={setSelectedBoxKey}
			/>

			<TalentMemberTable
				members={filteredMembers}
				levels={levels}
				periods={periods}
				selectedLevel={selectedLevel}
				setSelectedLevel={setSelectedLevel}
				selectedPeriod={selectedPeriod}
				setSelectedPeriod={setSelectedPeriod}
				statusFilter={statusFilter}
				setStatusFilter={setStatusFilter}
				search={search}
				setSearch={setSearch}
				experimentalMode={validationApproved}
				isHrAdmin={isHrAdmin}
				onExportCSV={handleExportTalentCSV}
				onViewDetail={setDetailMember}
				onEditMember={(m) => {
					setFeedback(null);
					setEditingMember(m);
				}}
			/>

			<TalentModals
				detailMember={detailMember}
				setDetailMember={setDetailMember}
				editingMember={editingMember}
				setEditingMember={setEditingMember}
				onSaveManual={handleSaveManual}
				saving={saving}
				feedback={feedback}
			/>
		</div>
	);
}
