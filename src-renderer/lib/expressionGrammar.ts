export const TOKEN_TYPES = [
  'Identifier',
  'NumberLiteral',
  'StringLiteral',
  'BooleanLiteral',
  'DateLiteral',
  'DateTimeLiteral',
  'NullLiteral',
  'Operator',
  'LeftParen',
  'RightParen',
  'Comma',
  'EOF',
] as const

export type TokenType = (typeof TOKEN_TYPES)[number]

export interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}

export const OPERATORS = [
  '==', '!=', '<=', '>=', '<', '>', '&&', '||', '!',
  '+', '-', '*', '/', 'contains', 'in',
] as const

export type Operator = (typeof OPERATORS)[number]

export const FUNCTIONS = ['now', 'today', 'age'] as const

export type FunctionName = (typeof FUNCTIONS)[number]

export const VARIABLE_TYPES = [
  'string', 'integer', 'float', 'boolean',
  'date', 'datetime', 'enum', 'currency',
] as const

export type VariableType = (typeof VARIABLE_TYPES)[number]

export type ASTNode =
  | BinaryExpression
  | UnaryExpression
  | FunctionCallExpression
  | IdentifierNode
  | LiteralNode

export interface BinaryExpression {
  kind: 'BinaryExpression'
  operator: string
  left: ASTNode
  right: ASTNode
  line: number
  column: number
}

export interface UnaryExpression {
  kind: 'UnaryExpression'
  operator: string
  operand: ASTNode
  line: number
  column: number
}

export interface FunctionCallExpression {
  kind: 'FunctionCall'
  name: string
  args: ASTNode[]
  line: number
  column: number
}

export interface IdentifierNode {
  kind: 'Identifier'
  name: string
  line: number
  column: number
}

export interface LiteralNode {
  kind: 'Literal'
  literalType: 'number' | 'string' | 'boolean' | 'date' | 'datetime' | 'null'
  value: string | number | boolean | null
  line: number
  column: number
}

export interface Diagnostic {
  message: string
  line: number
  column: number
  severity: 'error' | 'warning'
}

export interface ParseResult {
  ast: ASTNode | null
  diagnostics: Diagnostic[]
}

const KEYWORD_OPERATORS = new Set(['contains', 'in'])
const BOOLEAN_LITERALS = new Set(['true', 'false'])
const FUNCTION_SET = new Set<string>(FUNCTIONS)

function isAlpha(ch: string): boolean {
  return /[a-zA-Z_]/.test(ch)
}

function isAlphaNumeric(ch: string): boolean {
  return /[a-zA-Z0-9_]/.test(ch)
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9'
}

