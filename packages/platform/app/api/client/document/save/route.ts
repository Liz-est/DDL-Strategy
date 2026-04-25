import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createHash } from 'node:crypto';

// 获取 Prisma 单例
const prisma = getPrisma();

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type JsonObject = Record<string, JsonValue>

interface ParsedPolicyRule {
  ruleType: string
  thresholdValue: number | null
  penaltyPercent: number | null
  timeUnit: string | null
  rawQuote: string
  ruleOrder: number
}

interface ParsedPolicyResult {
  rawPolicyText: string | null
  latePolicy: string | null
  absencePolicy: string | null
  gradingNotes: string | null
  extensionRule: string | null
  integrityRule: string | null
  collaborationRule: string | null
  examAidRule: string | null
  parsedPolicyJson: string | null
  rules: ParsedPolicyRule[]
}

interface NormalizeCoursesResult {
  courses: JsonObject[]
  parseError: string | null
  source: 'array' | 'courses' | 'assessments' | 'none'
  invalidCourseIndexes: number[]
}

const toNonEmptyText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const asObjectArray = (value: unknown): JsonObject[] =>
  Array.isArray(value)
    ? value.filter((item): item is JsonObject => !!toObject(item))
    : []

const hasMeaningfulCourseContent = (course: JsonObject) => {
  const courseInfo = toObject(course.course_info) ?? {}
  const hasIdentity =
    !!toNonEmptyText(courseInfo.course_code) ||
    !!toNonEmptyText(courseInfo.course_name) ||
    !!toNonEmptyText(courseInfo.name)
  const hasTasks = asObjectArray(course.deadlines).length > 0 || asObjectArray(course.assessments).length > 0
  const hasPolicy = !!toNonEmptyText(courseInfo.grading_policy) || !!toNonEmptyText(course.grading_policy)
  return hasIdentity || hasTasks || hasPolicy
}

const mergeCoursesByCode = (courses: JsonObject[], fallbackCourseCode?: string | null): JsonObject[] => {
  const merged = new Map<string, JsonObject>()
  for (const item of courses) {
    const courseInfo = toObject(item.course_info) ?? {}
    const normalizedCourseCode = normalizeCourseCode(courseInfo, fallbackCourseCode || null)
    const existing = merged.get(normalizedCourseCode)
    if (!existing) {
      merged.set(normalizedCourseCode, item)
      continue
    }
    const existingInfo = toObject(existing.course_info) ?? {}
    const nextInfo = toObject(item.course_info) ?? {}
    const mergedInfo: JsonObject = {
      ...existingInfo,
      ...nextInfo,
      course_code: toNonEmptyText(existingInfo.course_code) || toNonEmptyText(nextInfo.course_code) || normalizedCourseCode,
      course_name: toNonEmptyText(existingInfo.course_name) || toNonEmptyText(nextInfo.course_name) || toNonEmptyText(nextInfo.name) || normalizedCourseCode,
    }
    const mergedDeadlines = [...asObjectArray(existing.deadlines), ...asObjectArray(item.deadlines)]
    const mergedAssessments = [...asObjectArray(existing.assessments), ...asObjectArray(item.assessments)]
    merged.set(normalizedCourseCode, {
      ...existing,
      ...item,
      course_info: mergedInfo,
      deadlines: mergedDeadlines.length > 0 ? mergedDeadlines : existing.deadlines ?? item.deadlines ?? [],
      assessments: mergedAssessments.length > 0 ? mergedAssessments : existing.assessments ?? item.assessments ?? [],
      grading_policy: item.grading_policy ?? existing.grading_policy ?? null,
    })
  }
  return Array.from(merged.values())
}

const toObject = (value: unknown): JsonObject | null => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as JsonObject
  return null
}

const parseJsonSafe = (value: unknown): JsonValue | null => {
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value) as JsonValue
  } catch {
    return null
  }
}

