import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Github,
  Menu,
  Moon,
  NotebookPen,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { modules } from './content/curriculum';
import { findLesson, lessons } from './content/lessons';
import { questions } from './content/questions';
import { useLearningRecords } from './state/learning';
import { Lesson } from './components/Lesson';
import { SearchDialog } from './components/SearchDialog';
import { Roadmap } from './pages/Roadmap';
import { Practice } from './pages/Practice';
import { Notes } from './pages/Notes';
import { NotFound } from './pages/NotFound';

export function App() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const { records, storageAvailable } = useLearningRecords();
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const [search, setSearch] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [pathOpen, setPathOpen] = useState(true);
  const sidebar = useRef<HTMLElement>(null);
  const isLesson = pathname === '/' || pathname.startsWith('/learn/');
  const currentLesson = isLesson ? findLesson(pathname.split('/')[2] || 'preface') : undefined;
  const completedCount = lessons.filter((lesson) => records[lesson.id]?.completed).length;
  useEffect(() => {
    if (!mobileNav) return;
    const previousFocus = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector<HTMLButtonElement>('.mobile-close')?.focus();
    function trapFocus(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const elements = Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') || [],
      ).filter((element) => element.offsetParent !== null);
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    window.addEventListener('keydown', trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', trapFocus);
      previousFocus?.focus();
    };
  }, [mobileNav]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('go-deeper:theme', theme);
    } catch {
      /* 存储不可用时仍允许本次切换。 */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#18191b' : '#f8faf9');
  }, [theme]);
  useEffect(() => {
    setMobileNav(false);
    const names: Record<string, string> = {
      '/roadmap': '知识地图',
      '/practice': '练习回顾',
      '/notes': '我的笔记',
    };
    document.title = `${names[pathname] || currentLesson?.shortTitle || '页面未找到'} · Go 探原`;
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    else {
      // 等待异步加载的课程正文挂载，再定位章节锚点。
      let attempts = 0;
      const interval = window.setInterval(() => {
        let id = location.hash.slice(1);
        try {
          id = decodeURIComponent(id);
        } catch {
          /* 非法编码的锚点保留原值。 */
        }
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'instant' });
          window.clearInterval(interval);
        }
        if (++attempts > 30) window.clearInterval(interval);
      }, 100);
      return () => window.clearInterval(interval);
    }
  }, [pathname, location.hash, currentLesson]);
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearch((current) => !current);
      }
      if (event.key === 'Escape') setMobileNav(false);
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
  const pageName = isLesson
    ? currentLesson?.label || '页面未找到'
    : pathname === '/roadmap'
      ? '知识地图'
      : pathname === '/practice'
        ? '练习回顾'
        : pathname === '/notes'
          ? '我的笔记'
          : '页面未找到';
  return (
    <>
      <a className="skip-link" href="#main-content">
        跳到正文
      </a>
      {mobileNav && (
        <button
          className="sidebar-backdrop"
          aria-label="关闭导航"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside
        ref={sidebar}
        className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}
        aria-label="主导航"
        role={mobileNav ? 'dialog' : undefined}
        aria-modal={mobileNav || undefined}
      >
        <Link className="brand" to="/learn/preface">
          <img
            className="brand-mark"
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            width="40"
            height="40"
          />
          <span>
            <strong>Go 探原</strong>
            <small>GO UNFOLD · 服务端学习手册</small>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="关闭导航"
          onClick={() => setMobileNav(false)}
        >
          <X size={19} />
        </button>
        <nav className="primary-nav">
          <NavLink to="/learn/preface" className={isLesson ? 'active' : ''}>
            <BookOpen size={18} />
            <span>开始学习</span>
            <span className="nav-current-dot" />
          </NavLink>
          <NavLink to="/roadmap">
            <RouteIcon size={18} />
            <span>知识地图</span>
          </NavLink>
          <NavLink to="/practice">
            <CircleHelp size={18} />
            <span>练习回顾</span>
            <span className="nav-count">{questions.length}</span>
          </NavLink>
          <NavLink to="/notes">
            <NotebookPen size={18} />
            <span>我的笔记</span>
          </NavLink>
        </nav>
        <div className="sidebar-divider" />
        <button
          className="sidebar-heading"
          onClick={() => setPathOpen(!pathOpen)}
          aria-expanded={pathOpen}
        >
          <span>学习路径</span>
          <ChevronDown size={13} className={pathOpen ? '' : 'collapsed'} />
        </button>
        {pathOpen && (
          <nav className="curriculum-nav" aria-label="课程模块">
            {modules.map((module) => {
              const moduleLessons = lessons.filter((lesson) => lesson.moduleId === module.id);
              const isCurrent = currentLesson?.moduleId === module.id;
              return (
                <div key={module.id}>
                  <Link
                    className={`curriculum-link ${isCurrent ? 'current' : ''}`}
                    to={moduleLessons[0]?.path || `/roadmap#${module.id}`}
                  >
                    <span className="curriculum-number">{module.number}</span>
                    <span>{module.title}</span>
                    {isCurrent ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </Link>
                  {isCurrent &&
                    moduleLessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        className={`current-lesson ${currentLesson?.id === lesson.id ? 'active' : ''}`}
                        to={lesson.path}
                      >
                        <span />
                        {lesson.shortTitle}
                        {records[lesson.id]?.completed && <Check size={12} />}
                      </Link>
                    ))}
                </div>
              );
            })}
          </nav>
        )}
        <div className="sidebar-bottom">
          <div className="sidebar-growth">
            <img
              src={`${import.meta.env.BASE_URL}assets/gopher.png`}
              alt="Go Gopher"
              title="Go Gopher：Renee French 绘制，CC BY 4.0"
              width="40"
              height="55"
            />
            <div>
              <strong>理解，是最好的记忆。</strong>
              <small>每次学透一点点。</small>
            </div>
          </div>
          <div className="sidebar-progress">
            <div>
              <span>我的学习进度</span>
              <strong>
                {completedCount}
                <small> / {lessons.length} 篇</small>
              </strong>
            </div>
            <div className="sidebar-progress-track">
              <span style={{ width: `${(completedCount / lessons.length) * 100}%` }} />
            </div>
            <span>已发布内容 · 持续更新中</span>
          </div>
          <div className="sidebar-foot">
            <span className="status-dot" />
            v0.1 · 生长中
            <Link to="/learn/preface#sources" aria-label="内容核验标准" title="内容核验标准">
              <ShieldCheck size={15} />
            </Link>
          </div>
          <a
            className="asset-credit"
            href="https://go.dev/blog/gopher"
            target="_blank"
            rel="noreferrer"
            title="Go Gopher 由 Renee French 创作，按 CC BY 4.0 使用"
          >
            Go Gopher · Renee French · CC BY 4.0
          </a>
          <a
            className="asset-credit"
            href={`${import.meta.env.BASE_URL}THIRD_PARTY_NOTICES.md`}
            target="_blank"
            rel="noreferrer"
          >
            素材与开源许可
          </a>
        </div>
      </aside>
      <div className="app-shell" inert={mobileNav}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="打开导航"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-parent">学习空间</span>
            <ChevronRight size={13} />
            <span>{pageName}</span>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              aria-label="搜索知识点"
              title="搜索知识点"
              onClick={() => setSearch(true)}
            >
              <Search size={16} />
              <span>搜索知识点…</span>
              <span className="search-shortcut">
                {navigator.userAgent.includes('Mac') ? '⌘ K' : 'Ctrl K'}
              </span>
            </button>
            <span className="topbar-divider" />
            <button
              className="icon-button theme-button"
              aria-label={theme === 'dark' ? '切换浅色主题' : '切换暗色主题'}
              title={theme === 'dark' ? '切换浅色主题' : '切换暗色主题'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/learn/preface#sources" className="content-standard" title="查看内容依据">
              <ShieldCheck size={17} />
              <span>内容标准</span>
            </Link>
            <a
              className="icon-button"
              href="https://github.com/wahhheee/go-unfold"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub 仓库（新标签页打开）"
              title="GitHub 仓库（新标签页打开）"
            >
              <Github size={18} aria-hidden="true" />
            </a>
          </div>
        </header>
        {!storageAvailable && (
          <div className="storage-warning" role="status">
            浏览器存储不可用，本次学习记录无法持久保存。笔记可以导出。
          </div>
        )}
        <Routes>
          <Route path="/" element={<Lesson />} />
          <Route path="/learn/:lessonId" element={<Lesson />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <SearchDialog open={search} onClose={() => setSearch(false)} />
    </>
  );
}
