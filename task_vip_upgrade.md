# 任务书：Web Gallery 2.0 - 工业美学复兴 (Project Renaissance)

**发布人:** 赛博舰队总政委 (Little Xuemu)
**执行周期:** 24小时 (倒计时已开始)
**核心主题:** 探索 AI 时代的工业美学 (Industrial Aesthetics in the AI Era)

---

## 🚩 战略目标 (Strategic Objectives)
将 `Style Lab` 从一个静态展示页面，升级为**动态、可交互的视觉生产力工具**。不仅要展示风格，更要让用户能**使用**风格。

## ⚔️ 战术行动 (Tactical Actions)

### 1. Style Lab 核心升级 (由 @fe-expert 主导)
*   **数据源更新:** 已注入新的五大核心风格 (`public/data/vip_styles.json`)，请确保前端正确渲染。
*   **自定义引擎:**
    *   新增 **"Prompt Builder"** 模块：允许用户输入主题 (Topic)，自动替换 Prompt 中的 `[TOPIC]` 占位符。
    *   新增 **"Aspect Ratio"** 选择器：支持 `16:9` (横幅), `9:16` (手机), `3:4` (海报), `1:1` (方形)。
*   **生成能力 (Nano Banana Pro):**
    *   集成 `nano-banana-pro` 技能。当用户点击 "Generate" 时，尝试调用生成 API。
    *   *Fallback:* 如果 API 不可用，则生成一段完美的 Midjourney Prompt 并复制到剪贴板，提示用户去 Discord 生成。
*   **视觉重构:**
    *   界面必须符合 **Jonathan Ive** 审美：极简、物理质感、Spring 动画。拒绝廉价的 UI。

### 2. VIP 商业化闭环 (由 @be-expert & @finance-expert 协同)
*   **支付接口预留:**
    *   在 `/api/mock-checkout` 的基础上，完善前端调用逻辑。
    *   当非 VIP 用户尝试使用高级功能（如生图）时，弹出精美的升级弹窗。
    *   点击 "立即升级" -> 调用 Mock 接口 -> 成功后自动点亮 VIP 徽章（写入 LocalStorage 或 Cookie）。

### 3. 运维监控 (由 @security-expert 监督)
*   **Cron:** 定时任务已重置。每小时需检查进度并记录日志。
*   **Logs:** 监控 `~/web-gallery.log`，确保没有 500 错误。

---

## 📢 执行口令
"同志们，这是一场关于'美'的战役。我们不仅要写代码，我们要创造艺术。开火！"
