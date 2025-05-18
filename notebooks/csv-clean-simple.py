import marimo
import pandas as pd
import io

__generated_with = "0.13.10"
app = marimo.App(width="medium")


@app.cell
def cell_1():
    # Import required libraries
    import pandas as pd
    import io
    return None


@app.cell
def cell_2():
    # Create a file upload UI element
    file_upload = marimo.ui.file(label='Upload CSV', multiple=False)
    return file_upload


@app.cell
def cell_3(file_upload):
    # Read the uploaded CSV file into a DataFrame
    if file_upload is None or file_upload.value is None:
        df = pd.DataFrame()
        marimo.md("Please upload a CSV file")
    else:
        # Extract file content from the dictionary and read with pandas
        file_content = file_upload.value["content"]
        df = pd.read_csv(io.BytesIO(file_content))
        marimo.md(f"Loaded CSV with {len(df)} rows and {len(df.columns)} columns")
    
    # Display the data
    if not df.empty:
        marimo.ui.table(df.head(10))
    
    return df


@app.cell
def cell_4(df):
    # Display data types and missing values
    if df.empty:
        return None
    
    info_df = pd.DataFrame({
        'Data Type': df.dtypes,
        'Missing Values': df.isna().sum(),
        'Missing %': (df.isna().sum() / len(df) * 100).round(2)
    })
    
    marimo.md("### Data Types and Missing Values")
    return marimo.ui.table(info_df)


@app.cell
def cell_5(df):
    # Create UI elements for cleaning operations
    if df.empty:
        return None, None, None
    
    columns = list(df.columns)
    
    column_selector = marimo.ui.dropdown(
        options=columns,
        label="Select column",
        value=columns[0] if columns else None
    )
    
    cleaning_action = marimo.ui.dropdown(
        options=["Drop NA values", "Fill NA with mean", "Fill NA with median", "Fill NA with 0", "Drop column"],
        label="Cleaning action",
        value="Drop NA values"
    )
    
    apply_button = marimo.ui.button(label="Apply")
    
    marimo.md("### Cleaning Options")
    marimo.hstack([column_selector, cleaning_action, apply_button])
    
    return column_selector, cleaning_action, apply_button


@app.cell
def cell_6(df, column_selector, cleaning_action, apply_button):
    # Initialize cleaned dataframe and operations log
    cleaned_df = df.copy() if not df.empty else pd.DataFrame()
    operations_log = []
    
    # Function to handle cleaning operations
    def apply_cleaning():
        nonlocal cleaned_df, operations_log
        if df.empty or column_selector is None:
            return
        
        column = column_selector.value
        action = cleaning_action.value
        
        if action == "Drop NA values":
            before_count = len(cleaned_df)
            cleaned_df = cleaned_df.dropna(subset=[column])
            dropped = before_count - len(cleaned_df)
            operations_log.append(f"Dropped {dropped} rows with NA in column '{column}'")
            
        elif action == "Fill NA with mean":
            if pd.api.types.is_numeric_dtype(cleaned_df[column]):
                mean_value = cleaned_df[column].mean()
                cleaned_df[column] = cleaned_df[column].fillna(mean_value)
                operations_log.append(f"Filled NA values in '{column}' with mean: {mean_value:.2f}")
            else:
                operations_log.append(f"Cannot fill with mean: '{column}' is not numeric")
                
        elif action == "Fill NA with median":
            if pd.api.types.is_numeric_dtype(cleaned_df[column]):
                median_value = cleaned_df[column].median()
                cleaned_df[column] = cleaned_df[column].fillna(median_value)
                operations_log.append(f"Filled NA values in '{column}' with median: {median_value:.2f}")
            else:
                operations_log.append(f"Cannot fill with median: '{column}' is not numeric")
                
        elif action == "Fill NA with 0":
            cleaned_df[column] = cleaned_df[column].fillna(0)
            operations_log.append(f"Filled NA values in '{column}' with 0")
            
        elif action == "Drop column":
            cleaned_df = cleaned_df.drop(columns=[column])
            operations_log.append(f"Dropped column '{column}'")
    
    # Connect button to function
    if apply_button is not None:
        apply_button.on_click(lambda _: apply_cleaning())
    
    return cleaned_df, operations_log


@app.cell
def cell_7(cleaned_df, operations_log):
    # Display cleaning operations log
    if operations_log:
        marimo.md("### Cleaning Operations")
        marimo.md("\n".join([f"- {op}" for op in operations_log]))
    
    # Display cleaned data
    if not cleaned_df.empty:
        marimo.md("### Cleaned Data Preview")
        marimo.ui.table(cleaned_df.head(10))
        marimo.md(f"Shape: {cleaned_df.shape[0]} rows × {cleaned_df.shape[1]} columns")
        
        # Download button
        return marimo.ui.download(
            cleaned_df.to_csv(index=False).encode(),
            filename="cleaned_data.csv",
            label="Download Cleaned CSV"
        )
    return None


@app.cell
def cell_8():
    marimo.md("# CSV Cleaning Tool")
    marimo.md("Upload a CSV file to get started with data cleaning and transformation.")
    return None


if __name__ == "__main__":
    app.run()