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
    const { toast } = useToast(); // Initialize useToast
    const [fields, setFields] = useState<DataField[]>([]);
    const [dbQueryOutput, setDbQueryOutput] = useState<string | null>(null);
    const [newFieldType, setNewFieldType] = useState("names");
    const [environment, setEnvironment] = useState<string>("Q1"); // Keep environment state
    const [selectedService, setSelectedService] = useState(""); // Keep selectedService state
    const [dataType, setDataType] = useState("static"); // Keep dataType state
    const [isLoading, setIsLoading] = useState(false); // Keep isLoading state

    const handleFetchSchema = useCallback(async () => {
        toast({
            title: "Fetching Schema",
            description: `Fetching schema for ${selectedService} in ${environment}... (Logic to be implemented)`,
        });
        // Placeholder for actual schema fetching logic
        setIsLoading(true); // Assuming fetching involves loading state
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setIsLoading(false);
        setFields([]); // Clear existing fields or update with dummy data
        toast({
            title: "Schema Fetched",
            description: "Placeholder schema data loaded.",
        });
        // This is where the logic for the Join SQL query and filtering would go
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
        toast({
            title: "Executing Query",
            description: `Executing query for selected columns in ${selectedService} in ${environment}... (Logic to be implemented)`,
        });
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setIsLoading(false);
        setDbQueryOutput(`Executed query for ${selectedService} with selected columns.`);
        // This is where the logic for fetching a single row would go
    }, [environment, selectedService, fields, toast]);

    const allChecked = fields.every(f => f.checked);


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
                            <Button onClick={handleFetchSchema} variant="outline" size="sm" disabled={!selectedService}>
                                Fetch Schema <Database className="h-4 w-4 ml-1" />
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
                                />
                            ))}
                        </div>
                        
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



                    <Button
                        onClick={handleExecute}
                        disabled={isLoading || !selectedService || fields.filter(f => f.checked).length === 0}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-primary-foreground py-2 rounded mt-2"
                    >
                        {isLoading ? "Executing..." : "Execute"}
                    </Button>


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