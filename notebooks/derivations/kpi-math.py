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
        name="Total Members"  # Changed from y_col to the desired display name
        )
    )

    # Update layout
    fig.update_layout(
        title=f"{y_col} over {x_col_label}",
        xaxis_title=x_col_label,
        yaxis_title=y_col,
        font=dict(family="Helvetica Neue", size=12, color="#2c3e50"),
        title_font=dict(family="Helvetica Neue", size=20, color="#2c3e50"),
        xaxis=dict(
            title_font=dict(family="Helvetica Neue", size=14),
            tickfont=dict(family="Helvetica Neue", size=12)
        ),
        yaxis=dict(
            title_font=dict(family="Helvetica Neue", size=14),
            tickfont=dict(family="Helvetica Neue", size=12)
        )
    )

    figure1 = fig

    # Display the plot
    return figure1, go


@app.cell
def _():
    return


@app.cell
def _(df_final, figure1, go, pl):
    def _():
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

            # Add indicator centered above the main plot
            combined_figure.add_trace(
                go.Indicator(
                    mode=mode,
                    value=current_value,
                    delta=delta_config,
                    title={"text": f"Aug {current_year}", "font": {"size": 14, "family": "Helvetica Neue", "color": "#7f8c8d"}},
                    number={"font": {"size": 22, "family": "Helvetica Neue", "color": "#2c3e50"}},
                    domain={
                        'x': [x_positions[i-1] - 0.4/n_indicators, x_positions[i-1] + 0.4/n_indicators],
                        'y': [0.85, 0.95]  # Centered in the top section
                    },
                    align="center"
                )
            )

            # Store current value for next iteration
            prev_values[current_year] = current_value
        # Update layout for the combined figure
        combined_figure.update_layout(
            plot_bgcolor='white',
            paper_bgcolor='white',
            showlegend=True,
            margin=dict(t=150, b=50, l=50, r=50),  # Added more top margin for indicators
            title={
                'text': "Membership Growth with Year-over-Year Comparison",
                'x': 0.5,
                'xanchor': 'center',
                'y': 0.98,  # Position title at the very top
                'font': {'size': 20, 'color': '#2c3e50', 'family': 'Helvetica Neue'}
            },
            font=dict(family="Helvetica Neue"),
            xaxis=dict(
                showgrid=False,
                showline=True,
                linecolor='#bdc3c7',
                linewidth=2,
                domain=[0.05, 0.95]  # Add some padding on the sides
            ),
            yaxis=dict(
                showgrid=True,
                gridcolor='#ecf0f1',
                showline=True,
                linecolor='#bdc3c7',
                linewidth=2,
                domain=[0.1, 0.8]  # Make room for indicators at the top
            ),
            # Add some padding around the plot
            margin_pad=10
        )

        # Add the main plot (from figure1) to our combined figure
        # This needs to be done after the indicators to ensure they appear on top
        return combined_figure.add_traces(figure1.data)


    _()
    return


@app.cell
def _():
    return


@app.cell
def _(df, mo, pl):
    def _():
        quarterly_totals = df.group_by("quarter_id").agg([
            pl.first("quarter").alias("Quarter"),
            pl.first("year").alias("Year"),
            pl.last("Total Member").alias("Quarterly Total"),
            pl.len().alias("Months in Quarter"),
            pl.col("month_count").max().alias("Month Index")
        ]).sort("Month Index")

        # Calculate quarterly growth rates
        quarterly_with_growth = quarterly_totals.with_columns([
            pl.when(pl.col("Quarterly Total").is_not_null())
                .then(pl.col("Quarterly Total").pct_change())
                .otherwise(None)
                .alias("QoQ Growth"),

            pl.when(pl.col("Quarterly Total").is_not_null())
                .then(pl.col("Quarterly Total").pct_change(4))  # Year-over-year quarterly comparison
                .otherwise(None)
                .alias("YoY Growth (Quarterly)")
        ])

        # Format growth rates as percentages
        quarterly_display = quarterly_with_growth.with_columns([
            (pl.col("QoQ Growth") * 100).round(2).alias("QoQ Growth (%)"),
            (pl.col("YoY Growth (Quarterly)") * 100).round(2).alias("YoY Growth (Quarterly) (%)")
        ]).select([
            "quarter_id",
            "Month Index",
            "Quarter",
            "Year",
            "Quarterly Total",
            "Months in Quarter",
            "QoQ Growth (%)",
            "YoY Growth (Quarterly) (%)"
        ]).fill_null("")

        # Create and return the quarterly table
        quarterly_table = mo.ui.table(
            data=quarterly_display,
            page_size=10,
            pagination=True,
        )
        return quarterly_table, quarterly_display

    _()
    return


