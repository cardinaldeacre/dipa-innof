'use client';

import {useState, useMemo} from 'react';
import {FlaskConical} from 'lucide-react';
import {EmployeeRow} from '@/lib/engine/analytics';
import {
	TalentAssessmentRow,
	calculateTalentMapping,
	EnrichedTalentMember,
} from '@/lib/engine/talentMapping';
import {saveTalentAssessmentAction} from '@/app/admin/talent/actions';
import TalentOverviewCards from './talent/TalentOverviewCards';
import NineBoxMatrix from './talent/NineBoxMatrix';
import TalentMemberTable from './talent/TalentMemberTable';
import TalentModals from './talent/TalentModals';

interface Props {
	employees: EmployeeRow[];
	assessments: TalentAssessmentRow[];
	cutoffDate: string;
	selectedDept: string;
	includeInterns: boolean;
	isHrAdmin: boolean;
}

export default function TalentMappingTab({
	employees,
	assessments,
	cutoffDate,
	selectedDept,
	includeInterns,
	isHrAdmin,
}: Props) {
	const [experimentalMode, setExperimentalMode] = useState<boolean>(true);
	const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
	const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
	const [statusFilter, setStatusFilter] = useState<string>('ALL');
	const [selectedBoxKey, setSelectedBoxKey] = useState<string | null>(null);
	const [search, setSearch] = useState<string>('');

	const [detailMember, setDetailMember] = useState<EnrichedTalentMember | null>(null);
	const [editingMember, setEditingMember] = useState<EnrichedTalentMember | null>(null);
	const [saving, setSaving] = useState(false);
	const [feedback, setFeedback] = useState<{success: boolean; message: string} | null>(null);

	const levels = useMemo(() => {
		const s = new Set(employees.map((e) => e.job_title).filter(Boolean) as string[]);
		return ['ALL', ...Array.from(s).sort()];
	}, [employees]);

	const periods = useMemo(() => {
		const s = new Set<string>();
		assessments.forEach((a) => {
			if (a.kpi_period) s.add(a.kpi_period);
			if (a.behavior_period) s.add(a.behavior_period);
			if (a.skill_period) s.add(a.skill_period);
		});
		return ['ALL', ...Array.from(s).sort()];
	}, [assessments]);

	const talentData = useMemo(() => {
		return calculateTalentMapping(employees, assessments, {
			cutoffDate,
			department: selectedDept,
			level: selectedLevel,
			period: selectedPeriod,
			includeInterns,
		});
	}, [
		employees,
		assessments,
		cutoffDate,
		selectedDept,
		selectedLevel,
		selectedPeriod,
		includeInterns,
	]);

	const filteredMembers = useMemo(() => {
		return talentData.members.filter((m) => {
			if (statusFilter !== 'ALL' && m.data_status !== statusFilter) return false;
			if (
				selectedBoxKey &&
				`${m.performance_bucket}-${m.potential_proxy_bucket}` !== selectedBoxKey
			)
				return false;
			if (search.trim().length >= 2) {
				const q = search.toLowerCase();
				return (
					m.employee_name.toLowerCase().includes(q) ||
					m.employee_id.toLowerCase().includes(q) ||
					m.department.toLowerCase().includes(q)
				);
			}
			return true;
		});
	}, [talentData.members, statusFilter, selectedBoxKey, search]);

	const handleExportTalentCSV = () => {
		const headers = [
			'Employee ID',
			'Employee Name',
			'Department',
			'Level',
			'Current-Month KPI (%) [Provisional]',
			'KPI Period',
			'Behavior Lead Score (1-5)',
			'Behavior Period',
			'Behavior Evaluator',
			'Skill Map Score (1-5)',
			'Skill Period',
			'Data Status',
			'Experimental 9-Box',
		];
		const rows = filteredMembers.map((m) => [
			m.employee_id,
			`"${m.employee_name}"`,
			`"${m.department}"`,
			`"${m.job_title}"`,
			m.kpi_current_month !== null ? `${m.kpi_current_month}%` : 'N/A',
			m.kpi_period || 'N/A',
			m.behavior_lead_score !== null ? m.behavior_lead_score : 'Pending Assessment',
			m.behavior_period || 'N/A',
			`"${m.behavior_evaluator || 'N/A'}"`,
			m.skill_map_score !== null ? m.skill_map_score : 'N/A',
			m.skill_period || 'N/A',
			m.data_status,
			experimentalMode && m.box_label ? `"${m.box_label} (Experimental)"` : 'Not Classified',
		]);
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			[headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const link = document.createElement('a');
		link.setAttribute('href', encodeURI(csvContent));
		link.setAttribute('download', `Talent_Mapping_Pilot_${cutoffDate}.csv`);
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
				<div className="space-y-0.5">
					<div className="flex items-center gap-2">
						<span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-600 text-white">
							Pilot 2026 MVP
						</span>
						<h3 className="text-sm font-bold text-gray-900 dark:text-white">
							Talent Mapping (HAV / 9-Box) — Safe Evidence-Based Pilot
						</h3>
					</div>
					<p className="text-xs text-gray-600 dark:text-gray-300">
						Menampilkan <b>Current-Month KPI (Provisional)</b>, <b>Behavior Lead Score</b>, dan{' '}
						<b>Skill Map</b> secara terpisah.
					</p>
				</div>

				<label className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer text-xs font-bold">
					<input
						type="checkbox"
						checked={experimentalMode}
						onChange={(e) => {
							setExperimentalMode(e.target.checked);
							if (!e.target.checked) setSelectedBoxKey(null);
						}}
						className="rounded text-amber-500 focus:ring-0"
					/>
					<FlaskConical className="w-4 h-4 text-amber-500" />
					<span>Experimental 9-Box Preview</span>
				</label>
			</div>

			<TalentOverviewCards overview={talentData.overview} />

			<NineBoxMatrix
				experimentalMode={experimentalMode}
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
				experimentalMode={experimentalMode}
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
