import marimo

__generated_with = "0.13.10"
app = marimo.App()

@app.cell
def cell1():
    import marimo as mo
    import plotly.graph_objects as go
    import pandas as pd
    import numpy as np
    
    # Create sample data
    x = np.linspace(0, 10, 100)
    y1 = np.sin(x)
    y2 = np.cos(x)
    y3 = np.exp(-x/5) * np.sin(x)
    
    # Create a figure
    fig = go.Figure()
    
    # Add traces
    fig.add_trace(go.Scatter(x=x, y=y1, name="sin(x)"))
    fig.add_trace(go.Scatter(x=x, y=y2, name="cos(x)"))
    fig.add_trace(go.Scatter(x=x, y=y3, name="exp(-x/5)*sin(x)"))
    
    # Add dropdown menu
    fig.update_layout(
        updatemenus=[
            dict(
                active=0,
                buttons=list([
                    dict(
                        label="All Traces",
                        method="update",
                        args=[{"visible": [True, True, True]},
                              {"title": "All Traces"}]
                    ),
                    dict(
                        label="sin(x)",
                        method="update",
                        args=[{"visible": [True, False, False]},
                              {"title": "sin(x)"}]
                    ),
                    dict(
                        label="cos(x)",
                        method="update",
                        args=[{"visible": [False, True, False]},
                              {"title": "cos(x)"}]
                    ),
                    dict(
                        label="exp(-x/5)*sin(x)",
                        method="update",
                        args=[{"visible": [False, False, True]},
                              {"title": "exp(-x/5)*sin(x)"}]
                    ),
                ]),
                direction="down",
                pad={"r": 10, "t": 10},
                showactive=True,
                x=0.1,
                xanchor="left",
                y=1.15,
                yanchor="top"
            ),
        ]
    )
    
    # Add annotation
    fig.update_layout(
        annotations=[
            dict(text="Choose trace:", x=0, y=1.12, yref="paper", align="left", showarrow=False)
        ],
        title="Plotly Dropdown Example"
    )
    
    # Display the figure
    mo.ui.plotly(fig)
    return

if __name__ == "__main__":
    app.run()
