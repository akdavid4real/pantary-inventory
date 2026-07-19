from __future__ import annotations

import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_FILE = OUTPUT_DIR / "Pantry-to-Plate-Backend-Team-Guide.pdf"

PAGE_W, PAGE_H = A4
MARGIN_X = 18 * mm
CONTENT_W = PAGE_W - (2 * MARGIN_X)

INK = HexColor("#17362E")
GREEN = HexColor("#07513F")
GREEN_2 = HexColor("#176A54")
MINT = HexColor("#E8F1EB")
CREAM = HexColor("#FFF9F0")
PAPER = HexColor("#FFFEFB")
CORAL = HexColor("#FF5F4B")
CORAL_SOFT = HexColor("#FFF0EC")
GOLD = HexColor("#E0A93F")
GOLD_SOFT = HexColor("#FFF4D9")
GRAY = HexColor("#65756F")
LINE = HexColor("#D9E1DC")
WHITE = colors.white


def register_fonts() -> None:
    font_dir = Path(r"C:\Windows\Fonts")
    fonts = {
        "UI": font_dir / "segoeui.ttf",
        "UI-Bold": font_dir / "segoeuib.ttf",
        "Display": font_dir / "georgia.ttf",
        "Display-Bold": font_dir / "georgiab.ttf",
    }
    for name, path in fonts.items():
        if path.exists():
            pdfmetrics.registerFont(TTFont(name, str(path)))


register_fonts()

FONT_UI = "UI" if "UI" in pdfmetrics.getRegisteredFontNames() else "Helvetica"
FONT_UI_BOLD = "UI-Bold" if "UI-Bold" in pdfmetrics.getRegisteredFontNames() else "Helvetica-Bold"
FONT_DISPLAY = "Display" if "Display" in pdfmetrics.getRegisteredFontNames() else "Times-Roman"
FONT_DISPLAY_BOLD = "Display-Bold" if "Display-Bold" in pdfmetrics.getRegisteredFontNames() else "Times-Bold"


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="Kicker",
        fontName=FONT_UI_BOLD,
        fontSize=8.5,
        leading=11,
        textColor=CORAL,
        spaceAfter=6,
        uppercase=True,
    )
)
styles.add(
    ParagraphStyle(
        name="PageTitle",
        fontName=FONT_DISPLAY_BOLD,
        fontSize=25,
        leading=29,
        textColor=GREEN,
        spaceAfter=10,
    )
)
styles.add(
    ParagraphStyle(
        name="PageLead",
        fontName=FONT_UI,
        fontSize=10.5,
        leading=15,
        textColor=GRAY,
        spaceAfter=15,
    )
)
styles.add(
    ParagraphStyle(
        name="H2Custom",
        fontName=FONT_DISPLAY_BOLD,
        fontSize=15,
        leading=19,
        textColor=INK,
        spaceBefore=6,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="H3Custom",
        fontName=FONT_UI_BOLD,
        fontSize=10.5,
        leading=14,
        textColor=GREEN,
        spaceBefore=4,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyCustom",
        fontName=FONT_UI,
        fontSize=9.2,
        leading=13.2,
        textColor=INK,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallCustom",
        fontName=FONT_UI,
        fontSize=7.8,
        leading=10.5,
        textColor=GRAY,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallBold",
        fontName=FONT_UI_BOLD,
        fontSize=8,
        leading=10.5,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="CardTitle",
        fontName=FONT_UI_BOLD,
        fontSize=10,
        leading=12.5,
        textColor=GREEN,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="CardBody",
        fontName=FONT_UI,
        fontSize=8.3,
        leading=11.3,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="Quote",
        fontName=FONT_DISPLAY,
        fontSize=14,
        leading=20,
        textColor=GREEN,
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        name="CodeCustom",
        fontName="Courier",
        fontSize=7.4,
        leading=10.2,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="TableHead",
        fontName=FONT_UI_BOLD,
        fontSize=7.7,
        leading=9.5,
        textColor=WHITE,
    )
)
styles.add(
    ParagraphStyle(
        name="TableBody",
        fontName=FONT_UI,
        fontSize=7.2,
        leading=9.3,
        textColor=INK,
    )
)


def para(text: str, style: str = "BodyCustom") -> Paragraph:
    return Paragraph(text, styles[style])


def page_intro(kicker: str, title: str, lead: str) -> list:
    return [
        para(kicker.upper(), "Kicker"),
        para(title, "PageTitle"),
        para(lead, "PageLead"),
    ]


def rounded_rect(c: canvas.Canvas, x: float, y: float, w: float, h: float, fill, radius=8, stroke=None):
    c.saveState()
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(0.7)
        c.roundRect(x, y, w, h, radius, fill=1, stroke=1)
    else:
        c.roundRect(x, y, w, h, radius, fill=1, stroke=0)
    c.restoreState()


def draw_arrow(c: canvas.Canvas, x1: float, y1: float, x2: float, y2: float, color=GREEN, width=1.5):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)
    import math

    angle = math.atan2(y2 - y1, x2 - x1)
    size = 5
    a1 = angle + 2.55
    a2 = angle - 2.55
    p1 = (x2 + size * math.cos(a1), y2 + size * math.sin(a1))
    p2 = (x2 + size * math.cos(a2), y2 + size * math.sin(a2))
    path = c.beginPath()
    path.moveTo(x2, y2)
    path.lineTo(*p1)
    path.lineTo(*p2)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    c.restoreState()


