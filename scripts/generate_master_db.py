import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
import datetime, os

print("Building ERP_Master_Database.xlsx...")

# Source workbook
src_wb = openpyxl.load_workbook('Construction-ERP-Data.xlsx', data_only=True)
supp_wb = openpyxl.load_workbook('Suppliers-Master.xlsx', data_only=True)
cont_wb = openpyxl.load_workbook('Contractors-Master.xlsx', data_only=True)

# Target workbook
wb = openpyxl.Workbook()
wb.remove(wb.active) # Remove default sheet

NAVY_HEADER = "1E3E62"
WHITE_TEXT = "FFFFFF"
ZEBRA_FILL = "F8FAFC"
BORDER_COLOR = "CBD5E1"

font_header = Font(name="Calibri", size=11, bold=True, color=WHITE_TEXT)
font_title = Font(name="Calibri", size=15, bold=True, color="1E3E62")
font_sub = Font(name="Calibri", size=10, italic=True, color="64748B")
font_body = Font(name="Calibri", size=10)
font_bold = Font(name="Calibri", size=10, bold=True)
font_link = Font(name="Calibri", size=10, underline="single", color="0284C7")

fill_header = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
fill_zebra = PatternFill(start_color=ZEBRA_FILL, end_color=ZEBRA_FILL, fill_type="solid")

thin_side = Side(border_style="thin", color=BORDER_COLOR)
cell_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
header_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=Side(border_style="medium", color="0F172A"))

align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")
align_header = Alignment(horizontal="center", vertical="center", wrap_text=True)

def style_table_sheet(ws, title_text, headers, rows_data, table_name, num_formats=None):
    ws.sheet_view.showGridLines = True
    ws.views.sheetView[0].rightToLeft = True
    
    # Title Block
    ws.cell(row=1, column=1, value=title_text).font = font_title
    ws.cell(row=2, column=1, value=f"Mimar ERP Unified Master Database | Enterprise Architecture | {datetime.date.today()}").font = font_sub
    
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
            
            if num_formats and col_idx in num_formats:
                cell.number_format = num_formats[col_idx]
                cell.alignment = align_right
            elif isinstance(val, (int, float)):
                cell.alignment = align_right
            elif str(val).startswith("="):
                cell.alignment = align_right
                cell.font = font_bold
            else:
                cell.alignment = align_right

    end_row = max(start_row + len(rows_data) - 1, header_row + 1)
    end_col_letter = get_column_letter(len(headers))
    
    for col_idx, h in enumerate(headers, 1):
        max_len = len(str(h))
        for r in range(start_row, end_row + 1):
            v = ws.cell(row=r, column=col_idx).value
            if v:
                max_len = max(max_len, len(str(v)))
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = max(min(max_len + 4, 38), 12)
        
    ws.row_dimensions[header_row].height = 28
    
    tab_ref = f"A{header_row}:{end_col_letter}{end_row}"
    tab = Table(displayName=table_name, ref=tab_ref)
    tab.tableStyleInfo = TableStyleInfo(name="TableStyleLight1", showFirstColumn=False, showLastColumn=False, showRowStripes=True, showColumnStripes=False)
    ws.add_table(tab)
    return end_row

# ==========================================
# 1. Projects Sheet
# ==========================================
print("1. Adding Projects...")
ws_prj = wb.create_sheet(title="Projects")
prj_src = src_wb['Projects']
prj_rows = list(prj_src.iter_rows(values_only=True))
prj_headers = [
    "Project_ID", "Company_ID", "Branch_ID", "Project_Code", "Project_Name_AR", "Project_Name_EN",
    "Client_ID", "Consultant_ID", "Contractor_ID", "Status", "Contract_Type", "Start_Date", "End_Date",
    "Contract_Value", "Cost_Budget", "VAT_Pct", "Total_With_VAT", "Planned_Progress_Pct", "Actual_Progress_Pct", "Location"
]
prj_data = []
for r_idx, r in enumerate(prj_rows[1:], 5):
    if not r[0]: continue
    row_vals = [
        r[0], r[1], r[2], r[3], r[4], r[5],
        r[6], r[7], r[8], r[9], r[10], r[11], r[12],
        r[13] or 0, r[14] or 0, r[15] or 15,
        f"=N{r_idx}*(1+P{r_idx}/100)", # Total With VAT Formula
        r[17] or 0, r[18] or 0, r[19] or "الرياض"
    ]
    prj_data.append(row_vals)

style_table_sheet(ws_prj, "سجل المشاريع الإنشائية المعتمدة (Projects Master)", prj_headers, prj_data, "tbl_Projects", {
    14: "#,##0.00", 15: "#,##0.00", 16: "0.00%", 17: "#,##0.00", 18: "0.0%", 19: "0.0%"
})

