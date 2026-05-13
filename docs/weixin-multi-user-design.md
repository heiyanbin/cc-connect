# cc-connect 微信平台设计分析

本文档分析 cc-connect 微信平台的设计，特别是微信用户、token、project、session 之间的关系和限制。

---

## ilink 微信 Bridge 机制

### 什么是 ilink

微信没有开放的官方 API，所以 cc-connect 使用 **ilink 机器人 HTTP 网关** 作为中间层：

- ilink 服务运行在云端（腾讯官方提供）
- 用户扫描 QR 登录 ilink，绑定一个微信个人号
- ilink 为这个绑定分配 API token，cc-connect 用这个 token 调用 ilink API
- 通过 ilink API，cc-connect 可以收发消息、上传下载媒体等

### QR 扫码流程详解

```
┌─────────────────────────────────────────────────────────────────┐
│                     QR 扫码流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 用户请求扫码 (setupWeixinBegin)                              │
│     └─ cc-connect 调用 ilink API: get_bot_qrcode                │
│     └─ ilink 返回 QR 码图片 URL                                  │
│                                                                 │
│  2. 用户用微信扫码确认                                            │
│     └─ 微信客户端打开 QR URL                                     │
│     └─ 用户确认登录                                              │
│                                                                 │
│  3. cc-connect 轮询扫码状态 (setupWeixinPoll)                    │
│     └─ 调用 ilink API: get_qrcode_status                        │
│     └─ 状态: wait → scaned → confirmed                          │
│                                                                 │
│  4. 扫码确认后，ilink 返回:                                       │
│     ┌────────────────────────────────────────────────────────┐  │
│     │ bot_token      : ilink 分配的 API token                │  │
│     │ ilink_bot_id   : ilink bot 标识                        │  │
│     │ ilink_user_id  : 扫码的微信用户 ID                      │  │
│     │ base_url       : ilink API 地址                        │  │
│     └────────────────────────────────────────────────────────┘  │
│                                                                 │
│  5. cc-connect 保存配置 (setupWeixinSave)                        │
│     └─ 将 token 写入 config.toml                                │
│     └─ 返回 restart_required: true                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Token 和微信用户的关系

**关键理解：一个 token 只对应一个微信用户**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Token 与用户的绑定                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ilink 服务                                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Token A ────────────────────► 微信用户 A              │  │
│   │   (user_a@im.wechat)             (扫码确认的用户)        │  │
│   │                                                         │  │
│   │   Token B ────────────────────► 微信用户 B              │  │
│   │   (user_b@im.wechat)             (扫码确认的用户)        │  │
│   │                                                         │  │
│   │   ...                                                   │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   使用 Token A 调用 ilink API:                                  │
│   - getUpdates(): 只收到微信用户 A 发给 bot 的消息              │
│   - sendMessage(): 只能发消息给微信用户 A                        │
│                                                                 │
│   Token A 和 Token B 是完全隔离的                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## cc-connect 配置机制

### Project 与 Platform 的配置结构

```toml
# config.toml 示例

[[projects]]
name = "my-agent"

[projects.agent]
type = "claudecode"

[[projects.platforms]]
type = "weixin"

