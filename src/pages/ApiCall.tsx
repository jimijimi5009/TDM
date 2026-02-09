import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ApiCall = () => {
  const [requestType, setRequestType] = useState("initial");
  const [dataType, setDataType] = useState("static");
  const [selectedEnvironment, setSelectedEnvironment] = useState("Q1");

  useEffect(() => {
  }, [requestType]);

  useEffect(() => {
  }, [dataType]);

  const [referralRequestId, setReferralRequestId] = useState("");
  const [earliestAuthStartDate, setEarliestAuthStartDate] = useState("");
  const [requestedStartDate, setRequestedStartDate] = useState("");
  const [staticApiResponse, setStaticApiResponse] = useState("");
  const [showStaticJsonOutput, setShowStaticJsonOutput] = useState(true);

  const [requestBody, setRequestBody] = useState("");
  const [apiResponse, setApiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatic, setIsLoadingStatic] = useState(false);

  const handleStaticApiCall = async () => {
    setIsLoadingStatic(true);
    setStaticApiResponse(""); // Clear previous response

    // Generate JSON based on current static data inputs
    const staticJsonTemplate = {
      "caseDetails": {
        "submitterInfo": {
          "firstName": "vijayapandian",
          "lastName": "palani",
          "email": "XYZ@mailslurp.net",
          "userType": "PROVIDER"
        },
        "referralRequestId": "878e0307-a112-49ad-879c-f3a910x95421",
        "referralRequestLineId": null,
        "primDiagUpdatedFlag": "N",
        "referralDetails": {
          "contactInfo": {
            "fax": "(234) 242-3423",
            "firstName": "vijayapandian",
            "lastName": "palani",
            "phoneNumber": "(248) 403-2731",
            "preferredContactMethod": {
              "gdfId": "CM30"
            }
          },
          "referralMethod": {
            "gdfId": "17ba0791499db908433b80f37c5fbc89b870084b"
          },
          "referralSource": {
            "gdfId": "da4b9237bacccdf19c0760cab7aec4a8359010b0"
          }
        },
        "member": {
          "firstName": "NIKI",
          "lastName": "HUDDS",
          "subscriberId": "YKZ3HZN88339830",
          "dob": "1965-01-08",
          "earliestAuthStartDate": "2026-02-01"
        },
        "planDetails": {
          "healthPlan": "Horizon BCBS NJ",
          "carrierGdfId": "d8e4bbea3af2e4861ad5a445aaec573e02f9aca2"
        },
        "attachments": [],
        "caseServiceLine": [
          {
            "referralRequestLineId": null,
            "serviceCategory": "INSTAY",
            "serviceCode": "4282",
            "routingPriority": "Urgent",
            "serviceType": "SNF",
            "hcpcCode": "52",
            "uom": "IS",
            "requestedStartDate": "2026-02-01",
            "requestedEndDate": null,
            "requestedUnits": null,
            "templates": [
              {
                "templateId": "2354",
                "templateType": "Common_Template",
                "questionAndAnswer": [
                  {
                    "questionSourceSystemId": "25701",
                    "questionText": "Request Type",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS1",
                        "answer": "Urgent"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "25692",
                    "questionText": "Requested Start Date",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS1",
                        "answer": "2024-02-26"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "25699",
                    "questionText": "Was the service or item for which you are now requesting authorization initiated prior to submitting this request for authorization?",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS3",
                        "answer": "Yes"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "31348",
                    "questionText": "Was the service or item for which you are requesting authorization completed prior to submitting this request? (I.E. was the member discharged from the post-acute setting)",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS4",
                        "answer": "No"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "25702",
                    "questionText": "Is there a verbal or written physician's or other qualified licensed practitioner's order for the service you are requesting? (Note: A written order is required prior to billing for services rendered.)",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS3",
                        "answer": "Yes"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "31144",
                    "questionText": "Was the patient recently discharged from an acute setting?",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS4",
                        "answer": "No"
                      }
                    ]
                  }
                ]
              },
              {
                "templateId": "99996996",
                "templateType": "Clinical_Template",
                "questionAndAnswer": [
                  {
                    "questionSourceSystemId": "32139",
                    "questionText": "Does the patient have acute hospital needs?",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS3",
                        "answer": "Yes"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "32140",
                    "questionText": "Does the patient have intense and complex care needs that make skilled nursing facility care safer and more practical than a lower level of care?",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS3",
                        "answer": "Yes"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "32141",
                    "questionText": "Does the care include multiple components delivered by skilled professionals?",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS3",
                        "answer": "Yes"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "32142",
                    "questionText": "Is there a plan to provide ALL of the following?",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS3",
                        "answer": "Yes"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "32143",
                    "questionText": "What type of skilled treatments are needed?",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS25",
                        "answer": "Nursing"
                      },
                      {
                        "answerSourceSystemId": "ANS26",
                        "answer": "Therapy (PT/OT/ST)"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "32144",
                    "questionText": "What are the nursing interventions being requested? Select all that apply",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS28",
                        "answer": "Insulin Regimen"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "32145",
                    "questionText": "Select how many hours of nursing per day are required while in the skilled nursing facility?",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS40",
                        "answer": "2 hours per day"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "32146",
                    "questionText": "What are the therapy interventions being requested? Select all that apply",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS17",
                        "answer": "Supervision of therapeutic exercises"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "32147",
                    "questionText": "Select how many hours of therapy will be required in the skilled nursing facility:",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS40",
                        "answer": "2 hours per day"
                      }
                    ]
                  },
                  {
                    "questionSourceSystemId": "32148",
                    "questionText": "Do you have clinical documentation to support this request, including the answers provided to the questions above (e.g. physician orders, history and physical, letter of medical necessity)?",
                    "answer": [
                      {
                        "answerSourceSystemId": "ANS46",
                        "answer": "Yes documents are attached"
                      }
                    ]
                  }
                ]
              }
            ],
            "providers": [
              {
                "address": {
                  "line1": "325 HOSPITALITY LANE",
                  "line2": "",
                  "city": "SAN BERNARDINO",
                  "zipCode": "92408",
                  "state": "California"
                },
                "copiedFromProviderGdfId": null,
                "faxNumber": "",
                "providerGdfId": "09fbab428da26cae5fdaac632d9512ffa8c61ccc",
                "providerType": "Primary_Physician"
              },
              {
                "address": {
                  "line1": "325 HOSPITALITY LANE",
                  "line2": "",
                  "city": "SAN BERNARDINO",
                  "zipCode": "92408",
                  "state": "California"
                },
                "copiedFromProviderGdfId": null,
                "faxNumber": "",
                "providerGdfId": "09fbab428da26cae5fdaac632d9512ffa8c61ccc",
                "providerType": "Ordering_Physician"
              },
              {
                "providerType": "Rendering_Provider",
                "providerGdfId": "2b1a27d6eaa3d3129128b3b0875d160931b3d82c"
              }
            ],
            "dischargingFacility": {},
            "diagnosis": [
              {
                "diagnosisCode": "H04011",
                "diagnosisType": "primary",
                "gdfId": "2c949c10ddaf97d4d4bcc329b7903cff2136303a"
              }
            ],
            "attachments": [],
            "caseServiceLineNumber": null
          }
        ],
        "referralType": "referral",
        "diagnosis": [
          {
            "diagnosisCode": "H401234",
            "diagnosisType": "primary",
            "gdfId": "9ceeaa140dcf1eedff95600d2ca6ac0b4c8754eb"
          }
        ]
      }
    };

    const newJson = JSON.parse(JSON.stringify(staticJsonTemplate));
    if (newJson.caseDetails) {
      if (referralRequestId) {
        newJson.caseDetails.referralRequestId = referralRequestId;
      }
      if (newJson.caseDetails.member && earliestAuthStartDate) {
        newJson.caseDetails.member.earliestAuthStartDate = earliestAuthStartDate;
      }
      if (newJson.caseDetails.caseServiceLine && newJson.caseDetails.caseServiceLine[0] && requestedStartDate) {
        newJson.caseDetails.caseServiceLine[0].requestedStartDate = requestedStartDate;
      }
      if (newJson.caseDetails.caseServiceLine && newJson.caseDetails.caseServiceLine[0] && newJson.caseDetails.caseServiceLine[0].templates && newJson.caseDetails.caseServiceLine[0].templates[0] && newJson.caseDetails.caseServiceLine[0].templates[0].questionAndAnswer) {
        const requestedStartDateQ = newJson.caseDetails.caseServiceLine[0].templates[0].questionAndAnswer.find(q => q.questionSourceSystemId === "25692");
        if (requestedStartDateQ && requestedStartDate) {
          requestedStartDateQ.answer[0].answer = requestedStartDate;
        }
      }
    }

    try {
      const response = await fetch('http://localhost:3000/api/external-call', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiType: "initial",
          environment: selectedEnvironment,
          requestBody: newJson,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }

      const data = await response.json();
      setStaticApiResponse(JSON.stringify(data, null, 2));
    } catch (error: unknown) {
      setStaticApiResponse(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) || "An unknown error occurred." }, null, 2));
    } finally {
      setIsLoadingStatic(false);
      setShowStaticJsonOutput(true);
    }
  };

  const handleApiCall = async () => {
    setIsLoading(true);
    setApiResponse("");

    let currentApiType = "";
    switch (requestType) {
      case "initial":
        currentApiType = "initial";
        break;
      case "cos":
        currentApiType = "cos";
        break;
      case "edit":
        currentApiType = "edit";
        break;
      default:
        setApiResponse(JSON.stringify({ error: "Invalid request type selected." }, null, 2));
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/external-call', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiType: currentApiType,
          environment: selectedEnvironment,
          requestBody: JSON.parse(requestBody || "{}"),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }

      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error: unknown) {
      setApiResponse(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) || "An unknown error occurred." }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };
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
                <div className="mt-6 p-4 border rounded-lg bg-card-foreground">
                  <h3 className="text-xl font-semibold mb-4 text-white">Static Data Configuration</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="referralRequestId" className="text-white">Referral Request ID</Label>
                      <Input
                        id="referralRequestId"
                        value={referralRequestId}
                        onChange={(e) => setReferralRequestId(e.target.value)}
                        placeholder="e.g., 878e0307-a112-49ad-879c-f3a910x95421"
                        className="bg-background text-foreground"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="earliestAuthStartDate" className="text-white">Earliest Auth Start Date</Label>
                      <Input
                        id="earliestAuthStartDate"
                        type="date"
                        value={earliestAuthStartDate}
                        onChange={(e) => setEarliestAuthStartDate(e.target.value)}
                        className="bg-background text-foreground"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="requestedStartDate" className="text-white">Requested Start Date</Label>
                      <Input
                        id="requestedStartDate"
                        type="date"
                        value={requestedStartDate}
                        onChange={(e) => setRequestedStartDate(e.target.value)}
                        className="bg-background text-foreground"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleStaticApiCall}
                    disabled={isLoadingStatic}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded mb-6"
                  >
                    {isLoadingStatic ? "Sending Request..." : "Request"}
                  </Button>

                  <h3 className="text-xl font-semibold mb-4 text-white">Generated JSON Output</h3>
                  <div className="space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="staticApiResponse" className="text-white">API Response</Label>
                      <Button
                        variant="link"
                        onClick={() => setShowStaticJsonOutput(!showStaticJsonOutput)}
                        className="p-0 h-auto text-sm"
                      >
                        {showStaticJsonOutput ? "Hide" : "Show"}
                      </Button>
                    </div>
                    {showStaticJsonOutput && (
                      <Textarea
                        id="staticApiResponse"
                        value={staticApiResponse}
                        readOnly
                        rows={20}
                        placeholder="API response will appear here..."
                        className="bg-background text-foreground font-mono resize-y"
                      />
                    )}
                    {showStaticJsonOutput && staticApiResponse && (
                      <Button
                        onClick={() => navigator.clipboard.writeText(staticApiResponse)}
                        className="absolute top-2 right-2 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded"
                      >
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {dataType === "custom" && (
                <div className="mt-6 p-4 border rounded-lg bg-card-foreground">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Custom API Call</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="environment-select" className="text-foreground">Environment</Label>
                      <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                        <SelectTrigger className="w-full bg-background text-foreground">
                          <SelectValue placeholder="Select Environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Q1">Q1</SelectItem>
                          <SelectItem value="Q2">Q2</SelectItem>
                          <SelectItem value="Q3">Q3</SelectItem>
                          <SelectItem value="Q4">Q4</SelectItem>
                          <SelectItem value="Q5">Q5</SelectItem>
                          <SelectItem value="PROD">PROD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-4 text-foreground">Request Body (JSON)</h3>
                  <Textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    rows={10}
                    placeholder='Enter your JSON request body here, e.g., { "key": "value" }'
                    className="bg-background text-foreground font-mono mb-4 resize-y"
                  />
                  
                  <Button
                    onClick={handleApiCall}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded mb-6"
                  >
                    {isLoading ? "Sending Request..." : "Request"}
                  </Button>

                  <h3 className="text-xl font-semibold mb-4 text-foreground">API Response</h3>
                  <Textarea
                    value={apiResponse}
                    readOnly
                    rows={15}
                    placeholder="API response will appear here..."
                    className="bg-background text-foreground font-mono resize-y"
                  />
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