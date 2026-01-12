import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import oracledb from 'oracledb';

// Note: The 'oracledb' package may require Oracle Instant Client libraries on the host system.
// If you encounter errors starting the server, you may need to download them from the Oracle website
// and configure your system's PATH environment variable.
// On Windows, you can also use `oracledb.initOracleClient({libDir: 'C:/path/to/your/instantclient'});`

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
      `SELECT COLUMN_NAME, DATA_TYPE FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = :tableName`,
      [tableName as string], // Bind variables
      { outFormat: oracledb.OUT_FORMAT_OBJECT } // Get results as an array of objects
    );
    
    // The result.rows will be an array of objects, e.g., [{COLUMN_NAME: '...', DATA_TYPE: '...'}]
    const schema = result.rows?.map((row: any) => ({
        column_name: row.COLUMN_NAME,
        data_type: row.DATA_TYPE
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
