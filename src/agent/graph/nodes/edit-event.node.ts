import { type AgentState } from '../state.ts';
import { type CalendarService } from '../../../calendar/calendar.service.ts';

export function createEditEventNode(calendarApi: CalendarService) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    const query = state.eventSummary ?? '';

    if (!query) {
      return {
        actionSuccess: false,
        actionError: 'missing_info',
      };
    }

    const searchResult = await calendarApi.findEventsByQuery(
      query,
      state.calendarId,
    );

    if (searchResult.isFailure()) {
      return {
        actionSuccess: false,
        actionError: searchResult.error.message,
      };
    }

    const events = searchResult.value;

    if (events.length === 0) {
      return {
        actionSuccess: false,
        actionError: 'Evento não encontrado',
      };
    }

    if (events.length > 1) {
      return {
        matchedEvents: events,
        actionSuccess: false,
        actionError: 'multiple_events',
      };
    }

    // Single match — apply updates
    const event = events[0];
    const updateResult = await calendarApi.updateEvent(
      event.id,
      {
        summary: state.eventSummary !== event.summary ? state.eventSummary : undefined,
        startDateTime: state.eventDateTime,
        durationMinutes: state.eventDuration,
      },
      state.calendarId,
    );

    if (updateResult.isFailure()) {
      if (updateResult.error.status === 409) {
        return {
          pendingConfirmation: 'create_conflict',
          actionSuccess: false,
          actionError: updateResult.error.message,
        };
      }
      return {
        actionSuccess: false,
        actionError: updateResult.error.message,
      };
    }

    return {
      actionSuccess: true,
      actionResult: updateResult.value,
    };
  };
}