export function tokenize(source: string): { tokens: Token[]; diagnostics: Diagnostic[] } {
  const tokens: Token[] = []
  const diagnostics: Diagnostic[] = []
  let pos = 0
  let line = 1
  let column = 1

  function advance(): string {
    const ch = source[pos]
    pos++
    if (ch === '\n') {
      line++
      column = 1
    } else {
      column++
    }
    return ch
  }

  function peek(): string {
    return pos < source.length ? source[pos] : '\0'
  }

  function peekNext(): string {
    return pos + 1 < source.length ? source[pos + 1] : '\0'
  }

  while (pos < source.length) {
    const ch = peek()

    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      advance()
      continue
    }

    const startLine = line
    const startCol = column

    if (ch === '(') {
      tokens.push({ type: 'LeftParen', value: '(', line: startLine, column: startCol })
      advance()
      continue
    }

    if (ch === ')') {
      tokens.push({ type: 'RightParen', value: ')', line: startLine, column: startCol })
      advance()
      continue
    }

    if (ch === ',') {
      tokens.push({ type: 'Comma', value: ',', line: startLine, column: startCol })
      advance()
      continue
    }

    if (ch === '"') {
      advance()
      let str = ''
      while (pos < source.length && peek() !== '"') {
        if (peek() === '\\') {
          advance()
          const esc = peek()
          if (pos < source.length) {
            if (esc === 'n') str += '\n'
            else if (esc === 't') str += '\t'
            else if (esc === '\\') str += '\\'
            else if (esc === '"') str += '"'
            else str += esc
            advance()
          }
        } else {
          str += advance()
        }
      }
      if (pos >= source.length) {
        diagnostics.push({ message: 'Unterminated string literal', line: startLine, column: startCol, severity: 'error' })
      } else {
        advance()
      }
      tokens.push({ type: 'StringLiteral', value: str, line: startLine, column: startCol })
      continue
    }

    if (ch === '#') {
      advance()
      let dateLit = ''
      while (pos < source.length && peek() !== '#') {
        dateLit += advance()
      }
      if (pos >= source.length) {
        diagnostics.push({ message: 'Unterminated date literal', line: startLine, column: startCol, severity: 'error' })
      } else {
        advance()
      }
      const isDateTime = dateLit.includes('T')
      if (isDateTime) {
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dateLit)) {
          diagnostics.push({ message: `Invalid datetime literal: #${dateLit}#`, line: startLine, column: startCol, severity: 'error' })
        }
        tokens.push({ type: 'DateTimeLiteral', value: dateLit, line: startLine, column: startCol })
      } else {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLit)) {
          diagnostics.push({ message: `Invalid date literal: #${dateLit}#`, line: startLine, column: startCol, severity: 'error' })
        }
        tokens.push({ type: 'DateLiteral', value: dateLit, line: startLine, column: startCol })
      }
      continue
    }

    if (isDigit(ch)) {
      let num = ''
      while (pos < source.length && isDigit(peek())) {
        num += advance()
      }
      if (pos < source.length && peek() === '.' && isDigit(peekNext())) {
        num += advance()
        while (pos < source.length && isDigit(peek())) {
          num += advance()
        }
      }
      tokens.push({ type: 'NumberLiteral', value: num, line: startLine, column: startCol })
      continue
    }

    if (isAlpha(ch)) {
      let word = ''
      while (pos < source.length && isAlphaNumeric(peek())) {
        word += advance()
      }
      if (BOOLEAN_LITERALS.has(word)) {
        tokens.push({ type: 'BooleanLiteral', value: word, line: startLine, column: startCol })
      } else if (word === 'null') {
        tokens.push({ type: 'NullLiteral', value: word, line: startLine, column: startCol })
      } else if (KEYWORD_OPERATORS.has(word)) {
        tokens.push({ type: 'Operator', value: word, line: startLine, column: startCol })
      } else {
        tokens.push({ type: 'Identifier', value: word, line: startLine, column: startCol })
      }
      continue
    }

    if (ch === '=' && peekNext() === '=') {
      tokens.push({ type: 'Operator', value: '==', line: startLine, column: startCol })
      advance(); advance()
      continue
    }
    if (ch === '!' && peekNext() === '=') {
      tokens.push({ type: 'Operator', value: '!=', line: startLine, column: startCol })
      advance(); advance()
      continue
    }
    if (ch === '<' && peekNext() === '=') {
      tokens.push({ type: 'Operator', value: '<=', line: startLine, column: startCol })
      advance(); advance()
      continue
    }
    if (ch === '>' && peekNext() === '=') {
      tokens.push({ type: 'Operator', value: '>=', line: startLine, column: startCol })
      advance(); advance()
      continue
    }
    if (ch === '&' && peekNext() === '&') {
      tokens.push({ type: 'Operator', value: '&&', line: startLine, column: startCol })
      advance(); advance()
      continue
    }
    if (ch === '|' && peekNext() === '|') {
      tokens.push({ type: 'Operator', value: '||', line: startLine, column: startCol })
      advance(); advance()
      continue
    }

    if (ch === '<') {
      tokens.push({ type: 'Operator', value: '<', line: startLine, column: startCol })
      advance()
      continue
    }
    if (ch === '>') {
      tokens.push({ type: 'Operator', value: '>', line: startLine, column: startCol })
      advance()
      continue
    }
    if (ch === '!') {
      tokens.push({ type: 'Operator', value: '!', line: startLine, column: startCol })
      advance()
      continue
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'Operator', value: ch, line: startLine, column: startCol })
      advance()
      continue
    }

    diagnostics.push({ message: `Unexpected character: '${ch}'`, line: startLine, column: startCol, severity: 'error' })
    advance()
  }

  tokens.push({ type: 'EOF', value: '', line, column })
  return { tokens, diagnostics }
}

const PRECEDENCE: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '==': 3, '!=': 3,
  '<': 4, '<=': 4, '>': 4, '>=': 4, 'contains': 4, 'in': 4,
  '+': 5, '-': 5,
  '*': 6, '/': 6,
}

