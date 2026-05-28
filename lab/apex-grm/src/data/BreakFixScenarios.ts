import type { Structure, RecordPayload, Field, SimulatedUserContext } from '../types/SystemTaxonomyConfig';
import type { RLSConfig } from '../engines/RLSEngine';
import type { DDERule } from '../engines/DDEEngine';
import type { AWFWorkflow } from '../engines/AWFEngine';

/**
 * 1. MOCK SYSTEM ROLES & USERS
 */
export const MOCK_USERS: Record<string, SimulatedUserContext> = {
  RISK_ANALYST: {
    id: 'USR_RISK_ANALYST',
    username: 'j.smith@apexgrm.internal',
    roles: ['RISK_ANALYST'],
    groups: ['GRP_IT_RISK'],
  },
  CISO: {
    id: 'USR_CISO',
    username: 'ciso@apexgrm.internal',
    roles: ['CISO', 'RISK_ANALYST'],
    groups: ['GRP_IT_RISK', 'GRP_EXEC_COM'],
  },
  MOCK_FEED_SERVICE: {
    id: 'USR_INGESTION_SERVICE',
    username: 'feed_service@apexgrm.internal',
    roles: ['SYSTEM_INGESTION'],
    groups: ['GRP_SYSTEM'],
  }
};

/**
 * 2. MOCK APPLICATION STRUCTURES (APEXGRM ENGINE DEFAULT DEFINITIONS)
 */
export const APP_RISK_REGISTER: Structure = {
  id: 'APP_RISK_REGISTER',
  name: 'Risk Register',
  type: 'APPLICATION',
  fields: [
    { id: 'FLD_RISK_ID', name: 'Risk ID', type: 'TEXT', isRequired: true, isReadOnly: true, isHidden: false },
    { id: 'FLD_RISK_NAME', name: 'Risk Name', type: 'TEXT', isRequired: true, isReadOnly: false, isHidden: false },
    { id: 'FLD_INHERENT_IMPACT', name: 'Inherent Impact', type: 'NUMERIC', isRequired: true, isReadOnly: false, isHidden: false, minValue: 1, maxValue: 5 },
    { id: 'FLD_INHERENT_LIKELIHOOD', name: 'Inherent Likelihood', type: 'NUMERIC', isRequired: true, isReadOnly: false, isHidden: false, minValue: 1, maxValue: 5 },
    {
      id: 'FLD_INHERENT_SCORE',
      name: 'Inherent Score',
      type: 'CALCULATED',
      isRequired: false,
      isReadOnly: true,
      isHidden: false,
      calculatedConfig: {
        formula: 'FLD_INHERENT_IMPACT * FLD_INHERENT_LIKELIHOOD',
        referencedFieldIds: ['FLD_INHERENT_IMPACT', 'FLD_INHERENT_LIKELIHOOD']
      }
    },
    { id: 'FLD_STATUS', name: 'Status', type: 'VALUES_LIST', isRequired: true, isReadOnly: false, isHidden: false, valuesListConfig: { isMultiSelect: false, options: [{ id: 'OPT_DRAFT', value: 'Draft' }, { id: 'OPT_REVIEW', value: 'Under Review' }, { id: 'OPT_APPROVED', value: 'Approved' }] } },
    { id: 'FLD_CONTROLS_REF', name: 'Mapped Controls', type: 'CROSS_REFERENCE', isRequired: false, isReadOnly: false, isHidden: false, crossReferenceConfig: { targetStructureId: 'APP_CONTROL_REGISTER', bidirectionalFieldId: 'FLD_RISKS_REF' } },
    {
      id: 'FLD_CONTROLS_SUM',
      name: 'Total Control Value',
      type: 'CALCULATED',
      isRequired: false,
      isReadOnly: true,
      isHidden: false,
      calculatedConfig: {
        formula: 'SUM(FLD_CONTROLS_REF.FLD_CONTROL_SCORE)',
        referencedFieldIds: ['FLD_CONTROLS_REF']
      }
    },
    { id: 'FLD_OWNER_GROUPS', name: 'Authorized Groups', type: 'USER_GROUP', isRequired: false, isReadOnly: false, isHidden: false }
  ]
};

