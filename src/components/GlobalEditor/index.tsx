import { useRef, useState, useEffect } from 'react'
import { Highlight, SubtitleItem, AnalysisResult } from '../../types'
import { formatTime, parseTimeToMs } from '../../services/subtitle'
import './styles.css'

// 预定义颜色
const COLORS = [
  '#a78bfa', // 紫色
  '#fbbf24', // 黄色
  '#60a5fa', // 蓝色
  '#f87171', // 红色
  '#34d399', // 绿色
  '#f472b6', // 粉色
  '#fb923c', // 橙色
  '#a3e635', // 青绿
]

interface Props {
  videoPath: string
  highlights: Highlight[]
  subtitles: SubtitleItem[]
  videoDuration: number
  analysisResult: AnalysisResult
  onExport: (highlight: Highlight, startTime: number, endTime: number) => void
  onBack: () => void
}

// 将时间戳转换为 HH:MM:SS 格式
function msToTimeString(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function GlobalEditor({ videoPath, highlights, subtitles, videoDuration, analysisResult, onExport, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(videoDuration || 0)
  const [selectedHighlight, setSelectedHighlight] = useState<number | null>(null)
  const [editingHighlights, setEditingHighlights] = useState<Highlight[]>(() =>
    highlights.map((h, i) => ({ ...h, id: `h${i}` }))
  )
  // 选中的字幕索引集合（用于编辑模式）
  const [selectedSubtitles, setSelectedSubtitles] = useState<Set<number>>(new Set())
  // 右侧面板 Tab 状态
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript')
  // 是否自动跟随
  const [autoScroll, setAutoScroll] = useState(true)

  // 记录上一次选中的切片索引，用于判断是否切换了切片
  const prevSelectedHighlight = useRef<number | null>(null)

  // 当选中切片变化时，更新选中的字幕（只在切换不同切片时触发）
  useEffect(() => {
    if (selectedHighlight === null) {
      setSelectedSubtitles(new Set())
      prevSelectedHighlight.current = null
      return
    }

    // 只有切换到不同切片时才重新计算选中状态
    if (prevSelectedHighlight.current === selectedHighlight) {
      return
    }
    prevSelectedHighlight.current = selectedHighlight

    const h = editingHighlights[selectedHighlight]
    const start = parseTimeToMs(h.startTime)
    const end = parseTimeToMs(h.endTime)

    const selected = new Set<number>()
    subtitles.forEach((s, i) => {
      // 如果字幕与切片有重叠，则选中
      if (s.end > start && s.start < end) {
        selected.add(i)
      }
    })
    setSelectedSubtitles(selected)
  }, [selectedHighlight, editingHighlights, subtitles])

  // 视频加载后设置时长
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  // 时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // 跳转到指定时间
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  // 点击切片跳转
  const handleHighlightClick = (index: number) => {
    setSelectedHighlight(index)
    const h = editingHighlights[index]
    const startSec = parseTimeToMs(h.startTime) / 1000
    seekTo(startSec)
  }

  // 切换字幕选中状态
  const toggleSubtitle = (index: number) => {
    if (selectedHighlight === null) return

    const newSelected = new Set(selectedSubtitles)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedSubtitles(newSelected)

    // 更新切片的时间范围
    if (newSelected.size > 0) {
      const indices = Array.from(newSelected).sort((a, b) => a - b)
      const firstSubtitle = subtitles[indices[0]]
      const lastSubtitle = subtitles[indices[indices.length - 1]]

      const newHighlights = [...editingHighlights]
      newHighlights[selectedHighlight] = {
        ...newHighlights[selectedHighlight],
        startTime: msToTimeString(firstSubtitle.start),
        endTime: msToTimeString(lastSubtitle.end)
      }
      setEditingHighlights(newHighlights)
    }
  }


  // 获取当前时间所在的切片
  const getCurrentHighlightIndex = () => {
    const currentMs = currentTime * 1000
    for (let i = 0; i < editingHighlights.length; i++) {
      const h = editingHighlights[i]
      const start = parseTimeToMs(h.startTime)
      const end = parseTimeToMs(h.endTime)
      if (currentMs >= start && currentMs <= end) {
        return i
      }
    }
    return null
  }

  // 获取字幕所属的切片索引
  const getSubtitleHighlightIndex = (subtitle: SubtitleItem): number | null => {
    for (let i = 0; i < editingHighlights.length; i++) {
      const h = editingHighlights[i]
      const start = parseTimeToMs(h.startTime)
      const end = parseTimeToMs(h.endTime)
      if (subtitle.start >= start && subtitle.end <= end) {
        return i
      }
    }
    return null
  }

  // 自动滚动到当前字幕
  useEffect(() => {
    if (!transcriptRef.current || !autoScroll || activeTab !== 'transcript') return
    const currentMs = currentTime * 1000
    const subtitleElements = transcriptRef.current.querySelectorAll('.subtitle-item')
    for (let i = 0; i < subtitles.length; i++) {
      if (currentMs >= subtitles[i].start && currentMs <= subtitles[i].end) {
        subtitleElements[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        break
      }
    }
  }, [Math.floor(currentTime), autoScroll, activeTab])

  // 导出当前选中的切片
  const handleExport = () => {
    if (selectedHighlight === null) return
    const h = editingHighlights[selectedHighlight]
    const startSec = parseTimeToMs(h.startTime) / 1000
    const endSec = parseTimeToMs(h.endTime) / 1000
    onExport(h, startSec, endSec)
  }

  // 计算时间轴上切片的位置
  const getHighlightStyle = (h: Highlight) => {
    const start = parseTimeToMs(h.startTime) / 1000
    const end = parseTimeToMs(h.endTime) / 1000
    const left = (start / duration) * 100
    const width = ((end - start) / duration) * 100
    return { left: `${left}%`, width: `${width}%` }
  }

  // 格式化时长
  const formatDuration = (startTime: string, endTime: string) => {
    const startMs = parseTimeToMs(startTime)
    const endMs = parseTimeToMs(endTime)
    const durationMs = endMs - startMs
    return formatTime(durationMs)
  }

  const activeIndex = selectedHighlight !== null ? selectedHighlight : getCurrentHighlightIndex()
  const isEditMode = selectedHighlight !== null

  return (
    <div className="global-editor">
      {/* 顶部导航 */}
      <div className="editor-header">
        <button className="btn btn-secondary" onClick={onBack}>← 返回</button>
        <h2>精华片段编辑</h2>
        <div className="header-actions">
          {isEditMode && (
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedHighlight(null)}
            >
              取消选择
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={selectedHighlight === null}
          >
            导出选中片段
          </button>
        </div>
      </div>

      <div className="editor-main">
        {/* 左侧：视频和时间轴 */}
        <div className="editor-left">
          {/* 视频播放器 */}
          <div className="video-wrapper">
            <video
              ref={videoRef}
              src={`file://${videoPath}`}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              controls
            />
          </div>

          {/* 主时间轴 - 带色块标注 */}
          <div className="main-timeline">
            <div
              className="timeline-track"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const percent = (e.clientX - rect.left) / rect.width
                seekTo(percent * duration)
              }}
            >
              {/* 切片色块 */}
              {editingHighlights.map((h, i) => (
                <div
                  key={h.id}
                  className={`timeline-segment ${activeIndex === i ? 'active' : ''}`}
                  style={{
                    ...getHighlightStyle(h),
                    backgroundColor: COLORS[i % COLORS.length]
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleHighlightClick(i)
                  }}
                />
              ))}
              {/* 播放头 */}
              <div
                className="timeline-playhead"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="timeline-time">
              <span>{formatTime(currentTime * 1000)}</span>
              <span>{formatTime(duration * 1000)}</span>
            </div>
          </div>

          {/* 切片列表 */}
          <div className="highlights-panel">
            <div className="panel-title">切片列表 ({editingHighlights.length})</div>
            {editingHighlights.map((h, i) => (
              <div
                key={h.id}
                className={`highlight-item ${activeIndex === i ? 'active' : ''}`}
                onClick={() => handleHighlightClick(i)}
              >
                <span
                  className="highlight-color"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <div className="highlight-info">
                  <span className="highlight-title">{h.title}</span>
                  <span className="highlight-time-range">
                    {h.startTime} - {h.endTime}
                  </span>
                </div>
                <span className="highlight-duration">{formatDuration(h.startTime, h.endTime)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：字幕/摘要面板 */}
        <div className="editor-right">
          {/* Tab 切换 */}
          <div className="right-panel-tabs">
            <button
              className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>
            <button
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
          </div>

          {/* Transcript Tab */}
          {activeTab === 'transcript' && (
            <>
              <div className="transcript-header">
                <div className="transcript-actions">
                  {isEditMode && (
                    <span className="edit-hint">勾选字幕调整范围</span>
                  )}
                  <label className="auto-scroll-toggle">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                    />
                    <span>自动跟随</span>
                  </label>
                  <button
                    className="btn-small"
                    onClick={() => {
                      if (!transcriptRef.current) return
                      const currentMs = currentTime * 1000
                      const subtitleElements = transcriptRef.current.querySelectorAll('.subtitle-item')
                      for (let i = 0; i < subtitles.length; i++) {
                        if (currentMs >= subtitles[i].start && currentMs <= subtitles[i].end) {
                          subtitleElements[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          break
                        }
                      }
                    }}
                  >
                    ↓ 跳转到当前
                  </button>
                </div>
              </div>
              <div className="transcript-panel" ref={transcriptRef}>
                {subtitles.map((s, i) => {
                  const highlightIndex = getSubtitleHighlightIndex(s)
                  const isInHighlight = highlightIndex !== null
                  const isActiveHighlight = highlightIndex === activeIndex && activeIndex !== null
                  const isCurrent = currentTime * 1000 >= s.start && currentTime * 1000 <= s.end
                  const isSelected = selectedSubtitles.has(i)

                  return (
                    <div
                      key={i}
                      className={`subtitle-item ${isActiveHighlight ? 'highlighted' : ''} ${isCurrent ? 'current' : ''} ${isEditMode ? 'edit-mode' : ''} ${isSelected ? 'selected' : ''}`}
                      style={isInHighlight && !isEditMode ? {
                        backgroundColor: `${COLORS[highlightIndex % COLORS.length]}20`,
                        borderLeftColor: COLORS[highlightIndex % COLORS.length]
                      } : isSelected ? {
                        backgroundColor: `${COLORS[selectedHighlight! % COLORS.length]}30`,
                        borderLeftColor: COLORS[selectedHighlight! % COLORS.length]
                      } : {}}
                      onClick={() => {
                        if (isEditMode) {
                          toggleSubtitle(i)
                        } else {
                          seekTo(s.start / 1000)
                        }
                      }}
                    >
                      {isEditMode && (
                        <input
                          type="checkbox"
                          className="subtitle-checkbox"
                          checked={isSelected}
                          onChange={() => toggleSubtitle(i)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div className="subtitle-content">
                        <span className="subtitle-time">{formatTime(s.start)}</span>
                        <span className="subtitle-text">{s.text}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="summary-panel">
              <div className="summary-section">
                <h4>内容摘要</h4>
                <p className="summary-text">{analysisResult.summary}</p>
              </div>

              <div className="summary-section">
                <h4>核心要点 ({editingHighlights.length})</h4>
                <ul className="key-points-list">
                  {editingHighlights.map((h, i) => (
                    <li
                      key={h.id}
                      className={`key-point-item ${activeIndex === i ? 'active' : ''}`}
                      onClick={() => handleHighlightClick(i)}
                    >
                      <div className="key-point-header">
                        <span
                          className="key-point-color"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <strong>{h.title}</strong>
                        <span className="key-point-time">{h.startTime}</span>
                      </div>
                      <p>{h.description}</p>
                      <div className="key-point-tags">
                        {h.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
