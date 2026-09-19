import { useEffect, useRef, useState } from 'react';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import json from 'shiki/langs/json.mjs';
import light from 'shiki/themes/github-light.mjs';
import dark from 'shiki/themes/github-dark-default.mjs';

const highlighter = createHighlighterCore({
  themes: [light, dark],
  langs: [json],
  engine: createJavaScriptRegexEngine(),
});

export function JsonEditor({
  value,
  onChange,
  label = '实验 JSON 配置',
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  maxLength?: number;
}) {
  const [html, setHtml] = useState('');
  const highlight = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    highlighter.then((instance) => {
      if (!cancelled)
        setHtml(
          instance.codeToHtml(value, {
            lang: 'json',
            themes: { light: 'github-light', dark: 'github-dark-default' },
            defaultColor: false,
            tabindex: false,
          }),
        );
    });
    return () => {
      cancelled = true;
    };
  }, [value]);
  return (
    <div className="json-editor">
      <div
        ref={highlight}
        className="editor-highlight"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <textarea
        aria-label={label}
        maxLength={maxLength}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (highlight.current) {
            highlight.current.scrollTop = event.currentTarget.scrollTop;
            highlight.current.scrollLeft = event.currentTarget.scrollLeft;
          }
        }}
        style={!html ? { color: 'var(--text)' } : undefined}
      />
    </div>
  );
}
