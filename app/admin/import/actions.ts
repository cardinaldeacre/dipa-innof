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

function getCol(row: any, ...possibleNames: string[]): any {
	const rowKeys = Object.keys(row);
	for (const name of possibleNames) {
		const target = name.trim().toLowerCase();
		const foundKey = rowKeys.find((k) => k.trim().toLowerCase() === target);
		if (foundKey !== undefined && row[foundKey] !== '' && row[foundKey] !== null) {
			return row[foundKey];
		}
	}
	return null;
}

function isTemplateSampleRow(val: any): boolean {
	if (!val) return false;
	return String(val).trim().toUpperCase().startsWith('CONTOH_');
}

function normalizeStatus(val: any, hasExitDate: boolean): string {
	if (hasExitDate) return 'Inactive';
	if (!val) return 'Active';
	const s = String(val).trim().toLowerCase();
	if (['inactive', 'nonaktif', 'tidak aktif', 'resign', 'exited', 'keluar'].includes(s))
		return 'Inactive';
	return 'Active';
}

function normalizeProbation(val: any): string | null {
	if (!val) return null;
	const s = String(val).trim().toLowerCase();
	if (['passed', 'pass', 'lulus', 'lolos'].includes(s)) return 'Passed';
	if (['failed', 'fail', 'gagal', 'tidak lulus'].includes(s)) return 'Failed';
	if (['pending', 'proses', 'berjalan', 'on going'].includes(s)) return 'Pending';
	return String(val).trim();
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

		if (workbook.Sheets['Employee Master']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Employee Master']);

			const {data: existingEmps} = await supabase
				.from('employees')
				.select('employee_id, employee_name');

			const nameToIdMap = new Map<string, string>();
			existingEmps?.forEach((e) => {
				if (e.employee_name && e.employee_id) {
					nameToIdMap.set(e.employee_name.trim().toLowerCase(), e.employee_id.trim());
				}
			});

			const uniqueEmpMap = new Map<string, any>();

			rows.forEach((r: any) => {
				let id = getCol(r, 'Employee ID', 'ID Karyawan');
				const name = getCol(r, 'Employee Name', 'Nama Karyawan');
				if (!id || !name || isTemplateSampleRow(id) || isTemplateSampleRow(name)) return;

				const cleanName = String(name).trim();
				let cleanId = String(id).trim();

				const existingIdForName = nameToIdMap.get(cleanName.toLowerCase());
				if (existingIdForName) {
					cleanId = existingIdForName;
				}

				const joinDate = parseFlexibleDate(getCol(r, 'Join Date', 'Tanggal Masuk'));
				const exitDate = parseFlexibleDate(getCol(r, 'Exit Date', 'Tanggal Keluar'));
				const rawYos = getCol(r, 'Years of Services', 'Years of Service', 'Masa Kerja');

				uniqueEmpMap.set(cleanId, {
					employee_id: cleanId,
					employee_name: cleanName,
					job_title: getCol(r, 'Job Title', 'Jabatan')
						? String(getCol(r, 'Job Title', 'Jabatan')).trim()
						: null,
					department: getCol(r, 'Department', 'Departemen')
						? String(getCol(r, 'Department', 'Departemen')).trim()
						: null,
					status: normalizeStatus(getCol(r, 'Status'), !!exitDate),
					employee_status: getCol(r, 'Employee Status')
						? String(getCol(r, 'Employee Status')).trim()
						: null,
					employment_type: getCol(r, 'Employment Type')
						? String(getCol(r, 'Employment Type')).trim()
						: 'Full-time',
					gender: getCol(r, 'Gender', 'Jenis Kelamin')
						? String(getCol(r, 'Gender', 'Jenis Kelamin')).trim()
						: null,
					years_of_service: rawYos !== null && !isNaN(Number(rawYos)) ? Number(rawYos) : null,
					join_date: joinDate,
					probation_start_date: parseFlexibleDate(getCol(r, 'Probation Start Date')),
					probation_end_date: parseFlexibleDate(getCol(r, 'Probation End Date')),
					probation_outcome: normalizeProbation(getCol(r, 'Probation Outcome')),
					contract_start_date: parseFlexibleDate(getCol(r, 'Contract Start Date')),
					contract_1_date: parseFlexibleDate(getCol(r, 'Contract (I)')),
					contract_2_date: parseFlexibleDate(getCol(r, 'Contract (II)')),
					contract_3_date: parseFlexibleDate(getCol(r, 'Contract (III)')),
					exit_date: exitDate,
					exit_type: getCol(r, 'Exit Type') ? String(getCol(r, 'Exit Type')).trim() : null,
					exit_reason: getCol(r, 'Exit Reason') ? String(getCol(r, 'Exit Reason')).trim() : null,
				});
			});

			const data = Array.from(uniqueEmpMap.values());
			if (data.length > 0) {
				await withRetry(
					'Employee Master',
					async () => await supabase.from('employees').upsert(data, {onConflict: 'employee_id'})
				);
				summary.push(`${data.length} Karyawan`);
			}
		}

		if (workbook.Sheets['Requisition Summary']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Requisition Summary']);
			const uniqueReqMap = new Map<string, any>();

			rows.forEach((r: any) => {
				const id = getCol(r, 'Requisition ID');
				if (!id || isTemplateSampleRow(id)) return;
				const cleanId = String(id).trim();

				uniqueReqMap.set(cleanId, {
					requisition_id: cleanId,
					department: getCol(r, 'Department') ? String(getCol(r, 'Department')).trim() : 'Unknown',
					position: getCol(r, 'Position') ? String(getCol(r, 'Position')).trim() : 'Unknown',
					status: getCol(r, 'Status') ? String(getCol(r, 'Status')).trim() : 'Open',
				});
			});

			const data = Array.from(uniqueReqMap.values());
			if (data.length > 0) {
				await withRetry(
					'Requisition Summary',
					async () =>
						await supabase.from('job_requisitions').upsert(data, {onConflict: 'requisition_id'})
				);
				summary.push(`${data.length} Requisition`);
			}
		}

		if (workbook.Sheets['Recruitment Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Recruitment Database']);
			const uniqueRecMap = new Map<string, any>();

			rows.forEach((r: any) => {
				const cand = getCol(r, 'Candidate', 'Candidate Name');
				if (!cand || isTemplateSampleRow(cand)) return;
				const cleanCand = String(cand).trim();
				const reqId = getCol(r, 'Requisition ID')
					? String(getCol(r, 'Requisition ID')).trim()
					: 'NO_REQ';
				const tth = getCol(r, 'Time to Hire (Days)');

				uniqueRecMap.set(`${reqId}__${cleanCand.toLowerCase()}`, {
					requisition_id: reqId === 'NO_REQ' ? null : reqId,
					department: getCol(r, 'Department') ? String(getCol(r, 'Department')).trim() : null,
					position: getCol(r, 'Position') ? String(getCol(r, 'Position')).trim() : null,
					candidate_name: cleanCand,
					source_channel: getCol(r, 'Source Channel')
						? String(getCol(r, 'Source Channel')).trim()
						: null,
					stage: getCol(r, 'Stage') ? String(getCol(r, 'Stage')).trim() : null,
					applied_date: parseFlexibleDate(getCol(r, 'Applied Date')),
					offer_date: parseFlexibleDate(getCol(r, 'Offer Date')),
					accepted_date: parseFlexibleDate(getCol(r, 'Accepted Date')),
					time_to_hire_days: tth !== null && !isNaN(Number(tth)) ? Math.round(Number(tth)) : null,
				});
			});

			const data = Array.from(uniqueRecMap.values());
			if (data.length > 0) {
				const candNames = data.map((d) => d.candidate_name);
				await supabase.from('recruitment_applications').delete().in('candidate_name', candNames);
				await withRetry(
					'Recruitment Insert',
					async () => await supabase.from('recruitment_applications').insert(data)
				);
				summary.push(`${data.length} Pelamar`);
			}
		}

		if (workbook.Sheets['Performance Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Performance Database']);
			const uniquePerfMap = new Map<string, any>();

			rows.forEach((r: any) => {
				const id = getCol(r, 'Employee ID');
				if (!id || isTemplateSampleRow(id)) return;
				const cleanId = String(id).trim();
				const period = getCol(r, 'Review Period')
					? String(getCol(r, 'Review Period')).trim()
					: 'ALL';
				const score = getCol(r, 'KPI Score');

				uniquePerfMap.set(`${cleanId}__${period}`, {
					employee_id: cleanId,
					department: getCol(r, 'Department') ? String(getCol(r, 'Department')).trim() : null,
					review_period: period === 'ALL' ? null : period,
					kpi_score: score !== null && !isNaN(Number(score)) ? Number(score) : null,
					rating: getCol(r, 'Rating') ? String(getCol(r, 'Rating')).trim() : null,
				});
			});

			const data = Array.from(uniquePerfMap.values());
			if (data.length > 0) {
				const empIds = Array.from(new Set(data.map((d) => d.employee_id)));
				await supabase.from('performance_reviews').delete().in('employee_id', empIds);
				await withRetry(
					'Performance Insert',
					async () => await supabase.from('performance_reviews').insert(data)
				);
				summary.push(`${data.length} Performance`);
			}
		}

		if (workbook.Sheets['Training Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Training Database']);
			const uniqueTrainMap = new Map<string, any>();

			rows.forEach((r: any) => {
				const id = getCol(r, 'Employee ID');
				const course = getCol(r, 'Course', 'Course Name');
				if (!id || !course || isTemplateSampleRow(id)) return;
				const cleanId = String(id).trim();
				const cleanCourse = String(course).trim();
				const hrs = getCol(r, 'Hours');

				uniqueTrainMap.set(`${cleanId}__${cleanCourse.toLowerCase()}`, {
					employee_id: cleanId,
					department: getCol(r, 'Department') ? String(getCol(r, 'Department')).trim() : null,
					course_name: cleanCourse,
					status: getCol(r, 'Status') ? String(getCol(r, 'Status')).trim() : null,
					hours: hrs !== null && !isNaN(Number(hrs)) ? Number(hrs) : null,
					completion_date: parseFlexibleDate(getCol(r, 'Completion Date')),
				});
			});

			const data = Array.from(uniqueTrainMap.values());
			if (data.length > 0) {
				const empIds = Array.from(new Set(data.map((d) => d.employee_id)));
				await supabase.from('employee_trainings').delete().in('employee_id', empIds);
				await withRetry(
					'Training Insert',
					async () => await supabase.from('employee_trainings').insert(data)
				);
				summary.push(`${data.length} Training`);
			}
		}

		if (workbook.Sheets['Engagement Survey Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Engagement Survey Database']);
			const uniqueSurveyMap = new Map<string, any>();

			rows.forEach((r: any) => {
				const wave = getCol(r, 'Survey Wave');
				const dim = getCol(r, 'Dimension');
				if (!wave || !dim || isTemplateSampleRow(wave)) return;
				const cleanWave = String(wave).trim();
				const cleanDept = getCol(r, 'Department') ? String(getCol(r, 'Department')).trim() : 'ALL';
				const cleanDim = String(dim).trim();
				const sc = getCol(r, 'Score (1-5)', 'Score');
				const resp = getCol(r, 'Respondents');

				uniqueSurveyMap.set(`${cleanWave}__${cleanDept}__${cleanDim}`, {
					survey_wave: cleanWave,
					department: cleanDept === 'ALL' ? null : cleanDept,
					dimension: cleanDim,
					score: sc !== null && !isNaN(Number(sc)) ? Number(sc) : null,
					respondents_count:
						resp !== null && !isNaN(Number(resp)) ? Math.round(Number(resp)) : null,
				});
			});

			const data = Array.from(uniqueSurveyMap.values());
			if (data.length > 0) {
				const waves = Array.from(new Set(data.map((d) => d.survey_wave)));
				await supabase.from('engagement_surveys').delete().in('survey_wave', waves);
				await withRetry(
					'Survey Insert',
					async () => await supabase.from('engagement_surveys').insert(data)
				);
				summary.push(`${data.length} Survey`);
			}
		}

		if (workbook.Sheets['Exit Interview Database']) {
			const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Exit Interview Database']);
			const uniqueExitMap = new Map<string, any>();

			rows.forEach((r: any) => {
				const id = getCol(r, 'Employee ID');
				if (!id || isTemplateSampleRow(id)) return;
				const cleanId = String(id).trim();
				const ten = getCol(r, 'Tenure (Months)');
				const reg = String(getCol(r, 'Regrettable Loss') || '')
					.trim()
					.toLowerCase();

				uniqueExitMap.set(cleanId, {
					employee_id: cleanId,
					department: getCol(r, 'Department') ? String(getCol(r, 'Department')).trim() : null,
					last_working_day: parseFlexibleDate(getCol(r, 'Last Working Day')),
					exit_type: getCol(r, 'Exit Type') ? String(getCol(r, 'Exit Type')).trim() : null,
					reason: getCol(r, 'Reason', 'Exit Reason')
						? String(getCol(r, 'Reason', 'Exit Reason')).trim()
						: null,
					tenure_months: ten !== null && !isNaN(Number(ten)) ? Number(ten) : null,
					is_regrettable_loss: ['yes', 'ya', 'true', '1'].includes(reg),
				});
			});

			const data = Array.from(uniqueExitMap.values());
			if (data.length > 0) {
				const empIds = data.map((d) => d.employee_id);
				await supabase.from('exit_interviews').delete().in('employee_id', empIds);
				await withRetry(
					'Exit Interview Insert',
					async () => await supabase.from('exit_interviews').insert(data)
				);
				summary.push(`${data.length} Exit Interview`);
			}
		}

		if (summary.length === 0) {
			throw new Error(
				'Tidak ada baris data baru di luar baris CONTOH_ atau nama sheet tidak sesuai.'
			);
		}

		return {
			success: true,
			message: `✅ Berhasil sinkronisasi & update data: ${summary.join(', ')}! (Data lama aman & data kembar otomatis di-overwrite)`,
		};
	} catch (error: any) {
		console.error('Server Action Error:', error);
		return {
			success: false,
			message: `❌ Gagal: ${error.message}`,
		};
	}
}
