import {
  StateGraph,
  START,
  END,
  MemorySaver,
  MessagesValue,
  StateSchema,
} from '@langchain/langgraph';
import { z } from 'zod';
import { config } from '../../lib/config.ts';
import { AgentStateAnnotation, type AgentState, type UserRole } from './state.ts';
import {
  createIdentifyIntentNode,
  createCreateEventNode,
  createListEventsNode,
  createDeleteEventNode,
  createEditEventNode,
  createClarifyNode,
  createConfirmNode,
  createMessageGeneratorNode,
  createSafeguardCheckNode,
  injectionBlockedNode,
} from './nodes/index.ts';
import { type ILlmService } from '../services/llm.interface.ts';
import { type CalendarService } from '../../calendar/calendar.service.ts';
import { type ISafeguardService } from '../services/safeguard.service.ts';

export interface GraphDependencies {
  llmService: ILlmService;
  calendarService: CalendarService;
  safeguardService?: ISafeguardService;
}

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<string>> = {
  admin: new Set(['create', 'list', 'delete', 'edit', 'check_availability', 'unknown']),
  member: new Set(['list', 'check_availability', 'unknown']),
};

// Pass-through safeguard for when no service is provided (tests)
const passthroughSafeguard: ISafeguardService = {
  check: async () => ({ safe: true, reason: 'No safeguard service configured' }),
};

export function createAgentGraph(deps: GraphDependencies) {
  const { llmService, calendarService, safeguardService = passthroughSafeguard } = deps;

  const InputSchema = new StateSchema({
    messages: MessagesValue,
    userRole: z.enum(['admin', 'member']).default(config.defaults.userRole),
    guardrailsEnabled: z.boolean().default(true),
  });

  const workflow = new StateGraph({ state: AgentStateAnnotation, input: InputSchema })
    // Register nodes
    .addNode('safeguardCheck', createSafeguardCheckNode(safeguardService))
    .addNode('injectionBlocked', injectionBlockedNode)
    .addNode('identifyIntent', createIdentifyIntentNode(llmService))
    .addNode('createEvent', createCreateEventNode(calendarService))
    .addNode('listEvents', createListEventsNode(calendarService))
    .addNode('deleteEvent', createDeleteEventNode(calendarService))
    .addNode('editEvent', createEditEventNode(calendarService))
    .addNode('clarify', createClarifyNode(llmService))
    .addNode('confirm', createConfirmNode(calendarService, llmService))
    .addNode('messageGenerator', createMessageGeneratorNode(llmService))
    .addNode('permissionDenied', permissionDeniedNode)

    // Entry point: always run safeguard first
    .addEdge(START, 'safeguardCheck')

    // Route after safeguard: blocked, confirm, or identify intent
    .addConditionalEdges('safeguardCheck', routeAfterSafeguard)

    // Route by intent after identification (includes RBAC gate)
    .addConditionalEdges('identifyIntent', routeByIntent)

    // Route action nodes to messageGenerator or clarify/confirm
    .addConditionalEdges('createEvent', routeAfterCreate)
    .addConditionalEdges('deleteEvent', routeAfterDelete)
    .addConditionalEdges('editEvent', routeAfterEdit)

    // List always goes to messageGenerator
    .addEdge('listEvents', 'messageGenerator')

    // Terminal edges to messageGenerator
    .addEdge('clarify', 'messageGenerator')
    .addEdge('confirm', 'messageGenerator')
    .addEdge('permissionDenied', 'messageGenerator')
    .addEdge('injectionBlocked', 'messageGenerator')

    // Final node
    .addEdge('messageGenerator', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
}

function permissionDeniedNode(state: AgentState): Partial<AgentState> {
  return {
    actionError: 'permission_denied',
    actionSuccess: false,
  };
}

function routeAfterSafeguard(state: AgentState): string {
  if (state.safeguardResult && !state.safeguardResult.safe) {
    return 'injectionBlocked';
  }
  if (state.pendingConfirmation) return 'confirm';
  return 'identifyIntent';
}

function routeByIntent(state: AgentState): string {
  const role = state.userRole ?? config.defaults.userRole;
  const intent = state.intent ?? 'unknown';
  const allowed = ROLE_PERMISSIONS[role];

  if (!allowed.has(intent)) {
    return 'permissionDenied';
  }

  switch (intent) {
    case 'create':
      return 'createEvent';
    case 'list':
    case 'check_availability':
      return 'listEvents';
    case 'delete':
      return 'deleteEvent';
    case 'edit':
      return 'editEvent';
    default:
      return 'clarify';
  }
}

function routeAfterCreate(state: AgentState): string {
  if (state.actionError === 'missing_info') return 'clarify';
  if (state.pendingConfirmation === 'create_conflict') return 'messageGenerator';
  return 'messageGenerator';
}

function routeAfterDelete(state: AgentState): string {
  if (state.actionError === 'missing_info') return 'clarify';
  if (state.actionError === 'multiple_events') return 'clarify';
  if (state.pendingConfirmation === 'delete') return 'messageGenerator';
  return 'messageGenerator';
}

function routeAfterEdit(state: AgentState): string {
  if (state.actionError === 'missing_info') return 'clarify';
  if (state.actionError === 'multiple_events') return 'clarify';
  if (state.pendingConfirmation === 'create_conflict') return 'messageGenerator';
  return 'messageGenerator';
}
