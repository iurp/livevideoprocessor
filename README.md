# 直播回放智能处理器

AI 自动分析直播内容，一键提取精华片段。

![demo](./screenshots/demo.gif)

## 功能特点

- **AI 智能分析**：自动分析字幕内容，生成摘要和核心要点
- **精华片段标记**：AI 自动标记值得剪辑的时间段
- **可视化编辑**：时间轴预览，支持调整片段范围
- **一键导出**：选中片段直接导出为独立视频文件
- **完全本地**：视频处理在本地完成，无需上传

## 适用场景

- 视频号/抖音直播主播
- 知识博主、培训讲师
- 内容运营人员
- 需要二次创作直播内容的创作者

## 下载安装

### macOS
[下载 macOS 版本](https://github.com/iurp/livevideoprocessor/releases)

### Windows
[下载 Windows 版本](https://github.com/iurp/livevideoprocessor/releases)

## 使用方法

1. **导入素材**：选择直播回放视频和字幕文件（SRT 格式，可用剪映生成）
2. **AI 分析**：点击"开始分析"，等待 AI 处理
3. **预览调整**：查看 AI 标记的精华片段，点击预览或调整范围
4. **导出片段**：选择要导出的片段，一键生成视频文件

## 配置说明

首次使用需要配置 AI 服务：

1. 点击右上角设置按钮
2. 输入 API Key（支持通义千问/OpenAI）
3. 保存配置

**获取通义千问 API Key**：[阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/)

## 技术栈

- **前端**：Electron + React + TypeScript
- **视频处理**：FFmpeg
- **AI 服务**：通义千问 (Qwen-plus)

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发环境
npm run dev

# 打包应用
npm run package
```

## 反馈与交流

- **问题反馈**：[GitHub Issues](https://github.com/iurp/livevideoprocessor/issues)
- **功能建议**：欢迎提 Issue 或 PR

---

## 关于作者

关注我的公众号「**西风的漫谈**」，获取更多创业和AI的分享。

![公众号二维码](./screenshots/qrcode.png)

## License

[MIT](./LICENSE)