const normalizeCourses = (jsonData: unknown, fallbackCourseCode?: string | null): NormalizeCoursesResult => {
  const parsed =
    typeof jsonData === 'string'
      ? parseJsonSafe(jsonData)
      : (jsonData as JsonValue | null)
  if (!parsed) {
    return {
      courses: [],
      parseError: typeof jsonData === 'string' ? 'jsonData is not valid JSON string.' : 'jsonData is empty or invalid.',
      source: 'none',
      invalidCourseIndexes: [],
    }
  }
  if (Array.isArray(parsed)) {
    const invalidCourseIndexes: number[] = []
    const courses = parsed
      .map((item, index) => {
        const asObject = toObject(item)
        if (!asObject) invalidCourseIndexes.push(index)
        return asObject
      })
      .filter((item): item is JsonObject => !!item)
    return {
      courses,
      parseError: null,
      source: 'array',
      invalidCourseIndexes,
    }
  }

  const payload = toObject(parsed)
  if (!payload) {
    return {
      courses: [],
      parseError: 'jsonData root must be an object or an array.',
      source: 'none',
      invalidCourseIndexes: [],
    }
  }

  const invalidCourseIndexes: number[] = []
  const directCourses = Array.isArray(payload.courses)
    ? payload.courses
      .map((item, index) => {
        const asObject = toObject(item)
        if (!asObject) invalidCourseIndexes.push(index)
        return asObject
      })
      .filter((item): item is JsonObject => !!item)
    : []
  if (directCourses.length > 0) {
    const meaningful = directCourses.filter(hasMeaningfulCourseContent)
    return {
      courses: mergeCoursesByCode(meaningful, fallbackCourseCode),
      parseError: null,
      source: 'courses',
      invalidCourseIndexes,
    }
  }

  const directAssessments = Array.isArray(payload.assessments)
    ? payload.assessments.filter(item => !!toObject(item)).map(item => item as JsonObject)
    : []
  if (directAssessments.length > 0) {
    return {
      courses: [
        {
          course_info: {
            course_code: fallbackCourseCode || 'UNKNOWN',
            course_name: fallbackCourseCode || 'UNKNOWN',
          },
          assessments: directAssessments,
          grading_policy: payload.grading_policy ?? null,
        },
      ],
      parseError: null,
      source: 'assessments',
      invalidCourseIndexes: [],
    }
  }
  return {
    courses: [],
    parseError: '`jsonData` must contain `courses` or `assessments` array.',
    source: 'none',
    invalidCourseIndexes,
  }
}

const asPolicyText = (value: unknown) => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return JSON.stringify(value)
  return ''
}

const parseGradingPolicyText = (policyRaw: unknown): ParsedPolicyResult => {
  const rawText = asPolicyText(policyRaw).trim()
  if (!rawText) {
    return {
      rawPolicyText: null,
      latePolicy: null,
      absencePolicy: null,
      gradingNotes: null,
      extensionRule: null,
      integrityRule: null,
      collaborationRule: null,
      examAidRule: null,
      parsedPolicyJson: null,
      rules: [],
    }
  }

  const compact = rawText.replace(/\s+/g, ' ').trim()
  const segments = compact.split(/(?<=[.;])\s+/).filter(Boolean)
  const rules: ParsedPolicyRule[] = []

  let extensionRule: string | null = null
  let integrityRule: string | null = null
  let collaborationRule: string | null = null
  let examAidRule: string | null = null
  let absencePolicy: string | null = null

  segments.forEach((segment, index) => {
    const lower = segment.toLowerCase()
    const lateRange = segment.match(/(\d+)\s*[-–]\s*(\d+)\s*hours?.*?(\d+)\s*%/i)
    const lateUnder = segment.match(/up to\s*(\d+)\s*hours?.*?(\d+)\s*%/i)
    const lateOver = segment.match(/more than\s*(\d+)\s*hours?.*?(?:not accepted|0|zero|score\s*=\s*0)/i)
    if (lateRange) {
      rules.push({
        ruleType: 'late_penalty',
        thresholdValue: Number.parseFloat(lateRange[2]),
        penaltyPercent: Number.parseFloat(lateRange[3]),
        timeUnit: 'hour',
        rawQuote: segment,
        ruleOrder: index,
      })
    } else if (lateUnder) {
      rules.push({
        ruleType: 'late_penalty',
        thresholdValue: Number.parseFloat(lateUnder[1]),
        penaltyPercent: Number.parseFloat(lateUnder[2]),
        timeUnit: 'hour',
        rawQuote: segment,
        ruleOrder: index,
      })
    } else if (lateOver) {
      rules.push({
        ruleType: 'late_penalty',
        thresholdValue: Number.parseFloat(lateOver[1]),
        penaltyPercent: 100,
        timeUnit: 'hour',
        rawQuote: segment,
        ruleOrder: index,
      })
    }

    if (!extensionRule && /(extension|accommodation|emergenc)/i.test(lower)) extensionRule = segment
    if (!integrityRule && /(integrity|demerit|disciplinary|zero)/i.test(lower)) integrityRule = segment
    if (!collaborationRule && /(collaboration|group|copying|communicat)/i.test(lower)) collaborationRule = segment
    if (!examAidRule && /(cheat sheet|a4|double-sided|exam)/i.test(lower)) examAidRule = segment
    if (!absencePolicy && /(absence|attendance)/i.test(lower)) absencePolicy = segment
  })

  const parsedPolicy = {
    rawText: compact,
    rules,
    extensionRule,
    integrityRule,
    collaborationRule,
    examAidRule,
  }

  return {
    rawPolicyText: compact,
    latePolicy: rules.length > 0 ? JSON.stringify(rules) : null,
    absencePolicy,
    gradingNotes: compact,
    extensionRule,
    integrityRule,
    collaborationRule,
    examAidRule,
    parsedPolicyJson: JSON.stringify(parsedPolicy),
    rules,
  }
}

