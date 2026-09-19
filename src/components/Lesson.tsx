import { createContext, Fragment, Suspense, useContext, useEffect, useState } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  FlaskConical,
  MessageCircle,
  NotebookPen,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { findLesson, lessons } from '../content/lessons';
import type { LessonDefinition } from '../content/lessons';
import { NotFound } from '../pages/NotFound';
import { questions } from '../content/questions';
import { useLearning } from '../state/learning';
import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { Followups } from './Followups';
import { LockLab } from './LockLab';
import { Quiz } from './Quiz';
import { ValueCopyLab } from './ValueCopyLab';
import { InterfaceLab } from './InterfaceLab';
import { ConstraintLab } from './ConstraintLab';
import { SliceLab } from './SliceLab';
import { MapProbeLab } from './MapProbeLab';
import { ScenarioPlayer } from './ScenarioPlayer';
import { GCBudgetLab } from './GCBudgetLab';
import { ProfileLab } from './ProfileLab';
import { RoundTripLab } from './RoundTripLab';
import { HappensBeforeLab } from './HappensBeforeLab';
import { ChannelLab } from './ChannelLab';
import type { ComponentPropsWithoutRef } from 'react';

function DataTable(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="知识对照表">
      <table {...props} />
    </div>
  );
}

const LessonContext = createContext<LessonDefinition | null>(null);

function useLesson() {
  const lesson = useContext(LessonContext);
  if (!lesson) throw new Error('正文组件必须在章节页面中使用');
  return lesson;
}

function SourceList() {
  const { sources } = useLesson();
  return (
    <ol className="source-list">
      {sources.map((source, index) => (
        <li key={source.url}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <a href={source.url} target="_blank" rel="noreferrer">
            <strong>
              {source.title}
              <ExternalLink size={13} />
            </strong>
            <small>{source.note}</small>
          </a>
        </li>
      ))}
    </ol>
  );
}

function LessonFinish() {
  const lesson = useLesson();
  const position = lessons.findIndex((item) => item.id === lesson.id);
  const previous = lessons[position - 1];
  const next = lessons[position + 1];
  const { state, update } = useLearning();
  return (
    <div className="lesson-finish">
      <div>
        <span className="finish-icon">
          <Check size={22} />
        </span>
        <div>
          <h3>
            {state.completed
              ? `${lesson.label}已完成，理解在继续。`
              : `${lesson.label}读完了，留下你的第一步。`}
          </h3>
          <p>真正掌握的标志，是能解释一个反例。</p>
        </div>
      </div>
      <button
        className={`button ${state.completed ? 'secondary' : ''}`}
        onClick={() => update({ completed: !state.completed })}
      >
        {state.completed ? <Check size={16} /> : <BookOpen size={16} />}
        {state.completed ? '已完成 · 撤销标记' : '标记为已完成'}
      </button>
      <Link to={`/notes?lesson=${lesson.id}`} className="text-button">
        <NotebookPen size={16} />
        记下我的理解
        <ArrowRight size={15} />
      </Link>
      <nav className="lesson-pagination" aria-label="章节翻页">
        {previous && (
          <Link to={previous.path}>
            <span>上一节</span>
            <strong>{previous.shortTitle}</strong>
          </Link>
        )}
        {next && (
          <Link to={next.path}>
            <span>
              下一节
              <ArrowRight size={13} />
            </span>
            <strong>{next.shortTitle}</strong>
          </Link>
        )}
      </nav>
    </div>
  );
}

const mdxComponents = {
  Callout,
  Quiz,
  ValueCopyLab,
  InterfaceLab,
  ConstraintLab,
  SliceLab,
  MapProbeLab,
  ScenarioPlayer,
  GCBudgetLab,
  ProfileLab,
  RoundTripLab,
  HappensBeforeLab,
  ChannelLab,
  LockLab,
  Followups,
  SourceList,
  LessonFinish,
  Link,
  ArrowRight,
  ArrowUpRight,
  MessageCircle,
  ScanSearch,
  FlaskConical,
  ShieldCheck,
  pre: CodeBlock,
  table: DataTable,
};

export function Lesson() {
  const { lessonId = 'preface' } = useParams();
  const lesson = findLesson(lessonId);
  return lesson ? (
    <LessonContext.Provider value={lesson}>
      <LessonBody key={lesson.id} lesson={lesson} />
    </LessonContext.Provider>
  ) : (
    <NotFound />
  );
}

