import { checkCircularDependencies, FormulaEvaluator } from './CalculationsEngine';
import { DDEEngine, DDERule } from './DDEEngine';
import { AWFEngine, AWFInstanceState } from './AWFEngine';
import { RLSEngine, RLSConfig } from './RLSEngine';
import {
  MOCK_USERS,
  MOCK_STRUCTURES,
  DEFAULT_DATABASE_RECORDS,
  APP_RISK_REGISTER,
  DEFAULT_AWF_WORKFLOW
} from '../data/BreakFixScenarios';
import type { Field, RecordPayload } from '../types/SystemTaxonomyConfig';

console.log('====================================================');
console.log('APEXGRM ENGINE: COMPUTATION ENGINE VERIFIER');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.log(`[FAIL] ${testName}`);
    failCount++;
  }
}

// ------------------------------------------------------------------
// TEST 1: Circular Dependency Loop Detection
// ------------------------------------------------------------------
console.log('--- TEST 1: Circular Dependency Loop Tracking ---');
const normalFields: Field[] = APP_RISK_REGISTER.fields;
const normalFieldsMap = new Map(normalFields.map(f => [f.id, f]));

// In a normal state, there should be zero circular loops
const loopResultNormal = checkCircularDependencies(normalFields, normalFieldsMap);
assert(loopResultNormal === null, 'Normal fields are marked Loop-Free');

// Inject a direct circular reference loop: IMPACT -> SCORE -> IMPACT
const brokenFields: Field[] = normalFields.map(f => {
  if (f.id === 'FLD_INHERENT_IMPACT') {
    return {
      ...f,
      type: 'CALCULATED' as any,
      calculatedConfig: {
        formula: 'FLD_INHERENT_SCORE * 2',
        referencedFieldIds: ['FLD_INHERENT_SCORE']
      }
    };
  }
  return f;
});
const brokenFieldsMap = new Map(brokenFields.map(f => [f.id, f]));
const loopResultBroken = checkCircularDependencies(brokenFields, brokenFieldsMap);

assert(
  loopResultBroken !== null &&
  loopResultBroken.includes('FLD_INHERENT_IMPACT') &&
  loopResultBroken.includes('FLD_INHERENT_SCORE'),
  `Loop detected correctly: ${loopResultBroken?.join(' -> ')}`
);

// ------------------------------------------------------------------
// TEST 2: Formula Parser & In-Memory Evaluation
// ------------------------------------------------------------------
console.log('\n--- TEST 2: Formula Evaluator Parsing ---');
const db = DEFAULT_DATABASE_RECORDS();
const record = db.get('REC_RISK_01')!;

const evaluator = new FormulaEvaluator(
  record,
  db,
  normalFieldsMap,
  (rec, user) => {
    // Basic RLS checker: check GRP_EXEC_COM membership
    const allowed = rec.values.FLD_ALLOWED_GROUPS as string[];
    if (!allowed) return true;
    return user.groups.some(g => allowed.includes(g));
  },
  MOCK_USERS.RISK_ANALYST
);

// Evaluate local math
assert(evaluator.evaluate('FLD_INHERENT_IMPACT * FLD_INHERENT_LIKELIHOOD') === 20, 'Local basic multiplication evaluates (5 * 4 = 20)');
assert(evaluator.evaluate("IF(FLD_INHERENT_IMPACT > 4, 'CRITICAL', 'NORMAL')") === 'CRITICAL', 'IF dynamic comparison evaluates');

// Evaluate cross-reference sums respecting RLS
// Risk Analyst is in GRP_IT_RISK. Target controls are allowed only to GRP_EXEC_COM.
// RLS should omit all values, resulting in SUM = 0
const sumAnalyst = evaluator.evaluate('SUM(FLD_CONTROLS_REF.FLD_CONTROL_SCORE)');
assert(sumAnalyst === 0, `Risk Analyst RLS blocks controls: Sum is ${sumAnalyst} (Expected: 0)`);

// CISO is in both GRP_IT_RISK and GRP_EXEC_COM. CISO should see all controls, resulting in SUM = 80 (50 + 30)
const evaluatorCISO = new FormulaEvaluator(
  record,
  db,
  normalFieldsMap,
  (rec, user) => {
    const allowed = rec.values.FLD_ALLOWED_GROUPS as string[];
    if (!allowed) return true;
    return user.groups.some(g => allowed.includes(g));
  },
  MOCK_USERS.CISO
);
const sumCISO = evaluatorCISO.evaluate('SUM(FLD_CONTROLS_REF.FLD_CONTROL_SCORE)');
assert(sumCISO === 80, `CISO RLS passes controls: Sum is ${sumCISO} (Expected: 80)`);

// ------------------------------------------------------------------
// TEST 3: Data Driven Events (DDE) Engine
// ------------------------------------------------------------------
console.log('\n--- TEST 3: Data Driven Events Actioning ---');
const ddeRules: DDERule[] = [
  {
    id: 'DDE_RULE_01',
    name: 'Hide Owner Group if Risk is Draft',
    triggerFieldIds: ['FLD_STATUS'],
    conjunction: 'AND',
    conditions: [
      { fieldId: 'FLD_STATUS', operator: 'EQUALS', value: 'Draft' }
    ],
    actions: [
      { targetFieldId: 'FLD_OWNER_GROUPS', type: 'SET_VISIBILITY', value: false } // false = hide
    ]
  }
];

const ddeEngine = new DDEEngine(ddeRules);
const { fieldStates, logs } = ddeEngine.evaluateRules(record, normalFields);

assert(fieldStates.FLD_OWNER_GROUPS.isHidden === true, "DDE rule successfully executes to set 'Authorized Groups' to Hidden when Status is Draft");
assert(logs.length > 0, `DDE Log generated: '${logs[0]}'`);

// ------------------------------------------------------------------
// TEST 4: Advanced Workflow Nodes & Telemetry
// ------------------------------------------------------------------
console.log('\n--- TEST 4: Advanced Workflow Nodes & Telemetry ---');
const wf = DEFAULT_AWF_WORKFLOW();
const awfEngine = new AWFEngine(wf);

const instanceState: AWFInstanceState = {
  recordId: record.id,
  currentNodeId: 'NODE_DRAFT',
  isCompleted: false,
  history: [{ nodeId: 'NODE_START', timestamp: new Date().toISOString() }]
};

const { newState, telemetry } = awfEngine.processTransition(instanceState, record, 'SUBMIT');

assert(newState.currentNodeId === 'NODE_DECISION', "State transitions correctly from 'NODE_DRAFT' to 'NODE_DECISION' on SUBMIT action");
assert(telemetry.status === 'SUCCESS', 'Telemetry logs marked SUCCESS');
assert(telemetry.executionPhase === 'STATE_TRANSITION', 'Telemetry matches phase STATE_TRANSITION');
assert(telemetry.traceDetails.currentTokens?.nextNode === 'Gate Evaluation', `Telemetry logs next target node properly: '${telemetry.traceDetails.currentTokens?.nextNode}'`);

console.log('\n====================================================');
console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================');
if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
export {};