class Callout(Flowable):
    def __init__(self, title: str, body: str, tone: str = "green", width=CONTENT_W):
        super().__init__()
        self.width = width
        self.title = title
        self.body = body
        self.tone = tone
        self.title_p = para(title, "CardTitle")
        self.body_p = para(body, "CardBody")
        _, th = self.title_p.wrap(width - 34, 100)
        _, bh = self.body_p.wrap(width - 34, 200)
        self.height = th + bh + 24

    def draw(self):
        c = self.canv
        if self.tone == "coral":
            bg, accent = CORAL_SOFT, CORAL
        elif self.tone == "gold":
            bg, accent = GOLD_SOFT, GOLD
        else:
            bg, accent = MINT, GREEN
        rounded_rect(c, 0, 0, self.width, self.height, bg, radius=9)
        c.setFillColor(accent)
        c.roundRect(0, 0, 5, self.height, 3, fill=1, stroke=0)
        self.title_p.drawOn(c, 18, self.height - 18 - self.title_p.height)
        self.body_p.drawOn(c, 18, 10)


class PipelineDiagram(Flowable):
    def __init__(self, width=CONTENT_W):
        super().__init__()
        self.width = width
        self.height = 174
        self.nodes = [
            ("1", "React page", "Collects intent"),
            ("2", "API helper", "Adds token + JSON"),
            ("3", "Guard", "Checks identity"),
            ("4", "Controller", "Receives HTTP"),
            ("5", "DTO", "Validates input"),
            ("6", "Service", "Applies rules"),
            ("7", "Prisma + DB", "Stores facts"),
        ]

    def draw_node(self, c, x, y, w, h, num, title, caption, active=False):
        rounded_rect(c, x, y, w, h, GREEN if active else PAPER, radius=9, stroke=None if active else LINE)
        c.setFillColor(CORAL if active else GOLD)
        c.circle(x + 17, y + h - 17, 9, fill=1, stroke=0)
        c.setFillColor(WHITE if active else INK)
        c.setFont(FONT_UI_BOLD, 7.5)
        c.drawCentredString(x + 17, y + h - 19.5, num)
        c.setFillColor(WHITE if active else GREEN)
        c.setFont(FONT_UI_BOLD, 9)
        c.drawString(x + 32, y + h - 19.5, title)
        c.setFillColor(WHITE if active else GRAY)
        c.setFont(FONT_UI, 7.2)
        c.drawString(x + 12, y + 12, caption)

    def draw(self):
        c = self.canv
        w = (self.width - 36) / 4
        h = 58
        top_y = 105
        bottom_y = 21
        top = self.nodes[:4]
        bottom = self.nodes[4:]
        for i, node in enumerate(top):
            x = i * (w + 12)
            self.draw_node(c, x, top_y, w, h, *node, active=i == 3)
            if i < 3:
                draw_arrow(c, x + w + 2, top_y + h / 2, x + w + 10, top_y + h / 2, GRAY, 1)
        draw_arrow(c, self.width - w / 2, top_y - 2, self.width - w / 2, bottom_y + h + 7, CORAL, 1.3)
        for i, node in enumerate(reversed(bottom)):
            x = self.width - w - i * (w + 12)
            self.draw_node(c, x, bottom_y, w, h, *node, active=node[1] == "Service")
            if i < 2:
                draw_arrow(c, x - 2, bottom_y + h / 2, x - 10, bottom_y + h / 2, GRAY, 1)
        c.setFillColor(GRAY)
        c.setFont(FONT_UI, 7)
        c.drawString(0, 3, "The response returns through the same path in reverse.")


class MappingChain(Flowable):
    def __init__(self, width=CONTENT_W):
        super().__init__()
        self.width = width
        self.height = 155
        self.labels = [
            ("POST /api/v1/pantry", "HTTP request"),
            ("PantryController.create()", "route mapping"),
            ("CreatePantryItemDto", "input mapping"),
            ("PantryService.create()", "business mapping"),
            ("prisma.pantryItem.create()", "database mapping"),
        ]

    def draw(self):
        c = self.canv
        box_w = (self.width - 48) / 3
        box_h = 48
        coords = [
            (0, 96),
            (box_w + 24, 96),
            ((box_w + 24) * 2, 96),
            (box_w + 24, 24),
            ((box_w + 24) * 2, 24),
        ]
        for i, ((title, caption), (x, y)) in enumerate(zip(self.labels, coords)):
            fill = GREEN if i in (0, 3) else PAPER
            rounded_rect(c, x, y, box_w, box_h, fill, radius=8, stroke=None if fill == GREEN else LINE)
            c.setFillColor(WHITE if fill == GREEN else GREEN)
            c.setFont(FONT_UI_BOLD if i != 0 else "Courier-Bold", 7.5)
            c.drawCentredString(x + box_w / 2, y + 27, title)
            c.setFillColor(WHITE if fill == GREEN else GRAY)
            c.setFont(FONT_UI, 6.8)
            c.drawCentredString(x + box_w / 2, y + 12, caption)
        for a, b in [(0, 1), (1, 2), (3, 4)]:
            x1, y1 = coords[a]
            x2, y2 = coords[b]
            draw_arrow(c, x1 + box_w + 3, y1 + box_h / 2, x2 - 3, y2 + box_h / 2, CORAL, 1.2)
        x1, y1 = coords[2]
        x2, y2 = coords[3]
        c.setStrokeColor(CORAL)
        c.setLineWidth(1.2)
        c.line(x1 + box_w / 2, y1 - 2, x1 + box_w / 2, y2 + box_h + 8)
        c.line(x1 + box_w / 2, y2 + box_h + 8, x2 + box_w / 2, y2 + box_h + 8)
        draw_arrow(c, x2 + box_w / 2, y2 + box_h + 8, x2 + box_w / 2, y2 + box_h + 1, CORAL, 1.2)


