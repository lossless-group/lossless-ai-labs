import marimo

__generated_with = "0.13.10"
app = marimo.App()


@app.cell
def _():
    import marimo as mo
    import pandas as pd
    import plotly.express as px
    
    # Create a simple scatter plot
    plot = mo.ui.plotly(
        px.scatter(x=[0, 1, 4, 9, 16], y=[0, 1, 2, 3, 4], width=600, height=300)
    )
    plot
    return plot, px, pd, mo


if __name__ == "__main__":
    app.run()