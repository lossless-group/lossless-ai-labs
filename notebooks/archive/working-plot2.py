import marimo

__generated_with = "0.13.10"
app = marimo.App()


@app.cell
def _():
    return


@app.cell
def _():
    def _():
        import marimo as mo
        # Create the file upload widget and display it
        f = mo.ui.file(kind="button", filetypes=[".csv"])
        return f  # This line ensures the button is shown
    _()
    return


@app.cell
def _():
    def _(f, mo):
        mo.stop(len(f.value) == 0, mo.md("Please upload a CSV file."))
        import polars as pl
        df = pl.read_csv(f.value[0].contents, separator=";")
        df
        return df, pl
    return


@app.cell
def _():
    def _(df, mo):
        import plotly.express as px
        # Let user select columns for plotting
        x_column = mo.ui.dropdown(options=df.columns.tolist(), label="X-axis column")
        y_column = mo.ui.dropdown(options=df.columns.tolist(), label="Y-axis column")
    
        # Display the selection widgets
        mo.md("### Select columns for plotting:")
        mo.hstack([x_column, y_column])
        return x_column, y_column, px
    return


@app.cell
def cell1():
    import pandas as pd
    import plotly.express as px

    # Create sample data
    data = {
        'x': [0, 1, 2, 3, 4, 5],
        'y': [0, 1, 4, 9, 16, 25]
    }
    df = pd.DataFrame(data)

    # Display the dataframe
    df
    return df, px


@app.cell
def cell2(df, px):
    import marimo as mo
    # Create a simple scatter plot
    fig = px.scatter(df, x='x', y='y', title='Simple Scatter Plot')
    mo.ui.plotly(fig)
    return


if __name__ == "__main__":
    app.run()
