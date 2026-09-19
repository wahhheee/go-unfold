# 性能案例实跑记录

核验日期：2026-09-19。工具链：`go1.27.1-X:nodwarf5`，`linux/amd64`；CPU：Intel Core i7-12650H。共享开发环境，没有固定操作系统亲和性或隔离全部后台负载，因此不把时间数字作为性能承诺，也不声称已通过统计显著性检验。

## 重复基准

在示例模块目录执行：

```bash
go test ./performance -run '^$' -bench '^BenchmarkBuild' \
  -benchmem -benchtime=200ms -count=5 -cpu=1
```

输入均为 1000 个整数。五次样本的字节和分配次数相同；时间原始样本如下。

| 基准                  | 五次 ns/op                        | B/op  | allocs/op |
| --------------------- | --------------------------------- | ----- | --------- |
| Build                 | 2804, 2861, 2862, 2764, 3141      | 25208 | 11        |
| BuildReserved         | 293.9, 273.2, 278.4, 271.8, 271.8 | 0     | 0         |
| BuildEscaping         | 2952, 2811, 3030, 2896, 2945      | 25208 | 11        |
| BuildReservedEscaping | 1053, 1021, 1042, 1062, 1084      | 8192  | 1         |

前两项只在基准循环体内消费结果；后两项保存到包级 `outputSink`，明确让结果逃逸。不能把两种生命周期的差别全归结为预分配技巧。

通过 `go test -gcflags=-m=2 ./performance` 核验：局部预分配基准中的 `make([]int, 0, 1000)` 显示 `does not escape`，保存结果的基准显示 `escapes to heap`。0 B/op 指该测量下没有相应堆分配，不是没有使用任何存储。

这两个函数只用于性能实验。n=0 时 nilness 不同，n<0 时行为也不同；若要作为真实 API 的前后实现，还需先统一契约。

## 诊断文件

独立于基线运行 2 秒的 `BenchmarkBuildReservedEscaping`，生成 CPU 与内存画像，再分别用 `go tool pprof -top` 和 `-top -alloc_space` 读取，均成功解析并定位到内联后的 `BuildReserved`。该次内存画像显示累计分配约 10.60 GB；它不是同时存活内存或进程 RSS。

CPU 画像的采样时长约 2.47 秒、样本合计 2.29 秒；可以观察到构造循环、分配与 GC 工作。诊断运行有额外开销，没有将它的数字混入上述基线。

`TestBuilders` 的执行 trace 也已生成，并用当前 Go 1.27 的 `go tool trace -d=parsed` 成功解析。它只是短测试的工具链验证，不模拟生产负载。二进制画像文件不进入 Git，按正文命令可重新生成。
