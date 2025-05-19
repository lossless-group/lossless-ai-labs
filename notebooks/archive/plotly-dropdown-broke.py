


@app.cell
def _(df, pogo, mo):
   # Get the numeric columns for plotting
   cols_for_plotting = df.columns.tolist()
   x_col = cols_for_plotting[0]
   y_cols = cols_for_plotting[1:]

   # Create a figure
   fig = pogo.Figure(cols_for_plotting)
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
