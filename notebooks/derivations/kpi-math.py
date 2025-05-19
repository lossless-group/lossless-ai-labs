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
    fig.add_trace(go.Scatter(
        x=df[x_col], 
        y=df[y_col],
        line=dict(color="#af312e"),
        name=y_col
        )
    )

    # Update layout
    fig.update_layout(
        title=f"{y_col} over {x_col_label}",
        xaxis_title=x_col_label,
        yaxis_title=y_col
    )

    figure1 = fig

    # Display the plot
    return figure1, go


@app.cell
def _(df_final, figure1, go, pl):
    from plotly.subplots import make_subplots
    import math

    # Filter August data and remove null values
    august_data = df_final.filter(
        ((pl.col("timeframe_id").str.ends_with("-8")) | (pl.col("month") == 8)) &
        pl.col("Total Member").is_not_null() &
        pl.col("YoY Growth (%)").is_not_null()
    ).sort("month_count")

    # Set up single row layout with all indicators in one row
    n_indicators = len(august_data)
    n_cols = n_indicators  # One column per indicator
    n_rows = 1  # Single row

    # Sort data by year
    august_data_by_year = august_data.sort("year")


    # Create a single figure that will contain both plots
    combined_figure = go.Figure()

    # Add the main plot (stored in figure1) to our combined figure
    # We'll add the indicators on top of this plot

    # Calculate positions for indicators (evenly spaced along the top)
    x_positions = [i/(n_indicators+1) for i in range(1, n_indicators+1)]

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

        # Add indicator on top of the main plot
        combined_figure.add_trace(
            go.Indicator(
                mode=mode,
                value=current_value,
                delta=delta_config,
                title={"text": f"Aug {current_year}", "font": {"size": 14}},
                number={"font": {"size": 22}},
                domain={
                    'x': [x_positions[i-1] - 0.4/n_indicators, x_positions[i-1] + 0.4/n_indicators],
                    'y': [0.8, 1]  # Position at the top of the plot
                }
            )
        )

        # Store current value for next iteration
        prev_values[current_year] = current_value
    # Update layout for the combined figure
    combined_figure.update_layout(
        plot_bgcolor='white',
        paper_bgcolor='white',
        showlegend=True,
        margin=dict(t=100, b=50),
        title={
            'text': "Membership Growth with Year-over-Year Comparison",
            'x': 0.5,
            'xanchor': 'center',
            'font': {'size': 20, 'color': '#2c3e50'}
        },
        xaxis=dict(
            showgrid=False,
            showline=True,
            linecolor='#bdc3c7',
            linewidth=2
        ),
        yaxis=dict(
            showgrid=True,
            gridcolor='#ecf0f1',
            showline=True,
            linecolor='#bdc3c7',
            linewidth=2
        )
    )

    # Add the main plot (from figure1) to our combined figure
    # This needs to be done after the indicators to ensure they appear on top
    combined_figure.add_traces(figure1.data)

    return


if __name__ == "__main__":
    app.run()
