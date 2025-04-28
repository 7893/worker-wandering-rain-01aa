// lib/trace-utils.ts

export function generateTraceId(): string {
    const timestamp = Date.now(); // 毫秒级时间戳
    const randomPart = Math.random().toString(36).substring(2, 6); // 生成4位随机字符串
    return `trace-${timestamp}-${randomPart}`;
}
