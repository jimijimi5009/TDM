The SQL query to retrieve all column names and their data types for a specific table in an Oracle database is:

```sql
SELECT COLUMN_NAME, DATA_TYPE
FROM ALL_TAB_COLUMNS
WHERE TABLE_NAME = 'YOUR_TABLE_NAME';
```