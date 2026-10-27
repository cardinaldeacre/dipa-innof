import dns from 'node:dns';
import {createClient} from '@/lib/supabase/server';
import DashboardClient from '@/components/DashboardClient';

dns.setDefaultResultOrder('ipv4first');

export default async function HomePage() {
	const supabase = await createClient();

	const [empRes, reqRes, recRes] = await Promise.all([
		supabase.from('employees').select('*').order('join_date', {ascending: false}),
		supabase.from('job_requisitions').select('*', {count: 'exact', head: true}),
		supabase.from('recruitment_applications').select('*', {count: 'exact', head: true}),
	]);

	const employees = empRes.data || [];
	const requisitionsCount = reqRes.count || 0;
	const candidatesCount = recRes.count || 0;

	return (
		<DashboardClient
			employees={employees}
			requisitionsCount={requisitionsCount}
			candidatesCount={candidatesCount}
		/>
	);
}
