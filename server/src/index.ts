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
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const ORACLE_CONFIG: Record<string, { hostName: string; host: string }> = {
    Q1: { hostName: "ccxqat_adhoc", host: "qa1dbccx-scan" },
    Q2: { hostName: "ccxsup_adhoc", host: "qa2dbccx-scan.ccx.carecentrix.com" },
    Q3: { hostName: "qa3.legacy.adhoc", host: "qdborarac-scan" },
    Q4: { hostName: "ccxprf_provportal", host: "ccxq4host.ccx.carecentrix.com" },
    Q5: { hostName: "qa5.legacy.adhoc", host: "qdborarac-scan" },
    PROD: { hostName: "ccxp_adhoc", host: "ccxphost.ccx.carecentrix.com" },
};

const OPERATION_CENTER_CODE = "TAMPA";
const PLAN_LEVEL_CD = "1";
const FIXED_PLAN_ID = "16706";
const FIXED_INS_PAT_ID = "TESTTEST05";
const MAX_RETRIES = 50;

let oraclePool: oracledb.Pool | null = null;

const initializePool = async () => {
    if (!oraclePool) {
        oraclePool = await oracledb.createPool({
            user: DB_USER,
            password: DB_PASSWORD,
            connectString: '',
            poolMin: 2,
            poolMax: 10,
        });
    }
    return oraclePool;
};

const getExternalApiBaseUrl = (env: string): string => {
    const envPrefix = env.toLowerCase();
    return `https://${envPrefix}-${EXTERNAL_API_DOMAIN_CORE}`;
};

const getOracleConnectionString = (env: string): string => {
    const config = ORACLE_CONFIG[env.toUpperCase()];
    if (!config) {
        console.error("Unable to get configuration for Oracle environment:", env);
        return "Invalid Environment";
    }
    const { hostName, host } = config;
    return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${host})(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=${hostName})))`;
};

const executeWithConnection = async <T>(
    callback: (connection: oracledb.Connection) => Promise<T>,
    environment: string
): Promise<T> => {
    let connection: oracledb.Connection | undefined;
    try {
        const connectionString = getOracleConnectionString(environment);
        connection = await oracledb.getConnection({
            user: DB_USER,
            password: DB_PASSWORD,
            connectString: connectionString
        });
        return await callback(connection);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }
};

const errorResponse = (res: Response, statusCode: number, error: string, details?: string) => {
    res.status(statusCode).json({
        error,
        ...(details && { details })
    });
};

app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running!');
});

app.get('/api/schema', async (req: Request, res: Response) => {
  const { environment, tableName } = req.query;

  if (!environment || !tableName) {
    return errorResponse(res, 400, 'environment and tableName query parameters are required.');
  }

  try {
    const result = await executeWithConnection(async (connection) => {
      return await connection.execute(
        `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE
         FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = :tableName`,
        [(tableName as string).toUpperCase()],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
    }, environment as string);

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
        is_nullable: row.NULLABLE === 'Y'
    }));

    res.json({
      environment,
      tableName,
      schema: schema || [],
    });

  } catch (err) {
    errorResponse(res, 500, 'Failed to fetch schema from database.', (err as Error).message);
  }
});

const serializeOracleRow = (row: any): Record<string, any> => {
  if (row === null || row === undefined) return row;
  
  const serialized: Record<string, any> = {};
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  
  for (const key in row) {
    const value = row[key];
    if (value === null || value === undefined) {
      serialized[key] = value;
    } else if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = monthNames[value.getMonth()];
      const year = String(value.getFullYear()).slice(-2);
      serialized[key] = `${day}-${month}-${year}`;
    } else if (typeof value === 'object') {
      const constructorName = value.constructor?.name.toLowerCase();
      if (constructorName?.includes('lob') || constructorName?.includes('cursor')) {
        serialized[key] = String(value);
      } else if (Buffer && value instanceof Buffer) {
        serialized[key] = value.toString('utf-8');
      } else {
        try {
          serialized[key] = String(value).includes('[object') ? JSON.stringify(value) : String(value);
        } catch {
          serialized[key] = String(value);
        }
      }
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
};

const snakeToCamel = (str: string) => str.toLowerCase().replace(/_([a-z])/g, (_, l) => l.toUpperCase());

const generateRandom = (length: number): string => Array(length).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
const generatePatientNumber = () => generateRandom(10);
const generateZipCode = () => generateRandom(5);
const generateSubscriberId = () => generateRandom(10);
const generateIntakeId = () => Date.now().toString().slice(-7) + generateRandom(4);

const generateRandomName = (prefix: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = prefix;
    for (let i = 0; i < 5; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};

const generatePhoneNumber = (): string => {
    const randomDigits = () => generateRandom(3);
    return `(${randomDigits()}) ${randomDigits()}-${randomDigits()}`;
};

const generateDob = (): string => {
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const month = monthNames[Math.floor(Math.random() * 12)];
    const year = String(Math.floor(Math.random() * 30) + 70);
    return `${day}-${month}-${year}`;
};

const getColumnType = (columnName: string): string => {
    const lowerName = columnName.toLowerCase();
    if (lowerName.includes('date') || lowerName.includes('dob')) return 'date';
    if (lowerName.includes('name')) return 'names';
    return 'text';
};

const PATIENT_DATA_QUERY = `
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

