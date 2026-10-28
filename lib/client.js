window.__ModuleLoader__.load({ id: "dsh-wisp-ops", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/index.tsx
var index_exports = {};
__export(index_exports, {
  ServerIcon: () => ServerIcon,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// client/i18n.ts
var import_react = require("react");

// locale/en.json
var en_default = {
  meta: {
    title: "WispOps \u2014 fleet server operations",
    description: "Manage servers, an independent encrypted credential vault, and per-server recurring tasks in DeepSeek Harness. Includes inspection, disk diagnosis, security triage, fleet commands and per-host approval; WispTerm is optional."
  },
  ui: {
    "health.inspection": "Health inspection",
    "disk.diagnosis": "Disk diagnosis",
    "recent.files": "Recent files",
    "security.triage": "Security triage",
    "custom.checks": "Custom checks",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
    "on.demand": "On demand",
    "every.minutes": "Every {p0} minutes",
    weekly: "Weekly: {p0}",
    daily: "Daily",
    "not.linked": "Not linked",
    missing: "Missing",
    "automation.disabled": "Automation disabled",
    "empty.password": "Empty password",
    close: "Close",
    "failed.to.load": "Failed to load.",
    saved: "Saved.",
    "failed.to.save": "Failed to save.",
    enabled: "Enabled",
    disabled: "Disabled",
    "link.servers": "Link servers",
    "inspection.rules": "Inspection rules",
    next: "Next: ",
    "report.to": "Report to: ",
    disable: "Disable",
    template: "Template: ",
    "sudo.authorized": "Sudo authorized",
    "edit.in.the.configuration.file": "Edit {p0} in the configuration file",
    "managed.in.configuration": "Managed in configuration",
    edit: "Edit",
    delete: "Delete",
    "select.a.report.session.first": "Select a report session first",
    "no.run.time.configured": "No run time configured",
    "enabled.in.this.session": "Enabled in this session",
    "enable.schedule": "Enable schedule",
    "server.operations": "Server operations",
    "manage.servers.credentials.and.recurring.tasks": "Manage servers, credentials and recurring tasks together.",
    loading: "Loading\u2026",
    refresh: "\u21BB Refresh",
    retry: "Retry",
    "reading.the.server.inventory": "Reading the server inventory\u2026",
    "management.data.is.unavailable": "Management data is unavailable.",
    "operations.overview": "Operations overview",
    servers: "Servers ",
    credentials: "Credentials ",
    "enabled.tasks": "Enabled tasks ",
    "operations.management": "Operations management",
    "servers.2": "Servers",
    vault: "Vault",
    "task.library": "Task library",
    "recurring.tasks": "Recurring tasks",
    "device.sync": "Device sync",
    search: "Search",
    "search.servers.addresses.or.groups": "Search servers, addresses or groups\u2026",
    "search.credentials.usernames.or.servers": "Search credentials, usernames or servers\u2026",
    "search.templates.purposes.or.categories": "Search templates, purposes or categories\u2026",
    "search.tasks.or.linked.servers": "Search tasks or linked servers\u2026",
    "add.server": "Add server",
    "edit.server": "Edit server",
    "save.server": "Save server",
    "server.name.is.fixed": "The name links credentials, permissions and tasks, so it cannot be changed.",
    "managed.outside.panel": "Managed in configuration or WispTerm",
    "new.credential": "New credential",
    "new.template": "New template",
    "generate.in.chat": "Generate in chat",
    "generate.in.chat.target": "Generate in chat sends what you have filled in to \u201C{p0}\u201D. Describe the check there; the agent's draft appears under Drafts to review in the task library.",
    "open.a.session.first": "Open a conversation first to generate this template in chat.",
    "template.chat.prompt": "Help me design a recurring check template for the WispOps task library.{p0}\nFirst confirm with me what to check, the thresholds and a suggested run time, using read-only tools if that helps. Then submit it with ops_template_draft so I can review and save it in the panel.",
    "template.chat.filled": "\nWhat I have filled in so far:",
    "drafts.to.review": "Drafts to review",
    "ai.draft": "AI draft",
    "review.and.save": "Review and save",
    discard: "Discard",
    "review.ai.draft": "Review AI draft",
    "ai.draft.ready": "The agent's template draft is ready under Task library \u2192 Drafts to review.",
    "link.task": "Link task",
    "server.list": "Server list",
    "server.details": "SERVER DETAILS",
    tasks: " tasks",
    "add.your.first.server": "Add your first server",
    "existing.yaml.inventories.are.also.supported": "Existing YAML inventories are also supported.",
    "no.matching.servers": "No matching servers",
    "password.login": "Password login",
    "ssh.key": "SSH key",
    "connection.address": "Connection address",
    "username.port": "Username / port",
    "ssh.configuration": "SSH configuration",
    "last.probe": "Last probe",
    "unknown.system": "Unknown system",
    "linked.credentials": "Linked credentials",
    "ssh.login": "SSH login",
    "sudo.elevation": "Sudo elevation",
    "passwords.are.decrypted.only.for.connections": "Passwords are decrypted only for connections and never shown to the model.",
    "recurring.tasks.2": "Recurring tasks ",
    "link.task.2": "\uFF0B Link task",
    "select.a.template.from.the.library": "Select a template from the library, link servers, then enable scheduling.",
    permissions: "Permissions",
    "approval.required": "Approval required",
    allow: "Allow",
    deny: "Deny",
    "credentials.are.encrypted.and.linked.by": "Passwords are stored encrypted here. Link one to a server from that server's SSH login or sudo row.",
    "no.username.set": "No username set",
    "automation.allowed": "Automation allowed",
    "stored.encrypted": "Stored encrypted",
    encrypted: "Encrypted",
    "no.linked.servers": "No linked servers",
    "edit.credential": "Edit credential",
    "no.matching.credentials": "No matching credentials",
    "clear.search": "Clear search",
    "create.your.first.encrypted.credential": "Create your first encrypted credential",
    "select.servers.and.purposes.to.link": "Then link it from a server's SSH login or sudo row.",
    "create.templates.then.link.servers.use": "Create templates, then link servers. Use or copy presets; existing tasks keep their own rules.",
    preset: "Preset",
    custom: "Custom",
    "used.by.recurring.tasks": "Used by {p0} recurring tasks",
    "ready.to.link.servers": "Ready to link servers",
    "specify.check.targets.when.linking": " \xB7 Specify check targets when linking",
    "copy.and.edit": "Copy and edit",
    "no.matching.templates": "No matching templates",
    "report.to.2": "Report to",
    "report.session": "Report session",
    "choose.a.session.for.reports": "Choose a session for reports",
    "current.session": "Current session",
    "reports.arrive.here.when.due.keep": '"Run once" sends the task to this session right away; scheduled runs report here when due. Harness must keep running.',
    "scheduling.is.unavailable.here.use.ops": "Scheduling is unavailable here; use /ops-run to run manually.",
    "no.matching.tasks": "No matching tasks",
    "make.inspections.routine": "Make inspections routine",
    "choose.servers.checks.and.a.run": "Choose servers, checks and a run time to create a task.",
    "wispops.recurring.tasks.collect.and.report": "WispOps \xB7 Recurring tasks collect and report; server changes follow approval policies.",
    "new.encrypted.credential": "New encrypted credential",
    "edit.recurring.task": "Edit recurring task",
    "link.servers.and.task": "Link servers and task",
    "link.task.for.server": "Link a task to {p0}",
    "choose.a.task.template": "Choose a task template",
    "edit.task.template": "Edit task template",
    "new.task.template": "New task template",
    "confirm.deletion": "Confirm deletion",
    "choose.task.for.server": "Choose a task template for {p0}. The task will be linked only to this server.",
    "choose.a.template.then.select.servers": "Choose a template, then select servers and a run time.",
    "custom.generate.rules.for.servers": "Custom / Generate rules for servers",
    "delete.2": "Delete \u201C",
    "linked.tasks.keep.their.existing.rules": "Linked tasks keep their existing rules.",
    "this.cannot.be.undone": "This cannot be undone.",
    "delete.server.effect": "Its credential links and permission overrides are removed; credentials stay in the vault. This cannot be undone.",
    "delete.linked.credential.effect": "It is still linked to {p0}. Those servers fall back to SSH key login and sudo without a stored password. This cannot be undone.",
    cancel: "Cancel",
    "server.name": "Server name",
    "letters.numbers.dots.hyphens.or.underscores": "Letters, numbers, dots, hyphens or underscores, e.g. hk-prod",
    "ssh.address.or.config.alias": "SSH address or config alias",
    "192.0.2.10.or.hk": "192.0.2.10 or hk-server",
    username: "Username",
    port: "Port",
    groups: "Groups",
    "separate.groups.with.commas": "Separate groups with commas",
    description: "Description",
    "production.server.in.hong.kong": "Production server in Hong Kong",
    "link.ssh.and.sudo.credentials.after": "Link SSH and sudo credentials after adding the server; otherwise use the existing SSH key configuration.",
    saving: "Saving\u2026",
    "current.binding": " (current binding)",
    server: "Server: ",
    "without.a.credential.use.passwordless.sudo": "Without a credential, use passwordless sudo. Server policy still controls sudo access.",
    "the.vault.is.empty": "The vault is empty. ",
    "need.another.credential": "Need another credential? ",
    "create.a.credential.and.link.this": "Create a credential and link this server",
    "save.bindings": "Save bindings",
    "combined.custom.checks": "Combined / Custom checks",
    "servers.or.checks.changed.regenerate.rules": "Servers or checks changed. Regenerate rules or enter report requirements.",
    "generation.failed.please.retry": "Generation failed. Please retry.",
    "linked.servers.selected": "Linked servers \xB7 Selected ",
    "servers.3": " servers",
    "add.a.server.first": "Add a server first.",
    "rules.are.ready.specify.the.check": "Rules are ready. Specify the check targets; saved tasks run independently.",
    "view.preset.inspection.rules": "View preset inspection rules",
    checks: "Checks",
    "generate.inspection.rules": "Generate inspection rules",
    "fill.the.task.name.checks.and": "Fill the task name, checks and report requirements from capabilities, history and thresholds. You can edit the result.",
    "connect.to.selected.servers.for.a": "Connect to selected servers for a read-only probe first",
    "connect.to.current.server.for.a": "Connect to this server for a read-only probe first",
    "probing.os.gpu.schedulers.and.containers": "Probing OS, GPU, schedulers and containers may take several seconds.",
    "use.saved.probes.and.inspection.records": "Use saved probes and inspection records without connecting.",
    generating: "Generating\u2026",
    "generate.inspection.rules.2": "Generate inspection rules",
    "draft.generated.not.saved": "Draft generated \xB7 Not saved",
    probe: "Probe: {p0}",
    inspection: " \xB7 Inspection: {p0}",
    "task.name": "Task name",
    "generate.or.enter.a.unique.identifier": "Generate or enter a unique identifier, e.g. hk-daily",
    "display.title": "Display title",
    "daily.inspection.of.the.hong.kong": "Daily inspection of the Hong Kong server",
    "additional.requirements.optional": "Additional requirements (optional)",
    "report.requirements": "Report requirements",
    "add.metrics.to.focus.on.and": "Add metrics to focus on and reporting preferences.",
    "for.example.describe.only.abnormal.findings": "For example, describe only abnormal findings in detail.",
    "use.generate.inspection.rules.above.to": "Use Generate inspection rules above to fill this in.",
    "scan.paths": "Scan paths",
    "absolute.paths.separated.by.commas": "Absolute paths, separated by commas",
    "look.back.days": "Look-back days",
    "look.back.hours": "Look-back hours",
    frequency: "Frequency",
    "weekly.2": "Weekly",
    "fixed.interval": "Fixed interval",
    "cron.expression": "Cron expression",
    "interval.minutes": "Interval (minutes)",
    "five.field.cron": "Five-field cron",
    "run.time": "Run time",
    "time.zone": "Time zone",
    "task.sudo.title": "Pre-authorize sudo",
    "task.sudo.hint": "For this task's read-only collection only. Server permission rules still apply.",
    "external.notifications": "External notifications",
    "task.notifications.unconfigured": "Not configured",
    "task.notifications.only.problems": "Problems only",
    "add.notification.channels.in.the.plugin": "Add notification channels in the plugin configuration first.",
    "notify.only.on.warnings.failures.or": "Notify only on warnings, failures or incomplete collection",
    "after.saving.choose.a.report.session": "After saving, choose a report session in Recurring tasks, then run once or enable the schedule.",
    "save.task": "Save task",
    "script.check": "Check script",
    "check.scripts": "Check scripts",
    "search.scripts": "Search scripts by id, title or purpose",
    "new.script": "New script",
    "edit.script": "Edit script",
    "scripts.note": "Owner-reviewed shell scripts that run on linked servers on the WispOps timer, judged by exit status: a green run costs no model tokens. Save a script, test it on a server, then link servers and choose how runs are reported.",
    "scripts.empty": "No check scripts yet",
    "scripts.empty.hint": "Write one here, or ask the agent in chat to draft one; drafts appear above for review.",
    "no.matching.scripts": "No matching scripts",
    "script.no.description": "No description",
    "script.label": "Script: ",
    "script.content": "Script",
    "script.id": "Script id",
    "script.id.hint": "Letters, digits, dot, hyphen or underscore, e.g. gpu-idle",
    "script.title": "Title",
    "script.description.hint": "What it checks and when it warns, shown on the card and to the agent.",
    "script.contract.hint": "POSIX sh, sent to each linked server on stdin and run with sh -s. Keep it read-only and bounded.",
    "script.contract.title": "Output contract",
    "script.contract.exit": "Exit 0 = ok, 1 = warning, 2 = critical; any other status means the script itself failed.",
    "script.contract.summary": "The first non-empty stdout line is the one-line summary used in notifications and shown to the agent; everything after it is evidence.",
    "script.contract.metrics": 'An optional line WISPOPS-JSON: {"key": number} records metrics with the run.',
    "script.contract.trust": "Saving here is the authorization: scripts are not classified line by line, only the deploy-wide deny list still applies. The agent can only submit drafts.",
    "script.timeout": "Timeout (seconds)",
    "script.timeout.hint": "Per server; the run counts as failed when exceeded.",
    "script.timeout.summary": "{p0}s timeout",
    "script.test.on": "Test on a server",
    "script.test": "Run test",
    "script.testing": "Running\u2026",
    "script.test.failed": "Test failed",
    "script.exit": "exit {p0}",
    "script.save": "Save script",
    "script.form.note": "The script runs unattended on every linked server. Test it here first: the test runs read-only without sudo and is written to the audit log.",
    "script.view.content": "View script",
    "script.requirements.hint": "Only read when the agent writes a report: what to focus on and how to report.",
    "delete.script.effect": "Tasks that use it must be deleted or changed first.",
    "report.mode": "Reporting",
    "report.mode.always": "Agent reports every run",
    "report.mode.always.hint": "A DSH schedule wakes the agent at each run; it collects the data and writes the report. Costs tokens every time.",
    "report.mode.problems": "Agent only on problems",
    "report.mode.problems.hint": "WispOps runs the task on its own timer, records and notifies. Only a run with warnings, failures or unreachable servers is handed to the agent, which reads the stored evidence.",
    "report.mode.never": "Record and notify only",
    "report.mode.never.hint": "WispOps runs the task on its timer; results go to history and notification channels. The agent sees them only when asked.",
    "report.mode.custom.note": "A custom task without read-only commands has nothing to run without the agent, so it always reports through the agent.",
    "report.mode.cron.note": "The WispOps timer takes daily, weekly or interval schedules; use one of those or let the agent report every run.",
    "timer.issue": "Timer",
    "timer.unscheduled": "not scheduled",
    "timer.no.reports": "Records and notifies; the agent is not involved",
    "escalate.to": "Problems go to {p0}",
    "timer.enabled": "Timer enabled",
    "enable.timer": "Enable timer",
    "task.steps": "Task steps",
    "task.step.info": "Task details",
    "task.step.servers": "Link servers",
    "task.step.next": "Next",
    "task.step.back": "Back",
    "task.step.progress": "Step {p0} of {p1}",
    "task.step.servers.hint": "Choose the servers this task runs on. Rules and schedule are set in the previous step.",
    "task.step.servers.first.hint": "Pick the servers first; the next step generates inspection rules from them.",
    "task.step.summary": "Task to link",
    "credential.name": "Credential name",
    "credential.username": "Account username (optional)",
    "new.password.leave.blank.to.keep": "New password (leave blank to keep the existing password)",
    password: "Password",
    notes: "Notes",
    "allow.operations.tools.and.recurring.tasks": "Allow operations tools and recurring tasks to use this credential",
    "connections.use.the.server.s.username": "sudo still follows server and task authorization.",
    "encrypting.and.saving": "Encrypting and saving\u2026",
    "save.a.template.then.link.one": "Save a template, then link one or more servers. This does not enable scheduling.",
    "template.id": "Template ID",
    "e.g.daily.health": "e.g. daily-health",
    "template.title": "Template title",
    copy: " (copy)",
    category: "Category",
    "custom.2": "Custom",
    "core.operations": "Core operations",
    security: "Security",
    "application.services": "Application services",
    "data.management": "Data management",
    "compute.cluster": "Compute cluster",
    "short.description": "Short description",
    "you.can.copy.a.preset.and": "You can copy a preset and adjust its checks.",
    "inspect.server.health.report.abnormal.metrics": "Inspect server health; report abnormal metrics, changes since the last run and recommendations. State any evidence gaps. Collect and report only; do not change servers.",
    "parameters.supplied.when.linking.servers": "Parameters supplied when linking servers: ",
    "keep.the.required.placeholders.when.editing": ". Keep the required placeholders when editing rules.",
    "default.scan.paths": "Default scan paths",
    "absolute.paths.separated.by.commas.2": "Absolute paths separated by commas",
    "default.look.back.days": "Default look-back days",
    "default.look.back.hours": "Default look-back hours",
    "suggested.daily.run.time": "Suggested daily run time",
    "choose.weekly.interval.or.cron.schedules": "Choose weekly, interval or cron schedules when linking. Template edits do not affect existing tasks.",
    "save.to.task.library": "Save to task library",
    "encrypted.snapshot.uploaded": "Encrypted snapshot uploaded: {p0}",
    "imported.schedules.remain.disabled.local.encrypted": "Imported; schedules remain disabled. Local encrypted backup: {p0}",
    "sync.failed.please.retry": "Sync failed. Please retry.",
    "sync.subtitle": "Back up and restore device settings with encrypted WebDAV snapshots.",
    "sync.encrypted": "End-to-end encrypted",
    "sync.connection.title": "WebDAV connection",
    "sync.connection.hint": "Connect with a Nutstore or WebDAV application password.",
    "sync.encryption.title": "Snapshot encryption",
    "sync.encryption.hint": "Use the same sync passphrase on both devices.",
    "sync.passphrase.hint": "The passphrase is never saved or uploaded. Keep it safe: lost passphrases cannot recover encrypted snapshots.",
    "sync.include.keys": "Include SSH private keys",
    "sync.upload.title": "Back up this device",
    "sync.upload.hint": "Create an encrypted snapshot and upload it to WebDAV.",
    "sync.download.title": "Restore to this device",
    "sync.download.hint": "Read cloud versions, then preview before confirming an import.",
    "sync.cloud.title": "Cloud snapshots",
    "sync.cloud.hint": "Choose a version to decrypt and review its contents.",
    "sync.cloud.empty": "No cloud snapshots found. Upload a snapshot from your source device first.",
    "sync.preview.counts": "Local items \u2192 Items after import",
    "encrypted.device.sync.webdav": "Encrypted device sync \xB7 WebDAV",
    "connect.with.a.nutstore.application.password": "Connect with a Nutstore application password. Use the same independent encryption passphrase on both devices. It is never saved or uploaded; lost passphrases cannot be recovered.",
    "webdav.folder.url": "WebDAV folder URL",
    "nutstore.account.webdav.username": "Nutstore account / WebDAV username",
    "webdav.application.password": "WebDAV application password",
    "independent.sync.passphrase.at.least.12": "Independent sync passphrase (at least 12 characters)",
    "include.ssh.private.keys.referenced.by": "Include SSH private keys referenced by panel-managed servers in the encrypted upload",
    "sync.includes.the.local.vault.panel": "Sync includes the local vault, panel-managed servers and bindings, removed server names, tasks and custom templates. YAML, sessions, grants and active schedules stay on each device.",
    "upload.a.new.encrypted.snapshot": "Upload a new encrypted snapshot",
    "list.cloud.snapshots": "List cloud snapshots",
    "choose.a.cloud.version": "Choose a cloud version",
    "decrypt.and.preview.import": "Decrypt and preview import",
    "import.preview": "Import preview",
    "import.replaces.this.device.s.panel": "Import replaces this device's panel configuration and entire local vault. Stop local schedules first. Existing data is saved as a local encrypted backup.",
    "credentials.2": "Credentials",
    "tasks.2": "Tasks",
    templates: "Templates",
    "ssh.private.keys": "SSH private keys",
    "credentials.3": "Credentials: ",
    "credentials.with.these.names.will.be": "Credentials with these names will be replaced: ",
    "confirm.replacement.of.local.data": "Confirm replacement of local data",
    syncing: "Syncing\u2026",
    "connection.failed.please.retry": "Connection failed. Please retry.",
    "operation.failed.please.retry": "Operation failed. Please retry.",
    "manage.servers.credentials.and.recurring.tasks.2": "Manage servers, credentials and recurring tasks",
    "updates.title": "Updates",
    "updates.subtitle": "Check stable releases and manage your update preferences.",
    "updates.check": "Check for updates",
    "updates.install": "Install verified update",
    "updates.automatic": "Automatically install stable releases",
    "updates.automatic.hint": "Check every 6 hours while Harness is running and install available updates.",
    "updates.version.pending": "No release information",
    "updates.loading": "Loading update status\u2026",
    "updates.loading.hint": "Reading the running version and your update preferences.",
    "updates.unavailable": "Update status unavailable",
    "updates.checking": "Checking\u2026",
    "updates.installing": "Installing\u2026",
    "updates.hint.unchecked": "Check whether a new stable release is available for your installation.",
    "updates.hint.no-release": "You can continue using the current version and check again later.",
    "updates.hint.available": "Release information verified. The update is ready to install.",
    "updates.hint.current": "You are running the latest stable release. No action is needed.",
    "updates.hint.restart": "Restart Harness when convenient to load the new version.",
    "updates.hint.failed": "Try checking again. Your running version is still available.",
    "updates.explanation": "Updates use the Harness plugin manager. Restart Harness after installation. Local development links are preserved.",
    "updates.current": "Running version",
    "updates.latest": "Latest stable release",
    "updates.unchecked": "Not checked yet",
    "updates.no-release": "No stable GitHub release has been published",
    "updates.available": "Update available",
    "updates.restart-required": "Installed \u2014 restart Harness to apply",
    "updates.failed": "Update check or installation failed",
    "updates.reinstall": "If HMR prevents the update, you can also uninstall WispOps from Harness's Plugins page, select Add plugin and enter the following URL to reinstall, then restart Harness:",
    "updates.up-to-date": "Up to date",
    "updates.working": "Working\u2026",
    "updates.release": "Release notes",
    "updates.error": "Update operation failed. Please retry.",
    "ssh.identity.path": "SSH private key path (optional)",
    "ssh.identity.hint": "An explicit local path, e.g. ~/.ssh/id_ed25519. Required to include this key in encrypted sync.",
    "sync.automation.credentials": "Credentials allowed for automation: {p0}",
    "sync.sudo.task": "Task with sudo permission: {p0} \u2192 {p1}",
    "sync.bindings.include.config.hosts": "Credential bindings also apply to matching servers defined in YAML or imported from WispTerm.",
    "sync.binding": "{p0} \xB7 {p1} \xB7 login: {p2} \xB7 sudo: {p3}",
    "fleet.overview": "Fleet overview",
    "fleet.trends": "INSPECTION TRENDS",
    "fleet.summary.ok": "Healthy",
    "fleet.summary.warn": "Warning",
    "fleet.summary.crit": "Critical",
    "fleet.summary.unreachable": "Unreachable",
    "fleet.summary.never": "Not inspected",
    "fleet.range": "Show the last {p0} inspections",
    "fleet.generated": "Data as of {p0}.",
    "fleet.matrix": "Inspection status matrix",
    "fleet.matrix.hint": `Each square is one saved inspection, oldest on the left. Click a square for that run's findings and a row for trends. "Inspect now" connects read-only without sudo and saves one inspection.`,
    "fleet.open.server": "Open server details",
    "fleet.no.history": 'No inspections yet. Click "Inspect now" on a server, run ops_inspect in a session or enable a health inspection task.',
    "fleet.disk": "Disk {p0}",
    "fleet.memory": "Memory available",
    "fleet.cpu": "CPU usage",
    "fleet.used": "{p0}% used",
    "fleet.available": "{p0}% available",
    "fleet.delta": "{p0} pp since {p1}",
    "fleet.one.point": "At least two successful inspections are needed for a trend.",
    "fleet.findings": "Findings",
    "fleet.no.findings": "No warnings in this inspection.",
    "fleet.unreachable.row": "The host could not be inspected at this time.",
    "fleet.inspection.at": "Inspection at {p0}",
    "fleet.short.disk": "disk",
    "fleet.short.mem": "mem",
    "fleet.error": "Failed to load inspection history.",
    "fleet.loading": "Loading inspection history\u2026",
    "credential.username.hint": "SSH login uses the server's configured user. For sudo, a different username opens a separate SSH connection using this credential; leave blank to keep the login account.",
    "sudo.account.connection": "sudo account: {p0}. If it differs from the SSH login account, this credential is used for a separate SSH login and sudo authentication.",
    "sudo.account.current.login": "sudo uses the server's SSH login account. The selected password is used only for sudo authentication.",
    "sudo.account.login.failed": "SSH login for the sudo check failed. Check the sudo credential's username and password, and whether that account is allowed to log in over SSH.",
    "show.password": "Show",
    "hide.password": "Hide",
    "encrypted.on.save.never.shown.again": "Encrypted on save; never shown in the panel or sent to the model again.",
    "the.password.is.stored.in.the": "The password is stored in the vault only. Link it to servers from each server's SSH login or sudo row.",
    "after.saving.this.credential.will.be": "After saving, this credential will be linked to {p0} for {p1}.",
    "encrypt.and.save": "Encrypt and save",
    "encrypt.save.and.link": "Encrypt, save and link",
    "link.credential": "Link",
    "change.credential": "Change",
    "test.credential": "Test",
    "test.credential.for": "Test {p1} for {p0}",
    "link.credential.for": "Link a {p1} credential for {p0}",
    "link.role.credential": "{p0} \xB7 {p1} credential",
    "pick.one.credential.from.the.vault": "Pick one vault credential for this server's {p0}. Passwords are created and edited in the Vault tab.",
    "use.ssh.keys.no.credential": "SSH keys / SSH configuration (no vault credential)",
    "passwordless.sudo.no.credential": "Passwordless sudo (no vault credential)",
    testing: "Testing\u2026",
    "test.login": "Test SSH login",
    "test.sudo": "Test sudo",
    "login.succeeded.as": "Logged in to {p1} as {p0}.",
    "sudo.works.as": "sudo works on {p1}; commands run as {p0}.",
    "ssh.login.failed.check.the.password": "SSH login failed. Check the username on the server and the password in this credential.",
    "sudo.rejected.the.password.or.needs": "sudo rejected the password or needs one. Check this credential or the server's sudo rules.",
    "the.server.is.unreachable": "The server is unreachable.",
    "the.connection.timed.out": "The connection timed out.",
    "logins.are.paused.after.repeated.failures": "Logins to this server are paused after repeated failures. Try again later.",
    "the.test.command.failed": "Connected, but the test command failed.",
    "edit.permissions": "Edit",
    "set.in.panel": "panel",
    "decided.by.host.group.then.default": "Decided per capability by host policy, then group, then the plugin default. Model-side deny lists still apply.",
    "host.permissions": "{p0} \xB7 permissions",
    "allow.runs.without.asking.ask": "allow runs without asking, ask requires your approval each time, deny refuses. Inherited values come from this host's YAML policy, its groups and the plugin default.",
    "capability.change": "Edit files, configuration and services",
    "capability.sudo": "Run commands with sudo",
    "capability.destructive": "Delete data, restart or other destructive actions",
    inherit: "Inherit ({p0})",
    "destructive.allow.warning": "Destructive actions on this server will run without approval. Keep ask unless you are sure.",
    "overrides.apply.to.yaml.hosts.too": "Panel settings are stored in managed.json and override the same capability for a same-named server in YAML or WispTerm. They apply on the next call and travel with device sync.",
    "save.permissions": "Save permissions",
    "fleet.inspect.now": "Inspect now",
    "fleet.inspecting": "Inspecting\u2026",
    "fleet.inspect.host": "Inspect {p0} now",
    "fleet.inspected": "{p0} inspected: {p1}.",
    "fleet.inspect.failed": "{p0} inspection failed: {p1}",
    "fleet.findings.count": "{p0} findings",
    "manual.only": "Manual only (run once)",
    "no.run.time.only.run.once": 'No run time. Run it from the task card with "Run once" or with /ops-run.',
    "run.once": "Run once",
    "audit.log": "Audit log",
    "audit.subtitle": "Every remote command the agent, the panel or a task ran, with its risk, authorization and result. Credentials never appear here.",
    "audit.all.servers": "All servers",
    "audit.window": "Window",
    "audit.window.day": "Last 24 hours",
    "audit.window.week": "Last 7 days",
    "audit.window.month": "Last 30 days",
    "audit.window.year": "Last 365 days",
    "audit.limit": "Rows",
    "audit.empty": "No recorded operations in this window.",
    "audit.time": "Time",
    "audit.host": "Server",
    "audit.tool": "Source",
    "audit.risk": "Risk",
    "audit.authorization": "Authorization",
    "audit.status": "Result",
    "audit.command": "Command",
    "audit.reason": "Reason: {p0}",
    "audit.retention": "Monthly audit files older than {p0} months are removed automatically.",
    "audit.retention.unlimited": "Audit files are kept indefinitely.",
    "audit.load.failed": "Could not load the audit log.",
    "view.audit": "View audit",
    "import.from.ssh.config": "Import from ssh_config",
    "ssh.import.title": "Import servers from ssh_config",
    "ssh.import.hint": "Literal Host entries in {p0} and the files it includes. Imported servers connect through their alias, so keys, ProxyJump and other options stay in ssh_config; wildcard patterns are skipped.",
    "ssh.import.empty": "No importable Host entries were found.",
    "ssh.import.existing": "Already in inventory",
    "ssh.import.select.all": "Select all new",
    "ssh.import.submit": "Import {p0} and probe",
    "ssh.import.probing": "Importing and probing\u2026",
    "ssh.import.load.failed": "Could not read ssh_config.",
    "probe.now": "Probe now",
    "probe.failed": "Probe failed: {p0}",
    "probe.done": "Probed {p0} server(s); {p1} could not be reached.",
    "probe.cores": "{p0} cores",
    "probe.gpus": "{p0} GPU",
    "probe.scheduler": "Scheduler {p0}",
    "probe.docker": "Docker {p0}",
    "probe.privilege.root": "root",
    "probe.privilege.sudo-nopasswd": "Passwordless sudo",
    "probe.privilege.sudo-password": "sudo needs a password",
    "probe.privilege.none": "No sudo",
    "not.probed": "Not probed yet. Probe to record the OS, GPUs, scheduler, Docker and sudo availability.",
    capabilities: "Capabilities",
    "missed.run": "Missed run",
    "missed.run.detail": "Due {p0}, with no run recorded since. Check that Harness and the report session were open; use Run once to catch up.",
    "last.run": "Last run: {p0}",
    "never.run": "Enabled, no run recorded yet",
    "read.only.commands": "Read-only commands",
    "read.only.commands.hint": "One per line, run on every linked server before the report is written; only commands that classify as read-only are accepted. A custom task can collect its own evidence this way.",
    "read.only.commands.template.hint": "One per line; a {{key}} placeholder is inserted as one quoted shell word when servers are linked.",
    "commands.count": "{p0} read-only command(s)",
    "task.notify.on.change": "Only when the result changes",
    "task.notify.on.change.hint": "Skip delivery when the problem counts equal the previous run; the first run always delivers.",
    "quiet.hours": "Quiet hours",
    "quiet.hours.hint": "No external notifications between these local times; the report still arrives in the session.",
    "quiet.hours.start": "From",
    "quiet.hours.end": "To",
    "quiet.hours.summary": "Quiet {p0}\u2013{p1}",
    "remove.server": "Remove from WispOps",
    "remove.server.confirm": "Remove \u201C{p0}\u201D from WispOps?",
    "remove.server.effect": "Keeps WispTerm, ssh_config and YAML unchanged. The server stays removed after refresh or restart. Credential links, permissions and history are kept for restoration. First edit or delete any task that names this server or would lose its last target.",
    "removed.servers": "Removed servers",
    "removed.servers.count": "Removed ({p0})",
    "removed.servers.hint": "Restore a server using its current source configuration and saved credential links and permissions. If its source is unavailable, it will appear when the source provides it again. Restored servers can rejoin tasks selected by group or wildcard.",
    "restore.server": "Restore",
    "restore.server.named": "Restore {p0}",
    "ssh.import.excluded": "Removed; restore first",
    "sync.removed.servers": "Removed servers: {p0} \u2192 {p1}. Import replaces this list too; an older snapshot may restore previously removed servers."
  }
};

// locale/zh.json
var zh_default = {
  meta: {
    title: "WispOps \u2014 \u591A\u4E3B\u673A\u670D\u52A1\u5668\u8FD0\u7EF4",
    description: "\u5728 DeepSeek Harness \u4E2D\u7BA1\u7406\u670D\u52A1\u5668\u3001\u72EC\u7ACB\u52A0\u5BC6\u5BC6\u7801\u5E93\u548C\u5173\u8054\u670D\u52A1\u5668\u7684\u4F8B\u884C\u4EFB\u52A1\u3002\u652F\u6301\u5DE1\u68C0\u3001\u78C1\u76D8\u8BCA\u65AD\u3001\u5B89\u5168\u6392\u67E5\u3001\u6279\u91CF\u547D\u4EE4\u53CA\u9010\u4E3B\u673A\u5BA1\u6279\uFF0C\u65E0\u9700\u5B89\u88C5 WispTerm\u3002"
  },
  ui: {
    "health.inspection": "\u5065\u5EB7\u5DE1\u68C0",
    "disk.diagnosis": "\u78C1\u76D8\u8BCA\u65AD",
    "recent.files": "\u65B0\u589E\u6587\u4EF6\u5206\u6790",
    "security.triage": "\u5B89\u5168\u6392\u67E5",
    "custom.checks": "\u81EA\u5B9A\u4E49\u68C0\u67E5",
    mon: "\u4E00",
    tue: "\u4E8C",
    wed: "\u4E09",
    thu: "\u56DB",
    fri: "\u4E94",
    sat: "\u516D",
    sun: "\u65E5",
    "on.demand": "\u624B\u52A8\u8FD0\u884C",
    "every.minutes": "\u6BCF {p0} \u5206\u949F",
    weekly: "\u6BCF\u5468{p0}",
    daily: "\u6BCF\u5929",
    "not.linked": "\u672A\u5173\u8054",
    missing: "\u4E0D\u5B58\u5728",
    "automation.disabled": "\u7981\u6B62\u81EA\u52A8\u5316",
    "empty.password": "\u5BC6\u7801\u4E3A\u7A7A",
    close: "\u5173\u95ED",
    "failed.to.load": "\u52A0\u8F7D\u5931\u8D25\u3002",
    saved: "\u5DF2\u4FDD\u5B58\u3002",
    "failed.to.save": "\u4FDD\u5B58\u5931\u8D25\u3002",
    enabled: "\u5DF2\u542F\u7528",
    disabled: "\u672A\u542F\u7528",
    "link.servers": "\u5173\u8054\u670D\u52A1\u5668",
    "inspection.rules": "\u5DE1\u67E5\u89C4\u5219",
    next: "\u4E0B\u6B21 ",
    "report.to": "\u6C47\u62A5\u81F3 ",
    disable: "\u505C\u7528",
    template: "\u6A21\u677F\uFF1A",
    "sudo.authorized": "sudo \u5DF2\u6388\u6743",
    "edit.in.the.configuration.file": "\u5728\u914D\u7F6E\u6587\u4EF6\u4E2D\u7F16\u8F91 {p0}",
    "managed.in.configuration": "\u914D\u7F6E\u6587\u4EF6\u7BA1\u7406",
    edit: "\u7F16\u8F91",
    delete: "\u5220\u9664",
    "select.a.report.session.first": "\u8BF7\u5148\u9009\u62E9\u6C47\u62A5\u4F1A\u8BDD",
    "no.run.time.configured": "\u6B64\u4EFB\u52A1\u672A\u8BBE\u7F6E\u8FD0\u884C\u65F6\u95F4",
    "enabled.in.this.session": "\u6B64\u4F1A\u8BDD\u5DF2\u542F\u7528",
    "enable.schedule": "\u542F\u7528\u8C03\u5EA6",
    "server.operations": "\u670D\u52A1\u5668\u8FD0\u7EF4",
    "manage.servers.credentials.and.recurring.tasks": "\u670D\u52A1\u5668\u3001\u5BC6\u7801\u5E93\u548C\u4F8B\u884C\u4EFB\u52A1\uFF0C\u5728\u4E00\u5904\u7BA1\u7406\u3002",
    loading: "\u52A0\u8F7D\u4E2D\u2026",
    refresh: "\u21BB \u5237\u65B0",
    retry: "\u91CD\u8BD5",
    "reading.the.server.inventory": "\u6B63\u5728\u8BFB\u53D6\u670D\u52A1\u5668\u6E05\u5355\u2026",
    "management.data.is.unavailable": "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u7BA1\u7406\u6570\u636E\u3002",
    "operations.overview": "\u8FD0\u7EF4\u6982\u89C8",
    servers: "\u670D\u52A1\u5668 ",
    credentials: "\u51ED\u636E ",
    "enabled.tasks": "\u4EFB\u52A1\u5DF2\u542F\u7528 ",
    "operations.management": "\u8FD0\u7EF4\u7BA1\u7406",
    "servers.2": "\u670D\u52A1\u5668",
    vault: "\u5BC6\u7801\u5E93",
    "task.library": "\u4EFB\u52A1\u5E93",
    "recurring.tasks": "\u4F8B\u884C\u4EFB\u52A1",
    "device.sync": "\u8BBE\u5907\u540C\u6B65",
    search: "\u641C\u7D22",
    "search.servers.addresses.or.groups": "\u641C\u7D22\u670D\u52A1\u5668\u3001\u5730\u5740\u6216\u5206\u7EC4\u2026",
    "search.credentials.usernames.or.servers": "\u641C\u7D22\u51ED\u636E\u3001\u7528\u6237\u540D\u6216\u670D\u52A1\u5668\u2026",
    "search.templates.purposes.or.categories": "\u641C\u7D22\u6A21\u677F\u3001\u7528\u9014\u6216\u5206\u7C7B\u2026",
    "search.tasks.or.linked.servers": "\u641C\u7D22\u4EFB\u52A1\u6216\u5173\u8054\u670D\u52A1\u5668\u2026",
    "add.server": "\u6DFB\u52A0\u670D\u52A1\u5668",
    "edit.server": "\u7F16\u8F91\u670D\u52A1\u5668",
    "save.server": "\u4FDD\u5B58\u670D\u52A1\u5668",
    "server.name.is.fixed": "\u540D\u79F0\u5173\u8054\u7740\u51ED\u636E\u3001\u6743\u9650\u548C\u4EFB\u52A1\uFF0C\u4E0D\u80FD\u4FEE\u6539\u3002",
    "managed.outside.panel": "\u7531\u914D\u7F6E\u6587\u4EF6\u6216 WispTerm \u7BA1\u7406",
    "new.credential": "\u65B0\u589E\u51ED\u636E",
    "new.template": "\u65B0\u5EFA\u6A21\u677F",
    "generate.in.chat": "\u5728\u5BF9\u8BDD\u4E2D\u751F\u6210",
    "generate.in.chat.target": "\u300C\u5728\u5BF9\u8BDD\u4E2D\u751F\u6210\u300D\u4F1A\u628A\u5DF2\u586B\u5199\u7684\u5185\u5BB9\u53D1\u9001\u5230\u4F1A\u8BDD\u300C{p0}\u300D\u3002\u5728\u5BF9\u8BDD\u4E2D\u8865\u5145\u9700\u6C42\uFF0Cagent \u751F\u6210\u7684\u8349\u7A3F\u4F1A\u51FA\u73B0\u5728\u4EFB\u52A1\u5E93\u7684\u300C\u5F85\u5BA1\u6838\u8349\u7A3F\u300D\u4E2D\u3002",
    "open.a.session.first": "\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u4F1A\u8BDD\uFF0C\u624D\u80FD\u5728\u5BF9\u8BDD\u4E2D\u751F\u6210\u6A21\u677F\u3002",
    "template.chat.prompt": "\u8BF7\u5E2E\u6211\u4E3A WispOps \u4EFB\u52A1\u5E93\u8BBE\u8BA1\u4E00\u4E2A\u4F8B\u884C\u68C0\u67E5\u6A21\u677F\u3002{p0}\n\u5148\u548C\u6211\u786E\u8BA4\u68C0\u67E5\u5185\u5BB9\u3001\u9608\u503C\u548C\u5EFA\u8BAE\u8FD0\u884C\u65F6\u95F4\uFF0C\u9700\u8981\u65F6\u53EF\u4EE5\u7528\u53EA\u8BFB\u5DE5\u5177\u4E86\u89E3\u670D\u52A1\u5668\uFF1B\u7136\u540E\u8C03\u7528 ops_template_draft \u63D0\u4EA4\u8349\u7A3F\uFF0C\u6211\u4F1A\u5728\u9762\u677F\u4E2D\u5BA1\u6838\u540E\u4FDD\u5B58\u3002",
    "template.chat.filled": "\n\u6211\u5DF2\u586B\u5199\uFF1A",
    "drafts.to.review": "\u5F85\u5BA1\u6838\u8349\u7A3F",
    "ai.draft": "AI \u8349\u7A3F",
    "review.and.save": "\u5BA1\u6838\u5E76\u4FDD\u5B58",
    discard: "\u4E22\u5F03",
    "review.ai.draft": "\u5BA1\u6838 AI \u8349\u7A3F",
    "ai.draft.ready": "agent \u63D0\u4EA4\u7684\u6A21\u677F\u8349\u7A3F\u5DF2\u5C31\u7EEA\uFF0C\u8BF7\u5728\u4EFB\u52A1\u5E93\u7684\u300C\u5F85\u5BA1\u6838\u8349\u7A3F\u300D\u4E2D\u5BA1\u6838\u3002",
    "link.task": "\u5173\u8054\u4EFB\u52A1",
    "server.list": "\u670D\u52A1\u5668\u5217\u8868",
    "server.details": "\u670D\u52A1\u5668\u8BE6\u60C5",
    tasks: " \u4E2A\u4EFB\u52A1",
    "add.your.first.server": "\u6DFB\u52A0\u7B2C\u4E00\u53F0\u670D\u52A1\u5668",
    "existing.yaml.inventories.are.also.supported": "\u4E5F\u652F\u6301\u8BFB\u53D6\u5DF2\u6709 YAML \u6E05\u5355\u3002",
    "no.matching.servers": "\u6CA1\u6709\u5339\u914D\u7684\u670D\u52A1\u5668",
    "password.login": "\u5BC6\u7801\u767B\u5F55",
    "ssh.key": "SSH \u5BC6\u94A5",
    "connection.address": "\u8FDE\u63A5\u5730\u5740",
    "username.port": "\u7528\u6237\u540D / \u7AEF\u53E3",
    "ssh.configuration": "SSH \u914D\u7F6E",
    "last.probe": "\u6700\u8FD1\u63A2\u6D4B",
    "unknown.system": "\u672A\u77E5\u7CFB\u7EDF",
    "linked.credentials": "\u5173\u8054\u5BC6\u7801\u5E93",
    "ssh.login": "SSH \u767B\u5F55",
    "sudo.elevation": "sudo \u63D0\u6743",
    "passwords.are.decrypted.only.for.connections": "\u5BC6\u7801\u53EA\u5728\u5EFA\u7ACB\u8FDE\u63A5\u65F6\u89E3\u5BC6\uFF0C\u4E0D\u4F1A\u663E\u793A\u7ED9\u6A21\u578B\u3002",
    "recurring.tasks.2": "\u4F8B\u884C\u4EFB\u52A1 ",
    "link.task.2": "\uFF0B \u5173\u8054\u4EFB\u52A1",
    "select.a.template.from.the.library": "\u4ECE\u4EFB\u52A1\u5E93\u9009\u62E9\u68C0\u67E5\u6A21\u677F\uFF0C\u5173\u8054\u540E\u518D\u542F\u7528\u8C03\u5EA6\u3002",
    permissions: "\u64CD\u4F5C\u6743\u9650",
    "approval.required": "\u9700\u5BA1\u6279",
    allow: "\u5141\u8BB8",
    deny: "\u7981\u6B62",
    "credentials.are.encrypted.and.linked.by": "\u5BC6\u7801\u5728\u6B64\u52A0\u5BC6\u4FDD\u5B58\uFF1B\u5230\u670D\u52A1\u5668\u9875\u7684 SSH \u767B\u5F55\u6216 sudo \u884C\u4E3A\u5404\u53F0\u670D\u52A1\u5668\u5206\u522B\u5173\u8054\u3002",
    "no.username.set": "\u672A\u8BBE\u7F6E\u7528\u6237\u540D",
    "automation.allowed": "\u5141\u8BB8\u81EA\u52A8\u5316",
    "stored.encrypted": "\u5DF2\u52A0\u5BC6\u4FDD\u5B58",
    encrypted: "\u5DF2\u52A0\u5BC6",
    "no.linked.servers": "\u5C1A\u672A\u5173\u8054\u670D\u52A1\u5668",
    "edit.credential": "\u7F16\u8F91\u51ED\u636E",
    "no.matching.credentials": "\u6CA1\u6709\u5339\u914D\u7684\u51ED\u636E",
    "clear.search": "\u6E05\u9664\u641C\u7D22",
    "create.your.first.encrypted.credential": "\u521B\u5EFA\u7B2C\u4E00\u6761\u52A0\u5BC6\u51ED\u636E",
    "select.servers.and.purposes.to.link": "\u7136\u540E\u5728\u670D\u52A1\u5668\u9875\u7684 SSH \u767B\u5F55\u6216 sudo \u884C\u5173\u8054\u3002",
    "create.templates.then.link.servers.use": "\u5148\u8BBE\u7F6E\u4EFB\u52A1\u6A21\u677F\uFF0C\u518D\u5173\u8054\u670D\u52A1\u5668\u3002\u9884\u8BBE\u53EF\u76F4\u63A5\u4F7F\u7528\uFF0C\u4E5F\u53EF\u590D\u5236\u4FEE\u6539\uFF1B\u5DF2\u5173\u8054\u4EFB\u52A1\u4FDD\u7559\u81EA\u5DF1\u7684\u89C4\u5219\u3002",
    preset: "\u9884\u8BBE",
    custom: "\u81EA\u5EFA",
    "used.by.recurring.tasks": "\u5DF2\u7528\u4E8E {p0} \u4E2A\u4F8B\u884C\u4EFB\u52A1",
    "ready.to.link.servers": "\u5F85\u5173\u8054\u670D\u52A1\u5668",
    "specify.check.targets.when.linking": " \xB7 \u5173\u8054\u65F6\u586B\u5199\u68C0\u67E5\u5BF9\u8C61",
    "copy.and.edit": "\u590D\u5236\u7F16\u8F91",
    "no.matching.templates": "\u6CA1\u6709\u5339\u914D\u7684\u6A21\u677F",
    "report.to.2": "\u6C47\u62A5\u81F3",
    "report.session": "\u6C47\u62A5\u4F1A\u8BDD",
    "choose.a.session.for.reports": "\u9009\u62E9\u63A5\u6536\u62A5\u544A\u7684\u4F1A\u8BDD",
    "current.session": "\u5F53\u524D\u4F1A\u8BDD",
    "reports.arrive.here.when.due.keep": "\u201C\u8FD0\u884C\u4E00\u6B21\u201D\u4F1A\u7ACB\u5373\u628A\u4EFB\u52A1\u53D1\u5230\u6B64\u4F1A\u8BDD\uFF1B\u5B9A\u65F6\u4EFB\u52A1\u5230\u70B9\u540E\u5728\u6B64\u6C47\u62A5\uFF0CHarness \u9700\u4FDD\u6301\u8FD0\u884C\u3002",
    "scheduling.is.unavailable.here.use.ops": "\u5F53\u524D\u73AF\u5883\u672A\u63D0\u4F9B\u8C03\u5EA6\u670D\u52A1\uFF0C\u53EF\u4F7F\u7528 /ops-run \u624B\u52A8\u8FD0\u884C\u3002",
    "no.matching.tasks": "\u6CA1\u6709\u5339\u914D\u7684\u4EFB\u52A1",
    "make.inspections.routine": "\u8BA9\u68C0\u67E5\u6210\u4E3A\u4F8B\u884C\u5DE5\u4F5C",
    "choose.servers.checks.and.a.run": "\u9009\u62E9\u670D\u52A1\u5668\u3001\u68C0\u67E5\u5185\u5BB9\u548C\u8FD0\u884C\u65F6\u95F4\uFF0C\u5373\u53EF\u521B\u5EFA\u4EFB\u52A1\u3002",
    "wispops.recurring.tasks.collect.and.report": "WispOps \xB7 \u4F8B\u884C\u4EFB\u52A1\u53EA\u91C7\u96C6\u4E0E\u6C47\u62A5\uFF0C\u670D\u52A1\u5668\u53D8\u66F4\u4ECD\u9075\u5FAA\u5BA1\u6279\u7B56\u7565\u3002",
    "new.encrypted.credential": "\u65B0\u589E\u52A0\u5BC6\u51ED\u636E",
    "edit.recurring.task": "\u7F16\u8F91\u4F8B\u884C\u4EFB\u52A1",
    "link.servers.and.task": "\u5173\u8054\u670D\u52A1\u5668\u4E0E\u4EFB\u52A1",
    "link.task.for.server": "\u4E3A {p0} \u5173\u8054\u4EFB\u52A1",
    "choose.a.task.template": "\u9009\u62E9\u4EFB\u52A1\u6A21\u677F",
    "edit.task.template": "\u7F16\u8F91\u4EFB\u52A1\u6A21\u677F",
    "new.task.template": "\u65B0\u5EFA\u4EFB\u52A1\u6A21\u677F",
    "confirm.deletion": "\u786E\u8BA4\u5220\u9664",
    "choose.task.for.server": "\u4E3A {p0} \u9009\u62E9\u4EFB\u52A1\u6A21\u677F\uFF1B\u4EFB\u52A1\u4EC5\u5173\u8054\u6B64\u670D\u52A1\u5668\u3002",
    "choose.a.template.then.select.servers": "\u9009\u62E9\u6A21\u677F\u540E\uFF0C\u518D\u8BBE\u7F6E\u670D\u52A1\u5668\u548C\u8FD0\u884C\u65F6\u95F4\u3002",
    "custom.generate.rules.for.servers": "\u81EA\u5B9A\u4E49 / \u6309\u670D\u52A1\u5668\u751F\u6210\u89C4\u5219",
    "delete.2": "\u5220\u9664\u300C",
    "linked.tasks.keep.their.existing.rules": "\u5DF2\u5173\u8054\u7684\u4F8B\u884C\u4EFB\u52A1\u4ECD\u4FDD\u7559\u539F\u6709\u89C4\u5219\u3002",
    "this.cannot.be.undone": "\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002",
    "delete.server.effect": "\u5176\u51ED\u636E\u5173\u8054\u548C\u64CD\u4F5C\u6743\u9650\u8BBE\u7F6E\u4F1A\u4E00\u5E76\u79FB\u9664\uFF0C\u5BC6\u7801\u5E93\u4E2D\u7684\u51ED\u636E\u4FDD\u7559\u3002\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002",
    "delete.linked.credential.effect": "\u5B83\u4ECD\u5173\u8054 {p0}\uFF1A\u5220\u9664\u540E\u8FD9\u4E9B\u670D\u52A1\u5668\u7684 SSH \u767B\u5F55\u6539\u56DE\u5BC6\u94A5\uFF0Csudo \u6539\u56DE\u672A\u5173\u8054\u3002\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002",
    cancel: "\u53D6\u6D88",
    "server.name": "\u670D\u52A1\u5668\u540D\u79F0",
    "letters.numbers.dots.hyphens.or.underscores": "\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u70B9\u3001\u77ED\u6A2A\u7EBF\u6216\u4E0B\u5212\u7EBF\uFF0C\u5982 hk-prod",
    "ssh.address.or.config.alias": "SSH \u5730\u5740\u6216\u914D\u7F6E\u522B\u540D",
    "192.0.2.10.or.hk": "192.0.2.10 \u6216 hk-server",
    username: "\u7528\u6237\u540D",
    port: "\u7AEF\u53E3",
    groups: "\u5206\u7EC4",
    "separate.groups.with.commas": "\u591A\u4E2A\u5206\u7EC4\u7528\u9017\u53F7\u5206\u9694",
    description: "\u63CF\u8FF0",
    "production.server.in.hong.kong": "\u9999\u6E2F\u4E1A\u52A1\u670D\u52A1\u5668",
    "link.ssh.and.sudo.credentials.after": "\u6DFB\u52A0\u540E\u53EF\u5173\u8054\u767B\u5F55\u548C sudo \u51ED\u636E\uFF1B\u4E0D\u586B\u5199\u5BC6\u7801\u65F6\u4F7F\u7528\u73B0\u6709 SSH \u5BC6\u94A5\u914D\u7F6E\u3002",
    saving: "\u4FDD\u5B58\u4E2D\u2026",
    "current.binding": "\uFF08\u5F53\u524D\u5173\u8054\uFF09",
    server: "\u670D\u52A1\u5668\uFF1A",
    "without.a.credential.use.passwordless.sudo": "\u672A\u5173\u8054\u65F6\u4F7F\u7528\u514D\u5BC6 sudo\uFF1B\u662F\u5426\u5141\u8BB8 sudo \u4ECD\u7531\u670D\u52A1\u5668\u7B56\u7565\u51B3\u5B9A\u3002",
    "the.vault.is.empty": "\u5BC6\u7801\u5E93\u8FD8\u6CA1\u6709\u51ED\u636E\u3002",
    "need.another.credential": "\u6CA1\u6709\u5408\u9002\u7684\u51ED\u636E\uFF1F",
    "create.a.credential.and.link.this": "\u65B0\u589E\u51ED\u636E\u5E76\u5173\u8054\u6B64\u670D\u52A1\u5668",
    "save.bindings": "\u4FDD\u5B58\u5173\u8054",
    "combined.custom.checks": "\u7EFC\u5408 / \u81EA\u5B9A\u4E49\u68C0\u67E5",
    "servers.or.checks.changed.regenerate.rules": "\u670D\u52A1\u5668\u6216\u68C0\u67E5\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u89C4\u5219\uFF0C\u6216\u624B\u52A8\u586B\u5199\u62A5\u544A\u8981\u6C42\u3002",
    "generation.failed.please.retry": "\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    "linked.servers.selected": "\u5173\u8054\u670D\u52A1\u5668 \xB7 \u5DF2\u9009 ",
    "servers.3": " \u53F0",
    "add.a.server.first": "\u8BF7\u5148\u6DFB\u52A0\u670D\u52A1\u5668\u3002",
    "rules.are.ready.specify.the.check": "\u89C4\u5219\u5DF2\u51C6\u5907\u597D\uFF0C\u586B\u5199\u68C0\u67E5\u5BF9\u8C61\u5373\u53EF\u3002\u4FDD\u5B58\u540E\u72EC\u7ACB\u8FD0\u884C\u3002",
    "view.preset.inspection.rules": "\u67E5\u770B\u9884\u8BBE\u5DE1\u67E5\u89C4\u5219",
    checks: "\u68C0\u67E5\u5185\u5BB9",
    "generate.inspection.rules": "\u8BA9\u63D2\u4EF6\u751F\u6210\u5DE1\u67E5\u89C4\u5219",
    "fill.the.task.name.checks.and": "\u6839\u636E\u7CFB\u7EDF\u80FD\u529B\u3001\u5386\u53F2\u5DE1\u68C0\u548C\u544A\u8B66\u9608\u503C\uFF0C\u81EA\u52A8\u586B\u597D\u4EFB\u52A1\u540D\u79F0\u3001\u68C0\u67E5\u9879\u53CA\u62A5\u544A\u8981\u6C42\uFF1B\u751F\u6210\u540E\u4ECD\u53EF\u7F16\u8F91\u3002",
    "connect.to.selected.servers.for.a": "\u5148\u8FDE\u63A5\u6240\u9009\u670D\u52A1\u5668\u505A\u53EA\u8BFB\u63A2\u6D4B",
    "connect.to.current.server.for.a": "\u5148\u8FDE\u63A5\u5F53\u524D\u670D\u52A1\u5668\u505A\u53EA\u8BFB\u63A2\u6D4B",
    "probing.os.gpu.schedulers.and.containers": "\u63A2\u6D4B\u7CFB\u7EDF\u3001GPU\u3001\u8C03\u5EA6\u5668\u548C\u5BB9\u5668\u80FD\u529B\uFF0C\u53EF\u80FD\u9700\u8981\u51E0\u5341\u79D2\u3002",
    "use.saved.probes.and.inspection.records": "\u4F7F\u7528\u5DF2\u4FDD\u5B58\u7684\u63A2\u6D4B\u548C\u5DE1\u68C0\u8BB0\u5F55\uFF0C\u4E0D\u8FDE\u63A5\u670D\u52A1\u5668\u3002",
    generating: "\u6B63\u5728\u751F\u6210\u2026",
    "generate.inspection.rules.2": "\u81EA\u52A8\u751F\u6210\u5DE1\u67E5\u89C4\u5219",
    "draft.generated.not.saved": "\u5DF2\u751F\u6210\u8349\u7A3F \xB7 \u5C1A\u672A\u4FDD\u5B58",
    probe: "\u63A2\u6D4B\uFF1A{p0}",
    inspection: " \xB7 \u5DE1\u68C0\uFF1A{p0}",
    "task.name": "\u4EFB\u52A1\u540D\u79F0",
    "generate.or.enter.a.unique.identifier": "\u81EA\u52A8\u751F\u6210\u6216\u586B\u5199\u552F\u4E00\u6807\u8BC6\uFF0C\u5982 hk-daily",
    "display.title": "\u663E\u793A\u6807\u9898",
    "daily.inspection.of.the.hong.kong": "\u9999\u6E2F\u670D\u52A1\u5668\u6BCF\u65E5\u5DE1\u68C0",
    "additional.requirements.optional": "\u8865\u5145\u8981\u6C42\uFF08\u53EF\u9009\uFF09",
    "report.requirements": "\u62A5\u544A\u8981\u6C42",
    "add.metrics.to.focus.on.and": "\u53EF\u8865\u5145\u5173\u6CE8\u7684\u6307\u6807\u548C\u6C47\u62A5\u65B9\u5F0F\u3002",
    "for.example.describe.only.abnormal.findings": "\u4F8B\u5982\u4EC5\u8BE6\u7EC6\u5217\u51FA\u5F02\u5E38\u9879\u3002",
    "use.generate.inspection.rules.above.to": "\u70B9\u51FB\u4E0A\u65B9\u81EA\u52A8\u751F\u6210\u5DE1\u67E5\u89C4\u5219\uFF0C\u65E0\u9700\u624B\u52A8\u64B0\u5199\u3002",
    "scan.paths": "\u626B\u63CF\u8DEF\u5F84",
    "absolute.paths.separated.by.commas": "\u7EDD\u5BF9\u8DEF\u5F84\uFF0C\u591A\u4E2A\u8DEF\u5F84\u7528\u9017\u53F7\u5206\u9694",
    "look.back.days": "\u6700\u8FD1\u591A\u5C11\u5929",
    "look.back.hours": "\u56DE\u6EAF\u5C0F\u65F6\u6570",
    frequency: "\u8FD0\u884C\u9891\u7387",
    "weekly.2": "\u6BCF\u5468",
    "fixed.interval": "\u56FA\u5B9A\u95F4\u9694",
    "cron.expression": "Cron \u8868\u8FBE\u5F0F",
    "interval.minutes": "\u95F4\u9694\uFF08\u5206\u949F\uFF09",
    "five.field.cron": "\u4E94\u6BB5 Cron",
    "run.time": "\u8FD0\u884C\u65F6\u95F4",
    "time.zone": "\u65F6\u533A",
    "task.sudo.title": "\u9884\u5148\u6388\u6743 sudo",
    "task.sudo.hint": "\u4EC5\u7528\u4E8E\u6B64\u4EFB\u52A1\u7684\u53EA\u8BFB\u91C7\u96C6\uFF0C\u4ECD\u9075\u5FAA\u670D\u52A1\u5668\u6743\u9650\u8BBE\u7F6E\u3002",
    "external.notifications": "\u5916\u90E8\u901A\u77E5",
    "task.notifications.unconfigured": "\u672A\u914D\u7F6E",
    "task.notifications.only.problems": "\u4EC5\u901A\u77E5\u5F02\u5E38",
    "add.notification.channels.in.the.plugin": "\u8BF7\u5148\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\u6DFB\u52A0\u901A\u77E5\u6E20\u9053\u3002",
    "notify.only.on.warnings.failures.or": "\u4EC5\u5728\u544A\u8B66\u3001\u5931\u8D25\u6216\u91C7\u96C6\u672A\u5B8C\u6210\u65F6\u901A\u77E5",
    "after.saving.choose.a.report.session": "\u4FDD\u5B58\u540E\uFF0C\u5728\u300C\u4F8B\u884C\u4EFB\u52A1\u300D\u9009\u62E9\u6C47\u62A5\u4F1A\u8BDD\uFF0C\u518D\u8FD0\u884C\u4E00\u6B21\u6216\u542F\u7528\u8C03\u5EA6\u3002",
    "save.task": "\u4FDD\u5B58\u4EFB\u52A1",
    "script.check": "\u811A\u672C\u68C0\u67E5",
    "check.scripts": "\u68C0\u67E5\u811A\u672C",
    "search.scripts": "\u641C\u7D22\u811A\u672C\u6807\u8BC6\u3001\u6807\u9898\u6216\u7528\u9014",
    "new.script": "\u65B0\u5EFA\u811A\u672C",
    "edit.script": "\u7F16\u8F91\u811A\u672C",
    "scripts.note": "\u7531\u4F60\u5BA1\u9605\u4FDD\u5B58\u7684 shell \u811A\u672C\uFF0C\u6309 WispOps \u5B9A\u65F6\u5668\u5728\u5173\u8054\u670D\u52A1\u5668\u4E0A\u8FD0\u884C\uFF0C\u4EE5\u9000\u51FA\u7801\u5224\u5B9A\u7ED3\u679C\uFF1A\u6B63\u5E38\u8FD0\u884C\u4E0D\u6D88\u8017\u6A21\u578B token\u3002\u5148\u4FDD\u5B58\u5E76\u5728\u670D\u52A1\u5668\u4E0A\u6D4B\u8BD5\uFF0C\u518D\u5173\u8054\u670D\u52A1\u5668\u5E76\u9009\u62E9\u6C47\u62A5\u65B9\u5F0F\u3002",
    "scripts.empty": "\u8FD8\u6CA1\u6709\u68C0\u67E5\u811A\u672C",
    "scripts.empty.hint": "\u53EF\u4EE5\u5728\u8FD9\u91CC\u7F16\u5199\uFF0C\u4E5F\u53EF\u4EE5\u5728\u5BF9\u8BDD\u4E2D\u8BA9 agent \u8D77\u8349\uFF1B\u8349\u7A3F\u4F1A\u51FA\u73B0\u5728\u4E0A\u65B9\u7B49\u5F85\u5BA1\u6838\u3002",
    "no.matching.scripts": "\u6CA1\u6709\u5339\u914D\u7684\u811A\u672C",
    "script.no.description": "\u6682\u65E0\u8BF4\u660E",
    "script.label": "\u811A\u672C\uFF1A",
    "script.content": "\u811A\u672C\u5185\u5BB9",
    "script.id": "\u811A\u672C\u6807\u8BC6",
    "script.id.hint": "\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u70B9\u3001\u8FDE\u5B57\u7B26\u6216\u4E0B\u5212\u7EBF\uFF0C\u5982 gpu-idle",
    "script.title": "\u6807\u9898",
    "script.description.hint": "\u68C0\u67E5\u4EC0\u4E48\u3001\u4F55\u65F6\u544A\u8B66\uFF1B\u663E\u793A\u5728\u5361\u7247\u4E0A\u5E76\u63D0\u4F9B\u7ED9 agent\u3002",
    "script.contract.hint": "POSIX sh\uFF0C\u901A\u8FC7 stdin \u53D1\u9001\u5230\u6BCF\u53F0\u5173\u8054\u670D\u52A1\u5668\u5E76\u4EE5 sh -s \u6267\u884C\u3002\u8BF7\u4FDD\u6301\u53EA\u8BFB\u4E14\u6709\u754C\u3002",
    "script.contract.title": "\u8F93\u51FA\u5951\u7EA6",
    "script.contract.exit": "\u9000\u51FA\u7801 0 \u6B63\u5E38\u30011 \u8B66\u544A\u30012 \u4E25\u91CD\uFF1B\u5176\u4ED6\u9000\u51FA\u7801\u89C6\u4E3A\u811A\u672C\u672C\u8EAB\u5931\u8D25\u3002",
    "script.contract.summary": "stdout \u7B2C\u4E00\u884C\u975E\u7A7A\u5185\u5BB9\u662F\u4E00\u53E5\u8BDD\u6458\u8981\uFF0C\u7528\u4E8E\u901A\u77E5\u5E76\u63D0\u4F9B\u7ED9 agent\uFF1B\u4E4B\u540E\u7684\u5185\u5BB9\u662F\u8BC1\u636E\u3002",
    "script.contract.metrics": '\u53EF\u9009\u4E00\u884C WISPOPS-JSON: {"key": number} \u968F\u8FD0\u884C\u8BB0\u5F55\u6307\u6807\u3002',
    "script.contract.trust": "\u5728\u8FD9\u91CC\u4FDD\u5B58\u5373\u662F\u6388\u6743\uFF1A\u811A\u672C\u4E0D\u518D\u9010\u884C\u505A\u98CE\u9669\u5206\u7C7B\uFF0C\u53EA\u6709\u90E8\u7F72\u7EA7 deny \u89C4\u5219\u4ECD\u7136\u751F\u6548\u3002agent \u53EA\u80FD\u63D0\u4EA4\u8349\u7A3F\u3002",
    "script.timeout": "\u8D85\u65F6\uFF08\u79D2\uFF09",
    "script.timeout.hint": "\u6309\u670D\u52A1\u5668\u8BA1\u7B97\uFF1B\u8D85\u65F6\u7684\u8FD0\u884C\u8BA1\u4E3A\u5931\u8D25\u3002",
    "script.timeout.summary": "\u8D85\u65F6 {p0} \u79D2",
    "script.test.on": "\u5728\u670D\u52A1\u5668\u4E0A\u6D4B\u8BD5",
    "script.test": "\u8FD0\u884C\u6D4B\u8BD5",
    "script.testing": "\u8FD0\u884C\u4E2D\u2026",
    "script.test.failed": "\u6D4B\u8BD5\u5931\u8D25",
    "script.exit": "\u9000\u51FA\u7801 {p0}",
    "script.save": "\u4FDD\u5B58\u811A\u672C",
    "script.form.note": "\u811A\u672C\u4F1A\u5728\u6BCF\u53F0\u5173\u8054\u670D\u52A1\u5668\u4E0A\u65E0\u4EBA\u503C\u5B88\u8FD0\u884C\u3002\u8BF7\u5148\u5728\u8FD9\u91CC\u6D4B\u8BD5\uFF1A\u6D4B\u8BD5\u4EE5\u53EA\u8BFB\u3001\u65E0 sudo \u65B9\u5F0F\u8FD0\u884C\uFF0C\u5E76\u5199\u5165\u5BA1\u8BA1\u65E5\u5FD7\u3002",
    "script.view.content": "\u67E5\u770B\u811A\u672C\u5185\u5BB9",
    "script.requirements.hint": "\u4EC5\u5728 agent \u5199\u62A5\u544A\u65F6\u8BFB\u53D6\uFF1A\u5173\u6CE8\u4EC0\u4E48\u3001\u5982\u4F55\u6C47\u62A5\u3002",
    "delete.script.effect": "\u4F7F\u7528\u5B83\u7684\u4EFB\u52A1\u9700\u8981\u5148\u5220\u9664\u6216\u4FEE\u6539\u3002",
    "report.mode": "\u6C47\u62A5\u65B9\u5F0F",
    "report.mode.always": "\u6BCF\u6B21\u8FD0\u884C\u90FD\u7531 agent \u6C47\u62A5",
    "report.mode.always.hint": "DSH \u8C03\u5EA6\u5230\u70B9\u5524\u9192 agent\uFF0C\u7531\u5B83\u91C7\u96C6\u6570\u636E\u5E76\u5199\u62A5\u544A\u3002\u6BCF\u6B21\u90FD\u6D88\u8017 token\u3002",
    "report.mode.problems": "\u4EC5\u5F02\u5E38\u65F6\u7531 agent \u6C47\u62A5",
    "report.mode.problems.hint": "WispOps \u7528\u81EA\u5DF1\u7684\u5B9A\u65F6\u5668\u8FD0\u884C\u4EFB\u52A1\u3001\u8BB0\u5F55\u5E76\u901A\u77E5\u3002\u53EA\u6709\u51FA\u73B0\u8B66\u544A\u3001\u5931\u8D25\u6216\u4E0D\u53EF\u8FBE\u7684\u8FD0\u884C\u624D\u4EA4\u7ED9 agent\uFF0C\u5B83\u76F4\u63A5\u8BFB\u53D6\u5DF2\u4FDD\u5B58\u7684\u8BC1\u636E\u3002",
    "report.mode.never": "\u53EA\u8BB0\u5F55\u548C\u901A\u77E5",
    "report.mode.never.hint": "WispOps \u6309\u5B9A\u65F6\u5668\u8FD0\u884C\u4EFB\u52A1\uFF0C\u7ED3\u679C\u8FDB\u5165\u5386\u53F2\u548C\u901A\u77E5\u6E20\u9053\u3002agent \u53EA\u5728\u88AB\u95EE\u5230\u65F6\u67E5\u770B\u3002",
    "report.mode.custom.note": "\u6CA1\u6709\u53EA\u8BFB\u547D\u4EE4\u7684\u81EA\u5B9A\u4E49\u4EFB\u52A1\u79BB\u5F00 agent \u5C31\u6CA1\u6709\u53EF\u8FD0\u884C\u7684\u5185\u5BB9\uFF0C\u56E0\u6B64\u53EA\u80FD\u7531 agent \u6C47\u62A5\u3002",
    "report.mode.cron.note": "WispOps \u5B9A\u65F6\u5668\u652F\u6301\u6BCF\u5929\u3001\u6BCF\u5468\u6216\u56FA\u5B9A\u95F4\u9694\uFF1B\u8BF7\u6539\u7528\u8FD9\u4E9B\uFF0C\u6216\u6539\u4E3A\u6BCF\u6B21\u7531 agent \u6C47\u62A5\u3002",
    "timer.issue": "\u5B9A\u65F6\u5668",
    "timer.unscheduled": "\u672A\u6392\u671F",
    "timer.no.reports": "\u53EA\u8BB0\u5F55\u548C\u901A\u77E5\uFF0C\u4E0D\u7ECF\u8FC7 agent",
    "escalate.to": "\u5F02\u5E38\u65F6\u901A\u77E5 {p0}",
    "timer.enabled": "\u5B9A\u65F6\u5668\u5DF2\u542F\u7528",
    "enable.timer": "\u542F\u7528\u5B9A\u65F6\u8FD0\u884C",
    "task.steps": "\u4EFB\u52A1\u6B65\u9AA4",
    "task.step.info": "\u4EFB\u52A1\u4FE1\u606F",
    "task.step.servers": "\u5173\u8054\u670D\u52A1\u5668",
    "task.step.next": "\u4E0B\u4E00\u6B65",
    "task.step.back": "\u4E0A\u4E00\u6B65",
    "task.step.progress": "\u7B2C {p0} \u6B65\uFF0C\u5171 {p1} \u6B65",
    "task.step.servers.hint": "\u9009\u62E9\u8FD0\u884C\u8BE5\u4EFB\u52A1\u7684\u670D\u52A1\u5668\uFF0C\u89C4\u5219\u4E0E\u8C03\u5EA6\u5DF2\u5728\u4E0A\u4E00\u6B65\u8BBE\u7F6E\u597D\u3002",
    "task.step.servers.first.hint": "\u5148\u9009\u62E9\u670D\u52A1\u5668\uFF0C\u4E0B\u4E00\u6B65\u5C06\u57FA\u4E8E\u5B83\u4EEC\u751F\u6210\u5DE1\u68C0\u89C4\u5219\u3002",
    "task.step.summary": "\u5F85\u5173\u8054\u4EFB\u52A1",
    "credential.name": "\u51ED\u636E\u540D\u79F0",
    "credential.username": "\u6240\u5C5E\u7528\u6237\u540D\uFF08\u53EF\u9009\uFF09",
    "new.password.leave.blank.to.keep": "\u65B0\u5BC6\u7801\uFF08\u7559\u7A7A\u5219\u4FDD\u7559\u539F\u5BC6\u7801\uFF09",
    password: "\u5BC6\u7801",
    notes: "\u5907\u6CE8",
    "allow.operations.tools.and.recurring.tasks": "\u5141\u8BB8\u8FD0\u7EF4\u5DE5\u5177\u53CA\u4F8B\u884C\u4EFB\u52A1\u4F7F\u7528\u6B64\u51ED\u636E",
    "connections.use.the.server.s.username": "sudo \u4ECD\u9075\u5FAA\u670D\u52A1\u5668\u53CA\u4EFB\u52A1\u6388\u6743\u3002",
    "encrypting.and.saving": "\u52A0\u5BC6\u4FDD\u5B58\u4E2D\u2026",
    "save.a.template.then.link.one": "\u4FDD\u5B58\u5230\u4EFB\u52A1\u5E93\u540E\uFF0C\u53EF\u4EE5\u968F\u65F6\u5173\u8054\u4E00\u53F0\u6216\u591A\u53F0\u670D\u52A1\u5668\u3002\u6B64\u5904\u4E0D\u542F\u7528\u8C03\u5EA6\u3002",
    "template.id": "\u6A21\u677F\u6807\u8BC6",
    "e.g.daily.health": "\u5982 daily-health",
    "template.title": "\u6A21\u677F\u6807\u9898",
    copy: "\uFF08\u526F\u672C\uFF09",
    category: "\u5206\u7C7B",
    "custom.2": "\u81EA\u5B9A\u4E49",
    "core.operations": "\u57FA\u7840\u8FD0\u7EF4",
    security: "\u5B89\u5168",
    "application.services": "\u5E94\u7528\u670D\u52A1",
    "data.management": "\u6570\u636E\u7BA1\u7406",
    "compute.cluster": "\u8BA1\u7B97\u96C6\u7FA4",
    "short.description": "\u7B80\u8981\u8BF4\u660E",
    "you.can.copy.a.preset.and": "\u4E5F\u53EF\u5148\u590D\u5236\u9884\u8BBE\uFF0C\u518D\u8C03\u6574\u68C0\u67E5\u9879\u3002",
    "inspect.server.health.report.abnormal.metrics": "\u68C0\u67E5\u670D\u52A1\u5668\u5065\u5EB7\u6570\u636E\uFF0C\u62A5\u544A\u5F02\u5E38\u6307\u6807\u3001\u4E0E\u4E0A\u6B21\u76F8\u6BD4\u7684\u53D8\u5316\u53CA\u5EFA\u8BAE\uFF1B\u8D44\u6599\u4E0D\u8DB3\u65F6\u660E\u786E\u8BF4\u660E\u3002\u53EA\u91C7\u96C6\u548C\u6C47\u62A5\uFF0C\u4E0D\u4FEE\u6539\u670D\u52A1\u5668\u3002",
    "parameters.supplied.when.linking.servers": "\u5173\u8054\u670D\u52A1\u5668\u65F6\u586B\u5199\u53C2\u6570\uFF1A",
    "keep.the.required.placeholders.when.editing": "\u3002\u4FEE\u6539\u89C4\u5219\u65F6\u4FDD\u7559\u6240\u9700\u5360\u4F4D\u7B26\u3002",
    "default.scan.paths": "\u9ED8\u8BA4\u626B\u63CF\u8DEF\u5F84",
    "absolute.paths.separated.by.commas.2": "\u7EDD\u5BF9\u8DEF\u5F84\uFF0C\u591A\u4E2A\u7528\u9017\u53F7\u5206\u9694",
    "default.look.back.days": "\u9ED8\u8BA4\u56DE\u6EAF\u5929\u6570",
    "default.look.back.hours": "\u9ED8\u8BA4\u56DE\u6EAF\u5C0F\u65F6\u6570",
    "suggested.daily.run.time": "\u5EFA\u8BAE\u6BCF\u65E5\u8FD0\u884C\u65F6\u95F4",
    "choose.weekly.interval.or.cron.schedules": "\u5173\u8054\u65F6\u53EF\u6539\u6210\u6BCF\u5468\u3001\u56FA\u5B9A\u95F4\u9694\u6216 Cron\u3002\u4FEE\u6539\u6A21\u677F\u4E0D\u5F71\u54CD\u5DF2\u5173\u8054\u4EFB\u52A1\u3002",
    "save.to.task.library": "\u4FDD\u5B58\u5230\u4EFB\u52A1\u5E93",
    "encrypted.snapshot.uploaded": "\u5DF2\u4E0A\u4F20\u52A0\u5BC6\u5FEB\u7167\uFF1A{p0}",
    "imported.schedules.remain.disabled.local.encrypted": "\u5DF2\u5BFC\u5165\uFF0C\u8C03\u5EA6\u672A\u542F\u7528\u3002\u672C\u5730\u52A0\u5BC6\u5907\u4EFD\uFF1A{p0}",
    "sync.failed.please.retry": "\u540C\u6B65\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    "sync.subtitle": "\u901A\u8FC7 WebDAV \u52A0\u5BC6\u5FEB\u7167\uFF0C\u5907\u4EFD\u548C\u6062\u590D\u8BBE\u5907\u914D\u7F6E\u3002",
    "sync.encrypted": "\u7AEF\u5230\u7AEF\u52A0\u5BC6",
    "sync.connection.title": "WebDAV \u8FDE\u63A5",
    "sync.connection.hint": "\u4F7F\u7528\u575A\u679C\u4E91\u6216 WebDAV \u670D\u52A1\u7684\u5E94\u7528\u5BC6\u7801\u8FDE\u63A5\u3002",
    "sync.encryption.title": "\u5FEB\u7167\u52A0\u5BC6",
    "sync.encryption.hint": "\u4E24\u53F0\u8BBE\u5907\u4F7F\u7528\u76F8\u540C\u7684\u72EC\u7ACB\u540C\u6B65\u53E3\u4EE4\u3002",
    "sync.passphrase.hint": "\u53E3\u4EE4\u4E0D\u4FDD\u5B58\u3001\u4E0D\u4E0A\u4F20\uFF0C\u8BF7\u59A5\u5584\u4FDD\u7BA1\uFF1B\u9057\u5931\u540E\u65E0\u6CD5\u6062\u590D\u52A0\u5BC6\u5FEB\u7167\u3002",
    "sync.include.keys": "\u5305\u542B SSH \u79C1\u94A5",
    "sync.upload.title": "\u5907\u4EFD\u5F53\u524D\u8BBE\u5907",
    "sync.upload.hint": "\u751F\u6210\u52A0\u5BC6\u5FEB\u7167\uFF0C\u5E76\u4E0A\u4F20\u81F3 WebDAV \u5B58\u50A8\u3002",
    "sync.download.title": "\u6062\u590D\u5230\u5F53\u524D\u8BBE\u5907",
    "sync.download.hint": "\u8BFB\u53D6\u4E91\u7AEF\u7248\u672C\uFF0C\u9884\u89C8\u5185\u5BB9\u540E\u518D\u786E\u8BA4\u5BFC\u5165\u3002",
    "sync.cloud.title": "\u4E91\u7AEF\u5FEB\u7167",
    "sync.cloud.hint": "\u9009\u62E9\u4E00\u4E2A\u7248\u672C\uFF0C\u89E3\u5BC6\u540E\u6838\u5BF9\u5C06\u5BFC\u5165\u7684\u5185\u5BB9\u3002",
    "sync.cloud.empty": "\u8FD8\u6CA1\u6709\u4E91\u7AEF\u5FEB\u7167\uFF0C\u8BF7\u5148\u5728\u6765\u6E90\u8BBE\u5907\u4E0A\u4F20\u4E00\u4EFD\u5FEB\u7167\u3002",
    "sync.preview.counts": "\u672C\u673A\u6570\u91CF \u2192 \u5BFC\u5165\u540E\u6570\u91CF",
    "encrypted.device.sync.webdav": "\u52A0\u5BC6\u8BBE\u5907\u540C\u6B65 \xB7 WebDAV",
    "connect.with.a.nutstore.application.password": "\u4F7F\u7528\u575A\u679C\u4E91\u5E94\u7528\u5BC6\u7801\u8FDE\u63A5\u3002\u540C\u6B65\u53E3\u4EE4\u7528\u4E8E\u7AEF\u5230\u7AEF\u52A0\u5BC6\uFF0C\u4E24\u53F0\u8BBE\u5907\u9700\u8F93\u5165\u76F8\u540C\u53E3\u4EE4\uFF1B\u53E3\u4EE4\u4E0D\u4FDD\u5B58\u3001\u4E0D\u4E0A\u4F20\uFF0C\u9057\u5931\u540E\u65E0\u6CD5\u6062\u590D\u5FEB\u7167\u3002",
    "webdav.folder.url": "WebDAV \u6587\u4EF6\u5939\u5730\u5740",
    "nutstore.account.webdav.username": "\u575A\u679C\u4E91\u8D26\u53F7 / WebDAV \u7528\u6237\u540D",
    "webdav.application.password": "WebDAV \u5E94\u7528\u5BC6\u7801",
    "independent.sync.passphrase.at.least.12": "\u72EC\u7ACB\u540C\u6B65\u53E3\u4EE4\uFF08\u81F3\u5C11 12 \u4E2A\u5B57\u7B26\uFF09",
    "include.ssh.private.keys.referenced.by": "\u5728\u4E0A\u4F20\u7684\u52A0\u5BC6\u5FEB\u7167\u4E2D\u5305\u542B\u9762\u677F\u670D\u52A1\u5668\u5F15\u7528\u7684 SSH \u79C1\u94A5",
    "sync.includes.the.local.vault.panel": "\u540C\u6B65\u72EC\u7ACB\u5BC6\u7801\u5E93\u3001\u9762\u677F\u670D\u52A1\u5668\u53CA\u51ED\u636E\u5173\u8054\u3001\u5DF2\u79FB\u9664\u7684\u670D\u52A1\u5668\u540D\u79F0\u3001\u4EFB\u52A1\u548C\u81EA\u5EFA\u6A21\u677F\uFF1BYAML\u3001\u4F1A\u8BDD\u3001\u4E34\u65F6\u6388\u6743\u548C\u5B9E\u9645\u8C03\u5EA6\u7559\u5728\u5404\u8BBE\u5907\u3002",
    "upload.a.new.encrypted.snapshot": "\u4E0A\u4F20\u65B0\u7684\u52A0\u5BC6\u5FEB\u7167",
    "list.cloud.snapshots": "\u8BFB\u53D6\u4E91\u7AEF\u5FEB\u7167",
    "choose.a.cloud.version": "\u9009\u62E9\u4E91\u7AEF\u7248\u672C",
    "decrypt.and.preview.import": "\u89E3\u5BC6\u5E76\u9884\u89C8\u5BFC\u5165",
    "import.preview": "\u5BFC\u5165\u9884\u89C8",
    "import.replaces.this.device.s.panel": "\u5BFC\u5165\u4F1A\u66FF\u6362\u672C\u673A\u7684\u9762\u677F\u914D\u7F6E\u548C\u6574\u4E2A\u72EC\u7ACB\u5BC6\u7801\u5E93\u3002\u8BF7\u5148\u505C\u7528\u672C\u673A\u8C03\u5EA6\uFF1B\u539F\u6570\u636E\u4F1A\u4FDD\u7559\u4E3A\u672C\u5730\u52A0\u5BC6\u5907\u4EFD\u3002",
    "credentials.2": "\u51ED\u636E",
    "tasks.2": "\u4EFB\u52A1",
    templates: "\u6A21\u677F",
    "ssh.private.keys": "SSH \u79C1\u94A5",
    "credentials.3": "\u51ED\u636E\uFF1A",
    "credentials.with.these.names.will.be": "\u5C06\u66FF\u6362\u540C\u540D\u51ED\u636E\uFF1A",
    "confirm.replacement.of.local.data": "\u786E\u8BA4\u66FF\u6362\u672C\u673A\u6570\u636E",
    syncing: "\u6B63\u5728\u540C\u6B65\u2026",
    "connection.failed.please.retry": "\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    "operation.failed.please.retry": "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    "manage.servers.credentials.and.recurring.tasks.2": "\u7BA1\u7406\u670D\u52A1\u5668\u3001\u5BC6\u7801\u5E93\u548C\u4F8B\u884C\u4EFB\u52A1",
    "updates.title": "\u7248\u672C\u66F4\u65B0",
    "updates.subtitle": "\u67E5\u770B\u7A33\u5B9A\u7248\u672C\uFF0C\u7BA1\u7406\u66F4\u65B0\u504F\u597D\u3002",
    "updates.check": "\u68C0\u67E5\u66F4\u65B0",
    "updates.install": "\u5B89\u88C5\u5DF2\u6838\u9A8C\u7684\u66F4\u65B0",
    "updates.automatic": "\u81EA\u52A8\u5B89\u88C5\u7A33\u5B9A\u7248\u672C",
    "updates.automatic.hint": "Harness \u8FD0\u884C\u671F\u95F4\u6BCF 6 \u5C0F\u65F6\u68C0\u67E5\u4E00\u6B21\uFF0C\u5E76\u5B89\u88C5\u53EF\u7528\u66F4\u65B0\u3002",
    "updates.version.pending": "\u6682\u65E0\u7248\u672C\u4FE1\u606F",
    "updates.loading": "\u6B63\u5728\u8BFB\u53D6\u66F4\u65B0\u72B6\u6001\u2026",
    "updates.loading.hint": "\u6B63\u5728\u83B7\u53D6\u5F53\u524D\u7248\u672C\u548C\u66F4\u65B0\u504F\u597D\u3002",
    "updates.unavailable": "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u66F4\u65B0\u72B6\u6001",
    "updates.checking": "\u68C0\u67E5\u4E2D\u2026",
    "updates.installing": "\u5B89\u88C5\u4E2D\u2026",
    "updates.hint.unchecked": "\u68C0\u67E5\u662F\u5426\u6709\u9002\u7528\u4E8E\u5F53\u524D\u5B89\u88C5\u7684\u7A33\u5B9A\u7248\u672C\u3002",
    "updates.hint.no-release": "\u53EF\u4EE5\u7EE7\u7EED\u4F7F\u7528\u5F53\u524D\u7248\u672C\uFF0C\u7A0D\u540E\u518D\u6765\u68C0\u67E5\u3002",
    "updates.hint.available": "\u7248\u672C\u4FE1\u606F\u5DF2\u6838\u9A8C\uFF0C\u53EF\u4EE5\u5F00\u59CB\u5B89\u88C5\u66F4\u65B0\u3002",
    "updates.hint.current": "\u5F53\u524D\u5DF2\u8FD0\u884C\u6700\u65B0\u7A33\u5B9A\u7248\u672C\uFF0C\u65E0\u9700\u64CD\u4F5C\u3002",
    "updates.hint.restart": "\u8BF7\u5728\u65B9\u4FBF\u65F6\u91CD\u542F Harness\uFF0C\u4EE5\u52A0\u8F7D\u65B0\u7248\u672C\u3002",
    "updates.hint.failed": "\u8BF7\u91CD\u65B0\u68C0\u67E5\u66F4\u65B0\uFF0C\u5F53\u524D\u8FD0\u884C\u7248\u672C\u4ECD\u53EF\u4F7F\u7528\u3002",
    "updates.explanation": "\u901A\u8FC7 Harness \u63D2\u4EF6\u7BA1\u7406\u5668\u5B89\u88C5\uFF0C\u5B8C\u6210\u540E\u8BF7\u91CD\u542F Harness\u3002\u672C\u5730\u5F00\u53D1\u94FE\u63A5\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002",
    "updates.current": "\u5F53\u524D\u8FD0\u884C\u7248\u672C",
    "updates.latest": "\u6700\u65B0\u7A33\u5B9A\u7248\u672C",
    "updates.unchecked": "\u5C1A\u672A\u68C0\u67E5",
    "updates.no-release": "\u5C1A\u672A\u53D1\u5E03 GitHub \u7A33\u5B9A\u7248\u672C",
    "updates.available": "\u6709\u53EF\u7528\u66F4\u65B0",
    "updates.restart-required": "\u5DF2\u5B89\u88C5\uFF0C\u8BF7\u91CD\u542F Harness \u751F\u6548",
    "updates.failed": "\u68C0\u67E5\u6216\u5B89\u88C5\u5931\u8D25",
    "updates.reinstall": "\u82E5\u56E0 HMR \u65E0\u6CD5\u66F4\u65B0\uFF0C\u4E5F\u53EF\u5728 Harness\u300C\u63D2\u4EF6\u300D\u9875\u5378\u8F7D WispOps\uFF0C\u518D\u70B9\u51FB\u300C\uFF0B \u6DFB\u52A0\u63D2\u4EF6\u300D\uFF0C\u8F93\u5165\u4EE5\u4E0B\u5730\u5740\u91CD\u65B0\u5B89\u88C5\uFF0C\u5B8C\u6210\u540E\u91CD\u542F Harness\uFF1A",
    "updates.up-to-date": "\u5DF2\u662F\u6700\u65B0\u7248\u672C",
    "updates.working": "\u5904\u7406\u4E2D\u2026",
    "updates.release": "\u7248\u672C\u8BF4\u660E",
    "updates.error": "\u66F4\u65B0\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    "ssh.identity.path": "SSH \u79C1\u94A5\u8DEF\u5F84\uFF08\u53EF\u9009\uFF09",
    "ssh.identity.hint": "\u586B\u5199\u672C\u673A\u8DEF\u5F84\uFF0C\u5982 ~/.ssh/id_ed25519\uFF1B\u52A0\u5BC6\u540C\u6B65\u53EA\u5305\u542B\u660E\u786E\u6307\u5B9A\u7684\u79C1\u94A5\u3002",
    "sync.automation.credentials": "\u5141\u8BB8\u81EA\u52A8\u5316\u4F7F\u7528\u7684\u51ED\u636E\uFF1A{p0}",
    "sync.sudo.task": "\u5141\u8BB8 sudo \u7684\u4EFB\u52A1\uFF1A{p0} \u2192 {p1}",
    "sync.bindings.include.config.hosts": "\u51ED\u636E\u5173\u8054\u4E5F\u4F1A\u5E94\u7528\u5230 YAML \u6216 WispTerm \u4E2D\u7684\u540C\u540D\u670D\u52A1\u5668\u3002",
    "sync.binding": "{p0} \xB7 {p1} \xB7 \u767B\u5F55\uFF1A{p2} \xB7 sudo\uFF1A{p3}",
    "fleet.overview": "\u673A\u7FA4\u603B\u89C8",
    "fleet.trends": "\u5DE1\u68C0\u8D8B\u52BF",
    "fleet.summary.ok": "\u6B63\u5E38",
    "fleet.summary.warn": "\u8B66\u544A",
    "fleet.summary.crit": "\u4E25\u91CD",
    "fleet.summary.unreachable": "\u4E0D\u53EF\u8FBE",
    "fleet.summary.never": "\u672A\u5DE1\u68C0",
    "fleet.range": "\u663E\u793A\u6700\u8FD1 {p0} \u6B21\u5DE1\u68C0",
    "fleet.generated": "\u6570\u636E\u65F6\u95F4 {p0}\u3002",
    "fleet.matrix": "\u5DE1\u68C0\u72B6\u6001\u77E9\u9635",
    "fleet.matrix.hint": "\u6BCF\u4E2A\u65B9\u5757\u662F\u4E00\u6B21\u5DF2\u4FDD\u5B58\u7684\u5DE1\u68C0\uFF0C\u5DE6\u4FA7\u6700\u65E9\u3002\u70B9\u51FB\u65B9\u5757\u67E5\u770B\u5F53\u6B21\u53D1\u73B0\uFF0C\u70B9\u51FB\u884C\u67E5\u770B\u8D8B\u52BF\u3002\u201C\u7ACB\u5373\u5DE1\u68C0\u201D\u4EE5\u53EA\u8BFB\u65B9\u5F0F\u8FDE\u63A5\uFF08\u4E0D\u4F7F\u7528 sudo\uFF09\u5E76\u4FDD\u5B58\u4E00\u6B21\u5DE1\u68C0\u3002",
    "fleet.open.server": "\u6253\u5F00\u670D\u52A1\u5668\u8BE6\u60C5",
    "fleet.no.history": "\u5C1A\u65E0\u5DE1\u68C0\u8BB0\u5F55\u3002\u70B9\u51FB\u67D0\u53F0\u670D\u52A1\u5668\u7684\u201C\u7ACB\u5373\u5DE1\u68C0\u201D\uFF0C\u6216\u5728\u4F1A\u8BDD\u4E2D\u8FD0\u884C ops_inspect\u3001\u542F\u7528\u5065\u5EB7\u5DE1\u68C0\u4EFB\u52A1\u3002",
    "fleet.disk": "\u78C1\u76D8 {p0}",
    "fleet.memory": "\u53EF\u7528\u5185\u5B58",
    "fleet.cpu": "CPU \u4F7F\u7528\u7387",
    "fleet.used": "\u5DF2\u7528 {p0}%",
    "fleet.available": "\u53EF\u7528 {p0}%",
    "fleet.delta": "\u8F83 {p1} \u53D8\u5316 {p0} \u4E2A\u767E\u5206\u70B9",
    "fleet.one.point": "\u81F3\u5C11\u4E24\u6B21\u6210\u529F\u5DE1\u68C0\u624D\u80FD\u663E\u793A\u8D8B\u52BF\u3002",
    "fleet.findings": "\u53D1\u73B0",
    "fleet.no.findings": "\u672C\u6B21\u5DE1\u68C0\u6CA1\u6709\u8B66\u544A\u3002",
    "fleet.unreachable.row": "\u672C\u6B21\u672A\u80FD\u8FDE\u63A5\u4E3B\u673A\u3002",
    "fleet.inspection.at": "\u5DE1\u68C0\u65F6\u95F4 {p0}",
    "fleet.short.disk": "\u78C1\u76D8",
    "fleet.short.mem": "\u5185\u5B58",
    "fleet.error": "\u8BFB\u53D6\u5DE1\u68C0\u5386\u53F2\u5931\u8D25\u3002",
    "fleet.loading": "\u6B63\u5728\u8BFB\u53D6\u5DE1\u68C0\u5386\u53F2\u2026",
    "credential.username.hint": "SSH \u767B\u5F55\u4F7F\u7528\u670D\u52A1\u5668\u914D\u7F6E\u7684\u7528\u6237\u3002\u7528\u4E8E sudo \u65F6\uFF0C\u82E5\u6B64\u7528\u6237\u540D\u4E0D\u540C\uFF0C\u5C06\u4F7F\u7528\u672C\u51ED\u636E\u5355\u72EC SSH \u767B\u5F55\u5E76\u63D0\u6743\uFF1B\u7559\u7A7A\u5219\u6CBF\u7528\u767B\u5F55\u8D26\u53F7\u3002",
    "sudo.account.connection": "sudo \u8D26\u53F7\uFF1A{p0}\u3002\u82E5\u4E0E SSH \u767B\u5F55\u8D26\u53F7\u4E0D\u540C\uFF0C\u4F1A\u4F7F\u7528\u6B64\u51ED\u636E\u5355\u72EC\u767B\u5F55\uFF0C\u518D\u7528\u8BE5\u8D26\u53F7\u7684\u5BC6\u7801\u9A8C\u8BC1 sudo\u3002",
    "sudo.account.current.login": "sudo \u4F7F\u7528\u670D\u52A1\u5668\u7684 SSH \u767B\u5F55\u8D26\u53F7\uFF0C\u6240\u9009\u51ED\u636E\u4EC5\u7528\u4E8E\u9A8C\u8BC1 sudo \u5BC6\u7801\u3002",
    "sudo.account.login.failed": "sudo \u6D4B\u8BD5\u7684 SSH \u767B\u5F55\u5931\u8D25\u3002\u8BF7\u68C0\u67E5 sudo \u51ED\u636E\u7684\u7528\u6237\u540D\u3001\u5BC6\u7801\uFF0C\u4EE5\u53CA\u8BE5\u8D26\u53F7\u662F\u5426\u5141\u8BB8 SSH \u767B\u5F55\u3002",
    "show.password": "\u663E\u793A",
    "hide.password": "\u9690\u85CF",
    "encrypted.on.save.never.shown.again": "\u4FDD\u5B58\u540E\u52A0\u5BC6\u5B58\u50A8\uFF0C\u4E0D\u4F1A\u518D\u663E\u793A\u5728\u9875\u9762\u6216\u53D1\u9001\u7ED9\u6A21\u578B\u3002",
    "the.password.is.stored.in.the": "\u5BC6\u7801\u53EA\u4FDD\u5B58\u5728\u5BC6\u7801\u5E93\uFF1B\u5230\u670D\u52A1\u5668\u9875\u7684 SSH \u767B\u5F55\u6216 sudo \u884C\u4E3A\u5404\u53F0\u670D\u52A1\u5668\u5206\u522B\u5173\u8054\u3002",
    "after.saving.this.credential.will.be": "\u4FDD\u5B58\u540E\u5C06\u5173\u8054\u5230 {p0} \u7684{p1}\u3002",
    "encrypt.and.save": "\u52A0\u5BC6\u4FDD\u5B58",
    "encrypt.save.and.link": "\u52A0\u5BC6\u4FDD\u5B58\u5E76\u5173\u8054",
    "link.credential": "\u5173\u8054",
    "change.credential": "\u66F4\u6362",
    "test.credential": "\u6D4B\u8BD5",
    "test.credential.for": "\u6D4B\u8BD5 {p0} \u7684{p1}",
    "link.credential.for": "\u4E3A {p0} \u5173\u8054{p1}\u51ED\u636E",
    "link.role.credential": "{p0} \xB7 {p1}\u51ED\u636E",
    "pick.one.credential.from.the.vault": "\u4ECE\u5BC6\u7801\u5E93\u4E3A\u8FD9\u53F0\u670D\u52A1\u5668\u7684{p0}\u9009\u62E9\u4E00\u6761\u51ED\u636E\u3002\u5BC6\u7801\u5728\u300C\u5BC6\u7801\u5E93\u300D\u9875\u65B0\u589E\u548C\u7F16\u8F91\u3002",
    "use.ssh.keys.no.credential": "SSH \u5BC6\u94A5 / SSH \u914D\u7F6E\uFF08\u4E0D\u5173\u8054\u5BC6\u7801\uFF09",
    "passwordless.sudo.no.credential": "\u514D\u5BC6 sudo\uFF08\u4E0D\u5173\u8054\u5BC6\u7801\uFF09",
    testing: "\u6D4B\u8BD5\u4E2D\u2026",
    "test.login": "\u6D4B\u8BD5 SSH \u767B\u5F55",
    "test.sudo": "\u6D4B\u8BD5 sudo",
    "login.succeeded.as": "\u5DF2\u4EE5 {p0} \u8EAB\u4EFD\u767B\u5F55 {p1}\u3002",
    "sudo.works.as": "{p1} \u7684 sudo \u53EF\u7528\uFF0C\u547D\u4EE4\u5C06\u4EE5 {p0} \u8EAB\u4EFD\u6267\u884C\u3002",
    "ssh.login.failed.check.the.password": "SSH \u767B\u5F55\u5931\u8D25\u3002\u8BF7\u68C0\u67E5\u670D\u52A1\u5668\u914D\u7F6E\u7684\u7528\u6237\u540D\u548C\u8FD9\u6761\u51ED\u636E\u7684\u5BC6\u7801\u3002",
    "sudo.rejected.the.password.or.needs": "sudo \u62D2\u7EDD\u4E86\u8BE5\u5BC6\u7801\u6216\u9700\u8981\u5BC6\u7801\u3002\u8BF7\u68C0\u67E5\u8FD9\u6761\u51ED\u636E\u6216\u670D\u52A1\u5668\u7684 sudo \u89C4\u5219\u3002",
    "the.server.is.unreachable": "\u65E0\u6CD5\u8FDE\u63A5\u5230\u670D\u52A1\u5668\u3002",
    "the.connection.timed.out": "\u8FDE\u63A5\u8D85\u65F6\u3002",
    "logins.are.paused.after.repeated.failures": "\u8BE5\u670D\u52A1\u5668\u56E0\u591A\u6B21\u767B\u5F55\u5931\u8D25\u5DF2\u6682\u505C\u767B\u5F55\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
    "the.test.command.failed": "\u5DF2\u8FDE\u63A5\uFF0C\u4F46\u6D4B\u8BD5\u547D\u4EE4\u6267\u884C\u5931\u8D25\u3002",
    "edit.permissions": "\u7F16\u8F91",
    "set.in.panel": "\u9762\u677F\u8BBE\u7F6E",
    "decided.by.host.group.then.default": "\u6BCF\u9879\u6309 \u4E3B\u673A\u7B56\u7565 > \u5206\u7EC4 > \u63D2\u4EF6\u9ED8\u8BA4 \u88C1\u51B3\uFF1B\u6A21\u578B\u4FA7\u7684 deny \u89C4\u5219\u4ECD\u7136\u751F\u6548\u3002",
    "host.permissions": "{p0} \xB7 \u64CD\u4F5C\u6743\u9650",
    "allow.runs.without.asking.ask": "allow \u76F4\u63A5\u6267\u884C\uFF0Cask \u6BCF\u6B21\u9700\u8981\u4F60\u5BA1\u6279\uFF0Cdeny \u7981\u6B62\u3002\u7EE7\u627F\u503C\u6765\u81EA\u8FD9\u53F0\u670D\u52A1\u5668\u7684 YAML \u7B56\u7565\u3001\u6240\u5C5E\u5206\u7EC4\u548C\u63D2\u4EF6\u9ED8\u8BA4\u503C\u3002",
    "capability.change": "\u4FEE\u6539\u6587\u4EF6\u3001\u914D\u7F6E\u548C\u670D\u52A1",
    "capability.sudo": "\u4F7F\u7528 sudo \u6267\u884C\u547D\u4EE4",
    "capability.destructive": "\u5220\u9664\u6570\u636E\u3001\u91CD\u542F\u7B49\u7834\u574F\u6027\u64CD\u4F5C",
    inherit: "\u7EE7\u627F\uFF08{p0}\uFF09",
    "destructive.allow.warning": "\u8FD9\u53F0\u670D\u52A1\u5668\u4E0A\u7684\u7834\u574F\u6027\u64CD\u4F5C\u5C06\u4E0D\u518D\u5BA1\u6279\u3002\u9664\u975E\u786E\u5B9A\uFF0C\u5426\u5219\u8BF7\u4FDD\u7559 ask\u3002",
    "overrides.apply.to.yaml.hosts.too": "\u9762\u677F\u8BBE\u7F6E\u4FDD\u5B58\u5728 managed.json\uFF0C\u4F1A\u8986\u76D6 YAML \u6216 WispTerm \u4E2D\u540C\u540D\u670D\u52A1\u5668\u7684\u540C\u4E00\u9879\uFF1B\u4E0B\u4E00\u6B21\u8C03\u7528\u5373\u751F\u6548\uFF0C\u5E76\u968F\u8BBE\u5907\u540C\u6B65\u4E00\u8D77\u4F20\u8F93\u3002",
    "save.permissions": "\u4FDD\u5B58\u6743\u9650",
    "fleet.inspect.now": "\u7ACB\u5373\u5DE1\u68C0",
    "fleet.inspecting": "\u5DE1\u68C0\u4E2D\u2026",
    "fleet.inspect.host": "\u7ACB\u5373\u5DE1\u68C0 {p0}",
    "fleet.inspected": "{p0} \u5DE1\u68C0\u5B8C\u6210\uFF1A{p1}\u3002",
    "fleet.inspect.failed": "{p0} \u5DE1\u68C0\u5931\u8D25\uFF1A{p1}",
    "fleet.findings.count": "{p0} \u9879\u53D1\u73B0",
    "manual.only": "\u4EC5\u624B\u52A8\uFF08\u8FD0\u884C\u4E00\u6B21\uFF09",
    "no.run.time.only.run.once": "\u4E0D\u8BBE\u8FD0\u884C\u65F6\u95F4\u3002\u5728\u4EFB\u52A1\u5361\u7247\u70B9\u51FB\u201C\u8FD0\u884C\u4E00\u6B21\u201D\u6216\u7528 /ops-run \u6267\u884C\u3002",
    "run.once": "\u8FD0\u884C\u4E00\u6B21",
    "audit.log": "\u64CD\u4F5C\u5BA1\u8BA1",
    "audit.subtitle": "\u6A21\u578B\u3001\u9762\u677F\u548C\u4F8B\u884C\u4EFB\u52A1\u6267\u884C\u8FC7\u7684\u6BCF\u6761\u8FDC\u7A0B\u547D\u4EE4\u53CA\u5176\u98CE\u9669\u3001\u6388\u6743\u548C\u7ED3\u679C\uFF0C\u4E0D\u542B\u4EFB\u4F55\u51ED\u636E\u3002",
    "audit.all.servers": "\u5168\u90E8\u670D\u52A1\u5668",
    "audit.window": "\u65F6\u95F4\u8303\u56F4",
    "audit.window.day": "\u6700\u8FD1 24 \u5C0F\u65F6",
    "audit.window.week": "\u6700\u8FD1 7 \u5929",
    "audit.window.month": "\u6700\u8FD1 30 \u5929",
    "audit.window.year": "\u6700\u8FD1\u4E00\u5E74",
    "audit.limit": "\u6761\u6570",
    "audit.empty": "\u8FD9\u6BB5\u65F6\u95F4\u6CA1\u6709\u64CD\u4F5C\u8BB0\u5F55\u3002",
    "audit.time": "\u65F6\u95F4",
    "audit.host": "\u670D\u52A1\u5668",
    "audit.tool": "\u6765\u6E90",
    "audit.risk": "\u98CE\u9669",
    "audit.authorization": "\u6388\u6743",
    "audit.status": "\u7ED3\u679C",
    "audit.command": "\u547D\u4EE4",
    "audit.reason": "\u7406\u7531\uFF1A{p0}",
    "audit.retention": "\u8D85\u8FC7 {p0} \u4E2A\u6708\u7684\u6708\u5EA6\u5BA1\u8BA1\u6587\u4EF6\u4F1A\u81EA\u52A8\u6E05\u7406\u3002",
    "audit.retention.unlimited": "\u5BA1\u8BA1\u6587\u4EF6\u6C38\u4E45\u4FDD\u7559\u3002",
    "audit.load.failed": "\u65E0\u6CD5\u8BFB\u53D6\u64CD\u4F5C\u5BA1\u8BA1\u3002",
    "view.audit": "\u67E5\u770B\u5BA1\u8BA1",
    "import.from.ssh.config": "\u4ECE ssh_config \u5BFC\u5165",
    "ssh.import.title": "\u4ECE ssh_config \u5BFC\u5165\u670D\u52A1\u5668",
    "ssh.import.hint": "\u8BFB\u53D6 {p0} \u53CA\u5176 Include \u6587\u4EF6\u4E2D\u7684 Host \u522B\u540D\u3002\u5BFC\u5165\u7684\u670D\u52A1\u5668\u901A\u8FC7\u522B\u540D\u8FDE\u63A5\uFF0C\u5BC6\u94A5\u3001ProxyJump \u7B49\u8BBE\u7F6E\u4ECD\u7531 ssh_config \u51B3\u5B9A\uFF1B\u901A\u914D\u6A21\u5F0F\u4F1A\u88AB\u8DF3\u8FC7\u3002",
    "ssh.import.empty": "\u6CA1\u6709\u627E\u5230\u53EF\u5BFC\u5165\u7684 Host \u6761\u76EE\u3002",
    "ssh.import.existing": "\u6E05\u5355\u4E2D\u5DF2\u6709",
    "ssh.import.select.all": "\u5168\u9009\u65B0\u589E",
    "ssh.import.submit": "\u5BFC\u5165 {p0} \u53F0\u5E76\u63A2\u6D4B",
    "ssh.import.probing": "\u6B63\u5728\u5BFC\u5165\u5E76\u63A2\u6D4B\u2026",
    "ssh.import.load.failed": "\u65E0\u6CD5\u8BFB\u53D6 ssh_config\u3002",
    "probe.now": "\u7ACB\u5373\u63A2\u6D4B",
    "probe.failed": "\u63A2\u6D4B\u5931\u8D25\uFF1A{p0}",
    "probe.done": "\u5DF2\u63A2\u6D4B {p0} \u53F0\u670D\u52A1\u5668\uFF0C{p1} \u53F0\u672A\u80FD\u8FDE\u63A5\u3002",
    "probe.cores": "{p0} \u6838",
    "probe.gpus": "{p0} \u4E2A GPU",
    "probe.scheduler": "\u8C03\u5EA6\u5668 {p0}",
    "probe.docker": "Docker {p0}",
    "probe.privilege.root": "root",
    "probe.privilege.sudo-nopasswd": "\u514D\u5BC6 sudo",
    "probe.privilege.sudo-password": "sudo \u9700\u5BC6\u7801",
    "probe.privilege.none": "\u65E0 sudo",
    "not.probed": "\u5C1A\u672A\u63A2\u6D4B\u3002\u63A2\u6D4B\u540E\u4F1A\u8BB0\u5F55\u7CFB\u7EDF\u3001GPU\u3001\u8C03\u5EA6\u5668\u3001Docker \u548C sudo \u53EF\u7528\u6027\u3002",
    capabilities: "\u80FD\u529B",
    "missed.run": "\u7591\u4F3C\u6F0F\u8DD1",
    "missed.run.detail": "\u5E94\u4E8E {p0} \u8FD0\u884C\uFF0C\u6B64\u540E\u6CA1\u6709\u8FD0\u884C\u8BB0\u5F55\u3002\u8BF7\u786E\u8BA4 Harness \u548C\u62A5\u544A\u4F1A\u8BDD\u5F53\u65F6\u5904\u4E8E\u6253\u5F00\u72B6\u6001\uFF0C\u53EF\u70B9\u51FB\u201C\u8FD0\u884C\u4E00\u6B21\u201D\u8865\u8DD1\u3002",
    "last.run": "\u4E0A\u6B21\u8FD0\u884C\uFF1A{p0}",
    "never.run": "\u5DF2\u542F\u7528\uFF0C\u5C1A\u65E0\u8FD0\u884C\u8BB0\u5F55",
    "read.only.commands": "\u53EA\u8BFB\u547D\u4EE4",
    "read.only.commands.hint": "\u6BCF\u884C\u4E00\u6761\uFF0C\u5728\u6BCF\u53F0\u5173\u8054\u670D\u52A1\u5668\u4E0A\u6267\u884C\u540E\u518D\u5199\u62A5\u544A\uFF1B\u53EA\u63A5\u53D7\u5206\u7C7B\u4E3A\u53EA\u8BFB\u7684\u547D\u4EE4\u3002\u81EA\u5B9A\u4E49\u4EFB\u52A1\u56E0\u6B64\u53EF\u4EE5\u81EA\u884C\u91C7\u96C6\u8BC1\u636E\uFF0C\u4E0D\u4F9D\u8D56\u6A21\u578B\u3002",
    "read.only.commands.template.hint": "\u6BCF\u884C\u4E00\u6761\uFF1B\u5173\u8054\u670D\u52A1\u5668\u65F6 {{key}} \u5360\u4F4D\u7B26\u4F1A\u4F5C\u4E3A\u4E00\u4E2A\u5E26\u5F15\u53F7\u7684\u53C2\u6570\u4EE3\u5165\u3002",
    "commands.count": "{p0} \u6761\u53EA\u8BFB\u547D\u4EE4",
    "task.notify.on.change": "\u4EC5\u72B6\u6001\u53D8\u5316\u65F6\u901A\u77E5",
    "task.notify.on.change.hint": "\u95EE\u9898\u6570\u91CF\u4E0E\u4E0A\u6B21\u76F8\u540C\u65F6\u4E0D\u53D1\u9001\uFF1B\u9996\u6B21\u8FD0\u884C\u603B\u4F1A\u53D1\u9001\u3002",
    "quiet.hours": "\u9759\u9ED8\u65F6\u6BB5",
    "quiet.hours.hint": "\u8FD9\u6BB5\u672C\u5730\u65F6\u95F4\u5185\u4E0D\u53D1\u9001\u5916\u90E8\u901A\u77E5\uFF0C\u62A5\u544A\u4ECD\u4F1A\u9001\u5230\u4F1A\u8BDD\u3002",
    "quiet.hours.start": "\u4ECE",
    "quiet.hours.end": "\u5230",
    "quiet.hours.summary": "\u9759\u9ED8 {p0}\u2013{p1}",
    "remove.server": "\u4ECE WispOps \u79FB\u9664",
    "remove.server.confirm": "\u5C06\u201C{p0}\u201D\u4ECE WispOps \u79FB\u9664\uFF1F",
    "remove.server.effect": "\u539F WispTerm\u3001ssh_config \u548C YAML \u914D\u7F6E\u4E0D\u53D8\uFF0C\u5237\u65B0\u6216\u91CD\u542F\u540E\u4ECD\u4FDD\u6301\u79FB\u9664\u3002\u51ED\u636E\u5173\u8054\u3001\u6743\u9650\u8BBE\u7F6E\u548C\u5386\u53F2\u8BB0\u5F55\u4FDD\u7559\uFF0C\u53EF\u7A0D\u540E\u6062\u590D\u3002\u82E5\u4EFB\u52A1\u4ECD\u76F4\u63A5\u5F15\u7528\u5B83\uFF0C\u6216\u79FB\u9664\u540E\u5C06\u6CA1\u6709\u53EF\u7528\u76EE\u6807\uFF0C\u8BF7\u5148\u7F16\u8F91\u6216\u5220\u9664\u8FD9\u4E9B\u4EFB\u52A1\u3002",
    "removed.servers": "\u5DF2\u79FB\u9664\u7684\u670D\u52A1\u5668",
    "removed.servers.count": "\u5DF2\u79FB\u9664\uFF08{p0}\uFF09",
    "removed.servers.hint": "\u6062\u590D\u540E\u5C06\u6309\u5F53\u524D\u539F\u59CB\u914D\u7F6E\u91CD\u65B0\u8F7D\u5165\uFF0C\u5E76\u6CBF\u7528\u5DF2\u4FDD\u5B58\u7684\u51ED\u636E\u5173\u8054\u548C\u6743\u9650\u3002\u82E5\u539F\u59CB\u914D\u7F6E\u5DF2\u4E0D\u5B58\u5728\uFF0C\u5F85\u8BE5\u6765\u6E90\u518D\u6B21\u63D0\u4F9B\u670D\u52A1\u5668\u540E\u624D\u4F1A\u663E\u793A\u3002\u6062\u590D\u7684\u670D\u52A1\u5668\u53EF\u80FD\u91CD\u65B0\u52A0\u5165\u6309\u5206\u7EC4\u6216\u901A\u914D\u7B26\u9009\u62E9\u7684\u4EFB\u52A1\u3002",
    "restore.server": "\u6062\u590D",
    "restore.server.named": "\u6062\u590D {p0}",
    "ssh.import.excluded": "\u5DF2\u79FB\u9664\uFF0C\u8BF7\u5148\u6062\u590D",
    "sync.removed.servers": "\u5DF2\u79FB\u9664\u7684\u670D\u52A1\u5668\uFF1A{p0} \u2192 {p1}\u3002\u5BFC\u5165\u4E5F\u4F1A\u66FF\u6362\u6B64\u5217\u8868\uFF0C\u8F83\u65E9\u7684\u5FEB\u7167\u53EF\u80FD\u8BA9\u5DF2\u79FB\u9664\u7684\u670D\u52A1\u5668\u91CD\u65B0\u51FA\u73B0\u3002"
  }
};

// client/i18n.ts
var host;
var translate;
function installLocale(locale) {
  host = locale;
  const dispose = locale.register("wisp-ops", { en: en_default.ui, zh: zh_default.ui });
  translate = locale.bind("wisp-ops");
  return () => {
    dispose();
    if (host === locale) {
      host = void 0;
      translate = void 0;
    }
  };
}
function tr(key, params) {
  if (translate) return translate(key, params);
  return en_default.ui[key].replace(/\{(\w+)\}/g, (match, name) => params && name in params ? String(params[name]) : match);
}
function useLocale() {
  (0, import_react.useSyncExternalStore)((listener) => host?.subscribe(listener) ?? (() => {
  }), () => host?.getSnapshot().revision ?? 0);
}

// client/page.tsx
var import_react11 = require("react");

// client/style.css
var style_default = `.wo-root,.wo-dialog{--wo-bg:#fff;--wo-panel:#f7f8fa;--wo-line:#e7e9ee;--wo-text:#202735;--wo-muted:#7b8492;--wo-accent:#3f6ae5;--wo-tint:#eef3ff;box-sizing:border-box;color:var(--wo-text);font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.wo-root{container-type:inline-size;min-width:0;height:100%;overflow:auto;background:var(--wo-bg)}.wo-root *,.wo-dialog *{box-sizing:border-box}.wo-content{max-width:1400px;margin:auto;padding:38px 40px 24px;padding-left:max(40px,var(--dsh-frame-leading-clearance,0px))}.wo-root h1{font-size:28px;letter-spacing:-.7px;line-height:1.3;margin:12px 0 8px}.wo-root h2,.wo-dialog h2{font-size:20px;margin:5px 0}.wo-root h3{font-size:14px;margin:0;font-weight:600}.wo-root p{margin:8px 0}.wo-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px}.wo-header p{color:var(--wo-muted)}.wo-eyebrow{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:650;letter-spacing:1.6px;color:var(--wo-muted)}.wo-logo{background:#213044;color:#fff;border-radius:7px;width:24px;height:24px;display:inline-grid;place-items:center;font-size:15px;letter-spacing:-2px;padding-right:2px}.wo-version{font-weight:400;letter-spacing:0;background:var(--wo-panel);padding:0 6px;border-radius:4px}.wo-root button,.wo-dialog button{font:inherit;cursor:pointer;border:1px solid var(--wo-line);border-radius:7px;padding:7px 13px;background:var(--wo-bg);color:var(--wo-text);white-space:nowrap}.wo-root button:hover,.wo-dialog button:hover{background:var(--wo-panel)}.wo-root button:disabled,.wo-dialog button:disabled{opacity:.45;cursor:not-allowed}.wo-root button.wo-primary,.wo-dialog button.wo-primary{background:var(--wo-accent);border-color:var(--wo-accent);color:#fff}.wo-root button.wo-primary:hover,.wo-dialog button.wo-primary:hover{filter:brightness(.96)}.wo-root button.wo-text-button,.wo-dialog button.wo-text-button{border:0;background:transparent;color:var(--wo-accent);padding:3px 0;font-size:12px}.wo-muted,.wo-root small,.wo-dialog small{color:var(--wo-muted);font-size:12px}.wo-block{display:block;margin-top:9px}.wo-tabs{display:flex;gap:24px;border-bottom:1px solid var(--wo-line)}.wo-tabs button{border:0;border-radius:0;background:transparent;padding:0 2px 12px;color:var(--wo-muted);position:relative}.wo-tabs button.active{color:var(--wo-accent);font-weight:600}.wo-tabs button.active:after{content:'';height:2px;background:var(--wo-accent);position:absolute;bottom:-1px;left:0;right:0}.wo-tabs button span{font-size:11px;margin-left:7px;border-radius:5px;background:var(--wo-panel);padding:1px 6px;font-weight:400}.wo-toolbar{display:flex;gap:15px;align-items:center;justify-content:space-between;margin:23px 0}.wo-root input,.wo-root select,.wo-dialog input,.wo-dialog select,.wo-dialog textarea{font:inherit;background:var(--wo-bg);color:var(--wo-text);border:1px solid var(--wo-line);border-radius:6px;padding:9px 11px;min-width:0}.wo-root input:focus,.wo-dialog input:focus,.wo-root select:focus,.wo-dialog select:focus,.wo-dialog textarea:focus{outline:2px solid #96b2ff;outline-offset:1px}.wo-toolbar input{width:310px;max-width:55%;font-size:12px}.wo-host-layout{display:grid;grid-template-columns:minmax(270px,1fr) minmax(330px,1.03fr);gap:24px}.wo-hosts{border:1px solid var(--wo-line);border-radius:9px;overflow:hidden;align-self:start}.wo-root button.wo-host-row{width:100%;display:flex;text-align:left;align-items:center;gap:15px;padding:19px 18px;border:0;border-bottom:1px solid var(--wo-line);border-radius:0;white-space:normal}.wo-root button.wo-host-row:last-child{border-bottom:0}.wo-host-row.selected{background:var(--wo-tint)!important;box-shadow:inset 3px 0 var(--wo-accent)}.wo-host-row>div:nth-child(2){min-width:0}.wo-host-row strong{font-size:14px}.wo-host-row .wo-mono{display:block;font-size:11px;color:var(--wo-muted);margin-top:2px;overflow-wrap:anywhere}.wo-host-symbol{display:grid;place-items:center;flex:0 0 36px;height:38px;background:var(--wo-panel);border:1px solid var(--wo-line);border-radius:8px;font-size:22px;color:#67748b}.wo-host-row.selected .wo-host-symbol{background:var(--wo-bg);color:var(--wo-accent)}.wo-chevron{margin-left:auto;color:var(--wo-muted)}.wo-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:9px}.wo-badge{display:inline-block;border-radius:5px;background:var(--wo-panel);color:#737e8e;font-size:10px;line-height:1.7;padding:2px 7px;white-space:nowrap;font-weight:450}.wo-badge.good{background:#eaf6ef;color:#3b8460}.wo-badge.warn{background:#fff3dc;color:#a4782e}.wo-detail{border:1px solid var(--wo-line);border-radius:10px;padding:24px}.wo-detail-title{display:flex;align-items:center;justify-content:space-between;gap:14px}.wo-detail h2{margin-top:8px}.wo-facts{margin:15px 0 20px}.wo-facts>div{display:flex;justify-content:space-between;gap:15px;padding:5px 0;font-size:12px}.wo-facts dt{color:var(--wo-muted);flex-shrink:0}.wo-facts dd{margin:0;overflow-wrap:anywhere;text-align:right}.wo-mono{font-family:ui-monospace,SFMono-Regular,monospace}.wo-section-title{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--wo-line);padding-top:20px;margin:22px 0 12px}.wo-credential-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 0;font-size:12px}.wo-credential-row>span:first-child{color:var(--wo-muted)}.wo-ref{display:flex;align-items:center;gap:7px;overflow-wrap:anywhere}.wo-dot{display:inline-block;width:6px;height:6px;background:#bdc4cf;border-radius:50%;flex-shrink:0}.wo-dot.good{background:#52a878}.wo-dot.warn{background:#d7a347}.wo-root button.wo-linked-task{display:flex;align-items:center;justify-content:space-between;width:100%;text-align:left;white-space:normal;border:0;padding:8px 0}.wo-linked-task strong{font-size:12px}.wo-linked-task small{display:block;font-size:11px;margin-top:2px}.wo-root button.wo-chip{font-size:11px;background:var(--wo-panel);padding:3px 8px;border:0;color:#65758d}.wo-task-grid,.wo-vault-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.wo-task,.wo-vault-card{border:1px solid var(--wo-line);border-radius:10px;padding:22px;min-width:0}.wo-task-heading{display:flex;justify-content:space-between;align-items:start;gap:10px}.wo-task-heading h3{overflow-wrap:anywhere}.wo-task-heading small{font-size:11px}.wo-task-meta{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin:15px 0 10px}.wo-task-meta>span:last-child{color:var(--wo-muted);font-size:11px}.wo-task-instruction{font-size:12px;color:var(--wo-muted);white-space:pre-wrap;overflow-wrap:anywhere}.wo-task-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px;border-top:1px solid var(--wo-line);padding-top:15px;margin-top:18px}.wo-task-actions button{font-size:12px}.wo-scheduled{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--wo-panel);padding:10px;margin-top:14px;border-radius:7px;font-size:11px}.wo-scheduled small{display:block;overflow-wrap:anywhere;font-size:10px}.wo-scheduled button{font-size:11px;padding:4px 8px}.wo-destination{padding:0 0 22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:12px}.wo-destination select{margin-left:8px;max-width:280px}.wo-destination small{font-size:11px}.wo-section-note{color:var(--wo-muted);font-size:12px;padding-bottom:14px}.wo-key-symbol{display:block;font-size:24px;line-height:1;margin-bottom:12px;color:var(--wo-accent)}.wo-secret-mask{letter-spacing:4px;color:#949dad;background:var(--wo-panel);border-radius:6px;padding:10px 14px;margin:18px 0}.wo-secret-mask small{float:right;letter-spacing:0;font-size:10px;line-height:24px}.wo-empty{text-align:center;padding:55px 15px;color:var(--wo-muted);line-height:2.2}.wo-alert,.wo-notice{border-radius:7px;padding:10px 14px;font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:15px;white-space:pre-wrap;overflow-wrap:anywhere}.wo-alert{background:#fff2e9;color:#9c582f}.wo-notice{background:#eaf6ef;color:#3b8460}.wo-footer{text-align:center;color:var(--wo-muted);font-size:10px;padding:32px 0 4px;letter-spacing:.3px}.wo-dialog{background:var(--wo-bg);color:var(--wo-text);border:1px solid var(--wo-line);border-radius:14px;padding:26px;width:540px;max-width:calc(100vw - 32px);max-height:calc(100vh - 60px);box-shadow:0 20px 80px #17203030}.wo-dialog::backdrop{background:#17203055;backdrop-filter:blur(2px)}.wo-dialog-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.wo-dialog button.wo-icon-button{border:0;font-size:24px;line-height:1;padding:4px 7px}.wo-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;font-size:12px}.wo-field>span{font-weight:600}.wo-field small{font-size:11px}.wo-field input[readonly]{background:var(--wo-panel);color:var(--wo-muted)}.wo-field textarea{resize:vertical}.wo-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.wo-check{display:flex;align-items:center;gap:8px;font-size:12px;margin:8px 0}.wo-check input,.wo-weekdays input{accent-color:var(--wo-accent);width:15px;height:15px}.wo-check small{margin-left:auto;font-size:10px}.wo-form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.wo-danger{background:#bb4e4e!important;color:white!important;border-color:#bb4e4e!important}.wo-server-picks{border:1px solid var(--wo-line);border-radius:7px;padding:10px 14px;margin:0 0 16px;max-height:160px;overflow:auto}.wo-server-picks legend{font-size:12px;font-weight:600;padding:0 5px}.wo-weekdays{display:flex;gap:12px;margin-bottom:16px}.wo-weekdays label{display:flex;align-items:center;gap:3px;font-size:12px}button:focus-visible{outline:2px solid #96b2ff;outline-offset:3px}
@container(max-width:950px){.wo-content{padding:28px 22px}.wo-host-layout{gap:15px;grid-template-columns:minmax(230px,.85fr) minmax(285px,1fr)}.wo-detail{padding:18px}.wo-task-grid,.wo-vault-grid{grid-template-columns:1fr}}@container(max-width:650px){.wo-content{padding:26px 16px}.wo-host-layout{grid-template-columns:1fr}.wo-tabs{gap:20px}.wo-header{align-items:flex-start}.wo-header h1{font-size:25px}.wo-toolbar{gap:8px}.wo-toolbar input{width:100%}.wo-toolbar button{font-size:12px}.wo-form-grid{grid-template-columns:1fr;gap:0}.wo-dialog{padding:20px}.wo-header p{font-size:12px}}
@media(prefers-color-scheme:dark){.wo-root,.wo-dialog{--wo-bg:#1e222a;--wo-panel:#262c36;--wo-line:#343c49;--wo-text:#e1e7f0;--wo-muted:#929dae;--wo-tint:#273449;--wo-accent:#7099ff}.wo-badge.good,.wo-notice{background:#213d31;color:#8bc9a8}.wo-badge.warn,.wo-alert{background:#443728;color:#dbb980}}

.wo-sidebar .wo-content{padding:20px 16px}.wo-sidebar .wo-header{margin-bottom:20px}.wo-sidebar .wo-header h1{font-size:24px}.wo-destination label{max-width:100%}.wo-destination select{max-width:100%;margin-left:0;display:block;margin-top:6px}

.wo-form-body{border:0;padding:0;margin:0;min-width:0}.wo-generator{padding:16px;margin:0 0 20px;background:var(--wo-tint);border:1px solid var(--wo-line);border-radius:9px;font-size:12px}.wo-generator p{color:var(--wo-muted);margin:6px 0 10px}.wo-generator>small{display:block;font-size:11px}.wo-generator>button{display:block;margin-top:12px;width:100%}.wo-draft-evidence{padding:12px 14px;margin-bottom:20px;border:1px solid var(--wo-line);border-radius:8px;font-size:12px}.wo-draft-evidence p{margin:8px 0;overflow-wrap:anywhere}.wo-draft-evidence small{display:block;font-size:10px}.wo-draft-warning{color:#a4782e}

.wo-credential-row>.wo-ref{margin-left:auto}.wo-credential-row>button{flex-shrink:0}.wo-credential-row>span:first-child{flex-shrink:0}
.wo-dialog .wo-form-grid{grid-template-columns:1fr 1fr;gap:15px}
@media(max-width:480px){.wo-dialog .wo-form-grid{grid-template-columns:1fr;gap:0}}

/* Compact management layout, sized to the pane rather than the app window. */
.wo-content{padding:24px 28px;max-width:1200px;padding-left:max(28px,var(--dsh-frame-leading-clearance,0px))}
.wo-header{gap:16px;margin-bottom:12px;align-items:center}
.wo-heading{display:flex;align-items:center;gap:10px;min-width:0}
.wo-heading .wo-logo{width:32px;height:32px;flex:0 0 32px;font-size:19px;border-radius:8px}
.wo-heading-title{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
.wo-root .wo-header h1{font-size:20px;letter-spacing:-.4px;margin:0;line-height:1.4}
.wo-header .wo-version{font-size:10px;line-height:1.7}
.wo-root .wo-header p{font-size:12px;margin:3px 0 0}
.wo-root .wo-refresh{flex-shrink:0;font-size:12px;padding:6px 10px}
.wo-overview{display:flex;align-items:center;flex-wrap:wrap;gap:8px 18px;padding:10px 0 16px;font-size:12px;color:var(--wo-muted)}
.wo-overview>span{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.wo-overview strong{font-weight:600;color:var(--wo-text);font-variant-numeric:tabular-nums}
.wo-overview small{font-size:11px;font-weight:400}
.wo-tabs{gap:24px}
.wo-tabs button{font-size:13px;padding-bottom:10px}
.wo-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;margin:16px 0}
.wo-toolbar input{width:100%;max-width:none;height:36px;font-size:12px}
.wo-toolbar button{font-size:12px;height:36px;padding:6px 12px}
.wo-destination{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;background:var(--wo-panel);border:1px solid var(--wo-line);border-radius:8px;padding:10px 12px;margin-bottom:16px}
.wo-destination label{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center;min-width:0;font-size:12px}
.wo-destination select{display:block;width:100%;max-width:none;min-width:0;margin:0;font-size:12px;padding:6px 9px;height:32px;text-overflow:ellipsis}
.wo-destination small{font-size:11px;padding-left:46px;overflow-wrap:anywhere}
.wo-task-grid,.wo-vault-grid{gap:14px;align-items:start}
.wo-task,.wo-vault-card{padding:16px;border-radius:9px}
.wo-task-heading{gap:12px}
.wo-task-heading>div{min-width:0}
.wo-task-heading>.wo-badge{flex-shrink:0}
.wo-task-heading .wo-mono{display:block;overflow-wrap:anywhere;font-size:10px;line-height:1.6;margin-top:2px}
.wo-task-meta{gap:8px;margin:10px 0 8px}
.wo-task-meta .wo-chips{margin:0;gap:5px}
.wo-task-schedule{display:flex;align-items:flex-start;gap:7px;color:var(--wo-muted);font-size:12px;overflow-wrap:anywhere}
.wo-task-schedule svg{flex:0 0 14px;margin-top:3px}
.wo-task-rules{margin-top:12px;font-size:12px;border-top:1px solid var(--wo-line);padding-top:10px}
.wo-task-rules summary{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline;gap:10px;cursor:pointer;list-style:none}
.wo-task-rules summary::-webkit-details-marker{display:none}
.wo-task-rules summary::after{content:'\u2304';color:var(--wo-muted);grid-column:3;grid-row:1}
.wo-task-rules[open] summary::after{transform:rotate(180deg)}
.wo-rule-label{font-size:11px;color:var(--wo-muted);white-space:nowrap}
.wo-rule-preview{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--wo-muted)}
.wo-task-rules[open] .wo-rule-preview{display:none}
.wo-root .wo-task-instruction{margin:8px 0 0;color:var(--wo-text);line-height:1.7}
.wo-task-footer{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid var(--wo-line)}
.wo-task-flags{display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.wo-task-flags small{font-size:10px}
.wo-task-footer .wo-task-actions{border:0;margin:0 0 0 auto;padding:0;gap:8px}
.wo-root .wo-schedule-button{color:var(--wo-accent);border-color:var(--wo-line);background:var(--wo-tint)}
.wo-root .wo-schedule-button:hover{background:var(--wo-tint);filter:brightness(.97)}
.wo-scheduled{margin-top:10px;min-width:0}
.wo-scheduled>span{min-width:0}
.wo-scheduled>button{flex-shrink:0}
.wo-root button.wo-host-row{gap:10px;padding:10px 14px}
.wo-host-row .wo-chips{margin-top:4px;gap:4px}
.wo-host-row .wo-chips small{font-size:10px}
.wo-host-row .wo-badge{padding:0 5px}
.wo-detail{padding:18px}
.wo-facts{margin:12px 0 16px}
.wo-section-title{padding-top:14px;margin:16px 0 8px}
.wo-credential-row{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:8px}
.wo-credential-row>.wo-ref{margin-left:0;min-width:0}
.wo-credential-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px}
.wo-section-note{padding-bottom:0;font-size:11px}
.wo-footer{padding-top:20px;line-height:1.7}
.wo-sidebar .wo-content{padding:16px}
.wo-sidebar .wo-header{margin-bottom:10px}
.wo-sidebar .wo-header p{display:none}
@container(max-width:650px){
  .wo-content{padding:20px 16px}
  .wo-host-layout{grid-template-columns:minmax(0,1fr);gap:14px}
  .wo-hosts{max-height:276px;overflow:auto}
  .wo-task-grid,.wo-vault-grid{grid-template-columns:minmax(0,1fr)}
}
@container(max-width:380px){
  .wo-sidebar .wo-content{padding:14px 12px}
  .wo-root .wo-header h1{font-size:18px}
  .wo-heading .wo-logo{display:none}
  .wo-overview{gap:6px 12px;font-size:11px}
  .wo-tabs{justify-content:space-between;gap:8px}
  .wo-tabs button{font-size:12px}
  .wo-tabs button span{margin-left:5px}
  .wo-task,.wo-vault-card{padding:13px}
  .wo-rule-preview{font-size:11px}
  .wo-credential-row{grid-template-columns:60px minmax(0,1fr) auto}
}

.wo-root .wo-clear-search{display:block;margin:12px auto 0;font-size:12px}
.wo-task-rules summary:focus-visible{outline:2px solid #96b2ff;outline-offset:4px;border-radius:3px}

/* Task library: reusable templates and explicit host association. */
.wo-template-card{display:flex;flex-direction:column;align-self:stretch}
.wo-template-card>p{font-size:12px;color:var(--wo-muted);flex:1;margin:8px 0 12px}
.wo-template-card>.wo-task-actions{gap:8px;margin-top:12px;padding-top:12px}
.wo-template-context{padding:12px 14px;background:var(--wo-tint);border-radius:8px;margin-bottom:16px;font-size:12px}
.wo-template-context p{margin:4px 0;color:var(--wo-muted)}
.wo-template-preview{margin-bottom:18px;font-size:12px}
.wo-template-preview summary{cursor:pointer;color:var(--wo-accent)}
.wo-template-preview p{white-space:pre-wrap;overflow-wrap:anywhere;padding:10px;background:var(--wo-panel);border-radius:6px}
.wo-template-picker{display:grid;gap:8px;max-height:55vh;overflow:auto}
.wo-dialog .wo-template-picker button{text-align:left;white-space:normal;padding:10px 12px}
.wo-template-picker strong,.wo-template-picker small{display:block}
.wo-template-picker small{margin-top:3px}
@container(max-width:430px){.wo-tabs{gap:10px 14px;flex-wrap:wrap;justify-content:flex-start;overflow:visible}.wo-tabs button{font-size:12px;flex-shrink:0}.wo-tabs button span{display:none}}
@container(min-width:500px){.wo-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* Fleet overview: inspection status matrix and SVG sparklines, no chart library. */
.wo-root{--wo-ok:#52a878;--wo-warn:#d7a347;--wo-crit:#c95c5c;--wo-unreachable:#9aa3b2;--wo-never:var(--wo-line)}
.wo-fleet{display:flex;flex-direction:column;gap:14px;margin-top:16px}
.wo-fleet-controls{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px 18px}
.wo-fleet-summary{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--wo-muted)}
.wo-fleet-count{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.wo-fleet-count strong{color:var(--wo-text);font-weight:600;font-variant-numeric:tabular-nums}
.wo-dot.ok{background:var(--wo-ok)}.wo-dot.warn{background:var(--wo-warn)}.wo-dot.crit{background:var(--wo-crit)}.wo-dot.unreachable{background:var(--wo-unreachable)}.wo-dot.never{background:var(--wo-never)}
.wo-range{display:flex;gap:6px}
.wo-range button{font-size:12px;padding:5px 10px}
.wo-range button.active{background:var(--wo-tint);border-color:var(--wo-accent);color:var(--wo-accent);font-weight:600}
.wo-fleet .wo-section-note{margin:0;padding:0}
.wo-matrix{border:1px solid var(--wo-line);border-radius:9px;overflow:hidden}
.wo-matrix-row{display:grid;grid-template-columns:minmax(110px,170px) minmax(0,1fr) auto;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid var(--wo-line)}
.wo-matrix-row:last-child{border-bottom:0}
.wo-matrix-row{cursor:pointer}.wo-matrix-row:hover{background:var(--wo-panel)}.wo-matrix-row.current,.wo-matrix-row.current:hover{background:var(--wo-tint)}
.wo-matrix-host{min-width:0}
.wo-root button.wo-matrix-name{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--wo-text);font-weight:600;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wo-root button.wo-matrix-name[aria-pressed="true"]{color:var(--wo-accent)}
.wo-matrix-host small{display:block;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wo-cells{display:flex;justify-content:flex-end;gap:2px;min-width:0}
.wo-cell{flex:1 1 0;max-width:14px;height:14px;border-radius:3px;background:var(--wo-never);border:0;padding:0;margin:0;display:block}
.wo-root button.wo-cell{border:0;border-radius:3px;padding:0;cursor:pointer}
.wo-root button.wo-cell:hover{filter:brightness(.9)}
.wo-cell.ok{background:var(--wo-ok)}.wo-cell.warn{background:var(--wo-warn)}.wo-cell.crit{background:var(--wo-crit)}
.wo-cell.unreachable{background:repeating-linear-gradient(135deg,var(--wo-unreachable) 0 2px,transparent 2px 4px)}
.wo-cell.picked{outline:2px solid var(--wo-accent);outline-offset:1px}
.wo-matrix-latest{display:flex;align-items:center;gap:10px;font-size:11px;color:var(--wo-muted);white-space:nowrap}
.wo-matrix-latest strong{color:var(--wo-text);font-variant-numeric:tabular-nums}
.wo-root .wo-matrix-latest .wo-chip{padding:2px 7px}
.wo-fleet-detail{margin-top:2px}
.wo-badge.ok{background:#eaf6ef;color:#3b8460}.wo-badge.crit{background:#fbe9e9;color:#9c3d3d}.wo-badge.unreachable{background:var(--wo-panel);color:var(--wo-muted)}
.wo-spark-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:14px}
.wo-spark{border:1px solid var(--wo-line);border-radius:8px;padding:10px 12px;min-width:0;--wo-series:var(--wo-ok)}
.wo-spark.warn{--wo-series:var(--wo-warn)}.wo-spark.crit{--wo-series:var(--wo-crit)}
.wo-spark-head{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--wo-muted)}
.wo-spark-head span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wo-spark-head strong{color:var(--wo-text);font-variant-numeric:tabular-nums;white-space:nowrap}
.wo-spark svg{display:block;width:100%;height:44px;margin:8px 0 6px;overflow:visible}
.wo-spark-guide{stroke:var(--wo-line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-dasharray:2 3}
.wo-spark-area{fill:var(--wo-series);opacity:.14}
.wo-spark-line{fill:none;stroke:var(--wo-series);stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round}
.wo-spark-dot{fill:var(--wo-series)}
.wo-spark small{display:block;font-size:10px}
.wo-findings{list-style:none;margin:0;padding:0;font-size:12px}
.wo-findings li{display:grid;grid-template-columns:auto auto minmax(0,1fr);align-items:baseline;gap:10px;padding:6px 0;border-top:1px solid var(--wo-line);overflow-wrap:anywhere}
.wo-findings li:first-child{border-top:0}
@media(prefers-color-scheme:dark){.wo-root{--wo-ok:#5fb886;--wo-warn:#dcae56;--wo-crit:#d96b6b;--wo-unreachable:#7e889a}.wo-badge.ok{background:#213d31;color:#8bc9a8}.wo-badge.crit{background:#46282a;color:#e3a0a0}}
@container(max-width:650px){.wo-matrix-row{grid-template-columns:minmax(90px,130px) minmax(0,1fr)}.wo-matrix-latest{grid-column:1/-1;justify-content:flex-end;padding-top:2px}.wo-spark-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}}
@container(max-width:380px){.wo-matrix-row{grid-template-columns:minmax(0,1fr);gap:6px}.wo-cells{justify-content:flex-start}.wo-spark-grid{grid-template-columns:1fr}}
.wo-password-field{gap:8px}.wo-password-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.wo-password-head label{font-weight:600}.wo-password-head button{font-weight:500}
.wo-target-note{margin:0 0 16px;padding:9px 12px;background:var(--wo-tint);border-radius:7px;font-size:12px}.wo-pick-list{display:flex;flex-direction:column;gap:6px;max-height:280px;overflow:auto;margin:0 0 14px}.wo-pick-option{display:flex;align-items:center;gap:10px;border:1px solid var(--wo-line);border-radius:7px;padding:9px 12px;font-size:12px;cursor:pointer;margin:0}.wo-pick-option:has(input:checked){border-color:var(--wo-accent);background:var(--wo-tint)}.wo-pick-option input{accent-color:var(--wo-accent);width:15px;height:15px;flex-shrink:0;margin:0}.wo-pick-option>div{min-width:0;flex:1}.wo-pick-option strong{display:block;font-size:12px;font-weight:600}.wo-pick-option strong .wo-muted{font-weight:400;margin-left:6px}.wo-pick-option small{display:block;font-size:10px;overflow-wrap:anywhere;margin-top:2px}.wo-pick-option .wo-badge{flex-shrink:0}
.wo-test-result{border-radius:7px;padding:9px 12px;font-size:12px;margin:0 0 4px;white-space:pre-wrap;overflow-wrap:anywhere}.wo-test-result.good{background:#eaf6ef;color:#3b8460}.wo-test-result.bad{background:#fff2e9;color:#9c582f}.wo-test-result small{display:block;font-size:10px;margin-top:4px;opacity:.85}
.wo-policy-row{flex-direction:row;align-items:center;justify-content:space-between;gap:14px}.wo-policy-row>span{display:flex;flex-direction:column;gap:2px;font-family:ui-monospace,SFMono-Regular,monospace}.wo-policy-row>span small{font-family:inherit;font-weight:400;font-size:11px;font-family:system-ui,sans-serif}.wo-policy-row select{min-width:180px}.wo-badge small{font-size:9px;opacity:.8}.wo-field-warn{margin:0 0 14px;padding:7px 10px;border-radius:6px;background:#fff3dc;color:#a4782e;font-size:11px;line-height:1.5}
.wo-matrix-mid{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);gap:12px;align-items:center;min-width:0}.wo-matrix-info{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--wo-muted)}.wo-inspect-now{font-weight:600}.wo-matrix-latest .wo-chip{cursor:pointer}@media(max-width:640px){.wo-matrix-mid{grid-template-columns:1fr}.wo-matrix-info{display:none}}

/* Updates: version summary, contextual actions and an accessible preference switch. */
.wo-updates{max-width:960px;margin:26px auto 0;--wo-update-good:#327451;--wo-update-good-bg:#edf7f1;--wo-update-warn:#965527;--wo-update-warn-bg:#fff4e9}
.wo-root .wo-updates-heading h2{margin:0;font-size:18px;letter-spacing:-.3px}
.wo-root .wo-updates-heading p{margin:5px 0 20px;font-size:12px;color:var(--wo-muted)}
.wo-update-card{padding:24px;border:1px solid var(--wo-line);border-radius:14px;background:var(--wo-bg);box-shadow:0 3px 14px #17203004}
.wo-update-versions{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:24px}
.wo-update-current{display:flex;align-items:center;gap:16px;min-width:0}
.wo-update-brand{display:grid;place-items:center;flex:0 0 54px;height:54px;border-radius:14px;background:var(--wo-tint);color:var(--wo-accent);font-size:28px;font-weight:500;line-height:1}
.wo-update-label{display:block;color:var(--wo-muted);font-size:11px;margin-bottom:3px}
.wo-update-version{display:block;font-size:32px;font-weight:650;letter-spacing:-1px;line-height:1.2;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.wo-update-latest{text-align:right;min-width:0;padding-left:24px;border-left:1px solid var(--wo-line)}
.wo-update-latest strong{font-size:18px;line-height:1.5;font-weight:600;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.wo-update-pending{font-size:12px;color:var(--wo-muted)}
.wo-update-status{display:flex;align-items:center;gap:12px;padding:16px;border-radius:9px;background:var(--wo-panel);color:var(--wo-text)}
.wo-update-status.good{background:var(--wo-update-good-bg);color:var(--wo-update-good)}
.wo-update-status.warn{background:var(--wo-update-warn-bg);color:var(--wo-update-warn)}
.wo-update-status.accent{background:var(--wo-tint);color:var(--wo-accent)}
.wo-update-status-icon{display:grid;place-items:center;flex:0 0 32px;height:32px;border:1px solid currentColor;border-radius:50%}
.wo-update-status.neutral .wo-update-status-icon{color:var(--wo-muted);border-color:var(--wo-line)}
.wo-update-status strong{font-size:13px;font-weight:600;overflow-wrap:anywhere}
.wo-root .wo-update-status p{margin:3px 0 0;color:var(--wo-muted);font-size:12px;line-height:1.7}
.wo-root .wo-update-detail{margin:12px 0 0;font-size:12px;color:var(--wo-muted);overflow-wrap:anywhere}
.wo-update-actions{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-top:20px}
.wo-updates a{color:var(--wo-accent);text-underline-offset:3px}
.wo-update-release,.wo-update-recovery a{display:inline-flex;align-items:center;gap:6px;font-size:12px;text-decoration:none}
.wo-updates a:hover{text-decoration:underline}
.wo-update-release svg,.wo-update-recovery svg{width:14px;height:14px;flex-shrink:0}
.wo-update-buttons{display:flex;flex-wrap:wrap;gap:10px;margin-left:auto}
.wo-root .wo-update-buttons button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;padding:8px 14px;font-size:12px;line-height:1.6}
.wo-update-buttons svg{flex-shrink:0;width:16px;height:16px}
.wo-update-preference{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:20px 24px;margin-top:14px;border:1px solid var(--wo-line);border-radius:12px;background:var(--wo-bg)}
.wo-update-preference label{font-size:13px;font-weight:600;cursor:pointer}
.wo-root .wo-update-preference p{font-size:12px;color:var(--wo-muted);margin:4px 0 0}
.wo-root input.wo-update-switch{appearance:none;-webkit-appearance:none;position:relative;flex:0 0 38px;width:38px;height:22px;padding:0;margin:0;border:1px solid var(--wo-muted);border-radius:20px;background:var(--wo-muted);cursor:pointer;transition:background .15s,border-color .15s}
.wo-update-switch::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;background:#fff;border-radius:50%;box-shadow:0 1px 3px #17203026;transition:transform .15s}
.wo-root input.wo-update-switch:checked{background:var(--wo-accent);border-color:var(--wo-accent)}
.wo-update-switch:checked::after{transform:translateX(16px)}
.wo-root input.wo-update-switch:disabled{opacity:.45;cursor:not-allowed}
.wo-root .wo-update-note{display:flex;align-items:flex-start;gap:8px;margin:16px 4px 0;color:var(--wo-muted);font-size:11px;line-height:1.8}
.wo-update-note svg{flex-shrink:0;width:15px;height:15px;margin-top:2px}
.wo-update-recovery{margin-top:16px;padding:14px 16px;border:1px solid var(--wo-line);border-radius:9px;font-size:12px;overflow-wrap:anywhere}
.wo-root .wo-update-recovery p{margin:0 0 8px}
.wo-update-recovery a{display:inline;line-height:1.8}
.wo-update-recovery svg{margin-left:5px;vertical-align:middle}
.wo-updates>.wo-alert{margin-top:16px}
@container(max-width:650px){.wo-updates{margin-top:20px}.wo-update-card{padding:18px}.wo-update-preference{padding:16px 18px;gap:16px}.wo-update-versions{gap:16px}.wo-update-latest{padding-left:16px}.wo-update-brand{flex-basis:44px;height:44px;border-radius:11px;font-size:24px}.wo-update-version{font-size:28px}}
@container(max-width:430px){.wo-update-card{padding:16px}.wo-update-current{gap:10px}.wo-update-versions{gap:14px;flex-wrap:wrap;margin-bottom:18px}.wo-update-latest{padding-left:0;border:0;text-align:left}.wo-update-status{padding:12px;align-items:flex-start;gap:10px}.wo-update-status-icon{flex-basis:28px;height:28px;margin-top:2px}.wo-update-buttons{width:100%;display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.wo-root .wo-update-buttons button{white-space:normal}.wo-update-preference{padding:16px;gap:14px}.wo-update-version{font-size:26px}}
@media(prefers-color-scheme:dark){.wo-updates{--wo-update-good:#8bc9a8;--wo-update-good-bg:#213d31;--wo-update-warn:#dbb980;--wo-update-warn-bg:#443728}.wo-update-card{box-shadow:none}}
@media(prefers-reduced-motion:reduce){.wo-root input.wo-update-switch,.wo-update-switch::after{transition:none}}

/* Device sync uses the same compact settings layout as Updates. */
.wo-sync{max-width:960px;margin:26px auto 0}
.wo-sync-heading{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px}
.wo-root .wo-sync-heading h2{margin:0;font-size:18px;letter-spacing:-.3px}
.wo-root .wo-sync-heading p{margin:5px 0 0;font-size:12px;color:var(--wo-muted)}
.wo-sync-encrypted{display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:6px;background:var(--wo-tint);color:var(--wo-accent);font-size:11px}
.wo-sync-encrypted svg{width:14px;height:14px}
.wo-sync-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:16px}
.wo-sync-card{min-width:0;border:1px solid var(--wo-line);border-radius:12px;padding:22px;background:var(--wo-bg)}
.wo-sync-card-heading{display:flex;align-items:center;gap:11px;margin-bottom:22px}
.wo-sync-symbol{display:grid;place-items:center;flex:0 0 36px;height:36px;border-radius:9px;background:var(--wo-tint);color:var(--wo-accent)}
.wo-root .wo-sync-card h3,.wo-root .wo-sync-transfer h3{font-size:13px;font-weight:600}
.wo-root .wo-sync-card-heading p{margin:3px 0 0;font-size:11px;color:var(--wo-muted)}
.wo-sync .wo-field{gap:7px;margin-bottom:16px}
.wo-sync .wo-field:last-child{margin-bottom:0}
.wo-sync .wo-field input,.wo-sync .wo-field select{width:100%;font-size:12px;min-height:38px;padding:8px 10px}
.wo-sync .wo-field select{text-overflow:ellipsis}
.wo-sync .wo-field>span{font-size:11px;font-weight:550}
.wo-root .wo-sync-passphrase-note{display:flex;align-items:flex-start;gap:8px;margin:0 0 20px;padding:11px 12px;border-radius:8px;background:var(--wo-panel);color:var(--wo-muted);font-size:11px;line-height:1.8}
.wo-sync-passphrase-note svg{flex:0 0 15px;height:15px;margin-top:2px}
.wo-sync-key-option{display:flex;align-items:flex-start;gap:10px;padding-top:16px;border-top:1px solid var(--wo-line);cursor:pointer}
.wo-sync-key-option input{width:15px;height:15px;padding:0;margin:3px 0 0;flex-shrink:0;accent-color:var(--wo-accent)}
.wo-sync-key-option strong{display:block;font-size:12px;font-weight:600}
.wo-sync-key-option small{display:block;font-size:11px;line-height:1.8;margin-top:3px}
.wo-root .wo-sync-scope{display:flex;align-items:flex-start;gap:8px;margin:14px 2px 20px;font-size:11px;line-height:1.8;color:var(--wo-muted)}
.wo-sync-scope svg{flex:0 0 15px;height:15px;margin-top:2px}
.wo-sync-transfer{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--wo-line);border-radius:12px;background:var(--wo-panel);margin-bottom:16px}
.wo-sync-transfer>div{padding:20px 22px;min-width:0;display:flex;flex-direction:column;align-items:flex-start}
.wo-sync-transfer>div+div{border-left:1px solid var(--wo-line)}
.wo-root .wo-sync-transfer p{font-size:11px;color:var(--wo-muted);margin:4px 0 14px;flex:1}
.wo-root .wo-sync button{font-size:12px;min-height:38px;white-space:normal}
.wo-root .wo-sync-transfer button{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:8px 13px}
.wo-sync-transfer svg{width:16px;height:16px;flex-shrink:0}
.wo-root .wo-sync-progress{font-size:12px;color:var(--wo-muted);margin:12px 0}
.wo-sync-cloud,.wo-sync-preview{margin-top:16px}
.wo-sync-cloud-picker{display:flex;align-items:flex-end;gap:12px}
.wo-sync-cloud-picker .wo-field{flex:1;min-width:0;margin:0}
.wo-sync-cloud-picker button{flex-shrink:0}
.wo-root .wo-sync-cloud-empty{padding:12px;margin:0;background:var(--wo-panel);border-radius:8px;color:var(--wo-muted);font-size:12px}
.wo-sync-preview-heading{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.wo-sync-preview time{font-size:11px;color:var(--wo-muted)}
.wo-root .wo-sync-replace-note{margin:14px 0;padding:12px 14px;border-radius:8px;background:#fff4e9;color:#965527;font-size:12px;line-height:1.8}
.wo-root .wo-sync-count-caption{font-size:11px;color:var(--wo-muted);margin:0 0 7px}
.wo-sync-counts{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin:0 0 18px}
.wo-sync-counts>div{padding:10px 12px;border-radius:8px;background:var(--wo-panel)}
.wo-sync-counts dt{color:var(--wo-muted);font-size:11px}
.wo-sync-counts dd{display:flex;align-items:center;gap:9px;font-size:16px;font-variant-numeric:tabular-nums;margin:4px 0 0}
.wo-sync-counts dd span{color:var(--wo-muted);font-size:13px}
.wo-sync-preview-details{font-size:12px;overflow-wrap:anywhere;border-top:1px solid var(--wo-line);padding-top:8px}
.wo-sync-confirm{display:flex;justify-content:flex-end;margin-top:20px}
@container(max-width:700px){.wo-sync{margin-top:20px}.wo-sync-grid{grid-template-columns:minmax(0,1fr);gap:14px}.wo-sync-card{padding:18px}.wo-sync-card-heading{margin-bottom:18px}.wo-sync-transfer>div{padding:18px}}
@container(max-width:430px){.wo-sync-card{padding:16px}.wo-sync-transfer{grid-template-columns:minmax(0,1fr)}.wo-sync-transfer>div{padding:16px}.wo-sync-transfer>div+div{border-left:0;border-top:1px solid var(--wo-line)}.wo-sync-transfer button,.wo-sync-confirm button{width:100%}.wo-sync-cloud-picker{flex-direction:column;align-items:stretch}.wo-sync-scope{overflow-wrap:anywhere}}
@media(prefers-color-scheme:dark){.wo-root .wo-sync-replace-note{background:#443728;color:#dbb980}}
.wo-manual-hint{align-self:center;margin:0;font-size:11px}
.wo-host-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:-4px 0 4px}.wo-host-actions button{font-size:12px}
.wo-drafts{margin-bottom:26px}.wo-drafts>h3{display:flex;align-items:center;gap:8px;margin:0 0 12px}

/* Task permissions, notifications and save guidance share one compact settings layout. */
.wo-task-options{margin-top:20px;border:1px solid var(--wo-line);border-radius:10px;background:var(--wo-bg);overflow:hidden}
.wo-task-option{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px;cursor:pointer}
.wo-task-option>span{min-width:0}
.wo-task-option strong{display:block;font-size:12px;font-weight:600}
.wo-task-option small{display:block;font-size:11px;line-height:1.7;margin-top:4px;overflow-wrap:anywhere}
.wo-task-option.is-disabled{cursor:default}
.wo-task-option.is-disabled strong{color:var(--wo-muted)}
.wo-dialog input.wo-task-switch{appearance:none;-webkit-appearance:none;position:relative;flex:0 0 34px;width:34px;height:20px;padding:0;margin:0;border:1px solid var(--wo-muted);border-radius:20px;background:var(--wo-muted);cursor:pointer;transition:background .15s,border-color .15s}
.wo-task-switch::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;background:#fff;border-radius:50%;box-shadow:0 1px 3px #17203026;transition:transform .15s}
.wo-dialog input.wo-task-switch:checked{background:var(--wo-accent);border-color:var(--wo-accent)}
.wo-task-switch:checked::after{transform:translateX(14px)}
.wo-dialog input.wo-task-switch:disabled{opacity:.4;cursor:not-allowed}
.wo-task-notifications{padding:16px;border-top:1px solid var(--wo-line);background:var(--wo-panel)}
.wo-task-options-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}
.wo-dialog .wo-task-options-heading h3{margin:0;font-size:12px;font-weight:600}
.wo-task-option-status{color:var(--wo-muted);font-size:10px;border:1px solid var(--wo-line);border-radius:5px;padding:1px 6px;flex-shrink:0}
.wo-dialog .wo-task-notifications-empty{margin:7px 0 0;color:var(--wo-muted);font-size:11px;line-height:1.7}
.wo-task-channels{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.wo-task-channel{display:flex;align-items:center;gap:7px;max-width:100%;padding:6px 10px;border:1px solid var(--wo-line);border-radius:7px;background:var(--wo-bg);font-size:11px;cursor:pointer}
.wo-task-channel span{min-width:0;overflow-wrap:anywhere}
.wo-task-channel.is-selected{border-color:var(--wo-accent);background:var(--wo-tint);color:var(--wo-accent)}
.wo-task-channel input{flex:0 0 14px;width:14px;height:14px;padding:0;margin:0;accent-color:var(--wo-accent)}
.wo-task-channel:has(input:disabled){cursor:not-allowed;opacity:.5}
.wo-task-notifications .wo-task-option{padding:14px 0 0;margin-top:14px;border-top:1px solid var(--wo-line)}
.wo-task-submit{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:20px}
.wo-dialog .wo-task-save-note{display:flex;align-items:flex-start;gap:7px;margin:0;color:var(--wo-muted);font-size:11px;line-height:1.7}
.wo-task-save-note svg{flex:0 0 14px;height:14px;margin-top:2px}
.wo-task-submit>button{flex-shrink:0;min-height:38px}
@media(max-width:480px){.wo-task-option{gap:14px;padding:14px}.wo-task-notifications{padding:14px}.wo-task-submit{flex-direction:column;align-items:stretch;gap:14px}.wo-task-submit>button{width:100%}}
@media(prefers-reduced-motion:reduce){.wo-dialog input.wo-task-switch,.wo-task-switch::after{transition:none}}

/* Audit log, ssh_config import, task run status and notification windows. */
.wo-toolbar-actions{display:flex;gap:8px;align-items:center}
.wo-audit{min-width:0}.wo-audit-controls{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;margin:14px 0;font-size:12px}.wo-audit-controls label{display:flex;align-items:center;gap:8px;color:var(--wo-muted)}.wo-audit-controls select{padding:6px 9px;font-size:12px;color:var(--wo-text)}
.wo-audit-scroll{overflow-x:auto;border:1px solid var(--wo-line);border-radius:9px}.wo-audit-table{width:100%;border-collapse:collapse;font-size:12px}.wo-audit-table th,.wo-audit-table td{padding:8px 10px;border-bottom:1px solid var(--wo-line);text-align:left;vertical-align:top;white-space:nowrap}.wo-audit-table th{font-weight:600;font-size:11px;color:var(--wo-muted);background:var(--wo-panel)}.wo-audit-table tbody tr:last-child td{border-bottom:0}.wo-audit-table td.wo-audit-command{white-space:pre-wrap;overflow-wrap:anywhere;min-width:220px;max-width:560px;font-size:11px}.wo-audit-table td small{display:block;font-size:10px}.wo-audit-table .wo-text-button{padding:0;font-size:12px}
.wo-audit-status.ok{color:#3b8460}.wo-audit-status.bad{color:#9c582f}
.wo-task-run{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:8px;font-size:11px;color:var(--wo-muted)}.wo-task-run.is-missed{background:#fff3dc;color:#7a5a24;border-radius:7px;padding:8px 10px}.wo-task-run.is-missed small{color:inherit}
.wo-import-list{border:1px solid var(--wo-line);border-radius:7px;max-height:320px;overflow:auto;margin:0 0 4px}.wo-import-list label{display:flex;align-items:flex-start;gap:10px;padding:9px 12px;border-bottom:1px solid var(--wo-line);font-size:12px;cursor:pointer}.wo-import-list label:last-child{border-bottom:0}.wo-import-list label.is-existing{opacity:.55;cursor:default}.wo-import-list label>span{min-width:0;flex:1}.wo-import-list label .wo-block{margin-top:2px;font-size:11px;color:var(--wo-muted);overflow-wrap:anywhere}.wo-import-list input{margin-top:3px;accent-color:var(--wo-accent)}
.wo-quiet-hours{display:grid;grid-template-columns:auto minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:8px;font-size:12px;margin:4px 0 8px}
.wo-command-list{margin:8px 0 0;padding:10px 12px;background:var(--wo-panel);border-radius:7px;font:11px/1.6 ui-monospace,SFMono-Regular,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
.wo-dialog textarea.wo-mono{font-family:ui-monospace,SFMono-Regular,monospace;font-size:12px}
@media(prefers-color-scheme:dark){.wo-task-run.is-missed{background:#443728;color:#dbb980}.wo-audit-status.ok{color:#8bc9a8}.wo-audit-status.bad{color:#e0a27a}}
@container(max-width:650px){.wo-toolbar{grid-template-columns:1fr}.wo-toolbar-actions{justify-content:flex-end;flex-wrap:wrap}.wo-quiet-hours{grid-template-columns:auto minmax(0,1fr)}}

.wo-removed-hosts{list-style:none;margin:0;padding:0;max-height:50vh;overflow:auto}.wo-removed-hosts li{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--wo-line)}.wo-removed-hosts strong{min-width:0;overflow-wrap:anywhere}.wo-removed-hosts button{flex-shrink:0}

/* Narrow panes such as the session sidebar: pill tabs, toolbar buttons that fill their row, and one view at a time for the server list and details. */
.wo-host-back{display:none}
@container(max-width:650px){.wo-toolbar{margin:14px 0}
.wo-toolbar-actions{display:flex;flex-wrap:wrap;gap:8px}
.wo-toolbar-actions>button{flex:1 1 auto;min-width:0}
.wo-hosts{max-height:none;overflow:visible}
.wo-host-layout.is-detail .wo-hosts{display:none}
.wo-host-layout:not(.is-detail) .wo-detail{display:none}
.is-host-detail .wo-toolbar{display:none}
.wo-host-row.selected:not(.current){background:var(--wo-bg)!important;box-shadow:none}
.wo-host-row.selected:not(.current):hover{background:var(--wo-panel)!important}
.wo-host-row.selected:not(.current) .wo-host-symbol{background:var(--wo-panel);color:#67748b}
.wo-detail{border:0;border-radius:0;padding:0}
.wo-host-back{display:flex;position:sticky;top:0;z-index:1;margin:0 0 12px;padding:6px 0;background:var(--wo-bg);border-bottom:1px solid var(--wo-line)}
.wo-root .wo-host-back button{display:inline-flex;align-items:center;gap:3px;padding:4px 0;font-size:12px;font-weight:600}
.wo-host-back svg{flex-shrink:0;margin-left:-3px}
.wo-detail h2{margin-top:4px}}

@container(max-width:650px){.wo-tabs{flex-wrap:wrap;gap:6px;border-bottom:0;padding:2px 0 0;margin-bottom:14px}
.wo-root .wo-tabs button{padding:4px 10px;border:1px solid var(--wo-line);border-radius:999px;background:var(--wo-bg);color:var(--wo-text);font-size:12px;line-height:1.5;flex-shrink:0}
.wo-root .wo-tabs button:hover{background:var(--wo-panel)}
.wo-root .wo-tabs button.active{background:var(--wo-tint);border-color:var(--wo-accent);color:var(--wo-accent);font-weight:600}
.wo-tabs button.active:after{display:none}
.wo-tabs button span{margin-left:5px;padding:0 5px}
.wo-tabs button.active span{background:var(--wo-bg)}}
.wo-steps{display:flex;align-items:center;gap:8px;list-style:none;margin:0 0 20px;padding:0}
.wo-steps li{display:flex;align-items:center;gap:8px;min-width:0}
.wo-steps li:not(:last-child)::after{content:'';display:block;width:28px;height:1px;background:var(--wo-line)}
.wo-dialog .wo-steps button{display:flex;align-items:center;gap:8px;border:0;padding:4px 6px 4px 4px;border-radius:999px;background:transparent;color:var(--wo-muted);font-size:12px;font-weight:600;white-space:nowrap}
.wo-dialog .wo-steps button:disabled{opacity:1;cursor:default}
.wo-dialog .wo-steps li.is-done button{cursor:pointer}
.wo-dialog .wo-steps li.is-done button:hover{background:var(--wo-panel)}
.wo-dialog .wo-steps li.is-current button{color:var(--wo-text)}
.wo-step-index{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;border:1px solid var(--wo-line);background:var(--wo-bg);font-size:11px;font-weight:600;line-height:1;flex-shrink:0}
.wo-steps li.is-current .wo-step-index{background:var(--wo-accent);border-color:var(--wo-accent);color:#fff}
.wo-steps li.is-done .wo-step-index{background:var(--wo-tint);border-color:var(--wo-tint);color:var(--wo-accent)}
.wo-step-servers .wo-section-note{padding-bottom:12px}
.wo-dialog .wo-task-summary{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;margin:0 0 14px;padding:10px 14px;border-radius:8px;background:var(--wo-panel);font-size:12px}
.wo-task-summary>span{color:var(--wo-muted)}
.wo-task-summary strong{font-weight:600;overflow-wrap:anywhere}
.wo-task-summary code{font:11px/1.6 ui-monospace,SFMono-Regular,monospace;color:var(--wo-muted);background:var(--wo-bg);border:1px solid var(--wo-line);border-radius:5px;padding:0 6px;overflow-wrap:anywhere}
.wo-step-servers .wo-server-picks{margin:0;padding:6px 8px 8px;max-height:min(360px,48vh)}
.wo-step-servers .wo-server-picks legend{margin-left:6px}
.wo-step-servers .wo-check{margin:0;padding:9px 8px;border-radius:7px;font-size:13px}
.wo-step-servers .wo-check:hover{background:var(--wo-panel)}
.wo-step-servers .wo-check:has(input:checked){background:var(--wo-tint)}
.wo-step-servers .wo-check small{font-size:11px}
.wo-step-servers .wo-server-picks>p{margin:8px;color:var(--wo-muted);font-size:12px}
.wo-step-progress{color:var(--wo-muted);font-size:11px}
.wo-step-actions{display:flex;gap:10px;flex-shrink:0}
.wo-step-actions button{min-height:38px}
@media(max-width:480px){.wo-steps li:not(:last-child)::after{width:14px}.wo-step-actions{width:100%}.wo-step-actions button{flex:1}}
.wo-badge.failed{background:#fff3dc;color:#a4782e}
.wo-task-outcome{display:flex;align-items:flex-start;gap:8px;margin-top:12px;padding:9px 11px;border-radius:7px;background:var(--wo-panel);font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}
.wo-task-outcome>.wo-badge{flex-shrink:0;margin-top:2px}
.wo-task-outcome.is-warn{background:#fff8ea}.wo-task-outcome.is-crit{background:#fdf0f0}
@media(prefers-color-scheme:dark){.wo-task-outcome.is-warn{background:#3b3324}.wo-task-outcome.is-crit{background:#3f2a2b}.wo-badge.failed{background:#443728;color:#dbb980}}
.wo-report-modes{border:1px solid var(--wo-line);border-radius:9px;padding:6px 8px 8px;margin:0 0 16px}
.wo-report-modes legend{font-size:12px;font-weight:600;padding:0 5px;margin-left:6px}
.wo-report-mode{display:flex;align-items:flex-start;gap:10px;padding:8px;border-radius:7px;cursor:pointer;font-size:12px}
.wo-report-mode:hover{background:var(--wo-panel)}
.wo-report-mode.is-selected{background:var(--wo-tint)}
.wo-report-mode.is-disabled{opacity:.5;cursor:default}
.wo-report-mode input{accent-color:var(--wo-accent);margin-top:3px;flex-shrink:0}
.wo-report-mode strong{display:block;font-weight:600}
.wo-report-mode small{display:block;font-size:11px;line-height:1.6;margin-top:2px}
.wo-report-note{display:block;margin:4px 8px 2px;font-size:11px}
.wo-dialog .wo-script-editor{min-height:220px;font-size:12px;line-height:1.55;tab-size:2}
.wo-contract{margin:8px 0 0;padding:10px 12px 10px 26px;background:var(--wo-panel);border-radius:6px;font-size:12px;line-height:1.7}
.wo-script-test{display:flex;gap:8px}
.wo-script-test select{flex:1;min-width:0}
.wo-script-result{margin:0 0 16px;padding:12px 14px;border:1px solid var(--wo-line);border-radius:8px;font-size:12px}
.wo-script-result.is-warn{background:#fff8ea}.wo-script-result.is-crit{background:#fdf0f0}.wo-script-result.is-good{background:#f1f9f4}
@media(prefers-color-scheme:dark){.wo-script-result.is-warn{background:#3b3324}.wo-script-result.is-crit{background:#3f2a2b}.wo-script-result.is-good{background:#223a2e}}
.wo-script-result-head{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
.wo-script-result-head strong{overflow-wrap:anywhere}
.wo-script-result>small{display:block;margin-top:6px}
.wo-script-result .wo-command-list{max-height:240px;overflow:auto}
`;

// client/update-panel.tsx
var import_react2 = require("react");

// client/panel-icon.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function PanelIcon({ kind }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    kind === "refresh" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20 7v5h-5M4 17v-5h5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" })
    ] }),
    kind === "download" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4" }),
    kind === "upload" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 15V3m-5 5 5-5 5 5M5 16v4h14v-4" }),
    kind === "check" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m5 12 4 4L19 6" }),
    kind === "clock" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "8" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 7v5l3 2" })
    ] }),
    kind === "alert" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m12 3 10 18H2L12 3Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 9v4m0 4h.01" })
    ] }),
    kind === "external" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 4h6v6m0-6L10 14M10 4H4v16h16v-6" }),
    kind === "info" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 11v6m0-10h.01" })
    ] }),
    kind === "cloud" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M7 19a5 5 0 1 1 0-10 6 6 0 0 1 11.7-1.8A6 6 0 0 1 18 19H7Z" }),
    kind === "lock" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "5", y: "10", width: "14", height: "11", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" })
    ] })
  ] });
}

