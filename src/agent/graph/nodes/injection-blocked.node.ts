import { type AgentState } from '../state.ts';

export function injectionBlockedNode(_state: AgentState): Partial<AgentState> {
  return {
    actionError: 'injection_blocked',
    actionSuccess: false,
  };
}
