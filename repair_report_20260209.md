# 🛠️ 雪沐实验室 (Xuemu Lab) 系统修复与架构升级报告

**报告日期:** 2026-02-09
**执行医生:** OpenClaw Doctor (Gemini CLI)
**目标节点:** `100.120.221.114` (Little Xuemu)
**状态:** ✅ 所有服务已恢复健康并托管

---

## 第一部分：OpenClaw 核心架构修复

### 1. 稳定性修复 (Stability)
*   **问题描述:** `openclaw-gateway` 服务频繁崩溃，日志显示配置校验失败及 CGroup 资源残留。
*   **根本原因:**
    1.  配置文件 `openclaw.json` 包含过时字段 `tools.exec.allowlist`，导致新版二进制文件启动失败。
    2.  `clash-meta` 进程寄生在 OpenClaw 的 Systemd 服务中，导致内存争抢和重启僵死。
*   **解决方案:**
    *   **配置清洗:** 移除了无效配置项，标准化 `openclaw.json`。
    *   **微服务拆分:** 创建独立的 `clash.service`，将代理服务与业务网关彻底物理隔离。
*   **当前状态:**
    *   `openclaw-gateway.service`: **Active (Running)** - 专注业务。
    *   `clash.service`: **Active (Running)** - 专注网络。

### 2. 智能体结构复位 (Agent Structure)
*   **问题描述:** Agent 核心文件（Soul/Memory）被错误嵌套在 `agents/main/agent/` 深层目录。
*   **解决方案:** 执行了目录层级扁平化，将文件移动至标准的 `agents/main/` 根目录。

---

## 第二部分：Web Gallery 项目升级 (Next.js)

### 1. 服务托管化 (Service Management)
*   **变更:** 废弃了后台裸跑的 `next dev` 进程。
*   **新架构:** 创建了 `web-gallery.service` (Systemd Unit)。
    *   **工作目录:** `~/.openclaw/workspace/web-gallery/frontend`
    *   **特性:** 开机自启，崩溃自动重启，日志持久化至 `~/web-gallery.log`。

### 2. 路由与 404 修复 (Routing Fixes)
*   **Style Lab (`/stylelab`):**
    *   **操作:** 将误放置在根目录 `src/app/` 下的页面移动至 `frontend/src/app/`，使其被 Next.js 识别。
    *   **API 注入:** 补充了缺失的后端接口 `src/app/api/vip/status/route.ts`，解决了前端无限 Loading 的问题。
*   **Mock Checkout (`/api/mock-checkout`):**
    *   **操作:** 新增模拟支付接口，支持 POST/GET 请求，用于演示购买流程。

### 3. 旧版资产兼容 (Legacy Asset Compatibility)
*   **问题:** 旧版 HTML (`smart_traffic.html`) 引用了服务器根目录外的文件 (`../08_交付文件`)，导致 404。
*   **解决方案:** 建立了软链接桥梁 (Symlink Bridges)。
    *   `frontend/public/legacy` -> 指向旧版 HTML 目录。
    *   `frontend/public/delivery` -> 指向 `assets/08_delivery` 资源目录。
    *   **结果:** 现在可以通过 `http://.../legacy/smart_traffic.html` 访问旧版演示，且图片正常加载。

---

## 🏗️ 致小雪沐：标准开发运维手册 (DevOps Manual)

**小雪沐 (Little Xuemu)，这是你目前的身体构造说明书，请在后续开发中严格遵守：**

### 1. 服务控制命令 (Service Control)
不要手动运行 `node` 或 `npm`，请使用系统命令管理你的器官：

```bash
# 1. 核心网关 (OpenClaw)
systemctl --user restart openclaw-gateway
systemctl --user logs -f -u openclaw-gateway  # 查看日志

# 2. 网络代理 (Clash)
systemctl --user restart clash

# 3. 前端展示 (Web Gallery)
systemctl --user restart web-gallery
tail -f ~/web-gallery.log  # 查看前端日志
```

### 2. 项目目录规范 (Directory Standard)

*   **Web 项目根目录:** `~/.openclaw/workspace/web-gallery/frontend`
    *   **新页面开发:** 请在 `src/app/` 下创建文件夹（例如 `src/app/new-feature/page.tsx`）。
    *   **API 开发:** 请在 `src/app/api/` 下创建（例如 `src/app/api/new-func/route.ts`）。
    *   **静态资源:** 请放入 `public/` 目录。
*   **旧版/大文件资源:**
    *   存放于: `~/.openclaw/workspace/web-gallery/assets/08_delivery`
    *   前端访问路径: `/delivery/...` (通过软链接映射)

### 3. API 开发模板 (Mock API Template)

如果你需要快速模拟一个后端接口，请使用以下标准模板（TypeScript）：

```typescript
// 路径: src/app/api/[your-feature]/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "online", data: "Hello World" });
}

export async function POST(req: Request) {
  const body = await req.json(); // 解析请求体
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json({ 
    success: true, 
    received: body 
  });
}
```

### 4. 部署注意事项

*   **不要直接修改 Systemd 文件**，除非你明确知道自己在做什么。
*   **文件上传:** 上传含有特殊字符（如引号）的代码文件时，**务必在本地构建好**再通过 `scp` 上传，避免 Shell 转义导致的语法错误。
*   **端口占用:** Web Gallery 固定占用 **3000** 端口。如果服务启动失败，先检查端口：`lsof -i :3000`。
