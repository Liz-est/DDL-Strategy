'use client'

import { DeleteOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Drawer, Form, Input, InputNumber, Modal, Space, Table, message } from 'antd'
import {
	deleteCourseBundle,
	isCourseCodeDeletable,
	saveCoursePolicies,
	syncAcademicTasks,
	upsertCourseProfile,
	DEFAULT_COURSE,
} from '@/services/academic-sync'
import { useAcademicPlannerStore } from '@/store/academic-planner'
import type { AcademicEvent, CourseDetail, CoursePlan, CoursePolicyProfile } from '@/store/academic-planner'

type MilestoneRow = {
	id: string
	title: string
	dueDate: string
	type: string
	weight: number
}

const toDateInput = (start: string) => {
	if (!start) return ''
	if (/^\d{4}-\d{2}-\d{2}$/.test(start)) return start
	const d = start.slice(0, 10)
	return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : start
}

const createMilestoneDraftId = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

interface CoursePlannerEditDrawerProps {
	open: boolean
	onClose: () => void
	courseId: string | null
	userId: string | null
	apiBase: string
	courseDetails: CourseDetail[]
	coursePolicies: CoursePolicyProfile[]
	courses: CoursePlan[]
	onRefetch: () => Promise<void>
	/** Called after successful delete so parent can clear selection / drawer id */
	onCourseDeleted?: (courseCode: string) => void
	/** Called after successful save so parent can keep left selection stable. */
	onCourseSaved?: (nextCourseCode: string, previousCourseCode: string) => void
}

