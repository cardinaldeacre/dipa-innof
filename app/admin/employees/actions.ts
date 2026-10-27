'use server';

import dns from 'node:dns';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';

dns.setDefaultResultOrder('ipv4first');

export async function saveEmployeeAction(formData: FormData) {
	try {
		const supabase = await createClient();

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
			return {success: false, message: '❌ Karyawan Inactive wajib mengisi Tanggal Exit!'};
		}

		const {data: oldData} = await supabase
			.from('employees')
			.select('*')
			.eq('employee_id', employee_id)
			.single();

		const isNewHire = !oldData;
		const isExiting = !oldData?.exit_date && exit_date;
		const isDeptOrTitleChanged =
			oldData && (oldData.department !== department || oldData.job_title !== job_title);
		const isProbationChanged = oldData && oldData.probation_outcome !== probation_outcome;

		const endRef = exit_date ? new Date(exit_date) : new Date();
		const startRef = new Date(join_date);
		const diffYears = Number(
			((endRef.getTime() - startRef.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2)
		);
		const todayStr = new Date().toISOString().slice(0, 10);

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

		const {error} = await supabase.from('employees').upsert(payload, {onConflict: 'employee_id'});
		if (error) throw error;

		if (isNewHire) {
			await supabase.from('department_history').insert({
				employee_id,
				department,
				job_title,
				start_date: join_date,
			});
			await supabase.from('employment_events').insert({
				employee_id,
				event_date: join_date,
				event_type: 'New Hire',
				description: `Bergabung di ${department} sebagai ${job_title}`,
			});
		} else {
			if (isDeptOrTitleChanged) {
				await supabase
					.from('department_history')
					.update({end_date: todayStr})
					.eq('employee_id', employee_id)
					.is('end_date', null);

				await supabase.from('department_history').insert({
					employee_id,
					department,
					job_title,
					start_date: todayStr,
				});

				await supabase.from('employment_events').insert({
					employee_id,
					event_date: todayStr,
					event_type: 'Role / Department Change',
					description: `Mutasi dari ${oldData.department} (${oldData.job_title}) menjadi ${department} (${job_title})`,
				});
			}

			if (isProbationChanged) {
				await supabase.from('employment_events').insert({
					employee_id,
					event_date: todayStr,
					event_type: 'Probation Update',
					description: `Status probation berubah dari ${oldData.probation_outcome || 'Pending'} menjadi ${probation_outcome}`,
				});
			}

			if (isExiting) {
				await supabase
					.from('department_history')
					.update({end_date: exit_date})
					.eq('employee_id', employee_id)
					.is('end_date', null);

				await supabase.from('employment_events').insert({
					employee_id,
					event_date: exit_date,
					event_type: 'Exit',
					description: `Karyawan keluar (${exit_type}) karena alasan: ${exit_reason}`,
				});
			}
		}

		revalidatePath('/');
		revalidatePath('/admin/employees');
		return {
			success: true,
			message: `✅ Data ${employee_name} berhasil disimpan & riwayat otomatis dicatat!`,
		};
	} catch (error: any) {
		console.error('Save Employee Error:', error);
		return {success: false, message: `❌ Gagal menyimpan: ${error.message}`};
	}
}

export async function deleteEmployeeAction(employeeId: string) {
	try {
		const supabase = await createClient();
		const {error} = await supabase.from('employees').delete().eq('employee_id', employeeId);
		if (error) throw error;

		revalidatePath('/');
		revalidatePath('/admin/employees');
		return {
			success: true,
			message: `✅ Data ${employeeId} beserta seluruh riwayatnya berhasil dihapus.`,
		};
	} catch (error: any) {
		return {success: false, message: `❌ Gagal menghapus: ${error.message}`};
	}
}
