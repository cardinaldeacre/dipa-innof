'use server';

import dns from 'node:dns';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';

dns.setDefaultResultOrder('ipv4first');

function parseNullableNumber(val: FormDataEntryValue | null): number | null {
	if (val === null || val === '') return null;
	const num = Number(String(val).replace('%', '').trim());
	return isNaN(num) ? null : num;
}

export async function saveTalentAssessmentAction(formData: FormData) {
	try {
		const employee_id = String(formData.get('employee_id') || '').trim();
		if (!employee_id) {
			return {success: false, message: '❌ Employee ID wajib ada!'};
		}

		const kpi_current_month = parseNullableNumber(formData.get('kpi_current_month'));
		const kpi_period = String(formData.get('kpi_period') || '').trim() || null;
		const behavior_lead_score = parseNullableNumber(formData.get('behavior_lead_score'));
		const behavior_period = String(formData.get('behavior_period') || '').trim() || null;
		const behavior_evaluator = String(formData.get('behavior_evaluator') || '').trim() || null;
		const skill_map_score = parseNullableNumber(formData.get('skill_map_score'));
		const skill_level = String(formData.get('skill_level') || '').trim() || null;
		const skill_period = String(formData.get('skill_period') || '').trim() || null;

		// Validasi Rentang Skala sesuai aturan HR (KPI: 1-100%, Behavior: 1-5, Skill: 1-5)
		if (kpi_current_month !== null && (kpi_current_month < 0 || kpi_current_month > 100)) {
			return {success: false, message: '❌ Rentang Current-Month KPI harus di antara 0 - 100%!'};
		}
		if (behavior_lead_score !== null && (behavior_lead_score < 1 || behavior_lead_score > 5)) {
			return {success: false, message: '❌ Rentang Behavior Lead Score harus di antara 1.0 - 5.0!'};
		}
		if (skill_map_score !== null && (skill_map_score < 1 || skill_map_score > 5)) {
			return {success: false, message: '❌ Rentang Skill Map Score harus di antara 1.0 - 5.0!'};
		}

		const supabase = await createClient();
		const {error} = await supabase.from('talent_assessments').upsert(
			{
				employee_id,
				kpi_current_month,
				kpi_period,
				behavior_lead_score,
				behavior_period,
				behavior_evaluator,
				skill_map_score,
				skill_level,
				skill_period,
				updated_at: new Date().toISOString(),
			},
			{onConflict: 'employee_id'}
		);

		if (error) throw error;

		revalidatePath('/');
		return {
			success: true,
			message: `✅ Skor Talent Mapping untuk ${employee_id} berhasil disimpan!`,
		};
	} catch (error: any) {
		return {
			success: false,
			message: `❌ Gagal menyimpan: ${error.message}`,
		};
	}
}
