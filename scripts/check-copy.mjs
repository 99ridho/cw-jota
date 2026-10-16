// Fails on em dashes and double-hyphen dashes in project text (antislop R-02).
// Passing this does not replace the antislop checklist.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SKIP_DIRS = ['node_modules', 'dist', '.git', join('src', 'components', 'ui')]
const ROOTS = ['src', 'scripts', 'anti-slop', 'README.md', 'CLAUDE.md', 'index.html', '.env']
const EXT = /(\.(ts|tsx|mjs|md|html|css)|^\.env)$/

const CHECKS = [
  { name: 'em dash (U+2014)', re: /\u2014/g },
  { name: 'double hyphen used as a dash', re: /\s-{2}\s/g },
]

function* walk(path) {
  const rel = relative(ROOT, path)
  if (SKIP_DIRS.some((d) => rel === d || rel.startsWith(d + '/'))) return
  const st = statSync(path)
  if (st.isDirectory()) {
    for (const entry of readdirSync(path)) yield* walk(join(path, entry))
  } else if (EXT.test(rel.split('/').pop())) {
    yield path
  }
}

const hits = []
for (const root of ROOTS) {
  const entry = join(ROOT, root)
  try {
    statSync(entry)
  } catch {
    continue
  }
  for (const file of walk(entry)) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const { name, re } of CHECKS) {
          if (re.test(line)) hits.push(`${relative(ROOT, file)}:${i + 1}: ${name}`)
          re.lastIndex = 0
        }
      })
  }
}

if (hits.length > 0) {
  console.error('lint:copy failed:')
  for (const h of hits) console.error('  ' + h)
  process.exit(1)
}
console.log('lint:copy passed: no em dashes or double-hyphen dashes.')