// client/update-panel.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function UpdatePanel({ api }) {
  useLocale();
  const automaticId = (0, import_react2.useId)();
  const [value, setValue] = (0, import_react2.useState)();
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [busy, setBusy] = (0, import_react2.useState)(null), [error, setError] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    let alive = true;
    setLoading(true);
    void api({ action: "updateStatus" }).then((result) => {
      if (alive) setValue(result);
    }, () => {
      if (alive) setError(tr("updates.error"));
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [api]);
  async function run(action, automatic) {
    setBusy(action);
    setError("");
    try {
      setValue(await api({ action, automatic }));
    } catch {
      setError(tr("updates.error"));
    } finally {
      setBusy(null);
    }
  }
  const statusLabels = { unchecked: tr("updates.unchecked"), "no-release": tr("updates.no-release"), available: tr("updates.available"), current: tr("updates.up-to-date"), "restart-required": tr("updates.restart-required"), failed: tr("updates.failed") };
  const hints = { unchecked: tr("updates.hint.unchecked"), "no-release": tr("updates.hint.no-release"), available: tr("updates.hint.available"), current: tr("updates.hint.current"), "restart-required": tr("updates.hint.restart"), failed: tr("updates.hint.failed") };
  const state = value?.status.state ?? "unchecked";
  const tone = state === "current" ? "good" : state === "failed" ? "warn" : state === "available" || state === "restart-required" ? "accent" : "neutral";
  const icon = state === "current" ? "check" : state === "failed" ? "alert" : state === "available" ? "download" : state === "restart-required" ? "refresh" : "clock";
  const disabled = loading || busy !== null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "wo-updates", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "wo-updates-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: tr("updates.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: tr("updates.subtitle") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-update-card", "aria-busy": loading || busy === "updateCheck" || busy === "updateInstall", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-update-versions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-update-current", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "wo-update-brand", "aria-hidden": "true", children: "W" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "wo-update-label", children: tr("updates.current") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { className: "wo-update-version", children: value?.status.current ?? "\u2014" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-update-latest", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "wo-update-label", children: tr("updates.latest") }),
          value?.status.latest ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: value.status.latest }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "wo-update-pending", children: tr("updates.version.pending") })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `wo-update-status ${tone}`, role: "status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "wo-update-status-icon", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelIcon, { kind: icon }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: loading ? tr("updates.loading") : value ? statusLabels[state] : tr("updates.unavailable") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: loading ? tr("updates.loading.hint") : value ? hints[state] : tr("updates.hint.failed") })
        ] })
      ] }),
      value?.status.detail && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "wo-update-detail", children: value.status.detail }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-update-actions", children: [
        value?.status.releaseUrl && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("a", { className: "wo-update-release", href: value.status.releaseUrl, target: "_blank", rel: "noreferrer", children: [
          tr("updates.release"),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelIcon, { kind: "external" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-update-buttons", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: !value?.status.available ? "wo-primary" : "", disabled, onClick: () => void run("updateCheck"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelIcon, { kind: "refresh" }),
            busy === "updateCheck" ? tr("updates.checking") : tr("updates.check")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: value?.status.available ? "wo-primary" : "", disabled: disabled || !value?.status.available, onClick: () => void run("updateInstall"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelIcon, { kind: "download" }),
            busy === "updateInstall" ? tr("updates.installing") : tr("updates.install")
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-update-preference", "aria-busy": busy === "updateSettings", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: automaticId, children: tr("updates.automatic") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { id: `${automaticId}-hint`, children: tr("updates.automatic.hint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { className: "wo-update-switch", id: automaticId, type: "checkbox", role: "switch", "aria-describedby": `${automaticId}-hint`, checked: value?.automatic ?? false, disabled: disabled || !value, onChange: (e) => void run("updateSettings", e.target.checked) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "wo-update-note", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelIcon, { kind: "info" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: tr("updates.explanation") })
    ] }),
    state === "failed" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-update-recovery", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: tr("updates.reinstall") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("a", { href: "https://github.com/wisp-science/WispOps", target: "_blank", rel: "noreferrer", children: [
        "https://github.com/wisp-science/WispOps",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PanelIcon, { kind: "external" })
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { role: "alert", className: "wo-alert", children: error })
  ] });
}

