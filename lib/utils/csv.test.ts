import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('escapes commas, quotes, and line breaks', () => {
    expect(toCsv([
      ['Mô tả', 'Số tiền'],
      ['Sửa, thay "mới"\nphòng', 150000],
    ])).toBe('Mô tả,Số tiền\r\n"Sửa, thay ""mới""\nphòng",150000')
  })
})
