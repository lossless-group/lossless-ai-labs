#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import marimo
__generated_with = "0.1.0"
app = marimo.App()


@app.cell
def _():
    import marimo as marimo
    return (marimo,)

@app.cell
def __():
    import pandas as pd
    import io
    return (pd, io)


@app.cell
def _():
    # Create a file upload component
    upload = marimo.ui.file(label="Upload CSV")
    upload
    return


@app.cell
def _():
    # Process the uploaded file
    if upload.value is not None:
        content = upload.value["content"]
        filename = upload.value["name"]
        df = pd.read_csv(io.BytesIO(content))
        marimo.md(f"Loaded **{filename}** with {len(df)} rows and {len(df.columns)} columns")
    else:
        df = pd.DataFrame()
        marimo.md("Please upload a CSV file")
    
    # Display the dataframe
    if not df.empty:
        marimo.ui.table(df.head(10))
    
    return


if __name__ == "__main__":
    app.run()
