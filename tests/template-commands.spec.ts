import { describe, expect, it } from 'vitest'
import { validateTemplate } from '../src/task-library.ts'
import { renderTemplateCommands, shellWord } from '../src/task-template-content.ts'
import { classifyCommand } from '../src/risk.ts'
import { Inventory } from '../src/inventory.ts'
import { Task } from '../src/config.ts'

const base = { id: 'svc', title: 'Service', description: '', category: 'app', parameters: [{ key: 'svc', label: '服务', hint: '', required: true }] }
const policy = { change: 'ask', sudo: 'ask', destructive: 'ask' } as const

describe('template commands', () => {
  it('accepts read-only commands with placeholders and rejects writing ones', () => {
    const template = validateTemplate({ ...base, definition: { playbook: 'custom', instruction: 'check {{svc}}', commands: [' systemctl is-active {{svc}} ', 'journalctl -u {{svc}} -n 20 --no-pager'] } })
    expect(template.definition.commands).toEqual(['systemctl is-active {{svc}}', 'journalctl -u {{svc}} -n 20 --no-pager'])
    expect(template.definition).not.toHaveProperty('quietHours')
    expect(validateTemplate({ ...base, definition: { playbook: 'inspect', instruction: 'x' } }).definition).not.toHaveProperty('commands')
    for (const commands of [['systemctl restart {{svc}}'], ['sudo cat /etc/shadow'], ['ls; rm -rf /tmp/x'], ['cat {{missing}}'], [''], Array.from({ length: 21 }, () => 'true')]) {
      expect(() => validateTemplate({ ...base, definition: { playbook: 'custom', instruction: 'x', commands } }), commands.join(' | ')).toThrow()
    }
  })

  it('inserts parameter values as one quoted word so a value cannot add a command', () => {
    const template = validateTemplate({ ...base, definition: { playbook: 'custom', instruction: 'check {{svc}}', commands: ['systemctl is-active {{svc}}'] } })
    const hostile = "nginx'; rm -rf / #"
    const [rendered] = renderTemplateCommands(template, { svc: hostile })
    expect(rendered).toBe(`systemctl is-active ${shellWord(hostile)}`)
    expect(rendered).toContain(`'nginx'\\''; rm -rf / #'`)
    // The value is inert as a shell word, and the classifier still refuses the quoted deletion text when the task is saved.
    expect(classifyCommand(rendered as string).level).toBe('destructive')
    expect(() => new Inventory([{ name: 'a' }], {}, policy, [Task({ name: 't', targets: 'a', playbook: 'custom', instruction: 'x', commands: [rendered as string] })])).toThrow(/not read-only/)
    const [benign] = renderTemplateCommands(template, { svc: 'nginx postgresql' })
    expect(benign).toBe("systemctl is-active 'nginx postgresql'")
    expect(classifyCommand(benign as string).level).toBe('read')
    expect(() => new Inventory([{ name: 'a' }], {}, policy, [Task({ name: 't', targets: 'a', playbook: 'custom', instruction: 'x', commands: [benign as string] })])).not.toThrow()
    expect(() => renderTemplateCommands(template, {})).toThrow('请填写')
    expect(renderTemplateCommands(template, {}, false)[0]).toContain('【待填写：服务】')
  })
})
