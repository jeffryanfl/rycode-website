import type { Structure, RecordPayload, SimulatedUserContext } from '../types/SystemTaxonomyConfig';

export interface RLSConfig {
  isEnabled: boolean;
  userFieldId?: string;  // Field containing allowed user IDs
  groupFieldId?: string; // Field containing allowed group IDs
  allowIfFieldsEmpty: boolean; // Fallback behavior if RLS fields are blank
}

/**
 * RECONSTRUCT STRUCTURAL EXTENSIONS FOR APEXGRM ENGINE
 * Standard GRC platforms layer allowed roles on global structures and dynamic RLS on records.
 */
export class RLSEngine {
  
  /**
   * 1. MODULE-LEVEL ACCESS CONTROL (RBAC)
   * Checks if user has a role matching the global structure allowed roles list.
   */
  public static evaluateModuleAccess(
    _structure: Structure,
    user: SimulatedUserContext,
    allowedRoles: string[] = []
  ): boolean {
    if (allowedRoles.length === 0) {
      return true; // No global role restrictions
    }
    // Grant access if the user has any of the allowed roles
    return user.roles.some((role) => allowedRoles.includes(role));
  }

  /**
   * 2. RECORD-LEVEL SECURITY (RLS) EVALUATION
   * Evaluates user visibility dynamically by scanning specific User/Group fields on the record.
   */
  public static evaluateRecordRLS(
    record: RecordPayload,
    _structure: Structure,
    user: SimulatedUserContext,
    config?: RLSConfig
  ): boolean {
    if (!config || !config.isEnabled) {
      return true; // RLS is disabled globally for this structure
    }

    const { userFieldId, groupFieldId, allowIfFieldsEmpty } = config;
    
    const recordUsers = userFieldId ? (record.values[userFieldId] as string[]) : undefined;
    const recordGroups = groupFieldId ? (record.values[groupFieldId] as string[]) : undefined;

    const userFieldEmpty = !recordUsers || recordUsers.length === 0;
    const groupFieldEmpty = !recordGroups || recordGroups.length === 0;

    // Fallback if permission fields are empty
    if (userFieldEmpty && groupFieldEmpty) {
      return allowIfFieldsEmpty;
    }

    // Check direct User ID matches
    if (userFieldId && recordUsers && recordUsers.includes(user.id)) {
      return true;
    }

    // Check Security Group intersection matches
    if (groupFieldId && recordGroups) {
      const hasGroupMatch = user.groups.some((grp) => recordGroups.includes(grp));
      if (hasGroupMatch) {
        return true;
      }
    }

    // If a non-empty field was evaluated and no match occurred, deny record visibility
    return false;
  }

  /**
   * 3. INHERITED SECURITY PERMISSIONS (Cross-Reference Cascades)
   * Resolves recursive RLS permissions down cross-reference lookups.
   */
  public static evaluateInheritedPermissions(
    targetRecordId: string,
    allRecords: Map<string, RecordPayload>,
    allStructures: Map<string, Structure>,
    user: SimulatedUserContext,
    allStructuresRlsConfigs: Record<string, RLSConfig>
  ): boolean {
    const targetRecord = allRecords.get(targetRecordId);
    if (!targetRecord) return false;

    const targetStructure = allStructures.get(targetRecord.structureId);
    if (!targetStructure) return false;

    const rlsConfig = allStructuresRlsConfigs[targetRecord.structureId];

    // Check Module Access
    const hasModuleAccess = this.evaluateModuleAccess(targetStructure, user);
    if (!hasModuleAccess) return false;

    // Check Record-Level access
    return this.evaluateRecordRLS(targetRecord, targetStructure, user, rlsConfig);
  }
}
