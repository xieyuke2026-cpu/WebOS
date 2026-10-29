
import { describe,it,expect } from 'vitest'; import { evaluate } from '../src/core/calc';
describe('calc',()=>{ it('precedence',()=>expect(evaluate('2+3*4')).toBe(14)); it('parens',()=>expect(evaluate('(2+3)*4')).toBe(20)); it('division by zero',()=>expect(()=>evaluate('1/0')).toThrow()); it('rejects code',()=>expect(()=>evaluate('alert(1)')).toThrow()); it('unary',()=>expect(evaluate('-3+5')).toBe(2)); });
