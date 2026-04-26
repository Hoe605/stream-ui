/**
 * 模拟流式文本输出
 * 深度适配 docs 演示需求，模拟 Fetch 返回的 ReadableStream
 * 
 * @param text 要输出的完整文本内容
 * @param interval 每个字符之间的时间间隔 (ms)
 * @returns 返回一个包含控制权的模拟对象
 */
export const createStreamSimulator = (text: string, interval = 20) => {
  const chars = Array.from(text)
  const encoder = new TextEncoder()
  let isStopped = false
  
  let resolveDone: (value: void | PromiseLike<void>) => void
  const donePromise = new Promise<void>((resolve) => {
    resolveDone = resolve
  })

  const stream = new ReadableStream({
    async start(controller) {
      for (const char of chars) {
        if (isStopped) break
        await new Promise((r) => setTimeout(r, interval))
        controller.enqueue(encoder.encode(char))
      }
      controller.close()
      resolveDone()
    },
    cancel() {
      isStopped = true
    },
  })

  return {
    stream,
    stop: () => { isStopped = true },
    done: donePromise
  }
}

/**
 * 极简版流式模拟 (直接返回 ReadableStream)
 */
export const mockFetchStream = (text: string, interval = 20) => {
  return createStreamSimulator(text, interval).stream
}

/**
 * 模拟完整的 Fetch Response
 */
export const mockFetchResponse = (text: string, interval = 20) => {
  return Promise.resolve({
    body: mockFetchStream(text, interval),
    ok: true,
    status: 200,
  } as Response)
}

/**
 * 更加简单的打字机效果模拟，直接操作变量更新
 * @param text 完整字符串
 * @param onUpdate 更新回调
 * @param options 配置参数
 */
export const typewriter = async (
  text: string,
  onUpdate: (val: string) => void,
  options: { speed?: number; random?: boolean } = {}
) => {
  const { speed = 30, random = true } = options
  let current = ''
  const chars = Array.from(text)

  for (const char of chars) {
    current += char
    onUpdate(current)
    
    // 模拟真实的 AI 波动感
    const delay = random 
      ? Math.random() * speed + (speed / 2) 
      : speed
      
    await new Promise((r) => setTimeout(r, delay))
  }
}
