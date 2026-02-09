import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import oracledb from 'oracledb';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const API_USER_ID = process.env.API_USER_ID;
const API_PASSWORD = process.env.API_PASSWORD;
const EXTERNAL_API_DOMAIN_CORE = process.env.EXTERNAL_API_DOMAIN_CORE || 'localhost:8081';

const getExternalApiBaseUrl = (env: string): string => {
    const envPrefix = env.toLowerCase();
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
    interface OracleColumnMetadata {
        COLUMN_NAME: string;
        DATA_TYPE: string;
        DATA_LENGTH: number;
        DATA_PRECISION: number | null;
        DATA_SCALE: number | null;
        NULLABLE: 'Y' | 'N';
    }
    const schema = (result.rows as OracleColumnMetadata[])?.map((row) => ({
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
      } catch (err: unknown) {
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

const generatePatientNumber = () => {
  return Array(10).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
};

const generateRandomName = (prefix: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = prefix;
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const generatePhoneNumber = () => {
    const randomDigits = () => Array(3).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
    return `(${randomDigits()}) ${randomDigits()}-${randomDigits()}`;
};

const generateDob = () => {
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = monthNames[Math.floor(Math.random() * 12)];
    const year = String(Math.floor(Math.random() * 30) + 70);
    return `${day}-${month}-${year}`;
};

const generateIntakeId = () => {
    return Date.now().toString().slice(-7) + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
};

const OPERATION_CENTER_CODE = "TAMPA";
const PLAN_LEVEL_CD = "1";

app.post('/api/external-call', async (req: Request, res: Response) => {
  const { apiType, environment, requestBody } = req.body;

  if (!apiType || !environment) {
    return res.status(400).json({ error: 'apiType and environment are required.' });
  }

  if (!API_USER_ID || !API_PASSWORD) {
    return res.status(500).json({ error: 'API_USER_ID or API_PASSWORD not set in environment variables.' });
  }

  let externalApiPath = '';
  switch (apiType) {
    case 'initial':
      externalApiPath = `/cases`;
      break;
    case 'cos':
      externalApiPath = `/cos-path-placeholder`;
      break;
    case 'edit':
      externalApiPath = `/edit-path-placeholder`;
      break;
    default:
      return res.status(400).json({ error: 'Invalid apiType.' });
  }

  const externalApiBaseUrl = getExternalApiBaseUrl(environment as string);
  const externalApiUrl = `${externalApiBaseUrl}${externalApiPath}`;

  try {
    const authHeader = `Basic ${Buffer.from(`${API_USER_ID}:${API_PASSWORD}`).toString('base64')}`;

    const externalApiResponse = await fetch(externalApiUrl, {
      method: 'POST',
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
    }

    if (!externalApiResponse.ok) {
      const errorMessage = (typeof responseData === 'object' && responseData !== null && 'message' in responseData)
        ? responseData.message
        : (typeof responseData === 'string' ? responseData : externalApiResponse.statusText);
      return res.status(externalApiResponse.status).json({
        error: `External API Error: ${externalApiResponse.status} ${externalApiResponse.statusText}`,
        details: errorMessage,
        externalResponse: responseData
      });
    }

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


        const schemaFields = result.metaData?.map((col: oracledb.Metadata<any>, index: number) => {
            let type = 'text';
            if (col.name.toLowerCase().includes('date') || col.name.toLowerCase().includes('dob')) {
                type = 'date';
            } else if (col.name.toLowerCase().includes('phone') || col.name.toLowerCase().includes('zip') || col.name.toLowerCase().includes('id')) {
                type = 'text';
            } else if (col.name.toLowerCase().includes('name')) {
                type = 'names';
            }

            return {
                id: `${index}-${col.name}`,
                type: type,
                propertyName: snakeToCamel(col.name),
                option: "",
                checked: true,
            };
        });

        res.json({
            environment,
            serviceType,
            schema: schemaFields || [],
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch service schema from database.', details: (err as Error).message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err: unknown) {
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
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({
            environment,
            serviceType,
            selectedColumns: selectedColumnNames,
            data: result.rows && result.rows.length > 0 ? result.rows[0] : null,
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to execute service query.', details: (err as Error).message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err: unknown) {
                console.error('Error closing database connection:', err);
            }
        }
    }
});

app.post('/api/create-intake-data', async (req: Request, res: Response) => {
    const { environment, serviceType } = req.body;

    if (!environment || !serviceType) {
        return res.status(400).json({ error: 'environment and serviceType are required.' });
    }

    let connection: oracledb.Connection | undefined;
    try {
        const connectionString = getOracleConnectionString(environment as string);
        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: connectionString
        });

        const MAX_RETRIES = 50;
        let success = false;
        let verificationData: any = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const patientNumber = generatePatientNumber();
            const firstName = generateRandomName('FIRST');
            const lastName = generateRandomName('LAST');
            const phone = generatePhoneNumber();
            const dob = generateDob();
            // Generate a 7-digit intakeId to match the precision of the database column (e.g., 1231231)
            const intakeId = String(Math.floor(Math.random() * 9000000) + 1000000);

            try {
                // Statements are executed individually but commit/rollback is managed manually
                const insertPatientSql = `INSERT INTO TBLPATIENT (PATIENTNUMBER, FIRSTNAME, LASTNAME, PHONE, DOB) VALUES (:1, :2, :3, :4, TO_DATE(:5, 'DD-MON-YY'))`;
                await connection.execute(insertPatientSql, [patientNumber, firstName, lastName, phone, dob], { autoCommit: false });

                const insertIntakePlanSql = `INSERT INTO TBLPATINTAKEPLAN (PATIENTNUMBER, INTAKEID, OPERATIONCENTERCODE, PLANLEVELCD, INSFIRSTNAME, INSLASTNAME, INSPHONE, INSDOB) VALUES (:1, :2, :3, :4, :5, :6, :7, TO_DATE(:8, 'DD-MON-YY'))`;
                await connection.execute(insertIntakePlanSql, [patientNumber, intakeId, OPERATION_CENTER_CODE, PLAN_LEVEL_CD, firstName, lastName, phone, dob], { autoCommit: false });

                const insertIntakeSql = `INSERT INTO TBLPATINTAKE (PATIENTNUMBER, INTAKEID, OPERATIONCENTERCODE) VALUES (:1, :2, :3)`;
                await connection.execute(insertIntakeSql, [patientNumber, intakeId, OPERATION_CENTER_CODE], { autoCommit: false });

                // If all inserts succeed, commit the transaction
                await connection.commit();
                success = true;

                // Verification Step
                const verificationSql = `SELECT * FROM TBLPATINTAKEPLAN WHERE PATIENTNUMBER = :1 AND INSFIRSTNAME = :2`;
                const verifyResult = await connection.execute(verificationSql, [patientNumber, firstName], { outFormat: oracledb.OUT_FORMAT_OBJECT });

                if (verifyResult.rows && verifyResult.rows.length > 0) {
                    verificationData = verifyResult.rows;
                }
                
                break; // Exit the loop on success

            } catch (err: unknown) {
                // Rollback transaction on any error
                if (connection) await connection.rollback();

                // Check if the error is a unique constraint violation (ORA-00001)
                if ((err as oracledb.DBError).errorNum === 1) {
                    console.log(`Attempt ${attempt} failed due to unique constraint violation. Retrying...`);
                    // Continue to the next iteration of the loop
                } else {
                    // If it's another type of error, throw it to be caught by the outer catch block
                    throw err;
                }
            }
        }

        if (success) {
            res.json({
                message: 'Intake data created and verified successfully.',
                data: verificationData,
            });
        } else {
            res.status(500).json({ error: `Failed to create intake data after ${MAX_RETRIES} attempts. The last attempt may have failed due to a unique constraint or another issue.` });
        }

    } catch (err) {
        console.error('Error during intake data creation process:', err);
        res.status(500).json({ error: 'Failed to process intake creation.', details: (err as Error).message });
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

app.post('/api/service-create', async (req: Request, res: Response) => {
    const { environment, serviceType, dataFields } = req.body;

    if (!environment || !serviceType || !dataFields || !Array.isArray(dataFields)) {
        return res.status(400).json({ error: 'environment, serviceType, and dataFields array are required.' });
    }

    let connection;
    try {
        const connectionString = getOracleConnectionString(environment as string);

        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: connectionString
        });

        let patientNumber = '';
        let firstName = '';
        let lastName = '';
        let phone = '';
        let dob = '';
        let intakeId = '';

        const MAX_RETRIES = 5;
        let retryCount = 0;
        let success = false;
        let verificationResult: { PATIENTNUMBER: string; INTAKEID: string; OPERATIONCENTERCODE: string; } | null = null;

        while (retryCount < MAX_RETRIES && !success) {
            patientNumber = generatePatientNumber();
            firstName = generateRandomName('FIRST');
            lastName = generateRandomName('LAST');
            phone = generatePhoneNumber();
            dob = generateDob();
            intakeId = generateIntakeId();

            try {

                const insertPatientSql = `INSERT INTO TBLPATIENT (PATIENTNUMBER, FIRSTNAME, LASTNAME, PHONE, DOB) VALUES (:1, :2, :3, :4, :5)`;
                await connection.execute(insertPatientSql, [patientNumber, firstName, lastName, phone, dob], { autoCommit: false });

                const insertIntakePlanSql = `INSERT INTO TBLPATINTAKEPLAN (PATIENTNUMBER, INTAKEID, OPERATIONCENTERCODE, PLANLEVELCD, INSFIRSTNAME, INSLASNAME, INSPHONE, INSDOB) VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`;
                await connection.execute(insertIntakePlanSql, [patientNumber, intakeId, OPERATION_CENTER_CODE, PLAN_LEVEL_CD, firstName, lastName, phone, dob], { autoCommit: false });

                const insertIntakeSql = `INSERT INTO TBLPATINTAKE (PATIENTNUMBER, INTAKEID, OPERATIONCENTERCODE) VALUES (:1, :2, :3)`;
                await connection.execute(insertIntakeSql, [patientNumber, intakeId, OPERATION_CENTER_CODE], { autoCommit: false });

                await connection.commit();
                success = true;

            } catch (err: unknown) {
                await connection.rollback();
                if ((err as oracledb.DBError).errorNum === 1) {
                    retryCount++;
                } else {
                    throw err;
                }
            }
        }

        if (!success) {
            return res.status(500).json({ error: 'Failed to create intake data after multiple retries due to unique INTAKEID constraint.' });
        }

        const verificationSql = `SELECT PATIENTNUMBER, INTAKEID, OPERATIONCENTERCODE FROM TBLPATINTAKE WHERE PATIENTNUMBER = :1 AND INTAKEID = :2`;
        const verifyResult = await connection.execute(verificationSql, [patientNumber, intakeId], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (verifyResult.rows && verifyResult.rows.length > 0) {
            verificationResult = verifyResult.rows[0] as { PATIENTNUMBER: string; INTAKEID: string; OPERATIONCENTERCODE: string; };
        }

        res.json({
            message: 'Intake data created and verified successfully.',
            data: verificationResult,
        });

    } catch (err: unknown) {
        res.status(500).json({ error: 'Failed to create service data.', details: (err as Error).message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err: unknown) {
            }
        }
    }
});