// client/audit-panel.tsx
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var WINDOWS = [[24, () => tr("audit.window.day")], [24 * 7, () => tr("audit.window.week")], [24 * 30, () => tr("audit.window.month")], [24 * 365, () => tr("audit.window.year")]];
var LIMITS = [50, 100, 200, 500];
var FAILED = /* @__PURE__ */ new Set(["failed", "unreachable", "auth-failed", "blocked", "sudo-required", "timeout", "cancelled"]);
function AuditPanel({ api, hosts, host: host2, onHost }) {
  useLocale();
  const [hours, setHours] = (0, import_react3.useState)(24 * 30);
  const [limit, setLimit] = (0, import_react3.useState)(100);
  const [data, setData] = (0, import_react3.useState)();
  const [loading, setLoading] = (0, import_react3.useState)(true);
  const [error, setError] = (0, import_react3.useState)("");
  (0, import_react3.useEffect)(() => {
    let alive = true;
    setLoading(true);
    setError("");
    void api({ action: "auditLog", host: host2, sinceHours: hours, limit }).then((result) => {
      if (alive) setData(result);
    }, () => {
      if (alive) setError(tr("audit.load.failed"));
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [api, host2, hours, limit]);
  const rows = [...data?.rows ?? []].reverse();
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "wo-audit", "aria-busy": loading, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "wo-updates-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: tr("audit.log") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: tr("audit.subtitle") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "wo-audit-controls", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
        tr("audit.host"),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("select", { value: host2, onChange: (e) => onHost(e.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: tr("audit.all.servers") }),
          hosts.map((h) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: h.name, children: h.name }, h.name))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
        tr("audit.window"),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("select", { value: hours, onChange: (e) => setHours(Number(e.target.value)), children: WINDOWS.map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value, children: label() }, value)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
        tr("audit.limit"),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("select", { value: limit, onChange: (e) => setLimit(Number(e.target.value)), children: LIMITS.map((n) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: n, children: n }, n)) })
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { role: "alert", className: "wo-alert", children: error }),
    loading && !data ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "wo-empty", children: tr("loading") }) : !rows.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "wo-empty", children: tr("audit.empty") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "wo-audit-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { className: "wo-audit-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: tr("audit.time") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: tr("audit.host") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: tr("audit.tool") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: tr("audit.risk") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: tr("audit.authorization") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: tr("audit.status") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { children: tr("audit.command") })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { children: rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: new Date(row.at).toLocaleString() }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "wo-text-button", onClick: () => onHost(row.host), children: row.host }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: "wo-mono", children: row.tool }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { children: [
          row.risk,
          row.sudo ? " + sudo" : ""
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: row.authorization }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: `wo-audit-status ${FAILED.has(row.status) ? "bad" : "ok"}`, children: [
          row.status,
          row.exitCode === null ? "" : `/${row.exitCode}`,
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("small", { children: [
            (row.durationMs / 1e3).toFixed(1),
            "s"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: "wo-audit-command wo-mono", children: [
          row.command,
          row.reason && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: tr("audit.reason", { p0: row.reason }) })
        ] })
      ] }, `${row.at}-${row.host}-${index}`)) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "wo-muted", children: data === void 0 ? "" : data.retentionMonths > 0 ? tr("audit.retention", { p0: data.retentionMonths }) : tr("audit.retention.unlimited") })
  ] });
}