export function parse(source: string): ParseResult {
  const { tokens, diagnostics } = tokenize(source)
  let pos = 0

  function current(): Token {
    return pos < tokens.length ? tokens[pos] : tokens[tokens.length - 1]
  }

  function eat(type: TokenType, value?: string): Token {
    const tok = current()
    if (tok.type !== type || (value !== undefined && tok.value !== value)) {
      diagnostics.push({
        message: value
          ? `Expected '${value}' but got '${tok.value || 'end of input'}'`
          : `Expected ${type} but got ${tok.type} '${tok.value}'`,
        line: tok.line,
        column: tok.column,
        severity: 'error',
      })
      return tok
    }
    pos++
    return tok
  }

  function parseExpression(minPrec: number = 0): ASTNode {
    let left = parseUnary()

    while (current().type === 'Operator' && PRECEDENCE[current().value] !== undefined && PRECEDENCE[current().value] > minPrec) {
      const op = current()
      pos++
      const right = parseExpression(PRECEDENCE[op.value])
      left = {
        kind: 'BinaryExpression',
        operator: op.value,
        left,
        right,
        line: op.line,
        column: op.column,
      }
    }

    return left
  }

  function parseUnary(): ASTNode {
    const tok = current()
    if (tok.type === 'Operator' && (tok.value === '!' || tok.value === '-')) {
      pos++
      const operand = parseUnary()
      return {
        kind: 'UnaryExpression',
        operator: tok.value,
        operand,
        line: tok.line,
        column: tok.column,
      }
    }
    return parsePrimary()
  }

  function parsePrimary(): ASTNode {
    const tok = current()

    if (tok.type === 'LeftParen') {
      pos++
      const expr = parseExpression()
      eat('RightParen', ')')
      return expr
    }

    if (tok.type === 'NumberLiteral') {
      pos++
      const numVal = tok.value.includes('.') ? parseFloat(tok.value) : parseInt(tok.value, 10)
      return { kind: 'Literal', literalType: 'number', value: numVal, line: tok.line, column: tok.column }
    }

    if (tok.type === 'StringLiteral') {
      pos++
      return { kind: 'Literal', literalType: 'string', value: tok.value, line: tok.line, column: tok.column }
    }

    if (tok.type === 'BooleanLiteral') {
      pos++
      return { kind: 'Literal', literalType: 'boolean', value: tok.value === 'true', line: tok.line, column: tok.column }
    }

    if (tok.type === 'DateLiteral') {
      pos++
      return { kind: 'Literal', literalType: 'date', value: tok.value, line: tok.line, column: tok.column }
    }

    if (tok.type === 'DateTimeLiteral') {
      pos++
      return { kind: 'Literal', literalType: 'datetime', value: tok.value, line: tok.line, column: tok.column }
    }

    if (tok.type === 'NullLiteral') {
      pos++
      return { kind: 'Literal', literalType: 'null', value: null, line: tok.line, column: tok.column }
    }

    if (tok.type === 'Identifier') {
      pos++
      if (FUNCTION_SET.has(tok.value) && current().type === 'LeftParen') {
        pos++
        const args: ASTNode[] = []
        if (current().type !== 'RightParen') {
          args.push(parseExpression())
          while (current().type === 'Comma') {
            pos++
            args.push(parseExpression())
          }
        }
        eat('RightParen', ')')
        return { kind: 'FunctionCall', name: tok.value, args, line: tok.line, column: tok.column }
      }
      return { kind: 'Identifier', name: tok.value, line: tok.line, column: tok.column }
    }

    diagnostics.push({
      message: `Unexpected token '${tok.value || 'end of input'}'`,
      line: tok.line,
      column: tok.column,
      severity: 'error',
    })
    pos++
    return { kind: 'Literal', literalType: 'null', value: null, line: tok.line, column: tok.column }
  }

  if (tokens.length === 1 && tokens[0].type === 'EOF') {
    return { ast: null, diagnostics }
  }

  const ast = parseExpression()

  if (current().type !== 'EOF') {
    const tok = current()
    diagnostics.push({
      message: `Unexpected token '${tok.value}' after expression`,
      line: tok.line,
      column: tok.column,
      severity: 'error',
    })
  }

  return { ast, diagnostics }
}

export interface VariableInfo {
  name: string
  type: VariableType
}

export function validate(ast: ASTNode | null, variables: VariableInfo[]): Diagnostic[] {
  if (!ast) return []

  const variableNames = new Set(variables.map((v) => v.name))
  const diagnostics: Diagnostic[] = []

  function visit(node: ASTNode): void {
    switch (node.kind) {
      case 'Identifier':
        if (!variableNames.has(node.name)) {
          diagnostics.push({
            message: `Undefined variable '${node.name}'`,
            line: node.line,
            column: node.column,
            severity: 'error',
          })
        }
        break
      case 'BinaryExpression':
        visit(node.left)
        visit(node.right)
        break
      case 'UnaryExpression':
        visit(node.operand)
        break
      case 'FunctionCall':
        for (const arg of node.args) {
          visit(arg)
        }
        break
      case 'Literal':
        break
    }
  }

  visit(ast)
  return diagnostics
}