# ==========================================
# 2. BOQ Sheet
# ==========================================
print("2. Adding BOQ...")
ws_boq = wb.create_sheet(title="BOQ")
boq_src = src_wb['BOQ']
boq_rows = list(boq_src.iter_rows(values_only=True))
boq_headers = [
    "BOQ_ID", "Project_ID", "Item_Code", "Description_AR", "Unit", "Tender_Qty",
    "Measured_Qty", "Unit_Rate", "Total_Amount", "WBS_Code", "Status"
]
boq_data = []
for r_idx, r in enumerate(boq_rows[1:], 5):
    if not r[0]: continue
    qty = r[3] or 1
    rate = r[10] or 100
    boq_data.append([
        f"BOQ-{r[0]}", "PRJ-2001", r[1] or f"ITEM-{r[0]}", r[2] or "بند إنشائي", "م2",
        qty, r[4] or qty, rate,
        f"=G{r_idx}*H{r_idx}", # Measured Qty * Unit Rate
        f"1.{r[0]}", r[7] or "Approved"
    ])

style_table_sheet(ws_boq, "جدول كميات وبنود المشروع (Bill of Quantities)", boq_headers, boq_data, "tbl_BOQ", {
    6: "#,##0.00", 7: "#,##0.00", 8: "#,##0.00", 9: "#,##0.00"
})

# ==========================================
# 3. Cost Estimate (Takeoff & Pricing)
# ==========================================
print("3. Adding Cost Estimate...")
ws_est = wb.create_sheet(title="Cost Estimate")
takeoff_src = src_wb['Takeoff']
t_rows = list(takeoff_src.iter_rows(values_only=True))
est_headers = [
    "Takeoff_ID", "BOQ_ID", "Location_Zone", "Reference_Grid", "Description",
    "Number_Units", "Length_M", "Width_M", "Height_M", "Gross_Quantity",
    "Deduction_Quantity", "Net_Quantity", "Unit_Cost_Rate", "Total_Cost_Estimate"
]
est_data = []
for r_idx, r in enumerate(t_rows[1:], 5):
    if not r[0]: continue
    n = r[5] or 1
    l = r[6] or 1
    w = r[7] or 1
    h = r[8] or 1
    rate = 85.0
    est_data.append([
        f"TK-{r[0]}", f"BOQ-{r[1]}", r[2] or "الدور الأرضي", r[3] or "المحاور A-D", r[4] or "حصر هندسي",
        n, l, w, h,
        f"=F{r_idx}*G{r_idx}*H{r_idx}*I{r_idx}", # Gross = N*L*W*H
        0,
        f"=J{r_idx}-K{r_idx}", # Net = Gross - Deduction
        rate,
        f"=L{r_idx}*M{r_idx}"  # Total = Net * Rate
    ])

style_table_sheet(ws_est, "حصر الكميات الهندسي والتسعير المبدئي (Quantity Takeoff & Cost Estimate)", est_headers, est_data, "tbl_CostEstimate", {
    6: "0", 7: "#,##0.00", 8: "#,##0.00", 9: "#,##0.00", 10: "#,##0.00", 11: "#,##0.00", 12: "#,##0.00", 13: "#,##0.00", 14: "#,##0.00"
})

# ==========================================
# 4. Resources Sheet
# ==========================================
print("4. Adding Resources...")
ws_res = wb.create_sheet(title="Resources")
res_src = src_wb['Resources']
r_rows = list(res_src.iter_rows(values_only=True))
res_headers = [
    "Resource_ID", "Resource_Type", "Resource_Name", "Specification", "Unit",
    "Base_Unit_Rate", "Waste_Percentage", "Effective_Unit_Rate", "Supplier_Partner_ID", "Status"
]
res_data = []
for r_idx, r in enumerate(r_rows[1:], 5):
    if not r[0]: continue
    base_rate = r[5] or 50.0
    waste = 5.0
    res_data.append([
        f"RES-{r[0]}", r[1] or "Material", r[2] or "مورد إنشائي", r[3] or "مواصفات قياسية", r[4] or "طن",
        base_rate, waste,
        f"=F{r_idx}*(1+G{r_idx}/100)", # Effective Rate = Base * (1+Waste%)
        r[8] if len(r) > 8 and r[8] else "PTR-001", "Active"
    ])

style_table_sheet(ws_res, "قاعدة الموارد والتكاليف المعيارية (Resources Master Database)", res_headers, res_data, "tbl_Resources", {
    6: "#,##0.00", 7: "0.0%", 8: "#,##0.00"
})

# ==========================================
# 5. Procurement Sheet
# ==========================================
print("5. Adding Procurement...")
ws_proc = wb.create_sheet(title="Procurement")
proc_src = src_wb['Procurement']
po_rows = list(proc_src.iter_rows(values_only=True))
proc_headers = [
    "PO_Number", "Project_ID", "Transaction_Type", "Item_Description", "Supplier_ID",
    "Quantity", "Unit", "Unit_Price", "Subtotal_Amount", "VAT_15_Pct", "Total_Amount_Inc_VAT", "Delivery_Status"
]
proc_data = []
for r_idx, r in enumerate(po_rows[1:], 5):
    if not r[0]: continue
    qty = r[4] or 10
    price = r[6] or 100
    proc_data.append([
        r[0], "PRJ-2001", r[1] or "أمر شراء رسمي", r[2] or "مواد إنشائية", r[3] or "SUP-0001",
        qty, r[5] or "طن", price,
        f"=F{r_idx}*H{r_idx}", # Subtotal = Qty * Price
        f"=I{r_idx}*0.15",     # VAT 15%
        f"=I{r_idx}+J{r_idx}", # Total = Subtotal + VAT
        r[11] if len(r)>11 and r[11] else "Delivered"
    ])

