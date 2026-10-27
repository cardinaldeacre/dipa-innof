import dns from 'node:dns';
import {Suspense} from 'react';
import {Loader2} from 'lucide-react';
import {createClient} from '@/lib/supabase/server';
import EmployeeManagerClient from '@/components/EmployeeManagerClient';

dns.setDefaultResultOrder('ipv4first');

async function EmployeeDataFetcher() {
	const supabase = await createClient();
	const {data: employees} = await supabase
		.from('employees')
		.select('*')
		.order('employee_id', {ascending: true});

	return <EmployeeManagerClient initialEmployees={employees || []} />;
}

export default function EmployeesAdminPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
					<Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
					<p className="font-medium text-gray-500 dark:text-gray-400 animate-pulse">
						Menarik data karyawan dari Supabase...
					</p>
				</div>
			}>
			<EmployeeDataFetcher />
		</Suspense>
	);
}
