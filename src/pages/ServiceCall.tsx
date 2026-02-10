import Header from "@/components/Header";
import { useState, useCallback } from "react";
import { Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StepCard from "@/components/StepCard";
import DataRow, { DataField } from "@/components/DataRow";
import DataTypeSelector, { DATA_TYPES } from "@/components/DataTypeSelector";
import { useToast } from "../hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENVIRONMENTS, SERVICE_TYPES } from "@/constants";
import { apiService } from "@/services/apiService";

const DEFAULT_FIELDS: DataField[] = [];

const snakeToCamel = (str: string) => {
  return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const ServiceCall = () => {
    const { toast = {} } = useToast();
    const [fields, setFields] = useState<DataField[]>([]);
    const [queryOutput, setQueryOutput] = useState<Record<string, any>[] | string | null>(null);
    const [newFieldType, setNewFieldType] = useState("names");
    const [environment, setEnvironment] = useState<string>("Q1");
    const [selectedService, setSelectedService] = useState("");
    const [dataType, setDataType] = useState("static");
    const [isLoading, setIsLoading] = useState(false);
    const [operationMode, setOperationMode] = useState<"query" | "create">("query");
    const [isCreateConfirmOpen, setCreateConfirmOpen] = useState(false);

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
        setQueryOutput(null);
        setOperationMode(mode);

        try {
            const result = await apiService.fetchSchema(environment, selectedService);
            
            if (result.schema?.length > 0) {
                setFields(result.schema.map((field: DataField) => ({ ...field, value: field.value || "" })));
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
        setQueryOutput(null);

        try {
            const result = await apiService.executeQuery(environment, selectedService, selectedColumns);

            if (result.data) {
                setQueryOutput([result.data]);
                toast({
                    title: "Query Executed",
                    description: `Data fetched for ${selectedService} from ${environment}.`,
                });
            } else if (result.message) {
                setQueryOutput(result.message);
                toast({
                    title: "No Data Found",
                    description: `No data returned for selected columns in ${selectedService} from ${environment}.`,
                    variant: "destructive",
                });
            } else {
                setQueryOutput("No data found for the selected columns.");
                toast({
                    title: "No Data Found",
                    description: `No data returned for selected columns in ${selectedService} from ${environment}.`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            setQueryOutput(JSON.stringify({ error: (error as Error).message }, null, 2));
            toast({
                title: "Error",
                description: `Failed to execute service query: ${error instanceof Error ? error.message : String(error)}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [environment, selectedService, fields, toast]);

    const handleCreateIntake = useCallback(async () => {
        if (!selectedService) {
            toast({ title: "Service Type Required", description: "Please select a Service Type to create intake data.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setQueryOutput(null);

        try {
            const result = await apiService.createIntakeData(environment, selectedService);

            if (result.data) {
                setQueryOutput([result.data]);
                toast({ title: "Data Creation Successful", description: result.message || `Intake data created and verified in ${environment}.` });
            } else if (result.message) {
                setQueryOutput(result.message);
                toast({ title: "Data Creation Info", description: result.message || "Process finished.", variant: "destructive" });
            } else {
                setQueryOutput("An unknown issue occurred during data creation.");
                toast({ title: "Data Creation Info", description: "Process finished.", variant: "destructive" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setQueryOutput(JSON.stringify({ error: errorMessage }, null, 2));
            toast({ title: "Error", description: `Failed to create intake data: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
            setCreateConfirmOpen(false);
        }
    }, [environment, selectedService, toast]);

    const renderOutput = () => {
        if (!queryOutput) return null;

        const isErrorOrInfoString = typeof queryOutput === 'string';
        const isDataArray = Array.isArray(queryOutput) && queryOutput.length > 0;

        const safeToString = (value: any): string => {
            if (value === null || value === undefined) {
                return '';
            }
            const str = String(value);
            if (str === '[object Object]') {
                try {
                    return JSON.stringify(value);
                } catch {
                    return str;
                }
            }
            return str;
        };

        return (
            <div className="mt-6 p-4 border rounded-lg bg-card-foreground">
                <h3 className="text-xl font-semibold mb-4 text-white">Output</h3>
                {isDataArray ? (() => {
                    const allRows = queryOutput;
                    const allPossibleKeys = Array.from(new Set(
                        allRows.flatMap(row => Object.keys(row))
                    ));
                    
                    const columnsToShow = allPossibleKeys.filter(key =>
                        allRows.some(row => {
                            const value = row[key];
                            if (value === null || value === undefined) return false;
                            const strValue = safeToString(value).trim();
                            return strValue !== '' && strValue.toLowerCase() !== 'null';
                        })
                    );

                    if (columnsToShow.length === 0) {
                        return <p className="text-muted-foreground">Query returned a result, but all columns are empty.</p>;
                    }

                    return (
                        <div className="overflow-x-auto rounded-lg shadow-2xl border border-gray-200">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition-all">
                                        {columnsToShow.map(key => (
                                            <TableHead key={key} className="text-white font-semibold py-4 px-4 text-left">
                                                {key}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {queryOutput.map((row, rowIndex) => (
                                        <TableRow 
                                            key={rowIndex}
                                            className={`${
                                                rowIndex % 2 === 0 
                                                    ? 'bg-gray-50 hover:bg-blue-50' 
                                                    : 'bg-white hover:bg-blue-50'
                                            } transition-colors border-b border-gray-200 last:border-b-0`}
                                        >
                                            {columnsToShow.map(key => (
                                                <TableCell key={`${rowIndex}-${key}`} className="py-3 px-4 text-gray-900 font-medium">
                                                    {safeToString(row[key])}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    );
                })() : (
                    <Textarea
                        value={isErrorOrInfoString ? queryOutput : JSON.stringify(queryOutput, null, 2)}
                        readOnly
                        rows={10}
                        className="bg-background text-foreground font-mono resize-y"
                    />
                )}
            </div>
        );
    };

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
        setQueryOutput(null);

        try {
            const result = await apiService.createData(environment, selectedService, dataToCreate);

            if (result.message) {
                if (result.data) {
                    setQueryOutput([result.data]);
                } else {
                    setQueryOutput(result.message);
                }
                toast({
                    title: "Data Created",
                    description: result.message,
                });
            } else if (result.data) {
                setQueryOutput([result.data]);
                toast({
                    title: "Data Created",
                    description: "Data created successfully.",
                });
            } else {
                setQueryOutput("Data created successfully, but no specific message returned.");
                toast({
                    title: "Data Created",
                    description: "Data created successfully.",
                });
            }
        } catch (error) {
            setQueryOutput(JSON.stringify({ error: (error as Error).message }, null, 2));
            toast({
                title: "Error",
                description: `Failed to create service data: ${error instanceof Error ? error.message : String(error)}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [environment, selectedService, fields, toast]);

    const allChecked = fields.every(f => f.checked);

    return (
        <>
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
                                        {SERVICE_TYPES.map((service) => (
                                            <SelectItem key={service.value} value={service.value}>
                                                {service.label}
                                            </SelectItem>
                                        ))}
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
                        {/* New "Create Intake Data" button for independent flow */}
                        <Button
                            onClick={() => setCreateConfirmOpen(true)}
                            disabled={isLoading || !selectedService}
                            className="w-full bg-green-500 hover:bg-green-600 text-primary-foreground py-2 rounded mt-2"
                        >
                            {isLoading ? "Processing..." : "Create Intake Data"} <Plus className="h-4 w-4 ml-2"/>
                        </Button>
                        {renderOutput()}
                    </div>
                </main>
            </div>
            {/* New AlertDialog for "Create Intake Data" confirmation */}
            <AlertDialog open={isCreateConfirmOpen} onOpenChange={setCreateConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will create a new patient and intake record with randomly generated data in the '{environment}' environment. Do you want to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCreateIntake}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ServiceCall;