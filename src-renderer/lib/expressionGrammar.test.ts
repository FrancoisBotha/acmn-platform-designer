import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  tokenize,
  parse,
  validate,
  TOKEN_TYPES,
  OPERATORS,
  FUNCTIONS,
  VARIABLE_TYPES,
  type ASTNode,
  type VariableInfo,
} from './expressionGrammar'

const testVars: VariableInfo[] = [
  { name: 'claimAmount', type: 'currency' },
  { name: 'approved', type: 'boolean' },
  { name: 'priority', type: 'string' },
  { name: 'score', type: 'integer' },
  { name: 'rate', type: 'float' },
  { name: 'dueDate', type: 'date' },
  { name: 'createdAt', type: 'datetime' },
  { name: 'tier', type: 'enum' },
]

function getToken(source: ReturnType<typeof tokenize>['tokens'], index: number = 0) {
  const token = source[index]
  assert.ok(token, `Expected token at index ${index}`)
  return token
}

function getDiagnostic(source: Array<{ message: string; line: number; column: number; severity: string }>, index: number = 0) {
  const diagnostic = source[index]
  assert.ok(diagnostic, `Expected diagnostic at index ${index}`)
  return diagnostic
}

function expectAstKind<TKind extends ASTNode['kind']>(
  ast: ASTNode | null,
  kind: TKind,
): Extract<ASTNode, { kind: TKind }> {
  assert.ok(ast, 'Expected AST to be present')
  assert.equal(ast.kind, kind)
  return ast as Extract<ASTNode, { kind: TKind }>
}

describe('expressionGrammar exports', () => {
  it('exports TOKEN_TYPES for the tokenizer token set', () => {
    const required = ['Identifier', 'NumberLiteral', 'StringLiteral', 'BooleanLiteral', 'DateLiteral', 'DateTimeLiteral', 'NullLiteral', 'Operator', 'LeftParen', 'RightParen', 'Comma', 'EOF']
    for (const tokenType of required) {
      assert.ok((TOKEN_TYPES as readonly string[]).includes(tokenType), `Missing token type: ${tokenType}`)
    }
  })

  it('exports OPERATORS with all required operators', () => {
    const required = ['==', '!=', '<', '<=', '>', '>=', '&&', '||', '!', '+', '-', '*', '/', 'contains', 'in']
    for (const op of required) {
      assert.ok((OPERATORS as readonly string[]).includes(op), `Missing operator: ${op}`)
    }
  })

  it('exports FUNCTIONS with now, today, age', () => {
    assert.ok((FUNCTIONS as readonly string[]).includes('now'))
    assert.ok((FUNCTIONS as readonly string[]).includes('today'))
    assert.ok((FUNCTIONS as readonly string[]).includes('age'))
  })

  it('exports VARIABLE_TYPES with all eight types', () => {
    const required = ['string', 'integer', 'float', 'boolean', 'date', 'datetime', 'enum', 'currency']
    for (const t of required) {
      assert.ok((VARIABLE_TYPES as readonly string[]).includes(t), `Missing type: ${t}`)
    }
  })
})

