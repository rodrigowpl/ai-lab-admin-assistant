import { type AgentState } from '../state.ts';
import { type CalendarService } from '../../../calendar/calendar.service.ts';

export function createListEventsNode(calendarApi: CalendarService) {
  return async (state: AgentState): Promise<Partial<AgentState>> => {
    if (state.intent === 'check_availability') {
      if (!state.eventDateTime) {
        return {
          actionSuccess: false,
          actionError: 'missing_info',
        };
      }

      const result = await calendarApi.checkAvailability(
        state.eventDateTime,
        state.eventDuration ?? 30,
        state.calendarId,
      );

      if (result.isFailure()) {
        return {
          actionSuccess: false,
          actionError: result.error.message,
        };
      }

      return {
        actionSuccess: true,
        actionResult: result.value ? [] : undefined,
        actionError: result.value
          ? undefined
          : 'Há eventos nesse horário',
      };
    }

    // List events
    const dateRange = state.queryDateRange ?? getDefaultDateRange();

    const result = await calendarApi.listEvents({
      startDate: dateRange.start,
      endDate: dateRange.end,
      calendarId: state.calendarId,
    });

    if (result.isFailure()) {
      return {
        actionSuccess: false,
        actionError: result.error.message,
      };
    }

    return {
      actionSuccess: true,
      actionResult: result.value,
    };
  };
}

function getDefaultDateRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
