
interface Props {
  videoPath: string | null
  subtitlePath: string | null
  onVideoSelect: (path: string) => void
  onSubtitleSelect: (path: string) => void
  onAnalyze: () => void
  isReady: boolean
}

export function VideoImport({ videoPath, subtitlePath, onVideoSelect, onSubtitleSelect, onAnalyze, isReady }: Props) {
  const handleSelectVideo = async () => {
    const path = await window.electronAPI.selectFile({
      filters: [{ name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv'] }]
    })
    if (path) onVideoSelect(path)
  }

  const handleSelectSubtitle = async () => {
    const path = await window.electronAPI.selectFile({
      filters: [{ name: 'Subtitle', extensions: ['srt', 'ass', 'vtt'] }]
    })
    if (path) onSubtitleSelect(path)
  }

  const getFileName = (path: string | null) => {
    if (!path) return null
    return path.split('/').pop()
  }

  return (
    <div>
      <div className="import-section">
        <div
          className={`drop-zone ${videoPath ? 'has-file' : ''}`}
          onClick={handleSelectVideo}
        >
          <h3>{videoPath ? '已选择视频' : '点击选择视频文件'}</h3>
          {videoPath && <p className="filename">{getFileName(videoPath)}</p>}
          {!videoPath && <p style={{ color: '#666', fontSize: 14 }}>支持 MP4, MOV, AVI, MKV</p>}
        </div>

        <div
          className={`drop-zone ${subtitlePath ? 'has-file' : ''}`}
          onClick={handleSelectSubtitle}
        >
          <h3>{subtitlePath ? '已选择字幕' : '点击选择字幕文件'}</h3>
          {subtitlePath && <p className="filename">{getFileName(subtitlePath)}</p>}
          {!subtitlePath && <p style={{ color: '#666', fontSize: 14 }}>支持 SRT, ASS, VTT</p>}
        </div>
      </div>

      <div className="action-bar">
        <button
          className="btn btn-primary"
          onClick={onAnalyze}
          disabled={!isReady}
        >
          开始 AI 分析
        </button>
      </div>
    </div>
  )
}
