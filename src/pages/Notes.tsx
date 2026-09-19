import { useState } from 'react';
import { ArrowUpRight, Bookmark, Check, Download, NotebookPen } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLearning, useLearningRecords } from '../state/learning';
import { lessons } from '../content/lessons';

export function Notes() {
  const [params, setParams] = useSearchParams();
  const lesson = lessons.find((item) => item.id === params.get('lesson')) || lessons[0];
  const { state, update, storageAvailable } = useLearning(lesson.id);
  const { records, updateLesson } = useLearningRecords();
  const bookmarks = lessons.filter((item) => records[item.id]?.bookmarked);
  const [exported, setExported] = useState(false);
  function download() {
    const blob = new Blob(
      [
        `# Go 深入 · 我的学习笔记\n\n${lessons.map((item) => `## ${item.label}：${item.shortTitle}\n\n${records[item.id]?.notes || '尚未记录笔记。'}\n\n${item.label}状态：${records[item.id]?.completed ? '已完成' : '学习中'}`).join('\n\n---\n\n')}\n`,
      ],
      { type: 'text/markdown;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Go深入-学习笔记.md';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
    window.setTimeout(() => setExported(false), 2000);
  }
  return (
    <main className="standalone-page narrow-page" id="main-content">
      <div className="page-eyebrow">
        <NotebookPen size={15} />
        MY NOTEBOOK
      </div>
      <h1>把「原来如此」，留在这里。</h1>
      <p className="page-deck">记录你的推理、反例，以及还没想明白的问题。</p>
      <section className="notes-section">
        <div className="notes-heading">
          {lessons.length > 1 ? (
            <select
              aria-label="选择笔记章节"
              value={lesson.id}
              onChange={(event) => setParams({ lesson: event.target.value })}
            >
              {lessons.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.label} · {item.shortTitle}
                </option>
              ))}
            </select>
          ) : (
            <h2>
              {lesson.label} · {lesson.shortTitle}
            </h2>
          )}
          <Link
            to={lesson.path}
            className="icon-button"
            aria-label={`回到${lesson.label}正文`}
            title="回到正文"
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <textarea
          className="notes-editor"
          aria-label={`${lesson.label}笔记`}
          maxLength={20000}
          value={state.notes}
          onChange={(event) => update({ notes: event.target.value })}
          placeholder={
            lesson.id === 'preface'
              ? '用自己的话解释一下：\n\n随机 token 和 fencing token，各自解决什么问题？\n\n如果要保护的是扣库存业务，我会如何设计？'
              : '用自己的话记录结论、成立条件和一个反例。'
          }
        />
        <div className="notes-footer">
          <span role="status">
            {storageAvailable ? (
              <>
                <Check size={13} />
                已保存在此浏览器
              </>
            ) : (
              '当前浏览器无法持久保存，请及时导出'
            )}
            <span>{state.notes.length} / 20000</span>
          </span>
          <button className="button secondary small" onClick={download}>
            {exported ? <Check size={15} /> : <Download size={15} />}
            {exported ? '已导出' : '导出 Markdown'}
          </button>
        </div>
        <p className="storage-note">
          笔记仅保存在当前浏览器，清理站点数据后会丢失。重要内容请导出备份。
        </p>
      </section>
      <section className="bookmark-section">
        <h2>
          <Bookmark size={18} />
          我的收藏<span>{bookmarks.length}</span>
        </h2>
        {bookmarks.length ? (
          bookmarks.map((item) => (
            <div className="bookmark-row" key={item.id}>
              <span className="bookmark-label">
                <NotebookPen size={17} />
              </span>
              <Link to={item.path}>
                <strong>{item.shortTitle}</strong>
                <span>
                  {item.label} · 约 {item.minutes} 分钟
                </span>
              </Link>
              <button
                className="icon-button saved"
                aria-label={`取消收藏${item.label}`}
                title="取消收藏"
                onClick={() => updateLesson(item.id, { bookmarked: false })}
              >
                <Bookmark size={17} fill="currentColor" />
              </button>
            </div>
          ))
        ) : (
          <div className="bookmark-empty">
            <p>还没有收藏。值得再读一次的内容，可以从章节标题旁收藏。</p>
            <Link className="text-button" to="/learn/preface">
              回到序章
              <ArrowUpRight size={15} />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
