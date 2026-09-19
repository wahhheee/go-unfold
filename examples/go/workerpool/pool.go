package workerpool

import (
	"context"
	"errors"

	"golang.org/x/sync/errgroup"
)

type job struct{ index, value int }

// Run 处理有限输入，使用固定工作者和单个生产者；结果按输入顺序返回。
// work 必须能响应 Context 并最终返回，不能依靠 Run 强制终止它。
func Run(ctx context.Context, workers, capacity int, inputs []int, work func(context.Context, int) (int, error)) ([]int, error) {
	if workers < 1 || capacity < 0 || work == nil {
		return nil, errors.New("工作者数量、队列容量或处理函数无效")
	}
	group, taskCtx := errgroup.WithContext(ctx)
	jobs := make(chan job, capacity)
	results := make([]int, len(inputs))
	group.Go(func() error {
		defer close(jobs)
		for index, value := range inputs {
			select {
			case jobs <- job{index: index, value: value}:
			case <-taskCtx.Done():
				return taskCtx.Err()
			}
		}
		return nil
	})
	for range workers {
		group.Go(func() error {
			for {
				if err := taskCtx.Err(); err != nil {
					return err
				}
				select {
				case <-taskCtx.Done():
					return taskCtx.Err()
				case task, ok := <-jobs:
					if !ok {
						return nil
					}
					result, err := work(taskCtx, task.value)
					if err != nil {
						return err
					}
					results[task.index] = result
				}
			}
		})
	}
	if err := group.Wait(); err != nil {
		return nil, err
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return results, nil
}
