'use server';

import dns from 'node:dns';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';

dns.setDefaultResultOrder('ipv4first');

export async function loginAction(_prevState: any, formData: FormData) {
	const email = String(formData.get('email') || '').trim();
	const password = String(formData.get('password') || '');

	if (!email || !password) {
		return {error: 'Email dan password wajib diisi!'};
	}

	const supabase = await createClient();
	const {error} = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return {error: 'Email atau password salah. Pastikan akun sudah terdaftar di Supabase Auth.'};
	}

	redirect('/');
}

export async function logoutAction() {
	const supabase = await createClient();
	await supabase.auth.signOut();
	redirect('/login');
}