class RequestTrace(Flowable):
    def __init__(self, width=CONTENT_W):
        super().__init__()
        self.width = width
        self.height = 395
        self.steps = [
            ("01", "Pantry.tsx", "The form collects rice, quantity, unit, storage, and expiry."),
            ("02", "api.ts", "The browser sends POST /pantry with JSON and a bearer token."),
            ("03", "AuthGuard", "Supabase identity is verified and request.user is attached."),
            ("04", "PantryController", "POST /pantry maps to create(user, dto)."),
            ("05", "CreatePantryItemDto", "Invalid or unexpected fields are rejected."),
            ("06", "PantryService", "The ingredient is resolved and business rules are applied."),
            ("07", "Prisma", "PantryItem and ADDED history log are written."),
            ("08", "React state", "Created JSON returns and the visible list updates."),
        ]

    def draw(self):
        c = self.canv
        x_line = 23
        row_h = 45
        top = self.height - 16
        c.setStrokeColor(LINE)
        c.setLineWidth(2)
        c.line(x_line, 28, x_line, top - 4)
        for i, (num, title, body) in enumerate(self.steps):
            y = top - i * row_h
            c.setFillColor(CORAL if i in (0, 7) else GREEN)
            c.circle(x_line, y, 12, fill=1, stroke=0)
            c.setFillColor(WHITE)
            c.setFont(FONT_UI_BOLD, 6.8)
            c.drawCentredString(x_line, y - 2.5, num)
            if i < len(self.steps) - 1:
                draw_arrow(c, x_line, y - 14, x_line, y - row_h + 14, LINE, 1)
            c.setFillColor(GREEN)
            c.setFont(FONT_UI_BOLD, 9)
            c.drawString(47, y + 3, title)
            c.setFillColor(GRAY)
            c.setFont(FONT_UI, 7.8)
            c.drawString(47, y - 10, body)


class DataModelDiagram(Flowable):
    def __init__(self, width=CONTENT_W):
        super().__init__()
        self.width = width
        self.height = 330

    def box(self, c, x, y, w, h, title, sub, tone="green"):
        fill = MINT if tone == "green" else GOLD_SOFT if tone == "gold" else CORAL_SOFT
        accent = GREEN if tone == "green" else GOLD if tone == "gold" else CORAL
        rounded_rect(c, x, y, w, h, fill, radius=8)
        c.setFillColor(accent)
        c.setFont(FONT_UI_BOLD, 8.3)
        c.drawCentredString(x + w / 2, y + h - 16, title)
        c.setFillColor(GRAY)
        c.setFont(FONT_UI, 6.7)
        c.drawCentredString(x + w / 2, y + 11, sub)

    def draw(self):
        c = self.canv
        center_x = self.width / 2
        user = (center_x - 57, 265, 114, 50)
        ingredient = (center_x - 57, 142, 114, 50)
        recipe = (15, 142, 114, 50)
        pantry = (15, 34, 114, 50)
        meal = (center_x - 57, 34, 114, 50)
        shopping = (self.width - 129, 34, 114, 50)
        cooking = (self.width - 129, 142, 114, 50)
        self.box(c, *user, "USER", "owns personal records", "coral")
        self.box(c, *ingredient, "INGREDIENT", "catalog knowledge", "gold")
        self.box(c, *recipe, "RECIPE", "requires ingredients")
        self.box(c, *pantry, "PANTRY ITEM", "stock the user owns")
        self.box(c, *meal, "MEAL PLAN", "recipe on a date")
        self.box(c, *shopping, "SHOPPING ITEM", "food to purchase")
        self.box(c, *cooking, "COOKING SESSION", "steps + stock usage", "coral")
        # User ownership lines
        ux, uy, uw, uh = user
        for box in (pantry, meal, shopping, cooking):
            bx, by, bw, bh = box
            c.setStrokeColor(LINE)
            c.setLineWidth(1)
            c.line(ux + uw / 2, uy, bx + bw / 2, by + bh)
        # Domain relations
        rx, ry, rw, rh = recipe
        ix, iy, iw, ih = ingredient
        px, py, pw, ph = pantry
        mx, my, mw, mh = meal
        sx, sy, sw, sh = shopping
        cx, cy, cw, ch = cooking
        draw_arrow(c, rx + rw, ry + rh / 2, ix - 4, iy + ih / 2, GREEN, 1.2)
        draw_arrow(c, ix - 8, iy, px + pw, py + ph, GOLD, 1.1)
        draw_arrow(c, ix + iw + 8, iy, sx, sy + sh, GOLD, 1.1)
        draw_arrow(c, rx + rw / 2, ry - 3, mx - 3, my + mh, GREEN, 1.1)
        draw_arrow(c, mx + mw, my + mh / 2, sx - 3, sy + sh / 2, CORAL, 1.1)
        draw_arrow(c, cx, cy + ch / 2, ix + iw + 4, iy + ih / 2, CORAL, 1.1)
        c.setFillColor(GRAY)
        c.setFont(FONT_UI, 6.4)
        c.drawCentredString((rx + rw + ix) / 2, ry + rh / 2 + 7, "recipe ingredient")
        c.drawCentredString(center_x, 6, "Relations connect business facts; they are not duplicate copies of the same object.")


