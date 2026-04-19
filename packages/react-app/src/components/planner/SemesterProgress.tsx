import { Card, Progress, Statistic } from 'antd'
import type { AcademicEvent } from '@/store/academic-planner'

interface SemesterProgressProps {
	semesterProgress: number
	events: AcademicEvent[]
}

export default function SemesterProgress({ semesterProgress, events }: SemesterProgressProps) {
	const highRiskCount = events.filter(item => (item.weight || 0) >= 30 || item.type === 'Exam').length
	const nextSevenDays = new Date()
	nextSevenDays.setDate(nextSevenDays.getDate() + 7)
	const upcomingCount = events.filter(item => {
		const current = new Date(item.start)
		return current >= new Date() && current <= nextSevenDays
	}).length

	return (
		<Card title="学期进度" className="h-full">
			<div className="space-y-4">
				<Progress percent={semesterProgress} strokeColor="#4f46e5" />
				<div className="grid grid-cols-2 gap-3">
					<Statistic title="7天内任务" value={upcomingCount} />
					<Statistic title="高风险任务" value={highRiskCount} valueStyle={{ color: '#dc2626' }} />
				</div>
			</div>
		</Card>
	)
}
