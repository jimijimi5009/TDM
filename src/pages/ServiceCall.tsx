import Header from "@/components/Header";
import { useState, useCallback } from "react";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataRow, { DataField } from "@/components/DataRow";
import { useToast } from "../hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENVIRONMENTS, SERVICE_TYPES } from "@/constants";
import { apiService } from "@/services/apiService";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const DEFAULT_FIELDS: DataField[] = [];

const ServiceCall = () => {
    const { toast } = useToast();
    const [fields, setFields] = useState<DataField[]>([]);
    const [queryOutput, setQueryOutput] = useState<Record<string, any>[] | string | null>(null);
    const [environment, setEnvironment] = useState<string>("Q1");
    const [selectedService, setSelectedService] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleFetchQuerySchema = useCallback(async () => {
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

        try {
            const result = await apiService.fetchSchema(environment, selectedService, "query");
            
            if (result.schema?.length > 0) {
                setFields(result.schema.map((field: DataField) => ({ ...field, value: field.value || "" })));
                toast({
                    title: "Schema Loaded",
                    description: `Query schema for ${selectedService} from ${environment} loaded.`,
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

        // Build filter object from non-empty values
        const filters: Record<string, string> = {};
        fields.forEach(field => {
            if (field.value && String(field.value).trim() !== "") {
                filters[field.propertyName] = field.value;
            }
        });

        setIsLoading(true);
        setQueryOutput(null);

        try {
            const result = await apiService.executeQuery(environment, selectedService, selectedColumns, filters);

            if (result.data) {
                const dataToSet = Array.isArray(result.data) ? result.data : [result.data];
                setQueryOutput(dataToSet);
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
                    
                    const columnsToShow = allPossibleKeys.filter(key => {
                        return allRows.some(row => {
                            const value = row[key];
                            if (value === null || value === undefined) return false;
                            const strValue = safeToString(value).trim();
                            if (!strValue || strValue === '' || strValue.toLowerCase() === 'null') return false;
                            return true;
                        });
                    });

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

    const renderIntakeOutput = () => {
        if (!intakeOutput) return null;

        const isErrorOrInfoString = typeof intakeOutput === 'string';
        const isDataArray = Array.isArray(intakeOutput) && intakeOutput.length > 0;

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
                <h3 className="text-xl font-semibold mb-4 text-white">Intake Output</h3>
                {isDataArray ? (() => {
                    const allRows = intakeOutput;
                    const allPossibleKeys = Array.from(new Set(
                        allRows.flatMap(row => Object.keys(row))
                    ));
                    
                    const columnsToShow = allPossibleKeys.filter(key => {
                        return allRows.some(row => {
                            const value = row[key];
                            if (value === null || value === undefined) return false;
                            const strValue = safeToString(value).trim();
                            if (!strValue || strValue === '' || strValue.toLowerCase() === 'null') return false;
                            return true;
                        });
                    });

                    if (columnsToShow.length === 0) {
                        return <p className="text-muted-foreground">Query returned a result, but all columns are empty.</p>;
                    }

                    return (
                        <div className="overflow-x-auto rounded-lg shadow-2xl border border-gray-200">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 transition-all">
                                        {columnsToShow.map(key => (
                                            <TableHead key={key} className="text-white font-semibold py-4 px-4 text-left">
                                                {key}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {intakeOutput.map((row, rowIndex) => (
                                        <TableRow 
                                            key={rowIndex}
                                            className={`${
                                                rowIndex % 2 === 0 
                                                    ? 'bg-gray-50 hover:bg-green-50' 
                                                    : 'bg-white hover:bg-green-50'
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
                        value={isErrorOrInfoString ? intakeOutput : JSON.stringify(intakeOutput, null, 2)}
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
                    const dataToSet = Array.isArray(result.data) ? result.data : [result.data];
                    setQueryOutput(dataToSet);
                } else {
                    setQueryOutput(result.message);
                }
                toast({
                    title: "Data Created",
                    description: result.message,
                });
            } else if (result.data) {
                const dataToSet = Array.isArray(result.data) ? result.data : [result.data];
                setQueryOutput(dataToSet);
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
                        Execute Query
                    </h1>

                    <div className="space-y-6">
                        {/* Environment and Service Type Selection */}
                        <Card className="shadow-card border-border/50 overflow-hidden">
                            <CardHeader className="pb-4">
                                <h2 className="text-lg font-semibold text-foreground">Select Environment and Service</h2>
                            </CardHeader>
                            <CardContent>
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
                                </div>
                            </CardContent>
                        </Card>

                        {/* QUERY SECTION */}
                        <Card className="shadow-card border-border/50 overflow-hidden">
                            <CardHeader className="pb-4">
                                <h2 className="text-lg font-semibold text-foreground">Execute Query</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mb-4">
                                    <Button onClick={handleFetchQuerySchema} variant="outline" size="sm" disabled={!selectedService || isLoading}>
                                        Fetch Schema <Database className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-4 px-4 py-3 rounded-t-lg bg-table-header text-table-header-text text-sm font-medium mb-2">
                                    <div className="w-4" />
                                    <Checkbox
                                        checked={fields.every(f => f.checked)}
                                        onCheckedChange={toggleAll}
                                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <span className="w-8">All</span>
                                    <span className="w-[180px]">Data Type</span>
                                    <span className="w-[140px]">Property Name</span>
                                    <span className="w-[160px]">Actual Data</span>
                                    <span className="ml-auto">Actions</span>
                                </div>
                                
                                <div className="text-xs text-muted-foreground px-4 mb-2">
                                    Select columns to use in your query. Use filters to narrow results.
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
                                            isCreateMode={false}
                                            isIntakeMode={false}
                                        />
                                    ))}
                                </div>

                                <Button
                                    onClick={handleExecute}
                                    disabled={isLoading || !selectedService || fields.filter(f => f.checked).length === 0}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-primary-foreground py-2 rounded mt-2"
                                >
                                    {isLoading ? "Executing..." : "Execute"}
                                </Button>

                                {renderOutput()}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </>
    );
};

export default ServiceCall;