[projects.platforms.options]
token = "Bearer xxx"           # ilink API token
allow_from = "user_a@im.wechat" # 允许的微信用户
```

**关键限制：一个 project 的 weixin platform 只能配置一个 token**

```go
// config/config.go:1938
func firstWeixinPlatformIndex(platforms []PlatformConfig) int {
    for i := range platforms {
        if platforms[i].Type == "weixin" {
            return i  // 只找第一个，不会遍历所有
        }
    }
    return -1
}
```

### SaveWeixinPlatformCredentials 覆盖逻辑

```go
// config/config.go:2165
platform.Options["token"] = token  // 新 token 直接覆盖旧 token
```

**新用户扫码时的行为**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    新用户扫码覆盖 token                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   原配置:                                                       │
│   token = "Token_A" (对应微信用户 A)                             │
│                                                                 │
│   新用户 B 扫码:                                                 │
│   └─ ilink 返回 Token_B                                         │
│   ─ SaveWeixinPlatformCredentials 把 token 改为 Token_B         │
│                                                                 │
│   结果:                                                         │
│   token = "Token_B" (对应微信用户 B)                             │
│   Token_A 被覆盖，微信用户 A 的连接失效                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## cc-connect 运行机制

### 进程启动流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    cc-connect 进程启动                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. 读取 config.toml                                           │
│                                                                 │
│   2. 为每个 project 创建 Engine                                  │
│      └─ 为每个 platform 配置创建 Platform 实例                   │
│         └─ weixin platform 使用 config.toml 中的 token          │
│                                                                 │
│   3. 启动所有 Engine                                            │
│      └─ 每个 Engine 启动其所有 Platform                         │
│         └─ weixin platform 开始 poll loop (getUpdates)          │
│                                                                 │
│   4. 运行中                                                      │
│      └─ Platform 实例持续运行，不会动态加载新配置                 │
│      └─ config.toml 的修改不会影响运行中的实例                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```go
// cmd/cc-connect/main.go:238-251
for _, pc := range proj.Platforms {
    opts := make(map[string]any, len(pc.Options)+2)
    for k, v := range pc.Options {
        opts[k] = v  // token 来自配置文件
    }
    p, err := core.CreatePlatform(pc.Type, opts)  // 创建时确定
    platforms = append(platforms, p)
}
```

### 为什么需要重启

**配置修改后必须重启进程**：

- Platform 实例在进程启动时创建
- token 在创建时从配置读取，固化在实例中
- 运行时不动态读取配置文件
- 修改 config.toml 后，必须重启才能创建新的 Platform 实例

**restart_required: true 表示整个 cc-connect 进程重启，不是某个 project 重启**

---

## Session Key 机制

### Session Key 格式

```go
// platform/weixin/weixin.go:456
SessionKey: sessionKeyPrefix + fromUserID
// 结果: "weixin:dm:{ilink_user_id}"
```

**session_key 用于区分不同的对话 session**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Session Key 作用                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   微信用户 A 发消息:                                             │
│   └─ from_user_id = "user_a@im.wechat"                          │
│   └─ session_key = "weixin:dm:user_a@im.wechat"                 │
│                                                                 │
│   微信用户 B 发消息:                                             │
│   └─ from_user_id = "user_b@im.wechat"                          │
│   └─ session_key = "weixin:dm:user_b@im.wechat"                 │
│                                                                 │
│   Engine 用 session_key 管理:                                   │
│   └─ 各自的对话历史                                              │
│   └─ 各自的 Agent session                                       │
│   └─ 各自的状态                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 问题：Token 覆盖导致 Session Key 失效

**即使 session_key 不同，如果 token 被覆盖，旧用户的消息无法收到**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Token 覆盖的影响                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   初始状态:                                                     │
│   ┌───────────────────────────────────────────────────────────┐│
│   │ Platform 实例: token = Token_A                            ││
│   │ Poll loop: getUpdates(Token_A)                            ││
│   │            └─ 只收到微信用户 A 的消息                      ││
│   └───────────────────────────────────────────────────────────┘│
│                                                                 │
│   新用户 B 扫码后 (未重启):                                      │
│   ┌───────────────────────────────────────────────────────────┐│
│   │ Platform 实例: token = Token_A (还是旧的！)               ││
│   │ config.toml: token = Token_B (新配置，但未加载)           ││
│   │                                                            ││
│   │ 微信用户 A: 正常工作                                       ││
│   │ 微信用户 B: 无法收到消息（token 还是 Token_A）            ││
│   └───────────────────────────────────────────────────────────┘│
│                                                                 │
│   重启后:                                                       │
│   ┌───────────────────────────────────────────────────────────┐│
│   │ Platform 实例: token = Token_B (新配置)                   ││
│   │ Poll loop: getUpdates(Token_B)                            ││
│   │            └─ 只收到微信用户 B 的消息                      ││
│   │                                                            ││
│   │ 微信用户 A: 断开（Token_A 失效）                           ││
│   │ 微信用户 B: 正常工作                                       ││
│   └───────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 设计总结

### cc-connect 的设计假设

```
┌─────────────────────────────────────────────────────────────────┐
│                    设计假设                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   一个 Project = 一个人 + 多个账号                               │
│                                                                 │
│   ┌───────────────────────────────────────────────────────────┐│
│   │                    我的 Agent                              ││
│   │                                                            ││
│   │   ├── 微信个人号                ││
│   │   ├── 飞书                                ││
│   │   ├── Telegram (type = "telegram")                        ││
│   │   └── ...                                                 ││
│   │                                                            ││
│   │   每种平台类型只需要一个连接                               ││
│   │   都是我自己的账号                                         ││
│   └───────────────────────────────────────────────────────────┘│
│                                                                 │
│   这个人可以用不同账号和 Agent 对话                              │
│   但每个账号类型只有一个                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 实际需求的矛盾

