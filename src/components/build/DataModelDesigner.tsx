"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Wand2, Loader2, Plus, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import BuildSectionShell from "./BuildSectionShell";
import { useBuildBlueprint } from "@/contexts/BuildStageContext";

interface Entity {
  id: string;
  name: string;
  description?: string;
  fields?: Array<{ name: string; type: string; required?: boolean }>;
}

interface Relationship {
  id: string;
  from: string;
  to: string;
  type: string;
}

interface DataModelDesignerProps {
  projectId: string;
  featureSpecs?: any;
  mvpScope?: any;
  ideaContext?: string;
}

export default function DataModelDesigner({
  projectId,
  featureSpecs,
  mvpScope,
  ideaContext,
}: DataModelDesignerProps) {
  const { blueprint, saveBlueprint, autosave, updateSectionCompletion } = useBuildBlueprint();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [apiConsiderations, setApiConsiderations] = useState("");
  const [mermaidPreview, setMermaidPreview] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (blueprint?.data_model) {
      setEntities(blueprint.data_model.entities || []);
      setRelationships(blueprint.data_model.relationships || []);
      setApiConsiderations(blueprint.data_model.apiConsiderations || "");
    }
  }, [blueprint]);

  useEffect(() => {
    // Generate Mermaid diagram
    let mermaid = "erDiagram\n";
    entities.forEach(entity => {
      mermaid += `    ${entity.name} {\n`;
      if (entity.fields && entity.fields.length > 0) {
        entity.fields.forEach(field => {
          mermaid += `        ${field.type} ${field.name}${field.required ? "" : "?"}\n`;
        });
      } else {
        mermaid += `        string id\n`;
      }
      mermaid += `    }\n`;
    });
    relationships.forEach(rel => {
      mermaid += `    ${rel.from} ||--o{ ${rel.to} : "${rel.type}"\n`;
    });
    setMermaidPreview(mermaid);
  }, [entities, relationships]);

  const handleAddEntity = () => {
    const newEntity: Entity = {
      id: `entity-${Date.now()}-${Math.random()}`,
      name: "",
      fields: [],
    };
    setEntities([...entities, newEntity]);
  };

  const handleUpdateEntity = (id: string, updates: Partial<Entity>) => {
    setEntities(entities.map(e => e.id === id ? { ...e, ...updates } : e));
    autosave({
      dataModel: {
        entities: entities.map(e => e.id === id ? { ...e, ...updates } : e),
        relationships,
        apiConsiderations,
      },
    });
  };

  const handleDeleteEntity = (id: string) => {
    setEntities(entities.filter(e => e.id !== id));
    setRelationships(relationships.filter(r => r.from !== entities.find(e => e.id === id)?.name && r.to !== entities.find(e => e.id === id)?.name));
  };

  const handleAddField = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity) {
      handleUpdateEntity(entityId, {
        fields: [...(entity.fields || []), { name: "", type: "string", required: true }],
      });
    }
  };

  const handleUpdateField = (entityId: string, fieldIndex: number, updates: any) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity && entity.fields) {
      const updatedFields = [...entity.fields];
      updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...updates };
      handleUpdateEntity(entityId, { fields: updatedFields });
    }
  };

  const handleDeleteField = (entityId: string, fieldIndex: number) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity && entity.fields) {
      handleUpdateEntity(entityId, {
        fields: entity.fields.filter((_, i) => i !== fieldIndex),
      });
    }
  };

  const handleAddRelationship = () => {
    const newRel: Relationship = {
      id: `rel-${Date.now()}-${Math.random()}`,
      from: "",
      to: "",
      type: "has",
    };
    setRelationships([...relationships, newRel]);
  };

  const handleUpdateRelationship = (id: string, updates: Partial<Relationship>) => {
    setRelationships(relationships.map(r => r.id === id ? { ...r, ...updates } : r));
    autosave({
      dataModel: {
        entities,
        relationships: relationships.map(r => r.id === id ? { ...r, ...updates } : r),
        apiConsiderations,
      },
    });
  };

  const handleDeleteRelationship = (id: string) => {
    setRelationships(relationships.filter(r => r.id !== id));
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/build/data-model/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          featureSpecs,
          mvpScope,
          ideaContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          setEntities(data.result.entities || []);
          setRelationships(data.result.relationships || []);
          setApiConsiderations(data.result.apiConsiderations || data.result.api_considerations || "");
        }
      }
    } catch (error) {
      console.error("Failed to generate data model:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveBlueprint({
        dataModel: {
          entities,
          relationships,
          apiConsiderations,
        },
      });
      updateSectionCompletion("data_model", true);
    } catch (error) {
      console.error("Failed to save data model:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportMermaid = () => {
    const blob = new Blob([mermaidPreview], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data-model.mmd";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BuildSectionShell
      title="Data Model"
      description="Design your database schema with entities, relationships, and API considerations"
      sectionId="data_model"
      onSave={handleSave}
      onAIGenerate={handleGenerate}
      saving={saving}
      generating={generating}
      showLock={true}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Entities</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddEntity}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Entity
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {entities.map(entity => (
                <Card key={entity.id} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={entity.name}
                        onChange={(e) => handleUpdateEntity(entity.id, { name: e.target.value })}
                        placeholder="Entity name"
                        className="font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntity(entity.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={entity.description || ""}
                      onChange={(e) => handleUpdateEntity(entity.id, { description: e.target.value })}
                      placeholder="Description"
                      rows={2}
                      className="mt-2"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(entity.fields || []).map((field, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={field.name}
                            onChange={(e) => handleUpdateField(entity.id, idx, { name: e.target.value })}
                            placeholder="Field name"
                            className="flex-1"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(entity.id, idx, { type: e.target.value })}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                            <option value="date">date</option>
                            <option value="uuid">uuid</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteField(entity.id, idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddField(entity.id)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Field
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Relationships */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Relationships</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddRelationship}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Relationship
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {relationships.map(rel => (
                <Card key={rel.id} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={rel.from}
                        onChange={(e) => handleUpdateRelationship(rel.id, { from: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded"
                      >
                        <option value="">From Entity</option>
                        {entities.map(e => (
                          <option key={e.id} value={e.name}>{e.name}</option>
                        ))}
                      </select>
                      <select
                        value={rel.type}
                        onChange={(e) => handleUpdateRelationship(rel.id, { type: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="has">has</option>
                        <option value="belongs">belongs to</option>
                        <option value="many">many</option>
                      </select>
                      <select
                        value={rel.to}
                        onChange={(e) => handleUpdateRelationship(rel.id, { to: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded"
                      >
                        <option value="">To Entity</option>
                        {entities.map(e => (
                          <option key={e.id} value={e.name}>{e.name}</option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRelationship(rel.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Mermaid Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mermaid Diagram Preview</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportMermaid}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-neutral-50 p-4 rounded border text-sm overflow-x-auto">
              {mermaidPreview || "// Add entities and relationships to generate diagram"}
            </pre>
          </CardContent>
        </Card>

        {/* API Considerations */}
        <Card>
          <CardHeader>
            <CardTitle>API Considerations</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={apiConsiderations}
              onChange={(e) => {
                setApiConsiderations(e.target.value);
                autosave({
                  dataModel: {
                    entities,
                    relationships,
                    apiConsiderations: e.target.value,
                  },
                });
              }}
              placeholder="Notes on API design, endpoints, authentication, etc."
              rows={6}
            />
          </CardContent>
        </Card>
      </div>
    </BuildSectionShell>
  );
}

