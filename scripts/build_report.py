"""Render the checked A2 Markdown report and its two figures to PDF."""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "A2-report-draft.md"
OUTPUT = ROOT / "output" / "pdf" / "A2_Project_Report.pdf"
FONT_ROOT = Path("/System/Library/Fonts/Supplemental")
pdfmetrics.registerFont(TTFont("ArialA2", str(FONT_ROOT / "Arial.ttf")))
pdfmetrics.registerFont(TTFont("ArialA2Bold", str(FONT_ROOT / "Arial Bold.ttf")))
pdfmetrics.registerFont(TTFont("GeorgiaA2", str(FONT_ROOT / "Georgia.ttf")))
pdfmetrics.registerFont(TTFont("GeorgiaA2Bold", str(FONT_ROOT / "Georgia Bold.ttf")))
pdfmetrics.registerFontFamily(
    "ArialA2", normal="ArialA2", bold="ArialA2Bold", italic="ArialA2", boldItalic="ArialA2Bold"
)

INK = colors.HexColor("#1e3025")
MUTED = colors.HexColor("#52675a")
ACCENT = colors.HexColor("#2e634a")
LINE = colors.HexColor("#d7dfd3")

styles = {
    "title": ParagraphStyle(
        "title", fontName="GeorgiaA2Bold", fontSize=19, leading=23, textColor=INK, spaceAfter=10
    ),
    "meta": ParagraphStyle(
        "meta", fontName="ArialA2", fontSize=8.8, leading=12.3, textColor=MUTED, spaceAfter=1
    ),
    "h2": ParagraphStyle(
        "h2", fontName="GeorgiaA2Bold", fontSize=12.1, leading=16, textColor=INK,
        spaceBefore=15, spaceAfter=7, keepWithNext=True,
    ),
    "h3": ParagraphStyle(
        "h3", fontName="ArialA2Bold", fontSize=9.8, leading=13.3, textColor=ACCENT,
        spaceBefore=11, spaceAfter=5, keepWithNext=True,
    ),
    "body": ParagraphStyle(
        "body", fontName="ArialA2", fontSize=9.25, leading=13.4, textColor=INK,
        spaceAfter=7.5, allowWidows=0, allowOrphans=0,
    ),
    "caption": ParagraphStyle(
        "caption", fontName="ArialA2", fontSize=8.2, leading=11, textColor=MUTED,
        spaceBefore=5, spaceAfter=9, keepWithNext=False,
    ),
    "reference": ParagraphStyle(
        "reference", fontName="ArialA2", fontSize=8.1, leading=11.2, textColor=INK,
        leftIndent=10, firstLineIndent=-10, spaceAfter=5, splitLongWords=1,
    ),
}


def inline_markup(value: str) -> str:
    value = html.escape(value)
    value = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<link href="\2" color="#2e634a">\1</link>', value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", value)
    return value


def figure(name: str, max_width: float, max_height: float) -> Image:
    path = ROOT / "docs" / f"{name}.png"
    image = Image(str(path))
    scale = min(max_width / image.imageWidth, max_height / image.imageHeight)
    image.drawWidth = image.imageWidth * scale
    image.drawHeight = image.imageHeight * scale
    image.hAlign = "CENTER"
    return image


def footer(canvas, doc) -> None:
    canvas.saveState()
    width, _ = doc.pagesize
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 15 * mm, width - 18 * mm, 15 * mm)
    canvas.setFont("ArialA2", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, "Intelligent Interactive Systems · Assignment 2")
    canvas.drawRightString(width - 18 * mm, 10 * mm, str(doc.page))
    canvas.restoreState()


def build() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    portrait_size = A4
    landscape_size = landscape(A4)
    portrait_frame = Frame(18 * mm, 21 * mm, portrait_size[0] - 36 * mm, portrait_size[1] - 38 * mm,
                           leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    landscape_frame = Frame(18 * mm, 20 * mm, landscape_size[0] - 36 * mm, landscape_size[1] - 36 * mm,
                            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc = BaseDocTemplate(str(OUTPUT), pagesize=A4, title="Outfit, considered - Assignment 2 Project Report",
                          author="IIS project", leftMargin=18 * mm, rightMargin=18 * mm)
    doc.addPageTemplates([
        PageTemplate(id="portrait", frames=[portrait_frame], onPage=footer, pagesize=portrait_size),
        PageTemplate(id="landscape", frames=[landscape_frame], onPage=footer, pagesize=landscape_size),
    ])

    story = []
    in_references = False
    after_landscape_figure = False
    for line in SOURCE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("# "):
            story.append(Paragraph(inline_markup(line[2:]), styles["title"]))
        elif line.startswith("**") and not in_references:
            story.append(Paragraph(inline_markup(line), styles["meta"]))
        elif line.startswith("## "):
            heading = line[3:]
            if heading == "References":
                in_references = True
            story.append(Paragraph(inline_markup(heading), styles["h2"]))
        elif line.startswith("### "):
            story.append(Paragraph(inline_markup(line[4:]), styles["h3"]))
        elif line == "![System diagram](architecture.svg)":
            story.append(Spacer(1, 5))
            story.append(figure("architecture", 174 * mm, 88 * mm))
        elif line == "![Illustrated storyboards](storyboards.svg)":
            story.extend([NextPageTemplate("landscape"), PageBreak(),
                          figure("storyboards", 248 * mm, 164 * mm)])
            after_landscape_figure = True
        elif line.startswith("*Figure "):
            story.append(Paragraph(inline_markup(line.strip("*")), styles["caption"]))
            if after_landscape_figure:
                story.extend([NextPageTemplate("portrait"), PageBreak()])
                after_landscape_figure = False
        else:
            style = styles["reference"] if in_references else styles["body"]
            story.append(Paragraph(inline_markup(line), style))
    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()
