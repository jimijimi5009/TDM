import Header from "@/components/Header";
import { useState, useCallback } from "react";
import { Plus, Database, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataRow, { DataField } from "@/components/DataRow";
import { useToast } from "../hooks/use-toast";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import FormatSelector from "@/components/FormatSelector";

const DEFAULT_FIELDS: DataField[] = [];

const ServiceCall = () => {
    const { toast } = useToast();
    
    // Mode selector
    const [activeMode, setActiveMode] = useState<"retrieve" | "create">("retrieve");
    
    // Common state
    const [environment, setEnvironment] = useState<string>("Q1");
    const [selectedService, setSelectedService] = useState("");
    
    // Retrieve Data state
    const [fields, setFields] = useState<DataField[]>([]);
    const [queryOutput, setQueryOutput] = useState<Record<string, any>[] | string | null>(null);
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [showPayloadDialog, setShowPayloadDialog] = useState(false);
    const [queryFormat, setQueryFormat] = useState<string>("table");
    
    // Create Data state
    const [intakeFields, setIntakeFields] = useState<DataField[]>([]);
    const [intakeOutput, setIntakeOutput] = useState<Record<string, any>[] | string | null>(null);
    const [isCreateLoading, setIsCreateLoading] = useState(false);
    const [isCreateConfirmOpen, setCreateConfirmOpen] = useState(false);
    const [showCreatePayloadDialog, setShowCreatePayloadDialog] = useState(false);
    const [createFormat, setCreateFormat] = useState<string>("table");

    // ============ RETRIEVE DATA HANDLERS ============
    const handleFetchQuerySchema = useCallback(async () => {
        if (!selectedService) {
            toast({
                title: "Service Type Required",
                description: "Please select a Service Type to fetch its schema.",
                variant: "destructive",
            });
            return;
        }

        setIsQueryLoading(true);
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
            setIsQueryLoading(false);
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

    const buildQueryPayload = useCallback(() => {
      const selectedColumns = fields.filter(f => f.checked).map(f => f.propertyName);
      const filters: Record<string, string> = {};
      fields.forEach(field => {
        if (field.value && String(field.value).trim() !== "") {
          filters[field.propertyName] = field.value;
        }
      });

      return {
        environment,
        service: selectedService,
        selectedColumns,
        filters,
        queryType: "query"
      };
    }, [environment, selectedService, fields]);

    const buildCreatePayload = useCallback(() => {
      const dataFields: Record<string, any>[] = [];
      intakeFields.filter(f => f.checked).forEach(field => {
        dataFields.push({
          [field.propertyName]: field.value || "",
        });
      });

      return {
        environment,
        service: selectedService,
        dataFields: dataFields.length > 0 ? dataFields : undefined,
        queryType: "create-intake"
      };
    }, [environment, selectedService, intakeFields]);

    const formatDataAsJson = (data: any): string => {
      return JSON.stringify(data, null, 2);
    };

    const formatDataAsCsv = (data: Record<string, any>[]): string => {
      if (!Array.isArray(data) || data.length === 0) {
        return JSON.stringify(data, null, 2);
      }
      const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
      const csvRows = data.map(row => 
        headers.map(h => {
          const val = row[h];
          const strVal = val === null || val === undefined ? '' : String(val);
          return `"${strVal.replace(/"/g, '""')}"`;
        }).join(',')
      );
      return [headers.join(','), ...csvRows].join('\n');
    };

    const formatDataAsPlainText = (data: Record<string, any>[]): string => {
      if (!Array.isArray(data) || data.length === 0) {
        return JSON.stringify(data, null, 2);
      }
      const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
      let text = headers.join('\t') + '\n';
      text += data.map(row => 
        headers.map(h => {
          const val = row[h];
          return val === null || val === undefined ? '' : String(val);
        }).join('\t')
      ).join('\n');
      return text;
    };

    const downloadData = (content: string, filename: string, type: string) => {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    };

    const handleDownloadData = (data: any, format: string, dataType: string) => {
      let content = '';
      let filename = '';
      let mimeType = 'text/plain';

      if (format === 'json') {
        content = formatDataAsJson(data);
        filename = `${dataType}_${Date.now()}.json`;
        mimeType = 'application/json';
      } else if (format === 'csv') {
        content = formatDataAsCsv(Array.isArray(data) ? data : [data]);
        filename = `${dataType}_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else if (format === 'plaintext') {
        content = formatDataAsPlainText(Array.isArray(data) ? data : [data]);
        filename = `${dataType}_${Date.now()}.txt`;
        mimeType = 'text/plain';
      } else if (format === 'pdf') {
        // Simple PDF export (you can use libraries like jsPDF for more advanced features)
        content = formatDataAsPlainText(Array.isArray(data) ? data : [data]);
        filename = `${dataType}_${Date.now()}.pdf`;
        mimeType = 'application/pdf';
      }

      if (content) {
        downloadData(content, filename, mimeType);
      }
    };

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

        setIsQueryLoading(true);
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
            setIsQueryLoading(false);
        }
    }, [environment, selectedService, fields, toast]);

    // ============ CREATE DATA HANDLERS ============
    const handleFetchIntakeSchema = useCallback(async () => {
        if (!selectedService) {
            toast({
                title: "Service Type Required",
                description: "Please select a Service Type to fetch its schema.",
                variant: "destructive",
            });
            return;
        }

        setIsCreateLoading(true);
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
            setIsCreateLoading(false);
        }
    }, [environment, selectedService, toast]);

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

    const handleCreateIntake = useCallback(async () => {
        if (!selectedService) {
            toast({ title: "Service Type Required", description: "Please select a Service Type to create data.", variant: "destructive" });
            return;
        }

        setIsCreateLoading(true);
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
                toast({ title: "Data Creation Successful", description: result.message || `Data created and verified in ${environment}.` });
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
            toast({ title: "Error", description: `Failed to create data: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsCreateLoading(false);
            setCreateConfirmOpen(false);
        }
    }, [environment, selectedService, intakeFields, toast]);

    // ============ RENDER FUNCTIONS ============
    const renderOutput = () => {
        if (!queryOutput) return null;

        const isErrorOrInfoString = typeof queryOutput === 'string';
        const isDataArray = Array.isArray(queryOutput) && queryOutput.length > 0;

        const safeToString = (value: any): string => {
            if (value === null || value === undefined) return '';
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

        // Render based on selected format
        if (queryFormat === 'json' || queryFormat === 'csv' || queryFormat === 'plaintext' || queryFormat === 'pdf') {
            let displayText = '';
            if (queryFormat === 'json') {
                displayText = formatDataAsJson(queryOutput);
            } else if (queryFormat === 'csv' && isDataArray) {
                displayText = formatDataAsCsv(queryOutput as Record<string, any>[]);
            } else if ((queryFormat === 'plaintext' || queryFormat === 'pdf') && isDataArray) {
                displayText = formatDataAsPlainText(queryOutput as Record<string, any>[]);
            } else {
                // For string outputs or when format doesn't work, show as plain text
                displayText = typeof queryOutput === 'string' ? queryOutput : JSON.stringify(queryOutput, null, 2);
            }

            return (
                <div className="mt-6 p-4 border rounded-lg bg-card-foreground">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">Output</h3>
                        <Button
                            onClick={() => handleDownloadData(queryOutput, queryFormat, 'query_data')}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                    </div>
                    <Textarea
                        value={displayText}
                        readOnly
                        rows={15}
                        className="bg-background text-foreground font-mono text-sm resize-y"
                    />
                </div>
            );
        }

        // Default table format
        return (
            <div className="mt-6 p-4 border rounded-lg bg-card-foreground">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Output</h3>
                    <Button
                        onClick={() => handleDownloadData(queryOutput, 'json', 'query_data')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download
                    </Button>
                </div>
                {isDataArray ? (() => {
                    const allRows = queryOutput;
                    const allPossibleKeys = Array.from(new Set(allRows.flatMap(row => Object.keys(row))));
                    
                    const columnsToShow = allPossibleKeys.filter(key => {
                        return allRows.some(row => {
                            const value = row[key];
                            if (value === null || value === undefined) return false;
                            const strValue = safeToString(value).trim();
                            return strValue && strValue !== '' && strValue.toLowerCase() !== 'null';
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
            if (value === null || value === undefined) return '';
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

        // Render based on selected format
        if (createFormat === 'json' || createFormat === 'csv' || createFormat === 'plaintext' || createFormat === 'pdf') {
            let displayText = '';
            if (createFormat === 'json') {
                displayText = formatDataAsJson(intakeOutput);
            } else if (createFormat === 'csv' && isDataArray) {
                displayText = formatDataAsCsv(intakeOutput as Record<string, any>[]);
            } else if ((createFormat === 'plaintext' || createFormat === 'pdf') && isDataArray) {
                displayText = formatDataAsPlainText(intakeOutput as Record<string, any>[]);
            } else {
                // For string outputs or when format doesn't work, show as plain text
                displayText = typeof intakeOutput === 'string' ? intakeOutput : JSON.stringify(intakeOutput, null, 2);
            }

            return (
                <div className="mt-6 p-4 border rounded-lg bg-card-foreground">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">Output</h3>
                        <Button
                            onClick={() => handleDownloadData(intakeOutput, createFormat, 'create_data')}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                    </div>
                    <Textarea
                        value={displayText}
                        readOnly
                        rows={15}
                        className="bg-background text-foreground font-mono text-sm resize-y"
                    />
                </div>
            );
        }

        // Default table format
        return (
            <div className="mt-6 p-4 border rounded-lg bg-card-foreground">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Output</h3>
                    <Button
                        onClick={() => handleDownloadData(intakeOutput, 'json', 'create_data')}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download
                    </Button>
                </div>
                {isDataArray ? (() => {
                    const allRows = intakeOutput;
                    const allPossibleKeys = Array.from(new Set(allRows.flatMap(row => Object.keys(row))));
                    
                    const columnsToShow = allPossibleKeys.filter(key => {
                        return allRows.some(row => {
                            const value = row[key];
                            if (value === null || value === undefined) return false;
                            const strValue = safeToString(value).trim();
                            return strValue && strValue !== '' && strValue.toLowerCase() !== 'null';
                        });
                    });

                    if (columnsToShow.length === 0) {
                        return <p className="text-muted-foreground">Data returned, but all columns are empty.</p>;
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

    return (
        <>
            <div className="min-h-screen bg-background">
                <Header />

                <main className="container py-8 max_w_6xl">
                    <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
                        Service Call
                    </h1>

                    <div className="space-y-6">
                        {/* Mode Selection Buttons */}
                        <div className="flex gap-4 justify-center mb-8">
                            <Button
                                onClick={() => setActiveMode("retrieve")}
                                className={`px-8 py-2 text-lg font-semibold rounded transition-all ${
                                    activeMode === "retrieve"
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                                }`}
                            >
                                Retrieve Data
                            </Button>
                            <Button
                                onClick={() => setActiveMode("create")}
                                className={`px-8 py-2 text-lg font-semibold rounded transition-all ${
                                    activeMode === "create"
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                                }`}
                            >
                                Create Data
                            </Button>
                        </div>

                        {/* Common Environment and Service Type Selection */}
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

                        {/* RETRIEVE DATA SECTION */}
                        {activeMode === "retrieve" && (
                            <Card className="shadow-card border-border/50 overflow-hidden">
                                <CardHeader className="pb-4">
                                    <h2 className="text-lg font-semibold text-foreground">Retrieve Data</h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground mb-4">
                                        Click on select columns to select the columns you would like to view.
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <Button onClick={handleFetchQuerySchema} variant="outline" size="sm" disabled={!selectedService || isQueryLoading}>
                                            Select columns <Database className="h-4 w-4 ml-1" />
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

                                    <div className="text-sm text-muted-foreground mb-4">
                                        Click on search to view the data on the console
                                    </div>

                                    <div className="mb-4 p-4 border rounded-lg bg-card">
                                        <p className="text-sm font-medium text-foreground mb-2">Choose Data Format</p>
                                        <FormatSelector value={queryFormat} onChange={setQueryFormat} />
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        <Button
                                            onClick={() => setShowPayloadDialog(true)}
                                            variant="outline"
                                            disabled={!selectedService || fields.filter(f => f.checked).length === 0}
                                            className="flex-1"
                                        >
                                            View Payload
                                        </Button>
                                        <Button
                                            onClick={handleExecute}
                                            disabled={isQueryLoading || !selectedService || fields.filter(f => f.checked).length === 0}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-primary-foreground py-2 rounded"
                                        >
                                            {isQueryLoading ? "Searching..." : "Search"}
                                        </Button>
                                    </div>

                                    {renderOutput()}
                                </CardContent>
                            </Card>
                        )}

                        {/* CREATE DATA SECTION */}
                        {activeMode === "create" && (
                            <Card className="shadow-card border-border/50 overflow-hidden">
                                <CardHeader className="pb-4">
                                    <h2 className="text-lg font-semibold text-foreground">Create Data</h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground mb-4">
                                        Click on Customize Data to create customize data
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button onClick={handleFetchIntakeSchema} variant="outline" size="sm" disabled={!selectedService || isCreateLoading}>
                                            Customize Data <Database className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-4 px-4 py-3 rounded-t-lg bg-table-header text-table-header-text text-sm font-medium mb-2">
                                        <span className="flex-1">Column Name</span>
                                        <span className="flex-1">Value (Optional - Random if Empty)</span>
                                        <span className="w-20">Actions</span>
                                    </div>
                                    
                                    <div className="text-xs text-muted-foreground px-4 mb-2">
                                        Enter values for the fields you want to customize. Empty fields will use random data.
                                    </div>
                                    
                                    <div className="space-y-0 mb-4">
                                        {intakeFields.map((field, index) => (
                                            <DataRow
                                                key={field.id}
                                                field={field}
                                                index={index}
                                                onUpdate={updateIntakeField}
                                                onDelete={deleteIntakeField}
                                                onDuplicate={duplicateIntakeField}
                                                isCreateMode={true}
                                                isIntakeMode={true}
                                            />
                                        ))}
                                    </div>

                                    <div className="text-sm text-muted-foreground mb-4">
                                        Click on create data to create new data in the Data Base.
                                    </div>

                                    <div className="mb-4 p-4 border rounded-lg bg-card">
                                        <p className="text-sm font-medium text-foreground mb-2">Choose Data Format</p>
                                        <FormatSelector value={createFormat} onChange={setCreateFormat} />
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            onClick={() => setShowCreatePayloadDialog(true)}
                                            variant="outline"
                                            disabled={!selectedService || intakeFields.filter(f => f.checked).length === 0}
                                            className="flex-1"
                                        >
                                            View Payload
                                        </Button>
                                        <Button
                                            onClick={() => setCreateConfirmOpen(true)}
                                            disabled={isCreateLoading || !selectedService}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-primary-foreground py-2 rounded"
                                        >
                                            {isCreateLoading ? "Processing..." : "Create"}
                                        </Button>
                                    </div>

                                    {intakeOutput && renderIntakeOutput()}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
            
            {/* Dialog for Query Payload */}
            <Dialog open={showPayloadDialog} onOpenChange={setShowPayloadDialog}>
                <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>API Query Payload</DialogTitle>
                        <DialogDescription>
                            This is the payload that will be sent to the API when you click Search.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{JSON.stringify(buildQueryPayload(), null, 2)}</pre>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Create Payload */}
            <Dialog open={showCreatePayloadDialog} onOpenChange={setShowCreatePayloadDialog}>
                <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>API Create Payload</DialogTitle>
                        <DialogDescription>
                            This is the payload that will be sent to the API when you click Create.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{JSON.stringify(buildCreatePayload(), null, 2)}</pre>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AlertDialog for "Create Data" confirmation */}
            <AlertDialog open={isCreateConfirmOpen} onOpenChange={setCreateConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Create Data</AlertDialogTitle>
                        <AlertDialogDescription>
                            {intakeFields.length > 0
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