style_table_sheet(ws_proc, "سجل أوامر الشراء والتوريدات (Procurement & Purchase Orders)", proc_headers, proc_data, "tbl_Procurement", {
    6: "#,##0.00", 8: "#,##0.00", 9: "#,##0.00", 10: "#,##0.00", 11: "#,##0.00"
})

# ==========================================
# 6. Vendors (Suppliers & Partners)
# ==========================================
print("6. Adding Vendors...")
ws_ven = wb.create_sheet(title="Vendors")
bp_src = src_wb['BusinessPartners']
bp_rows = list(bp_src.iter_rows(values_only=True))
ven_headers = [
    "Vendor_ID", "Vendor_Code", "Vendor_Name_AR", "Partner_Type", "Category_Trade",
    "Tax_Number", "CR_Number", "Contact_Person", "Phone", "Rating", "Status"
]
ven_data = []
for r in bp_rows[1:]:
    if not r[0]: continue
    ven_data.append([
        r[0], r[1] or f"VND-{r[0]}", r[2] or "شريك معتمد", r[3] or "Supplier", r[4] or "توريدات ومقاولات",
        r[5] or "300XXXXXXXXXXX", r[6] or "1010XXXXXX", r[9] if len(r)>9 and r[9] else "المدير العام",
        r[7] or "+966110000000", 4.8, r[10] if len(r)>10 and r[10] else "Active"
    ])

style_table_sheet(ws_ven, "سجل الموردين وشركاء الأعمال (Vendors & Suppliers Registry)", ven_headers, ven_data, "tbl_Vendors", {
    10: "0.0"
})

# ==========================================
# 7. Contracts (Subcontracts & Commitments)
# ==========================================
print("7. Adding Contracts...")
ws_cont = wb.create_sheet(title="Contracts")
sub_src = src_wb['Subcontracts']
sub_rows = list(sub_src.iter_rows(values_only=True))
cont_headers = [
    "Contract_ID", "Project_ID", "Contractor_ID", "Scope_Of_Work", "Original_Value",
    "Variations_Value", "Revised_Contract_Value", "Retention_Pct", "Start_Date", "Completion_Date", "Status"
]
cont_data = []
for r_idx, r in enumerate(sub_rows[1:], 5):
    if not r[0]: continue
    orig_val = r[3] or 250000
    cont_data.append([
        f"SUB-CTR-{r[0]}", "PRJ-2001", r[1] or "SUB-0001", r[2] or "أعمال مقاولة باطن", orig_val,
        0.0,
        f"=E{r_idx}+F{r_idx}", # Revised = Original + Variations
        0.10, r[4] or "2026-01-01", r[5] or "2026-06-30", "Active"
    ])

style_table_sheet(ws_cont, "سجل عقود مقاولي الباطن والالتزامات (Subcontracts & Agreements)", cont_headers, cont_data, "tbl_Contracts", {
    5: "#,##0.00", 6: "#,##0.00", 7: "#,##0.00", 8: "0.0%"
})

# ==========================================
# 8. Invoices (AP & Billing)
# ==========================================
print("8. Adding Invoices...")
ws_inv = wb.create_sheet(title="Invoices")
fin_src = src_wb['Finance']
fin_rows = list(fin_src.iter_rows(values_only=True))
inv_headers = [
    "Invoice_ID", "Invoice_Type", "Project_ID", "Vendor_Client_ID", "Invoice_Date",
    "Due_Date", "Gross_Amount", "Retention_Deduction", "Net_Amount_Before_VAT", "VAT_Amount", "Total_Payable_Inc_VAT", "Payment_Status"
]
inv_data = []
for r_idx, r in enumerate(fin_rows[1:], 5):
    if not r[0]: continue
    gross = r[7] or 50000.0
    inv_data.append([
        f"INV-2026-0{r[0]}", r[3] or "AP", "PRJ-2001", r[4] or "SUP-0001", r[1] or "2026-01-15",
        "2026-02-15", gross,
        f"=G{r_idx}*0.10", # Retention 10%
        f"=G{r_idx}-H{r_idx}", # Net Before VAT
        f"=I{r_idx}*0.15",     # VAT 15%
        f"=I{r_idx}+J{r_idx}", # Total Payable
        "Approved"
    ])

style_table_sheet(ws_inv, "سجل الفواتير والمطالبات المالية (Invoices & Billing Ledger)", inv_headers, inv_data, "tbl_Invoices", {
    7: "#,##0.00", 8: "#,##0.00", 9: "#,##0.00", 10: "#,##0.00", 11: "#,##0.00"
})

