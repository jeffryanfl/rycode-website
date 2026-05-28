/**
 * SYSTEM TAXONOMY & OBJECT REGISTRY DEFINITIONS
 * ApexGRM Engine (De-branded GRC/IRM Sandbox)
 */

export type StructureType =
  | 'APPLICATION'
  | 'LEVELED_APPLICATION'
  | 'SUB_FORM'
  | 'ASSESSMENT_QUESTIONNAIRE';

export type FieldType =
  | 'TEXT'
  | 'NUMERIC'
  | 'DATE_TIME'
  | 'VALUES_LIST'
  | 'CROSS_REFERENCE'
  | 'RELATED_RECORD'
  | 'USER_GROUP'
  | 'CALCULATED';

export interface ValuesListOption {
  id: string;
  value: string;
  parentOptionId?: string; // For hierarchical/cascading list dependencies
}

export interface ValuesListConfig {
  isMultiSelect: boolean;
  options: ValuesListOption[];
}

export interface CrossReferenceConfig {
  targetStructureId: string; // Target Application ID
  bidirectionalFieldId?: string; // Auto-generated back-reference field ID in target structure
}

export interface RelatedRecordConfig {
  targetStructureId: string;
  matchFieldId: string; // Target field ID to match against
  sourceFieldId: string; // Local field ID containing the value to match
}

export interface CalculatedConfig {
  formula: string; // e.g., "IF(Score >= 15, 'CRITICAL', 'NORMAL')"
  referencedFieldIds: string[]; // Explicit Field IDs referenced for loop detection
}

export interface Field {
  id: string; // unique, e.g., "FLD_RISK_NAME"
  name: string;
  type: FieldType;
  isRequired: boolean;
  isReadOnly: boolean;
  isHidden: boolean;
  
  // Specific type configurations
  valuesListConfig?: ValuesListConfig;
  crossReferenceConfig?: CrossReferenceConfig;
  relatedRecordConfig?: RelatedRecordConfig;
  calculatedConfig?: CalculatedConfig;

  // Validation bounds
  maxLength?: number; // for TEXT
  minValue?: number;  // for NUMERIC
  maxValue?: number;  // for NUMERIC
}

export interface Structure {
  id: string; // e.g., "APP_RISK_REGISTER"
  name: string;
  type: StructureType;
  fields: Field[];
  levels?: string[]; // for LEVELED_APPLICATION sequential levels
}

/**
 * Record instance payload representing real in-memory data records.
 */
export interface RecordPayload {
  id: string; // Record ID, e.g., "REC_001"
  structureId: string; // e.g., "APP_RISK_REGISTER"
  values: Record<string, any>; // maps field.id -> value (Text: string, Numeric: number, DateTime: number (epoch), ValuesList: string[], CrossReference: string[] (record IDs), UserGroup: string[])
}

/**
 * User session context for Granular Access Control and RLS
 */
export interface SimulatedUserContext {
  id: string; // e.g., "USER_001"
  username: string;
  roles: string[]; // e.g., ["CISO", "RISK_ANALYST"]
  groups: string[]; // e.g., ["GRP_EXEC_COM", "GRP_IT_RISK"]
}
