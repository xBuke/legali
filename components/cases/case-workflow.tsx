'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Workflow, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowRight, 
  Clock, 
  FileText, 
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface WorkflowStage {
  id: string
  name: string
  status: string
  order: number
  requiredDocuments: string[]
  estimatedDuration: number
  nextStages: string[]
  description?: string
}

interface CaseWorkflow {
  id: string
  name: string
  stages: WorkflowStage[]
  isDefault: boolean
  description?: string
  createdAt: Date
  updatedAt: Date
}

interface CaseWorkflowProps {
  caseId: string
  currentWorkflow?: CaseWorkflow
  onWorkflowChange?: (workflow: CaseWorkflow) => void
}

const defaultWorkflows: CaseWorkflow[] = [
  {
    id: 'civil-litigation',
    name: 'Građanski spor',
    description: 'Standardni workflow za građanske sporove',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    stages: [
      {
        id: 'initial-consultation',
        name: 'Početna konzultacija',
        status: 'OPEN',
        order: 1,
        requiredDocuments: ['Ugovor o zastupanju', 'Ovlaštenje'],
        estimatedDuration: 1,
        nextStages: ['case-analysis'],
        description: 'Početna konzultacija s klijentom'
      },
      {
        id: 'case-analysis',
        name: 'Analiza predmeta',
        status: 'OPEN',
        order: 2,
        requiredDocuments: ['Dokumenti predmeta', 'Pravni stav'],
        estimatedDuration: 3,
        nextStages: ['document-preparation'],
        description: 'Detaljna analiza predmeta i priprema strategije'
      },
      {
        id: 'document-preparation',
        name: 'Priprema dokumenata',
        status: 'OPEN',
        order: 3,
        requiredDocuments: ['Tužba', 'Dokazi'],
        estimatedDuration: 5,
        nextStages: ['filing'],
        description: 'Priprema svih potrebnih dokumenata'
      },
      {
        id: 'filing',
        name: 'Podnošenje',
        status: 'OPEN',
        order: 4,
        requiredDocuments: ['Potvrda o podnošenju'],
        estimatedDuration: 1,
        nextStages: ['court-proceedings'],
        description: 'Podnošenje tužbe na sud'
      },
      {
        id: 'court-proceedings',
        name: 'Sudski postupak',
        status: 'OPEN',
        order: 5,
        requiredDocuments: ['Zapisnici', 'Odluke'],
        estimatedDuration: 30,
        nextStages: ['resolution'],
        description: 'Vodenje sudskog postupka'
      },
      {
        id: 'resolution',
        name: 'Rješavanje',
        status: 'OPEN',
        order: 6,
        requiredDocuments: ['Presuda', 'Izvršni list'],
        estimatedDuration: 2,
        nextStages: [],
        description: 'Završetak predmeta'
      }
    ]
  },
  {
    id: 'criminal-defense',
    name: 'Kazneni postupak',
    description: 'Workflow za kaznene postupke',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    stages: [
      {
        id: 'arrest-consultation',
        name: 'Konzultacija nakon uhićenja',
        status: 'OPEN',
        order: 1,
        requiredDocuments: ['Ovlaštenje', 'Kopija optužnice'],
        estimatedDuration: 1,
        nextStages: ['investigation'],
        description: 'Hitna konzultacija nakon uhićenja'
      },
      {
        id: 'investigation',
        name: 'Istraga',
        status: 'OPEN',
        order: 2,
        requiredDocuments: ['Izvještaji', 'Dokazi'],
        estimatedDuration: 15,
        nextStages: ['indictment'],
        description: 'Prateće istrage i priprema obrane'
      },
      {
        id: 'indictment',
        name: 'Optužnica',
        status: 'OPEN',
        order: 3,
        requiredDocuments: ['Optužnica', 'Odbrana'],
        estimatedDuration: 7,
        nextStages: ['trial'],
        description: 'Analiza optužnice i priprema odbrane'
      },
      {
        id: 'trial',
        name: 'Suđenje',
        status: 'OPEN',
        order: 4,
        requiredDocuments: ['Zapisnici', 'Presuda'],
        estimatedDuration: 10,
        nextStages: ['appeal'],
        description: 'Vodenje suđenja'
      },
      {
        id: 'appeal',
        name: 'Žalba',
        status: 'OPEN',
        order: 5,
        requiredDocuments: ['Žalba', 'Odluka'],
        estimatedDuration: 5,
        nextStages: [],
        description: 'Podnošenje žalbe ako je potrebno'
      }
    ]
  }
]

export function CaseWorkflow({ caseId, currentWorkflow, onWorkflowChange }: CaseWorkflowProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<CaseWorkflow | null>(currentWorkflow || null)
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState<Partial<CaseWorkflow>>({
    name: '',
    description: '',
    stages: []
  })

  const handleWorkflowSelect = (workflow: CaseWorkflow) => {
    setSelectedWorkflow(workflow)
    onWorkflowChange?.(workflow)
  }

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'BLOCKED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStageStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />
      case 'PENDING': return <AlertCircle className="h-4 w-4" />
      case 'BLOCKED': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Workflow Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Workflow predmeta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultWorkflows.map((workflow) => (
                <Card 
                  key={workflow.id}
                  className={`cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleWorkflowSelect(workflow)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {workflow.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {workflow.stages.length} faza
                          </Badge>
                          {workflow.isDefault && (
                            <Badge variant="secondary">Zadani</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={isCreatingWorkflow} onOpenChange={setIsCreatingWorkflow}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Stvori novi workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Stvori novi workflow</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workflow-name">Naziv workflow-a</Label>
                    <Input
                      id="workflow-name"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                      placeholder="npr. Trgovački spor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workflow-description">Opis</Label>
                    <Textarea
                      id="workflow-description"
                      value={newWorkflow.description}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                      placeholder="Opis workflow-a..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatingWorkflow(false)}>
                      Odustani
                    </Button>
                    <Button onClick={() => {
                      // TODO: Implement workflow creation
                      setIsCreatingWorkflow(false)
                    }}>
                      Stvori workflow
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Stages */}
      {selectedWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Faze workflow-a: {selectedWorkflow.name}</span>
              <Badge variant="outline">
                {selectedWorkflow.stages.length} faza
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedWorkflow.stages.map((stage, index) => (
                <div key={stage.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      {stage.order}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{stage.name}</h3>
                      <Badge className={getStageStatusColor(stage.status)}>
                        {getStageStatusIcon(stage.status)}
                        <span className="ml-1">{stage.status}</span>
                      </Badge>
                    </div>
                    
                    {stage.description && (
                      <p className="text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{stage.estimatedDuration} dana</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{stage.requiredDocuments.length} dokumenata</span>
                      </div>
                    </div>
                    
                    {stage.requiredDocuments.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Potrebni dokumenti:</p>
                        <div className="flex flex-wrap gap-1">
                          {stage.requiredDocuments.map((doc, docIndex) => (
                            <Badge key={docIndex} variant="outline" className="text-xs">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {index < selectedWorkflow.stages.length - 1 && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-8">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}