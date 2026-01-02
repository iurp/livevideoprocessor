import { useState, useEffect } from 'react'
import './styles.css'

interface SettingsProps {
  onClose: () => void
}

interface AppConfig {
  apiKey: string
  baseURL: string
  model: string
}

const DEFAULT_CONFIG: AppConfig = {
  apiKey: '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen-plus'
}

export function Settings({ onClose }: SettingsProps) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 加载配置
  useEffect(() => {
    window.electronAPI.getConfig().then((savedConfig: Partial<AppConfig>) => {
      setConfig({ ...DEFAULT_CONFIG, ...savedConfig })
    })
  }, [])

  // 保存配置
  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      await window.electronAPI.setConfig(config)
      setMessage({ type: 'success', text: '配置已保存' })
      setTimeout(() => setMessage(null), 2000)
    } catch (err) {
      setMessage({ type: 'error', text: '保存失败：' + (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>设置</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>AI 模型配置</h3>
            <p className="section-desc">配置用于分析字幕的 AI 服务</p>

            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="输入你的 API Key"
              />
              <span className="help-text">
                通义千问: 从 <a href="https://dashscope.console.aliyun.com/" target="_blank" rel="noreferrer">阿里云控制台</a> 获取
              </span>
            </div>

            <div className="form-group">
              <label>API Base URL</label>
              <input
                type="text"
                value={config.baseURL}
                onChange={(e) => setConfig({ ...config, baseURL: e.target.value })}
                placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
              />
              <span className="help-text">
                默认为通义千问，也可改为 OpenAI 兼容的其他服务
              </span>
            </div>

            <div className="form-group">
              <label>模型名称</label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
              >
                <option value="qwen-plus">qwen-plus (推荐)</option>
                <option value="qwen-turbo">qwen-turbo (更快)</option>
                <option value="qwen-max">qwen-max (更强)</option>
                <option value="gpt-4o">gpt-4o (OpenAI)</option>
                <option value="gpt-4o-mini">gpt-4o-mini (OpenAI)</option>
              </select>
            </div>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  )
}
