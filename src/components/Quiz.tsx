import { useState } from 'react';
import { ArrowRight, Check, CircleHelp, RotateCcw, X } from 'lucide-react';
import { getQuestion } from '../content/questions';
import { useLearning } from '../state/learning';

export function Quiz({ id }: { id: string }) {
  const question = getQuestion(id);
  const { state, answer } = useLearning(question.lessonId);
  const stored = state.answers[id];
  const [selected, setSelected] = useState<number | null>(stored ?? null);
  const submitted = stored !== undefined;
  const correct = stored === question.answer;
  return (
    <section className="quiz framed-tool" aria-label={question.title}>
      <div className="tool-eyebrow">
        <CircleHelp size={16} />
        <span>随堂练习</span>
        <span className="tool-type">单选题</span>
      </div>
      <h3>{question.title}</h3>
      <p className="quiz-prompt">{question.prompt}</p>
      <fieldset disabled={submitted}>
        <legend className="sr-only">{question.prompt}</legend>
        {question.options.map((option, index) => (
          <label
            key={option}
            className={`quiz-option ${selected === index ? 'selected' : ''} ${submitted && index === question.answer ? 'correct' : ''} ${submitted && stored === index && !correct ? 'incorrect' : ''}`}
          >
            <input
              type="radio"
              name={id}
              checked={selected === index}
              onChange={() => setSelected(index)}
            />
            <span className="option-letter">{String.fromCharCode(65 + index)}</span>
            <span>{option}</span>
            {submitted && index === question.answer && <Check size={17} />}
            {submitted && stored === index && !correct && <X size={17} />}
          </label>
        ))}
      </fieldset>
      {submitted ? (
        <div className={`quiz-feedback ${correct ? 'success' : 'warning'}`} role="status">
          <strong>{correct ? '理解到位。' : '这里藏着一个边界。'}</strong>
          <p>{question.explanations[stored]}</p>
          {!correct && (
            <p>
              <strong>正确答案：{String.fromCharCode(65 + question.answer)}。</strong>
              {question.explanations[question.answer].replace('正确。', '')}
            </p>
          )}
          <button
            className="text-button"
            onClick={() => {
              answer(id, null);
              setSelected(null);
            }}
          >
            <RotateCcw size={14} />
            重新作答
          </button>
        </div>
      ) : (
        <div className="quiz-footer">
          <span>先做判断，再看解释。</span>
          <button
            className="button small"
            disabled={selected === null}
            onClick={() => selected !== null && answer(id, selected)}
          >
            验证答案
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
