import marimo
from typing import Union, Tuple

__generated_with = "0.13.10"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    f = mo.ui.file(kind="button", filetypes=[".csv"])
    f
    return f, mo


@app.cell
def _(f, mo):
    from io import BytesIO
    mo.stop(len(f.value) == 0, mo.md("Please upload a CSV file."))
    import polars as pl
    data = BytesIO(f.value[0].contents)
    df = pl.read_csv(data, separator=",", missing_utf8_is_empty_string=True)
    df
    return df, pl


@app.cell
def _(df, mo, pl):
    # Process data with proper null handling
    df_final = df.sort("month_count").with_columns([
        # Calculate MoM growth with null handling
        pl.when(pl.col("Total Member").is_not_null())
          .then(pl.col("Total Member").pct_change())
          .otherwise(None)
          .alias("mom_growth"),

        # Calculate YoY growth with null handling
        pl.when(pl.col("Total Member").is_not_null())
          .then(pl.col("Total Member").pct_change(12))
          .otherwise(None)
          .alias("yoy_growth")
    ]).with_columns([
        # Format as percentage with null handling
        pl.when(pl.col("mom_growth").is_not_null())
          .then((pl.col("mom_growth") * 100).round(2))
          .otherwise(None)
          .alias("MoM Growth (%)"),

        pl.when(pl.col("yoy_growth").is_not_null())
          .then((pl.col("yoy_growth") * 100).round(2))
          .otherwise(None)
          .alias("YoY Growth (%)")
    ])

    # Select and display the results
    display_df = df_final.select([
        "month_count", 
        "Total Member", 
        "MoM Growth (%)", 
        "YoY Growth (%)"
    ])

    display_df = display_df.fill_null("")

    # Create the table
    table = mo.ui.table(
        data=display_df,
        page_size=10,
        pagination=True,
    )

    return table


@app.cell
def _(table):
    # Display the table with a title
    table
    return


@app.cell
def _(mo, table):
    # Display the results
    mo.vstack([table, table.value])
    return


@app.cell
def _(df):
    import plotly.graph_objects as pogo

    # Hardcode the columns you want to plot
    x_col = "month_count"  # Make sure these column names exist in your CSV
    y_col = "Total Member"        # Adjust these to match your actual column names

    # Create the plot
    fig = pogo.Figure()
    fig.add_trace(pogo.Scatter(x=df[x_col], y=df[y_col], name=y_col))

    # Update layout
    fig.update_layout(
        title=f"{y_col} over {x_col}",
        xaxis_title=x_col,
        yaxis_title=y_col
    )

    # Display the plot
    return


if __name__ == "__main__":
    app.run()
