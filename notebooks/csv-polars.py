import marimo as mo

__generated_with = "0.13.10"
app = marimo.App()

@app.cell
def _():
   import marimo as mo
   # Create the file upload widget and display it
   f = mo.ui.file(kind="button", filetypes=[".csv"])
   f  # This line ensures the button is shown
   return f

@app.cell
def _(f):
   mo.stop(len(f.value) == 0, mo.md("Please upload a CSV file."))
   import polars as pl
   df = pl.read_csv(f.value[0].contents)
   df
   return df
