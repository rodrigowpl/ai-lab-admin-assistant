import { Annotation, MessagesAnnotation } from '@langchain/langgraph';
import { type CalendarEvent, type TimeSlot } from '../../calendar/calendar.types.ts';

export const AgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  // Intent classification
  intent: Annotation<
    | 'create'
    | 'list'
    | 'delete'
    | 'edit'
    | 'check_availability'
    | 'unknown'
    | undefined
  >,

  // Extracted event data
  eventSummary: Annotation<string | undefined>,
  eventDateTime: Annotation<Date | undefined>,
  eventDuration: Annotation<number | undefined>,
  calendarId: Annotation<string | undefined>,
  targetEventId: Annotation<string | undefined>,

  // Query context
  queryDateRange: Annotation<{ start: Date; end: Date } | undefined>,

  // Flow control
  matchedEvents: Annotation<CalendarEvent[] | undefined>,
  pendingConfirmation: Annotation<
    'delete' | 'create_conflict' | undefined
  >,

  // Action result
  actionSuccess: Annotation<boolean | undefined>,
  actionError: Annotation<string | undefined>,
  actionResult: Annotation<
    CalendarEvent | CalendarEvent[] | TimeSlot[] | undefined
  >,
});

export type AgentState = typeof AgentStateAnnotation.State;
