import { Annotation } from '@langchain/langgraph';
import { type BaseMessage } from '@langchain/core/messages';
import { type CalendarEvent, type TimeSlot } from '../../../calendar/domain/models/index.js';

export const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),

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
