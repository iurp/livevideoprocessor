import { useState } from 'react'
import { VideoImport } from './components/VideoImport'
import { GlobalEditor } from './components/GlobalEditor'
import { Settings } from './components/Settings'
import { AppStep, SubtitleItem, AnalysisResult, Highlight } from './types'

function App() {
  const [step, setStep] = useState<AppStep>('import')
  const [videoPath, setVideoPath] = useState<string | null>(null)
  const [subtitlePath, setSubtitlePath] = useState<string | null>(null)
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // 处理字幕文件选择
  const handleSubtitleSelect = async (path: string) => {
    setSubtitlePath(path)
    try {
      const parsed = await window.electronAPI.parseSubtitle(path)
      setSubtitles(parsed)
    } catch (err) {
      setError('字幕解析失败')
      console.error(err)
    }
  }

  // 开始 AI 分析
  const handleAnalyze = async () => {
    if (subtitles.length === 0) {
      setError('请先选择字幕文件')
      return
    }

    setStep('analyzing')
    setError(null)

    try {
      const result = await window.electronAPI.analyzeSubtitle(subtitles)
      setAnalysisResult(result)
      setStep('result')
    } catch (err) {
      setError('AI 分析失败，请检查 API Key 配置')
      setStep('import')
      console.error(err)
    }
  }

  // 导出精华片段
  const handleExport = async (highlight: Highlight, startTime: number, endTime: number) => {
    if (!videoPath) return

    const outputPath = await window.electronAPI.selectSavePath({
      defaultPath: `${highlight.title.replace(/[/\\?%*:|"<>]/g, '-')}.mp4`
    })

    if (!outputPath) return

    try {
      await window.electronAPI.exportClip({
        inputPath: videoPath,
        outputPath,
        startTime,
        endTime
      })
      alert('导出成功！')
    } catch (err) {
      alert('导出失败：' + (err as Error).message)
    }
  }

  // 计算视频总时长（从字幕推算）
  const getVideoDuration = () => {
    if (subtitles.length === 0) return 0
    return subtitles[subtitles.length - 1].end / 1000
  }

  return (
    <div className="app">
      {/* 设置按钮 - 始终显示在右上角 */}
      <button
        className="settings-btn"
        onClick={() => setShowSettings(true)}
        title="设置"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
      </button>

      {/* 设置弹窗 */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {step === 'import' && (
        <>
          <div className="header">
            <h1>直播回放智能处理器</h1>
            <p>AI 自动分析 · 精华提取 · 一键剪辑</p>
          </div>

          {error && (
            <div style={{
              background: '#7f1d1d',
              padding: 12,
              borderRadius: 8,
              marginBottom: 20,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <VideoImport
            videoPath={videoPath}
            subtitlePath={subtitlePath}
            onVideoSelect={setVideoPath}
            onSubtitleSelect={handleSubtitleSelect}
            onAnalyze={handleAnalyze}
            isReady={!!videoPath && subtitles.length > 0}
          />
        </>
      )}

      {step === 'analyzing' && (
        <>
          <div className="header">
            <h1>直播回放智能处理器</h1>
            <p>AI 自动分析 · 精华提取 · 一键剪辑</p>
          </div>
          <div className="loading">
            <div className="spinner" />
            <p>AI 正在分析内容，请稍候...</p>
            <p style={{ color: '#666', fontSize: 14, marginTop: 8 }}>
              分析时长取决于字幕长度，通常需要 10-30 秒
            </p>
          </div>
        </>
      )}

      {step === 'result' && analysisResult && videoPath && (
        <GlobalEditor
          videoPath={videoPath}
          highlights={analysisResult.highlights}
          subtitles={subtitles}
          videoDuration={getVideoDuration()}
          analysisResult={analysisResult}
          onExport={handleExport}
          onBack={() => setStep('import')}
        />
      )}
    </div>
  )
}

export default App
