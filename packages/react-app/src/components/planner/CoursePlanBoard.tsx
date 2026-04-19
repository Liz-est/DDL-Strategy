import { Card, Empty, Tag } from 'antd'
import type { CoursePlan } from '@/store/academic-planner'

interface CoursePlanBoardProps {
	courses: CoursePlan[]
	selectedCourseId: string | null
	onSelectCourse: (courseId: string) => void
}

export default function CoursePlanBoard({
	courses,
	selectedCourseId,
	onSelectCourse,
}: CoursePlanBoardProps) {
	if (courses.length === 0) {
		return <Empty description="暂无课程计划，先在日历中添加或导入任务" />
	}

	return (
		<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
			{courses.map(course => (
				<Card
					key={course.id}
					title={
						<div className="flex items-center justify-between">
							<span>{course.courseName}</span>
							<Tag color="blue">{course.completionRate}%</Tag>
						</div>
					}
					className={`cursor-pointer transition-all ${
						selectedCourseId === course.id ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'
					}`}
					onClick={() => onSelectCourse(course.id)}
				>
					<div className="space-y-2 text-sm">
						<p className="text-slate-500">课程代码：{course.courseCode}</p>
						<p className="font-semibold text-slate-700">关键节点</p>
						<div className="max-h-36 space-y-2 overflow-y-auto pr-1">
							{course.milestones.slice(0, 6).map(milestone => (
								<div key={milestone.id} className="rounded-md bg-slate-50 px-3 py-2">
									<div className="flex items-center justify-between gap-3">
										<span className="truncate text-slate-700">{milestone.title}</span>
										<Tag color={milestone.weight >= 30 ? 'red' : 'default'}>{milestone.weight}%</Tag>
									</div>
									<div className="text-xs text-slate-500">
										{milestone.dueDate} · {milestone.type}
									</div>
								</div>
							))}
						</div>
					</div>
				</Card>
			))}
		</div>
	)
}
