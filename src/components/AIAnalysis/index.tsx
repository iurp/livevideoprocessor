import { AnalysisResult, Highlight } from '../../types'

interface Props {
  result: AnalysisResult
  onEditHighlight: (highlight: Highlight) => void
  onExportHighlight: (highlight: Highlight) => void
}

export function AIAnalysis({ result, onEditHighlight, onExportHighlight }: Props) {
  return (
    <div>
      {/* 内容摘要 */}
      <div className="result-section">
        <h2>内容摘要</h2>
        <div className="summary-box">
          {result.summary}
        </div>
      </div>

      {/* 精华片段 */}
      <div className="result-section">
        <h2>精华片段 ({result.highlights.length}个)</h2>
        <div className="highlights-list">
          {result.highlights.map((highlight) => (
            <div key={highlight.id} className="highlight-card">
              <div className="highlight-info">
                <h4>{highlight.title}</h4>
                <div className="time">{highlight.startTime} - {highlight.endTime}</div>
                <div className="reason">{highlight.description}</div>
                <div style={{ marginTop: 8 }}>
                  {highlight.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        background: '#333',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        marginRight: 4
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="highlight-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => onEditHighlight(highlight)}
                >
                  编辑
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => onExportHighlight(highlight)}
                >
                  导出
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
