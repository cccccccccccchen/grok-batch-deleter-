# ⚠️ Grok Batch Deleter - 已废弃

**该项目已停止维护**。

**原因**：2026年5月 Grok 官方已在 https://grok.com/files 页面上线了**原生批量多选删除**功能，无需再使用此脚本。

✅ **推荐使用官方功能**：
- 进入 https://grok.com/files
- 勾选左侧复选框多选文件
- 点击上方「Delete」按钮即可批量删除

---

**历史版本**（仅供参考）：
- 最后可用版本：v5.1（适配旧版界面）
- 本仓库已归档，不再更新。

批量删除 Grok 文件管理页面的文件。

## 功能

- 批量删除文件（自动滚动加载更多）
- 按扩展名跳过（如 .pdf、.jpg）
- 按文件名关键词跳过
- 逐个处理，确认弹窗自动点击
- 记忆用户配置
- 开始前确认提示

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. greasyfork直接安装 https://greasyfork.org/zh-CN/scripts/577233-grok-batch-deleter
3. 打开 https://grok.com/files 开始使用

## 使用方法

1. 设置要跳过的扩展名和关键词
2. 点击"开始删除"
3. 确认配置后自动执行

## 作者

- **Edison** - 二次开发
- **Vishwas R** - [原始项目](https://github.com/vishwas-r/Grok-Batch-Deleter)

## 协议

MIT
