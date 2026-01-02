import { useRef, useState, useEffect } from 'react'
import { Highlight, SubtitleItem } from '../../types'
import { parseTimeToMs, formatTime } from '../../services/subtitle'

interface Props {
  videoPath: string
  highlight: Highlight
  subtitles: SubtitleItem[]
  onBack: () => void
  onExport: (startTime: number, endTime: number) => void
}

export function VideoEditor({ videoPath, highlight, subtitles, onBack, onExport }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [startTime, setStartTime] = useState(() => parseTimeToMs(highlight.startTime) / 1000)
  const [endTime, setEndTime] = useState(() => parseTimeToMs(highlight.endTime) / 1000)
  const [currentSubtitle, setCurrentSubtitle] = useState('')

  // 更新当前字幕
  useEffect(() => {
    const currentMs = currentTime * 1000
    const subtitle = subtitles.find(s => currentMs >= s.start && currentMs <= s.end)
    setCurrentSubtitle(subtitle?.text || '')
  }, [currentTime, subtitles])

  // 视频加载后设置时长
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      videoRef.current.currentTime = startTime
    }
  }

  // 时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // 逐帧控制
  const seekFrame = (delta: number) => {
    if (videoRef.current) {
      const frameTime = 1 / 30 // 假设 30fps
      videoRef.current.currentTime += delta * frameTime
    }
  }

  // 设置为起点/终点
  const setAsStart = () => setStartTime(currentTime)
  const setAsEnd = () => setEndTime(currentTime)

  // 跳转到指定时间
  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  // 计算时间轴上选区的位置
  const getSelectionStyle = () => {
    if (!duration) return { left: '0%', width: '0%' }
    const left = (startTime / duration) * 100
    const width = ((endTime - startTime) / duration) * 100
    return { left: `${left}%`, width: `${width}%` }
  }

  const handleExport = () => {
    onExport(startTime, endTime)
  }

  return (
    <div className="editor-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>编辑精华片段: {highlight.title}</h2>
        <button className="btn btn-secondary" onClick={onBack}>返回列表</button>
      </div>

      {/* 视频预览 */}
      <div className="video-container">
        <video
          ref={videoRef}
          src={`file://${videoPath}`}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          controls
        />
      </div>

      {/* 时间显示 */}
      <div className="time-display">
        <span>当前: {formatTime(currentTime * 1000)}</span>
        <span>选区: {formatTime(startTime * 1000)} - {formatTime(endTime * 1000)}</span>
        <span>时长: {formatTime((endTime - startTime) * 1000)}</span>
      </div>

      {/* 时间轴 */}
      <div className="timeline" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        seekTo(percent * duration)
      }}>
        <div className="timeline-selection" style={getSelectionStyle()} />
      </div>

      {/* 帧控制 */}
      <div className="frame-controls">
        <button className="btn btn-secondary" onClick={() => seekFrame(-10)}>-10帧</button>
        <button className="btn btn-secondary" onClick={() => seekFrame(-1)}>-1帧</button>
        <button className="btn btn-secondary" onClick={() => {
          if (videoRef.current?.paused) {
            videoRef.current.play()
          } else {
            videoRef.current?.pause()
          }
        }}>播放/暂停</button>
        <button className="btn btn-secondary" onClick={() => seekFrame(1)}>+1帧</button>
        <button className="btn btn-secondary" onClick={() => seekFrame(10)}>+10帧</button>
      </div>

      {/* 起止点设置 */}
      <div className="frame-controls">
        <button className="btn btn-secondary" onClick={() => seekTo(startTime)}>跳到起点</button>
        <button className="btn btn-primary" onClick={setAsStart}>设为起点</button>
        <button className="btn btn-primary" onClick={setAsEnd}>设为终点</button>
        <button className="btn btn-secondary" onClick={() => seekTo(endTime)}>跳到终点</button>
      </div>

      {/* 字幕预览 */}
      <div className="subtitle-preview">
        {currentSubtitle || '（当前无字幕）'}
      </div>

      {/* 操作按钮 */}
      <div className="editor-actions">
        <button className="btn btn-secondary" onClick={onBack}>取消</button>
        <button className="btn btn-primary" onClick={handleExport}>
          确认并导出此片段
        </button>
      </div>
    </div>
  )
}
