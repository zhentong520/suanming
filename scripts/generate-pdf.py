#!/usr/bin/env python3
"""将 docs/使用文档.md 转为 PDF（支持中文）"""

import re
import sys
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parent.parent
MD_FILE = ROOT / "docs" / "使用文档.md"
OUT_FILE = ROOT / "docs" / "易道命理使用文档.pdf"

# Windows 常见中文字体
FONT_CANDIDATES = [
    Path(r"C:\Windows\Fonts\msyh.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path(r"C:\Windows\Fonts\simsun.ttc"),
    Path("/System/Library/Fonts/PingFang.ttc"),
    Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
]


def find_font() -> Path:
    for p in FONT_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("未找到中文字体，请安装微软雅黑或思源黑体")


class DocPDF(FPDF):
    def __init__(self):
        super().__init__()
        font_path = find_font()
        self.add_font("CJK", "", str(font_path))
        self.add_font("CJK", "B", str(font_path))
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        if self.page_no() > 1:
            self.set_font("CJK", "", 9)
            self.set_text_color(150, 150, 150)
            self.cell(0, 8, "易道命理 — 使用文档", align="C", new_x="LMARGIN", new_y="NEXT")
            self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("CJK", "", 9)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"第 {self.page_no()} 页", align="C")

    def write_line(self, text: str, size: int = 11, bold: bool = False, color=(44, 44, 44)):
        self.set_font("CJK", "B" if bold else "", size)
        self.set_text_color(*color)
        clean = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
        clean = re.sub(r"`(.+?)`", r"\1", clean)
        self.multi_cell(0, 7, clean)
        self.ln(1)

    def write_code_block(self, lines: list[str]):
        self.set_fill_color(248, 244, 236)
        self.set_font("CJK", "", 9)
        self.set_text_color(60, 60, 60)
        for line in lines:
            self.cell(0, 5, "  " + line, new_x="LMARGIN", new_y="NEXT", fill=True)
        self.ln(3)

    def write_table(self, rows: list[list[str]]):
        if not rows:
            return
        col_count = len(rows[0])
        width = (self.w - 36) / col_count
        self.set_font("CJK", "", 9)
        for i, row in enumerate(rows):
            if i == 0:
                self.set_fill_color(245, 240, 230)
                self.set_text_color(194, 58, 43)
            else:
                self.set_fill_color(255, 255, 255)
                self.set_text_color(44, 44, 44)
            for cell in row:
                cell_text = cell.strip()
                self.cell(width, 7, cell_text[:40], border=1, fill=True)
            self.ln()
        self.ln(3)


def parse_table_row(line: str) -> list[str] | None:
    if not line.strip().startswith("|"):
        return None
    parts = [p.strip() for p in line.strip().strip("|").split("|")]
    if all(re.match(r"^[-:]+$", p) for p in parts):
        return None
    return parts


def md_to_pdf(md_path: Path, out_path: Path):
    text = md_path.read_text(encoding="utf-8")
    lines = text.splitlines()

    pdf = DocPDF()
    pdf.add_page()

    in_code = False
    code_buf: list[str] = []
    table_buf: list[list[str]] = []

    i = 0
    while i < len(lines):
        line = lines[i]

        if line.strip().startswith("```"):
            if in_code:
                pdf.write_code_block(code_buf)
                code_buf = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        row = parse_table_row(line)
        if row is not None:
            table_buf.append(row)
            i += 1
            if i < len(lines) and not lines[i].strip().startswith("|"):
                pdf.write_table(table_buf)
                table_buf = []
            continue
        elif table_buf:
            pdf.write_table(table_buf)
            table_buf = []

        if line.strip() == "---":
            pdf.ln(2)
            i += 1
            continue

        if line.startswith("# "):
            pdf.ln(4)
            pdf.write_line(line[2:], size=20, bold=True, color=(194, 58, 43))
            i += 1
            continue

        if line.startswith("## "):
            pdf.ln(3)
            pdf.write_line(line[3:], size=15, bold=True, color=(194, 58, 43))
            i += 1
            continue

        if line.startswith("### "):
            pdf.ln(2)
            pdf.write_line(line[4:], size=12, bold=True, color=(184, 134, 11))
            i += 1
            continue

        if line.startswith("> "):
            pdf.set_font("CJK", "", 10)
            pdf.set_text_color(100, 100, 100)
            pdf.multi_cell(0, 6, line[2:])
            pdf.ln(2)
            i += 1
            continue

        if line.strip().startswith("- "):
            pdf.write_line("  • " + line.strip()[2:], size=10)
            i += 1
            continue

        if re.match(r"^\d+\.\s", line.strip()):
            pdf.write_line("  " + line.strip(), size=10)
            i += 1
            continue

        if line.strip() == "":
            pdf.ln(2)
            i += 1
            continue

        pdf.write_line(line.strip(), size=10)
        i += 1

    if table_buf:
        pdf.write_table(table_buf)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(out_path))
    print(f"PDF generated: {out_path}")

    alias = out_path.parent / "usage-manual.pdf"
    if alias != out_path:
        alias.write_bytes(out_path.read_bytes())
        print(f"PDF alias: {alias}")


if __name__ == "__main__":
    md = Path(sys.argv[1]) if len(sys.argv) > 1 else MD_FILE
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else OUT_FILE
    md_to_pdf(md, out)
