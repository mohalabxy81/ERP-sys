import openpyxl, glob, os

files = glob.glob('data-workbooks/*.xlsx') + glob.glob('*.xlsx')
print(f"Total Excel files found: {len(files)}")

for f in sorted(files):
    print(f"\n====================\nFILE: {f}")
    try:
        wb = openpyxl.load_workbook(f, data_only=False)
        for sname in wb.sheetnames:
            ws = wb[sname]
            rows = list(ws.iter_rows(values_only=True))
            nrows = len(rows)
            headers = [str(c) for c in (rows[0] if nrows > 0 else []) if c is not None]
            # sample formulas
            formulas = []
            for r in ws.iter_rows():
                for cell in r:
                    if cell.value and str(cell.value).startswith('='):
                        formulas.append(f"{cell.coordinate}: {cell.value}")
                        if len(formulas) >= 3:
                            break
                if len(formulas) >= 3:
                    break
            print(f"  Sheet: {sname} | Rows: {nrows} | Cols: {len(headers)} | Headers: {headers[:8]} | Formulas: {formulas}")
        wb.close()
    except Exception as e:
        print(f"  Error reading {f}: {e}")
