import { useState, useCallback } from "react";
import { Plus, Sparkles } from "lucide-react";
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

const DEFAULT_FIELDS: DataField[] = [
  { id: "1", type: "names", propertyName: "full_name", option: "Full name", checked: true },
  { id: "2", type: "phone", propertyName: "phone", option: "+1 ###-###-####", checked: true },
  { id: "3", type: "email", propertyName: "email", option: "Standard", checked: true },
  { id: "4", type: "currency", propertyName: "currency", option: "USD", checked: true },
  { id: "5", type: "number", propertyName: "number", option: "1-100", checked: true },
];

const Index = () => {
  const [fields, setFields] = useState<DataField[]>(DEFAULT_FIELDS);
  const [format, setFormat] = useState("json");
  const [rowCount, setRowCount] = useState(10);
  const [generatedData, setGeneratedData] = useState<string | null>(null);
  const [newFieldType, setNewFieldType] = useState("names");

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
