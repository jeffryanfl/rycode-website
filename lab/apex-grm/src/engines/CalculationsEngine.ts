import type { Field, RecordPayload, SimulatedUserContext } from '../types/SystemTaxonomyConfig';

export class CircularDependencyError extends Error {
  public cyclePath: string[];
  constructor(message: string, cyclePath: string[]) {
    super(message);
    this.name = 'CircularDependencyError';
    this.cyclePath = cyclePath;
  }
}

/**
 * 1. CIRCULAR DEPENDENCY TRACKER (Directed Graph DFS)
 */
export function checkCircularDependencies(
  fields: Field[],
  allFieldsMap: Map<string, Field>
): string[] | null {
  const visited = new Map<string, 'VISITING' | 'VISITED'>();
  const path: string[] = [];

  function dfs(fieldId: string): string[] | null {
    const state = visited.get(fieldId);
    if (state === 'VISITING') {
      const cycleStartIdx = path.indexOf(fieldId);
      return path.slice(cycleStartIdx).concat(fieldId);
    }
    if (state === 'VISITED') {
      return null;
    }

    visited.set(fieldId, 'VISITING');
    path.push(fieldId);

    const field = allFieldsMap.get(fieldId);
    if (field && field.type === 'CALCULATED' && field.calculatedConfig) {
      for (const refId of field.calculatedConfig.referencedFieldIds) {
        const cycle = dfs(refId);
        if (cycle) return cycle;
      }
    }

    path.pop();
    visited.set(fieldId, 'VISITED');
    return null;
  }

  for (const field of fields) {
    const cycle = dfs(field.id);
    if (cycle) return cycle;
  }

  return null;
}

/**
 * 2. FORMULA PARSER & INTERPRETER
 * Supports:
 * - Literals: Numbers (e.g., 25), Strings (e.g., 'HIGH')
 * - Fields: Direct field references (e.g., FLD_LIKELIHOOD)
 * - Dot-notated Cross-References: (e.g., FLD_CROSS_REF.FLD_COST)
 * - Functions: IF, AND, OR, NOT, CONCATENATE, FIND, SUM, COUNT, DATEADD, DATEDIFF
 * - Operators: +, -, *, /, >, <, >=, <=, ==, !=
 */

type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'IDENTIFIER'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'OPERATOR'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

export class FormulaEvaluator {
  private tokens: Token[] = [];
  private current = 0;

  private record: RecordPayload;
  private allRecords: Map<string, RecordPayload>;
  private evaluateRLS: (rec: RecordPayload, user: SimulatedUserContext) => boolean;
  private userContext: SimulatedUserContext;

  constructor(
    record: RecordPayload,
    allRecords: Map<string, RecordPayload>,
    _allFieldsMap: Map<string, Field>,
    evaluateRLS: (rec: RecordPayload, user: SimulatedUserContext) => boolean,
    userContext: SimulatedUserContext
  ) {
    this.record = record;
    this.allRecords = allRecords;
    this.evaluateRLS = evaluateRLS;
    this.userContext = userContext;
  }

