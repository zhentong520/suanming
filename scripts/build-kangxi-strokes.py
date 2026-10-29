import csv
import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "content" / "kangxi-strokecount.csv"
raw = path.read_text(encoding="utf-8-sig")
lines = raw.splitlines()
start = next(i for i, l in enumerate(lines) if l.startswith("CodePoint"))
reader = csv.DictReader(lines[start:])
out: dict[str, int] = {}
for r in reader:
    try:
        value = int(r["Value"])
        strokes = int(r["Strokes"])
        out[chr(value)] = strokes
    except Exception:
        continue

out_path = Path(__file__).resolve().parents[1] / "content" / "kangxi-strokes.json"
out_path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
log = Path(__file__).resolve().parents[1] / "content" / "_kangxi_build_log.txt"
samples = {c: out.get(c) for c in ["华", "華", "张", "張", "龙", "龍", "一", "永", "发", "發", "門", "门"]}
log.write_text(
    f"entries={len(out)} size_kb={out_path.stat().st_size // 1024}\n{json.dumps(samples, ensure_ascii=False)}\n",
    encoding="utf-8",
)
print("ok", len(out))
