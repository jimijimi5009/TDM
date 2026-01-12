import { useState, useCallback } from "react";
import { Plus, Sparkles, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import StepCard from "@/components/StepCard";
import DataRow, { DataField } from "@/components/DataRow";
import FormatSelector from "@/components/FormatSelector";
import GeneratedOutput from "@/components/GeneratedOutput";
import DataTypeSelector, { DATA_TYPES } from "@/components/DataTypeSelector";
import { generateData } from "@/lib/dataGenerator";
import { useToast } from "../hooks/use-toast"; // Add this import

const DEFAULT_FIELDS: DataField[] = [];

const ENVIRONMENTS = ["Q1", "Q2", "Q3", "Q4", "Q5", "PROD"];

const snakeToCamel = (str: string) => {
  return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const Index = () => {
  const { toast } = useToast(); // Initialize useToast
  const [fields, setFields] = useState<DataField[]>([]);
  const [format, setFormat] = useState("json");
  const [rowCount, setRowCount] = useState(10);
  const [generatedData, setGeneratedData] = useState<string | null>(null);
  const [newFieldType, setNewFieldType] = useState("names");
  const [environment, setEnvironment] = useState<string>("Q1"); // New state for environment

  const getOracleConnectionString = useCallback((env: string) => {
    let hostName: string | null = null;
    switch (env.toUpperCase()) {
      case "Q1":
        hostName = "ccxqat_adhoc";
        break;
      case "Q2":
        hostName = "ccxsup_adhoc";
        break;
      case "Q3":
        hostName = "qa3.legacy.adhoc";
        break;
      case "Q4":
        hostName = "ccxprf_provportal";
        break;
      case "Q5":
        hostName = "qa5.legacy.adhoc";
        break;
      case "PROD":
        hostName = "ccxp_adhoc";
        break;
      default:
        console.error("Unable to get the hostname for Oracle");
        return "Invalid Environment";
    }

    if (env.toUpperCase() === "Q1") {
      return "jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=qa1dbccx-scan)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=" + hostName + ")))";
    } else if (env.toUpperCase() === "Q2") {
      return "jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=qa2dbccx-scan.ccx.carecentrix.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=" + hostName + ")))";
    } else if (env.toUpperCase() === "Q4") {
      return "jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=ccxq4host.ccx.carecentrix.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=" + hostName + ")))";
    } else if (env.toUpperCase() === "PROD") {
      return "jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=ccxphost.ccx.carecentrix.com)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=" + hostName + ")))";
    } else {
      return "jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=qdborarac-scan)(PORT=1521)))(CONNECT_DATA=(SERVICE_NAME=" + hostName + ")(GLOBAL_NAME=" + hostName + ")))";
    }
  }, []);

  const handleFetchSchema = useCallback(async () => {
    try {
      const connectionString = getOracleConnectionString(environment);
      console.log("Simulated Connection String for Debug:", connectionString); // For demonstration

      // Call the backend API to get the schema
      const response = await fetch(`/api/schema?environment=${environment}&tableName=tblpatintakeplan`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Backend schema response:", result);

      const newFields: DataField[] = result.schema.map((col: { column_name: string; data_type: string; }, index: number) => ({
        id: `${Date.now()}-${index}`,
        type: col.data_type.toLowerCase() === 'number' ? 'number' : 'text', // Simple mapping for now
        propertyName: snakeToCamel(col.column_name),
        option: "",
        checked: true,
      }));
      setFields(newFields);
      toast({
        title: "Schema Loaded",
        description: `Schema for ${result.tableName} from ${result.environment} loaded.`,
      });
    } catch (error) {
      console.error("Failed to fetch schema:", error);
      toast({
        title: "Error",
        description: `Failed to load schema: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  }, [environment, getOracleConnectionString, toast]); // Add getOracleConnectionString to dependencies

  const updateField = useCallback((id: string, updates: Partial<DataField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const deleteField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);

  const duplicateField = useCallback((id: string) => {
    setFields(prev => {
      const field = prev.find(f => f.id === id);
      if (!field) return prev;
      const newField = { ...field, id: Date.now().toString() };
      const index = prev.findIndex(f => f.id === id);
      return [...prev.slice(0, index + 1), newField, ...prev.slice(index + 1)];
    });
  }, []);

  const addField = useCallback(() => {
    const newField: DataField = {
      id: Date.now().toString(),
      type: newFieldType,
      propertyName: newFieldType,
      option: "",
      checked: true,
      value: "",
    };
    setFields(prev => [...prev, newField]);
  }, [newFieldType]);

  const toggleAll = useCallback((checked: boolean) => {
    setFields(prev => prev.map(f => ({ ...f, checked })));
  }, []);

  const handleGenerate = useCallback(() => {
    const data = generateData(fields, rowCount, format);
    setGeneratedData(data);
  }, [fields, rowCount, format]);

  const allChecked = fields.every(f => f.checked);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
          Advanced Test Data Generator
        </h1>
        
        <div className="space-y-6">
          {/* Step 1: Data Types */}
          <StepCard step={1} title="Choose the types of data you want">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-muted-foreground">Select Environment</span>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger className="w-[180px] bg-card">
                  <SelectValue placeholder="Select Environment" />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENTS.map((env) => (
                    <SelectItem key={env} value={env}>
                      {env}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleFetchSchema} variant="outline" size="sm">
                Fetch Schema <Database className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Table Header */}
            <div className="flex items-center gap-4 px-4 py-3 rounded-t-lg bg-table-header text-table-header-text text-sm font-medium mb-2">
              <div className="w-4" />
              <Checkbox
                checked={allChecked}
                onCheckedChange={toggleAll}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="w-8">All</span>
              <span className="w-[180px]">Data Type</span>
              <span className="w-[140px]">Property Name</span>
              <span className="w-[160px]">Options</span>
              <span className="w-[160px]">Actual Data</span>
              <span className="ml-auto">Actions</span>
            </div>
            
            {/* Data Rows */}
            <div className="space-y-0 mb-4">
              {fields.map((field, index) => (
                <DataRow
                  key={field.id}
                  field={field}
                  index={index}
                  onUpdate={updateField}
                  onDelete={deleteField}
                  onDuplicate={duplicateField}
                />
              ))}
            </div>
            
            {/* Add More */}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <span className="text-sm font-medium text-muted-foreground">Add More</span>
              <Select value={newFieldType} onValueChange={setNewFieldType}>
                <SelectTrigger className="w-[180px] bg-card">
                  <SelectValue placeholder="Select Data Type" />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addField} variant="outline" size="sm">
                Add <Plus className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </StepCard>

          {/* Step 2: Format */}
          <StepCard step={2} title="Choose Data format">
            <FormatSelector value={format} onChange={setFormat} />
          </StepCard>

          {/* Step 3: Row Count */}
          <StepCard step={3} title="Number of Rows">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={rowCount}
                onChange={(e) => setRowCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                className="w-24 bg-card"
                min={1}
                max={1000}
              />
              <Button onClick={handleGenerate} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </StepCard>

          {/* Generated Output */}
          {generatedData && (
            <GeneratedOutput data={generatedData} format={format} />
          )}
        </div>
      </main>
      
      <footer className="border-t border-border py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>TestDataMangement - Generate realistic test data for your projects</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