const normalizeCourseCode = (courseInfo: JsonObject, fallback: string | null) => {
  const codeCandidates = [
    courseInfo.course_code,
    courseInfo.course_name,
    courseInfo.name,
    fallback,
  ]
  const value = codeCandidates.find(item => typeof item === 'string' && item.trim()) as string | undefined
  return value ? value.trim() : 'UNKNOWN'
}

const stableHash = (...parts: (string | number | null | undefined)[]) =>
  createHash('sha1')
    .update(parts.map(part => (part == null ? '' : String(part))).join('::'))
    .digest('hex')
    .slice(0, 24)

const makeStableId = (prefix: string, ...parts: (string | number | null | undefined)[]) =>
  `${prefix}_${stableHash(...parts)}`

// 辅助函数：为响应添加 CORS 头
function addCorsHeaders(response: NextResponse, origin?: string | null) {
  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// 处理 OPTIONS 预检请求 (解决跨域 CORS 拦截问题)
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  console.log('[document/save] OPTIONS 预检请求收到', {
    origin,
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString()
  });
  
  const response = new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
  
  console.log('[document/save] OPTIONS 响应已发送', {
    status: 200,
    headers: response.headers,
  });
  
  return response;
}

// 处理 POST 请求 - 保存前端返回的JSON数据到数据库
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  
  try {
    // App Router 获取 body 的正确方式
    const body = await request.json();
    const {
      userId,
      courseCode,
      jsonData,
      sourceType = 'document',
      description,
      adviceText,
      courseSummaryJson,
    } = body;

    if (!userId || !jsonData) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Missing required fields: userId or jsonData' },
          { status: 400 }
        ),
        origin
      );
    }

    console.log("📥 后端收到文档处理结果，准备存储到数据库");

    const normalized = normalizeCourses(jsonData, courseCode || null)
    const courses = normalized.courses
    console.log('[document/save] normalized payload', {
      source: normalized.source,
      rawType: typeof jsonData,
      coursesCount: courses.length,
      invalidCourseIndexes: normalized.invalidCourseIndexes,
      parseError: normalized.parseError,
    })
    if (normalized.parseError) {
      return addCorsHeaders(
        NextResponse.json(
          {
            error: normalized.parseError,
            detail: {
              source: normalized.source,
              invalidCourseIndexes: normalized.invalidCourseIndexes,
            },
          },
          { status: 422 }
        ),
        origin
      );
    }
    if (courses.length === 0) {
      return addCorsHeaders(
        NextResponse.json(
          {
            error: 'No valid academic courses found in jsonData.',
            detail: {
              source: normalized.source,
              invalidCourseIndexes: normalized.invalidCourseIndexes,
            },
          },
          { status: 422 }
        ),
        origin
      );
    }

    // Duplicates are merged in normalizeCourses to avoid false 409 failures
    // when payload contains placeholder/empty courses.

    const result = await prisma.$transaction(async (tx) => {
      const processingResult = await tx.processingResult.create({
        data: {
          userId,
          courseCode: courseCode || null,
          rawData: typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData),
          sourceType,
          description: description || null,
          adviceText: typeof adviceText === 'string' ? adviceText : null,
          courseSummaryJson:
            typeof courseSummaryJson === 'string'
              ? courseSummaryJson
              : courseSummaryJson
                ? JSON.stringify(courseSummaryJson)
                : null,
        },
      });

      for (const [index, item] of courses.entries()) {
        const courseInfo = toObject(item.course_info) ?? {}
        const normalizedCourseCode = normalizeCourseCode(courseInfo, courseCode || null)
        if (normalizedCourseCode.length > 191) {
          throw new Error(`course_code exceeds varchar(191): ${normalizedCourseCode.slice(0, 48)}...`)
        }
        const courseId = makeStableId('course', userId, normalizedCourseCode)
        const policyId = makeStableId('policy', userId, normalizedCourseCode)
        const courseName =
          typeof courseInfo.course_name === 'string' && courseInfo.course_name.trim()
            ? courseInfo.course_name.trim()
            : typeof courseInfo.name === 'string' && courseInfo.name.trim()
              ? courseInfo.name.trim()
              : normalizedCourseCode
        const policyRaw = courseInfo.grading_policy ?? item.grading_policy ?? null
        const parsedPolicy = parseGradingPolicyText(policyRaw)

        await tx.$executeRawUnsafe(
          `INSERT INTO academic_courses
            (id, user_id, course_code, name, course_name, description, source_quote, raw_course_info_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            course_name = VALUES(course_name),
            description = VALUES(description),
            source_quote = VALUES(source_quote),
            raw_course_info_json = VALUES(raw_course_info_json),
            updated_at = NOW()`,
          courseId,
          userId,
          normalizedCourseCode,
          typeof courseInfo.name === 'string' ? courseInfo.name : null,
          courseName,
          typeof courseInfo.description === 'string' ? courseInfo.description : null,
          typeof courseInfo.source_quote === 'string' ? courseInfo.source_quote : null,
          JSON.stringify(courseInfo)
        )

        await tx.$executeRawUnsafe(
          `INSERT INTO course_policies
            (id, course_id, user_id, course_code, late_policy, absence_policy, grading_notes, raw_policy_text, extension_rule, integrity_rule, collaboration_rule, exam_aid_rule, parsed_policy_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
            course_id = VALUES(course_id),
            late_policy = VALUES(late_policy),
            absence_policy = VALUES(absence_policy),
            grading_notes = VALUES(grading_notes),
            raw_policy_text = VALUES(raw_policy_text),
            extension_rule = VALUES(extension_rule),
            integrity_rule = VALUES(integrity_rule),
            collaboration_rule = VALUES(collaboration_rule),
            exam_aid_rule = VALUES(exam_aid_rule),
            parsed_policy_json = VALUES(parsed_policy_json),
            updated_at = NOW()`,
          policyId,
          courseId,
          userId,
          normalizedCourseCode,
          parsedPolicy.latePolicy,
          parsedPolicy.absencePolicy,
          parsedPolicy.gradingNotes,
          parsedPolicy.rawPolicyText,
          parsedPolicy.extensionRule,
          parsedPolicy.integrityRule,
          parsedPolicy.collaborationRule,
          parsedPolicy.examAidRule,
          parsedPolicy.parsedPolicyJson
        )

        await tx.$executeRawUnsafe('DELETE FROM course_policy_rules WHERE policy_id = ?', policyId)
        for (const rule of parsedPolicy.rules) {
          await tx.$executeRawUnsafe(
            `INSERT INTO course_policy_rules
              (id, policy_id, rule_type, threshold_value, penalty_percent, time_unit, raw_quote, rule_order, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            makeStableId('rule', policyId, rule.ruleOrder),
            policyId,
            rule.ruleType,
            rule.thresholdValue,
            rule.penaltyPercent,
            rule.timeUnit,
            rule.rawQuote,
            rule.ruleOrder
          )
        }

        await tx.$executeRawUnsafe(
          `INSERT INTO ingestion_snapshots
            (id, user_id, course_code, course_id, processing_result_id, source_type, raw_json, report_text, parsed_policy_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          makeStableId('snapshot', processingResult.id, normalizedCourseCode, index),
          userId,
          normalizedCourseCode,
          courseId,
          processingResult.id,
          sourceType || 'academic',
          JSON.stringify(item),
          typeof adviceText === 'string' ? adviceText : description || null,
          parsedPolicy.parsedPolicyJson
        )
      }

      return processingResult
    });

    console.log("✅ 数据已成功保存到数据库，ID:", result.id);

    // 成功返回并加上允许跨域的 Header
    return addCorsHeaders(
      NextResponse.json(
        {
          success: true,
          message: 'JSON data saved successfully',
          resultId: result.id,
          savedAt: result.processedAt,
        },
        { status: 201 }
      ),
      origin
    );

  } catch (error: any) {
    console.error('❌ Database Save Error:', error);
    // 失败返回
    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || 'Failed to save data' },
        { status: 500 }
      ),
      origin
    );
  }
}

// 处理 GET 请求 - 获取存储的JSON数据
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resultId = searchParams.get('id');
    const courseCode = searchParams.get('courseCode');

    if (!userId && !resultId) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Missing required parameters: userId or id' },
          { status: 400 }
        ),
        origin
      );
    }

    let results;

    if (resultId) {
      // 查询单个结果
      results = await prisma.processingResult.findUnique({
        where: { id: resultId },
      });
    } else {
      // 查询用户的所有结果
      const where: any = { userId };
      if (courseCode) {
        where.courseCode = courseCode;
      }
      results = await prisma.processingResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    }

    return addCorsHeaders(
      NextResponse.json(
        {
          success: true,
          data: results,
        },
        { status: 200 }
      ),
      origin
    );

  } catch (error: any) {
    console.error('❌ Database Query Error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || 'Failed to query data' },
        { status: 500 }
      ),
      origin
    );
  }
}
