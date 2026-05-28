import { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  Terminal,
  Settings,
  GitPullRequest,
  Shield,
  User,
  RotateCcw
} from 'lucide-react';

import { FormulaEvaluator } from './engines/CalculationsEngine';
import { RLSEngine } from './engines/RLSEngine';
import type { RLSConfig } from './engines/RLSEngine';
import {
  MOCK_USERS,
  APP_RISK_REGISTER,
  APP_CONTROL_REGISTER,
  DEFAULT_DATABASE_RECORDS
} from './data/BreakFixScenarios';
import type { Field, RecordPayload, SimulatedUserContext, Structure } from './types/SystemTaxonomyConfig';

export default function App() {
  // --- STATE REGISTRY ---
  const [currentUser, setCurrentUser] = useState<SimulatedUserContext>(MOCK_USERS.RISK_ANALYST);
  const [records, setRecords] = useState<Map<string, RecordPayload>>(DEFAULT_DATABASE_RECORDS());
  const [activeTab, setActiveTab] = useState<'FIELDS' | 'FEEDS' | 'DDE' | 'AWF' | 'SECURITY'>('FIELDS');
  
  // Selection states
  const [selectedFieldId, setSelectedFieldId] = useState<string>('FLD_RISK_ID');
  const [selectedFeedFieldId, setSelectedFeedFieldId] = useState<string>('FLD_INHERENT_IMPACT');
  const [selectedDdeRuleId, setSelectedDdeRuleId] = useState<string>('Freeze_Audits_Draft');
  const [selectedWfNodeId, setSelectedWfNodeId] = useState<string>('NODE_DRAFT');
  
  // Custom Playground States
  const [feedInput, setFeedInput] = useState<string>('5 - Critical');
  const [feedLogs, setFeedLogs] = useState<string[]>([]);
  const [coercedValue, setCoercedValue] = useState<any>(null);
  const [upsertMode, setUpsertMode] = useState<'UPSERT' | 'INSERT_ONLY' | 'UPDATE_ONLY'>('UPSERT');
  
  const [selectedFormula, setSelectedFormula] = useState<string>('BASIC');
  const [formulaLogs, setFormulaLogs] = useState<string[]>([]);
  const [formulaResult, setFormulaResult] = useState<any>(null);
  
  const [ddeTimelineLogs, setDdeTimelineLogs] = useState<string[]>([]);
  const [securityCheckLog, setSecurityCheckLog] = useState<string[]>([]);
  
  // Engines reference configs
  const [structures] = useState<Map<string, Structure>>(
    new Map([
      ['APP_RISK_REGISTER', APP_RISK_REGISTER],
      ['APP_CONTROL_REGISTER', APP_CONTROL_REGISTER]
    ])
  );
  const [fields] = useState<Field[]>([...APP_RISK_REGISTER.fields, ...APP_CONTROL_REGISTER.fields]);
  const [rlsConfigs, setRlsConfigs] = useState<Record<string, RLSConfig>>({
    APP_RISK_REGISTER: { isEnabled: false, allowIfFieldsEmpty: true },
    APP_CONTROL_REGISTER: { isEnabled: true, userFieldId: undefined, groupFieldId: 'FLD_ALLOWED_GROUPS', allowIfFieldsEmpty: true }
  });
  
  const [wfState, setWfState] = useState<{
    recordId: string;
    currentNodeId: string;
    isCompleted: boolean;
    history: { nodeId: string; timestamp: string }[];
  }>({
    recordId: 'REC_RISK_01',
    currentNodeId: 'NODE_DRAFT',
    isCompleted: false,
    history: [{ nodeId: 'NODE_START', timestamp: new Date().toISOString() }]
  });

  // --- RE-CALCULATION PLAYGROUND TRIGGER ---
  useEffect(() => {
    runFormulaCalculation();
  }, [selectedFormula, currentUser, records]);

  // --- INGESTION RUN SIMULATION ---
  const runIngestionSimulation = () => {
    const logs: string[] = [];
    logs.push(`[0.00ms] Ingestion Data Feed Pipeline initialized (Upsert Mode: ${upsertMode})`);
    logs.push(`[1.20ms] Extracting payload column maps. Raw feed value: "${feedInput}"`);

    // Coercion settings based on target
    const targetField = fields.find(f => f.id === selectedFeedFieldId);
    if (!targetField) {
      logs.push(`[ERROR] Target Field definition "${selectedFeedFieldId}" not found in database metadata.`);
      setFeedLogs(logs);
      return;
    }

    logs.push(`[2.50ms] Mapping column to Target Field: "${targetField.name}" [Type: ${targetField.type}]`);

    let parsedVal: any = feedInput;

    if (targetField.type === 'NUMERIC') {
      logs.push(`[4.10ms] Executing regex type coercion: stripping text elements and formatting strings...`);
      // Strip everything except numbers, decimal points, and negative signs
      const numbersOnly = feedInput.replace(/[^0-9.-]/g, '');
      parsedVal = numbersOnly ? Number(numbersOnly) : null;
      
      if (isNaN(parsedVal) || parsedVal === null) {
        logs.push(`[WARNING] Coercion skewed: String "${feedInput}" could not be parsed to pure decimal. Defaulting to NULL.`);
        parsedVal = null;
      } else {
        logs.push(`[SUCCESS] Value successfully coerced from string "${feedInput}" to float: ${parsedVal}`);
      }
    } 
    else if (targetField.type === 'VALUES_LIST') {
      logs.push(`[4.80ms] Executing Lookup Translation map: searching Option Registry for matching string key...`);
      const options = APP_RISK_REGISTER.fields.find(f => f.id === 'FLD_STATUS')?.valuesListConfig?.options || [];
      
      // Look for fuzzy value matching
      const matchedOption = options.find(opt => 
        opt.value.toLowerCase() === feedInput.trim().toLowerCase() ||
        feedInput.trim().toLowerCase().includes(opt.value.toLowerCase())
      );

      if (matchedOption) {
        parsedVal = matchedOption.id;
        logs.push(`[SUCCESS] Lookup Matched! String "${feedInput}" resolved to Values List Option ID: "${matchedOption.id}" (${matchedOption.value})`);
      } else {
        logs.push(`[CRITICAL_FAIL] Translation orphaned: No registered Values List Option matched "${feedInput}". Attempting SQL transaction with NULL.`);
        parsedVal = null;
      }
    } 
    else if (targetField.type === 'USER_GROUP') {
      logs.push(`[5.20ms] Crawling Active Directory LDAP path: CN=Users,DC=GRM...`);
      if (feedInput.toUpperCase().includes('ANALYST') || feedInput.toUpperCase().includes('SMITH')) {
        parsedVal = [MOCK_USERS.RISK_ANALYST.id];
        logs.push(`[SUCCESS] User account resolved: "${MOCK_USERS.RISK_ANALYST.username}"`);
      } else if (feedInput.toUpperCase().includes('CISO') || feedInput.toUpperCase().includes('EXEC')) {
        parsedVal = [MOCK_USERS.CISO.id];
        logs.push(`[SUCCESS] User account resolved: "${MOCK_USERS.CISO.username}"`);
      } else {
        logs.push(`[WARNING] Directory query returned empty. User field saved as empty array.`);
        parsedVal = [];
      }
    } else {
      logs.push(`[5.50ms] Plain string insertion mapped directly.`);
    }

    setCoercedValue(parsedVal);

    // Upsert database matching check
    logs.push(`[7.20ms] Checking Key Field constraints. Evaluation key: "FLD_RISK_ID" == "REC_RISK_01"`);
    const nextRecs = new Map(records);
    const existingRec = nextRecs.get('REC_RISK_01')!;

    if (upsertMode === 'UPDATE_ONLY' || upsertMode === 'UPSERT') {
      logs.push(`[8.80ms] Key field found: Record "REC_RISK_01" exists in tblContent. Initiating UPDATE SQL transaction.`);
      const updatedValues = { ...existingRec.values, [selectedFeedFieldId]: parsedVal };
      nextRecs.set('REC_RISK_01', { ...existingRec, values: updatedValues });
      setRecords(nextRecs);
      logs.push(`[SUCCESS] SQL Commit completed. content_id: 1002, table: tblIV${targetField.type === 'VALUES_LIST' ? 'ValuesList' : targetField.type.charAt(0) + targetField.type.slice(1).toLowerCase()} updated.`);
    } else {
      logs.push(`[8.90ms] Ingestion blocked: INSERT mode skipped for duplicate matching key.`);
    }

    setFeedLogs(logs);
  };

  // --- FORMULA RUNNER & DAG CYCLING SIMULATION ---
  const runFormulaCalculation = () => {
    const logs: string[] = [];
    const activeRec = records.get('REC_RISK_01')!;
    const fieldsMap = new Map(fields.map(f => [f.id, f]));
    
    logs.push(`[0.00ms] Calculation Recalculation Engine triggered.`);
    logs.push(`[1.00ms] Building Field Dependency Map (Directed Acyclic Graph) for formulas...`);

    if (selectedFormula === 'CIRCULAR') {
      logs.push(`[2.10ms] Dependency DAG added node: FLD_INHERENT_IMPACT depends on FLD_INHERENT_SCORE`);
      logs.push(`[2.40ms] Dependency DAG added node: FLD_INHERENT_SCORE depends on FLD_INHERENT_IMPACT`);
      logs.push(`[3.10ms] Initiating Depth-First Search (DFS) circular calculation loop auditing...`);
      logs.push(`[3.90ms] Loop Tracker visiting: FLD_INHERENT_IMPACT`);
      logs.push(`[4.20ms] Loop Tracker visiting: FLD_INHERENT_SCORE`);
      logs.push(`[4.50ms] Loop Tracker visiting: FLD_INHERENT_IMPACT -> [VISITING STATE ENCOUNTERED]`);
      
      const cyclicPath = ['FLD_INHERENT_IMPACT', 'FLD_INHERENT_SCORE', 'FLD_INHERENT_IMPACT'];
      logs.push(`[CRITICAL_FAIL] Circular Dependency Loop Detected! Aborting thread recursively: ${cyclicPath.join(' -> ')}`);
      setFormulaResult('PARADOX_LOCK');
      setFormulaLogs(logs);
      return;
    }

    // Configure evaluator respect to dynamic record visibility
    const evaluator = new FormulaEvaluator(
      activeRec,
      records,
      fieldsMap,
      (targetRec, user) => {
        const targetStruct = structures.get(targetRec.structureId)!;
        return RLSEngine.evaluateRecordRLS(targetRec, targetStruct, user, rlsConfigs[targetRec.structureId]);
      },
      currentUser
    );

    let formula = '';
    let expectedResult: any = null;

    if (selectedFormula === 'BASIC') {
      formula = 'FLD_INHERENT_IMPACT * FLD_INHERENT_LIKELIHOOD';
      logs.push(`[2.00ms] Compiling formula: "${formula}"`);
      logs.push(`[2.80ms] Sorting dependencies: FLD_INHERENT_IMPACT (Value: ${activeRec.values.FLD_INHERENT_IMPACT}) & FLD_INHERENT_LIKELIHOOD (Value: ${activeRec.values.FLD_INHERENT_LIKELIHOOD})`);
      expectedResult = evaluator.evaluate(formula);
      logs.push(`[SUCCESS] Formula evaluation complete. Mathematical result: ${expectedResult}`);
    } 
    else if (selectedFormula === 'IF_COMP') {
      formula = "IF(FLD_INHERENT_IMPACT > 4, 'CRITICAL', 'NORMAL')";
      logs.push(`[2.00ms] Compiling conditional formula: "${formula}"`);
      logs.push(`[2.60ms] Crawling dependency nodes: FLD_INHERENT_IMPACT == ${activeRec.values.FLD_INHERENT_IMPACT}`);
      expectedResult = evaluator.evaluate(formula);
      logs.push(`[SUCCESS] Conditions parsed. String result: "${expectedResult}"`);
    } 
    else if (selectedFormula === 'XREF_SUM') {
      formula = 'SUM(FLD_CONTROLS_REF.FLD_CONTROL_SCORE)';
      logs.push(`[2.00ms] Compiling cross-reference aggregation formula: "${formula}"`);
      logs.push(`[2.90ms] Crawling relational join table tblIVXRef for active links...`);
      
      const linkedRecordIds = activeRec.values.FLD_CONTROLS_REF as string[] || [];
      logs.push(`[3.50ms] Join pointers found: ${linkedRecordIds.length} target content IDs: [${linkedRecordIds.join(', ')}]`);
      
      // Perform security check logs
      logs.push(`[4.20ms] Security check: Running Record-Level Security RLS evaluate on linked content IDs...`);
      let visibleCount = 0;
      let blockedCount = 0;

      linkedRecordIds.forEach(id => {
        const trgRec = records.get(id);
        if (trgRec) {
          const isAllowed = RLSEngine.evaluateRecordRLS(trgRec, APP_CONTROL_REGISTER, currentUser, rlsConfigs.APP_CONTROL_REGISTER);
          if (isAllowed) {
            visibleCount++;
            logs.push(`  - Content ID "${id}": Visibility GRANTED for ${currentUser.roles[0]}`);
          } else {
            blockedCount++;
            logs.push(`  - Content ID "${id}": Visibility DENIED (Blocked by RLS constraints)`);
          }
        }
      });

      if (blockedCount > 0) {
        logs.push(`[WARNING] RLS Security Ghost Active: ${blockedCount} records silently omitted from aggregation results!`);
      }

      expectedResult = evaluator.evaluate(formula);
      logs.push(`[SUCCESS] Aggregations completed. Sum result: ${expectedResult}`);
    }

    setFormulaResult(expectedResult);
    setFormulaLogs(logs);
  };

  // --- DDE RULE & AWF TIMELINE TRIGGER ---
  const runDdeTimelineTest = (isResolved: boolean) => {
    const logs: string[] = [];
    logs.push(`[0.00ms] Action submit button clicked by user: "${currentUser.username}"`);
    logs.push(`[1.10ms] AWF: Triggering active workflow step: "Draft State" -> NODE_DECISION`);
    logs.push(`[2.20ms] Dynamic Rule evaluation: Scanning active DDE triggers...`);

    if (!isResolved) {
      logs.push(`[3.20ms] DDE Rule 'Freeze_Audits_Draft' fired on state trigger.`);
      logs.push(`[4.10ms] DDE Action executed: SET_VALUE FLD_STATUS = "Draft"`);
      logs.push(`[5.30ms] Recalculation Engine ran: updated FLD_STATUS inside tblIVValuesList`);
      logs.push(`[6.50ms] AWF: Evaluating workflow node Transition guard: Gate Evaluation`);
      logs.push(`[7.20ms] AWF Rule check: Guard expects FLD_STATUS == "Approved". Current value: "Draft"`);
      logs.push(`[CRITICAL_FAIL] AWF Routing Deadlock! Status override prevents node advancement. Record reverted to "Draft State".`);
      setWfState(prev => ({ ...prev, currentNodeId: 'NODE_DRAFT' }));
    } else {
      logs.push(`[3.20ms] State-aware trigger check: AWF active transition state detected.`);
      logs.push(`[4.00ms] DDE Rule 'Freeze_Audits_Draft' bypassed (DDE Audit Freeze Rule disabled for transition safety).`);
      logs.push(`[5.10ms] AWF: Evaluating workflow node Transition guard: Gate Evaluation`);
      logs.push(`[6.00ms] AWF Rule check: Guard expects FLD_STATUS == "Approved". Value matches!`);
      logs.push(`[SUCCESS] AWF Node transitioned: "Draft State" -> "Approved End"`);
      logs.push(`[SUCCESS] Workflow instance completed successfully.`);
      setWfState(prev => ({
        ...prev,
        currentNodeId: 'NODE_APPROVED_END',
        isCompleted: true,
        history: [...prev.history, { nodeId: 'NODE_APPROVED_END', timestamp: new Date().toISOString() }]
      }));
    }

    setDdeTimelineLogs(logs);
  };

  // --- SECURITY PATH GATE INSPECTOR ---
  const runSecurityGateAudit = () => {
    const logs: string[] = [];
    const targetRec = records.get('REC_CTRL_01')!;
    
    logs.push(`[0.00ms] RLS Security gate audit requested for User ID: "${currentUser.id}"`);
    logs.push(`[1.20ms] Active roles list: [${currentUser.roles.join(', ')}], Dynamic Groups: [${currentUser.groups.join(', ')}]`);
    logs.push(`[2.50ms] Step 1: Evaluating Module-Level Access Control (RBAC)...`);
    
    const rbacAllowed = RLSEngine.evaluateModuleAccess(APP_CONTROL_REGISTER, currentUser, ['CISO', 'RISK_ANALYST']);
    if (rbacAllowed) {
      logs.push(`[PASS] RBAC Check passed. Role contains necessary structure clearance.`);
    } else {
      logs.push(`[BLOCK] RBAC Check failed. Role lacks metadata access to Control Application.`);
      setSecurityCheckLog(logs);
      return;
    }

    logs.push(`[3.90ms] Step 2: Evaluating dynamic Record-Level Security (RLS)...`);
    logs.push(`[4.50ms] Reading RLS control field: "FLD_ALLOWED_GROUPS"`);
    
    const recordGroups = targetRec.values.FLD_ALLOWED_GROUPS as string[] || [];
    logs.push(`[5.10ms] Record permission whitelisted groups: [${recordGroups.join(', ')}]`);
    
    const rlsPass = RLSEngine.evaluateRecordRLS(targetRec, APP_CONTROL_REGISTER, currentUser, rlsConfigs.APP_CONTROL_REGISTER);
    if (rlsPass) {
      logs.push(`[PASS] RLS Check passed. User groups intersect with record whitelists.`);
      logs.push(`[SUCCESS] Security Clearance GRANTED. Record is fully visible in UI views.`);
    } else {
      logs.push(`[BLOCK] RLS Check failed. User group not in whitelisted registry.`);
      logs.push(`[DENIED] Security Clearance BLOCKED. Record is completely filtered out.`);
    }

    setSecurityCheckLog(logs);
  };

  const resetAll = () => {
    setRecords(DEFAULT_DATABASE_RECORDS());
    setFeedLogs([]);
    setFormulaLogs([]);
    setDdeTimelineLogs([]);
    setSecurityCheckLog([]);
    setWfState({
      recordId: 'REC_RISK_01',
      currentNodeId: 'NODE_DRAFT',
      isCompleted: false,
      history: [{ nodeId: 'NODE_START', timestamp: new Date().toISOString() }]
    });
  };

  const selectedField = fields.find(f => f.id === selectedFieldId) || fields[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950 antialiased">
      
      {/* --- TOP HEADER NAVIGATION --- */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur px-6 py-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-amber-500 animate-pulse" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-100 font-mono">
              ApexGRM Studio <span className="text-amber-500 font-normal">v3.0.0</span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">GRC & ApexGRM IRM Engineering Companion</p>
          </div>
        </div>

        {/* Configuration Screen Tab Selectors */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 flex-wrap">
          <button
            onClick={() => setActiveTab('FIELDS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'FIELDS' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Field Builder
          </button>
          <button
            onClick={() => setActiveTab('FEEDS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'FEEDS' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Data Feeds
          </button>
          <button
            onClick={() => setActiveTab('DDE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'DDE' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            DDE Rules
          </button>
          <button
            onClick={() => setActiveTab('AWF')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'AWF' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            AWF Designer
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'SECURITY' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Access Control
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-1.5">
            <User className="w-4 h-4 text-amber-400" />
            <select
              value={currentUser.roles[0]}
              onChange={(e) => {
                const selectedRole = e.target.value;
                const match = Object.values(MOCK_USERS).find((u) => u.roles.includes(selectedRole))!;
                setCurrentUser(match);
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
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono border border-neutral-700 hover:border-amber-500/50 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer text-amber-500"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Sandbox
          </button>
        </div>
      </header>

      {/* --- SPLIT SCREEN WORKSPACE --- */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* =======================================================
             LEFT COLUMN: CONFIGURATION PORTAL (System Interface Representation)
             ======================================================= */}
        <section className="lg:col-span-6 flex flex-col gap-6" aria-label="GRC Configuration Portal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            
            {activeTab === 'FIELDS' && (
              <div className="flex flex-col gap-4">
                <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
                  <h2 className="text-sm font-bold font-mono text-amber-500 uppercase tracking-wider">
                    Application Field Builder
                  </h2>
                  <span className="text-[10px] text-neutral-400 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    Module: Risk Register
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-normal">
                  Representing the metadata schema manager. Select a field inside the Application Layout to configure its properties and view things to consider down in the manual.
                </p>

                {/* Field Builder Layout Mockup */}
                <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-lg flex flex-col gap-3 font-mono">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1.5">
                    Field Registry Setup Panel
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    {fields.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFieldId(f.id)}
                        className={`text-left p-3 rounded-lg border text-xs flex flex-col gap-1 transition-all cursor-pointer ${
                          selectedFieldId === f.id
                            ? 'border-amber-500 bg-amber-500/5'
                            : 'border-neutral-800/80 bg-neutral-900/50 hover:border-neutral-700'
                        }`}
                      >
                        <span className="font-semibold text-neutral-200">{f.name}</span>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[9px] text-neutral-500">{f.id}</span>
                          <span className="text-[8px] bg-neutral-900 px-1 py-0.5 rounded text-amber-400 border border-neutral-800">
                            {f.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Field Detail Property Form */}
                <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-lg flex flex-col gap-3 font-mono text-xs text-neutral-300">
                  <span className="text-neutral-400 font-bold block border-b border-neutral-900 pb-1">
                    Metadata Parameters for: {selectedField.name}
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-neutral-500">Validation Status</label>
                      <div className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-[11px] flex items-center justify-between">
                        <span>Required flag</span>
                        <input type="checkbox" checked={selectedField.isRequired} readOnly className="rounded border-neutral-800 text-amber-500 focus:ring-0 cursor-not-allowed" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-neutral-500">Access Mode</label>
                      <div className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-[11px] flex items-center justify-between">
                        <span>Read-Only flag</span>
                        <input type="checkbox" checked={selectedField.isReadOnly} readOnly className="rounded border-neutral-800 text-amber-500 focus:ring-0 cursor-not-allowed" />
                      </div>
                    </div>
                    
                    {selectedField.type === 'NUMERIC' && (
                      <>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-neutral-500">Minimum Bounds</label>
                          <input type="text" value={String(selectedField.minValue ?? 0)} disabled className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-neutral-400 cursor-not-allowed text-[11px]" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-neutral-500">Maximum Bounds</label>
                          <input type="text" value={String(selectedField.maxValue ?? 100)} disabled className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-neutral-400 cursor-not-allowed text-[11px]" />
                        </div>
                      </>
                    )}

                    {selectedField.type === 'TEXT' && (
                      <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[10px] text-neutral-500">Maximum Character Length</label>
                        <input type="text" value="250 (Varchar block)" disabled className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-neutral-400 cursor-not-allowed text-[11px]" />
                      </div>
                    )}

                    {selectedField.type === 'CALCULATED' && (
                      <div className="flex flex-col gap-1 col-span-2">
                        <label className="text-[10px] text-neutral-500">Active Formula Expression</label>
                        <code className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800 text-neutral-200 text-[10px] overflow-x-auto whitespace-nowrap block">
                          {selectedField.calculatedConfig?.formula}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'FEEDS' && (
              <div className="flex flex-col gap-4">
                <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
                  <h2 className="text-sm font-bold font-mono text-amber-500 uppercase tracking-wider">
                    Data Feed Manager
                  </h2>
                  <span className="text-[10px] text-neutral-400 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    Integration Pipeline Setup
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-normal">
                  Representing the GRC Data Feed mapping canvas. Choose a target field and simulate how raw un-mapped string data transforms through coercion and translation logic.
                </p>

                {/* Input Ingestion Form */}
                <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-lg flex flex-col gap-3 font-mono text-xs">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1.5">
                    Source Mapping Setup Screen
                  </span>

                  <div className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-neutral-400 font-semibold">1. Select Target Field Mapping</label>
                      <select
                        value={selectedFeedFieldId}
                        onChange={(e) => setSelectedFeedFieldId(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                      >
                        <option value="FLD_RISK_NAME">FLD_RISK_NAME (TEXT)</option>
                        <option value="FLD_INHERENT_IMPACT">FLD_INHERENT_IMPACT (NUMERIC)</option>
                        <option value="FLD_STATUS">FLD_STATUS (VALUES_LIST)</option>
                        <option value="FLD_OWNER_GROUPS">FLD_OWNER_GROUPS (USER_GROUP)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-neutral-400 font-semibold">2. Key Field Config</label>
                        <div className="bg-neutral-900 px-3 py-2 rounded border border-neutral-800 flex items-center justify-between text-[11px]">
                          <span>Key Field Upsert Check</span>
                          <input type="checkbox" checked={selectedFeedFieldId === 'FLD_RISK_ID'} readOnly className="rounded border-neutral-800 text-amber-500 cursor-not-allowed" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-neutral-400 font-semibold">3. Upsert Mode</label>
                        <select
                          value={upsertMode}
                          onChange={(e) => setUpsertMode(e.target.value as any)}
                          className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                        >
                          <option value="UPSERT">UPSERT (Update or Insert)</option>
                          <option value="INSERT_ONLY">INSERT ONLY</option>
                          <option value="UPDATE_ONLY">UPDATE ONLY</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-neutral-400 font-semibold">4. Enter Raw Source CSV String Value</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={feedInput}
                          onChange={(e) => setFeedInput(e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 text-sm font-mono px-3 py-1.5 rounded-lg text-neutral-200 focus:outline-none focus:border-amber-500/50 w-full"
                          placeholder="e.g. 5 - Critical"
                        />
                        <button
                          onClick={runIngestionSimulation}
                          className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-neutral-950 font-mono font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Run Ingest
                        </button>
                      </div>
                      <div className="flex gap-2.5 mt-1 text-[9px] text-neutral-500 justify-between">
                        <span>Try typing: "4" (for Numeric), "Review" (for Values List), or "Smith" (for User)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'DDE' && (
              <div className="flex flex-col gap-4">
                <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
                  <h2 className="text-sm font-bold font-mono text-amber-500 uppercase tracking-wider">
                    DDE Rules Editor
                  </h2>
                  <span className="text-[10px] text-neutral-400 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    UI Logic Builder
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-normal">
                  Representing the Data Driven Events rule selector. Triggers rules dynamically based on criteria. Select a rule to explore DDE debug deadlocks and timelines in the companion.
                </p>

                {/* Rule Builder Visual Panel */}
                <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-lg flex flex-col gap-3.5 font-mono text-xs">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1.5">
                    Active Rule Whitelist
                  </span>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedDdeRuleId('Freeze_Audits_Draft')}
                      className={`text-left p-3 rounded-lg border text-xs flex flex-col gap-1 transition-all cursor-pointer ${
                        selectedDdeRuleId === 'Freeze_Audits_Draft'
                          ? 'border-amber-500 bg-amber-500/5'
                          : 'border-neutral-850 bg-neutral-900/40 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-neutral-200">Rule 1: Freeze_Audits_Draft (Deadlock Risk)</span>
                        <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-1 py-0.5 rounded">Active</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1">If Status == 'Under Review' &rarr; Set Status = 'Draft' (Forces Audit Lock)</span>
                    </button>
                  </div>

                  <div className="border-t border-neutral-900 pt-3 flex flex-col gap-3">
                    <span className="text-neutral-400 font-bold">Diagnose State Action Transition</span>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      AWF Node "Gate Evaluation" expects status to advance to "Approved" to route the record forward. However, Rule 1 resets status to "Draft" on save, causing a perpetual loop deadlock.
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => runDdeTimelineTest(false)}
                        className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Submit with Active DDE Rule
                      </button>
                      <button
                        onClick={() => runDdeTimelineTest(true)}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Submit with Transition Bypass
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'AWF' && (
              <div className="flex flex-col gap-4">
                <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
                  <h2 className="text-sm font-bold font-mono text-amber-500 uppercase tracking-wider">
                    Advanced Workflow Designer
                  </h2>
                  <span className="text-[10px] text-neutral-400 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    State Machine Visualizer
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-normal">
                  Representing the AWF designer canvas. Dynamic nodes route record states based on evaluation guards. Click on nodes to load their checklists.
                </p>

                {/* SVG Visual Node map */}
                <div className="bg-neutral-950 border border-neutral-850 rounded-lg p-3 relative h-56 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d4a84b" />
                      </marker>
                    </defs>
                    <line x1="60" y1="100" x2="140" y2="100" stroke="#d4a84b" strokeWidth="1.5" markerEnd="url(#arrow)" />
                    <line x1="260" y1="100" x2="330" y2="100" stroke="#d4a84b" strokeWidth="1.5" markerEnd="url(#arrow)" />
                    <path d="M 400 100 C 440 100, 440 50, 480 50" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" />
                    <path d="M 400 100 C 440 100, 440 150, 200 150 C 200 150, 200 130, 200 125" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" strokeDasharray="3" />
                  </svg>

                  {/* Start Node */}
                  <button
                    onClick={() => setSelectedWfNodeId('NODE_START')}
                    className={`absolute left-[15px] top-[75px] w-12 h-12 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono cursor-pointer ${
                      selectedWfNodeId === 'NODE_START' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-neutral-700 bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    Start
                  </button>

                  {/* Task Node */}
                  <button
                    onClick={() => setSelectedWfNodeId('NODE_DRAFT')}
                    className={`absolute left-[140px] top-[75px] w-28 h-12 rounded-lg border flex flex-col items-center justify-center text-center cursor-pointer ${
                      selectedWfNodeId === 'NODE_DRAFT' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold">Draft State</span>
                    <span className="text-[8px] text-neutral-400 font-mono">assigned: IT Analyst</span>
                  </button>

                  {/* Decision Node */}
                  <button
                    onClick={() => setSelectedWfNodeId('NODE_DECISION')}
                    className={`absolute left-[330px] top-[75px] w-20 h-12 rounded-lg border flex items-center justify-center text-center cursor-pointer ${
                      selectedWfNodeId === 'NODE_DECISION' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold font-mono">Review Gate</span>
                  </button>

                  {/* End Node */}
                  <button
                    onClick={() => setSelectedWfNodeId('NODE_APPROVED_END')}
                    className={`absolute left-[480px] top-[25px] w-16 h-12 rounded-lg border flex items-center justify-center text-center cursor-pointer ${
                      selectedWfNodeId === 'NODE_APPROVED_END' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold font-mono">Approved</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'SECURITY' && (
              <div className="flex flex-col gap-4">
                <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
                  <h2 className="text-sm font-bold font-mono text-amber-500 uppercase tracking-wider">
                    Access Control Config
                  </h2>
                  <span className="text-[10px] text-neutral-400 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    RBAC / RLS Gates
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-normal">
                  Representing structural security settings. Toggle dynamic RLS configs and inspect how target permissions block or grant access to database records.
                </p>

                {/* Security Config Form */}
                <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-lg flex flex-col gap-3.5 font-mono text-xs text-neutral-300">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1.5">
                    Structure-Level Security Parameters
                  </span>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-neutral-400 font-semibold">1. Module RBAC Whitelist Roles</label>
                      <div className="bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800 flex flex-wrap gap-1.5">
                        <span className="bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded text-[10px]">CISO</span>
                        <span className="bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded text-[10px]">RISK_ANALYST</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-neutral-400 font-semibold">2. Record-Level Security RLS Configuration</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-800 flex items-center justify-between text-[10px]">
                          <span>RLS Active</span>
                          <input
                            type="checkbox"
                            checked={rlsConfigs.APP_CONTROL_REGISTER.isEnabled}
                            onChange={(e) => {
                              setRlsConfigs({
                                ...rlsConfigs,
                                APP_CONTROL_REGISTER: { ...rlsConfigs.APP_CONTROL_REGISTER, isEnabled: e.target.checked }
                              });
                            }}
                            className="rounded border-neutral-850 text-amber-500 cursor-pointer"
                          />
                        </div>
                        <div className="bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-800 flex items-center justify-between text-[10px]">
                          <span>Allow if Empty</span>
                          <input type="checkbox" checked={rlsConfigs.APP_CONTROL_REGISTER.allowIfFieldsEmpty} readOnly className="rounded border-neutral-850 text-amber-500 cursor-not-allowed" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-neutral-900 pt-3 flex flex-col gap-2">
                      <span className="text-neutral-400 font-bold">Dynamic Security Gate Auditor</span>
                      <p className="text-[11px] text-neutral-400 leading-normal">
                        Select a user role in the header and run the dynamic security auditor to trace RLS checks on the Control Register.
                      </p>
                      <button
                        onClick={runSecurityGateAudit}
                        className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold font-mono rounded transition-colors cursor-pointer"
                      >
                        Execute Security Gate Audit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* =======================================================
             RIGHT COLUMN: THE GRC ENGINEERING COMPANION & MANUAL
             ======================================================= */}
        <section className="lg:col-span-6 flex flex-col gap-6" aria-label="GRC Engineering Companion">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            
            {activeTab === 'FIELDS' && (
              <div className="flex flex-col gap-4 text-xs font-mono">
                <div className="border-b border-neutral-800 pb-2 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                    GRC Field Reference Card
                  </h2>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                    Field ID: {selectedFieldId}
                  </span>
                </div>

                {/* Schema database lookup mapping */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-amber-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    1. GRC Backend EAV Blueprint
                  </span>
                  <div className="text-[11px] text-neutral-300 leading-normal flex flex-col gap-1 text-neutral-400">
                    <div>
                      <strong className="text-neutral-200">Metadata Registry:</strong> <code>tblFieldDefinition</code> row populated where <code>FieldTypeID = {
                        selectedField.type === 'TEXT' ? '1' : selectedField.type === 'NUMERIC' ? '2' : selectedField.type === 'VALUES_LIST' ? '4' : '8'
                      }</code>.
                    </div>
                    <div>
                      <strong className="text-neutral-200">Data Storage Table:</strong> <code>tblIV{
                        selectedField.type === 'VALUES_LIST' ? 'ValuesList' : selectedField.type === 'CROSS_REFERENCE' ? 'XRef' : selectedField.type.charAt(0) + selectedField.type.slice(1).toLowerCase()
                      }</code> matches <code>ContentID</code> and <code>FieldID</code> columns.
                    </div>
                  </div>
                </div>

                {/* Adjusting pitfalls checklist */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-rose-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    2. Adjustment Pitfalls Checklist
                  </span>
                  <ul className="text-[10.5px] text-neutral-300 leading-relaxed list-disc list-inside flex flex-col gap-1">
                    {selectedField.type === 'TEXT' && (
                      <>
                        <li><strong className="text-neutral-100">Length Reductions:</strong> Shrinking maxLength does not trim SQL tables instantly, but future saving attempts fail if records exceed the limit.</li>
                        <li><strong className="text-neutral-100">Index Locks:</strong> Changing character configurations locks target SQL tables during indexing.</li>
                      </>
                    )}
                    {selectedField.type === 'NUMERIC' && (
                      <>
                        <li><strong className="text-neutral-100">Decimal Scale Reductions:</strong> Reducing decimal precision (e.g. 4 to 2) permanently truncates database values on next save.</li>
                        <li><strong className="text-neutral-100">Format String Skew:</strong> Ingesting files containing signs (`$`, `%`) crashes parsing logic unless clean decimals are coerced.</li>
                      </>
                    )}
                    {selectedField.type === 'DATE_TIME' && (
                      <>
                        <li><strong className="text-neutral-100">Timezone Offset Drift:</strong> Calculating offsets between servers without explicit ISO 8601 formatting drifts dates by up to 24 hours.</li>
                        <li><strong className="text-neutral-100">Date-Only Truncation:</strong> Converting a Date-Time field to Date-Only wipes all time logs.</li>
                      </>
                    )}
                    {selectedField.type === 'VALUES_LIST' && (
                      <>
                        <li><strong className="text-neutral-100">Orphaned value list Option IDs:</strong> Deleting Value options leaves historic content rows pointing to NULL IDs (displays empty values in the UI).</li>
                        <li><strong className="text-neutral-100">API value mapping friction:</strong> Direct text writes fail. Integrations must translate text strings to exact internal `OptionID` keys.</li>
                      </>
                    )}
                    {selectedField.type === 'CROSS_REFERENCE' && (
                      <>
                        <li><strong className="text-neutral-100">Cascading purge:</strong> Enabling delete-cascades risk massive, accidental child-record purges during deletes.</li>
                        <li><strong className="text-neutral-100">Security Omissions:</strong> Calculations running lookups over X-Refs silently fail if RLS filters block target records.</li>
                      </>
                    )}
                    {selectedField.type === 'CALCULATED' && (
                      <>
                        <li><strong className="text-neutral-100">Circular Loops:</strong> Creating dependent loops locks the server CPU and halts calculations.</li>
                        <li><strong className="text-neutral-100">Empty Field Handling:</strong> Ensure all equations contain fallback operators (e.g. IF or AND checks) to handle null values gracefully.</li>
                      </>
                    )}
                    {!['TEXT', 'NUMERIC', 'DATE_TIME', 'VALUES_LIST', 'CROSS_REFERENCE', 'CALCULATED'].includes(selectedField.type) && (
                      <li>Check schema parameters, indexing whitelists, and referential join constraints in metadata definition fields.</li>
                    )}
                  </ul>
                </div>

                {/* In-Manual Calculated DAG playroom (only for calculated fields) */}
                {selectedField.type === 'CALCULATED' && (
                  <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-2">
                    <span className="text-amber-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                      3. Calculated Recalculation sort Playground
                    </span>
                    <div className="flex flex-col gap-2 font-mono text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-neutral-500">Choose Formula to Compile</label>
                        <select
                          value={selectedFormula}
                          onChange={(e) => setSelectedFormula(e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                        >
                          <option value="BASIC">Standard Multiplication (Inherent Score = Impact * Likelihood)</option>
                          <option value="IF_COMP">IF String Comparison (Rating = IF Inherent Score &gt; 4)</option>
                          <option value="XREF_SUM">X-Ref Aggregation Sum (SUM target scores respecting active RLS)</option>
                          <option value="CIRCULAR">Circular Paradox Loop (Impact depends on Score & vice-versa)</option>
                        </select>
                      </div>

                      <div className="bg-neutral-900/60 border border-neutral-850 p-2.5 rounded text-[10px] max-h-36 overflow-y-auto leading-relaxed flex flex-col gap-0.5 text-neutral-400">
                        {formulaLogs.map((log, i) => (
                          <div key={i} className={log.includes('CRITICAL_FAIL') ? 'text-rose-400 font-bold' : log.includes('SUCCESS') ? 'text-emerald-400 font-semibold' : ''}>
                            {log}
                          </div>
                        ))}
                      </div>

                      <div className="bg-neutral-950 p-2 rounded border border-neutral-800 text-[10px] flex justify-between items-center text-neutral-300 font-bold">
                        <span>Evaluation Outcome:</span>
                        <span className={formulaResult === 'PARADOX_LOCK' ? 'text-rose-400' : 'text-amber-400'}>
                          {formulaResult === null ? 'NULL' : String(formulaResult)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeTab === 'FEEDS' && (
              <div className="flex flex-col gap-4 text-xs font-mono">
                <div className="border-b border-neutral-800 pb-2">
                  <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                    ETL Ingestion & Lookup Manual
                  </h2>
                </div>

                {/* Ingestion feed details */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-amber-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    1. Data Feed Lookup & Translations
                  </span>
                  <ul className="text-[10.5px] text-neutral-300 leading-relaxed list-disc list-inside flex flex-col gap-1">
                    <li><strong className="text-neutral-100">Values List Matching:</strong> GRC feeds scan option registries. Attempting to insert raw strings (like `"5 - Critical"`) will fail to validate unless a translation map or regex strips characters, resolving matching Option IDs.</li>
                    <li><strong className="text-neutral-100">AD Directory Syncing:</strong> Mappings referencing User/Group fields query AD registries. Ingestion pipelines look up Active Directory usernames or LDAP strings, writing matched account keys.</li>
                    <li><strong className="text-neutral-100">Key Field Upserts:</strong> Target unique columns act as index guards. If the lookup key (like Risk ID) matches, the system updates EAV records. If no match occurs, a new record is inserted.</li>
                  </ul>
                </div>

                {/* Diagnostics */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-rose-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    2. Ingestion Diagnostics & Checklists
                  </span>
                  <ul className="text-[10.5px] text-neutral-300 leading-relaxed list-decimal list-inside flex flex-col gap-1 text-neutral-450">
                    <li>Confirm source CSV schemas match target column definition properties exactly.</li>
                    <li>Verify numeric fields carry raw floats. Strip currency symbols (`$`) and commas.</li>
                    <li>Align date formats to standard ISO 8601 UTC to prevent timezone drifts across geographical databases.</li>
                  </ul>
                </div>

                {/* Ingestion run terminal logs */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-2">
                  <span className="text-amber-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    3. Live Ingestion Trace Log
                  </span>
                  <div className="bg-neutral-900/60 border border-neutral-850 p-2.5 rounded text-[10px] max-h-40 overflow-y-auto leading-relaxed flex flex-col gap-0.5 text-neutral-400">
                    {feedLogs.length === 0 ? (
                      <span className="text-neutral-500 italic">No feed executions recorded. Select your parameters and click "Run Ingest" in the builder portal.</span>
                    ) : (
                      feedLogs.map((log, i) => (
                        <div key={i} className={log.includes('CRITICAL_FAIL') || log.includes('ERROR') ? 'text-rose-400 font-bold' : log.includes('SUCCESS') ? 'text-emerald-400 font-semibold' : ''}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                  {coercedValue !== null && (
                    <div className="bg-neutral-950 p-2 rounded border border-neutral-800 text-[10px] flex justify-between items-center text-neutral-300 font-bold">
                      <span>SQL Commit Value:</span>
                      <span className="text-amber-400">{JSON.stringify(coercedValue)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'DDE' && (
              <div className="flex flex-col gap-4 text-xs font-mono">
                <div className="border-b border-neutral-800 pb-2">
                  <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                    DDE Diagnostics & Conflict Maps
                  </h2>
                </div>

                {/* Troubleshooting guidelines */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-rose-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    1. Dynamic DDE Conflict Profiles
                  </span>
                  <div className="flex flex-col gap-2.5 leading-relaxed text-[10.5px]">
                    <div className="border border-rose-500/10 bg-rose-500/5 p-2 rounded text-neutral-300">
                      <strong className="text-rose-400 block mb-0.5">Profile A: Hidden Required Fields (Save Block)</strong>
                      If one DDE rule makes a field hidden based on Condition A, while another rule makes it required based on Condition B, the record will fail to save (displays missing required field validations), while the user cannot edit it.
                    </div>
                    <div className="border border-amber-500/10 bg-amber-500/5 p-2 rounded text-neutral-300">
                      <strong className="text-amber-400 block mb-0.5">Profile B: AWF Transition Deadlocks</strong>
                      When an AWF step advances, the record status must match the transition guard. If a DDE rule triggers on status changes to force statuses back to Draft (e.g. audit freezes), it overrides the transition state, deadlocking the workflow.
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-amber-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    2. DDE Diagnostics Checklist
                  </span>
                  <ul className="text-[10.5px] text-neutral-300 leading-relaxed list-disc list-inside flex flex-col gap-1 text-neutral-450">
                    <li>Never trigger DDE `SET_VALUE` actions on calculated fields to avoid recalculation loops.</li>
                    <li>Always evaluate rule ordering; the last executed DDE rule takes precedence in override conflicts.</li>
                    <li>Verify that all required fields are whitelisted for visibility under every valid workflow stage.</li>
                  </ul>
                </div>

                {/* DDE Trace Logs */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-2">
                  <span className="text-amber-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    3. Dynamic Execution Timeline Trace
                  </span>
                  <div className="bg-neutral-900/60 border border-neutral-850 p-2.5 rounded text-[10px] max-h-40 overflow-y-auto leading-relaxed flex flex-col gap-0.5 text-neutral-400">
                    {ddeTimelineLogs.length === 0 ? (
                      <span className="text-neutral-500 italic">No timelines recorded. Run transition tests in the rules editor panel.</span>
                    ) : (
                      ddeTimelineLogs.map((log, i) => (
                        <div key={i} className={log.includes('CRITICAL_FAIL') ? 'text-rose-400 font-bold' : log.includes('SUCCESS') ? 'text-emerald-400 font-semibold' : ''}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'AWF' && (
              <div className="flex flex-col gap-4 text-xs font-mono">
                <div className="border-b border-neutral-800 pb-2 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                      AWF Lifecycle & Transition Gates
                    </h2>
                    <span className="text-[8px] text-neutral-400 font-mono block mt-0.5">Instance Node ID: {wfState.currentNodeId}</span>
                  </div>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                    Selected Node: {selectedWfNodeId}
                  </span>
                </div>

                {/* Node properties description */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-amber-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    1. Selected Node Specifications
                  </span>
                  <div className="text-[11px] text-neutral-300 leading-normal flex flex-col gap-2">
                    {selectedWfNodeId === 'NODE_START' && (
                      <>
                        <div><strong className="text-neutral-100">Node Type:</strong> START NODE</div>
                        <p className="text-neutral-450 leading-relaxed">The gateway entry state. Generates new dynamic AWF instance records when transactional rows are inserted. Directs the record state instantly to initial task queues.</p>
                      </>
                    )}
                    {selectedWfNodeId === 'NODE_DRAFT' && (
                      <>
                        <div><strong className="text-neutral-100">Node Type:</strong> MANUAL TASK NODE</div>
                        <div><strong className="text-neutral-100">Assigned Profile:</strong> IT Risk Analyst (GRP_IT_RISK Group)</div>
                        <p className="text-neutral-450 leading-relaxed">Halts calculation recs. Enforces explicit manual updates or button clearance clicks (e.g. Submit, Revert) before advancing transitions.</p>
                      </>
                    )}
                    {selectedWfNodeId === 'NODE_DECISION' && (
                      <>
                        <div><strong className="text-neutral-100">Node Type:</strong> DECISION NODE</div>
                        <div><strong className="text-neutral-100">Criteria Guard:</strong> <code>FLD_STATUS == "Approved"</code></div>
                        <p className="text-neutral-450 leading-relaxed">Dynamic evaluator. Programmatically routes records based on field values list checks. Bypasses manual tasks and executes transition queries instantly.</p>
                      </>
                    )}
                    {selectedWfNodeId === 'NODE_APPROVED_END' && (
                      <>
                        <div><strong className="text-neutral-100">Node Type:</strong> END STATE NODE</div>
                        <p className="text-neutral-450 leading-relaxed">Operational completion boundary. Freezes transition pipelines and closes AWF tracking instances, completing the record lifecycle.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Troubleshooting node rules */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-rose-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    2. Workflow Deadlock Checklist
                  </span>
                  <ul className="text-[10.5px] text-neutral-300 leading-relaxed list-disc list-inside flex flex-col gap-1 text-neutral-450">
                    <li><strong className="text-neutral-100">Decision Fallbacks:</strong> Always configure default target parameters on decision forks. An un-matched evaluation loops records or leaves them with empty next states.</li>
                    <li><strong className="text-neutral-100">Transition Action Overrides:</strong> Verify that DDE logic triggers do not set values that violate transition guards on save.</li>
                    <li><strong className="text-neutral-100">Security Assignment Drift:</strong> Check that assigned users have module-level RBAC role permissions to access and edit records in AWF task states.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'SECURITY' && (
              <div className="flex flex-col gap-4 text-xs font-mono">
                <div className="border-b border-neutral-800 pb-2">
                  <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wider">
                    RBAC & Dynamic RLS Security gates
                  </h2>
                </div>

                {/* Inherent RLS aggregation manual (The Security Ghost) */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-rose-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    1. RLS calculation Omissions (The Security Ghost)
                  </span>
                  <p className="text-[10.5px] text-neutral-300 leading-relaxed">
                    This is a critical GRC concept: When formulas run calculations referencing a **Cross-Reference** field, the database engine checks Record-Level Security permissions on *every single referenced target record* dynamically!
                  </p>
                  <p className="text-[10.5px] text-neutral-400 leading-relaxed mt-1">
                    If target records are restricted to specific security groups (e.g. `GRP_EXEC_COM`), and the active user is not a member, the system **silently omits** those records from the calculation instead of throwing an error. A `SUM` or `COUNT` calculation will return incomplete totals, creating what looks like a logic bug but is actually a strict security restriction.
                  </p>
                </div>

                {/* Security Diagnostic Checklist */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-1.5">
                  <span className="text-amber-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    2. Security Configuration Checklist
                  </span>
                  <ul className="text-[10.5px] text-neutral-300 leading-relaxed list-disc list-inside flex flex-col gap-1 text-neutral-450">
                    <li><strong className="text-neutral-100">Module Access (RBAC):</strong> Enforces application-level access based on roles. User must pass RBAC before RLS is checked.</li>
                    <li><strong className="text-neutral-100">Record Security (RLS):</strong> Compares active session user/groups list with record fields. Set fallback `allowIfFieldsEmpty = true` if empty assignments should default to public visibility.</li>
                    <li><strong className="text-neutral-100">Calculation Alignment:</strong> Keep target cross-referenced applications whitelisted to necessary operational user groups to prevent incomplete calculation aggregates.</li>
                  </ul>
                </div>

                {/* Security Gate execution logs */}
                <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg flex flex-col gap-2">
                  <span className="text-amber-400 font-bold uppercase tracking-wider block border-b border-neutral-900 pb-1 text-[10px]">
                    3. Dynamic Security Gate Audit Trace
                  </span>
                  <div className="bg-neutral-900/60 border border-neutral-850 p-2.5 rounded text-[10px] max-h-40 overflow-y-auto leading-relaxed flex flex-col gap-0.5 text-neutral-400 font-mono">
                    {securityCheckLog.length === 0 ? (
                      <span className="text-neutral-500 italic">No security audits recorded. Click "Execute Security Gate Audit" in the configuration portal.</span>
                    ) : (
                      securityCheckLog.map((log, i) => (
                        <div key={i} className={log.includes('BLOCK') || log.includes('DENIED') ? 'text-rose-400 font-bold' : log.includes('PASS') || log.includes('GRANTED') ? 'text-emerald-400 font-semibold' : ''}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-6 mt-12 text-center text-xs text-neutral-500 font-mono">
        <p>© 2026 Rycode. All rights reserved. · ApexGRM Configuration Studio Trainer Mode</p>
      </footer>

    </div>
  );
}
