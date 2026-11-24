import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
import datetime

print("Initializing Master Database builder...")

wb = openpyxl.Workbook()
# Remove default sheet
wb.remove(wb.active)

# Color Palette (Corporate Modern ERP)
NAVY_HEADER = "1E3E62"
WHITE_TEXT = "FFFFFF"
TEAL_ACCENT = "0B192C"
ZEBRA_FILL = "F8FAFC"
BORDER_COLOR = "CBD5E1"

font_header = Font(name="Calibri", size=11, bold=True, color=WHITE_TEXT)
font_title = Font(name="Calibri", size=14, bold=True, color="1E3E62")
font_sub = Font(name="Calibri", size=10, italic=True, color="64748B")
font_body = Font(name="Calibri", size=10)
font_bold = Font(name="Calibri", size=10, bold=True)
font_link = Font(name="Calibri", size=10, underline="single", color="0284C7")

fill_header = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
fill_zebra = PatternFill(start_color=ZEBRA_FILL, end_color=ZEBRA_FILL, fill_type="solid")
fill_summary = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")

thin_side = Side(border_style="thin", color=BORDER_COLOR)
cell_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
header_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=Side(border_style="medium", color="0F172A"))

align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")
align_header = Alignment(horizontal="center", vertical="center", wrap_text=True)

# Helper function to style sheets
def style_table_sheet(ws, title_text, headers, rows_data, table_name, num_formats=None):
    ws.sheet_view.showGridLines = True
    ws.views.sheetView[0].rightToLeft = True  # RTL for Arabic/English ERP
    
    # Title Block
    ws.cell(row=1, column=1, value=title_text).font = font_title
    ws.cell(row=2, column=1, value=f"Enterprise Construction ERP Master Database | Generated: {datetime.date.today()}").font = font_sub
    
    # Header Row at row 4
    header_row = 4
    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=header_row, column=col_idx, value=h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_header
        cell.border = header_border
        
    start_row = 5
    for r_idx, r_data in enumerate(rows_data, start_row):
        is_even = (r_idx % 2 == 0)
        for col_idx, val in enumerate(r_data, 1):
            cell = ws.cell(row=r_idx, column=col_idx, value=val)
            cell.font = font_body
            cell.border = cell_border
            if is_even:
                cell.fill = fill_zebra
            
            # Formatting
            if num_formats and col_idx in num_formats:
                cell.number_format = num_formats[col_idx]
                cell.alignment = align_right
            elif isinstance(val, (int, float)):
                cell.alignment = align_right
            elif str(val).startswith("="):
                cell.alignment = align_right
                cell.font = font_bold
            else:
                cell.alignment = align_left if isinstance(val, str) and not any('\u0600' <= c <= '\u06FF' for c in val) else align_right

    end_row = max(start_row + len(rows_data) - 1, header_row + 1)
    end_col_letter = get_column_letter(len(headers))
    
    # Auto-fit column widths
    for col_idx, h in enumerate(headers, 1):
        max_len = len(str(h))
        for r in range(start_row, end_row + 1):
            v = ws.cell(row=r, column=col_idx).value
            if v:
                max_len = max(max_len, len(str(v)))
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 13)
        
    ws.row_dimensions[header_row].height = 28
    
    # Excel Table
    tab_ref = f"A{header_row}:{end_col_letter}{end_row}"
    tab = Table(displayName=table_name, ref=tab_ref)
    style = TableStyleInfo(name="TableStyleLight1", showFirstColumn=False, showLastColumn=False, showRowStripes=True, showColumnStripes=False)
    tab.tableStyleInfo = style
    ws.add_table(tab)
    return end_row

print("Builder helper defined successfully.")
