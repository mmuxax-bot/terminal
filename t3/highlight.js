const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const JSKW = new Set('async await break case catch class const continue default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while yield'.split(' '));
const JSCO = new Set(['true', 'false', 'null', 'undefined', 'NaN']);
const L = {
  html: { re: /(<!--[\s\S]*?(?:-->|$))|(<\/?[A-Za-z][\w-]*|\/?>)|("[^"]*"?|'[^']*'?)|([\w:@-]+(?==))/g, cls: m => m[1] ? 'c' : m[2] ? 'k' : m[3] ? 's' : 'f' },
  css: { re: /(\/\*[\s\S]*?(?:\*\/|$))|("[^"\n]*"?|'[^'\n]*'?)|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?\b)|([\w-]+(?=\s*:))|([.#][\w-]+)/g, cls: m => m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : m[5] ? 'b' : 'f' },
  js: { re: /(\/\/.*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?)|(\b\d[\d_]*\.?\d*\b)|([A-Za-z_$][\w$]*)/g,
    cls: m => m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : JSKW.has(m[0]) ? 'k' : JSCO.has(m[0]) ? 'n' : /^\s*\(/.test(m.input.slice(m.index + m[0].length, m.index + m[0].length + 3)) ? 'f' : '' }
};
export function highlight(lang, v) {
  const { re, cls } = L[lang]; let o = '', i = 0, m; re.lastIndex = 0;
  while ((m = re.exec(v))) {
    if (!m[0]) { re.lastIndex++; continue; }
    o += esc(v.slice(i, m.index)); i = re.lastIndex;
    const c = cls(m); o += c ? `<span class="${c}">${esc(m[0])}</span>` : esc(m[0]);
  }
  return o + esc(v.slice(i)) + '\n';
}
