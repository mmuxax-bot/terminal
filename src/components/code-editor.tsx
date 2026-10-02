import CodeMirror from "@uiw/react-codemirror";
import {
  editorExtensions,
  errorExtensions,
  type EditorDiagnostic,
  type EditorLang,
} from "@/lib/cm-theme";
import { cn } from "@/lib/utils";
import { EditorView } from "@codemirror/view";
import { useEffect, useMemo, useRef, useState } from "react";

export type { EditorDiagnostic };

const EMPTY_DIAGS: EditorDiagnostic[] = [];

type Props = {
  lang: EditorLang;
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  className?: string;
  diagnostics?: EditorDiagnostic[];
  jumpLine?: number;
  jumpSeq?: number;
};

export function CodeEditor({
  lang,
  value,
  onChange,
  onRun,
  className,
  diagnostics,
  jumpLine,
  jumpSeq,
}: Props) {
  const [ready, setReady] = useState(false);
  const viewRef = useRef<EditorView | null>(null);
  const diags = diagnostics ?? EMPTY_DIAGS;
  const extensions = useMemo(
    () => [...editorExtensions(lang, onRun), ...errorExtensions(diags)],
    [lang, onRun, diags],
  );

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !jumpLine || jumpLine < 1) return;
    if (jumpLine > view.state.doc.lines) return;
    const line = view.state.doc.line(jumpLine);
    view.dispatch({
      selection: { anchor: line.from },
      effects: EditorView.scrollIntoView(line.from, { y: "center" }),
    });
    view.focus();
  }, [jumpSeq, jumpLine]);

  if (!ready) {
    return <div className={cn("h-full min-h-0 bg-panel", className)} />;
  }

  return (
    <div className={cn("h-full min-h-0 overflow-hidden bg-panel", className)}>
      <CodeMirror
        value={value}
        height="100%"
        theme="dark"
        extensions={extensions}
        onChange={onChange}
        onCreateEditor={(view) => {
          viewRef.current = view;
        }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          autocompletion: true,
          indentOnInput: true,
          bracketMatching: true,
        }}
      />
    </div>
  );
}
