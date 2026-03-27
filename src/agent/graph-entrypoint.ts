/**
 * Entrypoint for LangGraph dev server (langgraph.json).
 * Creates the agent graph with real dependencies configured from env vars.
 */
import "dotenv/config";
import { buildGraph } from "./graph/factory.ts";

export const graph = async () => buildGraph();
