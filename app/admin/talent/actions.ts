'use server';

import dns from 'node:dns';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';

dns.setDefaultResultOrder('ipv4first');

function parseNullableNumber(val: FormDataEntryValue | string | null | undefined): number | null {
	if (val === null || val === undefined || val === '') return null;
	const num = Number(String(val).replace('%', '').trim());
	return isNaN(num) ? null : num;
}

export async function togglePcValidationApprovalAction(approved: boolean, userEmail?: string) {
	try {
		const supabase = await createClient();
		const {error} = await supabase.from('talent_config').upsert(
			{
				id: 'pilot_2026',
				pc_validation_approved: approved,
				approved_by: approved ? userEmail || 'P&C Admin' : null,
				approved_at: approved ? new Date().toISOString() : null,
				updated_at: new Date().toISOString(),
			},
			{onConflict: 'id'}
		);

		if (error) throw error;
		revalidatePath('/');
		return {
			success: true,
			message: approved
				? '✅ P&C Validation Approved! Scoring & Plot 9-Box (Indicative) telah diaktifkan.'
				: '🔒 P&C Validation Gate dikembalikan ke mode Review / Standby.',
		};
	} catch (error: any) {
		return {
			success: false,
			message: `❌ Gagal mengubah status validasi P&C: ${error.message}`,
		};
	}
}

export async function saveTalentAssessmentAction(formData: FormData) {
	try {
		const employee_id = String(formData.get('employee_id') || '').trim();
		const employee_name = String(formData.get('employee_name') || '').trim();
		if (!employee_id || !employee_name) {
			return {success: false, message: '❌ Employee ID dan Nama wajib ada!'};
		}

		// 1. Data KPI Kuartalan (YYYY-Qn)
		const kpi_score = parseNullableNumber(formData.get('kpi_current_month'));
		const kpi_period = String(formData.get('kpi_period') || '2026-Q2').trim();

		if (kpi_score !== null && (kpi_score < 0 || kpi_score > 100)) {
			return {
				success: false,
				message: '❌ Nilai KPI Kuartalan harus berada di antara 0 – 100% (nilai > 100 invalid)!',
			};
		}

		// 2. Data Behavior 7 Dimensi (Skala 1-5)
		const behavior_period = String(formData.get('behavior_period') || '2026').trim();
		const behavior_evaluator = String(formData.get('behavior_evaluator') || '').trim() || null;
		const behavior_evidence = String(formData.get('behavior_evidence') || '').trim() || null;

		const dims: (number | null)[] = [];
		for (let i = 1; i <= 7; i++) {
			const d = parseNullableNumber(formData.get(`dim_${i}`));
			if (d !== null && (d < 1 || d > 5)) {
				return {
					success: false,
					message: `❌ Dimensi Behavior #${i} harus berskala 1.0 – 5.0!`,
				};
			}
			dims.push(d);
		}

		// 3. Data Skill Map Granular (JSON dari form modal)
		const skill_period = String(formData.get('skill_period') || '2026').trim();
		const skillCompetenciesJson = String(formData.get('skill_competencies_json') || '[]');
		let parsedSkills: Array<{
			competency_name: string;
			is_applicable: boolean;
			self_score: number | null;
			lead_score: number | null;
			final_score: number | null;
			target_score: number | null;
			one_on_one_confirmed: boolean;
		}> = [];

		try {
			parsedSkills = JSON.parse(skillCompetenciesJson);
		} catch {
			parsedSkills = [];
		}

		for (const s of parsedSkills) {
			const scores = [s.self_score, s.lead_score, s.final_score, s.target_score];
			for (const sc of scores) {
				if (sc !== null && sc !== undefined && (sc < 1 || sc > 4)) {
					return {
						success: false,
						message: `❌ Skor kompetensi "${s.competency_name}" harus dalam level L1–L4 (angka 1 sampai 4)!`,
					};
				}
			}
		}

		const supabase = await createClient();

		// A. Simpan KPI_Data
		await supabase
			.from('talent_kpi_data')
			.delete()
			.eq('employee_id', employee_id)
			.eq('kpi_period', kpi_period);

		if (kpi_score !== null) {
			const {error: kpiErr} = await supabase.from('talent_kpi_data').insert({
				employee_id,
				employee_name,
				kpi_period,
				kpi_score,
				score_status: 'Assessed',
				is_provisional: false,
				source_sheet: 'Manual_UI_Input',
				updated_at: new Date().toISOString(),
			});
			if (kpiErr) throw kpiErr;
		}

		// B. Simpan Behavior_Assessment (7 Dimensi)
		await supabase
			.from('talent_behavior_assessments')
			.delete()
			.eq('employee_id', employee_id)
			.eq('assessment_period', behavior_period);

		const filledDims = dims.filter((d): d is number => d !== null);
		if (filledDims.length > 0 || behavior_evaluator || behavior_evidence) {
			const {error: behErr} = await supabase.from('talent_behavior_assessments').insert({
				employee_id,
				employee_name,
				assessment_period: behavior_period,
				evaluator: behavior_evaluator,
				dim_1: dims[0],
				dim_2: dims[1],
				dim_3: dims[2],
				dim_4: dims[3],
				dim_5: dims[4],
				dim_6: dims[5],
				dim_7: dims[6],
				score_status: filledDims.length === 7 ? 'Assessed' : 'Incomplete Data',
				evidence: behavior_evidence,
				source_sheet: 'Manual_UI_Input',
				updated_at: new Date().toISOString(),
			});
			if (behErr) throw behErr;
		}

		// C. Simpan Skill_Map_Data per kompetensi
		const validSkills = parsedSkills.filter((s) => s.competency_name.trim() !== '');
		if (validSkills.length > 0) {
			await supabase
				.from('talent_skill_map_data')
				.delete()
				.eq('employee_id', employee_id)
				.eq('assessment_period', skill_period);

			const skillInserts = validSkills.map((s) => {
				const delta =
					s.self_score !== null && s.lead_score !== null
						? Math.abs(s.self_score - s.lead_score)
						: 0;
				const isPendingCal = delta >= 2 && !s.one_on_one_confirmed;
				return {
					employee_id,
					employee_name,
					assessment_period: skill_period,
					competency_name: s.competency_name.trim(),
					is_applicable: s.is_applicable,
					self_score: s.self_score,
					lead_score: s.lead_score,
					final_score: s.final_score,
					target_score: s.target_score,
					one_on_one_confirmed: s.one_on_one_confirmed,
					calibration_status: !s.is_applicable
						? 'Not Applicable'
						: isPendingCal
							? 'Pending Calibration'
							: s.final_score === null || s.target_score === null
								? 'Incomplete Data'
								: s.one_on_one_confirmed
									? 'Calibrated'
									: 'Assessed',
					evaluator: behavior_evaluator,
					source_sheet: 'Manual_UI_Input',
					updated_at: new Date().toISOString(),
				};
			});

			const {error: skillErr} = await supabase.from('talent_skill_map_data').insert(skillInserts);
			if (skillErr) throw skillErr;
		}

		revalidatePath('/');
		return {
			success: true,
			message: `✅ Data Granular Talent Mapping Revisi 2 untuk ${employee_name} (${employee_id}) berhasil disimpan!`,
		};
	} catch (error: any) {
		return {
			success: false,
			message: `❌ Gagal menyimpan: ${error.message}`,
		};
	}
}
