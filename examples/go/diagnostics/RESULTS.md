# 并发诊断实跑记录

核验日期：2026-09-19。Go `go1.27.1-X:nodwarf5`，linux/amd64，共享开发环境。下列数字只用于确认画像含有预期故障位置，不是生产性能承诺。

## 故障隔离

`go test -race -count=1 -v ./diagnostics` 通过。父测试启动有 15 秒上限的独立子进程，在其中执行两条缺少同步的写路径，收到 `WARNING: DATA RACE` 与退出码 66。普通测试不会执行有意竞争；带 `-race` 时验证检测器确实能看到它。

另一个子进程创建无法被其他 G 唤醒的通道等待。Go 1.27 的 `goroutineleak` 画像识别到 `permanentlyBlocked`；进程退出回收这个故障样本。它只验证这一类可达性能够识别的泄漏，不说明所有泄漏都能检测。

同包还验证取消后发送者退出、拥有者等待收尾，以及可取消通道额度形成的等待环在取消后归还资源。真实 Mutex 的 Lock 不能直接接受 Context，不能将这个解除协议套到 Mutex 上。

## 画像与时序

在 `examples/go` 目录执行：

```bash
go test ./diagnostics -run '^TestContentionWorkload$' -count=1 \
  -mutexprofile=/tmp/go-deeper-mutex.pprof -mutexprofilefraction=1 \
  -blockprofile=/tmp/go-deeper-block.pprof -blockprofilerate=1 \
  -trace=/tmp/go-deeper-concurrency.trace -o /tmp/go-deeper-diagnostics.test
go tool pprof -top /tmp/go-deeper-diagnostics.test /tmp/go-deeper-mutex.pprof
go tool pprof -top /tmp/go-deeper-diagnostics.test /tmp/go-deeper-block.pprof
go tool trace -d=parsed /tmp/go-deeper-concurrency.trace
```

本次三种文件均成功解析。mutex 画像主要将约 98.87ms 累计争用归到 `sync.(*Mutex).Unlock`；block 画像在 `sync.(*Mutex).Lock` 约 98.14ms，在 `WaitGroup.Wait` 约 36.28ms。block 中还含测试框架和 trace 自身的通道等待，不能把总量都归给业务。trace 中能够看到 G 的运行、等待等状态迁移。

样本刻意在临界区内短暂 Sleep 来制造争用，不用于证明调度顺序，也不是推荐的锁使用方式。累计等待时间可能大于墙钟时间；不同画像的采样和归因方式不同，不应强行要求数值完全相等。生成的二进制和画像不进入 Git。
