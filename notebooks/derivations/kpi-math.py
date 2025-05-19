import marimo

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
        "timeframe_id",
        "month",
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

    return df_final, table


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
    import plotly.graph_objects as go

    # Hardcode the columns you want to plot
    x_col_label="timeframe_id"
    x_col = "month_count"  # Make sure these column names exist in your CSV
    y_col = "Total Member"        # Adjust these to match your actual column names

    # Create the plot
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df[x_col], y=df[y_col], name=y_col))

    # Update layout
    fig.update_layout(
        title=f"{y_col} over {x_col_label}",
        xaxis_title=x_col_label,
        yaxis_title=y_col
    )

    # Display the plot
    return (go,)


@app.cell
def _(df_final, go, pl):
    from plotly.subplots import make_subplots
    import math

    # Filter August data
    august_data = df_final.filter(
        (pl.col("timeframe_id").str.ends_with("-8")) |
        (pl.col("month") == 8)
    ).sort("month_count")

    # Create subplots with indicator specs
    n_cols = 4
    n_rows = math.ceil(len(august_data) / n_cols)

    # Create subplot grid with indicator specs
    specs = [[{'type': 'indicator'} for _ in range(n_cols)] for _ in range(n_rows)]

    figure2 = make_subplots(
        rows=n_rows, 
        cols=n_cols,
        specs=specs,
        subplot_titles=[f"Aug {row['month_count']}" for row in august_data.rows(named=True)]
    )

    # Add indicators
    for i, row in enumerate(august_data.rows(named=True), 1):
        row_num = (i - 1) // n_cols + 1
        col_num = (i - 1) % n_cols + 1

        figure2.add_trace(
            go.Indicator(
                mode="number+delta",
                value=row["Total Member"],
                delta={
                    "reference": row["Total Member"] - (row["Total Member"] * (row["MoM Growth (%)"] / 100)),
                    "valueformat": ".1f",
                    "suffix": "%",
                    "increasing": {"color": "green"},
                    "decreasing": {"color": "red"},
                },
                title={"text": f"Aug {row['month_count']}"}
            ),
            row=row_num,
            col=col_num
        )

    # Update layout
    figure2.update_layout(
        title="August Growth Metrics by Year",
        height=200 * n_rows,  # Adjust height based on number of rows
        showlegend=False
    )

    return


if __name__ == "__main__":
    app.run()
