'use client';

import {useActionState} from 'react';
import {Lock, Mail, Loader2, ShieldAlert} from 'lucide-react';
import {loginAction} from './actions';

export default function LoginPage() {
	const [state, formAction, isPending] = useActionState(loginAction, {error: ''});

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
			<div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800">
				<div className="text-center mb-8">
					<div className="bg-emerald-100 dark:bg-emerald-900/30 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<Lock className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
					</div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Dipa People Analytics
					</h1>
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
						Internal Portal • Login sesuai hak akses (HR Admin / BOD Viewer)
					</p>
				</div>

				<form action={formAction} className="space-y-5">
					<div>
						<label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
							Email Perusahaan
						</label>
						<div className="relative">
							<Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
							<input
								type="email"
								name="email"
								required
								placeholder="hr@dipa.id atau bod@dipa.id"
								className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:border-emerald-500"
							/>
						</div>
					</div>

					<div>
						<label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
							Password
						</label>
						<div className="relative">
							<Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
							<input
								type="password"
								name="password"
								required
								placeholder="••••••••"
								className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:border-emerald-500"
							/>
						</div>
					</div>

					{state?.error && (
						<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2">
							<ShieldAlert className="w-4 h-4 shrink-0" />
							<span>{state.error}</span>
						</div>
					)}

					<button
						type="submit"
						disabled={isPending}
						className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:bg-gray-500">
						{isPending ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span>Memverifikasi Akses...</span>
							</>
						) : (
							<span>Masuk ke Sistem</span>
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
