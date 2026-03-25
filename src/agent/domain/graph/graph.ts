import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { AgentStateAnnotation, type AgentState } from './state.js';
import {
  createIdentifyIntentNode,
  createCreateEventNode,
  createListEventsNode,
  createDeleteEventNode,
  createEditEventNode,
  createClarifyNode,
  createConfirmNode,
  createMessageGeneratorNode,
} from './nodes/index.js';
import { type LlmService } from '../services/llm.service.js';
import { type CalendarApi } from '../../../calendar/public/calendar.api.js';

export interface GraphDependencies {
  llmService: LlmService;
  calendarApi: CalendarApi;
}

export function createAgentGraph(deps: GraphDependencies) {
  const { llmService, calendarApi } = deps;

  const workflow = new StateGraph(AgentStateAnnotation)
    // Register nodes
    .addNode('identifyIntent', createIdentifyIntentNode(llmService))
    .addNode('createEvent', createCreateEventNode(calendarApi))
    .addNode('listEvents', createListEventsNode(calendarApi))
    .addNode('deleteEvent', createDeleteEventNode(calendarApi))
    .addNode('editEvent', createEditEventNode(calendarApi))
    .addNode('clarify', createClarifyNode(llmService))
    .addNode('confirm', createConfirmNode(calendarApi, llmService))
    .addNode('messageGenerator', createMessageGeneratorNode(llmService))

    // Entry point
    .addEdge(START, 'identifyIntent')

    // Route by intent after identification
    .addConditionalEdges('identifyIntent', routeByIntent)

    // Route action nodes to messageGenerator or clarify/confirm
    .addConditionalEdges('createEvent', routeAfterCreate)
    .addConditionalEdges('deleteEvent', routeAfterDelete)
    .addConditionalEdges('editEvent', routeAfterEdit)

    // List always goes to messageGenerator
    .addEdge('listEvents', 'messageGenerator')

    // Clarify and confirm go to messageGenerator
    .addEdge('clarify', 'messageGenerator')
    .addEdge('confirm', 'messageGenerator')

    // Final node
    .addEdge('messageGenerator', END);

  const memory = new MemorySaver();
  return workflow.compile({ checkpointer: memory });
}

function routeByIntent(state: AgentState): string {
  switch (state.intent) {
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
