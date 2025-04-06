from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
from io import BytesIO
import os
import re
from openai import OpenAI
import mysql.connector
import re._compiler
import uvicorn
from dotenv import load_dotenv
import requests
import io
import numpy as np

load_dotenv()
deepseek_api_key = os.getenv("DEEPSEEK_API_KEY") 
if not deepseek_api_key:
    raise ValueError("DEEP_SEEK_API_KEY is not set in the environment variables.")



client = OpenAI(
    api_key=deepseek_api_key,
    base_url="https://api.deepseek.com/v1" 
)



app = FastAPI(title="AI-Assisted Table Mapping API")

regex_pattern = r"(.?)'''\s([\s\S]?)\s'''(.*)"




# CORS middleware
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/generate-prompt")
async def generate_prompt(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    file3: UploadFile = File(...)
):
    print("here")
    try:
        # Read CSV files and get first 5 rows
        df1 = pd.read_csv(BytesIO(await file1.read()))
        data1 = df1.head(5).to_csv(index=False)
        
        df2 = pd.read_csv(BytesIO(await file2.read()))
        data2 = df2.head(5).to_csv(index=False)
        
        destination_df = pd.read_csv(BytesIO(await file3.read()))
        destination_columns = ", ".join(destination_df.columns)

        prompt = f"""
        You are AI expert, you are tasked to design an algorithm to recognize the data and its meaning. You are given 5 rows and your job is to recognize the meaning of the data. Once meaning is understood you automatically recognize all new data into same category. Look only at the data and not at column names, column names can be cryptic. Generate a context or meaning of the data by looking at the values present in the data. Use the destination columns as target column and identify how columns from file1 and file3 can be mapped to columns in destination model.   							
        Algorithm for Data Recognition and Categorization
        Please produce an output that matches this regex format:
        {regex_pattern}
        The single quotes must be typewriter-style or ASCII single quote (').

        1. Data Type Identification:
           - Identify text vs numeric fields by looking at the data (ignore column headings).

        2. Pattern Recognition:
           - Rows from file1 and file2 :
             -file1:
             {data1}
             -file2:
             {data2}
           - Look for recognizable patterns (names, numeric IDs, etc.) without relying on headers.

        3. Contextual Analysis:
           - Use real content given above to infer meaning (e.g., numeric sequences as account/ID, text as names).

        4. Mapping and Categorization:
           - Destination Format: {destination_columns}
           - Identify how columns in file1 and file2 map to destination by values, not headers.

        5. Data Mapping:
            - Map the data from file1 and file2 to destination.
            - Use the values in the data to determine the mapping, not the headers.
            - Provide a clear explanation of the mapping and categorization process.
            -Make sure all the columns of destination are mapped to a column in file1 or file2,it can also be mapped to columns from both tables.

        6. Data Categorization and Table Generation:
           - Provide a  table with columns: "Destination Column" , "File 1 Column" , "File 2 Column" , "Reasoning"
           -IMPORTANT: Return the table enclosed in triple single quotes on separate lines: 
             '''
              Destination Column,File 1 Column,File 2 Column,Reasoning
              value1,value2,value3,"value4"
             ...
             '''
             NO markdown or HTML formatting is needed.
             *Ensure that only the cells in "Reasoning" column are enclosed in double quotes.*
        """

        # Request the AI model for a completion
        chat_completion = client.chat.completions.create(
            model="deepseek-chat",  # DeepSeek model name
            messages=[{"role": "user", "content": prompt}],
        )
        result = chat_completion.choices[0].message.content.strip()
        
        pattern = re.compile(r"(.*?)'''\s*([\s\S]*?)\s*'''(.*)", re.DOTALL)
        match = pattern.search(result)
        if match:
                    print("true")
                    table_text = match.group(2).strip()
                    print(table_text)
                    df_gen = pd.read_csv(io.StringIO(table_text), sep=",")

                    result_dict = df_gen.replace({np.nan: None}).to_dict(orient="records")
                    return JSONResponse(content=result_dict)

        


    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating prompt: {str(e)}")

###################################################################################################################################################################################
###################################################################################################################################################################################