describe('tokenizer', () => {
  it('tokenizes identifiers', () => {
    const { tokens } = tokenize('claimAmount')
    const token = getToken(tokens)
    assert.equal(token.type, 'Identifier')
    assert.equal(token.value, 'claimAmount')
  })

  it('tokenizes integer literals', () => {
    const { tokens } = tokenize('42')
    const token = getToken(tokens)
    assert.equal(token.type, 'NumberLiteral')
    assert.equal(token.value, '42')
  })

  it('tokenizes float literals', () => {
    const { tokens } = tokenize('3.14')
    const token = getToken(tokens)
    assert.equal(token.type, 'NumberLiteral')
    assert.equal(token.value, '3.14')
  })

  it('tokenizes string literals', () => {
    const { tokens } = tokenize('"hello world"')
    const token = getToken(tokens)
    assert.equal(token.type, 'StringLiteral')
    assert.equal(token.value, 'hello world')
  })

  it('tokenizes string literals with escape sequences', () => {
    const { tokens } = tokenize('"line\\nbreak"')
    const token = getToken(tokens)
    assert.equal(token.value, 'line\nbreak')
  })

  it('tokenizes boolean literals', () => {
    const { tokens } = tokenize('true false')
    const first = getToken(tokens, 0)
    const second = getToken(tokens, 1)
    assert.equal(first.type, 'BooleanLiteral')
    assert.equal(first.value, 'true')
    assert.equal(second.type, 'BooleanLiteral')
    assert.equal(second.value, 'false')
  })

  it('tokenizes null literal', () => {
    const { tokens } = tokenize('null')
    assert.equal(getToken(tokens).type, 'NullLiteral')
  })

  it('tokenizes date literals', () => {
    const { tokens } = tokenize('#2026-04-22#')
    const token = getToken(tokens)
    assert.equal(token.type, 'DateLiteral')
    assert.equal(token.value, '2026-04-22')
  })

  it('tokenizes datetime literals', () => {
    const { tokens } = tokenize('#2026-04-22T10:30:00#')
    const token = getToken(tokens)
    assert.equal(token.type, 'DateTimeLiteral')
    assert.equal(token.value, '2026-04-22T10:30:00')
  })

  it('reports error for unterminated string', () => {
    const { diagnostics } = tokenize('"unterminated')
    assert.ok(diagnostics.length > 0)
    assert.ok(getDiagnostic(diagnostics).message.includes('Unterminated string'))
  })

  it('reports error for unterminated date literal', () => {
    const { diagnostics } = tokenize('#2026-04-22')
    assert.ok(diagnostics.length > 0)
    assert.ok(getDiagnostic(diagnostics).message.includes('Unterminated date'))
  })

  it('reports error for invalid date format', () => {
    const { diagnostics } = tokenize('#not-a-date#')
    assert.ok(diagnostics.length > 0)
    assert.ok(getDiagnostic(diagnostics).message.includes('Invalid date'))
  })

  it('reports error for unexpected characters', () => {
    const { diagnostics } = tokenize('~')
    assert.ok(diagnostics.length > 0)
    assert.ok(getDiagnostic(diagnostics).message.includes('Unexpected character'))
  })

  it('tokenizes all symbol operators', () => {
    const symbolOps = ['==', '!=', '<=', '>=', '<', '>', '&&', '||', '!', '+', '-', '*', '/']
    for (const op of symbolOps) {
      const { tokens } = tokenize(`a ${op} b`)
      const opToken = tokens.find((t) => t.type === 'Operator' && t.value === op)
      assert.ok(opToken, `Operator ${op} not tokenized`)
    }
  })

  it('tokenizes keyword operators', () => {
    for (const op of ['contains', 'in']) {
      const { tokens } = tokenize(`a ${op} b`)
      const opToken = tokens.find((t) => t.type === 'Operator' && t.value === op)
      assert.ok(opToken, `Keyword operator ${op} not tokenized`)
    }
  })

  it('tracks line and column numbers', () => {
    const { tokens } = tokenize('a\nb')
    const first = getToken(tokens, 0)
    const second = getToken(tokens, 1)
    assert.equal(first.line, 1)
    assert.equal(first.column, 1)
    assert.equal(second.line, 2)
    assert.equal(second.column, 1)
  })
})

describe('parser — happy path', () => {
  it('parses a simple comparison', () => {
    const { ast, diagnostics } = parse('claimAmount > 5000')
    assert.equal(diagnostics.length, 0)
    const binary = expectAstKind(ast, 'BinaryExpression')
    assert.equal(binary.operator, '>')
    assert.equal(binary.left.kind, 'Identifier')
    assert.equal(binary.right.kind, 'Literal')
  })

  it('parses equality with string literal', () => {
    const { ast, diagnostics } = parse('priority == "urgent"')
    assert.equal(diagnostics.length, 0)
    expectAstKind(ast, 'BinaryExpression')
  })

  it('parses boolean expression with &&', () => {
    const { ast, diagnostics } = parse('approved == true && score > 80')
    assert.equal(diagnostics.length, 0)
    assert.equal(expectAstKind(ast, 'BinaryExpression').operator, '&&')
  })

  it('parses boolean expression with ||', () => {
    const { ast, diagnostics } = parse('score > 90 || approved == true')
    assert.equal(diagnostics.length, 0)
    assert.equal(expectAstKind(ast, 'BinaryExpression').operator, '||')
  })

  it('parses unary not', () => {
    const { ast, diagnostics } = parse('!approved')
    assert.equal(diagnostics.length, 0)
    const unary = expectAstKind(ast, 'UnaryExpression')
    assert.equal(unary.operator, '!')
    assert.equal(unary.operand.kind, 'Identifier')
  })

  it('parses unary minus', () => {
    const { ast, diagnostics } = parse('-score')
    assert.equal(diagnostics.length, 0)
    assert.equal(expectAstKind(ast, 'UnaryExpression').operator, '-')
  })

  it('parses parenthesized expressions', () => {
    const { ast, diagnostics } = parse('(score + 10) * rate')
    assert.equal(diagnostics.length, 0)
    const binary = expectAstKind(ast, 'BinaryExpression')
    assert.equal(binary.operator, '*')
    assert.equal(binary.left.kind, 'BinaryExpression')
  })

  it('parses arithmetic with correct precedence', () => {
    const { ast, diagnostics } = parse('score + 10 * rate')
    assert.equal(diagnostics.length, 0)
    const binary = expectAstKind(ast, 'BinaryExpression')
    assert.equal(binary.operator, '+')
    const right = expectAstKind(binary.right, 'BinaryExpression')
    assert.equal(right.operator, '*')
  })

  it('parses null comparison', () => {
    const { ast, diagnostics } = parse('priority != null')
    assert.equal(diagnostics.length, 0)
    const binary = expectAstKind(ast, 'BinaryExpression')
    const right = expectAstKind(binary.right, 'Literal')
    assert.equal(right.literalType, 'null')
  })

  it('parses date literal comparison', () => {
    const { ast, diagnostics } = parse('dueDate < #2026-12-31#')
    assert.equal(diagnostics.length, 0)
    const binary = expectAstKind(ast, 'BinaryExpression')
    const right = expectAstKind(binary.right, 'Literal')
    assert.equal(right.literalType, 'date')
  })

  it('parses datetime literal comparison', () => {
    const { ast, diagnostics } = parse('createdAt > #2026-01-01T00:00#')
    assert.equal(diagnostics.length, 0)
    assert.ok(ast)
  })

  it('returns null AST for empty input', () => {
    const { ast, diagnostics } = parse('')
    assert.equal(ast, null)
    assert.equal(diagnostics.length, 0)
  })
})

