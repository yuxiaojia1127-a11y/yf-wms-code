import pandas as pd
xls = pd.ExcelFile('业务需求/租车台账看板.xlsx')
for sheet in xls.sheet_names:
    print(f"\n--- Sheet: {sheet} ---")
    df = pd.read_excel(xls, sheet_name=sheet)
    print("Columns:", list(df.columns))
    print(f"Row count: {len(df)}")
    print("Sample Data (first 2 rows, truncated):")
    for i in range(min(2, len(df))):
        row = df.iloc[i]
        for col in df.columns:
            val = str(row[col])[:100]  # truncate long strings
            if val != 'nan':
                print(f"  {col}: {val}")
