import Header from "@/components/Header";
import { useState, useCallback } from "react";
import { Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const DEFAULT_FIELDS: DataField[] = [];

const CreateIntakeData = () => {
    const { toast } = useToast();
    const [intakeFields, setIntakeFields] = useState<DataField[]>([]);
    const [intakeOutput, setIntakeOutput] = useState<Record<string, any>[] | string | null>(null);
    const [environment, setEnvironment] = useState<string>("Q1");
    const [selectedService, setSelectedService] = useState("");
    const [isIntakeLoading, setIsIntakeLoading] = useState(false);
    const [isCreateConfirmOpen, setCreateConfirmOpen] = useState(false);

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

    return (
        <>
            <div className="min-h-screen bg-background">
                <Header />

                <main className="container py-8 max_w_6xl">
                    <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
                        Create Intake Data
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

                        {/* CREATE INTAKE SECTION */}
                        <Card className="shadow-card border-border/50 overflow-hidden">
                            <CardHeader className="pb-4">
                                <h2 className="text-lg font-semibold text-foreground">Create Intake Data</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mb-4">
                                    <Button onClick={handleFetchIntakeSchema} variant="outline" size="sm" disabled={!selectedService || isIntakeLoading}>
                                        Fetch Schema <Database className="h-4 w-4 ml-1" />
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

                                <div className="flex gap-2 mt-4">
                                    <Button
                                        onClick={() => setCreateConfirmOpen(true)}
                                        disabled={isIntakeLoading || !selectedService}
                                        className="w-full bg-green-500 hover:bg-green-600 text-primary-foreground py-2 rounded"
                                    >
                                        {isIntakeLoading ? "Processing..." : "Create Intake Data"} <Plus className="h-4 w-4 ml-2"/>
                                    </Button>
                                </div>

                                {intakeOutput && renderIntakeOutput()}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
            {/* AlertDialog for "Create Intake Data" confirmation */}
            <AlertDialog open={isCreateConfirmOpen} onOpenChange={setCreateConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Create Intake Data</AlertDialogTitle>
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

export default CreateIntakeData;
