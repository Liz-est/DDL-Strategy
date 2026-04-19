import { Card, Empty, Tag } from 'antd'
import dayjs from 'dayjs'
import type { AcademicEvent } from '@/store/academic-planner'

interface RiskHeatPanelProps {
	events: AcademicEvent[]
}

const toHeatLevel = (count: number) => {
	if (count >= 4) return { label: 'High', color: 'red' as const }
	if (count >= 2) return { label: 'Medium', color: 'orange' as const }
	return { label: 'Low', color: 'green' as const }
}

export default function RiskHeatPanel({ events }: RiskHeatPanelProps) {
	const heatRows = Array.from({ length: 14 }).map((_, offset) => {
		const day = dayjs().add(offset, 'day').format('YYYY-MM-DD')
		const dayEvents = events.filter(item => item.start.startsWith(day))
		const weightedScore = dayEvents.reduce((acc, item) => {
			const base = item.type === 'Exam' ? 2 : 1
			return acc + base + ((item.weight || 0) >= 30 ? 1 : 0)
		}, 0)
		return {
			day,
			count: dayEvents.length,
			score: weightedScore,
			level: toHeatLevel(weightedScore),
		}
	})

	const nonZeroRows = heatRows.filter(row => row.count > 0)

	return (
		<Card title="风险热区（未来14天）" className="h-full">
			{nonZeroRows.length === 0 ? (
				<Empty description="未来14天暂无任务压力" />
			) : (
				<div className="space-y-2">
					{nonZeroRows.map(row => (
						<div key={row.day} className="flex items-center justify-between rounded-md border px-3 py-2">
							<div className="text-sm text-slate-700">{row.day}</div>
							<div className="flex items-center gap-2">
								<span className="text-xs text-slate-500">{row.count} tasks</span>
								<Tag color={row.level.color}>{row.level.label}</Tag>
							</div>
						</div>
					))}
				</div>
			)}
		</Card>
	)
}
