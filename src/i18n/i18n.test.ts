import { describe, expect, it } from 'vitest'
import { en } from './en'
import { id } from './id'

describe('i18n', () => {
  it('en and id have identical keys', () => {
    expect(Object.keys(id).sort()).toEqual(Object.keys(en).sort())
  })

  it('placeholders match between languages', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const k of Object.keys(en) as (keyof typeof en)[]) expect(vars(id[k])).toEqual(vars(en[k]))
  })
})
