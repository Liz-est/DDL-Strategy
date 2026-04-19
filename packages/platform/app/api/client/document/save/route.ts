import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

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

const normalizeCourses = (jsonData: unknown, fallbackCourseCode?: string | null): JsonObject[] => {
  const parsed =
    typeof jsonData === 'string'
      ? parseJsonSafe(jsonData)
      : (jsonData as JsonValue | null)
  if (!parsed) return []
  if (Array.isArray(parsed)) {
    return parsed.filter(item => !!toObject(item)) as JsonObject[]
  }

  const payload = toObject(parsed)
  if (!payload) return []

  const directCourses = Array.isArray(payload.courses)
    ? payload.courses.filter(item => !!toObject(item)).map(item => item as JsonObject)
    : []
  if (directCourses.length > 0) return directCourses

  const directAssessments = Array.isArray(payload.assessments)
    ? payload.assessments.filter(item => !!toObject(item)).map(item => item as JsonObject)
    : []
  if (directAssessments.length > 0) {
    return [
      {
        course_info: {
          course_code: fallbackCourseCode || 'UNKNOWN',
          course_name: fallbackCourseCode || 'UNKNOWN',
        },
        assessments: directAssessments,
        grading_policy: payload.grading_policy ?? null,
      },
    ]
  }
  return []
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

      const courses = normalizeCourses(jsonData, courseCode || null)
      for (const item of courses) {
        const courseInfo = toObject(item.course_info) ?? {}
        const normalizedCourseCode = normalizeCourseCode(courseInfo, courseCode || null)
        const courseId = `course-${userId}-${normalizedCourseCode}`
        const policyId = `policy-${userId}-${normalizedCourseCode}`
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
            `rule-${policyId}-${rule.ruleOrder}`,
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
          `snapshot-${processingResult.id}-${normalizedCourseCode}`,
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