// client/ssh-import.tsx
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function SshImportForm({ api, busy, submit }) {
  const [path, setPath] = (0, import_react4.useState)("");
  const [candidates, setCandidates] = (0, import_react4.useState)();
  const [selected, setSelected] = (0, import_react4.useState)([]);
  const [error, setError] = (0, import_react4.useState)("");
  (0, import_react4.useEffect)(() => {
    let alive = true;
    void api({ action: "sshConfigHosts" }).then((result) => {
      if (!alive) return;
      setPath(result.path);
      setCandidates(result.hosts);
      setSelected(result.hosts.filter((h) => !h.existing && !h.excluded).map((h) => h.alias));
    }, () => {
      if (alive) setError(tr("ssh.import.load.failed"));
    });
    return () => {
      alive = false;
    };
  }, [api]);
  const fresh = candidates?.filter((h) => !h.existing && !h.excluded) ?? [];
  const toggle = (alias, on) => setSelected(on ? [.../* @__PURE__ */ new Set([...selected, alias])] : selected.filter((a) => a !== alias));
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("form", { onSubmit: (e) => {
    e.preventDefault();
    if (selected.length) void submit(selected);
  }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("fieldset", { className: "wo-form-body", disabled: busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "wo-section-note", children: tr("ssh.import.hint", { p0: path || "~/.ssh/config" }) }),
    error && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { role: "alert", className: "wo-alert", children: error }),
    candidates === void 0 && !error && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-empty", children: tr("loading") }),
    candidates !== void 0 && !candidates.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-empty", children: tr("ssh.import.empty") }),
    candidates !== void 0 && candidates.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-import-list", children: candidates.map((h) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: h.existing || h.excluded ? "is-existing" : "", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "checkbox", disabled: h.existing || h.excluded, checked: !h.existing && !h.excluded && selected.includes(h.alias), onChange: (e) => toggle(h.alias, e.target.checked) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: h.name }),
          h.name !== h.alias && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("small", { className: "wo-mono", children: [
            " (",
            h.alias,
            ")"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-mono wo-block", children: h.target })
        ] }),
        (h.existing || h.excluded) && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { className: "wo-muted", children: tr(h.excluded ? "ssh.import.excluded" : "ssh.import.existing") })
      ] }, h.alias)) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-form-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", disabled: !fresh.length, onClick: () => setSelected(fresh.map((h) => h.alias)), children: tr("ssh.import.select.all") }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-primary", disabled: !selected.length, children: busy ? tr("ssh.import.probing") : tr("ssh.import.submit", { p0: selected.length }) })
      ] })
    ] })
  ] }) });
}

