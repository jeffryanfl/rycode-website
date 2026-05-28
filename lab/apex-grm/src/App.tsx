import { useState, useEffect } from 'react';
import {
  Terminal,
  Shield,
  RotateCcw,
  Database,
  User,
  Users,
  CheckCircle,
  AlertTriangle,
  FileText,
  GitPullRequest,
  Settings,
  Cpu
} from 'lucide-react';

import { checkCircularDependencies, FormulaEvaluator } from './engines/CalculationsEngine';
import { DDEEngine } from './engines/DDEEngine';
import type { DDERule, FieldRuntimeState } from './engines/DDEEngine';
import { AWFEngine } from './engines/AWFEngine';
import type { AWFInstanceState, DiagnosticTelemetry } from './engines/AWFEngine';
import { RLSEngine } from './engines/RLSEngine';
import type { RLSConfig } from './engines/RLSEngine';
import {
  BREAK_FIX_SCENARIOS,
  MOCK_USERS,
  APP_RISK_REGISTER,
  APP_CONTROL_REGISTER,
  DEFAULT_DATABASE_RECORDS,
  DEFAULT_AWF_WORKFLOW
} from './data/BreakFixScenarios';
import type { BreakFixScenario } from './data/BreakFixScenarios';
import type { Field, RecordPayload, SimulatedUserContext, Structure } from './types/SystemTaxonomyConfig';

