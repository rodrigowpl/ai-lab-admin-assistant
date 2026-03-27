import { type AgentState } from '../state.ts';
import { type CalendarService } from '../../../calendar/calendar.service.ts';

export function createDeleteEventNode(calendarApi: CalendarService) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    // Search by summary or date
    const query = state.eventSummary ?? '';

    if (!query && !state.eventDateTime) {
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

    // Filter by date if provided
    let matched = events;
    if (state.eventDateTime) {
      const targetTime = state.eventDateTime.getTime();
      matched = events.filter(
        (e) => Math.abs(e.startDateTime.getTime() - targetTime) < 3600000,
      );
    }

    if (matched.length === 0) {
      return {
        actionSuccess: false,
        actionError: 'Evento não encontrado',
      };
    }

    if (matched.length > 1) {
      return {
        matchedEvents: matched,
        actionSuccess: false,
        actionError: 'multiple_events',
      };
    }

    // Single match — ask for confirmation
    return {
      matchedEvents: matched,
      pendingConfirmation: 'delete',
      targetEventId: matched[0].id,
    };
  };
}