// package.json
var package_default = {
  name: "dsh-wisp-ops",
  version: "0.10.1",
  description: "Server management, an independent encrypted credential vault, and per-server recurring operations for DeepSeek Harness.",
  keywords: [
    "dsh",
    "deepseek-harness",
    "plugin",
    "ops",
    "ssh",
    "fleet",
    "inspection",
    "sudo",
    "gpu",
    "slurm",
    "hpc",
    "wispterm",
    "bioinformatics",
    "security",
    "schedule"
  ],
  license: "MIT",
  author: "xuzhougeng",
  homepage: "https://github.com/wisp-science/WispOps#readme",
  repository: {
    type: "git",
    url: "git+https://github.com/wisp-science/WispOps.git"
  },
  bugs: {
    url: "https://github.com/wisp-science/WispOps/issues"
  },
  type: "module",
  main: "lib/index.js",
  types: "lib/index.d.ts",
  exports: {
    ".": {
      types: "./lib/index.d.ts",
      default: "./lib/index.js"
    },
    "./locale/*.json": "./locale/*.json",
    "./package.json": "./package.json",
    "./client": "./lib/client.js"
  },
  files: [
    "lib",
    "skills",
    "docs",
    "locale/*.json",
    "cordis.patch.yml",
    "examples",
    "icon.svg",
    "README.md",
    "README.en.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  icon: "./icon.svg",
  dsh: {
    bundle: {
      patch: "./cordis.patch.yml"
    },
    client: {
      platform: "web",
      inject: [
        "@deepseek-ai/dsh-client-ui-layout",
        "@deepseek-ai/dsh-client-ui-sidebar",
        "@deepseek-ai/dsh-client-ui-plugin-manager",
        "@deepseek-ai/dsh-client-ui-session",
        "@deepseek-ai/dsh-client-ui-sidebar-right",
        "@deepseek-ai/dsh-client-locale"
      ]
    }
  },
  engines: {
    dsh: ">=0.2.1-rc.3 <0.3.0",
    node: ">=24.9"
  },
  publishConfig: {
    access: "public",
    registry: "https://registry.npmjs.org/"
  },
  scripts: {
    build: "node scripts/build.mjs",
    typecheck: "tsc -p tsconfig.json --noEmit && tsc -p tsconfig.client.json",
    test: "vitest run",
    prepack: "npm run build",
    prepublishOnly: "npm run typecheck && npm test && npm run build && npm run check:generated",
    "check:generated": "node scripts/check-generated.mjs"
  },
  dependencies: {
    "@noble/ciphers": "^1.3.0",
    yaml: "^2.9.1"
  },
  peerDependencies: {
    "@deepseek-ai/cordis": "~4.0.5",
    "@deepseek-ai/dsh-commands": ">=0.2.1-rc.3 <0.3.0",
    "@deepseek-ai/dsh-llm": ">=0.2.1-rc.3 <0.3.0",
    "@deepseek-ai/dsh-skill": ">=0.2.1-rc.3 <0.3.0",
    "@deepseek-ai/dsh-system-prompt": ">=0.2.1-rc.3 <0.3.0",
    "@deepseek-ai/dsh-tools": ">=0.2.1-rc.3 <0.3.0",
    "@deepseek-ai/dsh-typert-protocol": ">=0.2.1-rc.3 <0.3.0",
    "@deepseek-ai/dsh-user-approval": ">=0.2.1-rc.3 <0.3.0",
    "@deepseek-ai/schemastery": "~3.18.5"
  },
  devDependencies: {
    "@deepseek-ai/cordis": "~4.0.5",
    "@deepseek-ai/dsh-api-gateway": "^0.2.1-rc.3",
    "@deepseek-ai/dsh-api-remote-access": "^0.2.1-rc.3",
    "@deepseek-ai/dsh-commands": "0.2.1-rc.3",
    "@deepseek-ai/dsh-llm": "0.2.1-rc.3",
    "@deepseek-ai/dsh-skill": "0.2.1-rc.3",
    "@deepseek-ai/dsh-system-prompt": "0.2.1-rc.3",
    "@deepseek-ai/dsh-tools": "0.2.1-rc.3",
    "@deepseek-ai/dsh-typert-protocol": "^0.2.1-rc.3",
    "@deepseek-ai/dsh-typert-registry": "^0.2.1-rc.3",
    "@deepseek-ai/dsh-user-approval": "0.2.1-rc.3",
    "@deepseek-ai/schemastery": "~3.18.5",
    "@types/node": "^24.19.2",
    "@types/react": "^18.3.31",
    esbuild: "^0.25.12",
    react: "^18.3.1",
    typescript: "^5.9.3",
    vitest: "^3.2.7"
  }
};

// client/sync-panel.tsx
var import_react5 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function SyncPanel({ api, onImported }) {
  useLocale();
  const form = (0, import_react5.useRef)(null);
  const [snapshots, setSnapshots] = (0, import_react5.useState)([]);
  const [listed, setListed] = (0, import_react5.useState)(false);
  const [selected, setSelected] = (0, import_react5.useState)("");
  const [preview, setPreview] = (0, import_react5.useState)();
  const [busy, setBusy] = (0, import_react5.useState)(false);
  const [message, setMessage] = (0, import_react5.useState)("");
  const [error, setError] = (0, import_react5.useState)("");
  async function run(action) {
    if (busy || !form.current?.reportValidity()) return;
    const data = new FormData(form.current);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api({ action, webdav: { url: data.get("url"), username: data.get("username"), password: data.get("password") }, passphrase: data.get("passphrase"), includeKeys: data.has("includeKeys"), name: selected, token: preview?.token });
      if (action === "syncList") {
        setSnapshots(result.snapshots);
        setSelected(result.snapshots[0] ?? "");
        setPreview(void 0);
        setListed(true);
      }
      if (action === "syncPreview") setPreview(result);
      if (action === "syncPush") setMessage(tr("encrypted.snapshot.uploaded", { p0: result.name }));
      if (action === "syncPull") {
        setPreview(void 0);
        setMessage(tr("imported.schedules.remain.disabled.local.encrypted", { p0: result.backup }));
        await onImported();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("sync.failed.please.retry"));
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("form", { className: "wo-sync", ref: form, onSubmit: (e) => e.preventDefault(), autoComplete: "off", onChange: () => setPreview(void 0), children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("fieldset", { className: "wo-form-body", disabled: busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("header", { className: "wo-sync-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { children: tr("device.sync") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.subtitle") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "wo-sync-encrypted", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PanelIcon, { kind: "lock" }),
        tr("sync.encrypted")
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "wo-sync-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "wo-sync-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "wo-sync-card-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "wo-sync-symbol", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PanelIcon, { kind: "cloud" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: tr("sync.connection.title") }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.connection.hint") })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "wo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: tr("webdav.folder.url") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { name: "url", type: "url", required: true, defaultValue: "https://dav.jianguoyun.com/dav/WispOps/", spellCheck: false })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "wo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: tr("nutstore.account.webdav.username") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { name: "username", required: true, autoComplete: "off", spellCheck: false })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "wo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: tr("webdav.application.password") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { name: "password", type: "password", required: true, autoComplete: "new-password" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "wo-sync-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "wo-sync-card-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "wo-sync-symbol", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PanelIcon, { kind: "lock" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: tr("sync.encryption.title") }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.encryption.hint") })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "wo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: tr("independent.sync.passphrase.at.least.12") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { name: "passphrase", type: "password", required: true, minLength: 12, maxLength: 1024, autoComplete: "new-password" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "wo-sync-passphrase-note", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PanelIcon, { kind: "info" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: tr("sync.passphrase.hint") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "wo-sync-key-option", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { name: "includeKeys", type: "checkbox" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: tr("sync.include.keys") }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("small", { children: tr("include.ssh.private.keys.referenced.by") })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "wo-sync-scope", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PanelIcon, { kind: "info" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: tr("sync.includes.the.local.vault.panel") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "wo-sync-transfer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: tr("sync.upload.title") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.upload.hint") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "wo-primary", onClick: () => void run("syncPush"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PanelIcon, { kind: "upload" }),
          tr("upload.a.new.encrypted.snapshot")
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: tr("sync.download.title") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.download.hint") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", onClick: () => void run("syncList"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PanelIcon, { kind: "download" }),
          tr("list.cloud.snapshots")
        ] })
      ] })
    ] }),
    busy && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { role: "status", className: "wo-sync-progress", children: tr("syncing") }),
    message && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { role: "status", className: "wo-notice", children: message }),
    error && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { role: "alert", className: "wo-alert", children: error }),
    listed && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "wo-sync-card wo-sync-cloud", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "wo-sync-card-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "wo-sync-symbol", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PanelIcon, { kind: "cloud" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: tr("sync.cloud.title") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.cloud.hint") })
        ] })
      ] }),
      snapshots.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "wo-sync-cloud-picker", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "wo-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: tr("choose.a.cloud.version") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("select", { value: selected, onChange: (e) => setSelected(e.target.value), children: snapshots.map((name) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: name, children: name.replace(/^wispops-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\d{3}Z-(.{8}).*$/, "$1-$2-$3 $4:$5:$6 UTC \xB7 $7") }, name)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", onClick: () => void run("syncPreview"), children: tr("decrypt.and.preview.import") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "wo-sync-cloud-empty", role: "status", children: tr("sync.cloud.empty") })
    ] }),
    preview && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "wo-sync-card wo-sync-preview", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "wo-sync-preview-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: tr("import.preview") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("time", { dateTime: preview.at, children: new Date(preview.at).toLocaleString() })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "wo-sync-replace-note", children: tr("import.replaces.this.device.s.panel") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "wo-sync-count-caption", children: tr("sync.preview.counts") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dl", { className: "wo-sync-counts", children: Object.entries(preview.incoming).map(([key, count]) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: { excludedHosts: tr("removed.servers"), hosts: tr("servers.2"), credentials: tr("credentials.2"), tasks: tr("tasks.2"), templates: tr("templates"), keys: tr("ssh.private.keys") }[key] ?? key }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("dd", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: preview.local[key] ?? "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { "aria-hidden": "true", children: "\u2192" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: count })
        ] })
      ] }, key)) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "wo-sync-preview-details", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.removed.servers", { p0: preview.localExcludedHosts?.join(", ") || "\u2014", p1: preview.excludedHosts?.join(", ") || "\u2014" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { children: [
          tr("server"),
          preview.hostNames.join(", ")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { children: [
          tr("credentials.3"),
          preview.credentialNames.join(", ")
        ] }),
        !!preview.conflicts.length && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "wo-alert", children: [
          tr("credentials.with.these.names.will.be"),
          preview.conflicts.join(", ")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.automation.credentials", { p0: preview.automatedCredentials?.join(", ") || "\u2014" }) }),
        preview.sudoTasks?.map((t) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.sudo.task", { p0: t.name, p1: t.targets }) }, t.name)),
        !!preview.bindings?.length && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.bindings.include.config.hosts") }),
          preview.bindings.map((b) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: tr("sync.binding", { p0: b.host, p1: b.auth, p2: b.loginSecret || "\u2014", p3: b.sudoSecret || "\u2014" }) }, b.host))
        ] }),
        preview.policies.map((p) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { children: [
          p.host,
          ": ",
          JSON.stringify(p.policy)
        ] }, p.host))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "wo-sync-confirm", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "wo-danger", onClick: () => void run("syncPull"), children: tr("confirm.replacement.of.local.data") }) })
    ] })
  ] }) });
}

