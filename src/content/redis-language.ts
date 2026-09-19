import type { LanguageRegistration } from 'shiki';

// Redis 命令不是 Shell 脚本，单独注册语法以保留准确的语言标识。
export const redisLanguage: LanguageRegistration = {
  name: 'redis',
  scopeName: 'source.redis',
  repository: {},
  patterns: [
    { name: 'comment.line.redis', match: '#.*$' },
    {
      name: 'string.quoted.double.redis',
      begin: '"',
      end: '"',
      patterns: [{ name: 'constant.character.escape.redis', match: '\\\\.' }],
    },
    { name: 'string.quoted.single.redis', begin: "'", end: "'" },
    {
      name: 'keyword.control.redis',
      match:
        '(?i)\\b(SET|GET|DEL|DELEX|SETNX|EXPIRE|PEXPIRE|TTL|PTTL|EVAL|EVALSHA|INCR|WAIT|NX|XX|PX|EX|IFEQ|IFNE|KEEPTTL)\\b',
    },
    { name: 'constant.numeric.redis', match: '\\b[0-9]+\\b' },
  ],
};
