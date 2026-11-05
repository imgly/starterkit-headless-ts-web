// Highlight source as escaped text; edited code must never become HTML markup.
export function highlightCode(source: string): string {
  const tokens =
    /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(async|await|function|const|let|var|return|try|finally|catch|throw|new|if|else|for|of|in|while|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b|\b([\w$]+)(?=\s*\()/g;
  const escape = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let result = '';
  let end = 0;
  for (const match of source.matchAll(tokens)) {
    const start = match.index!;
    const kind = match[1]
      ? 'comment'
      : match[2]
        ? 'string'
        : match[3]
          ? 'keyword'
          : match[4]
            ? 'number'
            : 'function';
    result += escape(source.slice(end, start));
    result += `<span class="token-${kind}">${escape(match[0])}</span>`;
    end = start + match[0].length;
  }
  return result + escape(source.slice(end));
}