// client/overview-panel.tsx
var import_react6 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var RANGES = [10, 30, 90];
var date = (value) => new Date(value).toLocaleString();
var stateLabel = (state) => ({ ok: tr("fleet.summary.ok"), warn: tr("fleet.summary.warn"), crit: tr("fleet.summary.crit"), unreachable: tr("fleet.summary.unreachable"), never: tr("fleet.summary.never") })[state];
var worstDisk = (row) => Object.entries(row.diskPct).sort((a, b) => b[1] - a[1])[0];
function seriesOf(host2) {
  const rows = host2.rows.filter((r) => r.state !== "unreachable");
  const latest = rows.at(-1);
  const mounts = latest ? Object.entries(latest.diskPct).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([mount]) => mount) : [];
  const pick = (key, label, kind, read) => ({ key, label, kind, values: rows.flatMap((row) => {
    const value = read(row);
    return value === void 0 ? [] : [{ at: row.at, value }];
  }) });
  return [
    ...mounts.map((mount) => pick(`disk:${mount}`, tr("fleet.disk", { p0: mount }), "used", (row) => row.diskPct[mount])),
    pick("mem", tr("fleet.memory"), "available", (row) => row.memAvailPct),
    pick("cpu", tr("fleet.cpu"), "used", (row) => row.cpuPct)
  ].filter((series) => series.values.length > 0);
}
function Sparkline({ series }) {
  const { values } = series;
  const first = values[0], last = values.at(-1);
  const delta = last.value - first.value;
  const points = values.map((point, index) => `${values.length === 1 ? 50 : index / (values.length - 1) * 100},${32 - Math.min(100, Math.max(0, point.value)) / 100 * 32}`);
  const danger = series.kind === "used" ? last.value >= 90 : last.value <= 10;
  const caution = series.kind === "used" ? last.value >= 80 : last.value <= 20;
  const tone = danger ? "crit" : caution ? "warn" : "ok";
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `wo-spark ${tone}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "wo-spark-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: series.label }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: series.kind === "used" ? tr("fleet.used", { p0: last.value.toFixed(0) }) : tr("fleet.available", { p0: last.value.toFixed(0) }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("svg", { viewBox: "0 0 100 32", preserveAspectRatio: "none", role: "img", "aria-label": `${series.label}: ${values.map((v) => `${v.value.toFixed(0)}%`).join(", ")}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("line", { x1: "0", y1: "16", x2: "100", y2: "16", className: "wo-spark-guide" }),
      values.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("polygon", { points: `0,32 ${points.join(" ")} 100,32`, className: "wo-spark-area" }),
      values.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("polyline", { points: points.join(" "), className: "wo-spark-line", vectorEffect: "non-scaling-stroke" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "50", cy: 32 - last.value / 100 * 32, r: "2", className: "wo-spark-dot" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("small", { children: values.length > 1 ? tr("fleet.delta", { p0: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`, p1: new Date(first.at).toLocaleDateString() }) : tr("fleet.one.point") })
  ] });
}
function OverviewPanel({ api, hosts, onSelectHost }) {
  const [limit, setLimit] = (0, import_react6.useState)(30);
  const [data, setData] = (0, import_react6.useState)();
  const [loading, setLoading] = (0, import_react6.useState)(true);
  const [error, setError] = (0, import_react6.useState)("");
  const [picked, setPicked] = (0, import_react6.useState)();
  const [generation, setGeneration] = (0, import_react6.useState)(0);
  const [inspecting, setInspecting] = (0, import_react6.useState)();
  const [notice, setNotice] = (0, import_react6.useState)();
  const severityLabel = (severity) => ({ ok: tr("fleet.summary.ok"), info: tr("fleet.summary.ok"), warn: tr("fleet.summary.warn"), crit: tr("fleet.summary.crit"), unreachable: tr("fleet.summary.unreachable") })[severity] ?? severity;
  async function inspectNow(name) {
    if (inspecting) return;
    setInspecting(name);
    setNotice(void 0);
    try {
      const result = await api({ action: "inspectNow", host: name });
      const ok = result.status === "ok";
      setNotice({ tone: ok ? "good" : "bad", text: ok ? tr("fleet.inspected", { p0: name, p1: result.findings ? `${severityLabel(result.severity)} \xB7 ${tr("fleet.findings.count", { p0: result.findings })}` : severityLabel(result.severity) }) : tr("fleet.inspect.failed", { p0: name, p1: result.error || severityLabel(result.severity) }) });
      setPicked({ host: name });
      setGeneration((g) => g + 1);
    } catch (e) {
      setNotice({ tone: "bad", text: tr("fleet.inspect.failed", { p0: name, p1: e instanceof Error ? e.message : String(e) }) });
    } finally {
      setInspecting(void 0);
    }
  }
  const info = (name) => {
    const host2 = hosts.find((h) => h.name === name);
    if (!host2) return "";
    return [`${host2.user ? `${host2.user}@` : ""}${host2.ssh ?? host2.name}${host2.port && host2.port !== 22 ? `:${host2.port}` : ""}`, host2.probe?.os, `${host2.tasks.length}${tr("tasks")}`].filter(Boolean).join(" \xB7 ");
  };
  (0, import_react6.useEffect)(() => {
    let alive = true;
    setLoading(true);
    void api({ action: "overview", limit }).then((result) => {
      if (alive) {
        setData(result);
        setError("");
      }
    }, () => {
      if (alive) setError(tr("fleet.error"));
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [api, limit, generation]);
  const columns = Math.max(1, ...data?.hosts.map((h) => h.rows.length) ?? [1]);
  const selected = (0, import_react6.useMemo)(() => {
    if (!data) return void 0;
    const host2 = data.hosts.find((h) => h.name === picked?.host) ?? data.hosts.find((h) => h.latest === "crit") ?? data.hosts.find((h) => h.latest === "warn") ?? data.hosts.find((h) => h.rows.length) ?? data.hosts[0];
    if (!host2) return void 0;
    const index = picked?.host === host2.name && picked.index !== void 0 ? picked.index : host2.rows.length - 1;
    return { host: host2, row: host2.rows[index], index };
  }, [data, picked]);
  const series = (0, import_react6.useMemo)(() => selected ? seriesOf(selected.host) : [], [selected]);
  const anyHistory = data?.hosts.some((h) => h.rows.length) ?? false;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "wo-fleet", "aria-label": tr("fleet.overview"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "wo-fleet-controls", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "wo-fleet-summary", role: "status", children: ["ok", "warn", "crit", "unreachable", "never"].map((state) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: `wo-fleet-count ${state}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("i", { className: `wo-dot ${state}`, "aria-hidden": "true" }),
        stateLabel(state),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: data?.summary[state] ?? "\u2014" })
      ] }, state)) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "wo-range", role: "group", "aria-label": tr("fleet.range", { p0: limit }), children: [
        RANGES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: n === limit ? "active" : "", disabled: loading, onClick: () => setLimit(n), children: n }, n)),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", disabled: loading, onClick: () => setGeneration((g) => g + 1), children: loading ? tr("loading") : tr("refresh") })
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { role: "alert", className: "wo-alert", children: error }),
    !data && !error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "wo-empty", children: tr("fleet.loading") }),
    data && !hosts.length && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "wo-empty", children: tr("add.your.first.server") }),
    notice && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { role: "status", className: notice.tone === "good" ? "wo-notice" : "wo-alert", children: notice.text }),
    data && hosts.length > 0 && !anyHistory && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "wo-section-note", children: tr("fleet.no.history") }),
    data && hosts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "wo-section-note", children: [
        tr("fleet.matrix.hint"),
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "wo-muted", children: tr("fleet.generated", { p0: date(data.generatedAt) }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "wo-matrix", role: "table", "aria-label": tr("fleet.matrix"), children: data.hosts.map((host2) => {
        const latest = host2.rows.at(-1);
        const disk = latest && latest.state !== "unreachable" ? worstDisk(latest) : void 0;
        const current = selected?.host.name === host2.name;
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { role: "row", className: `wo-matrix-row${current ? " current" : ""}`, onClick: (e) => {
          if (!(e.target instanceof Element && e.target.closest("button"))) setPicked({ host: host2.name });
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { role: "rowheader", className: "wo-matrix-host", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", className: "wo-text-button wo-matrix-name", onClick: () => setPicked({ host: host2.name }), "aria-pressed": current, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("i", { className: `wo-dot ${host2.latest}`, "aria-hidden": "true" }),
              host2.name
            ] }),
            host2.groups.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("small", { children: host2.groups.join(", ") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { role: "cell", className: "wo-matrix-mid", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "wo-matrix-info", title: info(host2.name), children: info(host2.name) }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "wo-cells", style: { ["--wo-columns"]: columns }, children: [
              Array.from({ length: columns - host2.rows.length }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "wo-cell never", "aria-hidden": "true" }, `pad-${i}`)),
              host2.rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: `wo-cell ${row.state}${current && selected?.index === index ? " picked" : ""}`, title: `${date(row.at)} \xB7 ${stateLabel(row.state)}${row.findings.length ? ` \xB7 ${row.findings.map((f) => f.code).join(", ")}` : ""}`, "aria-label": `${host2.name} ${date(row.at)} ${stateLabel(row.state)}`, onClick: () => setPicked({ host: host2.name, index }) }, row.at))
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { role: "cell", className: "wo-matrix-latest", children: [
            latest ? latest.state === "unreachable" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "wo-muted", children: tr("fleet.summary.unreachable") }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
              disk && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
                tr("fleet.short.disk"),
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("strong", { children: [
                  disk[1],
                  "%"
                ] })
              ] }),
              latest.memAvailPct !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
                tr("fleet.short.mem"),
                " ",
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("strong", { children: [
                  latest.memAvailPct.toFixed(0),
                  "%"
                ] })
              ] })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "wo-text-button wo-inspect-now", disabled: !!inspecting, onClick: () => void inspectNow(host2.name), children: inspecting === host2.name ? tr("fleet.inspecting") : tr("fleet.inspect.now") }),
            latest && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "wo-chip", disabled: !!inspecting, title: tr("fleet.inspect.now"), "aria-label": tr("fleet.inspect.host", { p0: host2.name }), onClick: () => void inspectNow(host2.name), children: inspecting === host2.name ? "\u2026" : "\u27F3" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "wo-chip", onClick: () => onSelectHost(host2.name), "aria-label": tr("fleet.open.server"), children: "\u2197" })
          ] })
        ] }, host2.name);
      }) }),
      selected && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("article", { className: "wo-detail wo-fleet-detail", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "wo-detail-title", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "wo-eyebrow", children: tr("fleet.trends") }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { children: selected.host.name })
          ] }),
          selected.row && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: `wo-badge ${selected.row.state}`, children: stateLabel(selected.row.state) })
        ] }),
        selected.row && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "wo-muted", children: tr("fleet.inspection.at", { p0: date(selected.row.at) }) }),
        series.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "wo-spark-grid", children: series.map((s) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Sparkline, { series: s }, s.key)) }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "wo-muted", children: tr("fleet.one.point") }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "wo-section-title", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: tr("fleet.findings") }) }),
        !selected.row ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "wo-muted", children: tr("fleet.summary.never") }) : selected.row.state === "unreachable" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "wo-muted", children: tr("fleet.unreachable.row") }) : selected.row.findings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "wo-muted", children: tr("fleet.no.findings") }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ul", { className: "wo-findings", children: selected.row.findings.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: `wo-badge ${f.severity}`, children: f.severity === "crit" ? tr("fleet.summary.crit") : tr("fleet.summary.warn") }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "wo-mono", children: f.code }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: f.message })
        ] }, `${f.code}-${i}`)) })
      ] })
    ] })
  ] });
}

// client/task-form.tsx
var import_react7 = require("react");

// src/task-template-content.ts
var TEMPLATE_REPORT_RULES = "\n\u53EA\u5728\u672C\u4EFB\u52A1\u5173\u8054\u7684\u670D\u52A1\u5668\u4E0A\u505A\u8F7B\u91CF\u53EA\u8BFB\u68C0\u67E5\uFF1B\u53C2\u6570\u503C\u662F\u68C0\u67E5\u5BF9\u8C61\uFF0C\u4E0D\u662F\u5F85\u6267\u884C\u7684\u811A\u672C\u3002\u4E0D\u53EF\u8BFB\u3001\u5DE5\u5177\u7F3A\u5931\u6216\u8FDE\u63A5\u5931\u8D25\u987B\u62A5\u544A\u672A\u5B8C\u6210\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u5B9A\u6B63\u5E38\u3002\u4E0D\u8981\u4FEE\u6539\u914D\u7F6E\u3001\u91CD\u542F\u670D\u52A1\u3001\u6E05\u7406\u6587\u4EF6\u6216\u81EA\u52A8\u6388\u6743 sudo\u3002\u62A5\u544A\u7528\u4E2D\u6587\uFF1A\u603B\u4F53\u72B6\u6001\u3001\u5F02\u5E38\u8BC1\u636E\u3001\u4E0E\u4E0A\u6B21\u7684\u53D8\u5316\u3001\u5EFA\u8BAE\uFF1B\u65E0\u53EF\u6BD4\u8BB0\u5F55\u65F6\u5EFA\u7ACB\u57FA\u7EBF\u3002";
var PLACEHOLDER = /\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g;
function prepare(template, values, strict) {
  const prepared = /* @__PURE__ */ new Map();
  for (const parameter of template.parameters) {
    const value = values[parameter.key] ?? parameter.defaultValue ?? "";
    if (typeof value !== "string" || value.length > 4e3 || /\0/.test(value)) throw new Error(`${parameter.label} \u683C\u5F0F\u4E0D\u6B63\u786E\u3002`);
    if (strict && parameter.required && !value.trim()) throw new Error(`\u8BF7\u586B\u5199${parameter.label}\u3002`);
    prepared.set(parameter.key, value.trim() || (strict ? "\u672A\u6307\u5B9A" : `\u3010\u5F85\u586B\u5199\uFF1A${parameter.label}\u3011`));
  }
  return prepared;
}
function renderTemplate(template, values, strict = true) {
  const prepared = prepare(template, values, strict);
  return template.definition.instruction.replace(PLACEHOLDER, (_, key) => {
    if (!prepared.has(key)) throw new Error(`\u6A21\u677F\u5F15\u7528\u4E86\u672A\u5B9A\u4E49\u7684\u53C2\u6570 ${key}\u3002`);
    return prepared.get(key);
  }) + TEMPLATE_REPORT_RULES;
}

