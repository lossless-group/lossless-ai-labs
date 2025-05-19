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
        "year",
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

    # Filter August data and remove null values
    august_data = df_final.filter(
        ((pl.col("timeframe_id").str.ends_with("-8")) | (pl.col("month") == 8)) &
        pl.col("Total Member").is_not_null() &
        pl.col("YoY Growth (%)").is_not_null()
    ).sort("month_count")

    # Calculate grid dimensions
    n_indicators = len(august_data)
    n_cols = min(4, n_indicators)  # Max 4 columns
    n_rows = math.ceil(n_indicators / n_cols)

    # Sort data by year
    august_data_by_year = august_data.sort("year")


    # Create subplot grid
    figure2 = make_subplots(
        rows=n_rows, 
        cols=n_cols,
        specs=[[{'type': 'indicator'} for _ in range(n_cols)] for _ in range(n_rows)],
        vertical_spacing=0.2,
        horizontal_spacing=0.1
    )

    # Initialize previous values dictionary
    prev_values = {}

    # Add indicators
    for i, row in enumerate(august_data_by_year.rows(named=True), 1):
        row_idx = (i - 1) // n_cols + 1
        col_idx = (i - 1) % n_cols + 1

        current_year = row["year"]
        current_value = row["Total Member"]

        # Get previous year's value if it exists
        prev_value = prev_values.get(current_year - 1)
        
        # Debug prints
        print(f"\n--- Year: {current_year} ---")
        print(f"Current value: {current_value}")
        print(f"Previous year's value: {prev_value}")

        # Calculate delta if we have a previous value
        if prev_value is not None and prev_value != 0:
            growth_rate = (current_value - prev_value) / prev_value
            print(f"Growth rate: {growth_rate:.2%}")
            
            delta_config = {
                "reference": prev_value,
                "valueformat": ".1%",
                "suffix": "",
                "increasing": {"color": "green"},
                "decreasing": {"color": "red"},
                "relative": True  # This will show the relative change as a percentage
            }
            mode = "number+delta"
        else:
            delta_config = None
            mode = "number"

        figure2.add_trace(
            go.Indicator(
                mode=mode,
                value=current_value,
                delta=delta_config,
                title={"text": f"Aug {current_year}", "font": {"size": 14}},
                number={"font": {"size": 16}},
                domain={
                    "row": row_idx,
                    "column": col_idx,
                    "x": [0, 1],
                    "y": [0, 1]
                }
            ),
            row=row_idx,
            col=col_idx
        )

        # Store current value for next iteration
        prev_values[current_year] = current_value

    # Update layout
    figure2.update_layout(
        title="August Growth Metrics by Year",
        height=250 * n_rows,
        showlegend=False,
        margin=dict(l=50, r=50, t=80, b=50),
        grid=dict(columns=n_cols, pattern="independent")
    )

    return figure2


if __name__ == "__main__":
    app.run()
