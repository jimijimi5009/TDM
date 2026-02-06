import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import oracledb from 'oracledb';
import fetch from 'node-fetch'; // Import node-fetch for server-side fetch

// Note: The 'oracledb' package may require Oracle Instant Client libraries on the host system.
// If you encounter errors starting the server, you may need to download them from the Oracle website
// and configure your system's PATH environment variable.
// On Windows, you can also use `oracledb.initOracleClient({libDir: 'C:/path/to/your/instantclient'});`

dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Load server/.env first
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Load project root .env for external API credentials

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const API_USER_ID = process.env.API_USER_ID;
const API_PASSWORD = process.env.API_PASSWORD;
const EXTERNAL_API_DOMAIN_CORE = process.env.EXTERNAL_API_DOMAIN_CORE || 'localhost:8081'; // Default for local testing

const getExternalApiBaseUrl = (env: string): string => {
    // Assuming the pattern is "https://[env-prefix]-<EXTERNAL_API_DOMAIN_CORE>"
    // where env comes in as "Q1", "Q2", etc.
    const envPrefix = env.toLowerCase(); // "q1", "q2"
    return `https://${envPrefix}-${EXTERNAL_API_DOMAIN_CORE}`;
};

const getOracleConnectionString = (env: string): string => {
    let hostName: string | null = null;
    switch (env.toUpperCase()) {
      case "Q1": hostName = "ccxqat_adhoc"; break;
      case "Q2": hostName = "ccxsup_adhoc"; break;
      case "Q3": hostName = "qa3.legacy.adhoc"; break;
      case "Q4": hostName = "ccxprf_provportal"; break;
      case "Q5": hostName = "qa5.legacy.adhoc"; break;
      case "PROD": hostName = "ccxp_adhoc"; break;
      default:
        console.error("Unable to get the hostname for Oracle");
        return "Invalid Environment";
    }

    if (env.toUpperCase() === "Q1") return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=qa1dbccx-scan)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=${hostName})))`;
    if (env.toUpperCase() === "Q2") return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=qa2dbccx-scan.ccx.carecentrix.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=${hostName})))`;
    if (env.toUpperCase() === "Q4") return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=ccxq4host.ccx.carecentrix.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=${hostName})))`;
    if (env.toUpperCase() === "PROD") return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=ccxphost.ccx.carecentrix.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=${hostName})))`;
    
    return `(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=qdborarac-scan)(PORT=1521)))(CONNECT_DATA=(SERVICE_NAME=${hostName})(GLOBAL_NAME=${hostName})))`;
};


app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running!');
});