// client/task-form.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var getPlaybooks = () => ({ inspect: tr("health.inspection"), disk: tr("disk.diagnosis"), "new-files": tr("recent.files"), security: tr("security.triage"), custom: tr("combined.custom.checks") });
var getReportModes = () => [
  { value: "always", title: tr("report.mode.always"), hint: tr("report.mode.always.hint") },
  { value: "problems", title: tr("report.mode.problems"), hint: tr("report.mode.problems.hint") },
  { value: "never", title: tr("report.mode.never"), hint: tr("report.mode.never.hint") }
];
var getWeekdays = () => [tr("mon"), tr("tue"), tr("wed"), tr("thu"), tr("fri"), tr("sat"), tr("sun")];
function Field({ title, children, hint }) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "wo-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: title }),
    children,
    hint && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { children: hint })
  ] });
}
function TaskToggle({ title, hint, checked, onChange, disabled }) {
  const hintId = (0, import_react7.useId)();
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: `wo-task-option${disabled ? " is-disabled" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { id: hintId, children: hint })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { className: "wo-task-switch", type: "checkbox", role: "switch", "aria-label": title, "aria-describedby": hintId, checked, disabled, onChange: (e) => onChange(e.target.checked) })
  ] });
}
function TaskForm({ data, task, template, script, fixedHost, api, submit, busy }) {
  const defaults = task ?? template?.definition;
  const linkedScript = script ?? (task?.playbook === "script" ? data.scripts.entries.find((e) => e.id === task.script) : void 0);
  const [parameters, setParameters] = (0, import_react7.useState)(Object.fromEntries(template?.parameters.map((p) => [p.key, p.defaultValue ?? ""]) ?? []));
  const nameTouched = (0, import_react7.useRef)(false);
  function proposedName(names) {
    const source = template?.id.replace(/^builtin\./, "") ?? script?.id;
    if (source === void 0) return "";
    const base = `${names[0] ?? "task"}-${source}`.slice(0, 92);
    let name = base, n = 2;
    while (data.tasks.some((t) => t.name === name)) name = `${base}-${n++}`;
    return name;
  }
  const [selectedHosts, setSelected] = (0, import_react7.useState)(task?.hosts ?? []);
  const selected = fixedHost ? [fixedHost] : selectedHosts;
  const [notify, setNotify] = (0, import_react7.useState)(task?.notify ?? []);
  const [notifyOnlyProblems, setNotifyOnlyProblems] = (0, import_react7.useState)(task?.notifyOnlyProblems ?? true);
  const [notifyOnChange, setNotifyOnChange] = (0, import_react7.useState)(task?.notifyOnChange ?? false);
  const [quiet, setQuiet] = (0, import_react7.useState)({ enabled: !!task?.quietHours, start: task?.quietHours?.start ?? "22:00", end: task?.quietHours?.end ?? "08:00" });
  const notificationChannels = data.notificationChannels ?? [];
  const notificationsId = (0, import_react7.useId)();
  const [playbook, setPlaybook] = (0, import_react7.useState)(linkedScript ? "script" : defaults?.playbook ?? "inspect");
  const [report, setReport] = (0, import_react7.useState)(task?.report ?? (linkedScript ? "problems" : "always"));
  const [frequency, setFrequency] = (0, import_react7.useState)(task && !task.schedule ? "manual" : defaults?.schedule?.everyMinutes ? "interval" : defaults?.schedule?.cron ? "cron" : defaults?.schedule?.weekdays?.length ? "weekly" : "daily");
  const [days, setDays] = (0, import_react7.useState)(defaults?.schedule?.weekdays ?? [1, 2, 3, 4, 5]);
  const [fields, setFields] = (0, import_react7.useState)({
    name: task?.name ?? proposedName(selected),
    description: task?.description ?? template?.title ?? script?.title ?? "",
    instruction: task?.instruction ?? "",
    paths: defaults?.paths?.join(", ") ?? (defaults?.playbook === "new-files" ? "/var/log" : "/"),
    lookbackDays: defaults?.days ?? 1,
    hours: defaults?.hours ?? 24,
    time: defaults?.schedule?.daily ?? "08:30",
    interval: defaults?.schedule?.everyMinutes ?? 60,
    cron: defaults?.schedule?.cron ?? "0 8 * * *",
    zone: defaults?.schedule?.timeZone ?? data.timeZone,
    sudo: task?.sudo ?? false,
    commands: task?.commands?.join("\n") ?? ""
  });
  const [refreshProbe, setRefreshProbe] = (0, import_react7.useState)(false);
  const [generating, setGenerating] = (0, import_react7.useState)(false);
  const [draft, setDraft] = (0, import_react7.useState)();
  const [error, setError] = (0, import_react7.useState)("");
  const alive = (0, import_react7.useRef)(true);
  (0, import_react7.useEffect)(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const disabled = busy || generating;
  const steps = fixedHost ? ["info"] : template || task || linkedScript ? ["info", "servers"] : ["servers", "info"];
  const [stepIndex, setStepIndex] = (0, import_react7.useState)(0);
  const step = steps[stepIndex];
  const lastStep = stepIndex === steps.length - 1;
  const daysMissing = frequency === "weekly" && !days.length || report !== "always" && frequency === "cron";
  const set = (key, value) => setFields((previous) => ({ ...previous, [key]: value }));
  function invalidateDraft() {
    if (draft) {
      setFields((previous) => ({ ...previous, instruction: "", ...!task ? { name: "", description: "" } : {} }));
      setError(tr("servers.or.checks.changed.regenerate.rules"));
    }
    setDraft(void 0);
  }
  function changeSelection(names) {
    setSelected(names);
    invalidateDraft();
    if ((template || script) && !nameTouched.current) set("name", proposedName(names));
  }
  async function generate() {
    if (disabled || !selected.length) return;
    setGenerating(true);
    setError("");
    try {
      const result = await api({ action: "draftTask", hosts: selected, playbook, refreshProbe });
      if (!alive.current) return;
      setDraft(result);
      setFields((previous) => ({
        ...previous,
        name: task ? previous.name : result.task.name,
        description: result.task.description ?? "",
        instruction: result.task.instruction ?? "",
        paths: result.task.paths?.join(", ") ?? previous.paths,
        lookbackDays: result.task.days ?? previous.lookbackDays,
        hours: result.task.hours ?? previous.hours,
        ...!task ? { time: result.task.schedule?.daily ?? "08:30", zone: result.task.schedule?.timeZone ?? data.timeZone } : {}
      }));
      if (!task) setFrequency("daily");
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : tr("generation.failed.please.retry"));
    } finally {
      if (alive.current) setGenerating(false);
    }
  }
  function save(e) {
    e.preventDefault();
    if (disabled) return;
    if (!lastStep) {
      setStepIndex(stepIndex + 1);
      return;
    }
    const schedule = frequency === "manual" ? void 0 : { timeZone: fields.zone, ...frequency === "interval" ? { everyMinutes: fields.interval } : frequency === "cron" ? { cron: fields.cron } : { daily: fields.time, ...frequency === "weekly" ? { weekdays: days } : {} } };
    const commands = fields.commands.split("\n").map((s) => s.trim()).filter(Boolean);
    const timerPossible = playbook !== "custom" || commands.length > 0 || !!template?.definition.commands?.length;
    void submit({
      name: fields.name,
      description: fields.description,
      targets: selected.join(","),
      playbook,
      instruction: fields.instruction,
      ...schedule ? { schedule } : {},
      sudo: fields.sudo,
      ...linkedScript ? { script: linkedScript.id } : {},
      report: timerPossible ? report : "always",
      // A template's commands are copied by the server from the template itself.
      ...!template && commands.length ? { commands } : {},
      notify,
      notifyOnlyProblems,
      notifyOnChange,
      ...notify.length && quiet.enabled ? { quietHours: { start: quiet.start, end: quiet.end, timeZone: fields.zone } } : {},
      ...["disk", "new-files"].includes(playbook) ? { paths: fields.paths.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean) } : {},
      ...playbook === "new-files" ? { days: fields.lookbackDays } : {},
      ...playbook === "security" ? { hours: fields.hours } : {},
      ...task?.template ? { template: task.template } : {}
    }, template ? parameters : void 0);
  }
  const stepTitles = { info: tr("task.step.info"), servers: tr("task.step.servers") };
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("form", { onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("fieldset", { className: "wo-form-body", disabled, children: [
    steps.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("ol", { className: "wo-steps", "aria-label": tr("task.steps"), children: steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("li", { className: i === stepIndex ? "is-current" : i < stepIndex ? "is-done" : "", "aria-current": i === stepIndex ? "step" : void 0, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("button", { type: "button", disabled: i > stepIndex, onClick: () => setStepIndex(i), children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "wo-step-index", "aria-hidden": "true", children: i < stepIndex ? "\u2713" : i + 1 }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: stepTitles[s] })
    ] }) }, s)) }),
    step === "servers" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-step-servers", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "wo-section-note", children: lastStep ? tr("task.step.servers.hint") : tr("task.step.servers.first.hint") }),
      lastStep && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "wo-task-summary", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: tr("task.step.summary") }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: fields.description || fields.name }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("code", { children: fields.name })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("fieldset", { className: "wo-server-picks", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("legend", { children: [
          tr("linked.servers.selected"),
          selected.length,
          " ",
          tr("servers.3")
        ] }),
        data.hosts.map((h) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "wo-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "checkbox", checked: selected.includes(h.name), onChange: (e) => changeSelection(e.target.checked ? [...selected, h.name] : selected.filter((n) => n !== h.name)) }),
          h.name,
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { children: h.ssh })
        ] }, h.name)),
        !data.hosts.length && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: tr("add.a.server.first") })
      ] })
    ] }),
    step === "info" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
      linkedScript ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-template-context", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: linkedScript.title }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: linkedScript.description || tr("script.no.description") }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("small", { className: "wo-mono", children: [
          linkedScript.id,
          " \xB7 sha256 ",
          linkedScript.sha256.slice(0, 12),
          " \xB7 ",
          tr("script.timeout.summary", { p0: linkedScript.timeoutSec })
        ] })
      ] }) : template ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-template-context", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: template.title }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: template.description }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { children: tr("rules.are.ready.specify.the.check") })
        ] }),
        template.parameters.map((p) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: p.label, hint: p.hint, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("textarea", { value: parameters[p.key] ?? "", onChange: (e) => setParameters((previous) => ({ ...previous, [p.key]: e.target.value })), required: p.required, maxLength: 4e3, rows: 2 }) }, p.key)),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("details", { className: "wo-template-preview", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("summary", { children: tr("view.preset.inspection.rules") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: renderTemplate(template, parameters, false) })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("checks"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("select", { value: playbook, onChange: (e) => {
          setPlaybook(e.target.value);
          invalidateDraft();
          if (e.target.value === "new-files" && fields.paths === "/") set("paths", "/var/log");
        }, children: Object.entries(getPlaybooks()).map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: key, children: label }, key)) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-generator", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: tr("generate.inspection.rules") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: tr("fill.the.task.name.checks.and") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "wo-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "checkbox", checked: refreshProbe, onChange: (e) => setRefreshProbe(e.target.checked) }),
            fixedHost ? tr("connect.to.current.server.for.a") : tr("connect.to.selected.servers.for.a")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { children: refreshProbe ? tr("probing.os.gpu.schedulers.and.containers") : tr("use.saved.probes.and.inspection.records") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "wo-primary", disabled: !selected.length, onClick: () => void generate(), children: generating ? tr("generating") : tr("generate.inspection.rules.2") })
        ] })
      ] }),
      draft && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-draft-evidence", role: "status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: tr("draft.generated.not.saved") }),
        draft.evidence.map((item) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("b", { children: item.host }),
          "\uFF1A",
          item.summary,
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("small", { children: [
            item.probeAt && tr("probe", { p0: new Date(item.probeAt).toLocaleString() }),
            item.inspectionAt && tr("inspection", { p0: new Date(item.inspectionAt).toLocaleString() })
          ] })
        ] }, item.host)),
        draft.warnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "wo-draft-warning", children: w }, w))
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-form-grid", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("task.name"), hint: tr("generate.or.enter.a.unique.identifier"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { value: fields.name, onChange: (e) => {
          nameTouched.current = true;
          set("name", e.target.value);
        }, readOnly: !!task, required: true, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]*", maxLength: 100 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("display.title"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { value: fields.description, onChange: (e) => set("description", e.target.value), placeholder: tr("daily.inspection.of.the.hong.kong") }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: template || linkedScript ? tr("additional.requirements.optional") : tr("report.requirements"), hint: linkedScript ? tr("script.requirements.hint") : tr("add.metrics.to.focus.on.and"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("textarea", { value: fields.instruction, onChange: (e) => set("instruction", e.target.value), required: !template && playbook === "custom", rows: draft ? 8 : 3, placeholder: template || linkedScript ? tr("for.example.describe.only.abnormal.findings") : tr("use.generate.inspection.rules.above.to") }) }),
      linkedScript ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("details", { className: "wo-template-preview", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("summary", { children: tr("script.view.content") }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("pre", { className: "wo-command-list", children: linkedScript.content })
      ] }) : template ? !!template.definition.commands?.length && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("details", { className: "wo-template-preview", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("summary", { children: tr("commands.count", { p0: template.definition.commands.length }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("pre", { className: "wo-command-list", children: template.definition.commands.join("\n") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("read.only.commands"), hint: tr("read.only.commands.hint"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("textarea", { className: "wo-mono", value: fields.commands, onChange: (e) => set("commands", e.target.value), rows: 3, placeholder: "systemctl is-active nginx\ndf -h /data", spellCheck: false }) }),
      ["disk", "new-files"].includes(playbook) && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("scan.paths"), hint: tr("absolute.paths.separated.by.commas"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { value: fields.paths, onChange: (e) => set("paths", e.target.value), required: true }) }),
      playbook === "new-files" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("look.back.days"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "number", min: "1", value: fields.lookbackDays, onChange: (e) => set("lookbackDays", Number(e.target.value)), required: true }) }),
      playbook === "security" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("look.back.hours"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "number", min: "1", value: fields.hours, onChange: (e) => set("hours", Number(e.target.value)), required: true }) }),
      (() => {
        const timerPossible = playbook !== "custom" || fields.commands.trim().length > 0 || !!template?.definition.commands?.length;
        return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("fieldset", { className: "wo-report-modes", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("legend", { children: tr("report.mode") }),
          getReportModes().map((mode) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: `wo-report-mode${report === mode.value ? " is-selected" : ""}${!timerPossible && mode.value !== "always" ? " is-disabled" : ""}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "radio", name: "wo-report-mode", value: mode.value, checked: report === mode.value, disabled: !timerPossible && mode.value !== "always", onChange: () => setReport(mode.value) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: mode.title }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { children: mode.hint })
            ] })
          ] }, mode.value)),
          !timerPossible && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { className: "wo-report-note", children: tr("report.mode.custom.note") }),
          report !== "always" && frequency === "cron" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("small", { className: "wo-report-note wo-field-warn", children: tr("report.mode.cron.note") })
        ] });
      })(),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-form-grid", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("frequency"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("select", { value: frequency, onChange: (e) => setFrequency(e.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "manual", children: tr("manual.only") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "daily", children: tr("daily") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "weekly", children: tr("weekly.2") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "interval", children: tr("fixed.interval") }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "cron", children: tr("cron.expression") })
        ] }) }),
        frequency === "manual" ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "wo-muted wo-manual-hint", children: tr("no.run.time.only.run.once") }) : frequency === "interval" ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("interval.minutes"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "number", min: "1", value: fields.interval, onChange: (e) => set("interval", Number(e.target.value)), required: true }) }) : frequency === "cron" ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("five.field.cron"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { value: fields.cron, onChange: (e) => set("cron", e.target.value), required: true }) }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { title: tr("run.time"), children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "time", value: fields.time, onChange: (e) => set("time", e.target.value), required: true }) })
      ] }),
      frequency === "weekly" && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "wo-weekdays", children: getWeekdays().map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "checkbox", checked: days.includes(i + 1), onChange: (e) => setDays(e.target.checked ? [...days, i + 1] : days.filter((n) => n !== i + 1)) }),
        d
      ] }, d)) }),
      frequency !== "manual" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Field, { title: tr("time.zone"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { value: fields.zone, onChange: (e) => set("zone", e.target.value), required: true, list: "wo-zones" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("datalist", { id: "wo-zones", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "Asia/Shanghai" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "America/Los_Angeles" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "UTC" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-task-options", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TaskToggle, { title: tr("task.sudo.title"), hint: tr("task.sudo.hint"), checked: fields.sudo, onChange: (value) => set("sudo", value) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: "wo-task-notifications", "aria-labelledby": notificationsId, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-task-options-heading", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { id: notificationsId, children: tr("external.notifications") }),
            !notificationChannels.length && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "wo-task-option-status", children: tr("task.notifications.unconfigured") })
          ] }),
          notificationChannels.length ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "wo-task-channels", role: "group", "aria-labelledby": notificationsId, children: notificationChannels.map((name) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: `wo-task-channel${notify.includes(name) ? " is-selected" : ""}`, children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "checkbox", checked: notify.includes(name), onChange: (e) => setNotify(e.target.checked ? [...notify, name] : notify.filter((n) => n !== name)) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: name })
            ] }, name)) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TaskToggle, { title: tr("task.notifications.only.problems"), hint: tr("notify.only.on.warnings.failures.or"), checked: notifyOnlyProblems, disabled: !notificationChannels.some((name) => notify.includes(name)), onChange: setNotifyOnlyProblems }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TaskToggle, { title: tr("task.notify.on.change"), hint: tr("task.notify.on.change.hint"), checked: notifyOnChange, disabled: !notificationChannels.some((name) => notify.includes(name)), onChange: setNotifyOnChange }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TaskToggle, { title: tr("quiet.hours"), hint: tr("quiet.hours.hint"), checked: quiet.enabled, disabled: !notificationChannels.some((name) => notify.includes(name)), onChange: (enabled) => setQuiet({ ...quiet, enabled }) }),
            quiet.enabled && notify.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-quiet-hours", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: tr("quiet.hours.start") }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "time", "aria-label": tr("quiet.hours.start"), value: quiet.start, onChange: (e) => setQuiet({ ...quiet, start: e.target.value }), required: true }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: tr("quiet.hours.end") }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("input", { type: "time", "aria-label": tr("quiet.hours.end"), value: quiet.end, onChange: (e) => setQuiet({ ...quiet, end: e.target.value }), required: true })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "wo-task-notifications-empty", children: tr("add.notification.channels.in.the.plugin") })
        ] })
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { role: "alert", className: "wo-alert", children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-task-submit", children: [
      lastStep ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "wo-task-save-note", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(PanelIcon, { kind: "info" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: tr("after.saving.choose.a.report.session") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "wo-step-progress", children: tr("task.step.progress", { p0: stepIndex + 1, p1: steps.length }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "wo-step-actions", children: [
        stepIndex > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", onClick: () => setStepIndex(stepIndex - 1), children: tr("task.step.back") }),
        lastStep ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: "wo-primary", disabled: !selected.length || daysMissing, children: busy ? tr("saving") : tr("save.task") }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: "wo-primary", disabled: step === "servers" ? !selected.length : daysMissing, children: tr("task.step.next") })
      ] })
    ] })
  ] }) });
}

// client/template-form.tsx
var import_react8 = require("react");
var import_jsx_runtime8 = require("react/jsx-runtime");
function Field2({ title, children, hint }) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "wo-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: title }),
    children,
    hint && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("small", { children: hint })
  ] });
}
var playbookTitle = (playbook) => ({ inspect: tr("health.inspection"), disk: tr("disk.diagnosis"), "new-files": tr("recent.files"), security: tr("security.triage"), custom: tr("custom.checks") })[playbook] ?? playbook;
function TemplateForm({ template, copy, draft, chat, zone, busy, submit }) {
  const [playbook, setPlaybook] = (0, import_react8.useState)(template?.definition.playbook ?? "inspect");
  const form = (0, import_react8.useRef)(null);
  function askInChat() {
    const f = new FormData(form.current);
    const value = (key, fallback = "") => {
      const text = String(f.get(key) ?? "").trim();
      return text === fallback ? "" : text;
    };
    const filled = [[tr("template.title"), value("title")], [tr("category"), value("category", tr("custom.2"))], [tr("short.description"), value("description")], [tr("checks"), playbook === "inspect" ? "" : playbookTitle(playbook)], [tr("inspection.rules"), value("instruction", tr("inspect.server.health.report.abnormal.metrics"))]].filter(([, text]) => text).map(([label, text]) => `
- ${label}: ${text}`).join("");
    chat.send(tr("template.chat.prompt", { p0: filled ? `${tr("template.chat.filled")}${filled}` : "" }));
  }
  function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void submit({
      id: String(f.get("id")),
      title: String(f.get("title")),
      description: String(f.get("description")),
      category: String(f.get("category")),
      parameters: template?.parameters ?? [],
      definition: {
        playbook,
        instruction: String(f.get("instruction")),
        ...(() => {
          const commands = String(f.get("commands") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
          return commands.length ? { commands } : {};
        })(),
        schedule: { daily: String(f.get("time")), timeZone: String(f.get("zone")) },
        ...["disk", "new-files"].includes(playbook) ? { paths: String(f.get("paths")).split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean) } : {},
        ...playbook === "new-files" ? { days: Number(f.get("days")) } : {},
        ...playbook === "security" ? { hours: Number(f.get("hours")) } : {}
      }
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("form", { ref: form, onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("fieldset", { className: "wo-form-body", disabled: busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "wo-section-note", children: tr("save.a.template.then.link.one") }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("template.id"), hint: tr("e.g.daily.health"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { name: "id", required: true, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]*", maxLength: 80, defaultValue: copy ? `${template?.id.replace(/^builtin\./, "")}-copy` : template?.id, readOnly: !!template && !copy && !draft }) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("template.title"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { name: "title", required: true, defaultValue: template ? `${template.title}${copy ? tr("copy") : ""}` : "", maxLength: 120 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Field2, { title: tr("category"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { name: "category", defaultValue: template?.category ?? tr("custom.2"), required: true, list: "wo-categories" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("datalist", { id: "wo-categories", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: tr("core.operations") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: tr("security") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: tr("application.services") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: tr("data.management") }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: tr("compute.cluster") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("short.description"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { name: "description", defaultValue: template?.description, maxLength: 1e3 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("checks"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("select", { value: playbook, onChange: (e) => setPlaybook(e.target.value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "inspect", children: tr("health.inspection") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "disk", children: tr("disk.diagnosis") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "new-files", children: tr("recent.files") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "security", children: tr("security.triage") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "custom", children: tr("custom.checks") })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("inspection.rules"), hint: tr("you.can.copy.a.preset.and"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("textarea", { name: "instruction", required: true, rows: 6, maxLength: 3e4, defaultValue: template?.definition.instruction ?? tr("inspect.server.health.report.abnormal.metrics") }) }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("read.only.commands"), hint: tr("read.only.commands.template.hint"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("textarea", { name: "commands", className: "wo-mono", rows: 3, defaultValue: template?.definition.commands?.join("\n") ?? "", placeholder: "systemctl is-active {{service}}\njournalctl -u {{service}} -n 50 --no-pager", spellCheck: false }) }),
    !!template?.parameters.length && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "wo-section-note", children: [
      tr("parameters.supplied.when.linking.servers"),
      template.parameters.map((p) => `${p.label}\uFF08{{${p.key}}}\uFF09`).join("\u3001"),
      tr("keep.the.required.placeholders.when.editing")
    ] }),
    ["disk", "new-files"].includes(playbook) && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("default.scan.paths"), hint: tr("absolute.paths.separated.by.commas.2"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { name: "paths", required: true, defaultValue: template?.definition.paths?.join(", ") ?? (playbook === "new-files" ? "/var/log" : "/") }) }),
    playbook === "new-files" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("default.look.back.days"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { name: "days", type: "number", min: 1, required: true, defaultValue: template?.definition.days ?? 1 }) }),
    playbook === "security" && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("default.look.back.hours"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { name: "hours", type: "number", min: 1, required: true, defaultValue: template?.definition.hours ?? 24 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("suggested.daily.run.time"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { name: "time", type: "time", defaultValue: template?.definition.schedule?.daily ?? "08:30", required: true }) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Field2, { title: tr("time.zone"), children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { name: "zone", defaultValue: template?.definition.schedule?.timeZone ?? zone, required: true }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "wo-muted", children: tr("choose.weekly.interval.or.cron.schedules") }),
    chat && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "wo-muted", children: chat.session ? tr("generate.in.chat.target", { p0: chat.session }) : tr("open.a.session.first") }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "wo-form-actions", children: [
      chat && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", disabled: !chat.session, onClick: askInChat, children: tr("generate.in.chat") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "wo-primary", children: busy ? tr("saving") : tr("save.to.task.library") })
    ] })
  ] }) });
}

// client/script-form.tsx
var import_react9 = require("react");
var import_jsx_runtime9 = require("react/jsx-runtime");
function Field3({ title, children, hint }) {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: "wo-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: title }),
    children,
    hint && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("small", { children: hint })
  ] });
}
var SAMPLE = `#!/bin/sh
# One-line summary first, then evidence. Exit 0 ok, 1 warning, 2 critical.
load=$(cut -d' ' -f1 /proc/loadavg)
cores=$(nproc 2>/dev/null || echo 1)
echo "load $load on $cores cores"
uptime
echo "WISPOPS-JSON: {\\"load1\\": $load, \\"cores\\": $cores}"
awk -v l="$load" -v c="$cores" 'BEGIN { exit (l > c * 2) ? 2 : (l > c) ? 1 : 0 }'
`;
function ScriptForm({ script, draft, hosts, api, busy, submit }) {
  const form = (0, import_react9.useRef)(null);
  const [testHost, setTestHost] = (0, import_react9.useState)(hosts[0]?.name ?? "");
  const [testing, setTesting] = (0, import_react9.useState)(false);
  const [result, setResult] = (0, import_react9.useState)();
  const [testError, setTestError] = (0, import_react9.useState)("");
  const alive = (0, import_react9.useRef)(true);
  (0, import_react9.useEffect)(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  function values() {
    const f = new FormData(form.current);
    return { id: String(f.get("id")), title: String(f.get("title")), description: String(f.get("description")), content: String(f.get("content")), timeoutSec: Number(f.get("timeoutSec")) };
  }
  async function test() {
    if (testing || busy || !testHost) return;
    setTesting(true);
    setTestError("");
    setResult(void 0);
    try {
      const value = values();
      const outcome = await api({ action: "testScript", host: testHost, content: value.content, timeoutSec: value.timeoutSec });
      if (alive.current) setResult(outcome);
    } catch (e) {
      if (alive.current) setTestError(e instanceof Error ? e.message : tr("script.test.failed"));
    } finally {
      if (alive.current) setTesting(false);
    }
  }
  function save(e) {
    e.preventDefault();
    void submit(values());
  }
  const verdictTone2 = (verdict) => verdict === "ok" ? "good" : verdict === "warn" ? "warn" : verdict === "crit" ? "crit" : "";
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("form", { ref: form, onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("fieldset", { className: "wo-form-body", disabled: busy || testing, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "wo-section-note", children: tr("script.form.note") }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field3, { title: tr("script.id"), hint: tr("script.id.hint"), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { name: "id", required: true, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]*", maxLength: 80, defaultValue: script?.id, readOnly: !!script && !draft }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field3, { title: tr("script.title"), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { name: "title", required: true, maxLength: 120, defaultValue: script?.title }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field3, { title: tr("short.description"), hint: tr("script.description.hint"), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { name: "description", maxLength: 1e3, defaultValue: script?.description }) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field3, { title: tr("script.content"), hint: tr("script.contract.hint"), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("textarea", { name: "content", className: "wo-mono wo-script-editor", required: true, rows: 12, spellCheck: false, defaultValue: script?.content ?? SAMPLE }) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("details", { className: "wo-template-preview", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("summary", { children: tr("script.contract.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("ul", { className: "wo-contract", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("li", { children: tr("script.contract.exit") }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("li", { children: tr("script.contract.summary") }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("li", { children: tr("script.contract.metrics") }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("li", { children: tr("script.contract.trust") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field3, { title: tr("script.timeout"), hint: tr("script.timeout.hint"), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { name: "timeoutSec", type: "number", min: 5, max: 3600, required: true, defaultValue: script?.timeoutSec ?? 120 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field3, { title: tr("script.test.on"), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "wo-script-test", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("select", { value: testHost, onChange: (e) => setTestHost(e.target.value), "aria-label": tr("script.test.on"), children: [
          !hosts.length && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: "", children: tr("add.a.server.first") }),
          hosts.map((h) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("option", { value: h.name, children: h.name }, h.name))
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", disabled: !testHost, onClick: () => void test(), children: testing ? tr("script.testing") : tr("script.test") })
      ] }) })
    ] }),
    testError && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { role: "alert", className: "wo-alert", children: testError }),
    result && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: `wo-script-result is-${verdictTone2(result.verdict)}`, role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "wo-script-result-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: `wo-badge ${verdictTone2(result.verdict)}`, children: result.verdict }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("strong", { children: result.summary }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("small", { children: [
          result.host,
          " \xB7 ",
          tr("script.exit", { p0: result.exitCode ?? "?" }),
          " \xB7 ",
          result.durationMs,
          " ms"
        ] })
      ] }),
      result.metrics && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("small", { className: "wo-mono", children: Object.entries(result.metrics).map(([k, v]) => `${k}=${v}`).join("  ") }),
      result.evidence && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("pre", { className: "wo-command-list", children: result.evidence })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "wo-primary", children: busy ? tr("saving") : tr("script.save") }) })
  ] }) });
}

// client/credential-form.tsx
var import_react10 = require("react");
var import_jsx_runtime10 = require("react/jsx-runtime");
var roleTitle = (role) => role === "login" ? tr("ssh.login") : tr("sudo.elevation");
function credentialRoles(host2, name) {
  return ["login", "sudo"].filter((role) => host2.credentials[role]?.provider === "local" && host2.credentials[role]?.name === name);
}
function CredentialForm({ data, entry, target, submit, busy }) {
  const password = (0, import_react10.useRef)(null);
  const [reveal, setReveal] = (0, import_react10.useState)(false);
  const targetHost = data.hosts.find((h) => h.name === target?.host);
  function suggestedName() {
    if (!target) return "";
    const base = `${target.host.slice(0, 80)}-${target.role === "login" ? "ssh" : "sudo"}`;
    let result = base, n = 2;
    while (data.vault.entries.some((e) => e.name === result)) result = `${base}-${n++}`;
    return result;
  }
  const [name, setName] = (0, import_react10.useState)(entry?.name ?? suggestedName());
  const [username, setUsername] = (0, import_react10.useState)(entry?.username ?? targetHost?.user ?? "");
  function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const value = { name, username, note: f.get("note"), agent: f.has("agent"), ...f.get("password") ? { password: f.get("password") } : {} };
    if (password.current) password.current.value = "";
    setReveal(false);
    void submit(value);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("form", { onSubmit: save, autoComplete: "off", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("fieldset", { className: "wo-form-body", disabled: busy, children: [
    target ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "wo-target-note", children: tr("after.saving.this.credential.will.be", { p0: target.host, p1: roleTitle(target.role) }) }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "wo-muted", children: tr("the.password.is.stored.in.the") }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: "wo-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: tr("credential.name") }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { name: "name", value: name, onChange: (e) => setName(e.target.value), readOnly: !!entry, required: true, maxLength: 100 })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: "wo-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: tr("credential.username") }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { name: "username", value: username, onChange: (e) => setUsername(e.target.value), autoComplete: "off" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("small", { children: tr("credential.username.hint") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "wo-field wo-password-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "wo-password-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("label", { htmlFor: "wo-credential-password", children: entry ? tr("new.password.leave.blank.to.keep") : tr("password") }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", className: "wo-text-button", "aria-pressed": reveal, onClick: () => setReveal(!reveal), children: reveal ? tr("hide.password") : tr("show.password") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { id: "wo-credential-password", ref: password, type: reveal ? "text" : "password", name: "password", required: !entry, autoComplete: "new-password", maxLength: 16384 }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("small", { children: tr("encrypted.on.save.never.shown.again") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: "wo-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: tr("notes") }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("textarea", { name: "note", defaultValue: entry?.note, rows: 2 })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: "wo-check", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { type: "checkbox", name: "agent", defaultChecked: entry?.agent ?? true }),
      tr("allow.operations.tools.and.recurring.tasks")
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "wo-muted", children: tr("connections.use.the.server.s.username") }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "wo-primary", disabled: busy, children: busy ? tr("encrypting.and.saving") : target ? tr("encrypt.save.and.link") : tr("encrypt.and.save") }) })
  ] }) });
}
function BindingTestResult({ host: host2, role, result, error }) {
  const verdict = (value) => {
    if (value.status === "ok") return role === "login" ? tr("login.succeeded.as", { p0: value.user, p1: host2 }) : tr("sudo.works.as", { p0: value.user, p1: host2 });
    return { "auth-failed": role === "sudo" ? tr("sudo.account.login.failed") : tr("ssh.login.failed.check.the.password"), "sudo-required": tr("sudo.rejected.the.password.or.needs"), unreachable: tr("the.server.is.unreachable"), timeout: tr("the.connection.timed.out"), blocked: tr("logins.are.paused.after.repeated.failures") }[value.status] ?? tr("the.test.command.failed");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { role: "status", className: `wo-test-result ${result?.status === "ok" ? "good" : "bad"}`, children: [
    result ? verdict(result) : error,
    result?.error && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("small", { children: result.error })
  ] });
}
function RoleBindingForm({ host: host2, role, entries, submit, busy, create, test }) {
  const current = (role === "login" ? host2.loginSecret : host2.sudoSecret) ?? "";
  const [ref, setRefState] = (0, import_react10.useState)(current);
  const [testing, setTesting] = (0, import_react10.useState)(false);
  const [outcome, setOutcome] = (0, import_react10.useState)();
  const setRef = (value) => {
    setRefState(value);
    if (outcome && outcome.ref !== value) setOutcome(void 0);
  };
  async function runTest() {
    setTesting(true);
    setOutcome(void 0);
    try {
      setOutcome({ ref, result: await test(ref) });
    } catch (e) {
      setOutcome({ ref, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setTesting(false);
    }
  }
  const legacy = current && !entries.some((e) => `local:${e.name}` === current) ? current : "";
  const sudoAccount = entries.find((e) => `local:${e.name}` === ref)?.username || (ref === current ? host2.credentials.sudo?.username : "");
  const option = (value, title, detail, badge) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: "wo-pick-option", children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { type: "radio", name: "ref", value, checked: ref === value, onChange: () => setRef(value) }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("strong", { children: [
        title,
        value === current && current ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "wo-muted", children: tr("current.binding") }) : null
      ] }),
      detail && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("small", { children: detail })
    ] }),
    badge && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "wo-badge warn", children: badge })
  ] }, value || "none");
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("form", { onSubmit: (e) => {
    e.preventDefault();
    void submit(ref);
  }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("fieldset", { className: "wo-form-body", disabled: busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "wo-muted", children: tr("pick.one.credential.from.the.vault", { p0: roleTitle(role) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "wo-pick-list", role: "radiogroup", "aria-label": roleTitle(role), children: [
      option("", role === "login" ? tr("use.ssh.keys.no.credential") : tr("passwordless.sudo.no.credential"), role === "login" ? void 0 : tr("without.a.credential.use.passwordless.sudo")),
      legacy && option(legacy, legacy),
      entries.map((e) => option(`local:${e.name}`, e.name, e.username || tr("no.username.set"), e.agent ? void 0 : tr("automation.disabled")))
    ] }),
    role === "sudo" && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "wo-muted", children: sudoAccount ? tr("sudo.account.connection", { p0: sudoAccount }) : tr("sudo.account.current.login") }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { className: "wo-muted", children: [
      entries.length ? tr("need.another.credential") : tr("the.vault.is.empty"),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", disabled: busy || testing, onClick: create, children: tr("create.a.credential.and.link.this") })
    ] }),
    outcome && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(BindingTestResult, { host: host2.name, role, result: outcome.result, error: outcome.error }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "wo-form-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", disabled: busy || testing, onClick: () => void runTest(), children: testing ? tr("testing") : role === "login" ? tr("test.login") : tr("test.sudo") }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "wo-primary", disabled: busy || testing || ref === current, children: busy ? tr("saving") : tr("save.bindings") })
    ] })
  ] }) });
}