class InventoryLoop(Flowable):
    def __init__(self, width=CONTENT_W):
        super().__init__()
        self.width = width
        self.height = 265
        self.nodes = [
            ("PANTRY", "what I have"),
            ("MATCH", "what I can cook"),
            ("MEALS", "what I plan"),
            ("GROCERY", "what I need"),
            ("COOK", "what I use"),
        ]

    def draw(self):
        import math

        c = self.canv
        cx = self.width / 2
        cy = 132
        radius = 92
        positions = []
        for i, (title, subtitle) in enumerate(self.nodes):
            angle = math.radians(90 - i * 72)
            x = cx + radius * math.cos(angle)
            y = cy + radius * math.sin(angle)
            positions.append((x, y))
            c.setFillColor(GREEN if i in (0, 2) else CORAL if i == 4 else GOLD)
            c.circle(x, y, 31, fill=1, stroke=0)
            c.setFillColor(WHITE)
            c.setFont(FONT_UI_BOLD, 8)
            c.drawCentredString(x, y + 4, title)
            c.setFont(FONT_UI, 6.4)
            c.drawCentredString(x, y - 9, subtitle)
        for i in range(len(positions)):
            x1, y1 = positions[i]
            x2, y2 = positions[(i + 1) % len(positions)]
            dx, dy = x2 - x1, y2 - y1
            dist = math.hypot(dx, dy)
            sx, sy = x1 + dx * 35 / dist, y1 + dy * 35 / dist
            ex, ey = x2 - dx * 35 / dist, y2 - dy * 35 / dist
            draw_arrow(c, sx, sy, ex, ey, GREEN_2, 1.3)
        rounded_rect(c, cx - 64, cy - 22, 128, 44, CREAM, radius=9, stroke=LINE)
        c.setFillColor(GREEN)
        c.setFont(FONT_DISPLAY_BOLD, 10)
        c.drawCentredString(cx, cy + 4, "One connected product")
        c.setFillColor(GRAY)
        c.setFont(FONT_UI, 6.7)
        c.drawCentredString(cx, cy - 10, "Every step changes the next decision")


class SessionTimeline(Flowable):
    def __init__(self, width=CONTENT_W):
        super().__init__()
        self.width = width
        self.height = 310
        self.items = [
            ("00-05", "Tell the product story", "Pantry to Recipes to Meals to Grocery to Cooking."),
            ("05-15", "Draw the pipeline", "Page, API helper, Guard, Controller, DTO, Service, Prisma, DB."),
            ("15-30", "Trace one real request", "Open the six Pantry files and follow POST /pantry."),
            ("30-40", "Team exercise", "Map a new 'purchased from' field without coding it."),
            ("40-45", "Review", "Each person explains one layer in plain language."),
        ]

    def draw(self):
        c = self.canv
        left = 58
        top = self.height - 32
        gap = 58
        c.setStrokeColor(LINE)
        c.setLineWidth(4)
        c.line(left, 34, left, top)
        for i, (time, title, body) in enumerate(self.items):
            y = top - i * gap
            c.setFillColor(CORAL if i in (0, 4) else GREEN)
            c.circle(left, y, 13, fill=1, stroke=0)
            c.setFillColor(GREEN)
            c.setFont(FONT_UI_BOLD, 8.5)
            c.drawRightString(left - 22, y - 3, time)
            c.setFillColor(INK)
            c.setFont(FONT_UI_BOLD, 9.5)
            c.drawString(left + 26, y + 4, title)
            c.setFillColor(GRAY)
            c.setFont(FONT_UI, 7.8)
            c.drawString(left + 26, y - 11, body)


def card_table(cards: list[tuple[str, str]], columns=2, widths=None) -> Table:
    rows = []
    for i in range(0, len(cards), columns):
        row = []
        for title, body in cards[i : i + columns]:
            row.append(
                Table(
                    [[para(title, "CardTitle")], [para(body, "CardBody")]],
                    colWidths=[(CONTENT_W - 12 * (columns - 1)) / columns - 18],
                    style=TableStyle(
                        [
                            ("LEFTPADDING", (0, 0), (-1, -1), 9),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                            ("TOPPADDING", (0, 0), (-1, 0), 9),
                            ("BOTTOMPADDING", (0, -1), (-1, -1), 9),
                        ]
                    ),
                )
            )
        while len(row) < columns:
            row.append("")
        rows.append(row)
    col_widths = widths or [(CONTENT_W - 12 * (columns - 1)) / columns] * columns
    table = Table(rows, colWidths=col_widths, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]
    for r in range(len(rows)):
        for col in range(columns):
            commands.extend(
                [
                    ("BACKGROUND", (col, r), (col, r), PAPER),
                    ("BOX", (col, r), (col, r), 0.6, LINE),
                    ("ROUNDEDCORNERS", [6]),
                ]
            )
    table.setStyle(TableStyle(commands))
    return table


