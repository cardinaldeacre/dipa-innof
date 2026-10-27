'use client';

import {useActionState} from 'react';
import * as XLSX from 'xlsx';
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

		const sheetsConfig: Record<string, any[]> = {
			'Employee Master': [
				{
					'Employee ID': 'DP2601001',
					'Employee Name': 'Budi Santoso',
					'Job Title': 'UI/UX Designer',
					Department: 'Design',
					Status: 'Active',
					'Employee Status': 'Permanent',
					'Employment Type': 'Full-time',
					Gender: 'Male',
					'Join Date': '2026-01-15',
					'Years of Services': 0.5,
					'Probation Start Date': '2026-01-15',
					'Probation End Date': '2026-04-15',
					'Probation Outcome': 'Passed',
					'Contract Start Date': '',
					'Contract (I)': '',
					'Contract (II)': '',
					'Contract (III)': '',
					'Exit Date': '',
					'Exit Type': '',
					'Exit Reason': '',
				},
			],
			'Requisition Summary': [
				{
					'Requisition ID': 'REQ001',
					Department: 'Design',
					Position: 'UI/UX Designer',
					Status: 'Open',
				},
			],
			'Recruitment Database': [
				{
					'Requisition ID': 'REQ001',
					Department: 'Design',
					Position: 'UI/UX Designer',
					Candidate: 'Andi Wijaya',
					'Source Channel': 'LinkedIn',
					Stage: 'Interview',
					'Applied Date': '2026-02-01',
					'Offer Date': '',
					'Accepted Date': '',
					'Time to Hire (Days)': '',
				},
			],
			'Performance Database': [
				{
					'Employee ID': 'DP2601001',
					Department: 'Design',
					'Review Period': '2026-H1',
					'KPI Score': 4.2,
					Rating: 'Exceeds Expectations',
				},
			],
			'Training Database': [
				{
					'Employee ID': 'DP2601001',
					Department: 'Design',
					Course: 'Advanced Figma System',
					Status: 'Completed',
					Hours: 12,
					'Completion Date': '2026-03-10',
				},
			],
			'Engagement Survey Database': [
				{
					'Survey Wave': '2026-Q1',
					Department: 'Design',
					Dimension: 'Work-Life Balance',
					'Score (1-5)': 4.5,
					Respondents: 10,
				},
			],
			'Exit Interview Database': [
				{
					'Employee ID': 'DP2110009',
					Department: 'Design',
					'Last Working Day': '2026-05-20',
					'Exit Type': 'Voluntary',
					Reason: 'Career Growth',
					'Tenure (Months)': 18.5,
					'Regrettable Loss': 'Yes',
				},
			],
		};

		Object.entries(sheetsConfig).forEach(([sheetName, sampleData]) => {
			const ws = XLSX.utils.json_to_sheet(sampleData);
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