export default function App() {
  // --- DATABASE & ENGINE STATES ---
  const [currentUser, setCurrentUser] = useState<SimulatedUserContext>(MOCK_USERS.RISK_ANALYST);
  const [structures] = useState<Map<string, Structure>>(
    new Map([
      ['APP_RISK_REGISTER', APP_RISK_REGISTER],
      ['APP_CONTROL_REGISTER', APP_CONTROL_REGISTER]
    ])
  );
  
  const [fields, setFields] = useState<Field[]>(APP_RISK_REGISTER.fields);
  const [records, setRecords] = useState<Map<string, RecordPayload>>(DEFAULT_DATABASE_RECORDS());
  const [rlsConfigs, setRlsConfigs] = useState<Record<string, RLSConfig>>({
    APP_RISK_REGISTER: { isEnabled: false, allowIfFieldsEmpty: true },
    APP_CONTROL_REGISTER: { isEnabled: true, userFieldId: undefined, groupFieldId: 'FLD_ALLOWED_GROUPS', allowIfFieldsEmpty: true }
  });
  const [ddeRules, setDdeRules] = useState<DDERule[]>([
    {
      id: 'Freeze_Audits_Draft',
      name: 'Freeze_Audits_Draft',
      triggerFieldIds: ['FLD_STATUS'],
      conjunction: 'AND',
      conditions: [{ fieldId: 'FLD_STATUS', operator: 'EQUALS', value: 'Under Review' }],
      actions: [{ targetFieldId: 'FLD_STATUS', type: 'SET_VALUE', value: 'Draft' }]
    }
  ]);

  // --- WORKFLOW STATE ---
  const [workflow] = useState(DEFAULT_AWF_WORKFLOW());
  const [wfState, setWfState] = useState<AWFInstanceState>({
    recordId: 'REC_RISK_01',
    currentNodeId: 'NODE_DRAFT',
    isCompleted: false,
    history: [{ nodeId: 'NODE_START', timestamp: new Date().toISOString() }]
  });

  // --- UI CONTROL STATES ---
  const [activeRecordId, setActiveRecordId] = useState<string>('REC_RISK_01');
  const [activeStructureId, setActiveStructureId] = useState<string>('APP_RISK_REGISTER');
  const [telemetryLogs, setTelemetryLogs] = useState<DiagnosticTelemetry[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarioSuccess, setScenarioSuccess] = useState<boolean>(false);
  
  // Scenario 3 specific input
  const [feedInput, setFeedInput] = useState<string>('5 - Critical');
  const [feedTransformed, setFeedTransformed] = useState<string | null>(null);

  // Field runtime overrides computed by DDE Engine
  const [ddeOverrides, setDdeOverrides] = useState<Record<string, FieldRuntimeState>>({});
  const [circularError, setCircularError] = useState<{ message: string; path: string[] } | null>(null);

  // --- LOGGING HELPER ---
  const addLog = (
    phase: DiagnosticTelemetry['executionPhase'],
    status: DiagnosticTelemetry['status'],
    message: string,
    details?: any,
    errMessage?: string
  ) => {
    const log: DiagnosticTelemetry = {
      id: 'TEL_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: new Date().toISOString().split('T')[1].slice(0, 12),
      applicationContext: `${activeStructureId}_${activeRecordId}`,
      executionPhase: phase,
      status,
      traceDetails: details || { evaluatedExpression: message },
      errorMessage: errMessage
    };
    setTelemetryLogs((prev) => [log, ...prev].slice(0, 100)); // Cap at 100 logs
  };

  // --- RE-EVALUATE COMPUTED VALUES ---
  const evaluateEngineState = (currentRecs: Map<string, RecordPayload>, currentFields: Field[], rules: DDERule[], rls: Record<string, RLSConfig>) => {
    const nextRecs = new Map(currentRecs);
    const activeRec = nextRecs.get(activeRecordId);
    if (!activeRec) return;

    // 1. RLS ACCESS CHECK
    const currentStruct = structures.get(activeRec.structureId)!;
    const moduleAllowed = RLSEngine.evaluateModuleAccess(currentStruct, currentUser);
    const recordAllowed = RLSEngine.evaluateRecordRLS(activeRec, currentStruct, currentUser, rls[activeRec.structureId]);

    if (!moduleAllowed || !recordAllowed) {
      addLog(
        'ACCESS_CONTROL',
        'WARNING',
        `Record RLS restriction triggered. Visibility omitted for user ${currentUser.username}`
      );
      return;
    }

    // 2. CHECK CIRCULAR DEPENDENCIES BEFORE CALCULATION RUN
    const fieldsMap = new Map(currentFields.map((f) => [f.id, f]));
    const circularPath = checkCircularDependencies(currentFields, fieldsMap);
    
    if (circularPath) {
      const errMsg = `Circular dependency chain detected: ${circularPath.join(' -> ')}. Thread aborted.`;
      setCircularError({ message: errMsg, path: circularPath });
      addLog(
        'CALCULATION_ENGINE',
        'CRITICAL_FAIL',
        'Calculation execution halted to prevent stack overflow.',
        { currentTokens: { cyclePath: circularPath } },
        errMsg
      );
      return;
    } else {
      setCircularError(null);
    }

    // 3. RUN DDE ENGINE (Data Driven Events)
    const dde = new DDEEngine(rules);
    const { fieldStates, logs: ddeLogs } = dde.evaluateRules(activeRec, currentFields);
    setDdeOverrides(fieldStates);
    
    ddeLogs.forEach((logLine) => {
      addLog('DATA_DRIVEN_EVENT', 'SUCCESS', logLine);
    });

    // Apply any value overrides forced by DDEs
    const valuesWithOverrides = { ...activeRec.values };
    Object.keys(fieldStates).forEach((fId) => {
      if (fieldStates[fId].valueOverride !== undefined) {
        valuesWithOverrides[fId] = fieldStates[fId].valueOverride;
      }
    });

    // 4. RUN FORMULA CALCULATION ENGINE
    const evaluator = new FormulaEvaluator(
      { ...activeRec, values: valuesWithOverrides },
      nextRecs,
      fieldsMap,
      (targetRec, user) => {
        // Recursive RLS filter execution inside calculation lookups
        const targetStruct = structures.get(targetRec.structureId)!;
        return RLSEngine.evaluateRecordRLS(
          targetRec,
          targetStruct,
          user,
          rls[targetRec.structureId]
        );
      },
      currentUser
    );

    let calcApplied = false;
    currentFields.forEach((field) => {
      if (field.type === 'CALCULATED' && field.calculatedConfig) {
        try {
          const oldVal = valuesWithOverrides[field.id];
          const calculatedVal = evaluator.evaluate(field.calculatedConfig.formula);
          
          if (calculatedVal !== oldVal) {
            valuesWithOverrides[field.id] = calculatedVal;
            calcApplied = true;
            addLog(
              'CALCULATION_ENGINE',
              'SUCCESS',
              `Evaluated Calculated Field [${field.id}]`,
              {
                evaluatedExpression: field.calculatedConfig.formula,
                currentTokens: { oldValue: oldVal, newValue: calculatedVal }
              }
            );
          }
        } catch (err: any) {
          addLog(
            'CALCULATION_ENGINE',
            'CRITICAL_FAIL',
            `Failed to evaluate [${field.id}]`,
            null,
            err.message
          );
        }
      }
    });

    if (calcApplied || JSON.stringify(activeRec.values) !== JSON.stringify(valuesWithOverrides)) {
      nextRecs.set(activeRecordId, {
        ...activeRec,
        values: valuesWithOverrides
      });
      setRecords(nextRecs);
    }
  };

  // Run engine evaluations when states fluctuate
  useEffect(() => {
    evaluateEngineState(records, fields, ddeRules, rlsConfigs);
  }, [currentUser, activeRecordId, activeStructureId, fields, ddeRules, rlsConfigs]);

  // Check Scenario success states
  useEffect(() => {
    if (!activeScenarioId) {
      setScenarioSuccess(false);
      return;
    }

    const currentRec = records.get('REC_RISK_01')!;
    
    if (activeScenarioId === 'SCENARIO_1') {
      // Scenario 1 Correct Fix: Allow GRP_IT_RISK group access on target control records
      const c1 = records.get('REC_CTRL_01')!;
      const c2 = records.get('REC_CTRL_02')!;
      const c1Ok = (c1.values.FLD_ALLOWED_GROUPS as string[]).includes('GRP_IT_RISK');
      const c2Ok = (c2.values.FLD_ALLOWED_GROUPS as string[]).includes('GRP_IT_RISK');
      
      // Also, sum calculation must return 80
      const sumVal = currentRec.values.FLD_CONTROLS_SUM;
      if (c1Ok && c2Ok && sumVal === 80) {
        setScenarioSuccess(true);
        addLog('ACCESS_CONTROL', 'SUCCESS', 'Scenario 1 Solved! RLS aligned and Calculation returns full sum values.');
      }
    } 
    else if (activeScenarioId === 'SCENARIO_2') {
      // Scenario 2 Correct Fix: Loop eliminated
      if (!circularError) {
        setScenarioSuccess(true);
        addLog('CALCULATION_ENGINE', 'SUCCESS', 'Scenario 2 Solved! Circular dependency decoupled successfully.');
      }
    } 
    else if (activeScenarioId === 'SCENARIO_3') {
      // Scenario 3 Correct Fix: coercion mapped correctly (inherent impact is a number 5)
      if (currentRec.values.FLD_INHERENT_IMPACT === 5 && feedTransformed === '5') {
        setScenarioSuccess(true);
        addLog('FIELD_VALIDATION', 'SUCCESS', 'Scenario 3 Solved! String severity mapped to Numeric 5 via feed transformation regex.');
      }
    } 
    else if (activeScenarioId === 'SCENARIO_4') {
      // Scenario 4 Correct Fix: deadlock rule deactivated (Freeze_Audits_Draft removed)
      const ruleExists = ddeRules.some((r) => r.id === 'Freeze_Audits_Draft');
      
      // Additionally, workflow should successfully advance to Approved State
      if (!ruleExists && wfState.currentNodeId === 'NODE_APPROVED_END') {
        setScenarioSuccess(true);
        addLog('STATE_TRANSITION', 'SUCCESS', 'Scenario 4 Solved! Conflicting DDE removed, workflow safely routed to Approved.');
      }
    }
  }, [records, ddeRules, circularError, feedTransformed, wfState.currentNodeId]);

  // --- MANUAL COMPONENT HANDLERS ---
  const handleFieldChange = (fieldId: string, value: any) => {
    // Prevent modification if DDE or calculated field locks it
    if (ddeOverrides[fieldId]?.isReadOnly) return;
    const f = fields.find((x) => x.id === fieldId);
    if (f?.type === 'CALCULATED') return;

    // Validate type bounds
    if (f?.type === 'NUMERIC') {
      const numVal = Number(value);
      if (f.minValue !== undefined && numVal < f.minValue) {
        addLog('FIELD_VALIDATION', 'WARNING', `Validation Warning: Field [${fieldId}] value ${numVal} below min bounds ${f.minValue}`);
      }
      if (f.maxValue !== undefined && numVal > f.maxValue) {
        addLog('FIELD_VALIDATION', 'WARNING', `Validation Warning: Field [${fieldId}] value ${numVal} exceeds max bounds ${f.maxValue}`);
      }
    }

    const nextRecs = new Map(records);
    const rec = nextRecs.get(activeRecordId)!;
    
    nextRecs.set(activeRecordId, {
      ...rec,
      values: { ...rec.values, [fieldId]: value }
    });

    setRecords(nextRecs);
    addLog('FIELD_VALIDATION', 'SUCCESS', `Modified field [${fieldId}] to '${value}'`);
  };

  const handleWfTransition = (action: 'APPROVE' | 'REJECT' | 'SUBMIT') => {
    const rec = records.get(activeRecordId)!;
    const engine = new AWFEngine(workflow);
    const { newState, telemetry } = engine.processTransition(wfState, rec, action);

    setWfState(newState);
    
    // Add telemetry log output
    setTelemetryLogs((prev) => [telemetry, ...prev]);

    if (telemetry.status === 'CRITICAL_FAIL') {
      addLog('STATE_TRANSITION', 'CRITICAL_FAIL', `AWF Deadlock triggered! node expected conditions not matched.`);
    } else {
      addLog(
        'STATE_TRANSITION',
        'SUCCESS',
        `AWF Step: transitioned record to node '${newState.currentNodeId}'`
      );
    }
  };

  const loadScenario = (scenario: BreakFixScenario) => {
    setActiveScenarioId(scenario.id);
    setScenarioSuccess(false);
    setTelemetryLogs([]);
    
    // Reset DB to defaults
    let baseRecords = DEFAULT_DATABASE_RECORDS();
    let baseFields = [...APP_RISK_REGISTER.fields];
    let baseRls = {
      APP_RISK_REGISTER: { isEnabled: false, allowIfFieldsEmpty: true },
      APP_CONTROL_REGISTER: { isEnabled: true, userFieldId: undefined, groupFieldId: 'FLD_ALLOWED_GROUPS', allowIfFieldsEmpty: true }
    };
    let baseDdes: DDERule[] = [];

    addLog('FIELD_VALIDATION', 'SUCCESS', `Lobby: Loading operational scenario '${scenario.name}'`);

    if (scenario.id === 'SCENARIO_1') {
      // Scenario 1: Setup restrictive GRP_EXEC_COM control groups
      setCurrentUser(MOCK_USERS.RISK_ANALYST);
      addLog('ACCESS_CONTROL', 'WARNING', scenario.symptom);
    } 
    else if (scenario.id === 'SCENARIO_2') {
      // Scenario 2: Setup circular calc loop score ↔ impact
      baseFields = baseFields.map((f) => {
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
      addLog('CALCULATION_ENGINE', 'CRITICAL_FAIL', scenario.symptom);
    } 
    else if (scenario.id === 'SCENARIO_3') {
      // Scenario 3: Setup ingestion data skew (CSV inputs)
      setCurrentUser(MOCK_USERS.MOCK_FEED_SERVICE);
      setFeedInput('5 - Critical');
      setFeedTransformed(null);
      
      // Broken state: raw uncoerced string pushed directly into database value
      const r = baseRecords.get('REC_RISK_01')!;
      baseRecords.set('REC_RISK_01', {
        ...r,
        values: { ...r.values, FLD_INHERENT_IMPACT: '5 - Critical' }
      });
      addLog('FIELD_VALIDATION', 'CRITICAL_FAIL', scenario.symptom);
    } 
    else if (scenario.id === 'SCENARIO_4') {
      // Scenario 4: Setup conflict DDE rule & WF State
      setCurrentUser(MOCK_USERS.RISK_ANALYST);
      
      // Load Conflict DDE rule Freeze_Audits_Draft
      baseDdes = [
        {
          id: 'Freeze_Audits_Draft',
          name: 'Freeze_Audits_Draft',
          triggerFieldIds: ['FLD_STATUS'],
          conjunction: 'AND',
          conditions: [{ fieldId: 'FLD_STATUS', operator: 'EQUALS', value: 'Under Review' }],
          actions: [{ targetFieldId: 'FLD_STATUS', type: 'SET_VALUE', value: 'Draft' }]
        }
      ];

      // Set record to 'Under Review' status
      const r = baseRecords.get('REC_RISK_01')!;
      baseRecords.set('REC_RISK_01', {
        ...r,
        values: { ...r.values, FLD_STATUS: 'Under Review' }
      });

      setWfState({
        recordId: 'REC_RISK_01',
        currentNodeId: 'NODE_DECISION',
        isCompleted: false,
        history: [{ nodeId: 'NODE_START', timestamp: new Date().toISOString() }]
      });
      addLog('STATE_TRANSITION', 'WARNING', scenario.symptom);
    }

    setRecords(baseRecords);
    setFields(baseFields);
    setRlsConfigs(baseRls);
    setDdeRules(baseDdes);
  };

  const applyFixOption = (option: any) => {
    addLog('FIELD_VALIDATION', 'SUCCESS', `Trainer: Applying correction method: '${option.label}'`);
    
    const { fixedRecords, fixedRlsConfigs, fixedDdeRules, fixedFields, fixedIngestionData } = option.applyFix(
      records,
      rlsConfigs,
      ddeRules,
      fields,
      feedInput
    );

    setRecords(fixedRecords);
    setRlsConfigs(fixedRlsConfigs);
    setDdeRules(fixedDdeRules);
    setFields(fixedFields);
    
    if (fixedIngestionData !== undefined) {
      setFeedTransformed(String(fixedIngestionData));
    }
  };

  const resetAll = () => {
    setActiveScenarioId(null);
    setScenarioSuccess(false);
    setCurrentUser(MOCK_USERS.RISK_ANALYST);
    setRecords(DEFAULT_DATABASE_RECORDS());
    setFields(APP_RISK_REGISTER.fields);
    setRlsConfigs({
      APP_RISK_REGISTER: { isEnabled: false, allowIfFieldsEmpty: true },
      APP_CONTROL_REGISTER: { isEnabled: true, userFieldId: undefined, groupFieldId: 'FLD_ALLOWED_GROUPS', allowIfFieldsEmpty: true }
    });
    setDdeRules([]);
    setWfState({
      recordId: 'REC_RISK_01',
      currentNodeId: 'NODE_DRAFT',
      isCompleted: false,
      history: [{ nodeId: 'NODE_START', timestamp: new Date().toISOString() }]
    });
    setTelemetryLogs([]);
    setCircularError(null);
    addLog('FIELD_VALIDATION', 'SUCCESS', 'Reset ApexGRM Engine state machine and databases to baseline.');
  };

  const activeRecord = records.get(activeRecordId)!;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950 antialiased">
      
      {/* --- TOP TERMINAL HEADER --- */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-amber-500 animate-pulse" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-100 font-mono">
              ApexGRM Engine <span className="text-amber-500 font-normal">v2.6.0</span>
            </h1>
            <p className="text-xs text-neutral-400 font-mono">INTEGRATED RISK MANAGEMENT DIAGNOSTIC TERMINAL</p>
          </div>
        </div>

        {/* User Role Simulation selection dropdown */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-1.5">
            <User className="w-4 h-4 text-amber-400" />
            <select
              value={currentUser.roles[0]}
              onChange={(e) => {
                const selectedRole = e.target.value;
                const match = Object.values(MOCK_USERS).find((u) => u.roles.includes(selectedRole))!;
                setCurrentUser(match);
                addLog('ACCESS_CONTROL', 'SUCCESS', `User session changed to role '${selectedRole}'`);
              }}
              className="bg-transparent text-xs text-neutral-300 font-mono border-none outline-none focus:ring-0 cursor-pointer"
            >
              <option value="RISK_ANALYST">Risk Analyst (GRP_IT_RISK)</option>
              <option value="CISO">CISO (GRP_EXEC_COM & IT_RISK)</option>
              <option value="SYSTEM_INGESTION">Ingestion Service Account</option>
            </select>
          </div>

          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold border border-neutral-700 hover:border-amber-500/50 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer text-amber-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Sandbox
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- SCENARIO SELECTOR PANEL (LEFT COLUMN) --- */}
        <section className="lg:col-span-4 flex flex-col gap-6" aria-labelledby="lobbyHeading">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-sm font-bold font-mono tracking-wider text-amber-500 uppercase mb-4" id="lobbyHeading">
              Training Sandbox Scenarios
            </h2>
            
            <div className="flex flex-col gap-2.5">
              {BREAK_FIX_SCENARIOS.map((scenario) => {
                const isActive = activeScenarioId === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => loadScenario(scenario)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/5 shadow-inner'
                        : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-mono font-medium text-amber-400">{scenario.category}</span>
                      {isActive && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-100">{scenario.name}</h3>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE SCENARIO PANEL */}
          {activeScenarioId && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h3 className="font-mono text-xs font-bold text-neutral-400">SCENARIO DIAGNOSTIC DATA</h3>
                {scenarioSuccess ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                    <CheckCircle className="w-3.5 h-3.5" /> RESOLVED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> SYSTEM ERROR
                  </span>
                )}
              </div>

              {/* Ingest text feed input for Scenario 3 */}
              {activeScenarioId === 'SCENARIO_3' && (
                <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3 flex flex-col gap-2">
                  <label className="text-xs font-mono text-neutral-400">Data Feed Raw CSV Token</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={feedInput}
                      onChange={(e) => setFeedInput(e.target.value)}
                      disabled={scenarioSuccess}
                      className="bg-neutral-900 border border-neutral-800 text-sm font-mono px-3 py-1.5 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500/50 w-full"
                    />
                    <button
                      onClick={() => {
                        addLog('FIELD_VALIDATION', 'WARNING', `Feed pipeline triggered. Ingesting raw token: "${feedInput}"`);
                        // Force raw string injection to trigger the truncation error unless mapped
                        const nextRecs = new Map(records);
                        const r = nextRecs.get('REC_RISK_01')!;
                        nextRecs.set('REC_RISK_01', {
                          ...r,
                          values: { ...r.values, FLD_INHERENT_IMPACT: feedInput }
                        });
                        setRecords(nextRecs);
                      }}
                      disabled={scenarioSuccess}
                      className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Run Ingestion
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-mono text-amber-400 mb-1">Operational Symptom:</h4>
                <p className="text-xs text-neutral-300 bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/80 leading-relaxed font-mono">
                  {BREAK_FIX_SCENARIOS.find((s) => s.id === activeScenarioId)?.symptom}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-mono text-neutral-400 mb-2">Available Structural Corrections:</h4>
                <div className="flex flex-col gap-2">
                  {BREAK_FIX_SCENARIOS.find((s) => s.id === activeScenarioId)?.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => applyFixOption(opt)}
                      disabled={scenarioSuccess}
                      className={`text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1 cursor-pointer ${
                        scenarioSuccess
                          ? 'border-neutral-800 bg-neutral-950/20 text-neutral-500'
                          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-200'
                      }`}
                    >
                      <span className="font-semibold text-neutral-100">{opt.label}</span>
                      <span className="text-neutral-400 leading-normal">{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* --- MAIN OPERATIONAL TERM & SCHEMAS (MIDDLE/RIGHT COLUMN) --- */}
        <section className="lg:col-span-8 flex flex-col gap-6" aria-label="Engine workspace">
          
          {/* VISUAL DIAGRAM PORTAL (SVG schemas) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h2 className="text-sm font-bold font-mono tracking-wider text-amber-500 uppercase">
              Relational Schema & Workflow Visualizer
            </h2>
            
            {/* SVG visualization matching exactly node-based workflows and database schemas */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl h-64 relative overflow-hidden flex items-center justify-center">
              
              {/* Dynamic schema links */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  {/* Glowing neon markers */}
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d4a84b" />
                  </marker>
                  <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                  </marker>
                </defs>

                {/* Workflow Transitions */}
                <line x1="85" y1="130" x2="200" y2="130" stroke="#d4a84b" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <line x1="330" y1="130" x2="430" y2="130" stroke="#d4a84b" strokeWidth="1.5" markerEnd="url(#arrow)" />
                
                {/* Decision logic fork lines */}
                <path d="M 500 130 C 560 130, 560 70, 620 70" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow-green)" fill="none" />
                <path d="M 500 130 C 560 130, 560 190, 265 190 C 265 190, 265 160, 265 155" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" strokeDasharray="4" />

                {/* Relational Cross-reference links */}
                <path d="M 140 240 Q 300 280, 520 240" stroke="#a78bfa" strokeWidth="1.2" strokeDasharray="3" fill="none" />
              </svg>

              {/* Start Node */}
              <div className="absolute left-[30px] top-[105px] flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center text-xs font-bold font-mono text-neutral-400">
                  Start
                </div>
              </div>

              {/* Draft Task Node */}
              <div className="absolute left-[200px] top-[105px] flex flex-col items-center">
                <div className={`w-[130px] h-12 rounded-lg border flex flex-col items-center justify-center px-2 text-center ${
                  wfState.currentNodeId === 'NODE_DRAFT'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(212,168,75,0.25)]'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                }`}>
                  <span className="text-xs font-bold">Draft State</span>
                  <span className="text-[9px] font-mono text-neutral-400">Role: IT Risk Analyst</span>
                </div>
                {/* Pulsating record token inside active node */}
                {wfState.currentNodeId === 'NODE_DRAFT' && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                  </span>
                )}
              </div>

              {/* Decision Node */}
              <div className="absolute left-[430px] top-[105px] flex flex-col items-center">
                <div className={`w-[140px] h-12 rounded-lg border flex flex-col items-center justify-center px-2 text-center ${
                  wfState.currentNodeId === 'NODE_DECISION'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(212,168,75,0.25)]'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                }`}>
                  <span className="text-xs font-bold flex items-center gap-1"><Settings className="w-3.5 h-3.5 animate-spin" /> Gate Evaluation</span>
                  <span className="text-[9px] font-mono text-neutral-400">Filter: [Status] == Approved</span>
                </div>
                {wfState.currentNodeId === 'NODE_DECISION' && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                  </span>
                )}
              </div>

              {/* End Node */}
              <div className="absolute left-[620px] top-[45px] flex flex-col items-center">
                <div className={`w-[120px] h-12 rounded-lg border flex flex-col items-center justify-center px-2 text-center ${
                  wfState.currentNodeId === 'NODE_APPROVED_END'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                }`}>
                  <span className="text-xs font-bold">Approved & Active</span>
                  <span className="text-[9px] font-mono text-neutral-400">State: Complete</span>
                </div>
                {wfState.currentNodeId === 'NODE_APPROVED_END' && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              {/* Cross-reference Target controls node representation */}
              <div className="absolute left-[520px] top-[215px] flex flex-col items-center">
                <div className="w-[180px] h-10 rounded border border-purple-500/30 bg-purple-500/5 text-purple-400 flex items-center justify-center text-xs font-mono gap-1.5">
                  <Database className="w-3.5 h-3.5" /> APP_CONTROL_REGISTER
                </div>
              </div>

              {/* Source Risk node representation */}
              <div className="absolute left-[50px] top-[215px] flex flex-col items-center">
                <div className="w-[180px] h-10 rounded border border-purple-500/30 bg-purple-500/5 text-purple-400 flex items-center justify-center text-xs font-mono gap-1.5">
                  <Database className="w-3.5 h-3.5" /> APP_RISK_REGISTER
                </div>
              </div>

            </div>

            {/* Workflow controls */}
            {activeStructureId === 'APP_RISK_REGISTER' && (
              <div className="flex gap-3 justify-center bg-neutral-950 p-3.5 rounded-lg border border-neutral-800">
                <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                  <GitPullRequest className="w-4 h-4 text-amber-500" /> AWF Transition Actions:
                </span>
                
                <button
                  onClick={() => handleWfTransition('SUBMIT')}
                  disabled={wfState.currentNodeId !== 'NODE_DRAFT'}
                  className="px-3.5 py-1 text-xs bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-neutral-300 font-mono font-semibold rounded hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:border-neutral-800 disabled:hover:bg-transparent cursor-pointer"
                >
                  Submit For Review
                </button>
                <button
                  onClick={() => handleWfTransition('APPROVE')}
                  disabled={wfState.currentNodeId !== 'NODE_DECISION'}
                  className="px-3.5 py-1 text-xs bg-neutral-900 border border-neutral-700 hover:border-emerald-500 text-emerald-500 font-mono font-semibold rounded hover:bg-emerald-500/5 transition-colors disabled:opacity-30 disabled:border-neutral-800 disabled:hover:bg-transparent cursor-pointer"
                >
                  Approve (Status == Approved)
                </button>
                <button
                  onClick={() => handleWfTransition('REJECT')}
                  disabled={wfState.currentNodeId !== 'NODE_DECISION'}
                  className="px-3.5 py-1 text-xs bg-neutral-900 border border-neutral-700 hover:border-rose-500 text-rose-500 font-mono font-semibold rounded hover:bg-rose-500/5 transition-colors disabled:opacity-30 disabled:border-neutral-800 disabled:hover:bg-transparent cursor-pointer"
                >
                  Reject (Loopback)
                </button>
              </div>
            )}
          </div>

          {/* CIRCULAR LOOP ALERTS */}
          {circularError && (
            <div className="bg-rose-950/80 border border-rose-500/40 text-rose-200 px-4 py-4 rounded-xl flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-ping" />
              <div>
                <h4 className="font-bold text-sm tracking-wide font-mono uppercase text-rose-300">
                  Critical Thread Aborted: Stack Loop Detected
                </h4>
                <p className="text-xs leading-relaxed font-mono mt-1">{circularError.message}</p>
                <div className="flex gap-2 mt-3 items-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono">
                    Thread Safety Lock
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    Cycle path: {circularError.path.join(' ➔ ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE RECORD DETAILS & FIELDS EDITOR */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold font-mono text-neutral-100">
                  Records Data Grid Explorer
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveStructureId('APP_RISK_REGISTER');
                    setActiveRecordId('REC_RISK_01');
                    setFields(APP_RISK_REGISTER.fields);
                    addLog('FIELD_VALIDATION', 'SUCCESS', "Loaded Grid: 'APP_RISK_REGISTER'");
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    activeStructureId === 'APP_RISK_REGISTER'
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  APP_RISK_REGISTER
                </button>
                <button
                  onClick={() => {
                    setActiveStructureId('APP_CONTROL_REGISTER');
                    setActiveRecordId('REC_CTRL_01');
                    setFields(APP_CONTROL_REGISTER.fields);
                    addLog('FIELD_VALIDATION', 'SUCCESS', "Loaded Grid: 'APP_CONTROL_REGISTER'");
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    activeStructureId === 'APP_CONTROL_REGISTER'
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  APP_CONTROL_REGISTER
                </button>
              </div>
            </div>

            {/* Select active Record inside structure */}
            <div className="flex gap-2">
              {Array.from(records.values())
                .filter((r) => r.structureId === activeStructureId)
                .map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRecordId(r.id);
                      if (r.structureId === 'APP_RISK_REGISTER') {
                        setWfState((prev) => ({ ...prev, recordId: r.id }));
                      }
                      addLog('FIELD_VALIDATION', 'SUCCESS', `Focused record [${r.id}]`);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      activeRecordId === r.id
                        ? 'border-amber-500/50 bg-amber-500/5 text-amber-500'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {r.values.FLD_RISK_ID || r.values.FLD_CONTROL_ID || r.id}
                  </button>
                ))}
            </div>

            {/* Render record fields list editor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800/80">
              {fields.map((field) => {
                const isCalculated = field.type === 'CALCULATED';
                const isReadOnly = field.isReadOnly || ddeOverrides[field.id]?.isReadOnly || isCalculated;
                const isRequired = field.isRequired || ddeOverrides[field.id]?.isRequired;
                const isHidden = field.isHidden || ddeOverrides[field.id]?.isHidden;
                const val = activeRecord.values[field.id];

                if (isHidden) return null;

                return (
                  <div key={field.id} className="flex flex-col gap-1.5 border-b border-neutral-900 pb-3 last:border-0 last:pb-0">
                    <label className="flex items-center justify-between text-xs font-mono text-neutral-400">
                      <span>
                        {field.name}
                        {isRequired && <span className="text-rose-500 ml-1 font-sans font-bold">*</span>}
                      </span>
                      <span className="text-[10px] text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded">
                        {field.type}
                      </span>
                    </label>

                    {/* Numeric or Text field */}
                    {field.type === 'TEXT' || field.type === 'NUMERIC' ? (
                      <input
                        type={field.type === 'NUMERIC' ? 'number' : 'text'}
                        value={val !== undefined ? val : ''}
                        onChange={(e) => handleFieldChange(field.id, field.type === 'NUMERIC' ? Number(e.target.value) : e.target.value)}
                        disabled={isReadOnly}
                        className={`bg-neutral-900 border text-sm font-mono px-3 py-2 rounded-lg text-neutral-200 focus:outline-none ${
                          isReadOnly
                            ? 'border-neutral-800 bg-neutral-950/60 text-neutral-500 cursor-not-allowed'
                            : 'border-neutral-800 focus:border-amber-500/50'
                        }`}
                      />
                    ) : null}

                    {/* Calculated field */}
                    {field.type === 'CALCULATED' ? (
                      <div className="flex flex-col gap-1">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm font-mono flex items-center justify-between">
                          <span className="text-amber-500 font-bold">{val !== undefined ? String(val) : 'Null'}</span>
                          {circularError && circularError.path.includes(field.id) ? (
                            <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                              LOOP ERROR
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                              COMPUTED
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-neutral-500 mt-0.5 block truncate">
                          Formula: {field.calculatedConfig?.formula}
                        </span>
                      </div>
                    ) : null}

                    {/* Values List field */}
                    {field.type === 'VALUES_LIST' ? (
                      <select
                        value={val || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        disabled={isReadOnly}
                        className={`bg-neutral-900 border text-sm font-mono px-3 py-2 rounded-lg text-neutral-200 focus:outline-none cursor-pointer ${
                          isReadOnly
                            ? 'border-neutral-800 bg-neutral-950/60 text-neutral-500 cursor-not-allowed'
                            : 'border-neutral-800 focus:border-amber-500/50'
                        }`}
                      >
                        <option value="">-- Select --</option>
                        {field.valuesListConfig?.options.map((opt) => (
                          <option key={opt.id} value={opt.value}>
                            {opt.value}
                          </option>
                        ))}
                      </select>
                    ) : null}

                    {/* User / Group representation */}
                    {field.type === 'USER_GROUP' ? (
                      <div className="flex flex-wrap gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 min-h-10 text-xs font-mono">
                        {Array.isArray(val) && val.length > 0 ? (
                          val.map((item, idx) => (
                            <span key={idx} className="bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Users className="w-3 h-3 text-amber-500" /> {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-neutral-500 italic p-1">No group memberships mapped</span>
                        )}
                      </div>
                    ) : null}

                    {/* Cross-reference rendering */}
                    {field.type === 'CROSS_REFERENCE' ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 min-h-10 text-xs font-mono">
                          {Array.isArray(val) && val.length > 0 ? (
                            val.map((item, idx) => {
                              const targetRec = records.get(item);
                              const targetLabel = targetRec
                                ? targetRec.values.FLD_CONTROL_ID || targetRec.values.FLD_RISK_ID || item
                                : item;
                              
                              // Check inherited RLS logic on target record
                              const targetStruct = structures.get(targetRec?.structureId || '')!;
                              const rlsAllowed = targetRec ? RLSEngine.evaluateRecordRLS(targetRec, targetStruct, currentUser, rlsConfigs[targetRec.structureId]) : true;

                              return (
                                <span
                                  key={idx}
                                  className={`border px-2 py-0.5 rounded-md flex items-center gap-1.5 font-semibold ${
                                    rlsAllowed
                                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 line-through'
                                  }`}
                                  title={rlsAllowed ? 'RLS Access Granted' : 'Omitted: RLS Blocks Access'}
                                >
                                  <FileText className="w-3 h-3" /> {targetLabel}
                                  {!rlsAllowed && <Shield className="w-3.5 h-3.5 text-rose-500" />}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-neutral-500 italic p-1">No cross-referenced records mapped</span>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* REAL-TIME TERMINAL CONSOLE LOGGER */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-sm">
                <Terminal className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
                  Diagnostic Telemetry Log Output
                </h2>
              </div>
              <div className="flex gap-3">
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded flex items-center gap-1 border border-neutral-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Connection Stable
                </span>
                <button
                  onClick={() => setTelemetryLogs([])}
                  className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer font-mono font-semibold"
                >
                  Clear Console
                </button>
              </div>
            </div>

            {/* Simulated terminal viewport */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 h-56 overflow-y-auto font-mono text-xs flex flex-col gap-2.5 scrollbar-thin scrollbar-track-neutral-950 scrollbar-thumb-neutral-800">
              {telemetryLogs.length === 0 ? (
                <div className="text-neutral-600 italic py-10 text-center select-none font-mono">
                  ApexGRM Diagnostic Interface. Awaiting simulation telemetries...
                </div>
              ) : (
                telemetryLogs.map((log) => {
                  let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                  if (log.status === 'WARNING') statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                  if (log.status === 'CRITICAL_FAIL') statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';

                  return (
                    <div key={log.id} className="border-b border-neutral-900 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex flex-wrap gap-2 items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${statusColor}`}>
                            {log.status}
                          </span>
                          <span className="text-neutral-500 text-[10px] font-semibold font-mono">{log.timestamp}</span>
                          <span className="text-neutral-400 font-bold font-mono">[{log.executionPhase}]</span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">Ctx: {log.applicationContext}</span>
                      </div>
                      
                      {/* Detailed Trace */}
                      <div className="text-neutral-300 font-mono leading-relaxed pl-1">
                        {log.traceDetails.evaluatedExpression || log.errorMessage}
                      </div>

                      {/* Diagnostic details dumps */}
                      {log.traceDetails.currentTokens && (
                        <pre className="text-[10px] text-neutral-500 bg-neutral-900/60 p-2 rounded mt-1.5 border border-neutral-900 overflow-x-auto leading-normal">
                          {JSON.stringify(log.traceDetails.currentTokens, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-6 mt-12 text-center text-xs text-neutral-500 font-mono">
        <p>© 2026 Rycode. All rights reserved. · ApexGRM Engine Sandbox Mode</p>
      </footer>

    </div>
  );
}
