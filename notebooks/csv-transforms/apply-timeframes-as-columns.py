import marimo

__generated_with = "0.13.10"
app = marimo.App()


@app.cell
def _():
    import marimo as mo
    f = mo.ui.file(kind="button", filetypes=[".csv"])
    f 
    return f, mo


@app.cell
def _(f, mo):
    mo.stop(len(f.value) == 0, mo.md("Please upload a CSV file."))
    import polars as pl
    df = pl.read_csv(f.value[0].contents, separator=";")
    df
    return df, pl


@app.cell
def _(df, mo, pl):
    df_with_count = df.with_row_index(name="month_count", offset=1)
    df_with_quarter = df_with_count.with_columns([
        pl.when(pl.col("month").is_in([1, 2, 3]))
        .then(pl.lit("Q1"))
        .when(pl.col("month").is_in([4, 5, 6]))
        .then(pl.lit("Q2"))
        .when(pl.col("month").is_in([7, 8, 9]))
        .then(pl.lit("Q3"))
        .otherwise(pl.lit("Q4"))
        .alias("quarter"),

        pl.concat_str([
        pl.col("year").cast(str),
        pl.when(pl.col("month").is_in([1, 2, 3])).then(pl.lit("Q1"))
         .when(pl.col("month").is_in([4, 5, 6])).then(pl.lit("Q2"))
         .when(pl.col("month").is_in([7, 8, 9])).then(pl.lit("Q3"))
         .otherwise(pl.lit("Q4"))
        ]).alias("quarter_id")
    ])

    # Add half column based on month
    df_with_half = df_with_quarter.with_columns([
        pl.when(pl.col("month").is_in([1, 2, 3, 4, 5, 6]))
        .then(pl.lit("H1"))
        .otherwise(pl.lit("H2"))
        .alias("half"),

        pl.concat_str([
        pl.col("year").cast(str),
        pl.when(pl.col("month").is_in([1, 2, 3, 4, 5, 6])).then(pl.lit("H1"))
            .otherwise(pl.lit("H2"))
        ]).alias("half_id")
    ])

    df_with_timeframe_id = df_with_half.with_columns([
        pl.concat_str([
            pl.col("year").cast(str),
            pl.lit("-"),
            pl.col("half"),
            pl.lit("-"),
            pl.col("quarter"),
            pl.lit("-"),
            pl.col("month").cast(str)
        ]).alias("timeframe_id")
    ])

    # A cleaner approach is to explicitly list all columns in the desired order

    # First, get all columns from the dataframe that has the new columns
    all_available_columns = df_with_half.columns

    # Get the original columns (without quarter and half)
    original_columns = [col for col in df_with_half.columns if col not in [ "half", "half_id", "quarter", "quarter_id", "timeframe_id"]]
    # Find the position of the month column
    month_idx = original_columns.index("month_count")

    # Create the final column order with quarter and half after month
    new_columns = (
        original_columns[:month_idx+1] +  # Columns before and including month   
        ["timeframe_id", "half", "half_id", "quarter", "quarter_id"] +  # New timeframe columns
        original_columns[month_idx+1:]    # Remaining original columns
    )

    # Select columns in the new order
    df_reordered = df_with_timeframe_id.select(new_columns)
    # Display the result
    mo.md("### Data with quarter and half columns:")
    df_reordered

    return (df_reordered,)


@app.cell
def _(df_reordered, mo):

    # Save the CSV file
    df_reordered.write_csv("private-data/timeframes_output.csv")

    # Display a confirmation message
    mo.md("**Success!** Transformed CSV saved as `private-data/timeframes_output.csv`")
    return


if __name__ == "__main__":
    app.run()