@app.cell
def _(go, pl, updated_quarterly_display):
    def _():
        def _():
            from plotly.subplots import make_subplots

            # Filter quarterly data for Q4 indicators
            quarterly_data = updated_quarterly_display.filter(
                pl.col("Quarter").str.contains("Q4") &
                pl.col("Quarterly Total").is_not_null() &
                pl.col("QoQ Growth (%)").is_not_null()
            ).sort("quarter_id")

            # Convert cumulative values to actual quarterly values
            updated_quarterly_display = updated_quarterly_display.with_columns(
                pl.col("Quarterly Total") - pl.col("Quarterly Total").shift(1).over("Year").fill_null(0)
            )

            # Keep all quarters for the line plot
            quarterly_line_data = updated_quarterly_display.filter(
                pl.col("Quarterly Total").is_not_null()
            ).sort("quarter_id")

            # Set up single row layout with all indicators in one row
            n_indicators = len(quarterly_data)
            n_cols = n_indicators
            n_rows = 1

            # Sort data by quarter_id
            quarterly_data_by_index = quarterly_data.sort("quarter_id")

            # Create a single figure that will contain both plots
            combined_quarterly_figure = go.Figure()

            # Calculate positions for indicators (evenly spaced along the top)
            x_positions = [i/(n_indicators+1) for i in range(1, n_indicators+1)]

            # Initialize previous values dictionary
            prev_values = {}

            # Debug: Print the data being used for indicators
            print("\nIndicator Data (Q4 only):")
            print(quarterly_data_by_index.select(["quarter_id", "Quarter", "Year", "Quarterly Total"]))

            # Add indicators
            for i, row in enumerate(quarterly_data_by_index.rows(named=True), 1):
                current_year = row["Year"]
                current_value = row["Quarterly Total"]
                current_quarter = row["quarter_id"]
                print(f"\nAdding indicator for {current_quarter}: {current_value:,.0f} members")

                # Get previous year's value if it exists
                prev_value = prev_values.get(current_year - 1)

                # Calculate delta if we have a previous value
                if prev_value is not None and prev_value != 0:
                    growth_rate = (current_value - prev_value) / prev_value
                    delta_config = {
                        "reference": prev_value,
                        "valueformat": ".1%",
                        "suffix": "",
                        "increasing": {"color": "green"},
                        "decreasing": {"color": "red"},
                        "relative": True
                    }
                    mode = "number+delta"
                else:
                    delta_config = None
                    mode = "number"

                # Add indicator centered above the main plot
                combined_quarterly_figure.add_trace(
                    go.Indicator(
                        mode=mode,
                        value=current_value,
                        delta=delta_config,
                        title={"text": f"Q4 {int(current_year)}", "font": {"size": 14, "family": "Helvetica Neue", "color": "#7f8c8d"}},
                        number={"font": {"size": 22, "family": "Helvetica Neue", "color": "#2c3e50"}},
                        domain={
                            'x': [x_positions[i-1] - 0.4/n_indicators, x_positions[i-1] + 0.4/n_indicators],
                            'y': [0.85, 0.95]
                        },
                        align="center"
                    )
                )

                # Store current value for next iteration
                prev_values[current_year] = current_value

            # Debug: Print column names and first row of updated_quarterly_display
            print("Available columns in updated_quarterly_display:", updated_quarterly_display.columns)
            print("First row of data:", updated_quarterly_display.row(0, named=True))

            # Create the line plot of quarterly data
            quarterly_line_plot = go.Figure()

            # Debug: Print the data being used for the line plot
            print("\nLine Plot Data:")
            print(quarterly_line_data.select(["quarter_id", "Quarter", "Year", "Quarterly Total"]))

            # Add the quarterly total line using all quarters
            quarterly_line_plot.add_trace(go.Scatter(
                x=quarterly_line_data["quarter_id"],
                y=quarterly_line_data["Quarterly Total"],
                mode='lines+markers',
                name="Quarterly Total",
                line=dict(color='#1f77b4', width=2),
                marker=dict(size=8),
                hovertemplate='%{x}<br>%{y:,.0f} members<extra></extra>'
            ))

            # Update layout for the line plot
            quarterly_line_plot.update_layout(
                showlegend=False,
                hovermode='x unified',
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

            # Add the line plot to the combined figure
            combined_quarterly_figure.add_traces(quarterly_line_plot.data)

            # Update layout for the combined figure
            combined_quarterly_figure.update_layout(
                plot_bgcolor='white',
                paper_bgcolor='white',
                showlegend=True,
                margin=dict(t=150, b=50, l=50, r=50),
                title={
                    'text': "Quarterly Membership Growth with Year-over-Year Comparison",
                    'x': 0.5,
                    'xanchor': 'center',
                    'y': 0.98,
                    'font': {'size': 20, 'color': '#2c3e50', 'family': 'Helvetica Neue'}
                },
                font=dict(family="Helvetica Neue"),
                xaxis=dict(
                    showgrid=False,
                    showline=True,
                    linecolor='#bdc3c7',
                    linewidth=2,
                    domain=[0.05, 0.95]
                ),
                yaxis=dict(
                    showgrid=True,
                    gridcolor='#ecf0f1',
                    showline=True,
                    linecolor='#bdc3c7',
                    linewidth=2,
                    domain=[0.1, 0.8]
                ),
                margin_pad=10
            )

            # Show the final figure
            return combined_quarterly_figure.show()
        return _()


    _()
    return


@app.cell
def _(df, mo, pl):
    print("Debug: Starting quarterly calculations...")

    # Print the columns available in the dataframe
    print("Available columns:", df.columns)

    try:
        # Calculate quarterly totals
        print("Calculating quarterly totals...")
        quarterly_totals = df.group_by("quarter_id").agg([
            pl.first("quarter").alias("Quarter"),
            pl.first("year").alias("Year"),
            pl.sum("Total Member").alias("Quarterly Total"),
            pl.len().alias("Months in Quarter")
        ]).sort("quarter_id")

        print("Quarterly totals calculated. First few rows:", quarterly_totals.head(3))

        # Calculate quarterly growth rates
        print("Calculating growth rates...")
        quarterly_with_growth = quarterly_totals.with_columns([
            pl.when(pl.col("Quarterly Total").is_not_null())
              .then(pl.col("Quarterly Total").pct_change())
              .otherwise(None)
              .alias("QoQ Growth"),

            pl.when(pl.col("Quarterly Total").is_not_null())
              .then(pl.col("Quarterly Total").pct_change(4))
              .otherwise(None)
              .alias("YoY Growth (Quarterly)")
        ])

        print("Growth rates calculated. First few rows:", quarterly_with_growth.head(3))

        # Format growth rates as percentages
        updated_quarterly_display = quarterly_with_growth.with_columns([
            (pl.col("QoQ Growth") * 100).round(2).alias("QoQ Growth (%)"),
            (pl.col("YoY Growth (Quarterly)") * 100).round(2).alias("YoY Growth (Quarterly) (%)")
        ]).select([
            "quarter_id",
            "Quarter",
            "Year",
            "Quarterly Total",
            "Months in Quarter",
            "QoQ Growth (%)",
            "YoY Growth (Quarterly) (%)"
        ]).fill_null("")

        print("Final display dataframe shape:", updated_quarterly_display.shape)

        # Create and return the quarterly table
        quarterly_table = mo.ui.table(
            data=updated_quarterly_display,
            page_size=10,
            pagination=True,
        )

        print("Table created successfully")

    except Exception as e:
        print("Error occurred:", str(e))
        raise
    return (updated_quarterly_display,)


if __name__ == "__main__":
    app.run()
