import type { Field, RecordPayload } from '../types/SystemTaxonomyConfig';

export interface DDECondition {
  fieldId: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';
  value: any;
}

export interface DDEAction {
  targetFieldId: string;
  type: 'SET_VISIBILITY' | 'SET_REQUIRED' | 'SET_READ_ONLY' | 'SET_VALUE';
  value: any; // true/false for states; arbitrary value for SET_VALUE
}

export interface DDERule {
  id: string;
  name: string;
  triggerFieldIds: string[]; // Local fields whose modification evaluates this rule
  conditions: DDECondition[];
  conjunction: 'AND' | 'OR';
  actions: DDEAction[];
}

export interface FieldRuntimeState {
  isHidden: boolean;
  isRequired: boolean;
  isReadOnly: boolean;
  valueOverride?: any;
}

/**
 * EVALUATES A SINGLE CONDITIONAL DDE FACTOR
 */
export function evaluateDDECondition(cond: DDECondition, record: RecordPayload): boolean {
  const actualValue = record.values[cond.fieldId];
  const targetValue = cond.value;

  if (actualValue === undefined || actualValue === null) {
    if (cond.operator === 'NOT_EQUALS') {
      return targetValue !== null && targetValue !== undefined;
    }
    return false;
  }

  switch (cond.operator) {
    case 'EQUALS':
      return String(actualValue) === String(targetValue);
    case 'NOT_EQUALS':
      return String(actualValue) !== String(targetValue);
    case 'GREATER_THAN':
      return Number(actualValue) > Number(targetValue);
    case 'LESS_THAN':
      return Number(actualValue) < Number(targetValue);
    case 'CONTAINS':
      if (Array.isArray(actualValue)) {
        return actualValue.some(v => String(v).toLowerCase() === String(targetValue).toLowerCase());
      }
      return String(actualValue).toLowerCase().includes(String(targetValue).toLowerCase());
    default:
      return false;
  }
}

/**
 * THE DDE EVALUATION ENGINE
 * Process rules sequentially and computes the final override state of every field.
 */
export class DDEEngine {
  rules: DDERule[];
  constructor(rules: DDERule[]) {
    this.rules = rules;
  }

  public evaluateRules(
    record: RecordPayload,
    fields: Field[]
  ): {
    fieldStates: Record<string, FieldRuntimeState>;
    logs: string[];
  } {
    const logs: string[] = [];
    
    // Initialize default states based on standard field configs
    const fieldStates: Record<string, FieldRuntimeState> = {};
    fields.forEach((f) => {
      fieldStates[f.id] = {
        isHidden: f.isHidden,
        isRequired: f.isRequired,
        isReadOnly: f.isReadOnly,
      };
    });

    // Process every rule
    for (const rule of this.rules) {
      if (rule.conditions.length === 0) continue;

      let rulePassed = false;
      const conditionResults = rule.conditions.map((c) => evaluateDDECondition(c, record));

      if (rule.conjunction === 'AND') {
        rulePassed = conditionResults.every((r) => r);
      } else {
        rulePassed = conditionResults.some((r) => r);
      }

      if (rulePassed) {
        logs.push(`DDE Evaluator: Rule '${rule.name}' triggered on record ${record.id}`);

        for (const action of rule.actions) {
          const state = fieldStates[action.targetFieldId];
          if (!state) continue;

          switch (action.type) {
            case 'SET_VISIBILITY':
              // value true -> show (isHidden = false), value false -> hide (isHidden = true)
              state.isHidden = !action.value;
              logs.push(`  - Set field [${action.targetFieldId}] Visibility = ${action.value}`);
              break;
            case 'SET_REQUIRED':
              state.isRequired = action.value;
              logs.push(`  - Set field [${action.targetFieldId}] Required = ${action.value}`);
              break;
            case 'SET_READ_ONLY':
              state.isReadOnly = action.value;
              logs.push(`  - Set field [${action.targetFieldId}] Read-Only = ${action.value}`);
              break;
            case 'SET_VALUE':
              state.valueOverride = action.value;
              logs.push(`  - Force field [${action.targetFieldId}] value = '${action.value}'`);
              break;
          }
        }
      }
    }

    return { fieldStates, logs };
  }
}
