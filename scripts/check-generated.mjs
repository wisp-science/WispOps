import { execFileSync } from 'node:child_process'

const changes = execFileSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'lib'], { encoding: 'utf8' })
if (changes.trim()) {
  console.error('lib/ differs from the checked-in build. Run npm run build and include all lib/ changes.\n' + changes)
  process.exitCode = 1
}
