package admission

import (
	"context"
	"errors"

	"golang.org/x/sync/errgroup"
	"golang.org/x/sync/semaphore"
)

// RunWeighted 在启动任务前申请额度；输入是有限批次，work 必须响应取消并最终返回。
func RunWeighted(ctx context.Context, capacity int64, weights []int64, work func(context.Context, int) error) error {
	if capacity <= 0 || work == nil {
		return errors.New("总额度和工作函数无效")
	}
	for _, weight := range weights {
		if weight <= 0 || weight > capacity {
			return errors.New("任务权重必须为正且不能超过总额度")
		}
	}
	sem := semaphore.NewWeighted(capacity)
	group, taskCtx := errgroup.WithContext(ctx)
	var admissionErr error
	for index, weight := range weights {
		if err := sem.Acquire(taskCtx, weight); err != nil {
			admissionErr = err
			break
		}
		group.Go(func() error {
			defer sem.Release(weight)
			return work(taskCtx, index)
		})
	}
	if err := group.Wait(); err != nil {
		return err
	}
	if admissionErr != nil {
		return admissionErr
	}
	return ctx.Err()
}