def formatted_table(data, widths, repeat_rows=1, head=True, body_font=7.2) -> Table:
    table = Table(data, colWidths=widths, repeatRows=repeat_rows, hAlign="LEFT")
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
    ]
    if head:
        style.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ]
        )
    for r in range(1 if head else 0, len(data)):
        style.append(("BACKGROUND", (0, r), (-1, r), PAPER if r % 2 else CREAM))
    table.setStyle(TableStyle(style))
    return table


def draw_cover_page(c: canvas.Canvas, doc):
    c.saveState()
    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.circle(PAGE_W + 20, PAGE_H - 80, 180, fill=1, stroke=0)
    c.setFillColor(CORAL)
    c.circle(PAGE_W - 70, PAGE_H - 116, 44, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.circle(58, 72, 38, fill=1, stroke=0)
    c.setFillColor(MINT)
    c.circle(104, 94, 22, fill=1, stroke=0)
    c.restoreState()


def draw_later_page(c: canvas.Canvas, doc):
    c.saveState()
    c.setFillColor(PAPER)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.rect(0, PAGE_H - 9, PAGE_W, 9, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.setFont(FONT_UI_BOLD, 7.5)
    c.drawString(MARGIN_X, PAGE_H - 27, "PANTRY-TO-PLATE")
    c.setFillColor(GRAY)
    c.setFont(FONT_UI, 7.2)
    c.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 27, "BACKEND TEAM GUIDE")
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(MARGIN_X, 26, PAGE_W - MARGIN_X, 26)
    c.setFillColor(GRAY)
    c.setFont(FONT_UI, 7)
    c.drawString(MARGIN_X, 14, "Prepared from the current Pantry-to-Plate codebase - July 2026")
    c.setFont(FONT_UI_BOLD, 7)
    c.drawRightString(PAGE_W - MARGIN_X, 14, f"{doc.page - 1:02d}")
    c.restoreState()


def build_story() -> list:
    story = []

    # Cover
    story.extend(
        [
            Spacer(1, 76 * mm),
            para("PANTRY-TO-PLATE / TEAM LEARNING GUIDE", "Kicker"),
            Paragraph(
                "How Our<br/>Backend Works",
                ParagraphStyle(
                    "CoverTitle",
                    fontName=FONT_DISPLAY_BOLD,
                    fontSize=37,
                    leading=42,
                    textColor=GREEN,
                    spaceAfter=14,
                ),
            ),
            Paragraph(
                "A beginner-friendly guide to domains, mapping, request flow, database relationships, and file ownership.",
                ParagraphStyle(
                    "CoverLead",
                    fontName=FONT_UI,
                    fontSize=13,
                    leading=19,
                    textColor=GRAY,
                    spaceAfter=20,
                    rightIndent=95,
                ),
            ),
            Table(
                [[para("DOMAINS", "SmallBold"), para("MAPPING", "SmallBold"), para("DATA FLOW", "SmallBold"), para("FILE OWNERSHIP", "SmallBold")]],
                colWidths=[30 * mm, 30 * mm, 30 * mm, 39 * mm],
                style=TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), MINT),
                        ("BOX", (0, 0), (-1, -1), 0, MINT),
                        ("INNERGRID", (0, 0), (-1, -1), 0.5, WHITE),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]
                ),
            ),
            Spacer(1, 19 * mm),
            para("Page asks. Controller receives. Service decides. Prisma stores. Database remembers.", "Quote"),
            Spacer(1, 8 * mm),
            Paragraph(
                "PLATESENSE FOOD ENGINE  /  TEAM EDITION  /  JULY 2026",
                ParagraphStyle(
                    "CoverFooter",
                    fontName=FONT_UI_BOLD,
                    fontSize=7.5,
                    leading=10,
                    textColor=GREEN,
                    alignment=TA_CENTER,
                ),
            ),
            PageBreak(),
        ]
    )

    # Big picture
    story += page_intro(
        "01 / The big picture",
        "The backend is the product's decision engine",
        "The frontend shows the experience. The backend protects identity, applies Pantry-to-Plate rules, stores facts, and returns trusted results.",
    )
    story += [PipelineDiagram(), Spacer(1, 9), Callout("The sentence to remember", "Page asks, controller receives, service decides, Prisma stores, database remembers."), Spacer(1, 13)]
    story += [para("What the backend is responsible for", "H2Custom")]
    story += [
        card_table(
            [
                ("Receive", "Accept requests from the React application through versioned API endpoints."),
                ("Protect", "Verify the user, enforce roles, rate limits, and safe input validation."),
                ("Decide", "Apply inventory, recipe, shopping, cooking, and nutrition rules."),
                ("Remember", "Read and write persistent records in Supabase PostgreSQL through Prisma."),
            ],
            columns=2,
        ),
        PageBreak(),
    ]

    # Domain and mapping
    story += page_intro(
        "02 / Core concepts",
        "Domain tells us who owns the rule. Mapping tells us how data moves.",
        "Start with the business language before introducing framework vocabulary. This helps new backend developers understand why a file exists.",
    )
    story += [
        card_table(
            [
                ("DOMAIN", "One business area of the product: Pantry, Recipes, Meal Planner, Shopping List, Cooking Mode, Nutrition, Users, or Auth."),
                ("MAPPING", "The connection between a request, a function, an input object, a business action, and a stored database record."),
            ],
            columns=2,
        ),
        Spacer(1, 4),
        para("One request, five mappings", "H2Custom"),
        MappingChain(),
        Spacer(1, 4),
        Callout(
            "Use business questions first",
            "Ask: Which domain owns this rule? Then ask: Is the change about input, behavior, HTTP routing, or persistent storage?",
            "gold",
        ),
        Spacer(1, 12),
        para("Three mappings you will see every day", "H2Custom"),
        card_table(
            [
                ("HTTP mapping", "A URL and method map to a controller function."),
                ("Object mapping", "Request JSON maps to a validated DTO and service input."),
                ("Database mapping", "Prisma models map TypeScript objects to PostgreSQL tables and relations."),
            ],
            columns=3,
        ),
        PageBreak(),
    ]

    # Folder anatomy
    story += page_intro(
        "03 / Project anatomy",
        "The folder tree mirrors the responsibility of each layer",
        "The frontend and backend live in the same repository, but they have different jobs and separate dependency boundaries.",
    )
    folder_tree = """pantry-inventory/
  src/                         React frontend
    pages/                     User-facing screens
    services/api.ts            Shared API + auth helper
    types/inventory.ts         Frontend response contracts

  backend/
    src/main.ts                Starts and configures the API
    src/app.module.ts          Registers every backend domain
    src/common/                Guards, decorators, filters, utilities
    src/modules/               Business domains
    src/prisma/                Shared database connection
    prisma/schema.prisma       Current data model
    prisma/migrations/         Database change history

  vercel.json                  Routes /api to the backend"""
    tree_box = Table(
        [[para(folder_tree.replace("\n", "<br/>"), "CodeCustom")]],
        colWidths=[CONTENT_W],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), MINT),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]
        ),
    )
    story += [tree_box, Spacer(1, 12), para("The five files inside a normal domain", "H2Custom")]
    file_rows = [
        [para("FILE", "TableHead"), para("RESPONSIBILITY", "TableHead"), para("PLAIN MEANING", "TableHead")],
        [para("*.module.ts", "TableBody"), para("Dependency wiring", "TableBody"), para("Connects the domain's parts.", "TableBody")],
        [para("*.controller.ts", "TableBody"), para("HTTP routes", "TableBody"), para("Receives requests and returns responses.", "TableBody")],
        [para("*.service.ts", "TableBody"), para("Business rules", "TableBody"), para("Decides what should happen.", "TableBody")],
        [para("dto/*.dto.ts", "TableBody"), para("Input contract", "TableBody"), para("Defines and validates what clients may send.", "TableBody")],
        [para("schema.prisma", "TableBody"), para("Stored model", "TableBody"), para("Defines fields, relations, and database shape.", "TableBody")],
    ]
    story += [formatted_table(file_rows, [115, 125, CONTENT_W - 240]), Spacer(1, 12), Callout("Layer rule", "Controllers should stay thin. Services own business decisions. Prisma handles stored data.", "coral"), PageBreak()]

    # Request trace
    story += page_intro(
        "04 / Real request walkthrough",
        "What happens when a user adds rice to Pantry?",
        "Following one real request is the fastest way to connect the abstract layers to actual project files.",
    )
    story += [RequestTrace(), Spacer(1, 4), Callout("The request is user-scoped", "The controller passes user.id into PantryService. Every user-owned query must include userId so one account cannot read or change another account's pantry.", "gold"), PageBreak()]

    # Data model
    story += page_intro(
        "05 / Data model",
        "Similar words can represent different business facts",
        "Rice can be catalog knowledge, owned stock, a recipe requirement, or a shopping intention. The data model keeps those meanings separate and relates them safely.",
    )
    story += [DataModelDiagram(), Spacer(1, 10)]
    distinctions = [
        [para("MODEL", "TableHead"), para("WHAT IT MEANS", "TableHead"), para("EXAMPLE", "TableHead")],
        [para("Ingredient", "TableBody"), para("Shared catalog knowledge", "TableBody"), para("Rice exists; default unit is g.", "TableBody")],
        [para("PantryItem", "TableBody"), para("Stock owned by one user", "TableBody"), para("Ada has 2 kg of rice.", "TableBody")],
        [para("RecipeIngredient", "TableBody"), para("A recipe requirement", "TableBody"), para("Jollof needs 500 g of rice.", "TableBody")],
        [para("ShoppingListItem", "TableBody"), para("An intention or purchase", "TableBody"), para("Buy 1 kg of rice.", "TableBody")],
    ]
    story += [formatted_table(distinctions, [92, 164, CONTENT_W - 256]), PageBreak()]

    # Domain ownership map
    story += page_intro(
        "06 / Domain ownership",
        "Every major business area has a clear backend home",
        "Use this map when deciding where a new endpoint, validation rule, calculation, or database action belongs. Modules can consume other domains through explicit imports and exported services.",
    )
    domain_cards = [
        ("Auth", "Identity and sessions<br/><font color='#65756F'>auth.controller.ts / auth.service.ts</font>"),
        ("Users", "Profile and preferences<br/><font color='#65756F'>users.controller.ts / users.service.ts</font>"),
        ("Ingredients", "Catalog, aliases, nutrition<br/><font color='#65756F'>ingredients/*</font>"),
        ("Pantry", "Owned stock and history<br/><font color='#65756F'>pantry/*</font>"),
        ("Recipes", "Meals, requirements, steps<br/><font color='#65756F'>recipes/*</font>"),
        ("Recipe Matcher", "Pantry versus requirements<br/><font color='#65756F'>recipe-matcher/*</font>"),
        ("Meal Planner", "Dated meal slots and AI preview<br/><font color='#65756F'>meal-planner/*</font>"),
        ("Shopping List", "Missing food and purchases<br/><font color='#65756F'>shopping-list/*</font>"),
        ("Cooking Mode", "Sessions, steps, stock usage<br/><font color='#65756F'>cooking-mode/*</font>"),
        ("Nutrition", "Estimates, logs, summaries<br/><font color='#65756F'>nutrition/*</font>"),
        ("Dashboard", "Cross-domain summary<br/><font color='#65756F'>dashboard/*</font>"),
        ("Recommendations", "Pantry-aware suggestions<br/><font color='#65756F'>recommendations/*</font>"),
        ("Favorites", "Saved recipes<br/><font color='#65756F'>favorites/*</font>"),
        ("Food Analysis", "Gemini image analysis<br/><font color='#65756F'>food-analysis/*</font>"),
        ("Measurements", "User conversion profiles<br/><font color='#65756F'>measurement-profiles/*</font>"),
        ("Admin", "Catalog and moderation tools<br/><font color='#65756F'>admin/*</font>"),
    ]
    story += [card_table(domain_cards, columns=2), PageBreak()]

    # Connected loop
    story += page_intro(
        "07 / Connected product flow",
        "Pantry, Meals, Grocery, and Cooking are one inventory loop",
        "These domains are separate for ownership, but their business outcomes must remain connected and transactionally safe.",
    )
    story += [InventoryLoop(), Spacer(1, 8)]
    story += [
        card_table(
            [
                ("SHOPPING COMPLETION", "Bought ingredients are added into Pantry and recorded with a BOUGHT history log."),
                ("COOKING COMPLETION", "Used ingredients are deducted from Pantry. Completion is blocked when stock is insufficient."),
                ("SHOPPING GENERATION", "Meal requirements are compared against Pantry so the list contains only missing quantities."),
                ("NUTRITION RESULT", "A completed cooking session can create a nutrition log for later summaries."),
            ],
            columns=2,
        ),
        Spacer(1, 7),
        Callout("Why transactions matter", "When several records must change together, a database transaction makes every write succeed or every write fail. Partial inventory updates would corrupt the product story.", "coral"),
        PageBreak(),
    ]

    # Cross cutting and safety
    story += page_intro(
        "08 / Shared infrastructure",
        "Some files influence every domain",
        "These cross-cutting layers make the API consistent before and after each domain-specific business action.",
    )
    shared_rows = [
        [para("FILE", "TableHead"), para("WHY IT MATTERS", "TableHead")],
        [para("backend/src/app.module.ts", "TableBody"), para("Registers modules and global guards.", "TableBody")],
        [para("backend/src/main.ts", "TableBody"), para("Sets API prefix, validation, CORS, security, logging, and Swagger.", "TableBody")],
        [para("backend/src/common/guards/", "TableBody"), para("Checks authentication, roles, and rate limits before controllers run.", "TableBody")],
        [para("backend/src/common/utils/", "TableBody"), para("Shares date, string, and unit conversion rules.", "TableBody")],
        [para("backend/src/prisma/", "TableBody"), para("Provides one shared Prisma database connection.", "TableBody")],
        [para("backend/prisma/schema.prisma", "TableBody"), para("Defines the current database structure and relations.", "TableBody")],
        [para("src/services/api.ts", "TableBody"), para("Centralizes frontend authentication, JSON, errors, retry, and caching.", "TableBody")],
        [para("vercel.json", "TableBody"), para("Routes production /api traffic to the backend service.", "TableBody")],
    ]
    story += [formatted_table(shared_rows, [188, CONTENT_W - 188]), Spacer(1, 13), para("Eight safe-backend habits", "H2Custom")]
    safe_cards = [
        ("1. Validate every request", "The frontend is helpful, but the DTO is the trust boundary."),
        ("2. Scope by userId", "Never read or change another user's records."),
        ("3. Keep rules in services", "Do not hide product logic in React pages or controllers."),
        ("4. Use transactions", "Coupled writes must succeed or fail together."),
        ("5. Migrate stored changes", "schema.prisma changes need a migration."),
        ("6. Protect secrets", "Gemini and database credentials stay server-side."),
        ("7. Align contracts", "Frontend types must match backend responses."),
        ("8. Test unhappy paths", "Invalid input and missing stock are expected scenarios."),
    ]
    story += [card_table(safe_cards, columns=2), PageBreak()]

    # Finding files
    story += page_intro(
        "09 / Finding the right file",
        "Use three questions before touching code",
        "A good backend change begins with ownership, then narrows to the layer, then checks every consumer affected by the rule.",
    )
    story += [
        card_table(
            [
                ("1 / WHO OWNS THE RULE?", "Stock quantity belongs to Pantry. What to buy belongs to Shopping List. Recipe requirements belong to Recipes."),
                ("2 / WHAT KIND OF CHANGE?", "Input means DTO. Behavior means service. URL means controller. Stored field means schema plus migration."),
                ("3 / WHO CONSUMES IT?", "A low-stock change can affect Pantry, Dashboard, Recommendations, Shopping List, and frontend types."),
            ],
            columns=3,
        ),
        Spacer(1, 14),
        para("Change-to-file examples", "H2Custom"),
    ]
    change_rows = [
        [para("REQUESTED CHANGE", "TableHead"), para("START HERE", "TableHead"), para("THEN CHECK", "TableHead")],
        [para("Add a supplier field", "TableBody"), para("Pantry DTO/service + schema", "TableBody"), para("Migration, frontend type and form", "TableBody")],
        [para("Change low-stock logic", "TableBody"), para("pantry.service.ts", "TableBody"), para("Dashboard and recommendations", "TableBody")],
        [para("Add a Pantry endpoint", "TableBody"), para("pantry.controller.ts", "TableBody"), para("DTO, service, tests", "TableBody")],
        [para("Change missing groceries", "TableBody"), para("shopping-list.service.ts", "TableBody"), para("Conversions and measurement profiles", "TableBody")],
        [para("Change cooking deduction", "TableBody"), para("cooking-mode.service.ts", "TableBody"), para("Pantry logs and transaction", "TableBody")],
        [para("Add a backend domain", "TableBody"), para("New module/controller/service/DTO", "TableBody"), para("Register in app.module.ts", "TableBody")],
    ]
    story += [formatted_table(change_rows, [150, 150, CONTENT_W - 300]), Spacer(1, 14), Callout("Do not start from the filename", "Start from the business rule. The correct filename becomes obvious once ownership and layer are clear.", "gold"), PageBreak()]

    # Team session
    story += page_intro(
        "10 / Teach it together",
        "A practical 45-minute backend learning session",
        "The team should leave able to trace a request, identify the owner of a rule, and name the correct layer for a change.",
    )
    story += [SessionTimeline(), Spacer(1, 8), para("Open these files side by side", "H2Custom")]
    files = [
        "1. src/pages/dashboard/Pantry.tsx",
        "2. src/services/api.ts",
        "3. backend/src/modules/pantry/pantry.controller.ts",
        "4. backend/src/modules/pantry/dto/pantry.dto.ts",
        "5. backend/src/modules/pantry/pantry.service.ts",
        "6. backend/prisma/schema.prisma",
    ]
    story += [
        Table(
            [[para(f, "CodeCustom")] for f in files],
            colWidths=[CONTENT_W],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), MINT),
                    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                    ("INNERGRID", (0, 0), (-1, -1), 0.35, WHITE),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            ),
        ),
        Spacer(1, 10),
        Callout("Exercise", "Map this change without coding it: 'We want to record where each pantry item was purchased.' Identify schema, migration, DTO, service, frontend, authorization, and tests.", "coral"),
        PageBreak(),
    ]

    # Glossary
    story += page_intro(
        "11 / Quick reference",
        "Backend words translated into plain language",
        "Use the project vocabulary consistently. Clear names make it easier to discuss ownership, defects, and future changes.",
    )
    glossary = [
        ("API", "The agreement for how frontend asks backend for work."),
        ("Endpoint", "One method and URL, such as POST /api/v1/pantry."),
        ("Controller", "The receptionist that receives an HTTP request."),
        ("DTO", "The allowed and validated shape of input data."),
        ("Service", "The place where business decisions are made."),
        ("Module", "The wiring that groups one domain's parts."),
        ("Guard", "A check that runs before a controller."),
        ("ORM", "A tool that represents database records as code objects."),
        ("Prisma", "The ORM used by Pantry-to-Plate."),
        ("Model", "A stored business object and its relationships."),
        ("Migration", "A versioned change to database structure."),
        ("Relation", "A connection between stored models."),
        ("Transaction", "Database changes that succeed or fail together."),
        ("Authentication", "Proving who a user is."),
        ("Authorization", "Deciding what that user may do."),
        ("Swagger", "Browsable documentation for available API routes."),
    ]
    glossary_rows = []
    for i in range(0, len(glossary), 2):
        row = []
        for term, meaning in glossary[i : i + 2]:
            row.append(Table([[para(term, "CardTitle")], [para(meaning, "CardBody")]], colWidths=[(CONTENT_W - 12) / 2 - 18]))
        glossary_rows.append(row)
    glossary_table = Table(glossary_rows, colWidths=[(CONTENT_W - 12) / 2] * 2, hAlign="LEFT")
    glossary_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story += [glossary_table, Spacer(1, 14), Callout("Useful local tools", "Swagger: http://localhost:4000/api/v1/docs    |    Prisma Studio: run pnpm prisma:studio inside backend/", "gold"), Spacer(1, 18), para("Start from the business domain, trace the request through the layers, and keep each rule in the layer that owns it.", "Quote")]

    return story


def generate() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        rightMargin=MARGIN_X,
        leftMargin=MARGIN_X,
        topMargin=18 * mm,
        bottomMargin=13 * mm,
        title="How Our Backend Works - Pantry-to-Plate Team Guide",
        author="Pantry-to-Plate Team",
        subject="Backend domains, mappings, request flow, and file ownership",
        creator="Pantry-to-Plate",
    )
    doc.build(build_story(), onFirstPage=draw_cover_page, onLaterPages=draw_later_page)
    return OUTPUT_FILE


if __name__ == "__main__":
    result = generate()
    print(result)