export const APP_CONTROL_REGISTER: Structure = {
  id: 'APP_CONTROL_REGISTER',
  name: 'Control Register',
  type: 'APPLICATION',
  fields: [
    { id: 'FLD_CONTROL_ID', name: 'Control ID', type: 'TEXT', isRequired: true, isReadOnly: true, isHidden: false },
    { id: 'FLD_CONTROL_NAME', name: 'Control Name', type: 'TEXT', isRequired: true, isReadOnly: false, isHidden: false },
    { id: 'FLD_CONTROL_SCORE', name: 'Control Score', type: 'NUMERIC', isRequired: true, isReadOnly: false, isHidden: false, minValue: 10, maxValue: 100 },
    { id: 'FLD_RISKS_REF', name: 'Mapped Risks', type: 'CROSS_REFERENCE', isRequired: false, isReadOnly: false, isHidden: false, crossReferenceConfig: { targetStructureId: 'APP_RISK_REGISTER', bidirectionalFieldId: 'FLD_CONTROLS_REF' } },
    { id: 'FLD_ALLOWED_GROUPS', name: 'Allowed Groups', type: 'USER_GROUP', isRequired: false, isReadOnly: false, isHidden: false }
  ]
};

export const MOCK_STRUCTURES: Map<string, Structure> = new Map([
  ['APP_RISK_REGISTER', APP_RISK_REGISTER],
  ['APP_CONTROL_REGISTER', APP_CONTROL_REGISTER]
]);

/**
 * 3. DEFAULT DATABASE MOCK RECORDS
 */
export const DEFAULT_DATABASE_RECORDS = (): Map<string, RecordPayload> => new Map([
  [
    'REC_RISK_01',
    {
      id: 'REC_RISK_01',
      structureId: 'APP_RISK_REGISTER',
      values: {
        FLD_RISK_ID: 'RSK-101',
        FLD_RISK_NAME: 'Ransomware attacks on IT Core infrastructure',
        FLD_INHERENT_IMPACT: 5,
        FLD_INHERENT_LIKELIHOOD: 4,
        FLD_STATUS: 'Draft',
        FLD_CONTROLS_REF: ['REC_CTRL_01', 'REC_CTRL_02'],
        FLD_OWNER_GROUPS: ['GRP_IT_RISK'],
      }
    }
  ],
  [
    'REC_CTRL_01',
    {
      id: 'REC_CTRL_01',
      structureId: 'APP_CONTROL_REGISTER',
      values: {
        FLD_CONTROL_ID: 'CTRL-201',
        FLD_CONTROL_NAME: 'Multi-Factor Authentication (MFA) enforcement',
        FLD_CONTROL_SCORE: 50,
        FLD_RISKS_REF: ['REC_RISK_01'],
        FLD_ALLOWED_GROUPS: ['GRP_EXEC_COM'], // Restrictive to GRP_EXEC_COM (CISO matches, Risk Analyst does not!)
      }
    }
  ],
  [
    'REC_CTRL_02',
    {
      id: 'REC_CTRL_02',
      structureId: 'APP_CONTROL_REGISTER',
      values: {
        FLD_CONTROL_ID: 'CTRL-202',
        FLD_CONTROL_NAME: 'Daily Encrypted Offline Backup pipeline',
        FLD_CONTROL_SCORE: 30,
        FLD_RISKS_REF: ['REC_RISK_01'],
        FLD_ALLOWED_GROUPS: ['GRP_EXEC_COM'],
      }
    }
  ]
]);

/**
 * 4. WORKFLOW DEFINITIONS
 */
