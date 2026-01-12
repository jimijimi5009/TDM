The SQL query to retrieve all column names and their data types for a specific table in an Oracle database is:

```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM ALL_TAB_COLUMNS
WHERE TABLE_NAME = 'YOUR_TABLE_NAME';
```

**Explanation:**

*   `ALL_TAB_COLUMNS`: This is an Oracle data dictionary view that provides information about all columns of all tables accessible to the current user.
*   `COLUMN_NAME`: This column from the view will give you the name of each column in the table.
*   `DATA_TYPE`: This column will provide the data type of each column (e.g., VARCHAR2, NUMBER, DATE).
*   `WHERE TABLE_NAME = 'YOUR_TABLE_NAME'`: You will replace `'YOUR_TABLE_NAME'` with the actual name of the table you want to query (e.g., `'TBLPATINTAKEPLAN'`). Make sure the table name is in uppercase if your Oracle database stores it that way (which is common unless quoted identifiers were used during table creation).

**How this integrates with our current setup:**

1.  **Backend Implementation:** You will implement this query within the backend server (`server/src/index.ts`).
2.  **Database Connection:** The backend will use the Oracle connection details (which you will provide later) to establish a connection to your Oracle database.
3.  **Execution:** The backend will execute this `SELECT` query.
4.  **Frontend Data:** The results of this query (the `COLUMN_NAME` and `DATA_TYPE` for each column) will then be sent to the frontend, replacing the mock `mockTblPatIntakePlanSchema` data we currently have.
5.  **Dynamic UI:** The frontend will then dynamically populate the "Data Type" section with the actual column names and their types from your database, allowing users to build custom data selections.

Would you like me to proceed with updating the backend to use this query instead of the mock data? This would involve adding the `oracledb` package to the backend and configuring it to connect to your database.