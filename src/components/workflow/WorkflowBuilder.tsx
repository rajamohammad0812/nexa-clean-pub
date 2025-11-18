/**
 * Workflow Builder Component - Drag & Drop Interface
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { StepType } from '@prisma/client'
import { Play, Settings, Plus, Trash2, Save, FileDown, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface WorkflowStep {
  id: string
  name: string
  type: StepType
  config: Record<string, unknown>
  order: number
  conditions?: Record<string, unknown>
  retries?: number
}

interface Workflow {
  id?: string
  name: string
  description?: string
  isActive: boolean
  steps: WorkflowStep[]
}

interface WorkflowBuilderProps {
  initialWorkflow?: Workflow
  onSave?: (workflow: Workflow) => Promise<void>
  onExecute?: (workflowId: string) => Promise<void>
}

const STEP_TYPES = [
  {
    value: StepType.API_CALL,
    label: 'API Call',
    description: 'Make HTTP requests to external APIs',
  },
  { value: StepType.DELAY, label: 'Delay', description: 'Wait for a specified duration' },
  { value: StepType.TRANSFORM, label: 'Transform', description: 'Transform data between steps' },
  { value: StepType.WEBHOOK, label: 'Webhook', description: 'Send data to webhook endpoints' },
  { value: StepType.EMAIL, label: 'Email', description: 'Send email notifications' },
  {
    value: StepType.CONDITIONAL,
    label: 'Conditional',
    description: 'Execute steps based on conditions',
  },
  { value: StepType.CUSTOM, label: 'Custom', description: 'Execute custom logic' },
]

export default function WorkflowBuilder({
  initialWorkflow,
  onSave,
  onExecute,
}: WorkflowBuilderProps) {
  const [workflow, setWorkflow] = useState<Workflow>(
    initialWorkflow || {
      name: 'New Workflow',
      description: '',
      isActive: false,
      steps: [],
    },
  )

  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null)
  const [showStepDialog, setShowStepDialog] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draggedStep, setDraggedStep] = useState<WorkflowStep | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate unique step ID
  const generateStepId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add new step
  const addStep = useCallback(
    (type: StepType) => {
      const newStep: WorkflowStep = {
        id: generateStepId(),
        name: `${type} Step`,
        type,
        config: getDefaultConfig(type),
        order: workflow.steps.length,
        retries: 3,
      }

      setWorkflow((prev) => ({
        ...prev,
        steps: [...prev.steps, newStep],
      }))
    },
    [workflow.steps.length],
  )

  // Remove step
  const removeStep = useCallback((stepId: string) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((step) => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index })),
    }))
  }, [])

  // Update step
  const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)),
    }))
  }, [])

  // Reorder steps (drag & drop)
  const reorderSteps = useCallback((fromIndex: number, toIndex: number) => {
    setWorkflow((prev) => {
      const newSteps = [...prev.steps]
      const [removed] = newSteps.splice(fromIndex, 1)
      newSteps.splice(toIndex, 0, removed)

      // Update order numbers
      return {
        ...prev,
        steps: newSteps.map((step, index) => ({ ...step, order: index })),
      }
    })
  }, [])

  // Handle step configuration
  const handleStepConfig = (step: WorkflowStep) => {
    setSelectedStep(step)
    setShowStepDialog(true)
  }

  // Save step configuration
  const saveStepConfig = () => {
    if (selectedStep) {
      updateStep(selectedStep.id, selectedStep)
      setShowStepDialog(false)
      setSelectedStep(null)
    }
  }

  // Execute workflow
  const executeWorkflow = async () => {
    if (!workflow.id) {
      toast.error('Please save the workflow before executing')
      return
    }

    setIsExecuting(true)
    try {
      await onExecute?.(workflow.id)
      toast.success('Workflow execution started')
    } catch (error) {
      console.error('Execution error:', error)
      toast.error('Failed to execute workflow')
    } finally {
      setIsExecuting(false)
    }
  }

  // Save workflow
  const saveWorkflow = async () => {
    setIsSaving(true)
    try {
      await onSave?.(workflow)
      toast.success('Workflow saved successfully')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save workflow')
    } finally {
      setIsSaving(false)
    }
  }

  // Export workflow
  const exportWorkflow = () => {
    const dataStr = JSON.stringify(workflow, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${workflow.name.replace(/\s+/g, '_')}_workflow.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Import workflow
  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setWorkflow(imported)
        toast.success('Workflow imported successfully')
      } catch (error) {
        toast.error('Failed to import workflow - invalid format')
      }
    }
    reader.readAsText(file)
  }

  // Drag and drop handlers
  const handleDragStart = (step: WorkflowStep) => {
    setDraggedStep(step)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStep: WorkflowStep) => {
    e.preventDefault()
    if (draggedStep && draggedStep.id !== targetStep.id) {
      const fromIndex = workflow.steps.findIndex((s) => s.id === draggedStep.id)
      const toIndex = workflow.steps.findIndex((s) => s.id === targetStep.id)
      reorderSteps(fromIndex, toIndex)
    }
    setDraggedStep(null)
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="max-w-md flex-1">
            <Label htmlFor="workflow-name">Workflow Name</Label>
            <Input
              id="workflow-name"
              value={workflow.name}
              onChange={(e) => setWorkflow((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={importWorkflow}
            />

            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-2 h-4 w-4" />
              Import
            </Button>

            <Button variant="outline" size="sm" onClick={exportWorkflow}>
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button variant="outline" onClick={saveWorkflow} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            <Button onClick={executeWorkflow} disabled={isExecuting || !workflow.id}>
              <Play className="mr-2 h-4 w-4" />
              {isExecuting ? 'Executing...' : 'Execute'}
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <Label htmlFor="workflow-description">Description</Label>
          <Textarea
            id="workflow-description"
            value={workflow.description || ''}
            onChange={(e) => setWorkflow((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Step Types Panel */}
        <div className="w-64 overflow-y-auto border-r bg-white p-4">
          <h3 className="mb-4 font-semibold">Step Types</h3>
          <div className="space-y-2">
            {STEP_TYPES.map((stepType) => (
              <Card
                key={stepType.value}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => addStep(stepType.value)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{stepType.label}</div>
                      <div className="mt-1 text-xs text-gray-500">{stepType.description}</div>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Workflow Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {workflow.steps.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-gray-400">
                  <Plus className="mx-auto h-12 w-12" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">No steps added yet</h3>
                <p className="text-gray-500">
                  Add steps from the panel on the left to build your workflow
                </p>
              </div>
            ) : (
              workflow.steps.map((step, index) => (
                <Card
                  key={step.id}
                  className="cursor-move transition-shadow hover:shadow-md"
                  draggable
                  onDragStart={() => handleDragStart(step)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, step)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-base">{step.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {step.type}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleStepConfig(step)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="text-sm text-gray-600">{getStepSummary(step)}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Step Configuration Dialog */}
      <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Step: {selectedStep?.name}</DialogTitle>
            <DialogDescription>
              Configure the settings for this {selectedStep?.type} step
            </DialogDescription>
          </DialogHeader>

          {selectedStep && <StepConfigForm step={selectedStep} onUpdate={setSelectedStep} />}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStepDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveStepConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Step Configuration Form Component
function StepConfigForm({
  step,
  onUpdate,
}: {
  step: WorkflowStep
  onUpdate: (step: WorkflowStep) => void
}) {
  const updateConfig = (key: string, value: unknown) => {
    onUpdate({
      ...step,
      config: { ...step.config, [key]: value },
    })
  }

  const updateField = (key: string, value: unknown) => {
    onUpdate({ ...step, [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Common Fields */}
      <div>
        <Label htmlFor="step-name">Step Name</Label>
        <Input
          id="step-name"
          value={step.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="step-retries">Max Retries</Label>
        <Input
          id="step-retries"
          type="number"
          min="0"
          max="10"
          value={step.retries || 3}
          onChange={(e) => updateField('retries', parseInt(e.target.value))}
          className="mt-1"
        />
      </div>

      {/* Step-specific configuration */}
      {renderStepSpecificConfig(step, updateConfig)}
    </div>
  )
}

// Helper functions
function getDefaultConfig(type: StepType) {
  switch (type) {
    case StepType.API_CALL:
      return { url: '', method: 'GET', headers: {}, body: null }
    case StepType.DELAY:
      return { duration: 1000 }
    case StepType.TRANSFORM:
      return { source: '', transformations: [] }
    case StepType.WEBHOOK:
      return { url: '', method: 'POST', headers: {}, body: null }
    case StepType.EMAIL:
      return { to: '', subject: '', body: '' }
    case StepType.CONDITIONAL:
      return { condition: null, trueStep: null, falseStep: null }
    case StepType.CUSTOM:
      return { code: '', inputs: {} }
    default:
      return {}
  }
}

function getStepSummary(step: WorkflowStep): string {
  const { type, config } = step

  switch (type) {
    case StepType.API_CALL:
      return `${config.method || 'GET'} ${config.url || 'No URL specified'}`
    case StepType.DELAY:
      return `Wait ${config.duration || 1000}ms`
    case StepType.TRANSFORM:
      return `Transform data from ${config.source || 'previous step'}`
    case StepType.WEBHOOK:
      return `${config.method || 'POST'} to ${config.url || 'webhook URL'}`
    case StepType.EMAIL:
      return `Send email to ${config.to || 'recipient'}`
    case StepType.CONDITIONAL:
      return `Execute based on condition`
    case StepType.CUSTOM:
      return `Execute custom code`
    default:
      return 'Step configuration needed'
  }
}

function renderStepSpecificConfig(
  step: WorkflowStep,
  updateConfig: (key: string, value: unknown) => void,
) {
  const { type, config } = step

  switch (type) {
    case StepType.API_CALL:
    case StepType.WEBHOOK:
      return (
        <>
          <div>
            <Label>URL</Label>
            <Input
              value={String(config.url || '')}
              onChange={(e) => updateConfig('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Method</Label>
            <Select
              value={String(config.method || 'GET')}
              onValueChange={(value) => updateConfig('method', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Request Body (JSON)</Label>
            <Textarea
              value={config.body ? JSON.stringify(config.body, null, 2) : ''}
              onChange={(e) => {
                try {
                  updateConfig('body', JSON.parse(e.target.value))
                } catch {
                  // Invalid JSON, store as string for now
                }
              }}
              placeholder='{"key": "value"}'
              rows={4}
              className="mt-1 font-mono"
            />
          </div>
        </>
      )

    case StepType.DELAY:
      return (
        <div>
          <Label>Duration (milliseconds)</Label>
          <Input
            type="number"
            min="0"
            value={Number(config.duration || 1000)}
            onChange={(e) => updateConfig('duration', parseInt(e.target.value))}
            className="mt-1"
          />
        </div>
      )

    case StepType.EMAIL:
      return (
        <>
          <div>
            <Label>To</Label>
            <Input
              value={String(config.to || '')}
              onChange={(e) => updateConfig('to', e.target.value)}
              placeholder="recipient@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              value={String(config.subject || '')}
              onChange={(e) => updateConfig('subject', e.target.value)}
              placeholder="Email subject"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea
              value={String(config.body || '')}
              onChange={(e) => updateConfig('body', e.target.value)}
              placeholder="Email content..."
              rows={4}
              className="mt-1"
            />
          </div>
        </>
      )

    default:
      return (
        <div>
          <Label>Configuration (JSON)</Label>
          <Textarea
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
              try {
                updateConfig('', JSON.parse(e.target.value))
              } catch {
                // Invalid JSON, ignore for now
              }
            }}
            rows={6}
            className="mt-1 font-mono"
          />
        </div>
      )
  }
}