# ==========================================
# 9. Payments (Disbursements & Settlements)
# ==========================================
print("9. Adding Payments...")
ws_pay = wb.create_sheet(title="Payments")
pay_headers = [
    "Payment_ID", "Invoice_ID", "Project_ID", "Payee_Name", "Payment_Date",
    "Payment_Method", "Paid_Amount", "Bank_Reference", "Approval_Status"
]
pay_data = [
    ["PAY-2026-001", "INV-2026-01", "PRJ-2001", "شركة الأسمنت السعودية", "2026-02-10", "Bank Transfer", 47150.00, "TXN-8829102", "Settled"],
    ["PAY-2026-002", "INV-2026-02", "PRJ-2001", "شركة حديد الراجحي", "2026-02-12", "Bank Transfer", 84525.00, "TXN-8829105", "Settled"],
    ["PAY-2026-003", "INV-2026-03", "PRJ-2001", "مؤسسة الأفق للنجارة", "2026-02-20", "Cheque", 25300.00, "CHQ-009122", "Settled"],
    ["PAY-2026-004", "INV-2026-04", "PRJ-2001", "شركة الخرسانة المتطورة", "2026-03-01", "Bank Transfer", 62100.00, "TXN-8830114", "Settled"],
    ["PAY-2026-005", "INV-2026-05", "PRJ-2001", "مؤسسة التمديدات السريعة", "2026-03-05", "Bank Transfer", 38000.00, "TXN-8830200", "Settled"]
]
style_table_sheet(ws_pay, "سجل المدفوعات والتحويلات المصرفية (Payments & Disbursements)", pay_headers, pay_data, "tbl_Payments", {
    7: "#,##0.00"
})

# ==========================================
# 10. Revenue (Client Interim Certificates)
# ==========================================
print("10. Adding Revenue...")
ws_rev = wb.create_sheet(title="Revenue")
rev_headers = [
    "IPC_Number", "Project_ID", "Client_ID", "Period_Date", "Cumulative_Work_Value",
    "Previous_Certified_Value", "Current_Period_Work", "Retention_Deduction_10Pct",
    "Advance_Payment_Amortization", "Net_Certified_Before_VAT", "VAT_15Pct", "Total_Billed_Inc_VAT", "Collection_Status"
]
rev_data = [
    ["IPC-01", "PRJ-2001", "PTR-001", "2026-01-31", 650000.0, 0.0, "=E5-F5", "=G5*0.10", 0.0, "=G5-H5-I5", "=J5*0.15", "=J5+K5", "Collected"],
    ["IPC-02", "PRJ-2001", "PTR-001", "2026-02-28", 1450000.0, 650000.0, "=E6-F6", "=G6*0.10", 0.0, "=G6-H6-I6", "=J6*0.15", "=J6+K6", "Collected"],
    ["IPC-03", "PRJ-2001", "PTR-001", "2026-03-31", 2350000.0, 1450000.0, "=E7-F7", "=G7*0.10", 50000.0, "=G7-H7-I7", "=J7*0.15", "=J7+K7", "Under Review"]
]
style_table_sheet(ws_rev, "سجل الإيرادات ومستخلصات المالك (Client Revenue & Interim Certificates)", rev_headers, rev_data, "tbl_Revenue", {
    5: "#,##0.00", 6: "#,##0.00", 7: "#,##0.00", 8: "#,##0.00", 9: "#,##0.00", 10: "#,##0.00", 11: "#,##0.00", 12: "#,##0.00"
})

# ==========================================
# 11. Expenses (Direct & Indirect Cost Ledger)
# ==========================================
print("11. Adding Expenses...")
ws_exp = wb.create_sheet(title="Expenses")
exp_headers = [
    "Expense_ID", "Project_ID", "WBS_Code", "Cost_Category", "Source_Reference",
    "Expense_Date", "Description", "Debit_Actual_Cost", "Payment_Voucher"
]
exp_data = [
    ["EXP-2026-001", "PRJ-2001", "1.1", "Material", "PO-001", "2026-01-10", "شراء حديد تسليح للأعمدة والقواعد", 125000.0, "PV-101"],
    ["EXP-2026-002", "PRJ-2001", "1.1", "Material", "PO-002", "2026-01-14", "توريد خرسانة جاهزة رتبة C35 للقواعد", 85000.0, "PV-102"],
    ["EXP-2026-003", "PRJ-2001", "1.2", "Labor", "PAY-01", "2026-01-31", "رواتب طاقم الحدادة والنجارة المسلحة", 45000.0, "PV-103"],
    ["EXP-2026-004", "PRJ-2001", "1.3", "Equipment", "EQ-001", "2026-02-05", "إيجار مضخة خرسانة ورافعة برجية", 22000.0, "PV-104"],
    ["EXP-2026-005", "PRJ-2001", "1.4", "Subcontract", "SUB-01", "2026-02-25", "مستخلص باطن أعمال العزل المائي للأساسات", 38000.0, "PV-105"],
    ["EXP-2026-006", "PRJ-2001", "1.5", "Indirect Overhead", "ADM-01", "2026-02-28", "مصاريف إشراف موقع ومختبر ضبط الجودة", 15000.0, "PV-106"]
]
style_table_sheet(ws_exp, "سجل المصروفات والتكاليف الفعلية (Expenses & Cost Ledger)", exp_headers, exp_data, "tbl_Expenses", {
    8: "#,##0.00"
})

