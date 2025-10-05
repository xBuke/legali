import { db } from './db'

export interface TimelineEventData {
  type: 'CREATED' | 'STATUS_CHANGED' | 'DOCUMENT_ADDED' | 'HEARING_SCHEDULED' | 'NOTE_ADDED' | 'TASK_CREATED' | 'TASK_COMPLETED' | 'ASSIGNED' | 'UNASSIGNED'
  title: string
  description?: string
  metadata?: any
  caseId: string
  createdById: string
  organizationId: string
}

export async function createTimelineEvent(data: TimelineEventData) {
  try {
    const timelineEvent = await db.caseTimeline.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        caseId: data.caseId,
        createdById: data.createdById,
        organizationId: data.organizationId,
      },
    })
    return timelineEvent
  } catch (error) {
    console.error('Error creating timeline event:', error)
    throw error
  }
}

export async function createCaseCreatedEvent(
  caseId: string,
  caseNumber: string,
  createdById: string,
  organizationId: string
) {
  return createTimelineEvent({
    type: 'CREATED',
    title: `Predmet ${caseNumber} je kreiran`,
    description: 'Novi predmet je dodan u sustav',
    caseId,
    createdById,
    organizationId,
  })
}

export async function createStatusChangedEvent(
  caseId: string,
  caseNumber: string,
  oldStatus: string,
  newStatus: string,
  createdById: string,
  organizationId: string
) {
  const statusLabels = {
    OPEN: 'Otvoren',
    IN_PROGRESS: 'U obradi',
    ON_HOLD: 'Na čekanju',
    CLOSED_WON: 'Zatvoren - Dobijen',
    CLOSED_LOST: 'Zatvoren - Izgubljen',
    CLOSED_SETTLED: 'Zatvoren - Nagodba',
    ARCHIVED: 'Arhiviran',
  }

  return createTimelineEvent({
    type: 'STATUS_CHANGED',
    title: `Status predmeta ${caseNumber} promijenjen`,
    description: `Status promijenjen s "${statusLabels[oldStatus as keyof typeof statusLabels] || oldStatus}" na "${statusLabels[newStatus as keyof typeof statusLabels] || newStatus}"`,
    metadata: { oldStatus, newStatus },
    caseId,
    createdById,
    organizationId,
  })
}

export async function createAssignmentEvent(
  caseId: string,
  caseNumber: string,
  assignedTo: string | null,
  assignedToName: string | null,
  createdById: string,
  organizationId: string
) {
  if (assignedTo) {
    return createTimelineEvent({
      type: 'ASSIGNED',
      title: `Predmet ${caseNumber} dodijeljen`,
      description: `Predmet je dodijeljen korisniku ${assignedToName}`,
      metadata: { assignedTo, assignedToName },
      caseId,
      createdById,
      organizationId,
    })
  } else {
    return createTimelineEvent({
      type: 'UNASSIGNED',
      title: `Predmet ${caseNumber} uklonjen`,
      description: 'Predmet više nije dodijeljen nikome',
      metadata: { assignedTo: null },
      caseId,
      createdById,
      organizationId,
    })
  }
}

export async function createHearingScheduledEvent(
  caseId: string,
  caseNumber: string,
  hearingDate: Date,
  createdById: string,
  organizationId: string
) {
  return createTimelineEvent({
    type: 'HEARING_SCHEDULED',
    title: `Ročište zakazano za predmet ${caseNumber}`,
    description: `Sljedeće ročište: ${hearingDate.toLocaleDateString('hr-HR')}`,
    metadata: { hearingDate: hearingDate.toISOString() },
    caseId,
    createdById,
    organizationId,
  })
}
