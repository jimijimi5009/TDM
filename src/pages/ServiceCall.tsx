import Header from "@/components/Header";
import { useState, useCallback } from "react";
import { Plus, Sparkles, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StepCard from "@/components/StepCard";
import DataRow, { DataField } from "@/components/DataRow"; // Import DataRow and DataField
import DataTypeSelector, { DATA_TYPES } from "@/components/DataTypeSelector"; // Import DataTypeSelector and DATA_TYPES

import { useToast } from "../hooks/use-toast"; // Import useToast
import { Label } from "@/components/ui/label"; // Keep Label
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Keep RadioGroup
import { Textarea } from "@/components/ui/textarea"; // Keep Textarea


const DEFAULT_FIELDS: DataField[] = []; // Re-define if not imported globally

const ENVIRONMENTS = ["Q1", "Q2", "Q3", "Q4", "Q5", "PROD"];

const snakeToCamel = (str: string) => {
  return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const ServiceCall = () => {
    const { toast } = useToast();
    const [fields, setFields] = useState<DataField[]>([]);
    const [dbQueryOutput, setDbQueryOutput] = useState<string | null>(null);
    const [newFieldType, setNewFieldType] = useState("names");
    const [environment, setEnvironment] = useState<string>("Q1");
    const [selectedService, setSelectedService] = useState("");
    const [dataType, setDataType] = useState("static");
    const [isLoading, setIsLoading] = useState(false);
    const [operationMode, setOperationMode] = useState<"query" | "create">("query");

    const handleFetchSchema = useCallback(async (mode: "query" | "create" = "query") => {
        if (!selectedService) {
            toast({
                title: "Service Type Required",
                description: "Please select a Service Type to fetch its schema.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setFields([]);
        setDbQueryOutput(null);
        setOperationMode(mode);

        try {
            const response = await fetch(`/api/service-schema?environment=${environment}&serviceType=${selectedService}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.schema && result.schema.length > 0) {
                const initialFields = result.schema.map((field: DataField) => ({
                    ...field,
                    value: field.value || "",
                }));
                setFields(initialFields);
                toast({
                    title: "Schema Loaded",
                    description: `Schema for ${selectedService} from ${environment} loaded for ${mode} operation.`,
                });
            } else {
                toast({
                    title: "No Schema Found",
                    description: `No schema fields returned for ${selectedService} in ${environment}.`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to fetch service schema:", error);
            toast({
                title: "Error",
                description: `Failed to load service schema: ${error instanceof Error ? error.message : String(error)}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [environment, selectedService, toast]);

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



    const handleExecute = useCallback(async () => {
        if (!selectedService) {
            toast({
                title: "Service Type Required",
                description: "Please select a Service Type to execute the query.",
                variant: "destructive",
            });
            return;
        }

        const selectedColumns = fields.filter(f => f.checked).map(f => f.propertyName);

        if (selectedColumns.length === 0) {
            toast({
                title: "No Columns Selected",
                description: "Please select at least one column to execute the query.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setDbQueryOutput(null);

        try {
            const response = await fetch('/api/service-execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    environment: environment,
                    serviceType: selectedService,
                    selectedColumnNames: selectedColumns,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            

            if (result.data) {
                setDbQueryOutput(JSON.stringify(result.data, null, 2));
                toast({
                    title: "Query Executed",
                    description: `Data fetched for ${selectedService} from ${environment}.`,
                });
            } else {
                setDbQueryOutput("No data found for the selected columns.");
                toast({
                    title: "No Data Found",
                    description: `No data returned for selected columns in ${selectedService} from ${environment}.`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to execute service query:", error);
            setDbQueryOutput(JSON.stringify({ error: (error as Error).message }, null, 2));
            toast({
                title: "Error",
                description: `Failed to execute service query: ${error instanceof Error ? error.message : String(error)}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [environment, selectedService, fields, toast]);

    const allChecked = fields.every(f => f.checked);

    const handleCreate = useCallback(async () => {
        if (!selectedService) {
            toast({
                title: "Service Type Required",
                description: "Please select a Service Type to create data.",
                variant: "destructive",
            });
            return;
        }

        const dataToCreate = fields.filter(f => f.checked).map(f => ({
            propertyName: f.propertyName,
            value: f.value,
            type: f.type,
        }));

        if (dataToCreate.length === 0) {
            toast({
                title: "No Data Selected",
                description: "Please select at least one field and provide values to create data.",
                variant: "destructive",
            });
            return;
        }

        const hasEmptyValues = dataToCreate.some(field => !field.value || String(field.value).trim() === "");
        if (hasEmptyValues) {
            toast({
                title: "Missing Values",
                description: "Please provide a value for all selected fields.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setDbQueryOutput(null);

        try {
            const response = await fetch('/api/service-create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    environment: environment,
                    serviceType: selectedService,
                    dataFields: dataToCreate,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            

            if (result.message) {
                setDbQueryOutput(JSON.stringify(result.data || result.message, null, 2));
                toast({
                    title: "Data Created",
                    description: result.message,
                });
            } else {
                setDbQueryOutput("Data created successfully, but no specific message returned.");
                toast({
                    title: "Data Created",
                    description: "Data created successfully.",
                });
            }
        } catch (error) {
            console.error("Failed to create service data:", error);
            setDbQueryOutput(JSON.stringify({ error: (error as Error).message }, null, 2));
            toast({
                title: "Error",
                description: `Failed to create service data: ${error instanceof Error ? error.message : String(error)}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [environment, selectedService, fields, toast]);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container py-8 max_w_6xl">
                <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
                    Service Call Generator
                </h1>

                <div className="space-y-6">
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
                            <span className="text-sm font-medium text-muted-foreground">Select Service Type</span>
                            <Select value={selectedService} onValueChange={setSelectedService}>
                                <SelectTrigger className="w-[280px] bg-card">
                                    <SelectValue placeholder="Select Service Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="patient-rest-services">Patient Rest Services</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={() => handleFetchSchema("query")} variant="outline" size="sm" disabled={!selectedService}>
                                Fetch Schema <Database className="h-4 w-4 ml-1" />
                            </Button>
                            <Button onClick={() => handleFetchSchema("create")} variant="outline" size="sm" disabled={!selectedService}>
                                Create Data <Plus className="h-4 w-4 ml-1" />
                            </Button>
                        </div>

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
                            <span className="w-[160px]">Actual Data</span>
                            <span className="ml-auto">Actions</span>
                        </div>
                        
                        <div className="space-y-0 mb-4">
                            {fields.map((field, index) => (
                                <DataRow
                                    key={field.id}
                                    field={field}
                                    index={index}
                                    onUpdate={updateField}
                                    onDelete={deleteField}
                                    onDuplicate={duplicateField}
                                    isCreateMode={operationMode === "create"}
                                />
                            ))}
                        </div>
                        
                        {operationMode === "create" && (
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
                        )}
                    </StepCard>



                    {operationMode === "query" && (
                        <Button
                            onClick={handleExecute}
                            disabled={isLoading || !selectedService || fields.filter(f => f.checked).length === 0}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-primary-foreground py-2 rounded mt-2"
                        >
                            {isLoading ? "Executing..." : "Execute"}
                        </Button>
                    )}

                    {operationMode === "create" && (
                        <Button
                            onClick={handleCreate}
                            disabled={isLoading || !selectedService || fields.filter(f => f.checked).length === 0}
                            className="w-full bg-green-500 hover:bg-green-600 text-primary-foreground py-2 rounded mt-2"
                        >
                            {isLoading ? "Creating..." : "Create Data"}
                        </Button>
                    )}

                    {dbQueryOutput && (
                        <div className="mt-6 p-4 border rounded-lg bg-card-foreground">
                            <h3 className="text-xl font-semibold mb-4 text-white">DB Query Output</h3>
                            <Textarea
                                value={dbQueryOutput}
                                readOnly
                                rows={15}
                                placeholder="DB query result will appear here..."
                                className="bg-background text-foreground font-mono resize-y"
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ServiceCall;