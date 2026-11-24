import openpyxl, glob, os

files = glob.glob('data-workbooks/*.xlsx') + glob.glob('*.xlsx')

print("Summary of files and their sheets:")
total_sheets = 0
for f in sorted(files):
    wb = openpyxl.load_workbook(f, read_only=True)
    total_sheets += len(wb.sheetnames)
    print(f"- **`{os.path.basename(f)}`** (Path: `{f}`, Size: `{os.path.getsize(f):,} bytes`):")
    for s in wb.sheetnames:
        print(f"    - `{s}`")
    wb.close()

print(f"\nTotal files: {len(files)}, Total sheets across all files: {total_sheets}")
