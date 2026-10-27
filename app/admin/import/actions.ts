'use server';

import * as XLSX from 'xlsx';
import {createClient} from '@/lib/supabase/server';

function parseFlexibleDate(val: any): string | null {
	if (!val) return null;

	if (val instanceof Date) {
		return isNaN(val.getTime()) ? null : val.toISOString().split('T')[0];
	}

	let str = String(val).trim();
	if (!str || str === '-' || str.toLowerCase() === 'nan') return null;

	if (/^\d{4}$/.test(str)) {
		return `${str}-01-01`;
	}

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
	if (isNaN(parsed.getTime())) {
		console.warn(`⚠️ Tanggal tidak dikenali, diubah jadi null: "${val}"`);
		return null;
	}

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
		const sheetName = 'Employee Master';
		const worksheet = workbook.Sheets[sheetName];

		if (!worksheet) {
			throw new Error(`Sheet bernama "${sheetName}" tidak ditemukan di file ini!`);
		}

		const jsonData = XLSX.utils.sheet_to_json(worksheet);

		const formattedData = jsonData
			.filter((row: any) => row['Employee ID'] && row['Employee Name'])
			.map((row: any) => ({
				employee_id: String(row['Employee ID']).trim(),
				employee_name: String(row['Employee Name']).trim(),
				job_title: row['Job Title'] ? String(row['Job Title']).trim() : null,
				department: row['Department'] ? String(row['Department']).trim() : null,
				status: row['Status'] ? String(row['Status']).trim() : null,
				employee_status: row['Employee Status'] ? String(row['Employee Status']).trim() : null,
				employment_type: row['Employment Type'] ? String(row['Employment Type']).trim() : null,
				gender: row['Gender'] ? String(row['Gender']).trim() : null,
				years_of_service:
					row['Years of Services'] && !isNaN(Number(row['Years of Services']))
						? Number(row['Years of Services'])
						: null,
				join_date: parseFlexibleDate(row['Join Date']),
				probation_start_date: parseFlexibleDate(row['Probation Start Date']),
				probation_end_date: parseFlexibleDate(row['Probation End Date']),
				probation_outcome: row['Probation Outcome']
					? String(row['Probation Outcome']).trim()
					: null,
				contract_start_date: parseFlexibleDate(row['Contract Start Date']),
				contract_1_date: parseFlexibleDate(row['Contract (I)']),
				contract_2_date: parseFlexibleDate(row['Contract (II)']),
				contract_3_date: parseFlexibleDate(row['Contract (III)']),
				exit_date: parseFlexibleDate(row['Exit Date']),
				exit_type: row['Exit Type'] ? String(row['Exit Type']).trim() : null,
				exit_reason: row['Exit Reason'] ? String(row['Exit Reason']).trim() : null,
			}));

		const supabase = await createClient();

		const {error} = await supabase
			.from('employees')
			.upsert(formattedData, {onConflict: 'employee_id'});

		if (error) throw error;

		return {
			success: true,
			message: `✅ Berhasil! ${formattedData.length} data karyawan sukses masuk ke Supabase.`,
		};
	} catch (error: any) {
		console.error('Server Action Error:', error);
		return {
			success: false,
			message: `❌ Gagal: ${error.message}`,
		};
	}
}