export const DEFAULT_AWF_WORKFLOW = (): AWFWorkflow => ({
  id: 'WF_RISK_APPROVAL',
  name: 'Risk Review & Approval Flow',
  structureId: 'APP_RISK_REGISTER',
  nodes: [
    { id: 'NODE_START', name: 'Start', type: 'START', x: 50, y: 150 },
    { id: 'NODE_DRAFT', name: 'Draft State', type: 'TASK', assignedUserOrGroup: 'GRP_IT_RISK', x: 200, y: 150 },
    { id: 'NODE_DECISION', name: 'Gate Evaluation', type: 'DECISION', decisionFieldId: 'FLD_STATUS', decisionRules: [{ conditionValue: 'Approved', targetNodeId: 'NODE_APPROVED_END' }], defaultTargetNodeId: 'NODE_DRAFT', x: 400, y: 150 },
    { id: 'NODE_APPROVED_END', name: 'Approved & Active', type: 'END', x: 600, y: 150 }
  ],
  transitions: [
    { id: 'T_1', sourceNodeId: 'NODE_START', targetNodeId: 'NODE_DRAFT' },
    { id: 'T_2', sourceNodeId: 'NODE_DRAFT', targetNodeId: 'NODE_DECISION', ruleExpression: 'Submit for review' },
    { id: 'T_3', sourceNodeId: 'NODE_DECISION', targetNodeId: 'NODE_APPROVED_END', ruleExpression: '[Status] == Approved' },
    { id: 'T_4', sourceNodeId: 'NODE_DECISION', targetNodeId: 'NODE_DRAFT', ruleExpression: '[Status] != Approved (Loopback)' }
  ]
});

/**
 * 5. THE FOUR BREAK-FIX SCENARIO CONFIGURATION BLOCKS
 */
export interface BreakFixScenario {
  id: string;
  name: string;
  category: string;
  symptom: string;
  faultDescription: string;
  logMessage: string;
  initialUser: string;
  options: {
    id: string;
    label: string;
    description: string;
    isCorrect: boolean;
    applyFix: (
      records: Map<string, RecordPayload>,
      rlsConfigs: Record<string, RLSConfig>,
      ddeRules: DDERule[],
      fields: Field[],
      ingestionData?: any
    ) => {
      fixedRecords: Map<string, RecordPayload>;
      fixedRlsConfigs: Record<string, RLSConfig>;
      fixedDdeRules: DDERule[];
      fixedFields: Field[];
      fixedIngestionData?: any;
    };
  }[];
}

