import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, ChevronRight, Layers3, Route } from 'lucide-react';
import { modules } from '../content/curriculum';
import { useLearningRecords } from '../state/learning';
import { lessons } from '../content/lessons';

export function Roadmap() {
  const [filter, setFilter] = useState('全部');
  const { records } = useLearningRecords();
  const location = useLocation();
  useEffect(() => {
    if (location.hash) setFilter('全部');
  }, [location.key, location.hash]);
  const visible = modules.filter((module) => filter === '全部' || module.stage === filter);
  return (
    <main className="standalone-page" id="main-content">
      <div className="page-eyebrow">
        <Route size={15} />
        LEARNING PATH
      </div>
      <h1>把知识连成一张地图。</h1>
      <p className="page-deck">从语言基础到系统设计，一步步建立可以解释、验证和应用的知识体系。</p>
      <div className="roadmap-summary">
        <div>
          <strong>{modules.length}</strong>
          <span>个学习模块</span>
        </div>
        <div>
          <strong>{modules.reduce((sum, module) => sum + module.topics.length, 0)}</strong>
          <span>个规划主题</span>
        </div>
        <div>
          <strong>{lessons.length}</strong>
          <span>篇已发布章节</span>
        </div>
        <div className="summary-note">
          <Layers3 size={21} />
          <span>
            按模块逐步更新
            <br />
            <small>每一篇，都认真核验。</small>
          </span>
        </div>
      </div>
      <div className="page-tabs" aria-label="学习阶段">
        {['全部', '起点', '语言基础', '系统原理', '工程实践'].map((stage) => (
          <button
            key={stage}
            className={filter === stage ? 'active' : ''}
            aria-pressed={filter === stage}
            onClick={() => setFilter(stage)}
          >
            {stage}
          </button>
        ))}
      </div>
      <div className="roadmap-list">
        {visible.map((module) => {
          const moduleLessons = lessons.filter((lesson) => lesson.moduleId === module.id);
          const published = moduleLessons.length > 0;
          const completed =
            published && moduleLessons.every((lesson) => records[lesson.id]?.completed);
          return (
            <section
              className={`roadmap-module ${published ? 'available' : ''}`}
              id={module.id}
              key={module.id}
            >
              <span className="module-number">{module.number}</span>
              <div className="module-content">
                <div className="module-title">
                  <h2>{module.title}</h2>
                  <span className={`tag ${published ? '' : 'neutral'}`}>
                    {completed
                      ? '已发布篇目已完成'
                      : module.contentComplete
                        ? '本章已发布'
                        : published
                          ? '部分已发布'
                          : '规划中'}
                  </span>
                </div>
                <p>{module.description}</p>
                <div className="module-topics">
                  {module.topics.map((topic) => (
                    <span key={topic}>
                      <span />
                      {topic}
                    </span>
                  ))}
                </div>
                {moduleLessons.map((lesson) => (
                  <Link key={lesson.id} className="text-button module-lesson-link" to={lesson.path}>
                    {records[lesson.id]?.completed ? <Check size={15} /> : <BookOpen size={15} />}
                    {records[lesson.id]?.completed ? '重读' : '开始'}
                    {lesson.label}
                    <ArrowRight size={15} />
                  </Link>
                ))}
              </div>
              <span className="module-stage">{module.stage}</span>
            </section>
          );
        })}
      </div>
      <div className="roadmap-bottom">
        <img
          src={`${import.meta.env.BASE_URL}assets/gopher.png`}
          alt="Go Gopher"
          width="56"
          height="78"
        />
        <div>
          <strong>学得扎实，走得更远。</strong>
          <p>序章是起点。语言、系统与工程章节将在这个结构上持续生长。</p>
        </div>
        <Link to="/learn/preface" aria-label="阅读序章">
          <ChevronRight size={22} />
        </Link>
      </div>
    </main>
  );
}
