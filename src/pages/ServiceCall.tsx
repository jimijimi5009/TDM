import Header from "@/components/Header";
import { useState, useCallback } from "react";
import { Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StepCard from "@/components/StepCard";
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

const ENVIRONMENTS = ["Q1", "Q2", "Q3", "Q4", "Q5", "PROD"];

const ServiceCall = () => {
    const { toast } = useToast();
    const [fields, setFields] = useState<DataField[]>([]);
    const [queryOutput, setQueryOutput] = useState<Record<string, any>[] | string | null>(null);
    const [environment, setEnvironment] = useState<string>("Q1");
    const [selectedService, setSelectedService] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateConfirmOpen, setCreateConfirmOpen] = useState(false);

    const handleFetchSchema = useCallback(async () => {
        if (!selectedService) {
            toast({ title: "Service Type Required", description: "Please select a Service Type to fetch its schema.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setFields([]);
        setQueryOutput(null);

        try {
            const response = await fetch(`/api/service-schema?environment=${environment}&serviceType=${selectedService}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.schema && result.schema.length > 0) {
                const initialFields = result.schema.map((field: DataField) => ({ ...field, value: field.value || "" }));
                setFields(initialFields);
                toast({ title: "Schema Loaded", description: `Schema for ${selectedService} from ${environment} loaded.` });
            } else {
                toast({ title: "No Schema Found", description: `No schema fields returned for ${selectedService} in ${environment}.`, variant: "destructive" });
            }
        } catch (error) {
            console.error("Failed to fetch service schema:", error);
            toast({ title: "Error", description: `Failed to load service schema: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
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
        const selectedColumns = fields.filter(f => f.checked).map(f => f.propertyName);
        if (!selectedService || selectedColumns.length === 0) {
            toast({ title: "Selection Required", description: "Please select a Service Type and at least one column.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setQueryOutput(null);

        try {
            const response = await fetch('/api/service-execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ environment, serviceType: selectedService, selectedColumnNames: selectedColumns }),
            });
            if (!response.ok) throw new Error((await response.json()).error || `HTTP error! status: ${response.status}`);
            const result = await response.json();
            
            if (result.data && result.data.length > 0) {
                setQueryOutput(result.data);
                toast({ title: "Query Executed", description: `Data fetched for ${selectedService} from ${environment}.` });
            } else {
                setQueryOutput("No data found for the selected columns.");
                toast({ title: "No Data Found", variant: "destructive" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Failed to execute service query:", error);
            setQueryOutput(JSON.stringify({ error: errorMessage }, null, 2));
            toast({ title: "Error", description: `Failed to execute service query: ${errorMessage}`, variant: "destructive" });
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
            const response = await fetch('/api/create-intake-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ environment, serviceType: selectedService }),
            });
            if (!response.ok) throw new Error((await response.json()).error || `HTTP error! status: ${response.status}`);
            const result = await response.json();

            if (result.data && result.data.length > 0) {
                setQueryOutput(result.data);
                toast({ title: "Data Creation Successful", description: result.message || `Intake data created and verified in ${environment}.` });
            } else {
                setQueryOutput(result.message || "An unknown issue occurred.");
                toast({ title: "Data Creation Info", description: result.message || "Process finished.", variant: "destructive" });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Failed to create intake data:", error);
            setQueryOutput(JSON.stringify({ error: errorMessage }, null, 2));
            toast({ title: "Error", description: `Failed to create intake data: ${errorMessage}`, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [environment, selectedService, toast]);

    const renderOutput = () => {
        if (!queryOutput) return null;

        const isErrorOrInfoString = typeof queryOutput === 'string';
        const isDataArray = Array.isArray(queryOutput) && queryOutput.length > 0;

        return (
            <div className="mt-6 p-4 border rounded-lg bg-card-foreground">
                <h3 className="text-xl font-semibold mb-4 text-white">Output</h3>
                {isDataArray ? (() => {
                    const firstRow = queryOutput[0];
                    const columnsToShow = Object.keys(firstRow).filter(key => firstRow[key] !== null && firstRow[key] !== undefined);

                    if (columnsToShow.length === 0) {
                        return <p className="text-muted-foreground">Query returned a result, but all columns are empty.</p>;
                    }

                    return (
                        <Table className="bg-background rounded-lg">
                            <TableHeader>
                                <TableRow>
                                    {columnsToShow.map(key => <TableHead key={key}>{key}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {queryOutput.map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {columnsToShow.map(key => <TableCell key={`${rowIndex}-${key}`}>{String(row[key])}</TableCell>)}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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

    const allChecked = fields.every(f => f.checked);

    return (
        <>
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-8 max_w_6xl">
                    <h1 className="text-3xl font-bold text-center mb-8 text-foreground">Service Call Generator</h1>
                    <div className="space-y-6">
                        <StepCard step={1} title="Choose Service and Action">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-sm font-medium text-muted-foreground">Environment</span>
                                <Select value={environment} onValueChange={setEnvironment}>
                                    <SelectTrigger className="w-[180px] bg-card"><SelectValue /></SelectTrigger>
                                    <SelectContent>{ENVIRONMENTS.map((env) => <SelectItem key={env} value={env}>{env}</SelectItem>)}</SelectContent>
                                </Select>
                                <span className="text-sm font-medium text-muted-foreground">Service Type</span>
                                <Select value={selectedService} onValueChange={setSelectedService}>
                                    <SelectTrigger className="w-[280px] bg-card"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent><SelectItem value="patient-rest-services">Patient Rest Services</SelectItem></SelectContent>
                                </Select>
                                <Button onClick={handleFetchSchema} variant="outline" size="sm" disabled={!selectedService || isLoading}>
                                    Fetch Schema <Database className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-4 px-4 py-3 rounded-t-lg bg-table-header text-table-header-text text-sm font-medium mb-2">
                                <div className="w-4" /><Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                                <span className="w-8">All</span>
                                <span className="w-[180px]">Data Type</span>
                                <span className="w-[140px]">Property Name</span>
                                <span className="w-[160px]">Actual Data</span>
                                <span className="ml-auto">Actions</span>
                            </div>
                            <div className="space-y-0 mb-4">
                                {fields.map((field, index) => (
                                    <DataRow key={field.id} field={field} index={index} onUpdate={updateField} onDelete={deleteField} onDuplicate={duplicateField} isCreateMode={false} />
                                ))}
                            </div>
                        </StepCard>
                        <div className="flex gap-4">
                            <Button onClick={handleExecute} disabled={isLoading || !selectedService || fields.filter(f => f.checked).length === 0} className="w-full bg-blue-500 hover:bg-blue-600 text-primary-foreground py-2 rounded mt-2">
                                {isLoading ? "Executing..." : "Execute Query"}
                            </Button>
                            <Button onClick={() => setCreateConfirmOpen(true)} disabled={isLoading || !selectedService} className="w-full bg-green-500 hover:bg-green-600 text-primary-foreground py-2 rounded mt-2">
                                {isLoading ? "Processing..." : "Create Intake Data"} <Plus className="h-4 w-4 ml-2"/>
                            </Button>
                        </div>
                        {renderOutput()}
                    </div>
                </main>
            </div>
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