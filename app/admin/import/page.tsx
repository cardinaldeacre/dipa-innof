'use client';

import {useActionState} from 'react';
import {Loader2, CheckCircle, AlertCircle, Database} from 'lucide-react';
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

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
			<div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-xl border border-gray-200 dark:border-gray-800 relative overflow-hidden">
				{isPending && (
					<div className="absolute inset-0 z-20 bg-white/85 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
						<Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
						<h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
							Sedang Memproses File Excel...
						</h2>
						<p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 text-center px-6 animate-pulse">
							Mengekstrak data dan menyuntikkan ke Supabase, mohon tunggu sebentar.
						</p>
					</div>
				)}

				<div className="text-center mb-8">
					<div className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
						<Database className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						Import Data Karyawan
					</h1>
					<p className="text-gray-500 dark:text-gray-400 text-sm">
						Upload file{' '}
						<span className="font-medium text-emerald-600 dark:text-emerald-400">
							People_Analytics_Dashboard.xlsx
						</span>
					</p>
				</div>

				<form action={formAction} className="space-y-6">
					<div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 bg-gray-50/50 dark:bg-gray-800/30">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
							Pilih File Excel (.xlsx / .xls):
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
							<span>Mulai Import ke Database</span>
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