  private tokenize(formula: string) {
    this.tokens = [];
    this.current = 0;
    let i = 0;
    
    while (i < formula.length) {
      const char = formula[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (char === '(') {
        this.tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }

      if (char === ')') {
        this.tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      if (char === ',') {
        this.tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      // String literals: 'text' or "text"
      if (char === "'" || char === '"') {
        const quote = char;
        let strVal = '';
        i++; // skip opening quote
        while (i < formula.length && formula[i] !== quote) {
          strVal += formula[i];
          i++;
        }
        i++; // skip closing quote
        this.tokens.push({ type: 'STRING', value: strVal });
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        let numVal = '';
        while (i < formula.length && (/[\d\.]/.test(formula[i]))) {
          numVal += formula[i];
          i++;
        }
        this.tokens.push({ type: 'NUMBER', value: numVal });
        continue;
      }

      // Operators: >=, <=, ==, !=, +, -, *, /, >, <
      const nextTwo = formula.slice(i, i + 2);
      if (['>=', '<=', '==', '!='].includes(nextTwo)) {
        this.tokens.push({ type: 'OPERATOR', value: nextTwo });
        i += 2;
        continue;
      }

      if (['+', '-', '*', '/', '>', '<'].includes(char)) {
        this.tokens.push({ type: 'OPERATOR', value: char });
        i++;
        continue;
      }

      // Identifiers (Fields, cross-references, or Functions)
      if (/[a-zA-Z_]/.test(char)) {
        let identVal = '';
        while (i < formula.length && /[a-zA-Z0-9_\.]/.test(formula[i])) {
          identVal += formula[i];
          i++;
        }
        this.tokens.push({ type: 'IDENTIFIER', value: identVal });
        continue;
      }

      throw new Error(`Formula Tokenizer Error: Unexpected character '${char}' at index ${i}`);
    }

    this.tokens.push({ type: 'EOF', value: '' });
  }

  // --- Recursive Descent Parsing & Evaluating in one pass ---

  private peek(): Token {
    return this.tokens[this.current];
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  public evaluate(formula: string): any {
    this.tokenize(formula);
    if (this.tokens.length === 1 && this.tokens[0].type === 'EOF') {
      return null;
    }
    return this.parseExpression();
  }

  private parseExpression(): any {
    return this.parseComparison();
  }

  private parseComparison(): any {
    let expr = this.parseTerm();

    while (this.peek().type === 'OPERATOR' && ['>', '<', '>=', '<=', '==', '!='].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseTerm();
      
      if (op === '>') expr = Number(expr) > Number(right);
      else if (op === '<') expr = Number(expr) < Number(right);
      else if (op === '>=') expr = Number(expr) >= Number(right);
      else if (op === '<=') expr = Number(expr) <= Number(right);
      else if (op === '==') expr = String(expr) === String(right);
      else if (op === '!=') expr = String(expr) !== String(right);
    }

    return expr;
  }

  private parseTerm(): any {
    let expr = this.parseFactor();

    while (this.peek().type === 'OPERATOR' && ['+', '-'].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseFactor();

      if (op === '+') {
        if (typeof expr === 'string' || typeof right === 'string') {
          expr = String(expr) + String(right);
        } else {
          expr = Number(expr) + Number(right);
        }
      } else if (op === '-') {
        expr = Number(expr) - Number(right);
      }
    }

    return expr;
  }

  private parseFactor(): any {
    let expr = this.parsePrimary();

    while (this.peek().type === 'OPERATOR' && ['*', '/'].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parsePrimary();

      if (op === '*') expr = Number(expr) * Number(right);
      else if (op === '/') expr = Number(expr) / Number(right);
    }

    return expr;
  }

  private parsePrimary(): any {
    const token = this.peek();

    if (token.type === 'NUMBER') {
      this.advance();
      return Number(token.value);
    }

    if (token.type === 'STRING') {
      this.advance();
      return token.value;
    }

    if (token.type === 'LPAREN') {
      this.advance(); // skip '('
      const expr = this.parseExpression();
      if (this.peek().type !== 'RPAREN') {
        throw new Error("Formula Evaluator Error: Expected ')'");
      }
      this.advance(); // skip ')'
      return expr;
    }

    if (token.type === 'IDENTIFIER') {
      const name = this.advance().value;

      // Check if it's a function call (next token is '(')
      if (this.peek().type === 'LPAREN') {
        this.advance(); // skip '('
        const args: any[] = [];
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseExpression());
          while (this.peek().type === 'COMMA') {
            this.advance(); // skip ','
            args.push(this.parseExpression());
          }
        }
        if (this.peek().type !== 'RPAREN') {
          throw new Error(`Formula Evaluator Error: Expected ')' after function arguments for '${name}'`);
        }
        this.advance(); // skip ')'
        return this.evalFunction(name, args);
      }

      // If not a function, it's a field or cross-reference field
      return this.resolveFieldValue(name);
    }

    throw new Error(`Formula Evaluator Error: Unexpected token '${token.value}' [${token.type}]`);
  }

  private resolveFieldValue(fieldName: string): any {
    // Check if it's a dot-notated cross-reference: "FLD_CROSS_REF.FLD_TARGET"
    if (fieldName.includes('.')) {
      const [refFieldId, targetFieldId] = fieldName.split('.');
      const crossRefIds = this.record.values[refFieldId];

      if (!Array.isArray(crossRefIds) || crossRefIds.length === 0) {
        return null; // Empty cross-reference
      }

      const values: any[] = [];
      let omittedCount = 0;

      for (const targetId of crossRefIds) {
        const targetRecord = this.allRecords.get(targetId);
        if (targetRecord) {
          // Check RLS security rules on target records!
          const isAllowed = this.evaluateRLS(targetRecord, this.userContext);
          if (isAllowed) {
            values.push(targetRecord.values[targetFieldId]);
          } else {
            omittedCount++;
          }
        }
      }

      if (omittedCount > 0) {
        // Output security-exception notice to standard telemetry log
        console.warn(
          `Security Check: ${omittedCount} records omitted from Cross-Reference calculations due to Record-Level Security filter execution for ${this.userContext.id}`
        );
      }

      // Returns the array of collected target values (other functions like SUM / COUNT will aggregate them)
      return values;
    }

    // Direct local field reference
    return this.record.values[fieldName] !== undefined ? this.record.values[fieldName] : null;
  }

  private evalFunction(name: string, args: any[]): any {
    const fnName = name.toUpperCase();

    switch (fnName) {
      case 'IF': {
        if (args.length !== 3) throw new Error("Formula Function Error: IF requires exactly 3 arguments");
        const cond = args[0];
        return cond ? args[1] : args[2];
      }

      case 'AND': {
        if (args.length < 1) throw new Error("Formula Function Error: AND requires at least 1 argument");
        return args.every((val) => Boolean(val));
      }

      case 'OR': {
        if (args.length < 1) throw new Error("Formula Function Error: OR requires at least 1 argument");
        return args.some((val) => Boolean(val));
      }

      case 'NOT': {
        if (args.length !== 1) throw new Error("Formula Function Error: NOT requires exactly 1 argument");
        return !args[0];
      }

      case 'CONCATENATE': {
        return args.map((val) => (val === null ? '' : String(val))).join('');
      }

      case 'FIND': {
        if (args.length !== 2) throw new Error("Formula Function Error: FIND requires exactly 2 arguments");
        const needle = String(args[0]);
        const haystack = String(args[1]);
        // 1-indexed, or 0 if not found, mimicking GRC engines
        const pos = haystack.indexOf(needle);
        return pos === -1 ? 0 : pos + 1;
      }

      case 'SUM': {
        // Flatten any nested arrays (like from cross-references)
        const flatArgs = this.flattenArgs(args);
        return flatArgs.reduce((acc, val) => acc + (Number(val) || 0), 0);
      }

      case 'COUNT': {
        const flatArgs = this.flattenArgs(args);
        // Clean out nulls or undefined values to get an accurate count
        return flatArgs.filter((val) => val !== null && val !== undefined).length;
      }

      case 'DATEADD': {
        if (args.length !== 3) throw new Error("Formula Function Error: DATEADD requires exactly 3 arguments (date, duration, unit)");
        const dateEpoch = Number(args[0]) || Date.now();
        const duration = Number(args[1]) || 0;
        const unit = String(args[2]).toLowerCase(); // 'days' | 'months' | 'years'

        const date = new Date(dateEpoch);
        if (unit === 'days' || unit === 'day') {
          date.setDate(date.getDate() + duration);
        } else if (unit === 'months' || unit === 'month') {
          date.setMonth(date.getMonth() + duration);
        } else if (unit === 'years' || unit === 'year') {
          date.setFullYear(date.getFullYear() + duration);
        }
        return date.getTime();
      }

      case 'DATEDIFF': {
        if (args.length !== 3) throw new Error("Formula Function Error: DATEDIFF requires exactly 3 arguments (date1, date2, unit)");
        const d1Epoch = Number(args[0]);
        const d2Epoch = Number(args[1]);
        const unit = String(args[2]).toLowerCase();

        const diffMs = d2Epoch - d1Epoch;
        if (unit === 'days' || unit === 'day') {
          return Math.floor(diffMs / (1000 * 60 * 60 * 24));
        } else if (unit === 'months' || unit === 'month') {
          const date1 = new Date(d1Epoch);
          const date2 = new Date(d2Epoch);
          return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
        } else if (unit === 'years' || unit === 'year') {
          const date1 = new Date(d1Epoch);
          const date2 = new Date(d2Epoch);
          return date2.getFullYear() - date1.getFullYear();
        }
        return diffMs;
      }

      default:
        throw new Error(`Formula Function Error: Unsupported function name '${name}'`);
    }
  }

  private flattenArgs(args: any[]): any[] {
    const result: any[] = [];
    for (const arg of args) {
      if (Array.isArray(arg)) {
        result.push(...this.flattenArgs(arg));
      } else {
        result.push(arg);
      }
    }
    return result;
  }
}
