import { PrismaClient } from "@/prisma/generated/prisma";

const prisma = new PrismaClient();

// 开发环境 HMR 下的全局缓存处理，避免热更新造成的连接池超限
const globalForPrisma = global as unknown as { prisma: typeof prisma };
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
