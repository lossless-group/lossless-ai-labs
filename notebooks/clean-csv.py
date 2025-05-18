import marimo
import marimo as mo
import pandas as pd
import io

__generated_with = "0.13.10"
app = marimo.App(width="medium")

@app.cell
def create_file_uploader():
    file_upload = mo.ui.file(
        label="Upload CSV file",
        accept=".csv",
        multiple=False,
        on_change=None
    )
    return file_upload

@app.cell
def process_csv(file_upload):
    if file_upload.value is None:
        return mo.md("Please upload a CSV file")
    
    # Read the file content
    file_content = file_upload.value["content"]
    file_name = file_upload.value["name"]
    
    # Convert bytes to DataFrame
    df = pd.read_csv(io.BytesIO(file_content))
    
    return df, file_name

@app.cell
def display_data(process_csv):
    if isinstance(process_csv, tuple):
        df, file_name = process_csv
        
        # Display basic information
        info = mo.md(f"## {file_name}")
        shape = mo.md(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
        
        # Create a data preview
        preview = mo.ui.table(df.head(10), selection=None)
        
        # Display data types and missing values
        dtypes = mo.ui.table(
            pd.DataFrame({
                'Data Type': df.dtypes,
                'Missing Values': df.isna().sum(),
                'Missing %': (df.isna().sum() / len(df) * 100).round(2)
            }),
            selection=None
        )
        
        return mo.vstack([info, shape, mo.md("### Preview"), preview, mo.md("### Data Types and Missing Values"), dtypes])
    else:
        return process_csv

@app.cell
def cleaning_options(process_csv):
    if not isinstance(process_csv, tuple):
        return mo.md("No data to clean yet")
    
    df, _ = process_csv
    
    # Create UI elements for cleaning operations
    columns = list(df.columns)
    
    column_selector = mo.ui.dropdown(
        options=columns,
        label="Select column",
        value=columns[0] if columns else None
    )
    
    cleaning_action = mo.ui.dropdown(
        options=["Drop NA values", "Fill NA with mean", "Fill NA with median", "Fill NA with 0", "Drop column"],
        label="Cleaning action",
        value="Drop NA values"
    )
    
    apply_button = mo.ui.button(label="Apply")
    
    return mo.hstack([column_selector, cleaning_action, apply_button]), column_selector, cleaning_action, apply_button

@app.cell
def create_shared_state():
    # This cell creates shared state that will be used by multiple cells
    return {
        "cleaned_df": None,
        "operations_log": [],
        "file_name": None
    }

@app.cell
def clean_data(process_csv, cleaning_options, shared_state):
    if not isinstance(process_csv, tuple):
        return mo.md("No data to clean yet")
    
    df, file_name = process_csv
    _, column_selector, cleaning_action, apply_button = cleaning_options
    
    # Initialize the shared state
    if shared_state["cleaned_df"] is None:
        shared_state["cleaned_df"] = df.copy()
    
    if shared_state["file_name"] is None:
        shared_state["file_name"] = file_name
    
    @apply_button.on_click
    def _(_):
        column = column_selector.value
        action = cleaning_action.value
        
        if action == "Drop NA values":
            before_count = len(shared_state["cleaned_df"])
            shared_state["cleaned_df"] = shared_state["cleaned_df"].dropna(subset=[column])
            dropped = before_count - len(shared_state["cleaned_df"])
            shared_state["operations_log"].append(f"Dropped {dropped} rows with NA in column '{column}'")
            
        elif action == "Fill NA with mean":
            if pd.api.types.is_numeric_dtype(shared_state["cleaned_df"][column]):
                mean_value = shared_state["cleaned_df"][column].mean()
                shared_state["cleaned_df"][column] = shared_state["cleaned_df"][column].fillna(mean_value)
                shared_state["operations_log"].append(f"Filled NA values in '{column}' with mean: {mean_value:.2f}")
            else:
                shared_state["operations_log"].append(f"Cannot fill with mean: '{column}' is not numeric")
                
        elif action == "Fill NA with median":
            if pd.api.types.is_numeric_dtype(shared_state["cleaned_df"][column]):
                median_value = shared_state["cleaned_df"][column].median()
                shared_state["cleaned_df"][column] = shared_state["cleaned_df"][column].fillna(median_value)
                shared_state["operations_log"].append(f"Filled NA values in '{column}' with median: {median_value:.2f}")
            else:
                shared_state["operations_log"].append(f"Cannot fill with median: '{column}' is not numeric")
                
        elif action == "Fill NA with 0":
            shared_state["cleaned_df"][column] = shared_state["cleaned_df"][column].fillna(0)
            shared_state["operations_log"].append(f"Filled NA values in '{column}' with 0")
            
        elif action == "Drop column":
            shared_state["cleaned_df"] = shared_state["cleaned_df"].drop(columns=[column])
            shared_state["operations_log"].append(f"Dropped column '{column}'")
    
    return mo.ui.accordion(
        "Apply Cleaning Actions",
        mo.hstack([column_selector, cleaning_action, apply_button])
    )

@app.cell
def show_cleaned_data(shared_state):
    if shared_state["cleaned_df"] is None or not shared_state["operations_log"]:
        return mo.md("No cleaning operations applied yet")
    
    log_display = mo.md("### Cleaning Operations\n" + "\n".join([f"- {op}" for op in shared_state["operations_log"]]))
    cleaned_preview = mo.ui.table(shared_state["cleaned_df"].head(10), selection=None)
    
    download_button = mo.ui.download(
        shared_state["cleaned_df"].to_csv(index=False).encode(),
        filename=f"cleaned_{shared_state['file_name']}",
        label="Download cleaned CSV"
    )
    
    return mo.vstack([
        log_display, 
        mo.md("### Cleaned Data Preview"), 
        cleaned_preview,
        mo.md(f"Shape: {shared_state['cleaned_df'].shape[0]} rows × {shared_state['cleaned_df'].shape[1]} columns"),
        download_button
    ])

@app.cell
def app():
    # Create the main application layout
    shared_state = create_shared_state()
    file_upload = create_file_uploader()
    data_display = display_data(process_csv(file_upload))
    cleaning_panel = clean_data(process_csv(file_upload), cleaning_options(process_csv(file_upload)), shared_state)
    cleaned_data_display = show_cleaned_data(shared_state)
    
    return mo.vstack([
        mo.md("# CSV Cleaning Tool"),
        mo.md("Upload a CSV file to get started:"),
        file_upload,
        data_display,
        mo.md("## Data Cleaning"),
        cleaning_panel,
        cleaned_data_display
    ])


if __name__ == "__main__":
    app.run()
