import { type AgentState } from '../state.ts';
import { type CalendarService } from '../../../calendar/calendar.service.ts';

export function createCreateEventNode(calendarApi: CalendarService) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    // Check for missing required info
    if (!state.eventSummary || !state.eventDateTime) {
      return {
        actionSuccess: false,
        actionError: 'missing_info',
      };
    }

    const result = await calendarApi.createEvent({
      summary: state.eventSummary,
      startDateTime: state.eventDateTime,
      durationMinutes: state.eventDuration,
      calendarId: state.calendarId,
    });

    if (result.isFailure()) {
      const error = result.error;
      // Conflict — details contain free slots
      if (error.status === 409) {
        return {
          pendingConfirmation: 'create_conflict',
          actionSuccess: false,
          actionError: error.message,
          actionResult: undefined,
        };
      }
      return {
        actionSuccess: false,
        actionError: error.message,
      };
    }

    return {
      actionSuccess: true,
      actionResult: result.value,
    };
  };
}
