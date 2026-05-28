import type { RecordPayload } from '../types/SystemTaxonomyConfig';

export type AWFNodeType = 'START' | 'TASK' | 'DECISION' | 'END';

export interface AWFNode {
  id: string;
  name: string;
  type: AWFNodeType;
  
  // For TASK nodes
  assignedUserOrGroup?: string; 
  
  // For DECISION nodes
  decisionFieldId?: string; 
  decisionRules?: { conditionValue: any; targetNodeId: string }[];
  defaultTargetNodeId?: string;
  
  // Custom metadata for AWF rendering coordinates in Tailwind UI
  x?: number;
  y?: number;
}

export interface AWFTransition {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  ruleExpression?: string; // Optional description of conditions
}

export interface AWFWorkflow {
  id: string;
  name: string;
  structureId: string;
  nodes: AWFNode[];
  transitions: AWFTransition[];
}

export interface AWFInstanceState {
  recordId: string;
  currentNodeId: string;
  isCompleted: boolean;
  history: { nodeId: string; timestamp: string }[];
}

/**
 * EXACT TELEMETRY INTERFACE COMPLIANCE CONTRACT REQUIRED BY SYSTEM SPEC
 */
export interface DiagnosticTelemetry {
  id: string;
  timestamp: string;
  applicationContext: string; // e.g., "App_Risk_Register_01"
  executionPhase: 'FIELD_VALIDATION' | 'CALCULATION_ENGINE' | 'DATA_DRIVEN_EVENT' | 'STATE_TRANSITION' | 'ACCESS_CONTROL';
  traceDetails: {
    evaluatedExpression?: string;
    currentTokens?: Record<string, any>;
    databaseQueryMock?: string;
  };
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL_FAIL';
  errorMessage?: string;
}

export class AWFEngine {
  workflow: AWFWorkflow;
  constructor(workflow: AWFWorkflow) {
    this.workflow = workflow;
  }

  public processTransition(
    instanceState: AWFInstanceState,
    record: RecordPayload,
    userAction?: 'APPROVE' | 'REJECT' | 'SUBMIT'
  ): {
    newState: AWFInstanceState;
    telemetry: DiagnosticTelemetry;
  } {
    const timestamp = new Date().toISOString();
    const telemetryId = 'TEL_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const appCtx = `${record.structureId}_${record.id}`;

    const currentNode = this.workflow.nodes.find((n) => n.id === instanceState.currentNodeId);
    if (!currentNode) {
      return {
        newState: instanceState,
        telemetry: {
          id: telemetryId,
          timestamp,
          applicationContext: appCtx,
          executionPhase: 'STATE_TRANSITION',
          traceDetails: { currentTokens: { currentNodeId: instanceState.currentNodeId } },
          status: 'CRITICAL_FAIL',
          errorMessage: `Workflow node error: Node '${instanceState.currentNodeId}' not found in configuration definition.`,
        },
      };
    }

    if (currentNode.type === 'END') {
      return {
        newState: { ...instanceState, isCompleted: true },
        telemetry: {
          id: telemetryId,
          timestamp,
          applicationContext: appCtx,
          executionPhase: 'STATE_TRANSITION',
          traceDetails: { currentTokens: { currentNodeId: currentNode.id, isCompleted: true } },
          status: 'SUCCESS',
        },
      };
    }

    let targetNodeId: string | undefined;
    let traceMsg = '';

    if (currentNode.type === 'START') {
      // START node always routes to its direct transition target
      const transition = this.workflow.transitions.find((t) => t.sourceNodeId === currentNode.id);
      targetNodeId = transition?.targetNodeId;
      traceMsg = `Unconditional transition from Start Node '${currentNode.name}' to Node '${targetNodeId}'`;
    } 
    else if (currentNode.type === 'TASK') {
      // TASK nodes route depending on manual user actions
      const transitions = this.workflow.transitions.filter((t) => t.sourceNodeId === currentNode.id);
      
      if (userAction === 'REJECT') {
        // Typically loops back to draft or previous state
        const rejectTrans = transitions.find((t) => t.ruleExpression?.toUpperCase().includes('REJECT') || t.targetNodeId.toLowerCase().includes('draft') || t.targetNodeId.toLowerCase().includes('review'));
        targetNodeId = rejectTrans?.targetNodeId || transitions[transitions.length - 1]?.targetNodeId;
        traceMsg = `Action 'REJECT' processed at Task Node '${currentNode.name}'. Routing back to node '${targetNodeId}'`;
      } else {
        // DEFAULT action: APPROVE or SUBMIT routes forward
        const approveTrans = transitions.find((t) => t.ruleExpression?.toUpperCase().includes('APPROVE') || t.ruleExpression?.toUpperCase().includes('SUBMIT') || !t.ruleExpression);
        targetNodeId = approveTrans?.targetNodeId || transitions[0]?.targetNodeId;
        traceMsg = `Action '${userAction || 'SUBMIT'}' processed at Task Node '${currentNode.name}'. Routing forward to node '${targetNodeId}'`;
      }
    } 
    else if (currentNode.type === 'DECISION') {
      // DECISION nodes check record state field values
      const val = currentNode.decisionFieldId ? record.values[currentNode.decisionFieldId] : undefined;
      traceMsg = `Evaluating Decision Node '${currentNode.name}'. Field [${currentNode.decisionFieldId}] current value: '${val}'`;

      const matchedRule = currentNode.decisionRules?.find((r) => String(r.conditionValue) === String(val));
      if (matchedRule) {
        targetNodeId = matchedRule.targetNodeId;
        traceMsg += `. Condition matched value '${val}' -> routing to node '${targetNodeId}'`;
      } else {
        targetNodeId = currentNode.defaultTargetNodeId;
        traceMsg += `. No custom condition matched. Falling back to default target node '${targetNodeId}'`;
      }
    }

    if (!targetNodeId) {
      return {
        newState: instanceState,
        telemetry: {
          id: telemetryId,
          timestamp,
          applicationContext: appCtx,
          executionPhase: 'STATE_TRANSITION',
          traceDetails: {
            evaluatedExpression: currentNode.type === 'DECISION' ? `[${currentNode.decisionFieldId}] == ...` : undefined,
            currentTokens: { currentNodeId: currentNode.id, recordValues: record.values },
          },
          status: 'CRITICAL_FAIL',
          errorMessage: `Workflow Routing Deadlock: Node '${currentNode.name}' could not resolve next transition path.`,
        },
      };
    }

    // Node successfully resolved!
    const targetNode = this.workflow.nodes.find((n) => n.id === targetNodeId);
    const isTargetEnd = targetNode?.type === 'END';

    const newState: AWFInstanceState = {
      recordId: instanceState.recordId,
      currentNodeId: targetNodeId,
      isCompleted: isTargetEnd,
      history: [...instanceState.history, { nodeId: targetNodeId, timestamp }],
    };

    return {
      newState,
      telemetry: {
        id: telemetryId,
        timestamp,
        applicationContext: appCtx,
        executionPhase: 'STATE_TRANSITION',
        traceDetails: {
          evaluatedExpression: traceMsg,
          currentTokens: {
            previousNode: currentNode.name,
            nextNode: targetNode?.name || targetNodeId,
            activeRecordState: record.values,
          },
        },
        status: 'SUCCESS',
      },
    };
  }
}
