/**
 * 模拟流式文本输出
 * @param text 要输出的完整文本内容
 * @param interval 每个字符之间的时间间隔 (ms)，默认为 50
 * @returns 一个对象，包含停止输出的方法 stop 和一个在完成时 resolve 的 promise
 */
export const mockFetchStream = async (text: string, interval = 20) => {
    const chars = Array.from(text);
    return new ReadableStream({
        async start(controller) {
            for (const char of chars) {
                await new Promise(r => setTimeout(r, interval));
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(char));
            }
            controller.close();
        }
    });
};