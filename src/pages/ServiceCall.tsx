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
import { useLocation, useNavigate } from "react-router-dom";

const DEFAULT_FIELDS: DataField[] = [];

const snakeToCamel = (str: string) => {
  return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const ServiceCall = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const isServiceCallPage = location.pathname === "/service-call";
    const [fields, setFields] = useState<DataField[]>([]);
    const [intakeFields, setIntakeFields] = useState<DataField[]>([]);
    const [queryOutput, setQueryOutput] = useState<Record<string, any>[] | string | null>(null);
    const [intakeOutput, setIntakeOutput] = useState<Record<string, any>[] | string | null>(null);
    const [newFieldType, setNewFieldType] = useState("names");
    const [environment, setEnvironment] = useState<string>("Q1");
    const [selectedService, setSelectedService] = useState("");
    const [dataType, setDataType] = useState("static");
    const [isLoading, setIsLoading] = useState(false);
    const [isIntakeLoading, setIsIntakeLoading] = useState(false);
    const [isCreateConfirmOpen, setCreateConfirmOpen] = useState(false);

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

    const handleFetchIntakeSchema = useCallback(async () => {
        if (!selectedService) {
            toast({
                title: "Service Type Required",
                description: "Please select a Service Type to fetch its schema.",
                variant: "destructive",
            });
            return;
        }

        setIsIntakeLoading(true);
        setIntakeFields([]);
        setIntakeOutput(null);

        try {
            const result = await apiService.fetchSchema(environment, selectedService, "create-intake");
            
            if (result.schema?.length > 0) {
                setIntakeFields(result.schema.map((field: DataField) => ({ ...field, value: field.value || "" })));
                toast({
                    title: "Schema Loaded",
                    description: `Intake schema for ${selectedService} from ${environment} loaded.`,
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
            setIsIntakeLoading(false);
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

    const updateIntakeField = useCallback((id: string, updates: Partial<DataField>) => {
      setIntakeFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    }, []);

    const deleteIntakeField = useCallback((id: string) => {
      setIntakeFields(prev => prev.filter(f => f.id !== id));
    }, []);

    const duplicateIntakeField = useCallback((id: string) => {
      setIntakeFields(prev => {
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

    const toggleAllIntake = useCallback((checked: boolean) => {
      setIntakeFields(prev => prev.map(f => ({ ...f, checked })));
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

    const handleCreateIntake = useCallback(async () => {
        if (!selectedService) {
            toast({ title: "Service Type Required", description: "Please select a Service Type to create intake data.", variant: "destructive" });
            return;
        }

        setIsIntakeLoading(true);
        setIntakeOutput(null);

        try {
            // Build dataFields object from fields - include empty values as fallback for random generation
            const dataFields: Record<string, any>[] = [];
            intakeFields.filter(f => f.checked).forEach(field => {
                dataFields.push({
                    [field.propertyName]: field.value || "",
                });
            });

            const result = await apiService.createIntakeData(
                environment,
                selectedService,
                dataFields.length > 0 ? dataFields : undefined
            );

            if (result.data) {
                const dataToSet = Array.isArray(result.data) ? result.data : [result.data];
                setIntakeOutput(dataToSet);
                toast({ title: "Data Creation Successful", description: result.message || `Intake data created and verified in ${environment}.` });
            } else if (result.message) {
                setIntakeOutput(result.message);
                toast({ title: "Data Creation Info", description: result.message || "Process finished.", variant: "destructive" });
            } else {
                setIntakeOutput("An unknown issue occurred during data creation.");
                toast({ title: "Data Creation Info", description: "Process finished.", variant: "destructive" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setIntakeOutput(JSON.stringify({ error: errorMessage }, null, 2));
            toast({ title: "Error", description: `Failed to create intake data: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsIntakeLoading(false);
            setCreateConfirmOpen(false);
        }
    }, [environment, selectedService, intakeFields, toast]);

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
            <div className="min-h-screen bg-slate-50">
                <main className="max-w-6xl mx-auto px-6 py-8">
                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mb-8 bg-white rounded-lg p-1 shadow-sm">
                        <button 
                            onClick={() => navigate("/")} 
                            className={`px-6 py-2 rounded-lg font-medium transition-all ${location.pathname === "/" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                            Test Data
                        </button>
                        <button 
                            onClick={() => navigate("/api-call")} 
                            className={`px-6 py-2 rounded-lg font-medium transition-all ${location.pathname === "/api-call" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                            API Call
                        </button>
                        <button 
                            onClick={() => navigate("/service-call")} 
                            className={`px-6 py-2 rounded-lg font-medium transition-all ${location.pathname === "/service-call" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                        >
                            Service Call
                        </button>
                    </div>

                    {/* Header Section */}
                    <div className="bg-white rounded-xl p-8 shadow-sm border-l-4 border-blue-600 mb-8">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                                ⚙️
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900">
                                Service Call Generator
                            </h1>
                        </div>
                        <p className="text-slate-600 text-sm">Generate and manage test data for Patient Rest Services</p>
                    </div>

                    <div className="space-y-6">
                        {/* Environment and Service Type Selection */}
                        <div className="bg-white rounded-xl p-8 shadow-md border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Select Environment and Service</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Environment</label>
                                    <Select value={environment} onValueChange={setEnvironment}>
                                        <SelectTrigger className="w-full bg-white border-2 border-slate-200">
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
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Service Type</label>
                                    <Select value={selectedService} onValueChange={setSelectedService}>
                                        <SelectTrigger className="w-full bg-white border-2 border-slate-200">
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
                            </div>
                        </div>

                        {/* QUERY SECTION */}
                        <div className="bg-white rounded-xl p-8 shadow-md border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Retrieve Record</h2>
                            
                            <div className="mb-6">
                                <Button 
                                    onClick={handleFetchQuerySchema} 
                                    disabled={!selectedService || isLoading}
                                    variant="default"
                                    className="bg-slate-700 hover:bg-slate-800 text-white"
                                >
                                    📋 Fetch Schema
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg mb-4 text-sm text-slate-600">
                                <span>ℹ️</span>
                                Select columns to use in your query. Use filters to narrow results.
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4">
                                <table className="w-full">
                                    <thead className="bg-white border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 w-12">
                                                <Checkbox
                                                    checked={fields.every(f => f.checked)}
                                                    onCheckedChange={toggleAll}
                                                    className="data-[state=checked]:bg-blue-600"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Name</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Type</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {fields.length > 0 ? (
                                            fields.map((field, index) => (
                                                <tr key={field.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <Checkbox
                                                            checked={field.checked}
                                                            onCheckedChange={(checked) => updateField(field.id, { checked: checked === true })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">{field.propertyName}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-700">{field.type}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex gap-2">
                                                            <button className="text-blue-600 hover:text-blue-800" onClick={() => duplicateField(field.id)}>📋</button>
                                                            <button className="text-red-600 hover:text-red-800" onClick={() => deleteField(field.id)}>🗑️</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                                    <div className="text-3xl mb-2">📊</div>
                                                    Click "Fetch Schema" to load available fields
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <Button
                                onClick={handleExecute}
                                disabled={isLoading || !selectedService || fields.filter(f => f.checked).length === 0}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium mt-4"
                            >
                                🔍 {isLoading ? "Searching..." : "Search Records"}
                            </Button>

                            {renderOutput()}
                        </div>

                        {/* CREATE INTAKE SECTION */}
                        <div className="bg-white rounded-xl p-8 shadow-md border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Create Data</h2>
                            
                            <div className="mb-6">
                                <Button 
                                    onClick={handleFetchIntakeSchema} 
                                    disabled={!selectedService || isIntakeLoading}
                                    variant="default"
                                    className="bg-slate-700 hover:bg-slate-800 text-white"
                                >
                                    📋 Fetch Schema
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg mb-4 text-sm text-slate-600">
                                <span>ℹ️</span>
                                Enter values for the fields you want to customize. Empty fields will use random data.
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4">
                                <table className="w-full">
                                    <thead className="bg-white border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Column Name</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Value</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {intakeFields.length > 0 ? (
                                            intakeFields.map((field, index) => (
                                                <tr key={field.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-sm text-slate-700">{field.propertyName}</td>
                                                    <td className="px-4 py-3 text-sm"><Input value={field.value} onChange={(e) => updateIntakeField(field.id, { value: e.target.value })} placeholder="Optional" className="w-full max-w-xs" /></td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <div className="flex gap-2">
                                                            <button className="text-blue-600 hover:text-blue-800" onClick={() => duplicateIntakeField(field.id)}>📋</button>
                                                            <button className="text-red-600 hover:text-red-800" onClick={() => deleteIntakeField(field.id)}>🗑️</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                                                    <div className="text-3xl mb-2">✏️</div>
                                                    Click "Fetch Schema" to load available fields
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <Button
                                onClick={() => setCreateConfirmOpen(true)}
                                disabled={isIntakeLoading || !selectedService}
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium mt-4"
                            >
                                ✨ {isIntakeLoading ? "Creating..." : "Create Data"}
                            </Button>

                            {intakeOutput && renderIntakeOutput()}
                        </div>
                    </div>
                </main>
            </div>
            {/* New AlertDialog for "Create Intake Data" confirmation */}
            <AlertDialog open={isCreateConfirmOpen} onOpenChange={setCreateConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Create Intake Data</AlertDialogTitle>
                        <AlertDialogDescription>
                            {fields.length > 0
                                ? `This will create a new patient and intake record in the '${environment}' environment. For empty fields, random data will be generated. Continue?`
                                : `This will create a new patient and intake record with randomly generated data in the '${environment}' environment. Do you want to continue?`}
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