# 素材来源

| 素材               | 来源与许可                                                                                                         | 用法                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Go Gopher          | [Go 官方博客](https://go.dev/blog/gopher)，Renee French，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `public/assets/gopher.png`，保留原图，调整显示大小 |
| Lucide 图标        | [Lucide](https://lucide.dev/license)，ISC                                                                          | 应用控件与内容提示                                 |
| DM Sans            | [Fontsource](https://fontsource.org/fonts/dm-sans)，SIL OFL 1.1                                                    | 自托管字体，通过 npm 依赖构建                      |
| 应用标志与 favicon | 本项目原创的展开书页图形，MIT                                                                                      | `public/favicon.svg`；PNG 与触屏图标由其导出       |

Go Gopher 图片的作者与来源也标注在应用侧栏素材链接中。使用该图片不表示 Go 项目为本应用背书。

完整第三方说明见 `public/THIRD_PARTY_NOTICES.md`。Vite 在构建时汇集打包依赖许可到 `dist/THIRD_PARTY_LICENSES.md`，静态入口脚本显式补充 DM Sans 的版权与 OFL 全文，并复制项目 MIT 许可到 `dist/LICENSE.txt`。Lucide 源自 Feather 的部分保留其 MIT 声明，不能仅用 ISC 概括并删除原始许可。

品牌图形以展开书页表达 Go Unfold，使用深绿底、浅色页、薄荷色页与金色翻页。图标不含字体、不依赖外部资源。修改 SVG 后执行 `npm run icons`，重建 32px PNG 与 180px 触屏图标；检查 16px、32px 和明暗背景的清晰度。
