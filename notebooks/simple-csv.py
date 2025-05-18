#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import marimo as mo

__generated_with = "0.13.10"
app = mo.App()


@app.cell
def _():
    import pandas as pd
    import io
    return (pd, io)


@app.cell
def _():
    # Create a file upload component
    upload = mo.vstack([mo.ui.file(kind="button"), mo.ui.file(kind="area")])
    upload_contents = upload.value[0].contents
    return upload_contents


@app.cell
def _(pd, upload_contents):
    # Process the uploaded file 
    mo.md(f"Selected file: {upload.value[0].name}")
    if upload_contents is not None:
        # Get the file content as bytes
        content = upload_contents
        # Use BytesIO to create a file-like object
        df = pd.read_csv(content)
        mo.md(f"Loaded CSV with {len(df)} rows and {len(df.columns)} columns")
    else:
        df = pd.DataFrame()
        mo.md("Please upload a CSV file")

    # Display the dataframe
    if not df.empty:
        mo.ui.table(df.head(10))

    return


if __name__ == "__main__":
    app.run()