describe('parser — operators', () => {
  const binaryOps: Array<{ op: string; left: string; right: string }> = [
    { op: '==', left: 'a', right: '1' },
    { op: '!=', left: 'a', right: '1' },
    { op: '<', left: 'a', right: '1' },
    { op: '<=', left: 'a', right: '1' },
    { op: '>', left: 'a', right: '1' },
    { op: '>=', left: 'a', right: '1' },
    { op: '&&', left: 'a', right: 'b' },
    { op: '||', left: 'a', right: 'b' },
    { op: '+', left: 'a', right: '1' },
    { op: '-', left: 'a', right: '1' },
    { op: '*', left: 'a', right: '1' },
    { op: '/', left: 'a', right: '1' },
    { op: 'contains', left: 'a', right: '"x"' },
    { op: 'in', left: 'a', right: '"x"' },
  ]

  for (const { op, left, right } of binaryOps) {
    it(`parses binary operator: ${op}`, () => {
      const { ast, diagnostics } = parse(`${left} ${op} ${right}`)
      assert.equal(diagnostics.length, 0)
      assert.equal(expectAstKind(ast, 'BinaryExpression').operator, op)
    })
  }

  it('parses unary operator: !', () => {
    const { ast, diagnostics } = parse('!a')
    assert.equal(diagnostics.length, 0)
    assert.equal(expectAstKind(ast, 'UnaryExpression').operator, '!')
  })
})

describe('parser — functions', () => {
  it('parses now() with no arguments', () => {
    const { ast, diagnostics } = parse('now()')
    assert.equal(diagnostics.length, 0)
    const call = expectAstKind(ast, 'FunctionCall')
    assert.equal(call.name, 'now')
    assert.equal(call.args.length, 0)
  })

  it('parses today() with no arguments', () => {
    const { ast, diagnostics } = parse('today()')
    assert.equal(diagnostics.length, 0)
    const call = expectAstKind(ast, 'FunctionCall')
    assert.equal(call.name, 'today')
    assert.equal(call.args.length, 0)
  })

  it('parses age() with one argument', () => {
    const { ast, diagnostics } = parse('age(dueDate)')
    assert.equal(diagnostics.length, 0)
    const call = expectAstKind(ast, 'FunctionCall')
    assert.equal(call.name, 'age')
    assert.equal(call.args.length, 1)
  })

  it('parses function in expression context', () => {
    const { ast, diagnostics } = parse('dueDate < today()')
    assert.equal(diagnostics.length, 0)
    const binary = expectAstKind(ast, 'BinaryExpression')
    assert.equal(binary.right.kind, 'FunctionCall')
  })

  it('parses nested function in expression', () => {
    const { ast, diagnostics } = parse('age(createdAt) > 30')
    assert.equal(diagnostics.length, 0)
    const binary = expectAstKind(ast, 'BinaryExpression')
    assert.equal(binary.left.kind, 'FunctionCall')
  })
})

