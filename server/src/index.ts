import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running!');
});

// Mock schema data for tblpatintakeplan
const mockTblPatIntakePlanSchema = [
  { column_name: "PATIENT_ID", data_type: "number" },
  { column_name: "PLAN_NAME", data_type: "text" },
  { column_name: "INTAKE_DATE", data_type: "date" },
  { column_name: "STATUS", data_type: "text" },
  { column_name: "CASE_MANAGER", data_type: "names" },
  { column_name: "LAST_UPDATED", data_type: "date" },
];

app.get('/api/schema', (req: Request, res: Response) => {
  const { environment, tableName } = req.query;

  if (tableName === 'tblpatintakeplan') {
    res.json({
      environment,
      tableName,
      schema: mockTblPatIntakePlanSchema,
      message: `Mock schema for ${tableName} in ${environment} environment.`
    });
  } else {
    res.status(404).json({ error: 'Table not found in mock data.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
