# NibrasCode Python sandbox (Pyodide). emit(kind, text) worker.js tərəfindən verilir.
import ast, builtins, types, json, time as _time, sys as _sys, contextlib, io, base64

ALLOWED = set()
WARM = "math cmath random statistics datetime re json collections itertools functools decimal fractions string heapq bisect operator typing dataclasses enum abc copy textwrap pprint array calendar numbers hashlib base64 uuid unicodedata io csv contextlib pathlib".split()
ALLOWED = set(WARM)
BLOCKED_MODS = set("js pyodide pyodide_js pyodide_http _pyodide _pyodide_core ctypes _ctypes importlib imp builtins subprocess multiprocessing threading socket ssl urllib http ftplib smtplib webbrowser signal gc inspect marshal pickle shelve".split())
BAD = set("compile breakpoint help copyright credits license exit quit __loader__ __spec__ __package__".split())
DANGER = set("__globals__ __subclasses__ __builtins__ __import__ __code__ __closure__ __loader__ __spec__ __getattribute__ __reduce__ __reduce_ex__ __self__ __func__ __traceback__ gi_frame gi_code cr_frame cr_code ag_frame ag_code f_globals f_locals f_builtins f_back f_code tb_frame tb_next co_code func_globals _getframe".split())
LIMIT = 2000000


class NeedInput(BaseException):
    pass


class Guard(ast.NodeVisitor):
    def bad(s, n, m): raise PermissionError(f"Sətir {getattr(n, 'lineno', '?')}: {m}")
    def mod(s, n, full):
        if full.split(".")[0] in BLOCKED_MODS: s.bad(n, f"'{full}' modulu təhlükəsizlik üçün bloklanıb")
    def visit_Import(s, n):
        for a in n.names: s.mod(n, a.name)
    def visit_ImportFrom(s, n):
        if n.level: s.bad(n, "Nisbi import dəstəklənmir")
        s.mod(n, n.module or "")
    def visit_Attribute(s, n):
        if n.attr in DANGER: s.bad(n, f"'{n.attr}' təhlükəli sistem atributudur")
        s.generic_visit(n)
    def visit_Name(s, n):
        if n.id in DANGER or n.id == "__import__": s.bad(n, f"'{n.id}' bloklanıb")
    def visit_Constant(s, n):
        if isinstance(n.value, str) and any(d in n.value for d in ("__globals__", "__subclasses__", "__builtins__", "__import__", "__getattribute__")):
            s.bad(n, "Mətndə təhlükəli sistem atributu aşkarlandı")


def _chk(n):
    if not isinstance(n, str) or n in DANGER: raise PermissionError(f"'{n}' təhlükəli sistem atributudur")

def _ga(o, n, *d): _chk(n); return getattr(o, n, *d)
def _ha(o, n): _chk(n); return hasattr(o, n)
def _sa(o, n, v): _chk(n); setattr(o, n, v)
def _da(o, n): _chk(n); delattr(o, n)


class Out:
    def __init__(s, kind):
        s.k, s.buf, s.n, s.last = kind, [], 0, _time.monotonic()
    def write(s, x):
        x = str(x)
        if s.k == "e":
            s.peer.flush(); emit("e", x); return len(x)
        s.n += len(x)
        if s.n > LIMIT:
            s.flush()
            raise RuntimeError("Çıxış limiti aşıldı (2 000 000 simvol)")
        s.buf.append(x)
        if len(s.buf) > 50 or _time.monotonic() - s.last > 0.05:
            s.flush()
        return len(x)
    def flush(s):
        if s.buf:
            emit(s.k, "".join(s.buf)); s.buf = []
        s.last = _time.monotonic()


def _flush_figs():
    if "matplotlib" not in _sys.modules:
        return
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        nums = plt.get_fignums()
        if not nums:
            return
        for n in nums:
            fig = plt.figure(n)
            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=144, bbox_inches="tight",
                        facecolor=fig.get_facecolor() or "white")
            emit("i", "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii"))
        plt.close("all")
    except Exception:
        pass