describe('parser — syntax errors', () => {
  it('reports error for missing right operand', () => {
    const { diagnostics } = parse('a ==')
    assert.ok(diagnostics.length > 0)
  })

  it('reports error for unclosed parenthesis', () => {
    const { diagnostics } = parse('(a + b')
    assert.ok(diagnostics.length > 0)
  })

  it('reports error for unexpected token after expression', () => {
    const { diagnostics } = parse('a b')
    assert.ok(diagnostics.length > 0)
  })

  it('reports error for double operator', () => {
    const { diagnostics } = parse('a == == b')
    assert.ok(diagnostics.length > 0)
  })

  it('syntax errors include line and column', () => {
    const { diagnostics } = parse('a +')
    assert.ok(diagnostics.length > 0)
    const diagnostic = getDiagnostic(diagnostics)
    assert.equal(typeof diagnostic.line, 'number')
    assert.equal(typeof diagnostic.column, 'number')
    assert.ok(diagnostic.line >= 1)
    assert.ok(diagnostic.column >= 1)
  })

  it('reports error for unterminated string in expression', () => {
    const { diagnostics } = parse('a == "hello')
    assert.ok(diagnostics.length > 0)
  })

  it('multiline expression reports correct line for error', () => {
    const { diagnostics } = parse('a == 1\n&&')
    assert.ok(diagnostics.length > 0)
    const errorOnLine2 = diagnostics.find((d) => d.line === 2)
    assert.ok(errorOnLine2, 'Expected an error reported on line 2')
  })
})

describe('validate — undefined variable references', () => {
  it('returns no diagnostics for valid variables', () => {
    const { ast } = parse('claimAmount > 5000 && approved == true')
    const diags = validate(ast, testVars)
    assert.equal(diags.length, 0)
  })

  it('flags undefined variable', () => {
    const { ast } = parse('unknownVar > 5')
    const diags = validate(ast, testVars)
    assert.equal(diags.length, 1)
    const diagnostic = getDiagnostic(diags)
    assert.ok(diagnostic.message.includes('unknownVar'))
    assert.equal(diagnostic.severity, 'error')
  })

  it('flags multiple undefined variables', () => {
    const { ast } = parse('foo == bar')
    const diags = validate(ast, testVars)
    assert.equal(diags.length, 2)
  })

  it('does not flag literals as undefined', () => {
    const { ast } = parse('42 + 10')
    const diags = validate(ast, testVars)
    assert.equal(diags.length, 0)
  })

  it('does not flag function calls as undefined', () => {
    const { ast } = parse('dueDate < today()')
    const diags = validate(ast, testVars)
    assert.equal(diags.length, 0)
  })

  it('flags undefined variable inside function argument', () => {
    const { ast } = parse('age(unknownDate) > 30')
    const diags = validate(ast, testVars)
    assert.equal(diags.length, 1)
    assert.ok(getDiagnostic(diags).message.includes('unknownDate'))
  })

  it('flags undefined variable in nested expression', () => {
    const { ast } = parse('(claimAmount + undefinedFee) > 1000')
    const diags = validate(ast, testVars)
    assert.equal(diags.length, 1)
    assert.ok(getDiagnostic(diags).message.includes('undefinedFee'))
  })

  it('returns empty diagnostics for null AST', () => {
    const diags = validate(null, testVars)
    assert.equal(diags.length, 0)
  })

  it('includes line and column in undefined variable diagnostic', () => {
    const { ast } = parse('badVar == 1')
    const diags = validate(ast, testVars)
    assert.equal(diags.length, 1)
    const diagnostic = getDiagnostic(diags)
    assert.equal(diagnostic.line, 1)
    assert.equal(diagnostic.column, 1)
  })
})

describe('end-to-end expressions', () => {
  it('parses and validates a complex sentry expression', () => {
    const { ast, diagnostics } = parse('claimAmount > 5000 && priority == "urgent" || !approved')
    assert.equal(diagnostics.length, 0)
    const validationDiags = validate(ast, testVars)
    assert.equal(validationDiags.length, 0)
  })

  it('parses and validates date function comparison', () => {
    const { ast, diagnostics } = parse('dueDate < today() && age(createdAt) > 30')
    assert.equal(diagnostics.length, 0)
    const validationDiags = validate(ast, testVars)
    assert.equal(validationDiags.length, 0)
  })

  it('parses and validates arithmetic expression', () => {
    const { ast, diagnostics } = parse('claimAmount * rate + score')
    assert.equal(diagnostics.length, 0)
    const validationDiags = validate(ast, testVars)
    assert.equal(validationDiags.length, 0)
  })

  it('parses contains operator in expression', () => {
    const { ast, diagnostics } = parse('priority contains "urg"')
    assert.equal(diagnostics.length, 0)
    assert.equal(expectAstKind(ast, 'BinaryExpression').operator, 'contains')
  })

  it('parses in operator in expression', () => {
    const { ast, diagnostics } = parse('tier in "premium"')
    assert.equal(diagnostics.length, 0)
    assert.equal(expectAstKind(ast, 'BinaryExpression').operator, 'in')
  })
})
