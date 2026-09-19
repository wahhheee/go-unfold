import { useEffect, useState } from 'react';
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
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    let cancelled = false;
    highlighter.then((instance) => {
      if (!cancelled)
        setHtml(
          instance.codeToHtml(value, {
            lang: 'json',
            themes: { light: 'github-light', dark: 'github-dark-default' },
            defaultColor: false,
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
        className="editor-highlight"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <textarea
        aria-label="实验 JSON 配置"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={!html ? { color: 'var(--text)' } : undefined}
      />
    </div>
  );
}
