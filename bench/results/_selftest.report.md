# 自检（桩 webpack，非真实测量）

生成时间：2026-09-14T03:06:57.868Z　|　仓库：`D:\work\vscode4w\Elpis\bench\fixtures\stub-elpis` @ `84bd1f0`　|　Node v18.19.0　|　13th Gen Intel(R) Core(TM) i5-13500H × 16 核　|　内存 15.7 GB

口径：冷构建 = 每个变体 1 个**全新进程** + `cache:false`，取中位数；增量 = watch 模式触碰 `app/pages/dashboard/dashboard.vue`（模式 `content`），测「写盘 → 编译 done」；体积 = 磁盘实际产物字节 + gzip(level 9)。

## 1. 冷构建：耗时与产物体积

| 变体 | 编译耗时（中位） | 最小 ~ 最大 | 进程墙钟（中位） | 产物 raw | 产物 gzip | 相对基线 | 成功/总次数 |
|---|---|---|---|---|---|---|---|
| prod.before（基线） | 2 ms | 2 ms ~ 2 ms | 28 ms | 0.5 KB | 0.1 KB | 耗时 基线　体积 基线 | 1/1 |
| prod.after（对比 prod.before） | 1 ms | 1 ms ~ 1 ms | 38 ms | 0.5 KB | 0.1 KB | 耗时 -50%　体积 0% | 1/1 |
| prod.nothreads（对比 prod.after） | 1 ms | 1 ms ~ 1 ms | 25 ms | 0.5 KB | 0.1 KB | 耗时 0%　体积 0% | 1/1 |
| dev.nohmr（基线） | 1 ms | 1 ms ~ 1 ms | 22 ms | 0.5 KB | 0.1 KB | 耗时 基线　体积 基线 | 1/1 |
| dev.hmr（对比 dev.nohmr） | 1 ms | 1 ms ~ 1 ms | 34 ms | 0.5 KB | 0.1 KB | 耗时 0%　体积 0% | 1/1 |

> 变体说明：prod.before = 生产构建 · 优化前（只有基础配置：无拆分、无 CSS 提取、无压缩、单线程）；prod.after = 生产构建 · 现状（splitChunks + runtimeChunk + CSS 提取/压缩 + Terser + Happypack 多线程）；prod.nothreads = 生产构建 · 现状但关闭所有并发（Happypack → 直接 loader，Terser parallel=false）；dev.nohmr = 开发态 · 同一份配置关掉 HMR（无 client 注入、无 HotModuleReplacementPlugin）；dev.hmr = 开发态 · 自研 dev server（dev-middleware + hot-middleware + HotModuleReplacementPlugin）

## 2. 产物体积构成（按 gzip 降序，前 8）

| 文件 | 优化前 raw | 优化前 gzip | 优化后 raw | 优化后 gzip | gzip 变化 |
|---|---|---|---|---|---|
| `main.html` | 0 KB | 0.1 KB | 0 KB | 0.1 KB | 0% |
| `main.js` | 0.4 KB | 0 KB | 0.4 KB | 0 KB | 0% |

## 3. 增量热更新：改一个文件到新产物 ready

| 变体 | 首次构建 | 重建中位 | 最小 ~ 最大 | 本轮真正重传 raw | 本轮真正重传 gzip | 相对基线（重建耗时） |
|---|---|---|---|---|---|---|
| prod.before | 1 ms | 13 ms | 13 ms ~ 13 ms | 0.5 KB | 0.1 KB | 基线 |
| prod.after | 2 ms | 15 ms | 4 ms ~ 26 ms | 0.5 KB | 0.1 KB | +16.3% |
| prod.nothreads | 1 ms | 12 ms | 3 ms ~ 22 ms | 0.5 KB | 0.1 KB | -16.7% |
| dev.nohmr | 2 ms | 7 ms | 2 ms ~ 12 ms | 0.5 KB | 0.1 KB | 基线 |
| dev.hmr | 2 ms | 14 ms | 3 ms ~ 24 ms | 0.5 KB | 0.1 KB | +101.6% |

> 重建样例（prod.before）：本轮产出变更文件 2 个 → `main.js`、`main.html`

## 4. 结论（自动生成）

- **prod.before** 作为基线：冷构建 2 ms、产物 gzip 0.1 KB、重建 13 ms。
- **prod.after** 相对 prod.before：耗时 -50%，gzip 体积 0%，重建耗时 +16.3%。
- **prod.nothreads** 相对 prod.after：耗时 0%，gzip 体积 0%，重建耗时 -16.7%。
- **dev.nohmr** 作为基线：冷构建 1 ms、产物 gzip 0.1 KB、重建 7 ms。
- **dev.hmr** 相对 dev.nohmr：耗时 0%，gzip 体积 0%，重建耗时 +101.6%。

---

口径与纪律见同目录 README.md：单变量、全新进程、取中位数、raw/gzip 双口径。
