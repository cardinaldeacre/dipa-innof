import dns from 'node:dns';
import {Suspense} from 'react';
import {redirect} from 'next/navigation';
import {Loader2} from 'lucide-react';
import {connection} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import DashboardClient from '@/components/DashboardClient';

dns.setDefaultResultOrder('ipv4first');

async function DashboardDataLoader() {
	await connection();

	const supabase = await createClient();

	const {
		data: {user},
	} = await supabase.auth.getUser();

	if (!user) {
		redirect('/login');
	}

	const email = user.email || '';
	const isHrAdmin = email.toLowerCase().includes('hr') || email.toLowerCase().includes('admin');

	const [empRes, reqRes, recRes] = await Promise.all([
		supabase.from('employees').select('*').order('join_date', {ascending: false}),
		supabase.from('job_requisitions').select('*', {count: 'exact', head: true}),
		supabase.from('recruitment_applications').select('*', {count: 'exact', head: true}),
	]);

	return (
		<DashboardClient
			employees={empRes.data || []}
			requisitionsCount={reqRes.count || 0}
			candidatesCount={recRes.count || 0}
			userEmail={email}
			isHrAdmin={isHrAdmin}
		/>
	);
}

export default function HomePage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
					<Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
					<p className="font-medium text-gray-500 dark:text-gray-400 animate-pulse">
						Memuat Dashboard People Analytics...
					</p>
				</div>
			}>
			<DashboardDataLoader />
		</Suspense>
	);
}