const PATIENT_DATA_FROM_CLAUSE = `
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

const API_PATHS: Record<string, string> = {
    initial: '/cases',
    cos: '/cos-path-placeholder',
    edit: '/edit-path-placeholder',
};

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

app.post('/api/external-call', async (req: Request, res: Response) => {
  const { apiType, environment, requestBody } = req.body;

  if (!apiType || !environment) {
    return errorResponse(res, 400, 'apiType and environment are required.');
  }

  if (!API_USER_ID || !API_PASSWORD) {
    return errorResponse(res, 500, 'API_USER_ID or API_PASSWORD not set in environment variables.');
  }

  const externalApiPath = API_PATHS[apiType];
  if (!externalApiPath) {
    return errorResponse(res, 400, 'Invalid apiType.');
  }

  const externalApiUrl = `${getExternalApiBaseUrl(environment)}${externalApiPath}`;

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

    const contentType = externalApiResponse.headers.get('content-type');
    const responseData = contentType?.includes('application/json')
      ? await externalApiResponse.json()
      : await externalApiResponse.text();

    if (!externalApiResponse.ok) {
      const errorMessage = (typeof responseData === 'object' && responseData && 'message' in responseData)
        ? (responseData as any).message
        : externalApiResponse.statusText;
      return errorResponse(res, externalApiResponse.status, `External API Error: ${externalApiResponse.status}`, errorMessage);
    }

    res.json(responseData);

  } catch (error) {
    errorResponse(res, 500, 'Failed to proxy external API call.', (error as Error).message);
  }
});

app.get('/api/service-schema', async (req: Request, res: Response) => {
    const { environment, serviceType } = req.query;

    if (!environment || !serviceType) {
        return errorResponse(res, 400, 'environment and serviceType query parameters are required.');
    }

    try {
        const result = await executeWithConnection(async (connection) => {
            return await connection.execute(PATIENT_DATA_QUERY, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        }, environment as string);

        const schemaFields = result.metaData?.map((col: oracledb.Metadata<any>, index: number) => ({
            id: `${index}-${col.name}`,
            type: getColumnType(col.name),
            propertyName: snakeToCamel(col.name),
            option: "",
            checked: true,
        }));

        res.json({
            environment,
            serviceType,
            schema: schemaFields || [],
        });

    } catch (err) {
        errorResponse(res, 500, 'Failed to fetch service schema from database.', (err as Error).message);
    }
});

app.post('/api/service-execute', async (req: Request, res: Response) => {
    const { environment, serviceType, selectedColumnNames, filters = {} } = req.body;

    if (!environment || !serviceType || !selectedColumnNames?.length) {
        return errorResponse(res, 400, 'environment, serviceType, and selectedColumnNames array are required.');
    }

    try {
        const selectClause = selectedColumnNames.join(', ');
        
        // Build WHERE clause from filters
        let filterClauses: string[] = [];
        let bindParams: any[] = [];
        let paramIndex = 1;

        // Add filter conditions
        Object.entries(filters).forEach(([columnName, value]) => {
            if (value && String(value).trim() !== '') {
                filterClauses.push(`${columnName} = :${paramIndex}`);
                bindParams.push(value);
                paramIndex++;
            }
        });

        // Build the complete query with base WHERE clause and filter conditions
        let fullSqlQuery = `SELECT ${selectClause} FROM TBLPATIENT tp
