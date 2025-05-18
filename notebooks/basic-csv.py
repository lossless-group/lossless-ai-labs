#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import marimo
__generated_with = "0.1.0"
app = marimo.App()


@app.cell
def __():
    import pandas as pd
    import io
    return


@app.cell
def __():
    # Create a file upload component
    upload = marimo.ui.file(label="Upload CSV")
    upload
    return


@app.cell
def __():
    # Only try to process the file if it's been uploaded
    if "upload" in globals() and upload.value is not None:
        # Get the file content
        content = upload.value["content"]
        
        # Convert to a pandas dataframe
        df = pd.read_csv(io.BytesIO(content))
        
        # Display info about the dataframe
        marimo.md(f"Loaded CSV with {len(df)} rows and {len(df.columns)} columns")
        
        # Show the first few rows
        marimo.ui.table(df.head())
    else:
        marimo.md("Please upload a CSV file")
    return


if __name__ == "__main__":
    app.run()
