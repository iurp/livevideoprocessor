import OpenAI from 'openai'
import { SubtitleItem, AnalysisResult } from '../types'
import { formatTime } from './subtitle'

const client = new OpenAI({
  apiKey: import.meta.env.VITE_QWEN_API_KEY || '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  dangerouslyAllowBrowser: true
})

export async function analyzeSubtitle(subtitles: SubtitleItem[]): Promise<AnalysisResult> {
  const fullText = subtitles
    .map(s => `[${formatTime(s.start)}] ${s.text}`)
    .join('\n')

  const response = await client.chat.completions.create({
    model: 'qwen-plus',
    messages: [
      {
        role: 'system',
        content: `你是一个直播内容分析专家。分析以下带时间戳的直播字幕，输出 JSON 格式：

{
  "summary": "内容摘要（200字以内）",
  "keyPoints": [
    { "title": "要点标题", "description": "要点说明" }
  ],
  "highlights": [
    {
      "id": "h1",
      "title": "精华片段标题",
      "reason": "为什么值得剪辑",
      "startTime": "00:15:30",
      "endTime": "00:18:45",
      "tags": ["干货", "金句"]
    }
  ]
}

要求：
1. 提取 5-8 个核心要点
2. 找出 3-8 个值得剪辑的精华片段
3. 精华片段应该包含完整的表达，时长建议 1-5 分钟
4. 时间戳格式为 HH:MM:SS 或 MM:SS`
      },
      { role: 'user', content: fullText }
    ],
    response_format: { type: 'json_object' }
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('AI 返回内容为空')
  }

  return JSON.parse(content) as AnalysisResult
}
