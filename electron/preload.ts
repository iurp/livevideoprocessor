import { contextBridge, ipcRenderer } from 'electron'

interface SubtitleItem {
  start: number
  end: number
  text: string
}

interface AppConfig {
  apiKey: string
  baseURL: string
  model: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: (options: { filters?: { name: string, extensions: string[] }[] }) =>
    ipcRenderer.invoke('select-file', options),

  readFile: (filePath: string) =>
    ipcRenderer.invoke('read-file', filePath),

  parseSubtitle: (filePath: string): Promise<SubtitleItem[]> =>
    ipcRenderer.invoke('parse-subtitle', filePath),

  analyzeSubtitle: (subtitles: SubtitleItem[]) =>
    ipcRenderer.invoke('analyze-subtitle', subtitles),

  exportClip: (options: {
    inputPath: string
    outputPath: string
    startTime: number
    endTime: number
  }) => ipcRenderer.invoke('export-clip', options),

  selectSavePath: (options: { defaultPath?: string }) =>
    ipcRenderer.invoke('select-save-path', options),

  // 配置管理
  getConfig: (): Promise<Partial<AppConfig>> =>
    ipcRenderer.invoke('get-config'),

  setConfig: (config: Partial<AppConfig>): Promise<void> =>
    ipcRenderer.invoke('set-config', config)
})