export const BREAK_FIX_SCENARIOS: BreakFixScenario[] = [
  {
    id: 'SCENARIO_1',
    name: 'The Cross-Reference Security Ghost',
    category: 'Record-Level Security (RLS)',
    symptom: 'The calculated field FLD_CONTROLS_SUM (summing scores of mapped controls CTRL-201 and CTRL-202) returns "0" for the Risk Analyst, even though the controls exist and are correctly linked in the database.',
    faultDescription: 'The controls REC_CTRL_01 and REC_CTRL_02 are configured with FLD_ALLOWED_GROUPS: [\'GRP_EXEC_COM\']. The simulated Risk Analyst (GRP_IT_RISK group) lacks this group, so the RLSEngine filters out these target records during Cross-Reference lookup, resulting in an aggregated sum of 0.',
    logMessage: 'Security Check: 2 records omitted from Cross-Reference calculations due to Record-Level Security filter execution for USR_RISK_ANALYST.',
    initialUser: 'USR_RISK_ANALYST',
    options: [
      {
        id: 'S1_FIX_1',
        label: 'Disable RLS globally on Mapped Controls',
        description: 'Set isEnabled: false on the Control Register RLS profile to completely bypass RLS checks for all users.',
        isCorrect: false,
        applyFix: (recs, rlsConfigs, ddes, fields) => {
          const newRls = { ...rlsConfigs };
          newRls['APP_CONTROL_REGISTER'] = {
            isEnabled: false,
            allowIfFieldsEmpty: true
          };
          return { fixedRecords: recs, fixedRlsConfigs: newRls, fixedDdeRules: ddes, fixedFields: fields };
        }
      },
      {
        id: 'S1_FIX_2',
        label: 'Align Control Access Groups (Correct Fix)',
        description: 'Update the controls in the database to allow GRP_IT_RISK group membership, granting IT Risk Analysts authorized access to verify control evaluations.',
        isCorrect: true,
        applyFix: (recs, rlsConfigs, ddes, fields) => {
          const newRecs = new Map(recs);
          const c1 = newRecs.get('REC_CTRL_01');
          const c2 = newRecs.get('REC_CTRL_02');
          if (c1 && c2) {
            newRecs.set('REC_CTRL_01', {
              ...c1,
              values: { ...c1.values, FLD_ALLOWED_GROUPS: ['GRP_EXEC_COM', 'GRP_IT_RISK'] }
            });
            newRecs.set('REC_CTRL_02', {
              ...c2,
              values: { ...c2.values, FLD_ALLOWED_GROUPS: ['GRP_EXEC_COM', 'GRP_IT_RISK'] }
            });
          }
          return { fixedRecords: newRecs, fixedRlsConfigs: rlsConfigs, fixedDdeRules: ddes, fixedFields: fields };
        }
      },
      {
        id: 'S1_FIX_3',
        label: 'Add Risk Analyst to Exec Committee Role',
        description: 'Bypass the operational boundary by forcing Executive roles on IT Analysts, violating least-privilege principles.',
        isCorrect: false,
        applyFix: (recs, rlsConfigs, ddes, fields) => {
          // Non-standard patch, does not edit the database structure
          return { fixedRecords: recs, fixedRlsConfigs: rlsConfigs, fixedDdeRules: ddes, fixedFields: fields };
        }
      }
    ]
  },
  {
    id: 'SCENARIO_2',
    name: 'The Calculation Paradox (Circular Loop)',
    category: 'Calculation Engine',
    symptom: 'Configuring a new dependency chain causes the engine to throw a loop exception during processing, resulting in a thread abort in the terminal log.',
    faultDescription: 'A calculated field is configured in a loop. Field FLD_INHERENT_IMPACT depends on FLD_INHERENT_SCORE, which in turn depends on FLD_INHERENT_IMPACT. Evaluating the record triggers a circular execution loop.',
    logMessage: 'Error: Circular dependency chain detected: FLD_INHERENT_IMPACT -> FLD_INHERENT_SCORE -> FLD_INHERENT_IMPACT. Execution aborted to prevent thread exhaustion.',
    initialUser: 'USR_RISK_ANALYST',
    options: [
      {
        id: 'S2_FIX_1',
        label: 'Decouple Inherent Score reference (Correct Fix)',
        description: 'Rewrite FLD_INHERENT_SCORE to reference static field values (FLD_INHERENT_IMPACT * FLD_INHERENT_LIKELIHOOD) and remove dynamic loopback references.',
        isCorrect: true,
        applyFix: (recs, rlsConfigs, ddes, fields) => {
          // Adjust field config to remove circularity
          const newFields = fields.map(f => {
            if (f.id === 'FLD_INHERENT_SCORE') {
              return {
                ...f,
                calculatedConfig: {
                  formula: 'FLD_INHERENT_IMPACT * FLD_INHERENT_LIKELIHOOD',
                  referencedFieldIds: ['FLD_INHERENT_IMPACT', 'FLD_INHERENT_LIKELIHOOD']
                }
              };
            }
            return f;
          });
          return { fixedRecords: recs, fixedRlsConfigs: rlsConfigs, fixedDdeRules: ddes, fixedFields: newFields };
        }
      },
      {
        id: 'S2_FIX_2',
        label: 'Force score value override',
        description: 'Disable the formula interpreter for FLD_INHERENT_SCORE and hardcode it to 20, completely eliminating the loop but breaking the dynamic model.',
        isCorrect: false,
        applyFix: (recs, rlsConfigs, ddes, fields) => {
          const newFields = fields.map(f => {
            if (f.id === 'FLD_INHERENT_SCORE') {
              return { ...f, type: 'NUMERIC' as any, calculatedConfig: undefined };
            }
            return f;
          });
          return { fixedRecords: recs, fixedRlsConfigs: rlsConfigs, fixedDdeRules: ddes, fixedFields: newFields };
        }
      }
    ]
  },
  {
    id: 'SCENARIO_3',
    name: 'The Ingestion Data Skew',
    category: 'Data Feed Pipelines',
    symptom: 'A CSV feed ingestion attempts to load alphanumeric severity values like "5 - Critical" directly into the Numeric field FLD_INHERENT_IMPACT, throwing type truncation errors.',
    faultDescription: 'External database dumps represent severity with strings. The ingestion service maps the raw token "5 - Critical" into FLD_INHERENT_IMPACT. Since the field is configured as a typed Numeric field, validation fails.',
    logMessage: 'Data Ingestion Error: Pipeline failed to map raw input token "5 - Critical" to targeted field type NUMERIC for FLD_INHERENT_IMPACT. Data truncation occurred.',
    initialUser: 'USR_INGESTION_SERVICE',
    options: [
      {
        id: 'S3_FIX_1',
        label: 'Change target field type to Text',
        description: 'Convert FLD_INHERENT_IMPACT into a Text field. This passes validation but breaks all mathematical Risk Score calculations on the dashboard.',
        isCorrect: false,
        applyFix: (recs, rlsConfigs, ddes, fields) => {
          const newFields = fields.map(f => {
            if (f.id === 'FLD_INHERENT_IMPACT') return { ...f, type: 'TEXT' as any };
            return f;
          });
          return { fixedRecords: recs, fixedRlsConfigs: rlsConfigs, fixedDdeRules: ddes, fixedFields: newFields };
        }
      },
      {
        id: 'S3_FIX_2',
        label: 'Deploy Data Ingestion Transformation Mapping (Correct Fix)',
        description: 'Deploy an ingestion regex replacement rule in the feed settings to strip alphanumeric suffix tokens (regex: `^(\\d+) - .*` -> `$1`), transforming "5 - Critical" to numeric "5" before validation.',
        isCorrect: true,
        applyFix: (recs, rlsConfigs, ddes, fields, ingestionData) => {
          const transformed = ingestionData ? String(ingestionData).replace(/^(\d+)\s*-\s*.*/, '$1') : '5';
          const newRecs = new Map(recs);
          const r = newRecs.get('REC_RISK_01');
          if (r) {
            newRecs.set('REC_RISK_01', {
              ...r,
              values: { ...r.values, FLD_INHERENT_IMPACT: Number(transformed) }
            });
          }
          return {
            fixedRecords: newRecs,
            fixedRlsConfigs: rlsConfigs,
            fixedDdeRules: ddes,
            fixedFields: fields,
            fixedIngestionData: Number(transformed)
          };
        }
      }
    ]
  },
  {
    id: 'SCENARIO_4',
    name: 'The Advanced Workflow Deadlock',
    category: 'State Machine Routing',
    symptom: 'A risk record is locked in the Gate Evaluation node. Submitting the record fails to route it to Approved & Active, returning it to the Draft queue.',
    faultDescription: 'The AWF node Transition expects FLD_STATUS == "Approved". However, a conflicting Data Driven Event is configured: when a user clicks "Submit", a DDE is fired on load to reset FLD_STATUS back to "Draft" to enforce audit freezes, creating a perpetual deadlock.',
    logMessage: 'Warning: Advanced Workflow block deadlock. Node \'Gate Evaluation\' expects condition [Status]==\'Approved\'. Data Driven Event \'Freeze_Audits_Draft\' overrode field state to \'Under Review\' during record state execution.',
    initialUser: 'USR_RISK_ANALYST',
    options: [
      {
        id: 'S4_FIX_1',
        label: 'Disable the DDE Audit Freeze Rule (Correct Fix)',
        description: 'Refactor the DDE rule Freeze_Audits_Draft so it does not evaluate during active AWF transition states, allowing Approved states to execute routing pipelines.',
        isCorrect: true,
        applyFix: (recs, rlsConfigs, ddes, fields) => {
          // Disable the deadlocking DDE rule by removing it or filtering its triggers
          const newDde = ddes.filter(r => r.id !== 'Freeze_Audits_Draft');
          return { fixedRecords: recs, fixedRlsConfigs: rlsConfigs, fixedDdeRules: newDde, fixedFields: fields };
        }
      },
      {
        id: 'S4_FIX_2',
        label: 'Disable AWF and route manually',
        description: 'Decommission the Advanced Workflow entirely and let analysts change Status manually, breaking audit controls and segregation of duties.',
        isCorrect: false,
        applyFix: (recs, rlsConfigs, ddes, fields) => {
          return { fixedRecords: recs, fixedRlsConfigs: rlsConfigs, fixedDdeRules: ddes, fixedFields: fields };
        }
      }
    ]
  }
];
