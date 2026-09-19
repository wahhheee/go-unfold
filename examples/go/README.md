# 可复验的 Go 示例

使用 Go 1.27 或之后的兼容工具链，在本目录运行 `go test ./...`，或在仓库根目录运行 `npm run test:go`。这些是本地固定测试，没有 Web 端任意代码执行接口。

`Example` 测试中的输出对应正文案例；平台相关的内存布局检查显式限定架构，不把当前实现当作跨平台保证。十个包依次对应第一章的值、接口、泛型、切片、map、调度、内存、性能、错误与测试。

```bash
go test ./...
go vet ./...
go test -race -shuffle=on -count=1 ./...
go test ./quality -run '^$' -fuzz '^FuzzRoundTrip$' -fuzztime=5s -parallel=2
```

`quality.EncodeBroken` 是有意保留的教学缺陷，用固定反例测试确认它会丢失前导零；正常 fuzz 入口只检查正确实现。错误处理测试用独立子进程验证无法跨 goroutine 恢复的 panic，子进程失败是该案例预期结果。

基准与 pprof/trace 的运行条件见课程 1.8；已执行的环境、原始时间样本、分配数据和诊断验证见 [性能实跑记录](performance/RESULTS.md)。不要把带 race 或诊断开销的结果混入正常构建的性能基线。