@app.post("/update-table/")
async def update_table_endpoint(
    table: str = Form(...),
    suggestion: str = Form(...),
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
):
    print("update-table end point called")
    try:
        # Read file1 and file2 content for additional context
        df1 = pd.read_csv(BytesIO(await file1.read()))
        data1 = df1.head(5).to_csv(index=False)
        
        df2 = pd.read_csv(BytesIO(await file2.read()))
        data2 = df2.head(5).to_csv(index=False)

        # Construct the update prompt with context
        update_prompt = f"""
        The following table was generated by the AI:
        {table}
        
        The user has suggested the following changes:
        {suggestion}
        
        To help you update the table, here are sample rows from the source files:
        
        File 1:
        {data1}
        
        File 2:
        {data2}
        
        - Provide a table with columns: "Destination Column", "File 1 Column", "File 2 Column", "Reasoning"
        - Ensure that only the cells in the "Reasoning" column are enclosed in double quotes.
        - All other cells should *not* have quotes.
        - Use a comma , as the delimiter.
        - Return the table enclosed in triple single quotes on separate lines:
          '''
          Destination Column,File 1 Column,File 2 Column,Reasoning
          First Name,name1,user1,"Represents first names from both files."
          Last Name,name2,user2,"Represents last names from both files."
          ...
          '''
        - NO markdown or HTML formatting is needed.
        Please produce an output that matches this regex format:
        {regex_pattern}
        The single quotes must be typewriter-style or ASCII single quote (').
        """

        # Query the LLM for the updated table
        chat_completion = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": update_prompt}],
        )
        updated_result = chat_completion.choices[0].message.content.strip()
        pattern = re.compile(r"(.*?)'''\s*([\s\S]*?)\s*'''(.*)", re.DOTALL)
        match = pattern.search(updated_result)
        print(match)
        if match:
                    table_text = match.group(2).strip()
                    try:
                        df_gen = pd.read_csv(io.StringIO(table_text), sep=",")

                        # Replace NaNs with None so JSON can serialize
                        result_dict = df_gen.replace({np.nan: None}).to_dict(orient="records")
                        return JSONResponse(content=result_dict)
                    except:
                        print("could not parse table content as csv")
        return {"updated_table": updated_result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating table: {str(e)}")


###################################################################################################################################################################################
###################################################################################################################################################################################



@app.post("/generate-sql")
async def generate_sql_endpoint(
    file1_content: str = Form(...),
    file2_content: str = Form(...),
    destination_columns: str = Form(...),
    df_final: str = Form(...),
):
    try:
        prompt = f"""
        You are an expert SQL developer. Based on the following information, generate SQL statements to create tables for file1, file2, and destination, including primary keys and necessary constraints. Handle cases where a destination column maps to multiple source columns. Include SQL constraints such as primary keys, foreign keys, and any necessary UNIQUE or NOT NULL constraints.

        *File1 Sample Data:*
        {file1_content}

        *File2 Sample Data:*
        {file2_content}

        *Destination Columns:*
        {destination_columns}

        *Mapping Table (df_final):*
        {df_final}

        *Instructions:*
        1. *CREATE TABLE Statements:*
           - Define tables for file1, file2, and destination based on the mapping.
           - Choose appropriate data types.
           - Set primary keys for each table.
           - Add foreign key constraints where necessary.

        2. *INSERT INTO Statements:*
           - Generate INSERT statements to populate the destination table based on the mappings.
           - Handle cases where destination columns are derived from multiple source columns.

        3. *Constraints:*
           - Add any additional constraints that ensure data integrity based on the mappings.

        *Output Format:*
        Provide all SQL statements enclosed within triple single quotes as shown below:
        '''
        -- Your SQL Statements Here
        '''
        Ensure no markdown or HTML formatting is included.
        """

        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            temperature=0  # For more deterministic output
        )
        sql_output = response.choices[0].message.content.strip()
        
        # Extract SQL statements enclosed in triple single quotes
        if "'''" in sql_output:
            sql_statements = sql_output.split("'''")[1]
        else:
            sql_statements = sql_output  # Fallback if not properly formatted
        
        return {"sql_statements": sql_statements}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating SQL: {str(e)}")



