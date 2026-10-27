'use server';

import dns from 'node:dns';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';

dns.setDefaultResultOrder('ipv4first');

export async function saveEmployeeAction(formData: FormData) {
	try {
		const employee_id = String(formData.get('employee_id') || '').trim();
		const employee_name = String(formData.get('employee_name') || '').trim();
		const job_title = String(formData.get('job_title') || '').trim() || null;
		const department = String(formData.get('department') || '').trim() || null;
		const status = String(formData.get('status') || 'Active').trim();
		const employee_status = String(formData.get('employee_status') || 'Permanent').trim();
		const employment_type = String(formData.get('employment_type') || 'Full-time').trim();
		const gender = String(formData.get('gender') || '').trim() || null;
		const join_date = String(formData.get('join_date') || '').trim() || null;
		const probation_start_date = String(formData.get('probation_start_date') || '').trim() || null;
		const probation_end_date = String(formData.get('probation_end_date') || '').trim() || null;
		const probation_outcome = String(formData.get('probation_outcome') || 'Pending').trim();
		const exit_date = String(formData.get('exit_date') || '').trim() || null;
		const exit_type = String(formData.get('exit_type') || '').trim() || null;
		const exit_reason = String(formData.get('exit_reason') || '').trim() || null;

		if (!employee_id || !employee_name || !join_date) {
			return {success: false, message: '❌ Employee ID, Nama, dan Tanggal Join wajib diisi!'};
		}

		if (exit_date && join_date && exit_date < join_date) {
			return {success: false, message: '❌ Tanggal Exit tidak boleh lebih awal dari Tanggal Join!'};
		}

		if (status === 'Inactive' && !exit_date) {
			return {
				success: false,
				message: '❌ Karyawan berstatus Inactive wajib mengisi Tanggal Exit!',
			};
		}

		const endRef = exit_date ? new Date(exit_date) : new Date();
		const startRef = new Date(join_date);
		const diffYears = Number(
			((endRef.getTime() - startRef.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2)
		);

		const payload = {
			employee_id,
			employee_name,
			job_title,
			department,
			status: exit_date ? 'Inactive' : status,
			employee_status,
			employment_type,
			gender,
			join_date,
			years_of_service: diffYears >= 0 ? diffYears : 0,
			probation_start_date,
			probation_end_date,
			probation_outcome,
			exit_date,
			exit_type: exit_date ? exit_type : null,
			exit_reason: exit_date ? exit_reason : null,
		};

		const supabase = await createClient();
		const {error} = await supabase.from('employees').upsert(payload, {onConflict: 'employee_id'});

		if (error) throw error;

		revalidatePath('/');
		revalidatePath('/admin/employees');

		return {
			success: true,
			message: `✅ Data karyawan ${employee_name} (${employee_id}) berhasil disimpan!`,
		};
	} catch (error: any) {
		console.error('Save Employee Error:', error);
		return {
			success: false,
			message: `❌ Gagal menyimpan: ${error.message}`,
		};
	}
}

export async function deleteEmployeeAction(employeeId: string) {
	try {
		const supabase = await createClient();
		const {error} = await supabase.from('employees').delete().eq('employee_id', employeeId);
		if (error) throw error;

		revalidatePath('/');
		revalidatePath('/admin/employees');
		return {success: true, message: `✅ Data ${employeeId} berhasil dihapus.`};
	} catch (error: any) {
		return {success: false, message: `❌ Gagal menghapus: ${error.message}`};
	}
}
