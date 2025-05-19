import marimo

__generated_with = "0.13.10"
app = marimo.App()

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
