// 字幕条目
export interface SubtitleItem {
  start: number  // 毫秒
  end: number
  text: string
}

// AI 分析结果
export interface AnalysisResult {
  summary: string
  highlights: Highlight[]
}

export interface Highlight {
  id: string
  title: string
  description: string  // 要点的详细说明
  startTime: string    // "HH:MM:SS" 格式
  endTime: string
  tags: string[]
}

// 应用状态
export type AppStep = 'import' | 'analyzing' | 'result'

export interface AppState {
  step: AppStep
  videoPath: string | null
  subtitlePath: string | null
  subtitles: SubtitleItem[]
  analysisResult: AnalysisResult | null
  currentHighlight: Highlight | null
}

// 应用配置
export interface AppConfig {
  apiKey: string
  baseURL: string
  model: string
}

// Electron API 类型
declare global {
  interface Window {
    electronAPI: {
      selectFile: (options: { filters?: { name: string, extensions: string[] }[] }) => Promise<string | null>
      readFile: (filePath: string) => Promise<string>
      parseSubtitle: (filePath: string) => Promise<SubtitleItem[]>
      analyzeSubtitle: (subtitles: SubtitleItem[]) => Promise<AnalysisResult>
      exportClip: (options: {
        inputPath: string
        outputPath: string
        startTime: number
        endTime: number
      }) => Promise<{ success: boolean }>
      selectSavePath: (options: { defaultPath?: string }) => Promise<string | null>
      getConfig: () => Promise<Partial<AppConfig>>
      setConfig: (config: Partial<AppConfig>) => Promise<void>
    }
  }
}
