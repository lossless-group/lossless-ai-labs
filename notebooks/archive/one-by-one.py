


@app.cell
def _(df, pogo, mo):
   # Get the numeric columns for plotting
   cols_for_plotting = df.columns.tolist()

   # Create a figure
   fig = pogo.Figure(cols_for_plotting)
    
   # Add a trace for each numeric column (using the first numeric column as x-axis)
   x_col = cols_for_plotting[0]
    
   # Create visibility list for dropdown
   all_visible = []
   buttons = []
    
   # Add all traces and prepare dropdown options
   for i, y_col in enumerate(cols_for_plotting[1:]):
      fig.add_trace(pogo.Scatter(x=df[x_col], y=df[y_col], mode='markers', name=y_col))
      all_visible.append(True)
        
      # Create a visibility list for this trace
      trace_visible = [False] * len(cols_for_plotting[1:])
      trace_visible[i] = True
        
      # Add button for this trace
      buttons.append(
         dict(
            label=y_col,
            method="update",
            args=[
               {"visible": trace_visible},
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
            {"visible": all_visible},
            {"title": f"All columns vs {x_col}"}
         ]
      )
   )
    
   # Add dropdown menu
   fig.update_layout(
      updatemenus=[
         dict(
            active=0,
            buttons=buttons,
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
         dict(text=f"Choose column to plot against {x_col}:", 
              x=0, y=1.12, yref="paper", align="left", showarrow=False)
      ],
      title=f"All columns vs {x_col}"
   )
    
   fig_display = mo.ui.plotly(fig)
   fig_display
   return