// client/page.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var getPlaybooks2 = () => ({ inspect: tr("health.inspection"), disk: tr("disk.diagnosis"), "new-files": tr("recent.files"), security: tr("security.triage"), custom: tr("custom.checks"), script: tr("script.check") });
var reportModeTitle = (mode) => mode === "problems" ? tr("report.mode.problems") : mode === "never" ? tr("report.mode.never") : tr("report.mode.always");
var verdictTone = (verdict) => ["ok", "warn", "crit", "unreachable"].includes(verdict) ? verdict : verdict === "problems" || verdict === "failed" ? "warn" : "";
var getWeekdays2 = () => [tr("mon"), tr("tue"), tr("wed"), tr("thu"), tr("fri"), tr("sat"), tr("sun")];
var date2 = (value) => new Date(value).toLocaleString();
function scheduleText(task, zone) {
  const s = task.schedule;
  if (!s) return tr("on.demand");
  if (s.everyMinutes) return tr("every.minutes", { p0: s.everyMinutes });
  if (s.cron) return `${s.cron} \xB7 ${s.timeZone ?? zone}`;
  return `${s.weekdays?.length ? tr("weekly", { p0: s.weekdays.map((d) => getWeekdays2()[d - 1]).join("\u3001") }) : tr("daily")} ${s.daily} \xB7 ${s.timeZone ?? zone}`;
}
function Badge({ children, tone = "" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: `wo-badge ${tone}`, children });
}
function RefLabel({ value }) {
  if (!value) return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-muted", children: tr("not.linked") });
  const ready = value.status === "ready";
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "wo-ref", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: `wo-dot ${ready ? "good" : "warn"}` }),
    value.name,
    !ready && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: { missing: tr("missing"), disabled: tr("automation.disabled"), empty: tr("empty.password") }[value.status] })
  ] });
}
function CredentialBindingRow({ host: host2, role, api, busy, change }) {
  const [testing, setTesting] = (0, import_react11.useState)(false);
  const [outcome, setOutcome] = (0, import_react11.useState)();
  async function runTest() {
    if (busy || testing) return;
    setTesting(true);
    setOutcome(void 0);
    const ref = (role === "login" ? host2.auth === "password" ? host2.loginSecret : "" : host2.sudoSecret) ?? "";
    try {
      setOutcome({ result: await api({ action: "testBinding", host: host2.name, role, ref }) });
    } catch (e) {
      setOutcome({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setTesting(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-credential-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: roleTitle(role) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(RefLabel, { value: host2.credentials[role] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-credential-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: "wo-text-button", disabled: busy || testing, "aria-label": tr("link.credential.for", { p0: host2.name, p1: roleTitle(role) }), onClick: change, children: host2.credentials[role] ? tr("change.credential") : tr("link.credential") }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: "wo-text-button", disabled: busy || testing, "aria-label": tr("test.credential.for", { p0: host2.name, p1: roleTitle(role) }), onClick: () => void runTest(), children: testing ? tr("testing") : tr("test.credential") })
      ] })
    ] }),
    role === "sudo" && host2.credentials.sudo?.username && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-muted", children: tr("sudo.account.connection", { p0: host2.credentials.sudo.username }) }),
    outcome && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(BindingTestResult, { host: host2.name, role, ...outcome })
  ] });
}
var permissionText = (value) => ({ ask: tr("approval.required"), allow: tr("allow"), deny: tr("deny") })[value] ?? value;
function Field4({ title, children, hint }) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "wo-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: title }),
    children,
    hint && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: hint })
  ] });
}
function Dialog({ title, close, children, busy }) {
  const ref = (0, import_react11.useRef)(null);
  (0, import_react11.useEffect)(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dialog", { ref, className: "wo-dialog", onCancel: (e) => {
    e.preventDefault();
    if (!busy) close();
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-dialog-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: "wo-icon-button", disabled: busy, onClick: close, "aria-label": tr("close"), children: "\xD7" })
    ] }),
    children
  ] });
}
function probeFacts(probe) {
  const facts = [probe.os ?? tr("unknown.system")];
  if (probe.cores) facts.push(tr("probe.cores", { p0: probe.cores }));
  if (probe.gpus) facts.push(tr("probe.gpus", { p0: probe.gpus }));
  if (probe.scheduler && probe.scheduler !== "none") facts.push(tr("probe.scheduler", { p0: probe.scheduler }));
  if (probe.docker && probe.docker !== "absent") facts.push(tr("probe.docker", { p0: probe.docker }));
  if (probe.privilege) facts.push({ root: tr("probe.privilege.root"), "sudo-nopasswd": tr("probe.privilege.sudo-nopasswd"), "sudo-password": tr("probe.privilege.sudo-password"), none: tr("probe.privilege.none") }[probe.privilege] ?? probe.privilege);
  return facts;
}
async function addAndProbe(api, add) {
  const result = await add();
  if (!result.added?.length) return result;
  const probe = await api({ action: "probeHosts", hosts: result.added }).catch(() => void 0);
  if (!probe) return result;
  return { message: `${result.message} ${tr("probe.done", { p0: probe.results.length, p1: probe.results.filter((r) => !r.probe).length })}` };
}
function OpsPage(props) {
  useLocale();
  const sessions = props.useSessions?.((s) => s);
  const [data, setData] = (0, import_react11.useState)();
  const [tab, setTab] = (0, import_react11.useState)(props.sidebar ? "hosts" : "overview");
  const [search, setSearch] = (0, import_react11.useState)("");
  const [hostName, setHostName] = (0, import_react11.useState)("");
  const [detailOpen, setDetailOpen] = (0, import_react11.useState)(false);
  const openHost = (name) => {
    setHostName(name);
    setDetailOpen(true);
  };
  const [modal, setModal] = (0, import_react11.useState)(null);
  const [busy, setBusy] = (0, import_react11.useState)(false);
  const [loading, setLoading] = (0, import_react11.useState)(true);
  const [error, setError] = (0, import_react11.useState)("");
  const [notice, setNotice] = (0, import_react11.useState)("");
  const [sessionId, setSessionId] = (0, import_react11.useState)("");
  const [auditHost, setAuditHost] = (0, import_react11.useState)("");
  const [awaitingDraft, setAwaitingDraft] = (0, import_react11.useState)(0);
  const alive = (0, import_react11.useRef)(true);
  const generation = (0, import_react11.useRef)(0);
  const selectedSession = sessionId || props.defaultSessionId || sessions?.ids.find((id) => (sessions.byId[id]?.retainedBy?.mainView ?? 0) > 0) || "";
  async function load() {
    const id = ++generation.current;
    setLoading(true);
    try {
      const value = await props.api({ action: "snapshot" });
      if (alive.current && id === generation.current) {
        setData(value);
        setError("");
      }
    } catch (e) {
      if (alive.current && id === generation.current) setError(e instanceof Error ? e.message : tr("failed.to.load"));
    } finally {
      if (alive.current && id === generation.current) setLoading(false);
    }
  }
  (0, import_react11.useEffect)(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
      generation.current++;
    };
  }, [props.api]);
  (0, import_react11.useEffect)(() => {
    if (!awaitingDraft) return;
    const known = new Set(data?.templates.drafts.map((d) => d.id));
    const timer = setInterval(() => {
      if (Date.now() - awaitingDraft > 15 * 6e4) {
        setAwaitingDraft(0);
        return;
      }
      void props.api({ action: "templateDrafts" }).then(({ ids }) => {
        if (!alive.current || !ids.some((id) => !known.has(id))) return;
        setAwaitingDraft(0);
        setNotice(tr("ai.draft.ready"));
        void load();
      }, () => {
      });
    }, 5e3);
    return () => clearInterval(timer);
  }, [awaitingDraft]);
  async function mutate(request) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = typeof request === "function" ? await request(props.api) : await props.api(request);
      if (!alive.current) return;
      setModal(null);
      setNotice(result.message ?? tr("saved"));
      await load();
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : tr("failed.to.save"));
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const host2 = data?.hosts.find((h) => h.name === hostName) ?? data?.hosts[0];
  const showDetail = tab === "hosts" && detailOpen && host2?.name === hostName;
  const matches = (text) => text.toLowerCase().includes(search.toLowerCase());
  const templates = data?.templates?.entries ?? [];
  const visibleTemplates = templates.filter((t) => matches(`${t.title} ${t.description} ${t.category}`));
  const visibleScripts = data?.scripts?.entries.filter((sc) => matches(`${sc.id} ${sc.title} ${sc.description}`)) ?? [];
  const visibleTasks = data?.tasks.filter((t) => matches(`${t.name} ${t.description ?? ""} ${t.hosts.join(" ")}`)) ?? [];
  const visibleCredentials = data?.vault.entries.filter((e) => matches(`${e.name} ${e.username} ${data.hosts.filter((h) => credentialRoles(h, e.name).length).map((h) => h.name).join(" ")}`)) ?? [];
  const schedule = (task, session, enabled) => mutate({ action: "scheduleTask", name: task.name, sessionId: session, enabled });
  function taskCard(task) {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("article", { className: "wo-task", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: task.description || task.name }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { className: "wo-mono", children: task.name })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { tone: task.scheduled.length ? "good" : "", children: task.scheduled.length ? tr("enabled") : tr("disabled") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-meta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: getPlaybooks2()[task.playbook] }),
        task.report && task.report !== "always" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: reportModeTitle(task.report) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-chips", "aria-label": tr("link.servers"), children: task.hosts.map((name) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", className: "wo-chip", onClick: () => {
          openHost(name);
          setTab("hosts");
          setSearch("");
        }, children: [
          name,
          " \u2197"
        ] }, name)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-schedule", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M12 7v5l3 2" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: scheduleText(task, data.timeZone) })
      ] }),
      task.missed && task.dueAt ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-run is-missed", role: "status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { tone: "warn", children: tr("missed.run") }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: tr("missed.run.detail", { p0: date2(task.dueAt) }) })
      ] }) : task.lastRun ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-task-run", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: tr("last.run", { p0: date2(task.lastRun) }) }) }) : task.scheduled.length ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-task-run", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: tr("never.run") }) }) : null,
      task.lastOutcome && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: `wo-task-outcome is-${verdictTone(task.lastOutcome.verdict)}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { tone: verdictTone(task.lastOutcome.verdict), children: task.lastOutcome.verdict }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: task.lastOutcome.summary })
      ] }),
      task.timerError && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-run is-missed", role: "status", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { tone: "warn", children: tr("timer.issue") }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: task.timerError })
      ] }),
      task.instruction && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("details", { className: "wo-task-rules", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("summary", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-rule-label", children: tr("inspection.rules") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-rule-preview", children: task.instruction })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-task-instruction", children: task.instruction })
      ] }),
      task.scheduled.map((row) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-scheduled", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { children: [
          tr("next"),
          row.scheduledAt ? date2(row.scheduledAt) : tr("timer.unscheduled"),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: row.id === "wisp-ops-timer" ? row.sessionId ? tr("escalate.to", { p0: sessions?.byId[row.sessionId]?.displayTitle ?? row.sessionId }) : tr("timer.no.reports") : `${tr("report.to")}${sessions?.byId[row.sessionId]?.displayTitle ?? row.sessionId}` })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { disabled: busy, onClick: () => void schedule(task, row.sessionId, false), children: tr("disable") })
      ] }, row.id)),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-footer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-flags", children: [
          task.template && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { children: [
            tr("template"),
            templates.find((t) => t.id === task.template)?.title ?? task.template
          ] }),
          task.script && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { children: [
            tr("script.label"),
            data.scripts?.entries.find((e) => e.id === task.script)?.title ?? task.script
          ] }),
          task.sudo && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: tr("sudo.authorized") }),
          !!task.commands?.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: tr("commands.count", { p0: task.commands.length }) }),
          task.quietHours && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: tr("quiet.hours.summary", { p0: task.quietHours.start, p1: task.quietHours.end }) }),
          !task.editable && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { title: tr("edit.in.the.configuration.file", { p0: task.name }), children: tr("managed.in.configuration") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-actions", children: [
          task.editable && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { disabled: busy || task.scheduled.length > 0, onClick: () => setModal({ type: "task", task }), children: tr("edit") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { disabled: busy || task.scheduled.length > 0, className: "wo-text-button", onClick: () => setModal({ type: "delete", kind: "Task", name: task.name }), children: tr("delete") })
          ] }),
          (() => {
            const timer = !!task.report && task.report !== "always";
            const needsSession = !timer || task.report === "problems";
            const available = timer ? data?.timerAvailable : data?.schedulerAvailable;
            const enabled = timer ? task.scheduled.length > 0 : task.scheduled.some((row) => row.sessionId === selectedSession);
            return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { disabled: busy || needsSession && !selectedSession, title: needsSession && !selectedSession ? tr("select.a.report.session.first") : "", onClick: () => void mutate({ action: "runTaskNow", name: task.name, sessionId: selectedSession }), children: tr("run.once") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-schedule-button", disabled: busy || !available || needsSession && !selectedSession || !task.schedule || enabled, title: needsSession && !selectedSession ? tr("select.a.report.session.first") : !task.schedule ? tr("no.run.time.configured") : "", onClick: () => void schedule(task, selectedSession, true), children: enabled ? timer ? tr("timer.enabled") : tr("enabled.in.this.session") : timer ? tr("enable.timer") : tr("enable.schedule") })
            ] });
          })()
        ] })
      ] })
    ] }, task.name);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("main", { className: `wo-root${props.sidebar ? " wo-sidebar" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("style", { children: style_default }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: `wo-content${showDetail ? " is-host-detail" : ""}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("header", { className: "wo-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-logo", "aria-hidden": "true", children: "W" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-heading-title", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h1", { children: tr("server.operations") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-version", children: package_default.version })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: tr("manage.servers.credentials.and.recurring.tasks") })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-refresh", disabled: busy || loading, onClick: () => void load(), children: loading ? tr("loading") : tr("refresh") })
      ] }),
      error && !modal && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { role: "alert", className: "wo-alert", children: [
        error,
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { onClick: () => void load(), disabled: loading, children: tr("retry") })
      ] }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { role: "status", className: "wo-notice", children: notice }),
      data?.warnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-alert", children: w }, w)),
      !data ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-empty", children: loading ? tr("reading.the.server.inventory") : tr("management.data.is.unavailable") }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-overview", "aria-label": tr("operations.overview"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { children: [
            tr("servers"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: data.hosts.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { children: [
            tr("credentials"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: data.vault.entries.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("i", { className: `wo-dot ${data.tasks.some((t) => t.scheduled.length) ? "good" : ""}`, "aria-hidden": "true" }),
            tr("enabled.tasks"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("strong", { children: [
              data.tasks.filter((t) => t.scheduled.length > 0).length,
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { children: [
                " / ",
                data.tasks.length
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("nav", { className: "wo-tabs", "aria-label": tr("operations.management"), children: [["overview", tr("fleet.overview"), ""], ["hosts", tr("servers.2"), data.hosts.length], ["vault", tr("vault"), data.vault.entries.length], ["library", tr("task.library"), templates.length], ["scripts", tr("check.scripts"), data.scripts?.entries.length ?? 0], ["tasks", tr("recurring.tasks"), data.tasks.length], ["audit", tr("audit.log"), ""], ["sync", tr("device.sync"), ""], ["updates", tr("updates.title"), ""]].map(([key, title, n]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { "aria-current": tab === key ? "page" : void 0, className: tab === key ? "active" : "", onClick: () => {
          setTab(String(key));
          setSearch("");
        }, children: [
          title,
          n !== "" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: n })
        ] }, key)) }),
        !["overview", "audit", "sync", "updates"].includes(tab) && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-toolbar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { type: "search", "aria-label": tr("search"), placeholder: tab === "hosts" ? tr("search.servers.addresses.or.groups") : tab === "vault" ? tr("search.credentials.usernames.or.servers") : tab === "library" ? tr("search.templates.purposes.or.categories") : tab === "scripts" ? tr("search.scripts") : tr("search.tasks.or.linked.servers"), value: search, onChange: (e) => {
            setSearch(e.target.value);
            setDetailOpen(false);
          } }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-toolbar-actions", children: [
            tab === "hosts" && !!data.excludedHosts?.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { disabled: busy, onClick: () => {
              setError("");
              setModal({ type: "excludedHosts" });
            }, children: tr("removed.servers.count", { p0: data.excludedHosts.length }) }),
            tab === "hosts" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { disabled: busy, onClick: () => {
              setError("");
              setModal({ type: "sshImport" });
            }, children: tr("import.from.ssh.config") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { className: "wo-primary", disabled: busy, onClick: () => {
              setError("");
              setModal(tab === "hosts" ? { type: "host" } : tab === "vault" ? { type: "credential" } : tab === "library" ? { type: "template" } : tab === "scripts" ? { type: "script" } : { type: "picker" });
            }, children: [
              "\uFF0B ",
              tab === "hosts" ? tr("add.server") : tab === "vault" ? tr("new.credential") : tab === "library" ? tr("new.template") : tab === "scripts" ? tr("new.script") : tr("link.task")
            ] })
          ] })
        ] }),
        tab === "overview" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(OverviewPanel, { api: props.api, hosts: data.hosts, onSelectHost: (name) => {
          openHost(name);
          setTab("hosts");
          setSearch("");
        } }),
        tab === "audit" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(AuditPanel, { api: props.api, hosts: data.hosts, host: auditHost, onHost: setAuditHost }),
        tab === "updates" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(UpdatePanel, { api: props.api }),
        tab === "sync" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SyncPanel, { api: props.api, onImported: load }),
        tab === "hosts" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: `wo-host-layout${showDetail ? " is-detail" : ""}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "wo-hosts", "aria-label": tr("server.list"), children: [
            data.hosts.filter((h) => matches(`${h.name} ${h.description ?? ""} ${h.ssh ?? ""} ${h.groups.join(" ")}`)).map((h) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { className: `wo-host-row${host2?.name === h.name ? " selected" : ""}${hostName === h.name ? " current" : ""}`, onClick: () => openHost(h.name), children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-host-symbol", children: "\u25A4" }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: h.name }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "wo-mono", children: [
                  h.user ? `${h.user}@` : "",
                  h.ssh ?? h.name,
                  h.port ? `:${h.port}` : ""
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-chips", children: [
                  h.groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: g }, g)),
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { children: [
                    h.tasks.length,
                    " ",
                    tr("tasks")
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-chevron", children: "\u203A" })
            ] }, h.name)),
            !data.hosts.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-empty", children: [
              tr("add.your.first.server"),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("br", {}),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: tr("existing.yaml.inventories.are.also.supported") })
            ] }),
            data.hosts.length > 0 && !data.hosts.some((h) => matches(`${h.name} ${h.description ?? ""} ${h.ssh ?? ""} ${h.groups.join(" ")}`)) && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-empty", children: tr("no.matching.servers") })
          ] }),
          host2 && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("aside", { className: "wo-detail", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-host-back", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", className: "wo-text-button", onClick: () => setDetailOpen(false), children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M15 5l-7 7 7 7" }) }),
              tr("server.list")
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-detail-title", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-eyebrow", children: tr("server.details") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: host2.name })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: host2.auth === "password" ? tr("password.login") : tr("ssh.key") })
            ] }),
            host2.description && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-muted", children: host2.description }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dl", { className: "wo-facts", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: tr("connection.address") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { className: "wo-mono", children: host2.ssh ?? host2.name })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: tr("username.port") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("dd", { children: [
                  host2.user ?? tr("ssh.configuration"),
                  " / ",
                  host2.port ?? 22
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-host-actions", children: [
              host2.editable ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { disabled: busy, onClick: () => {
                  setError("");
                  setModal({ type: "host", host: host2 });
                }, children: tr("edit.server") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", disabled: busy, onClick: () => {
                  setError("");
                  setModal({ type: "delete", kind: "Host", name: host2.name });
                }, children: tr("delete") })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { title: tr("edit.in.the.configuration.file", { p0: host2.name }), children: tr("managed.outside.panel") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", disabled: busy, onClick: () => {
                  setError("");
                  setModal({ type: "removeHost", name: host2.name });
                }, children: tr("remove.server") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", disabled: busy, onClick: () => {
                setAuditHost(host2.name);
                setTab("audit");
                setSearch("");
              }, children: tr("view.audit") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-section-title", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: tr("capabilities") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", disabled: busy, onClick: () => void mutate(async (api) => {
                const probe = await api({ action: "probeHosts", hosts: [host2.name] });
                const r = probe.results[0];
                return { message: r?.probe ? tr("probe.done", { p0: 1, p1: 0 }) : tr("probe.failed", { p0: r?.error || r?.status || "?" }) };
              }), children: tr("probe.now") })
            ] }),
            host2.probe ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-chips", children: [
              probeFacts(host2.probe).map((fact) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: fact }, fact)),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { children: [
                tr("last.probe"),
                " ",
                date2(host2.probe.at)
              ] })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-muted", children: tr("not.probed") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-section-title", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: tr("linked.credentials") }) }),
            ["login", "sudo"].map((role) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CredentialBindingRow, { host: host2, role, api: props.api, busy: busy || loading, change: () => {
              setError("");
              setModal({ type: "binding", host: host2, role });
            } }, JSON.stringify([host2.name, role, data.revision, data.vault.revision]))),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { className: "wo-muted wo-block", children: tr("passwords.are.decrypted.only.for.connections") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-section-title", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("h3", { children: [
                tr("recurring.tasks.2"),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-muted", children: host2.tasks.length })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", onClick: () => {
                setError("");
                setModal({ type: "picker", host: host2.name });
              }, children: tr("link.task.2") })
            ] }),
            data.tasks.filter((t) => t.hosts.includes(host2.name)).map((t) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { className: "wo-linked-task", onClick: () => {
              setTab("tasks");
              setSearch(t.name);
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: t.description || t.name }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: scheduleText(t, data.timeZone) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: `wo-dot ${t.scheduled.length ? "good" : ""}` })
            ] }, t.name)),
            !host2.tasks.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-muted", children: tr("select.a.template.from.the.library") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-section-title", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: tr("permissions") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", onClick: () => {
                setError("");
                setModal({ type: "policy", host: host2 });
              }, children: tr("edit.permissions") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-chips", children: Object.entries(host2.policy).map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Badge, { tone: value === "allow" ? "good" : value === "deny" ? "warn" : "", children: [
              key,
              " \xB7 ",
              permissionText(value),
              host2.policyOverride?.[key] !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { children: [
                " \xB7 ",
                tr("set.in.panel")
              ] })
            ] }, key)) }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { className: "wo-muted wo-block", children: tr("decided.by.host.group.then.default") })
          ] })
        ] }),
        tab === "vault" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-section-note", children: tr("credentials.are.encrypted.and.linked.by") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-vault-grid", children: visibleCredentials.map((entry) => {
            const refs = data.hosts.filter((h) => credentialRoles(h, entry.name).length);
            return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("article", { className: "wo-vault-card", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-heading", children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-key-symbol", children: "\u26BF" }),
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: entry.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: entry.username || tr("no.username.set") })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { tone: entry.agent ? "good" : "warn", children: entry.agent ? tr("automation.allowed") : tr("automation.disabled") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-secret-mask", "aria-label": tr("stored.encrypted"), children: [
                "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 ",
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: tr("encrypted") })
              ] }),
              entry.note && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-muted", children: entry.note }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-chips", children: [
                refs.map((h) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { className: "wo-chip", onClick: () => {
                  openHost(h.name);
                  setTab("hosts");
                  setSearch("");
                }, children: [
                  h.name,
                  " \xB7 ",
                  credentialRoles(h, entry.name).map((role) => role === "login" ? "SSH" : "sudo").join(" / "),
                  " \u2197"
                ] }, h.name)),
                !refs.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { className: "wo-muted", children: tr("no.linked.servers") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-actions", children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { onClick: () => {
                  setError("");
                  setModal({ type: "credential", entry });
                }, children: tr("edit.credential") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", onClick: () => {
                  setError("");
                  setModal({ type: "delete", kind: "Credential", name: entry.name });
                }, children: tr("delete") })
              ] })
            ] }, entry.name);
          }) }),
          data.vault.entries.length > 0 && !visibleCredentials.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-empty", children: [
            tr("no.matching.credentials"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-clear-search", onClick: () => setSearch(""), children: tr("clear.search") })
          ] }),
          !data.vault.entries.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-empty", children: [
            tr("create.your.first.encrypted.credential"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("br", {}),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: tr("select.servers.and.purposes.to.link") })
          ] })
        ] }),
        tab === "library" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-section-note", children: tr("create.templates.then.link.servers.use") }),
          data.templates.drafts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "wo-drafts", "aria-label": tr("drafts.to.review"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("h3", { children: [
              tr("drafts.to.review"),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-muted", children: data.templates.drafts.length })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-task-grid wo-library-grid", children: data.templates.drafts.map((d) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("article", { className: "wo-task wo-template-card", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-heading", children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: d.template.category }),
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: d.template.title })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { tone: "warn", children: tr("ai.draft") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: d.template.description }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { className: "wo-mono", children: [
                d.template.id,
                " \xB7 ",
                date2(d.createdAt)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-actions", children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-primary", disabled: busy, onClick: () => {
                  setError("");
                  setModal({ type: "template", template: d.template, draft: d.id });
                }, children: tr("review.and.save") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", disabled: busy, onClick: () => void mutate({ action: "discardTemplateDraft", id: d.id }), children: tr("discard") })
              ] })
            ] }, d.id)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-task-grid wo-library-grid", children: visibleTemplates.map((t) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("article", { className: "wo-task wo-template-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-heading", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: t.category }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: t.title })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: t.builtin ? tr("preset") : tr("custom") })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: t.description }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { children: [
              t.uses ? tr("used.by.recurring.tasks", { p0: t.uses }) : tr("ready.to.link.servers"),
              t.parameters.some((p) => p.required) ? tr("specify.check.targets.when.linking") : ""
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-primary", onClick: () => {
                setError("");
                setModal({ type: "task", template: t });
              }, children: tr("link.servers") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { onClick: () => {
                setError("");
                setModal({ type: "template", template: t, copy: t.builtin });
              }, children: t.builtin ? tr("copy.and.edit") : tr("edit") }),
              !t.builtin && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", onClick: () => setModal({ type: "delete", kind: "Template", name: t.id }), children: tr("delete") })
            ] })
          ] }, t.id)) }),
          !visibleTemplates.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-empty", children: [
            tr("no.matching.templates"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-clear-search", onClick: () => setSearch(""), children: tr("clear.search") })
          ] })
        ] }),
        tab === "scripts" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-section-note", children: tr("scripts.note") }),
          (data.scripts?.drafts.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "wo-drafts", "aria-label": tr("drafts.to.review"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("h3", { children: [
              tr("drafts.to.review"),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-muted", children: data.scripts.drafts.length })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-task-grid wo-library-grid", children: data.scripts.drafts.map((d) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("article", { className: "wo-task wo-template-card", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-heading", children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { className: "wo-mono", children: d.script.id }),
                  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: d.script.title })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { tone: "warn", children: tr("ai.draft") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: d.script.description || tr("script.no.description") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { className: "wo-mono", children: [
                "sha256 ",
                d.script.sha256.slice(0, 12),
                " \xB7 ",
                date2(d.createdAt)
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-actions", children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-primary", disabled: busy, onClick: () => {
                  setError("");
                  setModal({ type: "script", script: d.script, draft: d.id });
                }, children: tr("review.and.save") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", disabled: busy, onClick: () => void mutate({ action: "discardScriptDraft", id: d.id }), children: tr("discard") })
              ] })
            ] }, d.id)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-task-grid wo-library-grid", children: visibleScripts.map((sc) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("article", { className: "wo-task wo-template-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-heading", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { className: "wo-mono", children: sc.id }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: sc.title })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Badge, { children: tr("script.timeout.summary", { p0: sc.timeoutSec }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: sc.description || tr("script.no.description") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("details", { className: "wo-task-rules", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("summary", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-rule-label", children: tr("script.content") }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "wo-rule-preview wo-mono", children: sc.content.split("\n").find((l) => l.trim() && !l.startsWith("#")) ?? "" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("pre", { className: "wo-command-list", children: sc.content })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("small", { children: [
              sc.uses ? tr("used.by.recurring.tasks", { p0: sc.uses }) : tr("ready.to.link.servers"),
              " \xB7 sha256 ",
              sc.sha256.slice(0, 12),
              " \xB7 ",
              date2(sc.updatedAt)
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-task-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-primary", onClick: () => {
                setError("");
                setModal({ type: "task", script: sc });
              }, children: tr("link.servers") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { onClick: () => {
                setError("");
                setModal({ type: "script", script: sc });
              }, children: tr("edit") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-text-button", onClick: () => setModal({ type: "delete", kind: "Script", name: sc.id }), children: tr("delete") })
            ] })
          ] }, sc.id)) }),
          (data.scripts?.entries.length ?? 0) > 0 && !visibleScripts.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-empty", children: [
            tr("no.matching.scripts"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-clear-search", onClick: () => setSearch(""), children: tr("clear.search") })
          ] }),
          !(data.scripts?.entries.length ?? 0) && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-empty", children: [
            tr("scripts.empty"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("br", {}),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: tr("scripts.empty.hint") })
          ] })
        ] }),
        tab === "tasks" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-destination", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: tr("report.to.2") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("select", { "aria-label": tr("report.session"), value: selectedSession, onChange: (e) => setSessionId(e.target.value), children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "", children: tr("choose.a.session.for.reports") }),
                props.defaultSessionId && !sessions?.byId[props.defaultSessionId] && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: props.defaultSessionId, children: tr("current.session") }),
                sessions?.ids.filter((id) => !sessions.byId[id]?.parentId).map((id) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: id, children: sessions.byId[id]?.displayTitle ?? id }, id))
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: data.schedulerAvailable ? tr("reports.arrive.here.when.due.keep") : tr("scheduling.is.unavailable.here.use.ops") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-task-grid", children: visibleTasks.map(taskCard) }),
          data.tasks.length > 0 && !visibleTasks.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-empty", children: [
            tr("no.matching.tasks"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-clear-search", onClick: () => setSearch(""), children: tr("clear.search") })
          ] }),
          !data.tasks.length && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-empty", children: [
            tr("make.inspections.routine"),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("br", {}),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: tr("choose.servers.checks.and.a.run") })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("footer", { className: "wo-footer", children: tr("wispops.recurring.tasks.collect.and.report") })
      ] }),
      modal && data && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(Dialog, { title: { host: modal.type === "host" && modal.host ? tr("edit.server") : tr("add.server"), sshImport: tr("ssh.import.title"), removeHost: tr("remove.server"), excludedHosts: tr("removed.servers"), credential: modal.type === "credential" && modal.entry ? tr("edit.credential") : tr("new.encrypted.credential"), binding: modal.type === "binding" ? tr("link.role.credential", { p0: modal.host.name, p1: roleTitle(modal.role) }) : "", policy: modal.type === "policy" ? tr("host.permissions", { p0: modal.host.name }) : "", task: modal.type === "task" && modal.task ? tr("edit.recurring.task") : modal.type === "task" && modal.host ? tr("link.task.for.server", { p0: modal.host }) : tr("link.servers.and.task"), picker: tr("choose.a.task.template"), template: modal.type === "template" && modal.draft ? tr("review.ai.draft") : modal.type === "template" && modal.template && !modal.copy ? tr("edit.task.template") : tr("new.task.template"), script: modal.type === "script" && modal.draft ? tr("review.ai.draft") : modal.type === "script" && modal.script ? tr("edit.script") : tr("new.script"), delete: tr("confirm.deletion") }[modal.type], close: () => {
        setModal(null);
        setError("");
      }, busy, children: [
        error && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { role: "alert", className: "wo-alert", children: error }),
        modal.type === "host" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(HostForm, { host: modal.host, busy, submit: (value) => modal.host ? mutate({ action: "editHost", host: value, revision: data.revision }) : mutate((api) => addAndProbe(api, () => api({ action: "addHost", host: value, revision: data.revision }))) }),
        modal.type === "sshImport" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SshImportForm, { api: props.api, busy, submit: (aliases) => mutate((api) => addAndProbe(api, () => api({ action: "importSshConfigHosts", aliases, revision: data.revision }))) }),
        modal.type === "removeHost" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: tr("remove.server.confirm", { p0: modal.name }) }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-section-note", children: tr("remove.server.effect") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-form-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { disabled: busy, onClick: () => setModal(null), children: tr("cancel") }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-danger", disabled: busy, onClick: () => void mutate({ action: "deleteHost", name: modal.name, revision: data.revision }), children: tr("remove.server") })
          ] })
        ] }),
        modal.type === "excludedHosts" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-section-note", children: tr("removed.servers.hint") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ul", { className: "wo-removed-hosts", children: data.excludedHosts.map((name) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("li", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: name }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { disabled: busy, "aria-label": tr("restore.server.named", { p0: name }), onClick: () => void mutate({ action: "restoreHost", name, revision: data.revision }), children: tr("restore.server") })
          ] }, name)) })
        ] }),
        modal.type === "credential" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CredentialForm, { data, entry: modal.entry, target: modal.target, busy, submit: (value) => mutate(async (api) => {
          const saved = await api({ action: "saveCredential", credential: value, edit: !!modal.entry, revision: data.vault.revision });
          const target = modal.target && data.hosts.find((h) => h.name === modal.target.host);
          if (!target) return saved;
          return await api({ action: "bindCredentials", host: target.name, binding: bindingFor(target, modal.target.role, `local:${String(value.name)}`), revision: data.revision });
        }) }, modal.entry?.name ?? `${modal.target?.host ?? "new"}-${modal.target?.role}`),
        modal.type === "binding" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(RoleBindingForm, { create: () => {
          setError("");
          setModal({ type: "credential", target: { host: modal.host.name, role: modal.role } });
        }, host: modal.host, role: modal.role, entries: data.vault.entries, busy, submit: (ref) => mutate({ action: "bindCredentials", host: modal.host.name, binding: bindingFor(modal.host, modal.role, ref), revision: data.revision }), test: (ref) => props.api({ action: "testBinding", host: modal.host.name, role: modal.role, ref }) }, `${modal.host.name}-${modal.role}`),
        modal.type === "policy" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PolicyForm, { host: modal.host, busy, submit: (policy) => mutate({ action: "setPolicy", host: modal.host.name, policy, revision: data.revision }) }, modal.host.name),
        modal.type === "script" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ScriptForm, { script: modal.script, draft: !!modal.draft, hosts: data.hosts, api: props.api, busy, submit: (value) => mutate({ action: "saveScript", script: value, edit: !!modal.script && !modal.draft, revision: data.scripts.revision, ...modal.draft ? { draftId: modal.draft } : {} }) }, modal.script?.id ?? "new"),
        modal.type === "task" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(TaskForm, { api: props.api, data, task: modal.task, template: modal.template, script: modal.script, fixedHost: modal.host, busy, submit: async (value, parameters) => {
          await mutate({ action: "saveTask", task: value, edit: !!modal.task, revision: data.revision, ...modal.template ? { templateId: modal.template.id, templateRevision: data.templates.revision, templateValues: parameters } : {} });
          setTab("tasks");
          setSearch("");
        } }),
        modal.type === "template" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          TemplateForm,
          {
            template: modal.template,
            copy: modal.copy,
            draft: !!modal.draft,
            zone: data.timeZone,
            busy,
            chat: modal.template ? void 0 : { session: selectedSession ? sessions?.byId[selectedSession]?.displayTitle ?? tr("current.session") : "", send: (prompt) => void mutate(async (api) => {
              const result = await api({ action: "draftTemplateInChat", sessionId: selectedSession, prompt });
              setAwaitingDraft(Date.now());
              return result;
            }) },
            submit: (value) => mutate({ action: "saveTemplate", template: value, edit: !!modal.template && !modal.copy && !modal.draft, revision: data.templates.revision, ...modal.draft ? { draftId: modal.draft } : {} })
          }
        ),
        modal.type === "picker" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-section-note", children: modal.host ? tr("choose.task.for.server", { p0: modal.host }) : tr("choose.a.template.then.select.servers") }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-template-picker", children: templates.map((t) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { onClick: () => setModal({ type: "task", template: t, host: modal.host }), children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: t.title }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: t.description })
          ] }, t.id)) }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { onClick: () => setModal({ type: "task", host: modal.host }), children: tr("custom.generate.rules.for.servers") }) })
        ] }),
        modal.type === "delete" && (() => {
          const linked = modal.kind === "Credential" ? data.hosts.filter((h) => credentialRoles(h, modal.name).length).map((h) => h.name) : [];
          const effect = modal.kind === "Template" ? tr("linked.tasks.keep.their.existing.rules") : modal.kind === "Script" ? tr("delete.script.effect") : modal.kind === "Host" ? tr("delete.server.effect") : linked.length ? tr("delete.linked.credential.effect", { p0: linked.join(", ") }) : tr("this.cannot.be.undone");
          return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
              tr("delete.2"),
              modal.name,
              "\u201D ? ",
              effect
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-form-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { onClick: () => setModal(null), disabled: busy, children: tr("cancel") }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-danger", disabled: busy, onClick: () => void mutate({ action: `delete${modal.kind}`, name: modal.name, revision: modal.kind === "Task" || modal.kind === "Host" ? data.revision : modal.kind === "Template" ? data.templates.revision : modal.kind === "Script" ? data.scripts.revision : data.vault.revision, ...linked.length ? { force: true, managedRevision: data.revision } : {} }), children: tr("confirm.deletion") })
            ] })
          ] });
        })()
      ] })
    ] })
  ] });
}
function HostForm({ host: host2, submit, busy }) {
  function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void submit({ name: f.get("name"), ssh: f.get("ssh"), ...f.get("user") ? { user: f.get("user") } : {}, ...f.get("port") ? { port: Number(f.get("port")) } : {}, description: f.get("description"), ...f.get("identityFile") ? { identityFile: f.get("identityFile") } : {}, groups: String(f.get("groups")).split(/[,，\s]+/).filter(Boolean) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("form", { onSubmit: save, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Field4, { title: tr("server.name"), hint: host2 ? tr("server.name.is.fixed") : tr("letters.numbers.dots.hyphens.or.underscores"), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { name: "name", required: true, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]*", maxLength: 100, defaultValue: host2?.name, readOnly: !!host2 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Field4, { title: tr("ssh.address.or.config.alias"), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { name: "ssh", placeholder: tr("192.0.2.10.or.hk"), defaultValue: host2?.ssh ?? host2?.name, required: true }) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Field4, { title: tr("username"), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { name: "user", placeholder: "root", defaultValue: host2?.user }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Field4, { title: tr("port"), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { name: "port", type: "number", min: "1", max: "65535", defaultValue: host2 ? host2.port : 22, required: !host2 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Field4, { title: tr("ssh.identity.path"), hint: tr("ssh.identity.hint"), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { name: "identityFile", placeholder: "~/.ssh/id_ed25519", defaultValue: host2?.identityFile }) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Field4, { title: tr("groups"), hint: tr("separate.groups.with.commas"), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { name: "groups", placeholder: "production, web", defaultValue: host2?.groups.join(", ") }) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Field4, { title: tr("description"), children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { name: "description", placeholder: tr("production.server.in.hong.kong"), defaultValue: host2?.description }) }),
    !host2 && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-muted", children: tr("link.ssh.and.sudo.credentials.after") }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-primary", disabled: busy, children: busy ? tr("saving") : host2 ? tr("save.server") : tr("add.server") }) })
  ] });
}
function bindingFor(host2, role, ref) {
  if (role === "login") return { auth: ref ? "password" : "key", loginSecret: ref, sudoSecret: host2.sudoSecret ?? "" };
  return { auth: host2.auth ?? "key", loginSecret: host2.loginSecret ?? "", sudoSecret: ref };
}
function PolicyForm({ host: host2, submit, busy }) {
  const capabilities = ["change", "sudo", "destructive"];
  const [values, setValues] = (0, import_react11.useState)(Object.fromEntries(capabilities.map((key) => [key, host2.policyOverride?.[key] ?? ""])));
  const describe = { change: tr("capability.change"), sudo: tr("capability.sudo"), destructive: tr("capability.destructive") };
  const changed = capabilities.some((key) => values[key] !== (host2.policyOverride?.[key] ?? ""));
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("form", { onSubmit: (e) => {
    e.preventDefault();
    void submit(Object.fromEntries(capabilities.filter((key) => values[key]).map((key) => [key, values[key]])));
  }, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("fieldset", { className: "wo-form-body", disabled: busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-muted", children: tr("allow.runs.without.asking.ask") }),
    capabilities.map((key) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "wo-field wo-policy-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { children: [
        key,
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: describe[key] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("select", { value: values[key], onChange: (e) => setValues({ ...values, [key]: e.target.value }), children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "", children: tr("inherit", { p0: permissionText(host2.inheritedPolicy[key] ?? "ask") }) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "allow", children: tr("allow") }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "ask", children: tr("approval.required") }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("option", { value: "deny", children: tr("deny") })
      ] })
    ] }, key)),
    values.destructive === "allow" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-field-warn", children: tr("destructive.allow.warning") }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "wo-muted", children: tr("overrides.apply.to.yaml.hosts.too") }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "wo-primary", disabled: busy || !changed, children: busy ? tr("saving") : tr("save.permissions") }) })
  ] }) });
}

// client/index.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var inject = ["slots", "connection", "locale"];
function ServerIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { x: "3", y: "3", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { x: "3", y: "14", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6" })
  ] });
}
function apply(context) {
  const ctx = context;
  ctx.effect(() => installLocale(ctx.locale));
  const api = async (request) => {
    const result = await ctx.connection.rpc.call("/api", "wispOps/manage", { args: { request } });
    if (!result.ok) throw new Error(result.error?.message ?? tr("connection.failed.please.retry"));
    if (!result.value?.ok) throw new Error(result.value?.error ?? tr("operation.failed.please.retry"));
    return result.value.value;
  };
  ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: "wisp-ops", inject: () => ({ api }) }, OpsPage));
  ctx.slots.inject("sidebar.panellist", () => ctx.effect(() => {
    const register = () => ctx.slots.register({ name: "sidebar.panellist", id: "wisp-ops", order: 25, label: tr("server.operations") }, ServerIcon);
    let dispose = register();
    const unsubscribe = ctx.locale.subscribe(() => {
      dispose();
      dispose = register();
    });
    return () => {
      unsubscribe();
      dispose();
    };
  }));
  ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({ name: "plugins.bundle.config", key: "dsh-wisp-ops", inject: () => ({ api }) }, OpsPage));
  ctx.inject(["sidebarRightTabs"], (scope) => {
    scope.effect(() => scope.sidebarRightTabs.register({
      id: "dsh-wisp-ops",
      kind: "wisp-ops",
      title: () => tr("server.operations"),
      guide: [{ id: "manage", order: 40, title: () => tr("server.operations"), description: () => tr("manage.servers.credentials.and.recurring.tasks.2"), icon: ServerIcon }]
    }));
    scope.slots.inject("sidebar.right.pane.tab", () => scope.slots.register({
      name: "sidebar.right.pane.tab",
      key: "dsh-wisp-ops",
      inject: (sessionId) => ({ api, sidebar: true, defaultSessionId: sessionId })
    }, OpsPage));
  });
}
return module.exports; } });