**需求：一个 project 服务多个完全无关的微信用户**

```
┌─────────────────────────────────────────────────────────────────┐
│                    实际需求                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   一个 Project = 多个独立用户                                    │
│                                                                 │
│   ┌───────────────────────────────────────────────────────────┐│
│   │                  公共 Agent                                ││
│   │                                                            ││
│   │   ├── 微信用户 A (需要 Token_A)                            ││
│   │   ├── 微信用户 B (需要 Token_B)                            ││
│   │   ├── 微信用户 C (需要 Token_C)                            ││
│   │   └── ...                                                 ││
│   │                                                            ││
│   │   每个用户有独立的 ilink token                             ││
│   │   需要同时连接                                             ││
│   └───────────────────────────────────────────────────────────┘│
│                                                                 │
│   当前设计不支持                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 核心限制

| 层面 | 当前设计 | 多用户需求 |
|------|----------|------------|
| **配置** | 一个 project 只存一个 weixin token | 需要多个 token |
| **运行** | 一个 project 只运行一个 weixin platform 实例 | 需要多个实例 |
| **消息** | 一个 token 只能收发一个用户的消息 | 需要同时处理多个用户 |

---

## 支持多用户的可行方案

### 方案一：创建多个 Project

**最简单的方式**：

```toml
[[projects]]
name = "agent-for-user-a"

[[projects.platforms]]
type = "weixin"
[projects.platforms.options]
token = "Token_A"

[[projects]]
name = "agent-for-user-b"

[[projects.platforms]]
type = "weixin"
[projects.platforms.options]
token = "Token_B"
```

**优点**：
- 符合当前设计
- 每个用户有独立的 project、token、session
- 互不影响

**缺点**：
- 每个用户需要记住不同的 project 名称
- 如果想让用户共享同一个 Agent 配置，需要手动复制

### 方案二：后端支持多个 weixin platform

**架构改动**：

1. **配置系统**：允许一个 project 配置多个 `[[projects.platforms]]` 且 `type = "weixin"`

2. **运行系统**：启动时为每个 weixin platform 配置创建独立实例

3. **消息路由**：Engine 根据消息的 session_key 路由到对应的 platform 实例

**需要的改动**：

```go
// config/config.go 改动
func allWeixinPlatformIndices(platforms []PlatformConfig) []int {
    var indices []int
    for i := range platforms {
        if platforms[i].Type == "weixin" {
            indices = append(indices, i)
        }
    }
    return indices  // 返回所有 weixin platform，不只是第一个
}
```

**优点**：
- 支持多用户同时连接
- 用户访问同一个 project，体验一致

**缺点**：
- 改动较大，涉及配置系统、启动机制、消息路由
- 需要仔细设计 token 管理、session 隔离

### 方案三：前端过滤（短期缓解）

**只改前端**：

```typescript
// ChatView.tsx
const userSessionKey = getSessionKey(name);  // localStorage 中用户自己的 session_key
const userSessions = sessions.filter(s => s.session_key === userSessionKey);
```

**效果**：
- 每个浏览器只显示自己的对话
- 不解决"新用户导致旧用户断开"的根本问题

**适用场景**：
- 用户只是查看历史对话，不期望同时使用
- 快速缓解问题，等待后端改动

---

## 结论

1. **当前设计是合理的**：一个 project 为一个人服务，这个人可以用多种账号和 Agent 对话

2. **多用户需求是不同的场景**：如果需要服务多个独立用户，当前设计不支持

3. **推荐方案**：
   - **短期**：创建多个 project，每个用户一个
   - **长期**：如果确实需要共享 project，需要后端架构改动

4. **前端问题可以快速解决**：让每个用户只看到自己的对话历史，不影响其他用户