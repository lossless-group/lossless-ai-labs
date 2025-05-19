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
    df = pl.read_csv(f.value[0].contents, separator=",")
    df
    return (df,)


@app.cell
def _(df, mo):
    import plotly.graph_objects as pogo
    # Get the numeric columns for plotting
    cols_for_plotting = df.columns
    x_col = cols_for_plotting[0]
    y_cols = cols_for_plotting[1:]

    # Create a figure
    fig = pogo.Figure()
    for y_col in y_cols:
       fig.add_trace(pogo.Scatter(x=df[x_col], y=df[y_col], name=y_col))

    buttons = []

    # Add all traces and prepare dropdown options
    for i, y_col in enumerate(y_cols):
       visibility = [i == j for j in range(len(y_cols))]
       buttons.append(
          dict(
             label=y_col,
             method="update",
             args=[
                {"visible": visibility},
                {"title": f"{y_col} vs {x_col}"}
             ]
          )
       )

    # Add 'All Traces' button
    buttons.insert(0, 
       dict(
          label="All Traces",
          method="update",
          args=[
             {"visible": [True] * len(y_cols)},
             {"title": f"All columns vs {x_col}"}
          ]
       )
    )

    # Add dropdown menu
    fig.update_layout(
       updatemenus=[
          dict(
             buttons=buttons,
             direction="down",
             x=0.1,
             y=1.1,
          ),
         ]
     )

    fig_display = mo.ui.plotly(fig)
    fig_display
    return


if __name__ == "__main__":
    app.run()
