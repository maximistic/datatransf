from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
import pandas as pd
import requests
import re
import io
from io import BytesIO
import uvicorn
from typing import Optional, List

AI_AGENT_BASE_URL = "http://localhost:8000"  # This is the URL of the AI agent server

app = FastAPI(title="AI-Assisted Table Mapping API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
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
    try:
       
        file1_content = await file1.read()
        file2_content = await file2.read()
        file3_content = await file3.read()
        
        #combining files
        files = {
            "file1": (file1.filename, file1_content, file1.content_type),
            "file2": (file2.filename, file2_content, file2.content_type),
            "file3": (file3.filename, file3_content, file3.content_type),
        }
        print("The files are uploaded properly")
        
        try:
            response = requests.post(AI_AGENT_BASE_URL, files=files)
            if response.status_code == 200:
                return response.json() 
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error from AI agent: {response.text}"
                )
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=500,
                detail=f"Could not connect to AI agent: {str(e)}"
            )
    
    except Exception as e:
        print("Error in /generate-prompt:", str(e))  
        raise HTTPException(status_code=500, detail=f"Error generating prompt: {str(e)}")

@app.post("/update-table/")
async def update_table(
    table: str = Form(...),
    suggestion: str = Form(...),
    file1: UploadFile = File(...),
    file2: UploadFile = File(...)
):
    try:
       
        file1_content = await file1.read()
        file2_content = await file2.read()
        
        
        files = {
            "file1": (file1.filename, file1_content, file1.content_type),
            "file2": (file2.filename, file2_content, file2.content_type),
        }
        
        data = {
            "table": table,
            "suggestion": suggestion
        }
        
        try:
            response = requests.post(f"{AI_AGENT_BASE_URL}/update-table/", files=files, data=data)
            
            if response.status_code == 200:
                return response.json()  
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Error from AI agent: {response.text}"
                )
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=500,
                detail=f"Could not connect to AI agent: {str(e)}"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating table: {str(e)}")

@app.post("/generate-mapped-csv")
async def generate_mapped_csv(
    mapping_table: str = Form(...),
    file1: UploadFile = File(...),
    file2: UploadFile = File(...)
):
    try:
        # Extract the table content from the mapping table string
        pattern = re.compile(r"(.*?)'''\s*([\s\S]*?)\s*'''(.*)", re.DOTALL)
        match = pattern.search(mapping_table)
        
        if not match:
            raise HTTPException(status_code=400, detail="Invalid mapping table format")
        
        table_text = match.group(2).strip()
        
        # Parse the mapping table
        df_mapping = pd.read_csv(io.StringIO(table_text))
        
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

@app.post("/generate-sql")
async def generate_sql(
    file1_content: str = Form(...),
    file2_content: str = Form(...),
    destination_columns: str = Form(...),
    df_final: str = Form(...)
):
    try:
        # Forward the request to the AI agent
        payload = {
            "file1_content": file1_content,
            "file2_content": file2_content,
            "destination_columns": destination_columns,
            "df_final": df_final
        }
        
        response = requests.post(f"{AI_AGENT_BASE_URL}/generate-sql", data=payload)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Error from AI agent: {response.text}"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating SQL statements: {str(e)}")

@app.get("/download-csv/{filename}")
async def download_csv(filename: str, csv_data: str = Form(...)):
    """
    Endpoint to download CSV data as a file
    """
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
    """
    Endpoint to download SQL data as a file
    """
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

import mysql.connector

@app.post("/push-to-sql/")
async def push_to_sql(
    host: str = Form(...),
    port: int = Form(...),
    database: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    table_name: str = Form(...),
    csv_file: UploadFile = File(...)
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)  # Using port 8001 to avoid conflict with AI server