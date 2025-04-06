"""
AI-Assisted Table Mapping API - FastAPI Documentation
=====================================================

This FastAPI application provides a backend for AI-assisted table mapping, SQL generation,
and data integration workflows. It interacts with an AI agent for smart suggestions and table
modifications, and supports features like CSV uploading, mapping, SQL generation, and pushing data to MySQL.

---

**Endpoints Overview:**

1. **/generate-prompt**
   - Accepts three uploaded CSV files.
   - Sends them to an AI agent to generate a mapped table prompt.
   - Parses the returned text for CSV content and converts it into JSON.

2. **/update-table**
   - Accepts two input CSV files and a suggestion + previously generated table.
   - Sends this data to the AI agent to update the table accordingly.
   - Returns the updated table in JSON format.

3. **/generate-mapped-csv**
   - Accepts a mapping table and two CSV files.
   - Maps columns from the input files to the destination file format.
   - Returns the mapped result as a downloadable CSV.

4. **/generate-sql**
   - Accepts content of file1, file2, destination columns and the final dataframe.
   - Passes them to the AI agent which returns SQL insert statements.

5. **/download-csv/{filename}**
   - Accepts `csv_data` and returns a downloadable CSV file.

6. **/download-sql/{filename}**
   - Accepts `sql_data` and returns a downloadable SQL script.

7. **/push-to-sql/**
   - Accepts SQL database credentials and a CSV file.
   - Pushes the CSV content to a specified MySQL table.

---

**Dependencies:**
- FastAPI
- pandas
- numpy
- requests
- uvicorn
- mysql-connector-python

---

**How to Run:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

**Notes:**
- This app communicates with a secondary AI agent running on `http://127.0.0.1:8001`. Ensure the agent server is running separately.
- All CORS are enabled for flexibility across frontend origins.
- Extensive exception handling is used to return clear HTTP error messages when issues arise.

---

**Security Warning:**
- Avoid exposing sensitive DB credentials in production.
- Implement authentication and access control in a real deployment scenario.

"""