export default function CoursePlannerEditDrawer({
	open,
	onClose,
	courseId,
	userId,
	apiBase,
	courseDetails,
	coursePolicies,
	courses,
	onRefetch,
	onCourseDeleted,
	onCourseSaved,
}: CoursePlannerEditDrawerProps) {
	const [form] = Form.useForm()
	const [milestoneRows, setMilestoneRows] = useState<MilestoneRow[]>([])
	const [saving, setSaving] = useState(false)
	const [initialPolicyText, setInitialPolicyText] = useState('')

	const courseCode = courseId ? courseId.replace(/^course-/, '') : ''
	const plan = useMemo(
		() => (courseId ? courses.find(c => c.id === courseId) : undefined),
		[courses, courseId]
	)
	const policy = useMemo(
		() => (courseCode ? coursePolicies.find(p => p.courseCode === courseCode) : undefined),
		[courseCode, coursePolicies]
	)
	const detail = useMemo(
		() => (courseCode ? courseDetails.find(c => c.courseCode === courseCode) : undefined),
		[courseCode, courseDetails]
	)

	const resetForm = useCallback(() => {
		if (!courseId || !courseCode) return
		const p = plan
		const d = detail
		const pol = policy
		form.setFieldsValue({
			courseCode,
			name: d?.name ?? '',
			courseName: d?.courseName ?? p?.courseName ?? courseCode,
			description: d?.description ?? '',
			sourceQuote: d?.sourceQuote ?? '',
			manualCompletion: d?.manualCompletionRate ?? null,
			manualSemester: d?.manualSemesterProgress ?? null,
			policyRaw: pol?.rawPolicyText ?? '',
		})
		const raw = pol?.rawPolicyText ?? ''
		setInitialPolicyText(typeof raw === 'string' ? raw : '')
		setMilestoneRows(
			(p?.milestones || []).map(m => ({
				id: m.id,
				title: m.title,
				dueDate: toDateInput(m.dueDate),
				type: m.type,
				weight: m.weight,
			}))
		)
	}, [courseId, courseCode, form, plan, detail, policy])

	useEffect(() => {
		if (open) resetForm()
	}, [open, resetForm])

	const updateRow = (index: number, patch: Partial<MilestoneRow>) => {
		setMilestoneRows(prev => {
			const next = [...prev]
			const item = { ...next[index], ...patch }
			next[index] = item
			return next
		})
	}

	const addMilestoneRow = () => {
		setMilestoneRows(prev => [
			...prev,
			{
				id: createMilestoneDraftId(),
				title: '',
				dueDate: '',
				type: 'Task',
				weight: 0,
			},
		])
	}

	const removeMilestoneRow = (index: number) => {
		setMilestoneRows(prev => prev.filter((_, i) => i !== index))
	}

	const handleSave = async () => {
		if (!userId || !courseCode) {
			message.error('Not signed in or invalid course')
			return
		}
		const values = await form.validateFields().catch(() => null)
		if (!values) return
		const nextCourseCode = String(values.courseCode || '')
			.trim()
			.toUpperCase()
		if (!nextCourseCode) {
			message.error('Course code is required')
			return
		}
		setSaving(true)
		try {
			await upsertCourseProfile({
				apiBase,
				userId,
				courseCode: nextCourseCode,
				name: values.name || null,
				courseName: values.courseName || null,
				description: values.description || null,
				sourceQuote: values.sourceQuote || null,
				manualCompletionRate: values.manualCompletion == null || values.manualCompletion === '' ? null : Number(values.manualCompletion),
				manualSemesterProgress: values.manualSemester == null || values.manualSemester === '' ? null : Number(values.manualSemester),
			})

			const nextPolicy = typeof values.policyRaw === 'string' ? values.policyRaw : ''
			if (nextCourseCode !== DEFAULT_COURSE && nextPolicy.trim() !== (initialPolicyText || '').trim()) {
				if (nextPolicy.trim()) {
					await saveCoursePolicies({ apiBase, userId, courseCode: nextCourseCode, gradingPolicy: nextPolicy })
				}
				// If cleared, skip API (no "empty policy" contract); user can re-run ingestion later.
			}

			const previousCode = courseCode
			const currentEvents = useAcademicPlannerStore.getState().events
			const oldCourseEvents = currentEvents.filter(
				e => e.taskCategory !== 'chores' && (e.courseCode || 'GENERAL') === previousCode
			)
			const oldCourseEventsById = new Map(oldCourseEvents.map(item => [item.id, item]))
			const normalizedRows = milestoneRows
				.map(row => ({
					...row,
					title: row.title.trim(),
					type: row.type.trim() || 'Task',
					weight: Math.max(0, Math.min(100, Number(row.weight) || 0)),
				}))
				.filter(row => row.title)

			const rebuiltEvents: AcademicEvent[] = normalizedRows.map(row => {
				const prev = oldCourseEventsById.get(row.id)
				const start =
					row.dueDate && !/[T]/.test(row.dueDate) && !/:/.test(row.dueDate)
						? `${row.dueDate}T00:00:00`
						: row.dueDate || prev?.start || new Date().toISOString()
				return {
					...(prev || {
						id: row.id,
						allDay: true,
						taskCategory: 'academic' as const,
						extendedProps: {},
					}),
					id: row.id,
					title: row.title,
					start,
					courseCode: nextCourseCode,
					type: row.type,
					weight: row.weight,
					taskCategory: 'academic',
					extendedProps: {
						...(prev?.extendedProps || {}),
						courseName: values.courseName || prev?.extendedProps?.courseName,
					},
				}
			})

			const oldIds = new Set(oldCourseEvents.map(item => item.id))
			const withoutOld = currentEvents.filter(item => !oldIds.has(item.id))
			const merged = new Map<string, AcademicEvent>()
			;[...withoutOld, ...rebuiltEvents].forEach(item => merged.set(item.id, item))
			const nextAllEvents = Array.from(merged.values())
			useAcademicPlannerStore.getState().setEvents(nextAllEvents)

			if (nextCourseCode !== DEFAULT_COURSE) {
				await syncAcademicTasks({
					apiBase,
					userId,
					courseCode: nextCourseCode,
					events: nextAllEvents.filter(
						item => item.taskCategory !== 'chores' && (item.courseCode || 'GENERAL') === nextCourseCode
					),
				})
			}
			if (previousCode !== nextCourseCode && previousCode !== DEFAULT_COURSE) {
				await syncAcademicTasks({
					apiBase,
					userId,
					courseCode: previousCode,
					events: nextAllEvents.filter(
						item => item.taskCategory !== 'chores' && (item.courseCode || 'GENERAL') === previousCode
					),
				})
				if (isCourseCodeDeletable(previousCode)) {
					await deleteCourseBundle({ apiBase, userId, courseCode: previousCode })
				}
			}

			await onRefetch()
			onCourseSaved?.(nextCourseCode, previousCode)
			message.success('Course updated')
			onClose()
		} catch (e) {
			message.error((e as Error).message || 'Save failed')
		} finally {
			setSaving(false)
		}
	}

	const handleDeleteCourse = () => {
		if (!userId || !courseCode) {
			message.error('Not signed in or invalid course')
			return
		}
		if (!isCourseCodeDeletable(courseCode)) {
			message.warning('This course code cannot be deleted (shared bucket).')
			return
		}
		Modal.confirm({
			title: 'Delete this course?',
			content: `Remove "${courseCode}" and all its tasks, policy, snapshots, and stored profile. This cannot be undone.`,
			okText: 'Delete',
			okType: 'danger',
			cancelText: 'Cancel',
			onOk: async () => {
				try {
					await deleteCourseBundle({ apiBase, userId, courseCode })
					await onRefetch()
					onCourseDeleted?.(courseCode)
					message.success('Course removed')
					onClose()
				} catch (e) {
					message.error((e as Error).message || 'Delete failed')
					throw e
				}
			},
		})
	}

	if (!open || !courseId) return null

	return (
		<Drawer
			title="Edit course"
			placement="right"
			width={560}
			onClose={onClose}
			open={open}
			styles={{ body: { paddingBottom: 16 } }}
			footer={
				<div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
					<Button
						type="primary"
						danger
						disabled={!isCourseCodeDeletable(courseCode)}
						title={!isCourseCodeDeletable(courseCode) ? 'Cannot delete shared placeholder courses' : undefined}
						onClick={() => handleDeleteCourse()}
					>
						Delete course
					</Button>
					<Space>
						<Button onClick={onClose}>Cancel</Button>
						<Button type="primary" loading={saving} onClick={() => void handleSave()}>
							Save
						</Button>
					</Space>
				</div>
			}
		>
			<Form form={form} layout="vertical" className="space-y-0">
				<Form.Item
					name="courseCode"
					label="Course code"
					rules={[{ required: true, message: 'Course code is required' }]}
				>
					<Input placeholder="e.g. MAT3007H" />
				</Form.Item>
				<Form.Item name="name" label="Short name / label">
					<Input placeholder="Name" />
				</Form.Item>
				<Form.Item name="courseName" label="Display name">
					<Input placeholder="Course name" />
				</Form.Item>
				<Form.Item name="description" label="Description">
					<Input.TextArea rows={3} placeholder="Course description" />
				</Form.Item>
				<Form.Item name="sourceQuote" label="Source quote (optional)">
					<Input.TextArea rows={2} placeholder="Original excerpt" />
				</Form.Item>
				<Form.Item name="manualCompletion" label="Override completion % (clear = use calculated)">
					<InputNumber
						placeholder="0–100"
						className="w-full"
						min={0}
						max={100}
						allowClear
					/>
				</Form.Item>
				<Form.Item name="manualSemester" label="Override semester progress % (clear = use timeline)">
					<InputNumber
						placeholder="0–100"
						className="w-full"
						min={0}
						max={100}
						allowClear
					/>
				</Form.Item>
				<p className="mb-4 -mt-2 text-xs text-slate-500">Clear to use auto-calculated values from tasks and dates.</p>
				<Form.Item name="policyRaw" label="Policy (raw text)">
					<Input.TextArea rows={6} placeholder="Grading, late, integrity…" />
				</Form.Item>
			</Form>

			<div className="mb-2 mt-4 flex items-center justify-between gap-2">
				<div className="text-sm font-semibold text-slate-800">Milestones / tasks</div>
				<Button size="small" onClick={addMilestoneRow}>
					Add task
				</Button>
			</div>
			<Table
				size="small"
				pagination={false}
				dataSource={milestoneRows}
				rowKey="id"
				columns={[
					{ title: 'Title', dataIndex: 'title', key: 'title', render: (_, r, i) => (
						<Input value={r.title} onChange={e => updateRow(i, { title: e.target.value })} />
					)},
					{ title: 'Due', dataIndex: 'dueDate', key: 'due', width: 150, render: (_, r, i) => (
						<Input
							placeholder="YYYY-MM-DD"
							value={r.dueDate}
							onChange={e => updateRow(i, { dueDate: e.target.value })}
						/>
					)},
					{ title: 'Type', dataIndex: 'type', key: 'type', width: 110, render: (_, r, i) => (
						<Input value={r.type} onChange={e => updateRow(i, { type: e.target.value })} />
					)},
					{ title: 'Weight', dataIndex: 'weight', key: 'w', width: 90, render: (_, r, i) => (
						<InputNumber
							min={0}
							max={100}
							className="!w-20"
							value={r.weight}
							onChange={v => updateRow(i, { weight: Number(v) || 0 })}
						/>
					)},
					{
						title: '',
						key: 'actions',
						width: 44,
						align: 'center',
						render: (_, __, i) => (
							<button
								type="button"
								aria-label="Remove task"
								className="inline-flex h-8 w-8 items-center justify-center rounded-md border-0 bg-transparent p-0 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-0"
								onClick={() => removeMilestoneRow(i)}
							>
								<DeleteOutlined className="text-[14px]" />
							</button>
						),
					},
				]}
			/>
		</Drawer>
	)
}