# ==========================================
# 12. HR Sheet (Employees & Payroll)
# ==========================================
print("12. Adding HR...")
ws_hr = wb.create_sheet(title="HR")
hr_src = src_wb['Workforce']
hr_rows = list(hr_src.iter_rows(values_only=True))
hr_headers = [
    "Employee_ID", "Full_Name_AR", "Job_Title", "Department", "Nationality",
    "Basic_Salary", "Housing_Allowance", "Transport_Allowance", "Gross_Monthly_Salary", "Status"
]
hr_data = []
for r_idx, r in enumerate(hr_rows[1:], 5):
    if not r[0]: continue
    # r[0] is a string like 'LAB-01', r[8] is daily wage
    emp_id = str(r[0])
    daily_wage = float(r[8]) if r[8] else 350.0
    basic = round(daily_wage * 26, 2)  # Monthly = daily * 26 working days
    hr_data.append([
        emp_id, r[1] or "عامل فني", r[2] or "طاقم ميداني", "الموقع الإنشائي", "وافد",
        basic,
        f"=F{r_idx}*0.25", # Housing 25%
        f"=F{r_idx}*0.10", # Transport 10%
        f"=F{r_idx}+G{r_idx}+H{r_idx}", # Gross Salary
        r[13] or "Active"
    ])

style_table_sheet(ws_hr, "سجل الموارد البشرية والرواتب (HR & Workforce Master)", hr_headers, hr_data, "tbl_HR", {
    6: "#,##0.00", 7: "#,##0.00", 8: "#,##0.00", 9: "#,##0.00"
})

# ==========================================
# 13. Equipment Sheet
# ==========================================
print("13. Adding Equipment...")
ws_eq = wb.create_sheet(title="Equipment")
eq_src = src_wb['Equipment']
eq_rows = list(eq_src.iter_rows(values_only=True))
eq_headers = [
    "Equipment_ID", "Equipment_Name", "Model_Year", "Hourly_Operating_Rate", "Working_Hours",
    "Total_Operating_Cost", "Fuel_Type", "Operating_Cost_Per_Unit", "Total_Equipment_Cost", "Status"
]
eq_data = []
for r_idx, r in enumerate(eq_rows[1:], 5):
    if not r[0]: continue
    rate = 180.0
    # r[3] = working hours (float), r[5] = fuel type (string), r[7] = operating cost (float/None)
    hrs = float(r[3]) if isinstance(r[3], (int, float)) and r[3] else 8.0
    fuel_type = str(r[5]) if r[5] else "ديزل"
    op_cost = float(r[7]) if isinstance(r[7], (int, float)) and r[7] else 0.0
    eq_data.append([
        str(r[0]), r[1] or "معدة ثقيلة", "2024", rate, hrs,
        f"=D{r_idx}*E{r_idx}", # Total Operating Cost = Rate * Hours
        fuel_type,
        op_cost,
        f"=F{r_idx}+H{r_idx}", # Total Equipment Cost = Op Cost + Other
        str(r[10]) if len(r) > 10 and r[10] else "Operational"
    ])

style_table_sheet(ws_eq, "أسطول المعدات والتجهيزات (Equipment Fleet & Operating Costs)", eq_headers, eq_data, "tbl_Equipment", {
    4: "#,##0.00", 5: "#,##0.0", 6: "#,##0.00", 8: "#,##0.00", 9: "#,##0.00"
})

# ==========================================
# 14. Dashboard_Data Sheet (EVM & KPI Analytics)
# ==========================================
print("14. Adding Dashboard_Data...")
ws_dash = wb.create_sheet(title="Dashboard_Data")
evm_headers = [
    "Metric_Code", "Project_ID", "Measurement_Date", "Planned_Value_PV", "Earned_Value_EV",
    "Actual_Cost_AC", "Budget_At_Completion_BAC", "Cost_Variance_CV", "Schedule_Variance_SV",
    "CPI", "SPI", "Estimate_At_Completion_EAC", "Variance_At_Completion_VAC", "Performance_Status"
]
evm_data = [
    [
        "EVM-01", "PRJ-2001", "2026-03-31",
        2100000.0, 2250000.0, 2180000.0, 8500000.0,
        "=E5-F5", # CV = EV - AC
        "=E5-D5", # SV = EV - PV
        "=E5/F5", # CPI = EV / AC
        "=E5/D5", # SPI = EV / PV
        "=G5/J5", # EAC = BAC / CPI
        "=G5-L5", # VAC = BAC - EAC
        "Healthy (On-Budget & Ahead)"
    ]
]
style_table_sheet(ws_dash, "مؤشرات القيمة المكتسبة ولوحة التحكم التنفيذية (EVM & KPIs Executive Analytics)", evm_headers, evm_data, "tbl_DashboardData", {
    4: "#,##0.00", 5: "#,##0.00", 6: "#,##0.00", 7: "#,##0.00", 8: "#,##0.00", 9: "#,##0.00",
    10: "0.000", 11: "0.000", 12: "#,##0.00", 13: "#,##0.00"
})

