'use server';

import dns from 'node:dns';
import * as XLSX from 'xlsx';
import {createClient} from '@/lib/supabase/server';

dns.setDefaultResultOrder('ipv4first');

async function withRetry<T>(operationName: string, fn: () => Promise<{data?: T; error: any}>) {
	let lastError: any = null;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const result = await fn();
			if (!result.error) return result;

			lastError = result.error;
			if (String(result.error.message).includes('fetch failed')) {
				console.warn(
					`⚠️ [${operationName}] Koneksi kedip (percobaan ${attempt}/3), mencoba ulang...`
				);
				await new Promise((r) => setTimeout(r, 600 * attempt));
				continue;
			}
			throw new Error(`${operationName}: ${result.error.message}`);
		} catch (err: any) {
			lastError = err;
			if (String(err.message).includes('fetch failed') && attempt < 3) {
				await new Promise((r) => setTimeout(r, 600 * attempt));
				continue;
			}
			throw err;
		}
	}
	throw new Error(
		`${operationName}: ${lastError?.message || 'Koneksi gagal setelah 3x percobaan'}`
	);
}

function parseFlexibleDate(val: any): string | null {
	if (!val) return null;
	if (val instanceof Date) {
		return isNaN(val.getTime()) ? null : val.toISOString().split('T')[0];
	}
	let str = String(val).trim();
	if (!str || str === '-' || str.toLowerCase() === 'nan') return null;
	if (/^\d{4}$/.test(str)) return `${str}-01-01`;

	const indoMonths: Record<string, string> = {
		januari: 'January',
		februari: 'February',
		pebruari: 'February',
		maret: 'March',
		april: 'April',
		mei: 'May',
		juni: 'June',
		juli: 'July',
		agustus: 'August',
		september: 'September',
		sept: 'Sep',
		oktober: 'October',
		okt: 'Oct',
		november: 'November',
		nopember: 'November',
		desember: 'December',
		des: 'Dec',
	};
	const regex = new RegExp(`\\b(${Object.keys(indoMonths).join('|')})\\b`, 'gi');
	str = str.replace(regex, (match) => indoMonths[match.toLowerCase()] || match);

	const parsed = new Date(str);
	if (isNaN(parsed.getTime())) return null;

	const year = parsed.getFullYear();
	const month = String(parsed.getMonth() + 1).padStart(2, '0');
	const day = String(parsed.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export async function processExcelImport(formData: FormData) {
	try {
		const file = formData.get('file') as File;
		if (!file) throw new Error('File tidak ditemukan');

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		const workbook = XLSX.read(buffer, {type: 'buffer', cellDates: true});
		const supabase = await createClient();

		const summary: string[] = [];

		// 1. SHEET: Employee Master
		if (workbook.Sheets['Employee Master']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Employee Master']);
			const data = rows
				.filter((r: any) => r['Employee ID'] && r['Employee Name'])
				.map((r: any) => ({
					employee_id: String(r['Employee ID']).trim(),
					employee_name: String(r['Employee Name']).trim(),
					job_title: r['Job Title'] ? String(r['Job Title']).trim() : null,
					department: r['Department'] ? String(r['Department']).trim() : null,
					status: r['Status'] ? String(r['Status']).trim() : null,
					employee_status: r['Employee Status'] ? String(r['Employee Status']).trim() : null,
					employment_type: r['Employment Type'] ? String(r['Employment Type']).trim() : null,
					gender: r['Gender'] ? String(r['Gender']).trim() : null,
					years_of_service:
						r['Years of Services'] && !isNaN(Number(r['Years of Services']))
							? Number(r['Years of Services'])
							: null,
					join_date: parseFlexibleDate(r['Join Date']),
					probation_start_date: parseFlexibleDate(r['Probation Start Date']),
					probation_end_date: parseFlexibleDate(r['Probation End Date']),
					probation_outcome: r['Probation Outcome'] ? String(r['Probation Outcome']).trim() : null,
					contract_start_date: parseFlexibleDate(r['Contract Start Date']),
					contract_1_date: parseFlexibleDate(r['Contract (I)']),
					contract_2_date: parseFlexibleDate(r['Contract (II)']),
					contract_3_date: parseFlexibleDate(r['Contract (III)']),
					exit_date: parseFlexibleDate(r['Exit Date']),
					exit_type: r['Exit Type'] ? String(r['Exit Type']).trim() : null,
					exit_reason: r['Exit Reason'] ? String(r['Exit Reason']).trim() : null,
				}));

			if (data.length > 0) {
				await withRetry(
					'Employee Master',
					async () => await supabase.from('employees').upsert(data, {onConflict: 'employee_id'})
				);
				summary.push(`${data.length} Karyawan`);
			}
		}

		// 2. SHEET: Requisition Summary
		if (workbook.Sheets['Requisition Summary']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Requisition Summary']);
			const data = rows
				.filter((r: any) => r['Requisition ID'])
				.map((r: any) => ({
					requisition_id: String(r['Requisition ID']).trim(),
					department: r['Department'] ? String(r['Department']).trim() : 'Unknown',
					position: r['Position'] ? String(r['Position']).trim() : 'Unknown',
					status: r['Status'] ? String(r['Status']).trim() : 'Open',
				}));

			if (data.length > 0) {
				await withRetry(
					'Requisition Summary',
					async () =>
						await supabase.from('job_requisitions').upsert(data, {onConflict: 'requisition_id'})
				);
				summary.push(`${data.length} Requisition`);
			}
		}

		// 3. SHEET: Recruitment Database
		if (workbook.Sheets['Recruitment Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Recruitment Database']);
			const data = rows
				.filter((r: any) => r['Candidate'])
				.map((r: any) => ({
					requisition_id: r['Requisition ID'] ? String(r['Requisition ID']).trim() : null,
					department: r['Department'] ? String(r['Department']).trim() : null,
					position: r['Position'] ? String(r['Position']).trim() : null,
					candidate_name: String(r['Candidate']).trim(),
					source_channel: r['Source Channel'] ? String(r['Source Channel']).trim() : null,
					stage: r['Stage'] ? String(r['Stage']).trim() : null,
					applied_date: parseFlexibleDate(r['Applied Date']),
					offer_date: parseFlexibleDate(r['Offer Date']),
					accepted_date: parseFlexibleDate(r['Accepted Date']),
					time_to_hire_days:
						r['Time to Hire (Days)'] && !isNaN(Number(r['Time to Hire (Days)']))
							? Math.round(Number(r['Time to Hire (Days)']))
							: null,
				}));

			if (data.length > 0) {
				await withRetry(
					'Recruitment Reset',
					async () => await supabase.from('recruitment_applications').delete().neq('id', 0)
				);
				await withRetry(
					'Recruitment Insert',
					async () => await supabase.from('recruitment_applications').insert(data)
				);
				summary.push(`${data.length} Pelamar`);
			}
		}

		// 4. SHEET: Performance Database
		if (workbook.Sheets['Performance Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Performance Database']);
			const data = rows
				.filter((r: any) => r['Employee ID'])
				.map((r: any) => ({
					employee_id: String(r['Employee ID']).trim(),
					department: r['Department'] ? String(r['Department']).trim() : null,
					review_period: r['Review Period'] ? String(r['Review Period']).trim() : null,
					kpi_score:
						r['KPI Score'] && !isNaN(Number(r['KPI Score'])) ? Number(r['KPI Score']) : null,
					rating: r['Rating'] ? String(r['Rating']).trim() : null,
				}));

			if (data.length > 0) {
				await withRetry(
					'Performance Reset',
					async () => await supabase.from('performance_reviews').delete().neq('id', 0)
				);
				await withRetry(
					'Performance Insert',
					async () => await supabase.from('performance_reviews').insert(data)
				);
				summary.push(`${data.length} Performance`);
			}
		}

		// 5. SHEET: Training Database
		if (workbook.Sheets['Training Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Training Database']);
			const data = rows
				.filter((r: any) => r['Employee ID'] && r['Course'])
				.map((r: any) => ({
					employee_id: String(r['Employee ID']).trim(),
					department: r['Department'] ? String(r['Department']).trim() : null,
					course_name: String(r['Course']).trim(),
					status: r['Status'] ? String(r['Status']).trim() : null,
					hours: r['Hours'] && !isNaN(Number(r['Hours'])) ? Number(r['Hours']) : null,
					completion_date: parseFlexibleDate(r['Completion Date']),
				}));

			if (data.length > 0) {
				await withRetry(
					'Training Reset',
					async () => await supabase.from('employee_trainings').delete().neq('id', 0)
				);
				await withRetry(
					'Training Insert',
					async () => await supabase.from('employee_trainings').insert(data)
				);
				summary.push(`${data.length} Training`);
			}
		}

		// 6. SHEET: Engagement Survey Database
		if (workbook.Sheets['Engagement Survey Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Engagement Survey Database']);
			const data = rows
				.filter((r: any) => r['Survey Wave'] && r['Dimension'])
				.map((r: any) => ({
					survey_wave: String(r['Survey Wave']).trim(),
					department: r['Department'] ? String(r['Department']).trim() : null,
					dimension: String(r['Dimension']).trim(),
					score:
						r['Score (1-5)'] && !isNaN(Number(r['Score (1-5)'])) ? Number(r['Score (1-5)']) : null,
					respondents_count:
						r['Respondents'] && !isNaN(Number(r['Respondents']))
							? Math.round(Number(r['Respondents']))
							: null,
				}));

			if (data.length > 0) {
				await withRetry(
					'Survey Reset',
					async () => await supabase.from('engagement_surveys').delete().neq('id', 0)
				);
				await withRetry(
					'Survey Insert',
					async () => await supabase.from('engagement_surveys').insert(data)
				);
				summary.push(`${data.length} Survey`);
			}
		}

		// 7. SHEET: Exit Interview Database
		if (workbook.Sheets['Exit Interview Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Exit Interview Database']);
			const data = rows
				.filter((r: any) => r['Employee ID'])
				.map((r: any) => ({
					employee_id: String(r['Employee ID']).trim(),
					department: r['Department'] ? String(r['Department']).trim() : null,
					last_working_day: parseFlexibleDate(r['Last Working Day']),
					exit_type: r['Exit Type'] ? String(r['Exit Type']).trim() : null,
					reason: r['Reason'] ? String(r['Reason']).trim() : null,
					tenure_months:
						r['Tenure (Months)'] && !isNaN(Number(r['Tenure (Months)']))
							? Number(r['Tenure (Months)'])
							: null,
					is_regrettable_loss: String(r['Regrettable Loss']).trim().toLowerCase() === 'yes',
				}));

			if (data.length > 0) {
				await withRetry(
					'Exit Interview Reset',
					async () => await supabase.from('exit_interviews').delete().neq('id', 0)
				);
				await withRetry(
					'Exit Interview Insert',
					async () => await supabase.from('exit_interviews').insert(data)
				);
				summary.push(`${data.length} Exit Interview`);
			}
		}

		if (summary.length === 0) {
			throw new Error('Tidak ada nama sheet yang cocok! Pastikan menggunakan Template resmi.');
		}

		return {
			success: true,
			message: `✅ Berhasil mengimpor seluruh sheet: ${summary.join(', ')}!`,
		};
	} catch (error: any) {
		console.error('Server Action Error:', error);
		return {
			success: false,
			message: `❌ Gagal: ${error.message}`,
		};
	}
}