def run(code, inputs, seed=0):
    __import__("random").seed(seed)
    out, err, vals = Out("o"), Out("e"), iter(inputs)
    err.peer = out

    def exit_(c=0): raise SystemExit(c)

    def inp(prompt=""):
        out.write(str(prompt))
        try: v = next(vals)
        except StopIteration:
            out.flush(); raise NeedInput()
        out.write(str(v) + "\n"); return str(v)

    def sleep(sec):
        out.flush(); _time.sleep(min(float(sec), 30))

    tm = types.ModuleType("time")
    for k in dir(_time):
        if not k.startswith("_"): setattr(tm, k, getattr(_time, k))
    tm.sleep = sleep
    sm = types.ModuleType("sys")
    sm.version, sm.maxsize, sm.argv, sm.exit = _sys.version, _sys.maxsize, ["main.py"], exit_
    sm.stdout, sm.stderr = out, err
    sm.stdin = types.SimpleNamespace(readline=lambda: inp() + "\n", read=lambda: "")
    om = types.ModuleType("os")
    om.name, om.sep, om.linesep, om.environ = "posix", "/", "\n", {}
    om.getcwd, om.getenv, om.system = (lambda: "/"), (lambda k, d=None: d), (lambda c="": 0)
    stubs = {"sys": sm, "time": tm, "os": om}

    def imp(name, g=None, l=None, fromlist=(), level=0):
        root = name.split(".")[0]
        if level or root in BLOCKED_MODS:
            raise ImportError(f"'{name}' modulu təhlükəsizlik üçün bloklanıb")
        if root in stubs: return stubs[root]
        return builtins.__import__(name, g, l, fromlist, level)

    def guarded(src, mode):
        t = ast.parse(src.strip() if mode == "eval" else src, "<string>", mode)
        Guard().visit(t)
        return compile(t, "<string>", mode)

    def eval_(src, g=None, l=None):
        if not isinstance(src, str): raise TypeError("eval() mətn qəbul edir")
        return eval(guarded(src, "eval"), env if g is None else g, l)

    def exec_(src, g=None, l=None):
        if not isinstance(src, str): raise TypeError("exec() mətn qəbul edir")
        exec(guarded(src, "exec"), env if g is None else g, l)

    safe = {k: v for k, v in vars(builtins).items() if k not in BAD}
    safe.update(input=inp, eval=eval_, exec=exec_, exit=exit_, quit=exit_, getattr=_ga, hasattr=_ha, setattr=_sa, delattr=_da, __import__=imp)
    env = {"__builtins__": safe, "__name__": "__main__"}
    lines = code.split("\n")
    try:
        tree = ast.parse(code, "main.py")
        Guard().visit(tree)
        last = ast.Expression(tree.body.pop().value) if tree.body and isinstance(tree.body[-1], ast.Expr) else None
        res = None
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            exec(compile(tree, "main.py", "exec"), env)
            if last is not None:
                v = eval(compile(last, "main.py", "eval"), env)
                if v is not None: res = repr(v)[:20000]
        out.flush(); err.flush()
        _flush_figs()
        return json.dumps({"ok": 1, "res": res}, ensure_ascii=False)
    except NeedInput:
        return json.dumps({"need": 1})
    except SystemExit:
        out.flush(); err.flush()
        _flush_figs()
        return json.dumps({"ok": 1, "res": None})
    except BaseException as x:
        out.flush(); err.flush()
        if isinstance(x, SyntaxError):
            line, msg = x.lineno, x.msg
        else:
            fr = [f for f in __import__("traceback").extract_tb(x.__traceback__) if f.filename == "main.py"]
            line, msg = (fr[-1].lineno if fr else getattr(x, "lineno", None)), str(x)
        src = lines[line - 1].strip() if line and 0 < line <= len(lines) else ""
        return json.dumps({"ok": 0, "name": type(x).__name__, "msg": msg, "line": line, "src": src}, ensure_ascii=False)
