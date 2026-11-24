import openpyxl, glob, os

def get_sheet_details(filepath):
    wb = openpyxl.load_workbook(filepath, data_only=True)
    details = {}
    for name in wb.sheetnames:
        ws = wb[name]
        rows = list(ws.iter_rows(values_only=True))
        data_rows = [r for r in rows[1:] if any(c is not None for c in r)] if len(rows) > 1 else []
        headers = [str(c) for c in (rows[0] if len(rows) > 0 else []) if c is not None]
        details[name] = {
            'headers': headers,
            'row_count': len(data_rows),
            'sample': data_rows[0] if data_rows else []
        }
    wb.close()
    return details

print("Sample data mapping:")
p_details = get_sheet_details('Construction-ERP-Data.xlsx')
for s in ['Projects', 'BOQ', 'Takeoff', 'RateAnalysis', 'Resources', 'Procurement', 'BusinessPartners', 'Subcontracts', 'Billing', 'Finance', 'Workforce', 'Equipment']:
    if s in p_details:
        print(f"Sheet: {s} -> Rows: {p_details[s]['row_count']}, Headers: {p_details[s]['headers'][:6]}")
