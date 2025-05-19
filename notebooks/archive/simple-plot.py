import marimo

__generated_with = "0.13.10"
app = marimo.App()


def _():
    import marimo as mo
    # Create the file upload widget and display it
    f = mo.ui.file(kind="button", filetypes=[".csv"])
    return f  # This line ensures the button is shown
_()

@app.cell
def _(f, mo):
    mo.stop(len(f.value) == 0, mo.md("Please upload a CSV file."))
    import pandas as pd
    
    # Read the CSV file
    df = pd.read_csv(f.value[0].contents)
    
    # Display the dataframe
    mo.md("### Original Data:")
    df
    return df


@app.cell
def _(df, mo):
    import plotly.express as px
    # Let user select columns for plotting
    x_column = mo.ui.dropdown(options=df.columns.tolist(), label="X-axis column")
    y_column = mo.ui.dropdown(options=df.columns.tolist(), label="Y-axis column")
    
    # Display the selection widgets
    mo.md("### Select columns for plotting:")
    # Display the UI elements directly
    x_column
    y_column
    # Stack them horizontally
    mo.hstack([x_column, y_column])
    return x_column, y_column, px


@app.cell
def _(x_column, y_column, df, px, mo):
    # Only create plot if both columns are selected
    if not x_column.value or not y_column.value:
        mo.md("Please select both X and Y columns to create a plot.")
        return
    
    # Create a scatter plot from the selected columns
    plot = mo.ui.plotly(
        px.scatter(
            df, 
            x=x_column.value, 
            y=y_column.value,
            title=f"{y_column.value} vs {x_column.value}",
            width=800, 
            height=500
        )
    )
    
    # Display the plot
    plot
    return plot


if __name__ == "__main__":
    app.run()
