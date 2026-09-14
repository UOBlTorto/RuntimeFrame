# Elpis 构建基准 · 示例报告（占位数据）

生成时间：2026-09-14T01:17:16.409Z　|　仓库：`D:\work\vscode4w\Elpis` @ `sample`　|　Node v24.19.0　|　示例 CPU × 16 核　|　内存 32 GB

口径：冷构建 = 每个变体 3 个**全新进程** + `cache:false`，取中位数；增量 = watch 模式触碰 `app/pages/dashboard/dashboard.vue`（模式 `content`），测「写盘 → 编译 done」；体积 = 磁盘实际产物字节 + gzip(level 9)。

## 1. 冷构建：耗时与产物体积

| 变体 | 编译耗时（中位） | 最小 ~ 最大 | 进程墙钟（中位） | 产物 raw | 产物 gzip | 相对基线 | 成功/总次数 |
|---|---|---|---|---|---|---|---|
| prod.before（基线） | 27.23 s | 25.18 s ~ 27.7 s | 29.1 s | 5.37 MB | 1.42 MB | 耗时 基线　体积 基线 | 3/3 |
| prod.after（对比 prod.before） | 18.21 s | 17.83 s ~ 18.89 s | 21.3 s | 3.13 MB | 878.6 KB | 耗时 -33.1%　体积 -39.7% | 3/3 |
| prod.nothreads（对比 prod.after） | 23.77 s | 22.97 s ~ 23.88 s | 26.7 s | 3.13 MB | 878.6 KB | 耗时 +30.5%　体积 0% | 3/3 |
| dev.nohmr（基线） | 8.31 s | 8.09 s ~ 8.51 s | 9.58 s | 11.84 MB | 2.41 MB | 耗时 基线　体积 基线 | 3/3 |
| dev.hmr（对比 dev.nohmr） | 8.51 s | 8.46 s ~ 8.73 s | 9.95 s | 11.95 MB | 2.44 MB | 耗时 +2.4%　体积 +1% | 3/3 |

> 变体说明：prod.before = 生产构建 · 优化前（只有基础配置：无拆分、无 CSS 提取、无压缩、单线程）；prod.after = 生产构建 · 现状（splitChunks + runtimeChunk + CSS 提取/压缩 + Terser + Happypack 多线程）；prod.nothreads = 生产构建 · 现状但关闭所有并发（Happypack → 直接 loader，Terser parallel=false）；dev.nohmr = 开发态 · 同一份配置关掉 HMR（无 client 注入、无 HotModuleReplacementPlugin）；dev.hmr = 开发态 · 自研 dev server（dev-middleware + hot-middleware + HotModuleReplacementPlugin）

## 2. 产物体积构成（按 gzip 降序，前 8）

| 文件 | 优化前 raw | 优化前 gzip | 优化后 raw | 优化后 gzip | gzip 变化 |
|---|---|---|---|---|---|
| `js/dashboard.bundle.js` | 3.9 MB | 1.05 MB | 563 KB | 153 KB | -85.8% |
| `js/page1.bundle.js` | 819 KB | 215 KB | 246 KB | 72 KB | -66.5% |
| `js/project-list.bundle.js` | 635 KB | 154 KB | 195 KB | 56 KB | -63.6% |
| `dashboard.html` | 16 KB | 4.4 KB | 16 KB | 4.4 KB | 0% |
| `page1.html` | 15 KB | 4.1 KB | 15 KB | 4.1 KB | 0% |
| `project-list.html` | 15 KB | 4.1 KB | 15 KB | 4.1 KB | 0% |
| `js/vendor.bundle.js` | — | — | 1.6 MB | 450 KB | — |
| `js/common.bundle.js` | — | — | 430 KB | 112 KB | — |
| `css/dashboard.bundle.css` | — | — | 61 KB | 15 KB | — |
| `js/runtime.bundle.js` | — | — | 31 KB | 8 KB | — |

## 3. 增量热更新：改一个文件到新产物 ready

| 变体 | 首次构建 | 重建中位 | 最小 ~ 最大 | 本轮真正重传 raw | 本轮真正重传 gzip | 相对基线（重建耗时） |
|---|---|---|---|---|---|---|
| prod.before | 26.8 s | 1.5 s | 1.4 s ~ 1.52 s | 3.9 MB | 1.05 MB | 基线 |
| prod.after | 18.4 s | 1.17 s | 1.14 s ~ 1.2 s | 563 KB | 153 KB | -21.8% |
| prod.nothreads | 23.6 s | 1.53 s | 1.47 s ~ 1.59 s | 563 KB | 153 KB | +30.8% |
| dev.nohmr | 8.2 s | 433 ms | 417 ms ~ 445 ms | 3.4 MB | 717 KB | 基线 |
| dev.hmr | 8.4 s | 440 ms | 434 ms ~ 466 ms | 3.43 MB | 725 KB | +1.8% |

> 重建样例（prod.before）：本轮产出变更文件 1 个 → `js/dashboard.bundle.js`

## 4. 结论（自动生成）

- **prod.before** 作为基线：冷构建 27.23 s、产物 gzip 1.42 MB、重建 1.5 s。
- **prod.after** 相对 prod.before：耗时 -33.1%，gzip 体积 -39.7%，重建耗时 -21.8%。
- **prod.nothreads** 相对 prod.after：耗时 +30.5%，gzip 体积 0%，重建耗时 +30.8%。
- **dev.nohmr** 作为基线：冷构建 8.31 s、产物 gzip 2.41 MB、重建 433 ms。
- **dev.hmr** 相对 dev.nohmr：耗时 +2.4%，gzip 体积 +1%，重建耗时 +1.8%。

---

口径与纪律见同目录 README.md：单变量、全新进程、取中位数、raw/gzip 双口径。