JOIN TBLPATINTAKEPLAN tpip
ON tp.PATIENTNUMBER = tpip.PATIENTNUMBER
WHERE tp.ZIP IS NOT NULL
AND tp.DOB IS NOT NULL
AND tp.FIRSTNAME IS NOT NULL
AND tp.LASTNAME IS NOT NULL
AND tpip.INSPHONE IS NOT NULL
AND tpip.SUBSCRIBERID IS NOT NULL`;

        // Add filter conditions if any
        if (filterClauses.length > 0) {
            fullSqlQuery += ` AND ${filterClauses.join(' AND ')}`;
        }

        fullSqlQuery += ` ORDER BY tp.DOB DESC FETCH FIRST 1 ROW ONLY`;

        const result = await executeWithConnection(async (connection) => {
            return await connection.execute(fullSqlQuery, bindParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        }, environment);

        res.json({
            environment,
            serviceType,
            selectedColumns: selectedColumnNames,
            filters: Object.fromEntries(Object.entries(filters).filter(([_, v]) => v && String(v).trim() !== '')),
            data: result.rows && result.rows.length > 0 ? serializeOracleRow(result.rows[0]) : null,
        });

    } catch (err) {
        errorResponse(res, 500, 'Failed to execute service query.', (err as Error).message);
    }
});

const createIntakeDataWithRetry = async (
    connection: oracledb.Connection,
    maxRetries: number = MAX_RETRIES
): Promise<{ success: boolean; verificationData: any }> => {
    let success = false;
    let verificationData: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const patientNumber = generatePatientNumber();
            const firstName = generateRandomName('FIRST');
            const lastName = generateRandomName('LAST');
            const phone = generatePhoneNumber();
            const dob = generateDob();
            const intakeId = String(Math.floor(Math.random() * 9000000) + 1000000);

            await connection.execute(
                `INSERT INTO TBLPATINTAKE (PATIENTNUMBER, INTAKEID, OPERATIONCENTERCODE) VALUES (:1, :2, :3)`,
                [patientNumber, intakeId, OPERATION_CENTER_CODE],
                { autoCommit: true }
            );

            await connection.execute(
                `INSERT INTO TBLPATINTAKEPLAN (PATIENTNUMBER, INTAKEID, OPERATIONCENTERCODE, PLANLEVELCD, INSFIRSTNAME, INSLASTNAME, INSPHONE, INSDOB, PLANID, INSPATID) VALUES (:1, :2, :3, :4, :5, :6, :7, TO_DATE(:8, 'DD-MON-YY'), :9, :10)`,
                [patientNumber, intakeId, OPERATION_CENTER_CODE, PLAN_LEVEL_CD, firstName, lastName, phone, dob, FIXED_PLAN_ID, FIXED_INS_PAT_ID],
                { autoCommit: true }
            );

            await connection.execute(
                `INSERT INTO TBLPATIENT (PATIENTNUMBER, FIRSTNAME, LASTNAME, PHONE, DOB) VALUES (:1, :2, :3, :4, TO_DATE(:5, 'DD-MON-YY'))`,
                [patientNumber, firstName, lastName, phone, dob],
                { autoCommit: true }
            );

            const verifyResult = await connection.execute(
                `SELECT * FROM TBLPATINTAKEPLAN WHERE PATIENTNUMBER = :1 AND INSFIRSTNAME = :2`,
                [patientNumber, firstName],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            verificationData = verifyResult.rows?.map(row => serializeOracleRow(row)) || null;
            success = true;
            break;

        } catch (err: unknown) {
            if ((err as oracledb.DBError).errorNum === 1) {
                console.log(`Attempt ${attempt}/${maxRetries} failed due to constraint violation.`);
                if (attempt === maxRetries) throw err;
            } else {
                throw err;
            }
        }
    }

    return { success, verificationData };
};

app.post('/api/create-intake-data', async (req: Request, res: Response) => {
    const { environment, serviceType } = req.body;

    if (!environment || !serviceType) {
        return errorResponse(res, 400, 'environment and serviceType are required.');
    }

    try {
        const result = await executeWithConnection(async (connection) => {
            return await createIntakeDataWithRetry(connection);
        }, environment);

        if (result.success) {
            res.json({
                message: 'Intake data created and verified successfully.',
                data: result.verificationData,
            });
        } else {
            errorResponse(res, 500, `Failed to create intake data after ${MAX_RETRIES} attempts.`);
        }

    } catch (err) {
        errorResponse(res, 500, 'Failed to process intake creation.', (err as Error).message);
    }
});

app.post('/api/service-create', async (req: Request, res: Response) => {
    const { environment, serviceType, dataFields } = req.body;

    if (!environment || !serviceType || !dataFields?.length) {
        return errorResponse(res, 400, 'environment, serviceType, and dataFields array are required.');
    }

    try {
        const result = await executeWithConnection(async (connection) => {
            return await createIntakeDataWithRetry(connection, 5);
        }, environment);

        if (result.success) {
            res.json({
                message: 'Intake data created and verified successfully.',
                data: result.verificationData,
            });
        } else {
            errorResponse(res, 500, 'Failed to create intake data after multiple retries.');
        }

    } catch (err) {
        errorResponse(res, 500, 'Failed to create service data.', (err as Error).message);
    }
});