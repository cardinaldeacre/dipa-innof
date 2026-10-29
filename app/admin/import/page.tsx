'use client';

import {useActionState} from 'react';
import XLSX from 'xlsx-js-style';
import {Loader2, CheckCircle, AlertCircle, Database, Download} from 'lucide-react';
import {processExcelImport} from './actions';

const initialState = {
	success: false,
	message: '',
};

export default function ImportPage() {
	const [state, formAction, isPending] = useActionState(
		async (_prevState: any, formData: FormData) => {
			return await processExcelImport(formData);
		},
		initialState
	);

	const handleDownloadTemplate = () => {
		const wb = XLSX.utils.book_new();

		const guideData = [
			{
				'Nama Sheet': 'UMUM (Semua Sheet)',
				'Nama Kolom': 'Semua Kolom Tanggal',
				'Aturan / Nilai yang Diizinkan':
					'Gunakan format YYYY-MM-DD (Contoh: 2026-01-15) atau DD Bulan YYYY (Contoh: 15 Januari 2026)',
				Keterangan: 'Jangan gunakan tanda garis miring terbalik atau teks bebas.',
			},
			{
				'Nama Sheet': 'UMUM (Semua Sheet)',
				'Nama Kolom': 'Baris Contoh (CONTOH_...)',
				'Aturan / Nilai yang Diizinkan': 'Boleh dihapus atau dibiarkan',
				Keterangan:
					'Sistem otomatis mengabaikan baris yang ID/Namanya diawali kata CONTOH_ saat di-upload.',
			},
			{
				'Nama Sheet': 'Employee Master',
				'Nama Kolom': 'Status',
				'Aturan / Nilai yang Diizinkan': 'Active | Inactive',
				Keterangan: 'Jika Exit Date diisi, sistem otomatis mengubah status menjadi Inactive.',
			},
			{
				'Nama Sheet': 'Employee Master',
				'Nama Kolom': 'Employee Status',
				'Aturan / Nilai yang Diizinkan': 'Permanent | Contract | Probation | Internship',
				Keterangan: 'Status ikatan kerja karyawan saat ini.',
			},
			{
				'Nama Sheet': 'Employee Master',
				'Nama Kolom': 'Employment Type',
				'Aturan / Nilai yang Diizinkan': 'Full-time | Part-time | Contract | Internship',
				Keterangan: 'Digunakan untuk filter tipe pekerjaan di Dashboard.',
			},
			{
				'Nama Sheet': 'Employee Master',
				'Nama Kolom': 'Probation Outcome',
				'Aturan / Nilai yang Diizinkan': 'Passed | Failed | Pending | Not Applicable',
				Keterangan: 'Menentukan perhitungan Probation Pass Rate.',
			},
			{
				'Nama Sheet': 'Employee Master & Exit Interview',
				'Nama Kolom': 'Exit Type',
				'Aturan / Nilai yang Diizinkan':
					'Voluntary | Involuntary | Contract Non-Renewal | Probation Non-Continuation',
				Keterangan: 'Wajib diisi jika karyawan memiliki Exit Date.',
			},
			{
				'Nama Sheet': 'Employee Master & Exit Interview',
				'Nama Kolom': 'Exit Reason / Reason',
				'Aturan / Nilai yang Diizinkan':
					'Compensation | Career Growth | Workload | Management | Culture | Personal | Performance | Other',
				Keterangan: 'Digunakan untuk grafik analisis alasan resign.',
			},
			{
				'Nama Sheet': 'Requisition Summary',
				'Nama Kolom': 'Status',
				'Aturan / Nilai yang Diizinkan': 'Open | Filled | On Hold | Cancelled',
				Keterangan: 'Status lowongan kerja.',
			},
			{
				'Nama Sheet': 'Recruitment Database',
				'Nama Kolom': 'Stage',
				'Aturan / Nilai yang Diizinkan':
					'Applied | Screening | Interview | Offer | Hired | Rejected',
				Keterangan: 'Tahapan rekrutmen pelamar.',
			},
			{
				'Nama Sheet': 'Performance Database',
				'Nama Kolom': 'Rating',
				'Aturan / Nilai yang Diizinkan':
					'Exceeds Expectations | Meets Expectations | Needs Improvement | Unsatisfactory',
				Keterangan: 'Skor KPI menggunakan skala angka desimal 1.0 - 5.0.',
			},
			{
				'Nama Sheet': 'Training Database',
				'Nama Kolom': 'Status',
				'Aturan / Nilai yang Diizinkan': 'Completed | In Progress | Not Started',
				Keterangan: 'Status penyelesaian materi pelatihan.',
			},
		];

		const sheetsConfig: Record<string, any[]> = {
			'📋 Panduan & Kamus Data': guideData,
			'Employee Master': [
				{
					'Employee ID': 'CONTOH_DP2601001',
					'Employee Name': 'CONTOH_Budi Santoso (Karyawan Aktif)',
					'Job Title': 'UI/UX Designer',
					Department: 'Design',
					Status: 'Active',
					'Employee Status': 'Permanent',
					'Employment Type': 'Full-time',
					Gender: 'Male',
					'Join Date': '2026-01-15',
					'Years of Services': 0.8,
					'Probation Start Date': '2026-01-15',
					'Probation End Date': '2026-04-15',
					'Probation Outcome': 'Passed',
					'Contract Start Date': '2026-04-16',
					'Contract (I)': '',
					'Contract (II)': '',
					'Contract (III)': '',
					'Exit Date': '',
					'Exit Type': '',
					'Exit Reason': '',
				},
				{
					'Employee ID': 'CONTOH_DP2502002',
					'Employee Name': 'CONTOH_Siti Aminah (Karyawan Resign)',
					'Job Title': 'Frontend Developer',
					Department: 'Development',
					Status: 'Inactive',
					'Employee Status': 'Contract',
					'Employment Type': 'Full-time',
					Gender: 'Female',
					'Join Date': '2025-02-01',
					'Years of Services': 1.2,
					'Probation Start Date': '2025-02-01',
					'Probation End Date': '2025-05-01',
					'Probation Outcome': 'Passed',
					'Contract Start Date': '2025-05-02',
					'Contract (I)': '2026-05-02',
					'Contract (II)': '',
					'Contract (III)': '',
					'Exit Date': '2026-04-20',
					'Exit Type': 'Voluntary',
					'Exit Reason': 'Career Growth',
				},
			],
			'Requisition Summary': [
				{
					'Requisition ID': 'CONTOH_REQ001',
					Department: 'Design',
					Position: 'UI/UX Designer',
					Status: 'Open',
				},
				{
					'Requisition ID': 'CONTOH_REQ002',
					Department: 'Development',
					Position: 'Backend Engineer',
					Status: 'Filled',
				},
			],
			'Recruitment Database': [
				{
					'Requisition ID': 'CONTOH_REQ001',
					Department: 'Design',
					Position: 'UI/UX Designer',
					Candidate: 'CONTOH_Andi Wijaya',
					'Source Channel': 'LinkedIn',
					Stage: 'Hired',
					'Applied Date': '2026-02-01',
					'Offer Date': '2026-02-15',
					'Accepted Date': '2026-02-18',
					'Time to Hire (Days)': 17,
				},
			],
			'Performance Database': [
				{
					'Employee ID': 'CONTOH_DP2601001',
					Department: 'Design',
					'Review Period': '2026-H1',
					'KPI Score': 4.2,
					Rating: 'Exceeds Expectations',
				},
			],
			'Training Database': [
				{
					'Employee ID': 'CONTOH_DP2601001',
					Department: 'Design',
					Course: 'Advanced Figma System',
					Status: 'Completed',
					Hours: 12,
					'Completion Date': '2026-03-10',
				},
			],
			'Engagement Survey Database': [
				{
					'Survey Wave': 'CONTOH_2026-Q1',
					Department: 'Design',
					Dimension: 'Work-Life Balance',
					'Score (1-5)': 4.5,
					Respondents: 10,
				},
			],
			'Exit Interview Database': [
				{
					'Employee ID': 'CONTOH_DP2502002',
					Department: 'Development',
					'Last Working Day': '2026-04-20',
					'Exit Type': 'Voluntary',
					Reason: 'Career Growth',
					'Tenure (Months)': 14.5,
					'Regrettable Loss': 'Yes',
				},
			],
		};

		Object.entries(sheetsConfig).forEach(([sheetName, sampleData]) => {
			const ws = XLSX.utils.json_to_sheet(sampleData);

			if (sampleData.length > 0) {
				const headers = Object.keys(sampleData[0]);

				ws['!cols'] = headers.map((header) => {
					const maxContentLen = sampleData.reduce((max, row) => {
						const cellValue =
							row[header] !== null && row[header] !== undefined ? String(row[header]) : '';
						return Math.max(max, cellValue.length);
					}, header.length);
					return {wch: Math.min(Math.max(maxContentLen + 5, 15), 55)};
				});

				ws['!rows'] = [{hpt: 26}];

				const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
				const isGuideSheet = sheetName.includes('Panduan');

				for (let R = range.s.r; R <= range.e.r; ++R) {
					for (let C = range.s.c; C <= range.e.c; ++C) {
						const cellRef = XLSX.utils.encode_cell({r: R, c: C});
						if (!ws[cellRef]) {
							ws[cellRef] = {t: 's', v: ''};
						}

						const isHeader = R === 0;
						ws[cellRef].s = {
							font: {
								name: 'Calibri',
								sz: isHeader ? 11 : 10,
								bold: isHeader,
								color: {rgb: isHeader ? 'FFFFFF' : '1F2937'},
							},
							fill: {
								fgColor: {
									rgb: isHeader
										? isGuideSheet
											? '1E40AF'
											: '059669'
										: R % 2 === 1
											? 'F9FAFB'
											: 'FFFFFF',
								},
							},
							alignment: {
								vertical: 'center',
								horizontal: isHeader ? 'center' : 'left',
								wrapText: true,
							},
							border: {
								top: {style: 'thin', color: {rgb: 'D1D5DB'}},
								bottom: {style: 'thin', color: {rgb: 'D1D5DB'}},
								left: {style: 'thin', color: {rgb: 'D1D5DB'}},
								right: {style: 'thin', color: {rgb: 'D1D5DB'}},
							},
						};
					}
				}
			}

			XLSX.utils.book_append_sheet(wb, ws, sheetName);
		});

		XLSX.writeFile(wb, 'Template_People_Analytics_Dipa.xlsx');
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
			<div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-xl border border-gray-200 dark:border-gray-800 relative overflow-hidden">
				{isPending && (
					<div className="absolute inset-0 z-20 bg-white/85 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
						<Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
						<h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
							Memproses Semua Sheet Excel...
						</h2>
						<p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 text-center px-6 animate-pulse">
							Menyuntikkan seluruh tabel ke Supabase, mohon tunggu sebentar.
						</p>
					</div>
				)}

				<div className="text-center mb-6">
					<div className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
						<Database className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						Import & Sinkronisasi Data HR
					</h1>
					<p className="text-gray-500 dark:text-gray-400 text-sm">
						Mendukung Multi-Sheet (Karyawan, Rekrutmen, Performa, Training, Survey & Exit)
					</p>
				</div>

				<div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-4">
					<div className="text-xs text-blue-700 dark:text-blue-300">
						<p className="font-semibold text-sm mb-0.5">Belum punya format Excel-nya?</p>
						<p>Unduh template resmi (7 Sheet) agar format kolom otomatis sesuai.</p>
					</div>
					<button
						type="button"
						onClick={handleDownloadTemplate}
						className="shrink-0 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
						<Download className="w-4 h-4" />
						<span>Download Template</span>
					</button>
				</div>

				<form action={formAction} className="space-y-6">
					<div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 bg-gray-50/50 dark:bg-gray-800/30">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Pilih File Excel Multi-Sheet (.xlsx / .xls):
						</label>
						<input
							type="file"
							name="file"
							accept=".xlsx, .xls"
							required
							disabled={isPending}
							className="block w-full text-sm text-gray-700 dark:text-gray-300
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-emerald-600 file:text-white
                hover:file:bg-emerald-700
                file:cursor-pointer cursor-pointer"
						/>
					</div>

					<button
						type="submit"
						disabled={isPending}
						className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:bg-gray-500 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
						{isPending ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								<span>Sedang Diproses...</span>
							</>
						) : (
							<span>Mulai Import Semua Sheet</span>
						)}
					</button>
				</form>

				{state?.message && !isPending && (
					<div
						className={`mt-6 p-4 flex items-center gap-3 rounded-lg border ${
							state.success
								? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
								: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
						}`}>
						{state.success ? (
							<CheckCircle className="w-5 h-5 shrink-0" />
						) : (
							<AlertCircle className="w-5 h-5 shrink-0" />
						)}
						<span className="font-medium text-sm">{state.message}</span>
					</div>
				)}
			</div>
		</div>
	);
}