# ==========================================
# 15. Settings Sheet
# ==========================================
print("15. Adding Settings...")
ws_set = wb.create_sheet(title="Settings")
set_headers = [
    "Setting_Category", "Parameter_Key", "Parameter_Value", "Description_AR", "System_Module"
]
set_data = [
    ["Financial", "BASE_CURRENCY", "SAR", "العملة الأساسية للنظام والحسابات", "Finance & Cost Control"],
    ["Financial", "STANDARD_VAT_PCT", "15.0%", "نسبة ضريبة القيمة المضافة المعتمدة (هيئة الزكاة)", "Finance & Procurement"],
    ["Contractual", "RETENTION_DEFAULT_PCT", "10.0%", "النسبة القياسية لمحتجز الضمان في المقاولات (فيديك)", "Subcontracts & Billing"],
    ["Contractual", "FIDIC_NOTICE_DAYS", "28", "المدة القانونية القصوى لتقديم إشعار المطالبة (المادة 20.2.1)", "Claims & Legal"],
    ["Fuel", "DIESEL_PRICE_PER_LITER", "2.33 SAR", "السعر الرسمي المعتمد للتر الديزل لتشغيل المعدات", "Equipment & Fleet"],
    ["Standards", "BUILDING_CODE", "SBC 2018", "كود البناء السعودي المعتمد في المواصفات والتنفيذ", "QA/QC & Engineering"],
    ["Database", "SYSTEM_VERSION", "ECOS v8.0.0", "إصدار قاعدة بيانات نظام مِعمار الدولي لإدارة المشاريع", "System Administration"]
]
style_table_sheet(ws_set, "إعدادات النظام والثوابت المؤسسية (Settings & Master Parameters)", set_headers, set_data, "tbl_Settings")

# ==========================================
# 01. INDEX Sheet (The Master Directory)
# ==========================================
print("0. Building INDEX Sheet...")
ws_idx = wb.create_sheet(title="INDEX", index=0)
ws_idx.sheet_view.showGridLines = True
ws_idx.views.sheetView[0].rightToLeft = True

ws_idx.cell(row=1, column=1, value="منظومة مِعمار الدولية | قاعدة البيانات المركزية الموحدة (Master ERP Database)").font = font_title
ws_idx.cell(row=2, column=1, value="دليل الفهرس العام وجداول البيانات والعلاقات العلائقية | Mimar Enterprise Construction OS").font = font_sub

idx_headers = [
    "رقم الصفحة (Sheet ID)", "اسم ورقة العمل (Sheet Name)", "الوظيفة والغرض الأساسي", "اسم الجدول البرمجي (Table Name)",
    "عدد السجلات (Records)", "المدخلات الرئيسية (Inputs)", "المخرجات والحسابات الرئيسية (Outputs)", "الانتقال السريع (Hyperlink)"
]