###################################################################################################################################################################################
###################################################################################################################################################################################


@app.post("/generate-mapped-csv")
async def generate_mapped_csv(
    mapping_table: str = Form(...),
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
):
    try:
        # Extract the table content from the mapping table string
        pattern = re.compile(r"(.*?)'''\s*([\s\S]*?)\s*'''(.*)", re.DOTALL)
        match = pattern.search(mapping_table)
        
        if not match:
            raise HTTPException(status_code=400, detail="Invalid mapping table format")
        
        table_text = match.group(2).strip()
        
        # Parse the mapping table
        df_mapping = pd.read_csv(BytesIO(table_text.encode()))
        
        # Clean column names
        df_mapping.columns = df_mapping.columns.str.strip()
        
        # Read input files
        file1_content = await file1.read()
        file2_content = await file2.read()
        df_file1 = pd.read_csv(BytesIO(file1_content))
        df_file2 = pd.read_csv(BytesIO(file2_content))
        
        # Get the maximum length of the datasets
        max_len = max(len(df_file1), len(df_file2))
        
        # Initialize a dictionary to store mapped data
        mapped_data = {}
        
        # Map columns based on the mapping table
        for _, row in df_mapping.iterrows():
            destination_col = row["Destination Column"]
            file1_col = row["File 1 Column"]
            file2_col = row["File 2 Column"]
            
            # Check for column existence and map data
            if pd.notna(file1_col) and file1_col in df_file1.columns:
                column_data = df_file1[file1_col].tolist()
            elif pd.notna(file2_col) and file2_col in df_file2.columns:
                column_data = df_file2[file2_col].tolist()
            else:
                # Fill with empty values if no mapping is available
                column_data = [""] * max_len
            
            # Ensure the column data is of the correct length
            column_data = column_data[:max_len]  # Truncate if necessary
            if len(column_data) < max_len:
                column_data.extend([""] * (max_len - len(column_data)))  # Pad with empty strings
            
            mapped_data[destination_col] = column_data
        
        # Create the final mapped DataFrame
        mapped_df = pd.DataFrame(mapped_data)
        
        # Convert to CSV string
        csv_data = mapped_df.to_csv(index=False)
        
        # Return the CSV as a downloadable file
        output = BytesIO(csv_data.encode())
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=mapped_data.csv"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating mapped CSV: {str(e)}")


###################################################################################################################################################################################
###################################################################################################################################################################################


@app.get("/download-csv/{filename}")
async def download_csv(filename: str, csv_data: str = Form(...)):
    try:
        output = BytesIO(csv_data.encode())
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating download: {str(e)}")


@app.get("/download-sql/{filename}")
async def download_sql(filename: str, sql_data: str = Form(...)):
    try:
        output = BytesIO(sql_data.encode())
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating download: {str(e)}")



###################################################################################################################################################################################
###################################################################################################################################################################################


@app.post("/push-to-sql/")
async def push_to_sql(
    host: str = Form(...),
    port: int = Form(...),
    database: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    table_name: str = Form(...),
    csv_file: UploadFile = File(...),
):
    try:
        csv_content = await csv_file.read()
        df = pd.read_csv(BytesIO(csv_content))

        # Connect to MySQL
        conn = mysql.connector.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database=database
        )
        cursor = conn.cursor()

        # Create table if not exists
        columns = ", ".join([f"`{col}` TEXT" for col in df.columns])
        create_table_query = f"CREATE TABLE IF NOT EXISTS `{table_name}` ({columns})"
        cursor.execute(create_table_query)

        # Insert data
        placeholders = ", ".join(["%s"] * len(df.columns))
        insert_query = f"INSERT INTO `{table_name}` VALUES ({placeholders})"
        for _, row in df.iterrows():
            cursor.execute(insert_query, tuple(row.fillna("").tolist()))

        conn.commit()
        cursor.close()
        conn.close()

        return {"message": f"Data successfully inserted into table `{table_name}`."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error pushing to MySQL: {str(e)}")




###################################################################################################################################################################################
###################################################################################################################################################################################


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
