import {
  StateGraph,
  START,
  END,
  MemorySaver,
  MessagesValue,
  StateSchema,
} from '@langchain/langgraph';
import { AgentStateAnnotation, type AgentState } from './state.ts';
import {
  createIdentifyIntentNode,
  createCreateEventNode,
  createListEventsNode,
  createDeleteEventNode,
  createEditEventNode,
  createClarifyNode,
  createConfirmNode,
  createMessageGeneratorNode,
} from './nodes/index.ts';
import { type ILlmService } from '../services/llm.interface.ts';
import { type CalendarService } from '../../calendar/calendar.service.ts';

export interface GraphDependencies {
  llmService: ILlmService;
  calendarService: CalendarService;
}

export function createAgentGraph(deps: GraphDependencies) {
  const { llmService, calendarService } = deps;

  const InputSchema = new StateSchema({
    messages: MessagesValue,
  });

  const workflow = new StateGraph({ state: AgentStateAnnotation, input: InputSchema })
    // Register nodes
    .addNode('identifyIntent', createIdentifyIntentNode(llmService))
    .addNode('createEvent', createCreateEventNode(calendarService))
    .addNode('listEvents', createListEventsNode(calendarService))
    .addNode('deleteEvent', createDeleteEventNode(calendarService))
    .addNode('editEvent', createEditEventNode(calendarService))
    .addNode('clarify', createClarifyNode(llmService))
    .addNode('confirm', createConfirmNode(calendarService, llmService))
    .addNode('messageGenerator', createMessageGeneratorNode(llmService))

    // Entry point: skip intent classification if awaiting confirmation
    .addConditionalEdges(START, routeFromStart)

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

function routeFromStart(state: AgentState): string {
  if (state.pendingConfirmation) return 'confirm';
  return 'identifyIntent';
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