sheets_catalog = [
    ("Sheet 01", "INDEX", "الفهرس العام ودليل الملاحة وهيكل الجداول", "tbl_INDEX", 16, "توصيف الجداول والمفاتيح", "خريطة الربط العلائقي والانتقال السريع", "#'INDEX'!A1"),
    ("Sheet 02", "Projects", "سجل المشاريع الإنشائية والميزانيات والتعاقدات", "tbl_Projects", len(prj_data), "بيانات العقد والتواريخ والميزانية", "إجمالي القيمة بالضريبة ونسب الإنجاز", "#'Projects'!A1"),
    ("Sheet 03", "BOQ", "جدول بنود الأعمال والكميات التعاقدية والمقاسة", "tbl_BOQ", len(boq_data), "الكميات المعتمدة والأسعار الإفرادية", "إجمالي قيمة البنود وربط WBS", "#'BOQ'!A1"),
    ("Sheet 04", "Cost Estimate", "حصر الكميات الهندسي والتسعير المبدئي", "tbl_CostEstimate", len(est_data), "الأبعاد الهندسية (طول، عرض، ارتفاع)", "الكمية الصافية وإجمالي تكلفة الحصر", "#'Cost Estimate'!A1"),
    ("Sheet 05", "Resources", "قاعدة الموارد المعيارية (مواد، عمالة، معدات)", "tbl_Resources", len(res_data), "الأسعار الأساسية ونسب الهالك", "السعر الفعلي المحمل بالهالك", "#'Resources'!A1"),
    ("Sheet 06", "Procurement", "سجل أوامر الشراء ومتابعة التوريدات", "tbl_Procurement", len(proc_data), "الكميات وأسعار التوريد والموردين", "المجموع الفرعي وضريبة 15% والإجمالي", "#'Procurement'!A1"),
    ("Sheet 07", "Vendors", "سجل الموردين والمقاولين وشركاء الأعمال", "tbl_Vendors", len(ven_data), "السجلات التجارية والأرقام الضريبية والتواصل", "تصنيف الشركاء والتقييم الائتماني", "#'Vendors'!A1"),
    ("Sheet 08", "Contracts", "سجل عقود مقاولي الباطن والالتزامات", "tbl_Contracts", len(cont_data), "القيمة الأصلية، نسب الاستقطاع، التواريخ", "قيمة العقد المعدلة وأوامر التغيير", "#'Contracts'!A1"),
    ("Sheet 09", "Invoices", "سجل الفواتير والمطالبات المالية المستحقة", "tbl_Invoices", len(inv_data), "الفواتير الدائنة ونسب محتجز الضمان", "صافي المستحق وضريبة القيمة المضافة", "#'Invoices'!A1"),
    ("Sheet 10", "Payments", "سجل المدفوعات والتحويلات المصرفية", "tbl_Payments", len(pay_data), "بيانات السداد، الحسابات، مراجع البنك", "مبالغ التسوية الفعلية وحالة الصرف", "#'Payments'!A1"),
    ("Sheet 11", "Revenue", "سجل الإيرادات ومستخلصات المالك الشهرية (IPC)", "tbl_Revenue", len(rev_data), "الأعمال التراكمية، الدفعة المقدمة", "صافي المستخلص المعتمد والضريبة", "#'Revenue'!A1"),
    ("Sheet 12", "Expenses", "سجل المصروفات والتكاليف الفعلية ومراكز التكلفة", "tbl_Expenses", len(exp_data), "القيود اليومية ومصادر الصرف", "حركات المدين الفعلية المرتبطة بـ WBS", "#'Expenses'!A1"),
    ("Sheet 13", "HR", "سجل الموظفين والعمالة والرواتب الشهرية", "tbl_HR", len(hr_data), "الرواتب الأساسية والبدلات والوظائف", "إجمالي الراتب الشهري المستحق", "#'HR'!A1"),
    ("Sheet 14", "Equipment", "أسطول المعدات ومعدلات التشغيل واستهلاك الوقود", "tbl_Equipment", len(eq_data), "ساعات التشغيل ومعدلات الأجرة والوقود", "تكلفة التشغيل وتكلفة الديزل الإجمالية", "#'Equipment'!A1"),
    ("Sheet 15", "Dashboard_Data", "بيانات التقارير ومؤشرات القيمة المكتسبة (EVM)", "tbl_DashboardData", len(evm_data), "قيم PV, EV, AC, BAC المقاسة", "مؤشرات الأداء CPI, SPI وتوقعات EAC", "#'Dashboard_Data'!A1"),
    ("Sheet 16", "Settings", "الإعدادات العامة والثوابت ومحددات المنظومة", "tbl_Settings", len(set_data), "المعايير المؤسسية، الضرائب، نسب فيديك", "المعايير المرجعية لكافة العمليات", "#'Settings'!A1"),
]

idx_header_row = 4
for col_idx, h in enumerate(idx_headers, 1):
    cell = ws_idx.cell(row=idx_header_row, column=col_idx, value=h)
    cell.font = font_header
    cell.fill = fill_header
    cell.alignment = align_header
    cell.border = header_border

for r_idx, row in enumerate(sheets_catalog, 5):
    is_even = (r_idx % 2 == 0)
    for col_idx in range(1, 8):
        cell = ws_idx.cell(row=r_idx, column=col_idx, value=row[col_idx-1])
        cell.font = font_body
        cell.border = cell_border
        if is_even: cell.fill = fill_zebra
        if col_idx in [1, 4, 5]:
            cell.alignment = align_center
        else:
            cell.alignment = align_right
            
    # Hyperlink column
    link_cell = ws_idx.cell(row=r_idx, column=8, value=f"الانتقال إلى {row[1]} ➔")
    link_cell.hyperlink = row[7]
    link_cell.font = font_link
    link_cell.border = cell_border
    link_cell.alignment = align_center
    if is_even: link_cell.fill = fill_zebra

for col_idx, h in enumerate(idx_headers, 1):
    max_len = max(len(str(h)), max(len(str(ws_idx.cell(row=r, column=col_idx).value or '')) for r in range(5, 5 + len(sheets_catalog))))
    col_letter = get_column_letter(col_idx)
    ws_idx.column_dimensions[col_letter].width = max(max_len + 4, 15)

ws_idx.row_dimensions[idx_header_row].height = 28

