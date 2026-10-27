import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		agentFeedback: true,
	},
	allowedDevOrigins: ['10.177.82.7', 'localhost:3000'],
	cacheComponents: true,
	partialPrefetching: true,
	turbopack: {
		rules: {
			'*.css': {
				loaders: ['@tailwindcss/turbopack'],
				as: '*.css',
			},
		},
	},
};

export default nextConfig;