app.get('/api/schema', async (req: Request, res: Response) => {
  const { environment, tableName } = req.query;

  if (!environment || !tableName) {
    return res.status(400).json({ error: 'environment and tableName query parameters are required.' });
  }

  let connection;
  try {
    const connectionString = getOracleConnectionString(environment as string);

    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: connectionString
    });

    const result = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE
       FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = :tableName`,
      [(tableName as string).toUpperCase()], // Bind variables - CONVERT TO UPPERCASE
      { outFormat: oracledb.OUT_FORMAT_OBJECT } // Get results as an array of objects
    );
    
    // The result.rows will be an array of objects, e.g., [{COLUMN_NAME: '...', DATA_TYPE: '...'}]
    const schema = result.rows?.map((row: any) => ({
        column_name: row.COLUMN_NAME,
        data_type: row.DATA_TYPE,
        data_length: row.DATA_LENGTH,
        data_precision: row.DATA_PRECISION,
        is_nullable: row.NULLABLE === 'Y' // Convert 'Y'/'N' to boolean
    }));

    res.json({
      environment,
      tableName,
      schema: schema || [],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch schema from database.', details: (err as Error).message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const snakeToCamel = (str: string) => {
  return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

app.post('/api/external-call', async (req: Request, res: Response) => {
  const { apiType, environment, requestBody } = req.body;

  if (!apiType || !environment) {
    return res.status(400).json({ error: 'apiType and environment are required.' });
  }

  if (!API_USER_ID || !API_PASSWORD) {
    return res.status(500).json({ error: 'API_USER_ID or API_PASSWORD not set in environment variables.' });
  }

  // Determine external API path based on apiType
  let externalApiPath = '';
  switch (apiType) {
    case 'initial':
      externalApiPath = `/cases`; // Path for initial requests, as per user's example
      break;
    case 'cos':
      externalApiPath = `/cos-path-placeholder`; // Placeholder: User needs to provide the actual path for COS
      break;
    case 'edit':
      externalApiPath = `/edit-path-placeholder`; // Placeholder: User needs to provide the actual path for Edit
      break;
    default:
      return res.status(400).json({ error: 'Invalid apiType.' });
  }

  const externalApiBaseUrl = getExternalApiBaseUrl(environment as string);
  const externalApiUrl = `${externalApiBaseUrl}${externalApiPath}`;

  try {
    const authHeader = `Basic ${Buffer.from(`${API_USER_ID}:${API_PASSWORD}`).toString('base64')}`;

    const externalApiResponse = await fetch(externalApiUrl, {
      method: 'POST', // Assuming POST for all these calls for now, based on requestBody
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(requestBody),
    });

    let responseData;
    const contentType = externalApiResponse.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      responseData = await externalApiResponse.json();
    } else {
      responseData = await externalApiResponse.text();
      // If it's not JSON, we might want to wrap it in an object for consistency
      // or just send the raw text. For debugging, sending raw text is useful.
      console.log('External API responded with non-JSON content:', responseData);
    }

    if (!externalApiResponse.ok) {
      // If the response was not OK, and we parsed JSON, we use that for error details.
      // Otherwise, we use the raw text or a generic message.
      const errorMessage = (typeof responseData === 'object' && responseData !== null && 'message' in responseData)
        ? responseData.message
        : (typeof responseData === 'string' ? responseData : externalApiResponse.statusText);
      console.error(`External API Error (${externalApiResponse.status}):`, responseData);
      return res.status(externalApiResponse.status).json({
        error: `External API Error: ${externalApiResponse.status} ${externalApiResponse.statusText}`,
        details: errorMessage,
        externalResponse: responseData // Include the raw external response for debugging
      });
    }

    console.log('External API success response:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('Error proxying external API call:', error);
    res.status(500).json({ error: 'Failed to proxy external API call.', details: (error as Error).message });
  }
});

app.get('/api/service-schema', async (req: Request, res: Response) => {
    const { environment, serviceType } = req.query;

    if (!environment || !serviceType) {
        return res.status(400).json({ error: 'environment and serviceType query parameters are required.' });
    }

    // This is the SQL query provided by the user for "Patient Rest Services"
    const USER_PROVIDED_SQL_QUERY = `
SELECT tp.ZIP, tp.DOB, tp.FIRSTNAME, tp.LASTNAME, tpip.INSPHONE, tpip.SUBSCRIBERID
FROM TBLPATIENT tp
JOIN TBLPATINTAKEPLAN tpip
ON tp.PATIENTNUMBER = tpip.PATIENTNUMBER
WHERE tp.ZIP IS NOT NULL
AND tp.DOB IS NOT NULL
AND tp.FIRSTNAME IS NOT NULL
AND tp.LASTNAME IS NOT NULL
AND tpip.INSPHONE IS NOT NULL
AND tpip.SUBSCRIBERID IS NOT NULL
ORDER BY tp.DOB DESC
FETCH FIRST 1 ROW ONLY`;

    let connection;
    try {
        const connectionString = getOracleConnectionString(environment as string);

        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: connectionString
        });

        const result = await connection.execute(
            USER_PROVIDED_SQL_QUERY,
            [], // No bind variables for this query
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // The result.rows will be an array of objects, e.g., [{ZIP: '...', DOB: '...'}]
        // We need to map these to DataField format expected by the frontend
        const schemaFields = result.metaData?.map((col: { name: string; }, index: number) => {
            let type = 'text'; // Default type
            // Infer type based on column name or actual data type (if available from metadata)
            if (col.name.toLowerCase().includes('date') || col.name.toLowerCase().includes('dob')) {
                type = 'date';
            } else if (col.name.toLowerCase().includes('phone') || col.name.toLowerCase().includes('zip') || col.name.toLowerCase().includes('id')) {
                type = 'text';
            } else if (col.name.toLowerCase().includes('name')) {
                type = 'names';
            }

            return {
                id: `${index}-${col.name}`, // Unique ID
                type: type,
                propertyName: snakeToCamel(col.name),
                option: "",
                checked: true, // Default to checked
            };
        });

        res.json({
            environment,
            serviceType,
            schema: schemaFields || [],
        });

    } catch (err) {
        console.error('Error fetching service schema:', err);
        res.status(500).json({ error: 'Failed to fetch service schema from database.', details: (err as Error).message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }
});

app.post('/api/service-execute', async (req: Request, res: Response) => {
    const { environment, serviceType, selectedColumnNames } = req.body;

    if (!environment || !serviceType || !selectedColumnNames || !Array.isArray(selectedColumnNames) || selectedColumnNames.length === 0) {
        return res.status(400).json({ error: 'environment, serviceType, and selectedColumnNames array are required.' });
    }

    // Base SQL query structure (FROM, JOIN, WHERE, ORDER BY, FETCH)
    const BASE_SQL_QUERY_STRUCTURE = `
FROM TBLPATIENT tp
JOIN TBLPATINTAKEPLAN tpip
ON tp.PATIENTNUMBER = tpip.PATIENTNUMBER
WHERE tp.ZIP IS NOT NULL
AND tp.DOB IS NOT NULL
AND tp.FIRSTNAME IS NOT NULL
AND tp.LASTNAME IS NOT NULL
AND tpip.INSPHONE IS NOT NULL
AND tpip.SUBSCRIBERID IS NOT NULL
ORDER BY tp.DOB DESC
FETCH FIRST 1 ROW ONLY`;

    // Dynamically construct the SELECT clause based on selectedColumnNames
    // Ensure column names are safe to use directly in the query to prevent SQL injection
    // For now, assuming selectedColumnNames only contains valid and expected column identifiers.
    const selectClause = selectedColumnNames.map((col: string) => col).join(', ');
    const fullSqlQuery = `SELECT ${selectClause} ${BASE_SQL_QUERY_STRUCTURE}`;

    let connection;
    try {
        const connectionString = getOracleConnectionString(environment as string);

        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: connectionString
        });

        const result = await connection.execute(
            fullSqlQuery,
            [], // No bind variables needed for column names in SELECT clause
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({
            environment,
            serviceType,
            selectedColumns: selectedColumnNames,
            data: result.rows && result.rows.length > 0 ? result.rows[0] : null, // Return single row
        });

    } catch (err) {
        console.error('Error executing service query:', err);
        res.status(500).json({ error: 'Failed to execute service query.', details: (err as Error).message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }
});