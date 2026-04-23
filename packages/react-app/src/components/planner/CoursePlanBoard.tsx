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
		return (
			<Empty description="No course plans yet. Add or import academic tasks from the calendar or chat first." />
		)
	}

	return (
		<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
			{courses.map(course => (
				<Card
					key={course.id}
					title={
						<div className="flex min-w-0 items-center justify-between gap-2">
							<span className="min-w-0 flex-1 truncate">{course.courseName}</span>
							<Tag color="blue" className="m-0 shrink-0">
								{course.completionRate}%
							</Tag>
						</div>
					}
					role="button"
					tabIndex={0}
					className={`cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
						selectedCourseId === course.id ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'
					}`}
					onClick={() => onSelectCourse(course.id)}
					onKeyDown={e => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							onSelectCourse(course.id)
						}
					}}
				>
					<div className="space-y-2 text-sm">
						<p className="truncate text-slate-600" title={course.courseCode}>
							Course code: {course.courseCode}
						</p>
						<p className="font-semibold text-slate-800">Key milestones</p>
						<div className="planner-scroll max-h-36 space-y-2 overflow-y-auto pr-1">
							{course.milestones.slice(0, 6).map(milestone => (
								<div key={milestone.id} className="rounded-md bg-slate-50 px-3 py-2">
									<div className="flex items-center justify-between gap-3">
										<span className="truncate text-slate-800">{milestone.title}</span>
										<Tag color={milestone.weight >= 30 ? 'red' : 'default'}>{milestone.weight}%</Tag>
									</div>
									<div className="text-xs text-slate-600">
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
