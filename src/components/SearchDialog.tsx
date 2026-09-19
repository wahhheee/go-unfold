import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Search, X } from 'lucide-react';
import { modules } from '../content/curriculum';
import { lessons } from '../content/lessons';

const searchItems = [
  ...lessons.flatMap((lesson) =>
    lesson.sections.map((section) => ({
      title: section.title,
      context: `${lesson.label} · 已发布`,
      url: `${lesson.path}#${section.id}`,
      text: `${section.title} ${lesson.shortTitle} ${lesson.label} ${section.keywords || ''}`,
      available: true,
    })),
  ),
  ...modules
    .filter((module) => module.id !== 'preface')
    .flatMap((module) =>
      module.topics.map((topic) => ({
        title: topic,
        context: `${module.title} · 规划中`,
        url: `/roadmap#${module.id}`,
        text: `${topic} ${module.title}`,
        available: false,
      })),
    ),
];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      input.current?.focus();
    } else dialog.current?.close();
  }, [open]);
  const filtered = searchItems.filter((item) =>
    query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .every((term) => item.text.toLowerCase().includes(term)),
  );
  return (
    <dialog
      className="search-dialog"
      ref={dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-label="搜索知识点"
    >
      <div className="search-input-row">
        <Search size={20} />
        <input
          ref={input}
          aria-label="搜索知识点"
          placeholder="搜索知识点、问题、关键词…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="icon-button" aria-label="关闭搜索" onClick={onClose}>
          <X size={19} />
        </button>
      </div>
      <div className="search-results">
        <p className="search-group-title">
          {query ? `找到 ${filtered.length} 个结果` : '从这里开始探索'}
        </p>
        {filtered.length ? (
          filtered.map((item) => (
            <button
              key={item.url + item.title}
              className="search-result"
              onClick={() => {
                navigate(item.url);
                onClose();
                setQuery('');
              }}
            >
              <BookOpen size={18} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.context}</small>
              </span>
              {item.available && <span className="published-dot" />}
              <ArrowUpRight size={16} />
            </button>
          ))
        ) : (
          <div className="search-empty">
            <Search size={30} />
            <h3>还没有匹配的知识点</h3>
            <p>试试「并发」「事务」或「分布式锁」。</p>
          </div>
        )}
      </div>
      <div className="search-footer">
        <span>搜索当前序章与完整课程规划</span>
        <span>GO DEEPER</span>
      </div>
    </dialog>
  );
}
