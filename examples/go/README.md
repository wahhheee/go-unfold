# 可复验的 Go 示例

使用 Go 1.27 或之后的兼容工具链，在本目录运行 `go test ./...`，或在仓库根目录运行 `npm run test:go`。这些是本地固定测试，没有 Web 端任意代码执行接口。

`Example` 测试中的输出对应正文案例；平台相关的内存布局检查显式限定架构，不把当前实现当作跨平台保证。第一章的十个包对应值、接口、泛型、切片、map、调度、内存、性能、错误与测试。第二章新增十一组并发验证：

| 包            | 验证重点                                |
| ------------- | --------------------------------------- |
| happensbefore | 正确发布、原子丢失更新与 Add            |
| channels      | 缓冲、关闭、别名与多发送者协议          |
| selection     | select 求值、取消与新版计时器           |
| locking       | 无竞态超卖、完整临界区与读写互斥        |
| atomics       | CAS、不可变快照、Value 与逻辑 ABA       |
| coordination  | WaitGroup、Once 与 Cond 条件重检        |
| contextlife   | 父子预算、取消原因、脱离与回调收尾      |
| taskgroups    | errgroup、提前退出流水线与 singleflight |
| workerpool    | 有界工作者、结果位置、失败取消和清理    |
| admission     | 令牌桶、预约取消、等待预算和加权额度    |
| diagnostics   | 隔离竞争、泄漏画像、等待环与诊断采集    |

当前核验 Go 1.27.1 / linux / amd64，go.mod 固定 x/sync v0.23.0 和 x/time v0.16.0。同步测试优先用显式交接或 synctest 构造关键路径，不能把一次无报错当作所有执行正确的证明。

```bash
go test ./...
go vet ./...
go test -race -shuffle=on -count=1 ./...
go test ./quality -run '^$' -fuzz '^FuzzRoundTrip$' -fuzztime=5s -parallel=2
```

`quality.EncodeBroken` 是有意保留的教学缺陷，用固定反例测试确认它会丢失前导零；正常 fuzz 入口只检查正确实现。错误处理测试用独立子进程验证无法跨 goroutine 恢复的 panic，子进程失败是该案例预期结果。

`diagnostics` 中有意的数据竞争与永久阻塞也只在带超时的独立子进程中执行。race 构建验证预期报告和退出码；普通构建跳过竞争样本。泄漏样本使用 Go 1.27 的 goroutineleak 画像，后由进程退出回收。完整采集命令与已执行结果见 [并发诊断实跑记录](diagnostics/RESULTS.md)。

基准与 pprof/trace 的运行条件见课程 1.8；已执行的环境、原始时间样本、分配数据和诊断验证见 [性能实跑记录](performance/RESULTS.md)。不要把带 race 或诊断开销的结果混入正常构建的性能基线。
