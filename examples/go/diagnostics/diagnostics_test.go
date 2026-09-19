package diagnostics

import (
	"bytes"
	"context"
	"errors"
	"os"
	"os/exec"
	"runtime"
	"runtime/pprof"
	"strings"
	"sync"
	"testing"
	"testing/synctest"
	"time"
)

// 故障只在有超时保护的子进程内发生，避免污染主测试进程。
func fixture(t *testing.T, name, kind string) ([]byte, error) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, os.Args[0], "-test.run=^"+name+"$", "-test.v")
	for _, value := range os.Environ() {
		if !strings.HasPrefix(value, "GO_DEEPER_FIXTURE=") && !strings.HasPrefix(value, "GORACE=") {
			cmd.Env = append(cmd.Env, value)
		}
	}
	cmd.Env = append(cmd.Env, "GO_DEEPER_FIXTURE="+kind, "GORACE=halt_on_error=1 exitcode=66")
	output, err := cmd.CombinedOutput()
	if ctx.Err() != nil {
		t.Fatalf("故障子进程超时：%s", output)
	}
	return output, err
}

func TestRaceDetectorFindsFixture(t *testing.T) {
	if !raceEnabled {
		t.Skip("需要 -race，普通测试不执行有意竞争")
	}
	output, err := fixture(t, "TestRaceFixture", "race")
	var exit *exec.ExitError
	if !errors.As(err, &exit) || exit.ExitCode() != 66 || !bytes.Contains(output, []byte("WARNING: DATA RACE")) {
		t.Fatalf("没有得到预期的竞态报告：%v\n%s", err, output)
	}
	t.Log("独立子进程检测到 DATA RACE，退出码 66")
}

func TestRaceFixture(t *testing.T) {
	if os.Getenv("GO_DEEPER_FIXTURE") != "race" || !raceEnabled {
		t.Skip("仅由隔离检测调用")
	}
	var value int
	var wg sync.WaitGroup
	start := make(chan struct{})
	for range 2 {
		wg.Go(func() {
			<-start
			for range 1000 {
				value++
			}
		})
	}
	close(start)
	wg.Wait()
	t.Log(value)
}

func TestLeakProfileFindsFixture(t *testing.T) {
	output, err := fixture(t, "TestLeakFixture", "leak")
	if err != nil || !bytes.Contains(output, []byte("已定位永久阻塞函数")) {
		t.Fatalf("泄漏画像未定位：%v\n%s", err, output)
	}
	t.Log("独立子进程的 goroutineleak 画像已定位永久阻塞函数")
}

// 该通道没有任何可运行的持有者，只有当前 G 在等待；只能用于隔离故障样本。
func permanentlyBlocked(started chan<- struct{}) {
	never := make(chan struct{})
	close(started)
	<-never
}

func TestLeakFixture(t *testing.T) {
	if os.Getenv("GO_DEEPER_FIXTURE") != "leak" {
		t.Skip("仅由隔离检测调用")
	}
	started := make(chan struct{})
	go permanentlyBlocked(started)
	<-started
	profile := pprof.Lookup("goroutineleak")
	if profile == nil {
		t.Fatal("工具链缺少 Go 1.27 泄漏画像")
	}
	for range 20 {
		runtime.Gosched()
		var output bytes.Buffer
		if err := profile.WriteTo(&output, 1); err != nil {
			t.Fatal(err)
		}
		if strings.Contains(output.String(), "permanentlyBlocked") {
			t.Log("已定位永久阻塞函数")
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatal("没有捕获预期泄漏")
}

func TestCanceledSenderIsJoined(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		out := make(chan int)
		done := make(chan struct{})
		var result error
		go func() {
			defer close(done)
			select {
			case out <- 42:
			case <-ctx.Done():
				result = ctx.Err()
			}
		}()
		synctest.Wait()
		select {
		case <-done:
			t.Error("无消费者时不应提前结束")
		default:
		}
		cancel()
		<-done
		if !errors.Is(result, context.Canceled) {
			t.Fatal("取消后未完成清理")
		}
	})
}

func TestCancellableWaitCycle(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		a, b := make(chan struct{}, 1), make(chan struct{}, 1)
		a <- struct{}{}
		b <- struct{}{}
		ready := make(chan struct{}, 2)
		proceed := make(chan struct{})
		var wg sync.WaitGroup
		acquireBoth := func(first, second chan struct{}) {
			<-first
			defer func() { first <- struct{}{} }()
			ready <- struct{}{}
			<-proceed
			select {
			case <-second:
				second <- struct{}{}
			case <-ctx.Done():
			}
		}
		wg.Go(func() { acquireBoth(a, b) })
		wg.Go(func() { acquireBoth(b, a) })
		<-ready
		<-ready
		close(proceed)
		synctest.Wait()
		cancel()
		wg.Wait()
		if len(a) != 1 || len(b) != 1 {
			t.Fatal("等待环解除后未归还持有额度")
		}
	})
}

// 人为延长临界区以产生可观察的争用，不能作为生产锁使用示范或性能基线。
func TestContentionWorkload(t *testing.T) {
	var mu sync.Mutex
	var wg sync.WaitGroup
	var count int
	for range 4 {
		wg.Go(func() {
			for range 8 {
				mu.Lock()
				time.Sleep(100 * time.Microsecond)
				count++
				mu.Unlock()
			}
		})
	}
	wg.Wait()
	if count != 32 {
		t.Fatalf("计数=%d", count)
	}
}
