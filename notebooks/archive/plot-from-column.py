import marimo

__generated_with = "0.13.10"
app = marimo.App()

@app.cell
def cell1():
    import marimo as mo
    # Create the file upload widget and display it
    f = mo.ui.file(kind="button", filetypes=[".csv"])
    f  # This line ensures the button is shown
    return f, mo

@app.cell
def cell2(f, mo):
    mo.stop(len(f.value) == 0, mo.md("Please upload a CSV file."))
    import pandas as pd
    import plotly.express as px
    
    # Read the CSV file
    df = pd.read_csv(f.value[0].contents)
    
    # Display the dataframe
    mo.md("### Original Data:")
    df
    return df, px

@app.cell
def cell3(df, px):
    import marimo as mo
    # Let user select columns for plotting
    x_column = mo.ui.dropdown(options=df.columns.tolist(), label="X-axis column")
    y_column = mo.ui.dropdown(options=df.columns.tolist(), label="Y-axis column")
    
    # Display the selection widgets
    mo.md("### Select columns for plotting:")
    mo.hstack([x_column, y_column])
    return x_column, y_column, df, px

@app.cell
def cell4(x_column, y_column, df, px):
    import marimo as mo
    # Only create plot if both columns are selected
    if not x_column.value or not y_column.value:
        mo.md("Please select both X and Y columns to create a plot.")
        return
    
    # Create a scatter plot from the selected columns
    fig = px.scatter(
        df, 
        x=x_column.value, 
        y=y_column.value,
        title=f"{y_column.value} vs {x_column.value}",
        width=800, 
        height=500
    )
    
    # Display the plot
    mo.md(f"### Scatter Plot: {y_column.value} vs {x_column.value}")
    mo.ui.plotly(fig)
    return

if __name__ == "__main__":
    app.run()