function LessonBody({ lesson }: { lesson: LessonDefinition }) {
  const { state, update } = useLearning(lesson.id);
  const [active, setActive] = useState(lesson.sections[0]?.id || '');
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function handleScroll() {
      const sections = lesson.sections
        .map((section) => document.getElementById(section.id))
        .filter((element): element is HTMLElement => !!element);
      const current = sections
        .filter((section) => section.getBoundingClientRect().top <= 160)
        .at(-1);
      if (current) setActive(current.id);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.round((window.scrollY / total) * 100)) : 0);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lesson]);
  const lessonQuestions = questions.filter((question) => question.lessonId === lesson.id);
  const correctCount = lessonQuestions.filter(
    (question) => state.answers[question.id] === question.answer,
  ).length;
  const Content = lesson.Content;
  return (
    <div className="lesson-layout">
      <main className="lesson-main" id="main-content">
        <header className="lesson-header">
          <div className="lesson-eyebrow">
            <span>
              <BookOpen size={14} />
              {lesson.label}
            </span>
            <span className="eyebrow-divider" />
            {lesson.eyebrow}
            <span className="edition">持续生长的学习手册</span>
          </div>
          <h1>{lesson.title}</h1>
          <p className="lesson-deck">
            {lesson.description.map((line, index) => (
              <Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
          <div className="lesson-meta">
            <span>
              <Clock3 size={14} />约 {lesson.minutes} 分钟
            </span>
            <span>
              <FlaskConical size={14} />
              {lesson.labCount} 个交互实验
            </span>
            <span>
              <MessageCircle size={14} />
              {lessonQuestions.length} 道随堂练习
            </span>
            <button
              aria-label={`${state.bookmarked ? '取消收藏' : '收藏'}${lesson.label}`}
              title={state.bookmarked ? '取消收藏' : '收藏本节'}
              className={`icon-button bookmark-button ${state.bookmarked ? 'saved' : ''}`}
              onClick={() => update({ bookmarked: !state.bookmarked })}
            >
              <Bookmark size={17} fill={state.bookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </header>
        {lesson.intro && (
          <div className="lesson-intro-banner">
            <span className="intro-symbol">
              <Sparkles size={19} />
            </span>
            <p>
              <strong>{lesson.intro.title}</strong>
              <span>{lesson.intro.body}</span>
            </p>
            <a href={`#${lesson.sections[0]?.id || ''}`} aria-label="开始阅读">
              <ArrowDown size={19} />
            </a>
          </div>
        )}
        <article className="prose">
          <MDXProvider components={mdxComponents}>
            <Suspense fallback={<div className="loading-content">正在打开{lesson.label}…</div>}>
              <Content />
            </Suspense>
          </MDXProvider>
        </article>
        <footer className="page-footer">
          <span>
            Go 深入 <span className="footer-dot">·</span> 保持好奇，认真求证。
          </span>
          <span>内容版本 0.1.0</span>
        </footer>
      </main>
      <aside className="lesson-toc">
        <div className="toc-sticky">
          <div className="toc-heading">
            本节目录<span>{progress}%</span>
          </div>
          <div className="reading-track">
            <div style={{ width: `${progress}%` }} />
          </div>
          <nav aria-label="本节目录">
            {lesson.sections.map((section, index) => (
              <a
                className={active === section.id ? 'active' : ''}
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActive(section.id)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {section.title}
              </a>
            ))}
          </nav>
          <div className="toc-outcomes">
            <span>学习足迹</span>
            {lesson.labCount > 0 && (
              <p className={state.labRan ? 'done' : ''}>
                <span>{state.labRan && <Check size={11} />}</span>运行一次实验
              </p>
            )}
            {lessonQuestions.length > 0 && (
              <p className={correctCount === lessonQuestions.length ? 'done' : ''}>
                <span>{correctCount === lessonQuestions.length && <Check size={11} />}</span>
                理解随堂练习{' '}
                <small>
                  {correctCount}/{lessonQuestions.length}
                </small>
              </p>
            )}
            <p className={state.completed ? 'done' : ''}>
              <span>{state.completed && <Check size={11} />}</span>读完本节并标记
            </p>
          </div>
          <a href="#sources" className="toc-sources">
            <ShieldCheck size={17} />
            <span>
              有依据，才有底气<small>查看本节参考资料</small>
            </span>
            <ChevronRight size={13} />
          </a>
          <div className="toc-note">
            <NotebookPen size={16} />
            <p>
              把「原来如此」的瞬间
              <br />
              记成自己的理解。
            </p>
            <Link to={`/notes?lesson=${lesson.id}`}>
              写一条笔记
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
