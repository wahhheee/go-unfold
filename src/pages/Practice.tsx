import { useState } from 'react';
import { ArrowUpRight, Check, CircleHelp } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { questions as allQuestions } from '../content/questions';
import { lessons } from '../content/lessons';
import { useLearningRecords } from '../state/learning';
import { Quiz } from '../components/Quiz';

export function Practice() {
  const [params, setParams] = useSearchParams();
  const selectedLesson = lessons.find((lesson) => lesson.id === params.get('lesson'));
  const questions = selectedLesson
    ? allQuestions.filter((question) => question.lessonId === selectedLesson.id)
    : allQuestions;
  const { records } = useLearningRecords();
  const answers = Object.fromEntries(
    questions.map((question) => [question.id, records[question.lessonId]?.answers[question.id]]),
  );
  const [filter, setFilter] = useState('全部题目');
  const correct = questions.filter((question) => answers[question.id] === question.answer).length;
  const incorrect = questions.filter(
    (question) => answers[question.id] !== undefined && answers[question.id] !== question.answer,
  );
  const visible =
    filter === '待巩固'
      ? incorrect
      : filter === '未作答'
        ? questions.filter((question) => answers[question.id] === undefined)
        : questions;
  return (
    <main className="standalone-page narrow-page" id="main-content">
      <div className="page-eyebrow">
        <CircleHelp size={15} />
        RETRIEVAL PRACTICE
      </div>
      <h1>再想一次，理解更深一点。</h1>
      <p className="page-deck">把答案放一边，用自己的推理重新走到结论。</p>
      <label className="practice-lesson-select">
        练习范围
        <select
          aria-label="选择练习章节"
          value={selectedLesson?.id || 'all'}
          onChange={(event) =>
            setParams(event.target.value === 'all' ? {} : { lesson: event.target.value })
          }
        >
          <option value="all">全部已发布章节</option>
          {lessons.map((lesson) => (
            <option value={lesson.id} key={lesson.id}>
              {lesson.label} · {lesson.shortTitle}
            </option>
          ))}
        </select>
      </label>
      <div className="practice-summary">
        <div
          className="practice-ring"
          style={{
            background: `conic-gradient(var(--accent) ${(questions.length ? correct / questions.length : 0) * 360}deg, var(--border) 0deg)`,
          }}
        >
          <span>
            {correct}
            <small>/{questions.length}</small>
          </span>
        </div>
        <div>
          <strong>{correct === questions.length ? '已发布练习已全部答对' : '我的随堂练习'}</strong>
          <p>
            {questions.filter((question) => answers[question.id] !== undefined).length} 道已作答，
            {incorrect.length} 道待巩固
          </p>
        </div>
        <Link to={selectedLesson?.path || '/roadmap'}>
          {selectedLesson ? '返回正文' : '查看知识地图'}
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="page-tabs" aria-label="练习筛选">
        {['全部题目', '待巩固', '未作答'].map((item) => (
          <button
            key={item}
            className={filter === item ? 'active' : ''}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {visible.length ? (
        visible.map((question) => <Quiz key={question.id} id={question.id} />)
      ) : (
        <div className="empty-state">
          <Check size={30} />
          <h2>{filter === '待巩固' ? '目前没有待巩固的错题' : '每一道题，都已经思考过了'}</h2>
          <p>答对之后，也可以试着解释其他选项为什么不成立。</p>
          <button className="text-button" onClick={() => setFilter('全部题目')}>
            查看全部题目
            <ArrowUpRight size={15} />
          </button>
        </div>
      )}
    </main>
  );
}
