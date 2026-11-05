import {Info} from 'lucide-react';
import {MetricResult} from '@/lib/engine/analytics';

interface MetricCardProps {
	title: string;
	subtitle?: string;
	metric: MetricResult;
	icon: any;
	suffix?: string;
	highlightKPI?: boolean;
}

export default function MetricCard({
	title,
	subtitle,
	metric,
	icon: Icon,
	suffix = '%',
	highlightKPI = false,
}: MetricCardProps) {
	return (
		<div
			className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
				highlightKPI
					? 'bg-emerald-950/10 dark:bg-emerald-950/20 border-emerald-500/40'
					: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
			}`}>
			<div>
				<div className="flex items-start justify-between gap-2 mb-1">
					<span className="text-xs font-bold text-gray-700 dark:text-gray-200">{title}</span>
					<div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
						<Icon className="w-4 h-4" />
					</div>
				</div>
				{subtitle && <p className="text-[11px] text-gray-500 mb-2">{subtitle}</p>}
			</div>

			<div>
				<div className="flex items-baseline justify-between gap-2">
					<div className="text-2xl font-extrabold text-gray-900 dark:text-white">
						{metric.value !== null ? `${metric.value}${suffix}` : 'N/A'}
					</div>
					{metric.target && (
						<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
							Target {metric.target}
						</span>
					)}
				</div>
				<div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
					<span>
						Num: <b>{metric.numerator}</b> | Denom: <b>{metric.denominator}</b>
					</span>
					<span
						title={metric.formula}
						className="flex items-center gap-1 cursor-help text-emerald-600 dark:text-emerald-400 font-medium">
						<Info className="w-3 h-3" /> Formula
					</span>
				</div>
			</div>
		</div>
	);
}
