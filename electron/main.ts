import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import { path as ffmpegInstallerPath } from '@ffmpeg-installer/ffmpeg'
import { parseSync } from 'subtitle'
import OpenAI from 'openai'
import Store from 'electron-store'

// 获取 FFmpeg 路径（支持开发和打包环境）
function getFFmpegPath(): string {
  if (app.isPackaged) {
    // 打包后，FFmpeg 在 extraResources 中
    const platform = process.platform
    const arch = process.arch
    const ffmpegName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'

    let platformDir: string
    if (platform === 'win32') {
      platformDir = 'win32-x64'
    } else if (platform === 'darwin') {
      platformDir = arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
    } else {
      platformDir = 'linux-x64'
    }

    const resourcePath = path.join(process.resourcesPath, '@ffmpeg-installer', platformDir, ffmpegName)
    if (fs.existsSync(resourcePath)) {
      return resourcePath
    }
  }
  return ffmpegInstallerPath
}

ffmpeg.setFfmpegPath(getFFmpegPath())

// 配置存储
interface AppConfig {
  apiKey: string
  baseURL: string
  model: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store: any = new Store({
  name: 'config',
  defaults: {
    apiKey: '',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus'
  }
})

// 动态获取 AI 客户端
function getAIClient(): OpenAI {
  return new OpenAI({
    apiKey: store.get('apiKey') || '',
    baseURL: store.get('baseURL')
  })
}

interface SubtitleItem {
  start: number
  end: number
  text: string
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,  // 允许访问本地文件
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (app.isPackaged) {
    // 生产模式：加载打包后的 HTML
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    // 开发模式：加载本地服务器
    mainWindow.loadURL('http://localhost:5173')
    // 开发模式打开 DevTools
    mainWindow.webContents.openDevTools()
  }
}

// 注册自定义协议以允许访问本地视频文件
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-video', privileges: { bypassCSP: true, stream: true } }
])

app.whenReady().then(() => {
  // 注册协议处理本地视频文件
  protocol.registerFileProtocol('local-video', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('local-video://', ''))
    callback({ path: filePath })
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC: 打开文件选择对话框
ipcMain.handle('select-file', async (_event, options: { filters?: { name: string, extensions: string[] }[] }) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: options.filters
  })
  return result.filePaths[0] || null
})

// IPC: 读取文件内容
ipcMain.handle('read-file', async (_event, filePath: string) => {
  return fs.readFileSync(filePath, 'utf-8')
})

// IPC: 解析字幕文件
ipcMain.handle('parse-subtitle', async (_event, filePath: string): Promise<SubtitleItem[]> => {
  const content = fs.readFileSync(filePath, 'utf-8')
  const nodes = parseSync(content) as Array<{ type: string; data: { start: number; end: number; text: string } }>
  return nodes
    .filter(node => node.type === 'cue')
    .map(node => ({
      start: node.data.start,
      end: node.data.end,
      text: node.data.text
    }))
})

// IPC: 导出视频片段
ipcMain.handle('export-clip', async (_event, options: {
  inputPath: string
  outputPath: string
  startTime: number
  endTime: number
}) => {
  return new Promise((resolve, reject) => {
    ffmpeg(options.inputPath)
      .setStartTime(options.startTime)
      .setDuration(options.endTime - options.startTime)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset fast', '-crf 22'])
      .output(options.outputPath)
      .on('end', () => resolve({ success: true }))
      .on('error', (err) => reject(err))
      .run()
  })
})

// IPC: 选择保存路径
ipcMain.handle('select-save-path', async (_event, options: { defaultPath?: string }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: options.defaultPath,
    filters: [{ name: 'Video', extensions: ['mp4'] }]
  })
  return result.filePath || null
})

// 格式化时间
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// IPC: 获取配置
ipcMain.handle('get-config', async () => {
  return {
    apiKey: store.get('apiKey'),
    baseURL: store.get('baseURL'),
    model: store.get('model')
  }
})

// IPC: 保存配置
ipcMain.handle('set-config', async (_event, config: Partial<AppConfig>) => {
  if (config.apiKey !== undefined) store.set('apiKey', config.apiKey)
  if (config.baseURL !== undefined) store.set('baseURL', config.baseURL)
  if (config.model !== undefined) store.set('model', config.model)
})

// IPC: AI 分析字幕
ipcMain.handle('analyze-subtitle', async (_event, subtitles: SubtitleItem[]) => {
  const apiKey = store.get('apiKey')
  if (!apiKey) {
    throw new Error('请先在设置中配置 API Key')
  }

  const fullText = subtitles
    .map(s => `[${formatTime(s.start)}] ${s.text}`)
    .join('\n')

  const aiClient = getAIClient()
  const model = store.get('model') || 'qwen-plus'

  const response = await aiClient.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `你是一个直播内容分析专家。分析以下带时间戳的直播字幕，提取核心要点。

每个核心要点必须对应一段连续的视频片段，输出 JSON 格式：

{
  "summary": "整体内容摘要（200字以内）",
  "highlights": [
    {
      "id": "h1",
      "title": "要点标题（简洁，10字以内）",
      "description": "要点的详细说明（50-100字）",
      "startTime": "00:15:30",
      "endTime": "00:18:45",
      "tags": ["干货", "方法论"]
    }
  ]
}

要求：
1. 提取 5-10 个核心要点，每个要点必须有对应的视频时间段
2. 每个片段应包含完整的表达，时长建议 1-5 分钟
3. title 是简短的要点标题，description 是详细说明
4. 时间戳格式为 HH:MM:SS 或 MM:SS
5. tags 用于分类，如：干货、案例、金句、方法论、故事、互动等
6. 按时间顺序排列`
      },
      { role: 'user', content: fullText }
    ],
    response_format: { type: 'json_object' }
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('AI 返回内容为空')
  }

  return JSON.parse(content)
})
