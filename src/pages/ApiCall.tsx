import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";

const ApiCall = () => {
  const [requestType, setRequestType] = useState("initial");
  const [dataType, setDataType] = useState("static"); // 'static' or 'custom'

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
          API Call Generator
        </h1>
        
        <div className="flex justify-center">
          <Select value={requestType} onValueChange={setRequestType}>
            <SelectTrigger className="w-[280px] bg-card">
              <SelectValue placeholder="Select Request Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial">Initial Request</SelectItem>
              <SelectItem value="cos">COS</SelectItem>
              <SelectItem value="edit">Edit Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content for each request type will be rendered here based on state */}
        <div className="mt-8">
          {requestType === "initial" && (
            <div className="space-y-4">
              <RadioGroup value={dataType} onValueChange={setDataType} className="flex justify-center gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="static" id="static-data" />
                  <Label htmlFor="static-data">Static Data</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom-data" />
                  <Label htmlFor="custom-data">Custom Data</Label>
                </div>
              </RadioGroup>

              {dataType === "static" && (
                <div>
                  {/* UI for Static Data */}
                </div>
              )}
              {dataType === "custom" && (
                <div>
                  {/* UI for Custom Data */}
                </div>
              )}
            </div>
          )}
          {requestType === "cos" && (
            <div>
              {/* UI for COS */}
            </div>
          )}
          {requestType === "edit" && (
            <div>
              {/* UI for Edit Request */}
            </div>
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

export default ApiCall;
