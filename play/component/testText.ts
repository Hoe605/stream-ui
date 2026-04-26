const thinkMessgae = `<think> 好的，我们来分析一下这个问题。
首先，我们需要明确题目的要求，然后根据要求来设计解决方案.</think>`

const textMessage = '<text>aaa</text>'

const errMessage = `
<think>123<search>456</think>789</search>
`

const chaosMessage = `
这是一段普通的开场白。
<think>
  这是正常的思考
  <text>这是正常的嵌套高亮</text>
  <search>正在搜索：流式渲染框架...
    <log>日志：命中缓存</log>
    搜索即将完成
  </search>
</think>

--- 下面开始变态错误测试 ---

1. 交叉闭合测试：
<text>外部文本开启 <think> 内部思考开启 </text> 此时 text 应该被 think 强制闭合 </think>

2. 孤立闭合与垃圾标签：
</unknown> </div> </span> <img src="xxx" />

3. 深层未闭合（模拟流生成中断）：
<think>
  <text>
    <search>
      这是一段永远不会有闭合标签的文字，看看组件会不会崩...
`

const inputMessage = `
好的，为了更好地为您提供服务，请填写以下信息：
<input label="您的名字" placeholder="请输入您的名字" />
<input label="您的职业" placeholder="例如：前端工程师" />
填写完成后，我会为您生成专属建议。
`

export { thinkMessgae, textMessage, errMessage, chaosMessage, inputMessage }