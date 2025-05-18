import marimo

__generated_with = "0.13.10"
app = marimo.App()


@app.cell
def _():
    import marimo as mo
    # Create the file upload widget and display it
    f = mo.ui.file(kind="button", filetypes=[".csv"])
    f  # This line ensures the button is shown
    return f, mo


@app.cell
def _(f, mo):
    mo.stop(len(f.value) == 0, mo.md("Please upload a CSV file."))
    import polars as pl
    df = pl.read_csv(f.value[0].contents, separator=";")
    df
    return df, pl

@app.cell
def _(df, pl):
    # Process each column individually to handle nulls properly
    string_no_commas = []
    
    for col in df.columns:
        # Apply string replacement only to non-null values, keep as strings
        processed_col = (
            pl.when(pl.col(col).is_null())
            .then(pl.lit(None))
            .otherwise(
                pl.col(col)
                .cast(pl.Utf8)
                .str.replace_all(r"\.", "")
                # No conversion to Int64, keep as strings
            )
            .alias(col)
        )
        string_no_commas.append(processed_col)
    
    # Apply the period replacements
    df_clean = df.with_columns(string_no_commas)
    df_clean
    return df_clean

@app.cell
def _(df_clean, pl):
    # Check if month column exists
    if "month" not in df_clean.columns:
        mo.md("**Warning**: No 'month' column found. Cannot add quarter and half columns.")
        return df_clean
    
    # Add row index as month_count
    df_with_count = df_clean.with_row_index(name="month_count", offset=1)
    
    # Add quarter column based on month
    df_with_quarter = df_with_count.with_columns([
        pl.when(pl.col("month").is_in([1, 2, 3]))
        .then(pl.lit("Q1"))
        .when(pl.col("month").is_in([4, 5, 6]))
        .then(pl.lit("Q2"))
        .when(pl.col("month").is_in([7, 8, 9]))
        .then(pl.lit("Q3"))
        .otherwise(pl.lit("Q4"))
        .alias("quarter")
    ])
    
    # Add half column based on month
    df_with_timeframes = df_with_quarter.with_columns([
        pl.when(pl.col("month").is_in([1, 2, 3, 4, 5, 6]))
        .then(pl.lit("H1"))
        .otherwise(pl.lit("H2"))
        .alias("half")
    ])
    
    # Get all columns for reordering
    all_available_columns = df_with_timeframes.columns
    
    # Get the original columns (without the new timeframe columns)
    original_columns = [col for col in all_available_columns 
                       if col not in ["month_count", "quarter", "half"]]
    
    # Find the position of the month column
    month_idx = original_columns.index("month")
    
    # Create the final column order
    new_columns = [
        "month_count"  # Start with month_count as first column
    ] + original_columns[:month_idx+1] + [
        "quarter",    # Add quarter after month
        "half"        # Add half after quarter
    ] + original_columns[month_idx+1:]
    
    # Select columns in the new order
    df_final = df_with_timeframes.select(new_columns)
    
    # Display the result
    mo.md("### Final data with timeframe columns:")
    df_final
    return df_final


@app.cell
def _(df_final, mo):
    # Save the CSV file
    df_final.write_csv("private/data/transformed_output.csv")
    
    # Display a confirmation message
    mo.md("**Success!** Transformed CSV saved as `private/data/transformed_output.csv`")
    return


if __name__ == "__main__":
    app.run()