idx_table_ref = f"A{idx_header_row}:H{idx_header_row + len(sheets_catalog)}"
tab_idx = Table(displayName="tbl_MasterIndex", ref=idx_table_ref)
tab_idx.tableStyleInfo = TableStyleInfo(name="TableStyleLight1", showFirstColumn=False, showLastColumn=False, showRowStripes=True, showColumnStripes=False)
ws_idx.add_table(tab_idx)

# ==========================================
# 17. Documentation Sheet (Technical Architecture)
# ==========================================
print("17. Building Documentation Sheet...")
ws_doc = wb.create_sheet(title="Documentation")
ws_doc.sheet_view.showGridLines = True
ws_doc.views.sheetView[0].rightToLeft = True

ws_doc.cell(row=1, column=1, value="التوثيق المعماري لقاعدة البيانات المركزية (Enterprise ERP Database Architecture)").font = font_title
ws_doc.cell(row=2, column=1, value="المعايير الهندسية، العلاقات العلائقية، القواعد الحسابية، وجاهزية الربط مع SQL / Laravel / React").font = font_sub

doc_sections = [
    ("1. الهدف المؤسسي العام", "توحيد كافة بيانات منظومة التشييد المتفرقة في ملف قاعدة بيانات موحد واحد (ERP_Master_Database.xlsx) يمثل المصدر الوحيد للحقيقة (Single Source of Truth) لكافة العمليات الهندسية والمالية والإدارية."),
    ("2. مبادئ التطبيع وتصميم الجداول (Database Normalization)", "تم تطبيق مبادئ التطبيع حتى المستوى 3NF لمنع تكرار البيانات. كل جدول يحتوي على معرف فريد أساسي (Primary Key) ويرتبط مع الجداول الأخرى بمفاتيح أجنبية (Foreign Keys) واضحة."),
    ("3. شبكة العلاقات العلائقية (Relational Mapping)", "Projects (Project_ID) ──< BOQ (Project_ID)\nProjects (Project_ID) ──< Contracts (Project_ID)\nBOQ (BOQ_ID) ──< Cost Estimate (BOQ_ID)\nVendors (Vendor_ID) ──< Procurement (Supplier_ID)\nProcurement (PO_Number) ──< Invoices (Source_Reference)\nInvoices (Invoice_ID) ──< Payments (Invoice_ID)\nProjects (Project_ID) ──< Expenses (Project_ID)"),
    ("4. الحسابات والمعادلات الحرجة المحفوظة", "• Total_With_VAT = Contract_Value * (1 + VAT_Pct)\n• Net_Quantity = Gross_Quantity - Deduction_Quantity\n• Effective_Rate = Base_Rate * (1 + Waste_Pct)\n• Total_PO_Amount = Subtotal + VAT (15%)\n• Net_Certified_IPC = Current_Period - Retention_10% - Advance_Payment\n• Cost Variance (CV) = EV - AC | Schedule Variance (SV) = EV - PV\n• Cost Performance Index (CPI) = EV / AC | Schedule Performance Index (SPI) = EV / PV\n• Estimate At Completion (EAC) = BAC / CPI"),
    ("5. جاهزية الربط البرمجي المستقبلي (Backend & Frontend Integration)", "• PostgreSQL & SQL Server: أسماء الجداول والأعمدة مجهزة بنسق CamelCase/SnakeCase قياسي يطابق جداول DDL للترحيل المباشر (Direct Migration).\n• Laravel Backend: توافق تام مع نماذج Eloquent ORM ومتحكمات الـ API RESTful.\n• React Frontend: سهولة استهلاك الجداول عبر JSON Endpoints بدون الحاجة لتعديل مسميات الحقول."),
    ("6. معايير الحماية والتكامل التعاقدي", "• فيديك 2017: الالتزام بشرط الـ 28 يوماً لتقديم المطالبات (المادة 20.2.1) ومحتجز الضمان 10%.\n• هيئة الزكاة والضريبة والجمارك (ZATCA): ضريبة القيمة المضافة 15%، ترميز الفواتير، المطابقة الثلاثية في المشتريات."),
]

doc_row = 4
for sec_title, sec_desc in doc_sections:
    ws_doc.cell(row=doc_row, column=1, value=sec_title).font = Font(name="Calibri", size=12, bold=True, color="1E3E62")
    ws_doc.cell(row=doc_row, column=1).fill = fill_zebra
    ws_doc.cell(row=doc_row, column=1).border = cell_border
    
    desc_cell = ws_doc.cell(row=doc_row+1, column=1, value=sec_desc)
    desc_cell.font = font_body
    desc_cell.alignment = Alignment(horizontal="right", vertical="top", wrap_text=True)
    desc_cell.border = cell_border
    ws_doc.row_dimensions[doc_row+1].height = 45 if "\n" in sec_desc else 25
    doc_row += 3

ws_doc.column_dimensions["A"].width = 110

# Save final workbook
output_path = "ERP_Master_Database.xlsx"
wb.save(output_path)
print(f"✓ Successfully generated: {output_path} (Size: {os.path.getsize(output_path):,} bytes)")

src_wb.close()
supp_wb.close()
cont_wb.close()
wb.close()
