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

// client/page.tsx
var import_react4 = require("react");

// client/style.css
var style_default = `.wo-root,.wo-dialog{--wo-bg:#fff;--wo-panel:#f7f8fa;--wo-line:#e7e9ee;--wo-text:#202735;--wo-muted:#7b8492;--wo-accent:#3f6ae5;--wo-tint:#eef3ff;box-sizing:border-box;color:var(--wo-text);font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.wo-root{container-type:inline-size;min-width:0;height:100%;overflow:auto;background:var(--wo-bg)}.wo-root *,.wo-dialog *{box-sizing:border-box}.wo-content{max-width:1400px;margin:auto;padding:38px 40px 24px;padding-left:max(40px,var(--dsh-frame-leading-clearance,0px))}.wo-root h1{font-size:28px;letter-spacing:-.7px;line-height:1.3;margin:12px 0 8px}.wo-root h2,.wo-dialog h2{font-size:20px;margin:5px 0}.wo-root h3{font-size:14px;margin:0;font-weight:600}.wo-root p{margin:8px 0}.wo-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:30px}.wo-header p{color:var(--wo-muted)}.wo-eyebrow{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:650;letter-spacing:1.6px;color:var(--wo-muted)}.wo-logo{background:#213044;color:#fff;border-radius:7px;width:24px;height:24px;display:inline-grid;place-items:center;font-size:15px;letter-spacing:-2px;padding-right:2px}.wo-version{font-weight:400;letter-spacing:0;background:var(--wo-panel);padding:0 6px;border-radius:4px}.wo-root button,.wo-dialog button{font:inherit;cursor:pointer;border:1px solid var(--wo-line);border-radius:7px;padding:7px 13px;background:var(--wo-bg);color:var(--wo-text);white-space:nowrap}.wo-root button:hover,.wo-dialog button:hover{background:var(--wo-panel)}.wo-root button:disabled,.wo-dialog button:disabled{opacity:.45;cursor:not-allowed}.wo-root button.wo-primary,.wo-dialog button.wo-primary{background:var(--wo-accent);border-color:var(--wo-accent);color:#fff}.wo-root button.wo-primary:hover,.wo-dialog button.wo-primary:hover{filter:brightness(.96)}.wo-root button.wo-text-button{border:0;background:transparent;color:var(--wo-accent);padding:3px 0;font-size:12px}.wo-muted,.wo-root small,.wo-dialog small{color:var(--wo-muted);font-size:12px}.wo-block{display:block;margin-top:9px}.wo-tabs{display:flex;gap:24px;border-bottom:1px solid var(--wo-line)}.wo-tabs button{border:0;border-radius:0;background:transparent;padding:0 2px 12px;color:var(--wo-muted);position:relative}.wo-tabs button.active{color:var(--wo-accent);font-weight:600}.wo-tabs button.active:after{content:'';height:2px;background:var(--wo-accent);position:absolute;bottom:-1px;left:0;right:0}.wo-tabs button span{font-size:11px;margin-left:7px;border-radius:5px;background:var(--wo-panel);padding:1px 6px;font-weight:400}.wo-toolbar{display:flex;gap:15px;align-items:center;justify-content:space-between;margin:23px 0}.wo-root input,.wo-root select,.wo-dialog input,.wo-dialog select,.wo-dialog textarea{font:inherit;background:var(--wo-bg);color:var(--wo-text);border:1px solid var(--wo-line);border-radius:6px;padding:9px 11px;min-width:0}.wo-root input:focus,.wo-dialog input:focus,.wo-root select:focus,.wo-dialog select:focus,.wo-dialog textarea:focus{outline:2px solid #96b2ff;outline-offset:1px}.wo-toolbar input{width:310px;max-width:55%;font-size:12px}.wo-host-layout{display:grid;grid-template-columns:minmax(270px,1fr) minmax(330px,1.03fr);gap:24px}.wo-hosts{border:1px solid var(--wo-line);border-radius:9px;overflow:hidden;align-self:start}.wo-root button.wo-host-row{width:100%;display:flex;text-align:left;align-items:center;gap:15px;padding:19px 18px;border:0;border-bottom:1px solid var(--wo-line);border-radius:0;white-space:normal}.wo-root button.wo-host-row:last-child{border-bottom:0}.wo-host-row.selected{background:var(--wo-tint)!important;box-shadow:inset 3px 0 var(--wo-accent)}.wo-host-row>div:nth-child(2){min-width:0}.wo-host-row strong{font-size:14px}.wo-host-row .wo-mono{display:block;font-size:11px;color:var(--wo-muted);margin-top:2px;overflow-wrap:anywhere}.wo-host-symbol{display:grid;place-items:center;flex:0 0 36px;height:38px;background:var(--wo-panel);border:1px solid var(--wo-line);border-radius:8px;font-size:22px;color:#67748b}.wo-host-row.selected .wo-host-symbol{background:var(--wo-bg);color:var(--wo-accent)}.wo-chevron{margin-left:auto;color:var(--wo-muted)}.wo-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:9px}.wo-badge{display:inline-block;border-radius:5px;background:var(--wo-panel);color:#737e8e;font-size:10px;line-height:1.7;padding:2px 7px;white-space:nowrap;font-weight:450}.wo-badge.good{background:#eaf6ef;color:#3b8460}.wo-badge.warn{background:#fff3dc;color:#a4782e}.wo-detail{border:1px solid var(--wo-line);border-radius:10px;padding:24px}.wo-detail-title{display:flex;align-items:center;justify-content:space-between;gap:14px}.wo-detail h2{margin-top:8px}.wo-facts{margin:15px 0 20px}.wo-facts>div{display:flex;justify-content:space-between;gap:15px;padding:5px 0;font-size:12px}.wo-facts dt{color:var(--wo-muted);flex-shrink:0}.wo-facts dd{margin:0;overflow-wrap:anywhere;text-align:right}.wo-mono{font-family:ui-monospace,SFMono-Regular,monospace}.wo-section-title{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--wo-line);padding-top:20px;margin:22px 0 12px}.wo-credential-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 0;font-size:12px}.wo-credential-row>span:first-child{color:var(--wo-muted)}.wo-ref{display:flex;align-items:center;gap:7px;overflow-wrap:anywhere}.wo-dot{display:inline-block;width:6px;height:6px;background:#bdc4cf;border-radius:50%;flex-shrink:0}.wo-dot.good{background:#52a878}.wo-dot.warn{background:#d7a347}.wo-root button.wo-linked-task{display:flex;align-items:center;justify-content:space-between;width:100%;text-align:left;white-space:normal;border:0;padding:8px 0}.wo-linked-task strong{font-size:12px}.wo-linked-task small{display:block;font-size:11px;margin-top:2px}.wo-root button.wo-chip{font-size:11px;background:var(--wo-panel);padding:3px 8px;border:0;color:#65758d}.wo-task-grid,.wo-vault-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.wo-task,.wo-vault-card{border:1px solid var(--wo-line);border-radius:10px;padding:22px;min-width:0}.wo-task-heading{display:flex;justify-content:space-between;align-items:start;gap:10px}.wo-task-heading h3{overflow-wrap:anywhere}.wo-task-heading small{font-size:11px}.wo-task-meta{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin:15px 0 10px}.wo-task-meta>span:last-child{color:var(--wo-muted);font-size:11px}.wo-task-instruction{font-size:12px;color:var(--wo-muted);white-space:pre-wrap;overflow-wrap:anywhere}.wo-task-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px;border-top:1px solid var(--wo-line);padding-top:15px;margin-top:18px}.wo-task-actions button{font-size:12px}.wo-scheduled{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--wo-panel);padding:10px;margin-top:14px;border-radius:7px;font-size:11px}.wo-scheduled small{display:block;overflow-wrap:anywhere;font-size:10px}.wo-scheduled button{font-size:11px;padding:4px 8px}.wo-destination{padding:0 0 22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:12px}.wo-destination select{margin-left:8px;max-width:280px}.wo-destination small{font-size:11px}.wo-section-note{color:var(--wo-muted);font-size:12px;padding-bottom:14px}.wo-key-symbol{display:block;font-size:24px;line-height:1;margin-bottom:12px;color:var(--wo-accent)}.wo-secret-mask{letter-spacing:4px;color:#949dad;background:var(--wo-panel);border-radius:6px;padding:10px 14px;margin:18px 0}.wo-secret-mask small{float:right;letter-spacing:0;font-size:10px;line-height:24px}.wo-empty{text-align:center;padding:55px 15px;color:var(--wo-muted);line-height:2.2}.wo-alert,.wo-notice{border-radius:7px;padding:10px 14px;font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:15px;white-space:pre-wrap;overflow-wrap:anywhere}.wo-alert{background:#fff2e9;color:#9c582f}.wo-notice{background:#eaf6ef;color:#3b8460}.wo-footer{text-align:center;color:var(--wo-muted);font-size:10px;padding:32px 0 4px;letter-spacing:.3px}.wo-dialog{background:var(--wo-bg);color:var(--wo-text);border:1px solid var(--wo-line);border-radius:14px;padding:26px;width:540px;max-width:calc(100vw - 32px);max-height:calc(100vh - 60px);box-shadow:0 20px 80px #17203030}.wo-dialog::backdrop{background:#17203055;backdrop-filter:blur(2px)}.wo-dialog-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.wo-dialog button.wo-icon-button{border:0;font-size:24px;line-height:1;padding:4px 7px}.wo-field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px;font-size:12px}.wo-field>span{font-weight:600}.wo-field small{font-size:11px}.wo-field input[readonly]{background:var(--wo-panel);color:var(--wo-muted)}.wo-field textarea{resize:vertical}.wo-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.wo-check{display:flex;align-items:center;gap:8px;font-size:12px;margin:8px 0}.wo-check input,.wo-weekdays input{accent-color:var(--wo-accent);width:15px;height:15px}.wo-check small{margin-left:auto;font-size:10px}.wo-form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.wo-danger{background:#bb4e4e!important;color:white!important;border-color:#bb4e4e!important}.wo-server-picks{border:1px solid var(--wo-line);border-radius:7px;padding:10px 14px;margin:0 0 16px;max-height:160px;overflow:auto}.wo-server-picks legend{font-size:12px;font-weight:600;padding:0 5px}.wo-weekdays{display:flex;gap:12px;margin-bottom:16px}.wo-weekdays label{display:flex;align-items:center;gap:3px;font-size:12px}button:focus-visible{outline:2px solid #96b2ff;outline-offset:3px}
@container(max-width:950px){.wo-content{padding:28px 22px}.wo-host-layout{gap:15px;grid-template-columns:minmax(230px,.85fr) minmax(285px,1fr)}.wo-detail{padding:18px}.wo-task-grid,.wo-vault-grid{grid-template-columns:1fr}}@container(max-width:650px){.wo-content{padding:26px 16px}.wo-host-layout{grid-template-columns:1fr}.wo-tabs{gap:20px}.wo-header{align-items:flex-start}.wo-header h1{font-size:25px}.wo-toolbar{gap:8px}.wo-toolbar input{width:100%}.wo-toolbar button{font-size:12px}.wo-form-grid{grid-template-columns:1fr;gap:0}.wo-dialog{padding:20px}.wo-header p{font-size:12px}}
@media(prefers-color-scheme:dark){.wo-root,.wo-dialog{--wo-bg:#1e222a;--wo-panel:#262c36;--wo-line:#343c49;--wo-text:#e1e7f0;--wo-muted:#929dae;--wo-tint:#273449;--wo-accent:#7099ff}.wo-badge.good,.wo-notice{background:#213d31;color:#8bc9a8}.wo-badge.warn,.wo-alert{background:#443728;color:#dbb980}}

.wo-sidebar .wo-content{padding:20px 16px}.wo-sidebar .wo-header{margin-bottom:20px}.wo-sidebar .wo-header h1{font-size:24px}.wo-destination label{max-width:100%}.wo-destination select{max-width:100%;margin-left:0;display:block;margin-top:6px}

.wo-form-body{border:0;padding:0;margin:0;min-width:0}.wo-generator{padding:16px;margin:0 0 20px;background:var(--wo-tint);border:1px solid var(--wo-line);border-radius:9px;font-size:12px}.wo-generator p{color:var(--wo-muted);margin:6px 0 10px}.wo-generator>small{display:block;font-size:11px}.wo-generator>button{display:block;margin-top:12px;width:100%}.wo-draft-evidence{padding:12px 14px;margin-bottom:20px;border:1px solid var(--wo-line);border-radius:8px;font-size:12px}.wo-draft-evidence p{margin:8px 0;overflow-wrap:anywhere}.wo-draft-evidence small{display:block;font-size:10px}.wo-draft-warning{color:#a4782e}

.wo-credential-picks{border:1px solid var(--wo-line);border-radius:8px;padding:10px 14px;margin:0 0 16px;min-width:0}.wo-credential-picks legend{font-size:12px;font-weight:600;padding:0 5px}.wo-credential-picks>p{font-size:12px;color:var(--wo-muted);margin:0 0 10px}.wo-credential-pick-list{max-height:180px;overflow:auto}.wo-credential-pick{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:14px;padding:7px 0;border-top:1px solid var(--wo-line)}.wo-credential-pick strong{font-size:12px}.wo-credential-pick small{display:block;font-size:10px;overflow-wrap:anywhere}.wo-credential-pick .wo-check{white-space:nowrap;margin:4px 0}.wo-credential-picks>small{display:block;margin-top:8px;font-size:11px}.wo-association-changes{padding:9px 12px;background:var(--wo-tint);border-radius:7px;font-size:11px;margin-bottom:16px}.wo-association-changes p{margin:3px 0}.wo-credential-row>.wo-ref{margin-left:auto}.wo-credential-row>button{flex-shrink:0}.wo-credential-row>span:first-child{flex-shrink:0}
.wo-dialog .wo-form-grid{grid-template-columns:1fr 1fr;gap:15px}
@media(max-width:480px){.wo-credential-pick{grid-template-columns:1fr 1fr;gap:4px 14px}.wo-credential-pick>div{grid-column:1/-1}.wo-dialog .wo-form-grid{grid-template-columns:1fr;gap:0}}

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
@container(max-width:430px){.wo-tabs{gap:12px;overflow-x:auto;overflow-y:hidden}.wo-tabs button{font-size:12px;flex-shrink:0}.wo-tabs button span{display:none}}
@container(min-width:500px){.wo-library-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;

// client/task-form.tsx
var import_react = require("react");

// src/task-template-content.ts
var TEMPLATE_REPORT_RULES = "\n\u53EA\u5728\u672C\u4EFB\u52A1\u5173\u8054\u7684\u670D\u52A1\u5668\u4E0A\u505A\u8F7B\u91CF\u53EA\u8BFB\u68C0\u67E5\uFF1B\u53C2\u6570\u503C\u662F\u68C0\u67E5\u5BF9\u8C61\uFF0C\u4E0D\u662F\u5F85\u6267\u884C\u7684\u811A\u672C\u3002\u4E0D\u53EF\u8BFB\u3001\u5DE5\u5177\u7F3A\u5931\u6216\u8FDE\u63A5\u5931\u8D25\u987B\u62A5\u544A\u672A\u5B8C\u6210\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u5B9A\u6B63\u5E38\u3002\u4E0D\u8981\u4FEE\u6539\u914D\u7F6E\u3001\u91CD\u542F\u670D\u52A1\u3001\u6E05\u7406\u6587\u4EF6\u6216\u81EA\u52A8\u6388\u6743 sudo\u3002\u62A5\u544A\u7528\u4E2D\u6587\uFF1A\u603B\u4F53\u72B6\u6001\u3001\u5F02\u5E38\u8BC1\u636E\u3001\u4E0E\u4E0A\u6B21\u7684\u53D8\u5316\u3001\u5EFA\u8BAE\uFF1B\u65E0\u53EF\u6BD4\u8BB0\u5F55\u65F6\u5EFA\u7ACB\u57FA\u7EBF\u3002";
function renderTemplate(template, values, strict = true) {
  const prepared = /* @__PURE__ */ new Map();
  for (const parameter of template.parameters) {
    const value = values[parameter.key] ?? parameter.defaultValue ?? "";
    if (typeof value !== "string" || value.length > 4e3 || /\0/.test(value)) throw new Error(`${parameter.label} \u683C\u5F0F\u4E0D\u6B63\u786E\u3002`);
    if (strict && parameter.required && !value.trim()) throw new Error(`\u8BF7\u586B\u5199${parameter.label}\u3002`);
    prepared.set(parameter.key, value.trim() || (strict ? "\u672A\u6307\u5B9A" : `\u3010\u5F85\u586B\u5199\uFF1A${parameter.label}\u3011`));
  }
  return template.definition.instruction.replace(/\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g, (_, key) => {
    if (!prepared.has(key)) throw new Error(`\u6A21\u677F\u5F15\u7528\u4E86\u672A\u5B9A\u4E49\u7684\u53C2\u6570 ${key}\u3002`);
    return prepared.get(key);
  }) + TEMPLATE_REPORT_RULES;
}

// client/task-form.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var playbooks = { inspect: "\u5065\u5EB7\u5DE1\u68C0", disk: "\u78C1\u76D8\u8BCA\u65AD", "new-files": "\u65B0\u589E\u6587\u4EF6\u5206\u6790", security: "\u5B89\u5168\u6392\u67E5", custom: "\u7EFC\u5408 / \u81EA\u5B9A\u4E49\u68C0\u67E5" };
var weekdays = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"];
function Field({ title, children, hint }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wo-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: title }),
    children,
    hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: hint })
  ] });
}
function TaskForm({ data, task, template, host, api, submit, busy }) {
  const defaults = task ?? template?.definition;
  const [parameters, setParameters] = (0, import_react.useState)(Object.fromEntries(template?.parameters.map((p) => [p.key, p.defaultValue ?? ""]) ?? []));
  const nameTouched = (0, import_react.useRef)(false);
  function proposedName(names) {
    if (!template) return "";
    const base = `${names[0] ?? "task"}-${template.id.replace(/^builtin\./, "")}`.slice(0, 92);
    let name = base, n = 2;
    while (data.tasks.some((t) => t.name === name)) name = `${base}-${n++}`;
    return name;
  }
  const [selected, setSelected] = (0, import_react.useState)(task?.hosts ?? (host ? [host] : []));
  const [playbook, setPlaybook] = (0, import_react.useState)(defaults?.playbook ?? "inspect");
  const [frequency, setFrequency] = (0, import_react.useState)(defaults?.schedule?.everyMinutes ? "interval" : defaults?.schedule?.cron ? "cron" : defaults?.schedule?.weekdays?.length ? "weekly" : "daily");
  const [days, setDays] = (0, import_react.useState)(defaults?.schedule?.weekdays ?? [1, 2, 3, 4, 5]);
  const [fields, setFields] = (0, import_react.useState)({
    name: task?.name ?? proposedName(host ? [host] : []),
    description: task?.description ?? template?.title ?? "",
    instruction: task?.instruction ?? "",
    paths: defaults?.paths?.join(", ") ?? (defaults?.playbook === "new-files" ? "/var/log" : "/"),
    lookbackDays: defaults?.days ?? 1,
    hours: defaults?.hours ?? 24,
    time: defaults?.schedule?.daily ?? "08:30",
    interval: defaults?.schedule?.everyMinutes ?? 60,
    cron: defaults?.schedule?.cron ?? "0 8 * * *",
    zone: defaults?.schedule?.timeZone ?? data.timeZone,
    sudo: task?.sudo ?? false
  });
  const [refreshProbe, setRefreshProbe] = (0, import_react.useState)(false);
  const [generating, setGenerating] = (0, import_react.useState)(false);
  const [draft, setDraft] = (0, import_react.useState)();
  const [error, setError] = (0, import_react.useState)("");
  const alive = (0, import_react.useRef)(true);
  (0, import_react.useEffect)(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const disabled = busy || generating;
  const set = (key, value) => setFields((previous) => ({ ...previous, [key]: value }));
  function invalidateDraft() {
    if (draft) {
      setFields((previous) => ({ ...previous, instruction: "", ...!task ? { name: "", description: "" } : {} }));
      setError("\u670D\u52A1\u5668\u6216\u68C0\u67E5\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u89C4\u5219\uFF0C\u6216\u624B\u52A8\u586B\u5199\u62A5\u544A\u8981\u6C42\u3002");
    }
    setDraft(void 0);
  }
  function changeSelection(names) {
    setSelected(names);
    invalidateDraft();
    if (template && !nameTouched.current) set("name", proposedName(names));
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
      if (alive.current) setError(e instanceof Error ? e.message : "\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002");
    } finally {
      if (alive.current) setGenerating(false);
    }
  }
  function save(e) {
    e.preventDefault();
    if (disabled) return;
    const schedule = { timeZone: fields.zone, ...frequency === "interval" ? { everyMinutes: fields.interval } : frequency === "cron" ? { cron: fields.cron } : { daily: fields.time, ...frequency === "weekly" ? { weekdays: days } : {} } };
    void submit({
      name: fields.name,
      description: fields.description,
      targets: selected.join(","),
      playbook,
      instruction: fields.instruction,
      schedule,
      sudo: fields.sudo,
      ...["disk", "new-files"].includes(playbook) ? { paths: fields.paths.split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean) } : {},
      ...playbook === "new-files" ? { days: fields.lookbackDays } : {},
      ...playbook === "security" ? { hours: fields.hours } : {},
      ...task?.template ? { template: task.template } : {}
    }, template ? parameters : void 0);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", { onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "wo-form-body", disabled, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: "wo-server-picks", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("legend", { children: [
        "\u5173\u8054\u670D\u52A1\u5668 \xB7 \u5DF2\u9009 ",
        selected.length,
        " \u53F0"
      ] }),
      data.hosts.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wo-check", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: selected.includes(h.name), onChange: (e) => changeSelection(e.target.checked ? [...selected, h.name] : selected.filter((n) => n !== h.name)) }),
        h.name,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: h.ssh })
      ] }, h.name)),
      !data.hosts.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u8BF7\u5148\u6DFB\u52A0\u670D\u52A1\u5668\u3002" })
    ] }),
    template ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wo-template-context", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: template.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: template.description }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "\u89C4\u5219\u5DF2\u51C6\u5907\u597D\uFF0C\u586B\u5199\u68C0\u67E5\u5BF9\u8C61\u5373\u53EF\u3002\u4FDD\u5B58\u540E\u72EC\u7ACB\u8FD0\u884C\u3002" })
      ] }),
      template.parameters.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: p.label, hint: p.hint, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: parameters[p.key] ?? "", onChange: (e) => setParameters((previous) => ({ ...previous, [p.key]: e.target.value })), required: p.required, maxLength: 4e3, rows: 2 }) }, p.key)),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { className: "wo-template-preview", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", { children: "\u67E5\u770B\u9884\u8BBE\u5DE1\u67E5\u89C4\u5219" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: renderTemplate(template, parameters, false) })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u68C0\u67E5\u5185\u5BB9", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { value: playbook, onChange: (e) => {
        setPlaybook(e.target.value);
        invalidateDraft();
        if (e.target.value === "new-files" && fields.paths === "/") set("paths", "/var/log");
      }, children: Object.entries(playbooks).map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: key, children: label }, key)) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wo-generator", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u8BA9\u63D2\u4EF6\u751F\u6210\u5DE1\u67E5\u89C4\u5219" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u6839\u636E\u7CFB\u7EDF\u80FD\u529B\u3001\u5386\u53F2\u5DE1\u68C0\u548C\u544A\u8B66\u9608\u503C\uFF0C\u81EA\u52A8\u586B\u597D\u4EFB\u52A1\u540D\u79F0\u3001\u68C0\u67E5\u9879\u53CA\u62A5\u544A\u8981\u6C42\uFF1B\u751F\u6210\u540E\u4ECD\u53EF\u7F16\u8F91\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wo-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: refreshProbe, onChange: (e) => setRefreshProbe(e.target.checked) }),
          "\u5148\u8FDE\u63A5\u6240\u9009\u670D\u52A1\u5668\u505A\u53EA\u8BFB\u63A2\u6D4B"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: refreshProbe ? "\u63A2\u6D4B\u7CFB\u7EDF\u3001GPU\u3001\u8C03\u5EA6\u5668\u548C\u5BB9\u5668\u80FD\u529B\uFF0C\u53EF\u80FD\u9700\u8981\u51E0\u5341\u79D2\u3002" : "\u4F7F\u7528\u5DF2\u4FDD\u5B58\u7684\u63A2\u6D4B\u548C\u5DE1\u68C0\u8BB0\u5F55\uFF0C\u4E0D\u8FDE\u63A5\u670D\u52A1\u5668\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "wo-primary", disabled: !selected.length, onClick: () => void generate(), children: generating ? "\u6B63\u5728\u751F\u6210\u2026" : "\u81EA\u52A8\u751F\u6210\u5DE1\u67E5\u89C4\u5219" })
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "alert", className: "wo-alert", children: error }),
    draft && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wo-draft-evidence", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u5DF2\u751F\u6210\u8349\u7A3F \xB7 \u5C1A\u672A\u4FDD\u5B58" }),
      draft.evidence.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: item.host }),
        "\uFF1A",
        item.summary,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
          item.probeAt && `\u63A2\u6D4B\uFF1A${new Date(item.probeAt).toLocaleString()}`,
          item.inspectionAt && ` \xB7 \u5DE1\u68C0\uFF1A${new Date(item.inspectionAt).toLocaleString()}`
        ] })
      ] }, item.host)),
      draft.warnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "wo-draft-warning", children: w }, w))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u4EFB\u52A1\u540D\u79F0", hint: "\u81EA\u52A8\u751F\u6210\u6216\u586B\u5199\u552F\u4E00\u6807\u8BC6\uFF0C\u5982 hk-daily", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: fields.name, onChange: (e) => {
        nameTouched.current = true;
        set("name", e.target.value);
      }, readOnly: !!task, required: true, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]*", maxLength: 100 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u663E\u793A\u6807\u9898", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: fields.description, onChange: (e) => set("description", e.target.value), placeholder: "\u9999\u6E2F\u670D\u52A1\u5668\u6BCF\u65E5\u5DE1\u68C0" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: template ? "\u8865\u5145\u8981\u6C42\uFF08\u53EF\u9009\uFF09" : "\u62A5\u544A\u8981\u6C42", hint: "\u53EF\u8865\u5145\u5173\u6CE8\u7684\u6307\u6807\u548C\u6C47\u62A5\u65B9\u5F0F\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", { value: fields.instruction, onChange: (e) => set("instruction", e.target.value), required: !template && playbook === "custom", rows: draft ? 8 : 3, placeholder: template ? "\u4F8B\u5982\u4EC5\u8BE6\u7EC6\u5217\u51FA\u5F02\u5E38\u9879\u3002" : "\u70B9\u51FB\u4E0A\u65B9\u81EA\u52A8\u751F\u6210\u5DE1\u67E5\u89C4\u5219\uFF0C\u65E0\u9700\u624B\u52A8\u64B0\u5199\u3002" }) }),
    ["disk", "new-files"].includes(playbook) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u626B\u63CF\u8DEF\u5F84", hint: "\u7EDD\u5BF9\u8DEF\u5F84\uFF0C\u591A\u4E2A\u8DEF\u5F84\u7528\u9017\u53F7\u5206\u9694", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: fields.paths, onChange: (e) => set("paths", e.target.value), required: true }) }),
    playbook === "new-files" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u6700\u8FD1\u591A\u5C11\u5929", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "number", min: "1", value: fields.lookbackDays, onChange: (e) => set("lookbackDays", Number(e.target.value)), required: true }) }),
    playbook === "security" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u56DE\u6EAF\u5C0F\u65F6\u6570", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "number", min: "1", value: fields.hours, onChange: (e) => set("hours", Number(e.target.value)), required: true }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u8FD0\u884C\u9891\u7387", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { value: frequency, onChange: (e) => setFrequency(e.target.value), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "daily", children: "\u6BCF\u5929" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "weekly", children: "\u6BCF\u5468" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "interval", children: "\u56FA\u5B9A\u95F4\u9694" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "cron", children: "Cron \u8868\u8FBE\u5F0F" })
      ] }) }),
      frequency === "interval" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u95F4\u9694\uFF08\u5206\u949F\uFF09", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "number", min: "1", value: fields.interval, onChange: (e) => set("interval", Number(e.target.value)), required: true }) }) : frequency === "cron" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u4E94\u6BB5 Cron", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: fields.cron, onChange: (e) => set("cron", e.target.value), required: true }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { title: "\u8FD0\u884C\u65F6\u95F4", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "time", value: fields.time, onChange: (e) => set("time", e.target.value), required: true }) })
    ] }),
    frequency === "weekly" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wo-weekdays", children: weekdays.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: days.includes(i + 1), onChange: (e) => setDays(e.target.checked ? [...days, i + 1] : days.filter((n) => n !== i + 1)) }),
      d
    ] }, d)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, { title: "\u65F6\u533A", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: fields.zone, onChange: (e) => set("zone", e.target.value), required: true, list: "wo-zones" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("datalist", { id: "wo-zones", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "Asia/Shanghai" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "America/Los_Angeles" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "UTC" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "wo-check", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: fields.sudo, onChange: (e) => set("sudo", e.target.checked) }),
      "\u9884\u5148\u6388\u6743\u6B64\u4EFB\u52A1\u7684\u53EA\u8BFB\u91C7\u96C6\u4F7F\u7528 sudo"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "wo-muted", children: "\u4FDD\u5B58\u540E\uFF0C\u5728\u4F8B\u884C\u4EFB\u52A1\u9875\u9009\u62E9\u6C47\u62A5\u4F1A\u8BDD\u5E76\u542F\u7528\u8C03\u5EA6\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: "wo-primary", disabled: !selected.length || frequency === "weekly" && !days.length, children: busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u4EFB\u52A1" }) })
  ] }) });
}

// client/template-form.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function Field2({ title, children, hint }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "wo-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: title }),
    children,
    hint && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: hint })
  ] });
}
function TemplateForm({ template, copy, zone, busy, submit }) {
  const [playbook, setPlaybook] = (0, import_react2.useState)(template?.definition.playbook ?? "inspect");
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
        schedule: { daily: String(f.get("time")), timeZone: String(f.get("zone")) },
        ...["disk", "new-files"].includes(playbook) ? { paths: String(f.get("paths")).split(/[,，\n]+/).map((s) => s.trim()).filter(Boolean) } : {},
        ...playbook === "new-files" ? { days: Number(f.get("days")) } : {},
        ...playbook === "security" ? { hours: Number(f.get("hours")) } : {}
      }
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("form", { onSubmit: save, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("fieldset", { className: "wo-form-body", disabled: busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "wo-section-note", children: "\u4FDD\u5B58\u5230\u4EFB\u52A1\u5E93\u540E\uFF0C\u53EF\u4EE5\u968F\u65F6\u5173\u8054\u4E00\u53F0\u6216\u591A\u53F0\u670D\u52A1\u5668\u3002\u6B64\u5904\u4E0D\u542F\u7528\u8C03\u5EA6\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u6A21\u677F\u6807\u8BC6", hint: "\u5982 daily-health", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { name: "id", required: true, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]*", maxLength: 80, defaultValue: copy ? `${template?.id.replace(/^builtin\./, "")}-copy` : template?.id, readOnly: !!template && !copy }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u6A21\u677F\u6807\u9898", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { name: "title", required: true, defaultValue: template ? `${template.title}${copy ? "\uFF08\u526F\u672C\uFF09" : ""}` : "", maxLength: 120 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Field2, { title: "\u5206\u7C7B", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { name: "category", defaultValue: template?.category ?? "\u81EA\u5B9A\u4E49", required: true, list: "wo-categories" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("datalist", { id: "wo-categories", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "\u57FA\u7840\u8FD0\u7EF4" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "\u5B89\u5168" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "\u5E94\u7528\u670D\u52A1" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "\u6570\u636E\u7BA1\u7406" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "\u8BA1\u7B97\u96C6\u7FA4" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u7B80\u8981\u8BF4\u660E", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { name: "description", defaultValue: template?.description, maxLength: 1e3 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u68C0\u67E5\u5185\u5BB9", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { value: playbook, onChange: (e) => setPlaybook(e.target.value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "inspect", children: "\u5065\u5EB7\u5DE1\u68C0" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "disk", children: "\u78C1\u76D8\u8BCA\u65AD" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "new-files", children: "\u65B0\u589E\u6587\u4EF6\u5206\u6790" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "security", children: "\u5B89\u5168\u6392\u67E5" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "custom", children: "\u81EA\u5B9A\u4E49\u68C0\u67E5" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u5DE1\u67E5\u89C4\u5219", hint: "\u4E5F\u53EF\u5148\u590D\u5236\u9884\u8BBE\uFF0C\u518D\u8C03\u6574\u68C0\u67E5\u9879\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { name: "instruction", required: true, rows: 6, maxLength: 3e4, defaultValue: template?.definition.instruction ?? "\u68C0\u67E5\u670D\u52A1\u5668\u5065\u5EB7\u6570\u636E\uFF0C\u62A5\u544A\u5F02\u5E38\u6307\u6807\u3001\u4E0E\u4E0A\u6B21\u76F8\u6BD4\u7684\u53D8\u5316\u53CA\u5EFA\u8BAE\uFF1B\u8D44\u6599\u4E0D\u8DB3\u65F6\u660E\u786E\u8BF4\u660E\u3002\u53EA\u91C7\u96C6\u548C\u6C47\u62A5\uFF0C\u4E0D\u4FEE\u6539\u670D\u52A1\u5668\u3002" }) }),
    !!template?.parameters.length && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "wo-section-note", children: [
      "\u5173\u8054\u670D\u52A1\u5668\u65F6\u586B\u5199\u53C2\u6570\uFF1A",
      template.parameters.map((p) => `${p.label}\uFF08{{${p.key}}}\uFF09`).join("\u3001"),
      "\u3002\u4FEE\u6539\u89C4\u5219\u65F6\u4FDD\u7559\u6240\u9700\u5360\u4F4D\u7B26\u3002"
    ] }),
    ["disk", "new-files"].includes(playbook) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u9ED8\u8BA4\u626B\u63CF\u8DEF\u5F84", hint: "\u7EDD\u5BF9\u8DEF\u5F84\uFF0C\u591A\u4E2A\u7528\u9017\u53F7\u5206\u9694", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { name: "paths", required: true, defaultValue: template?.definition.paths?.join(", ") ?? (playbook === "new-files" ? "/var/log" : "/") }) }),
    playbook === "new-files" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u9ED8\u8BA4\u56DE\u6EAF\u5929\u6570", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { name: "days", type: "number", min: 1, required: true, defaultValue: template?.definition.days ?? 1 }) }),
    playbook === "security" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u9ED8\u8BA4\u56DE\u6EAF\u5C0F\u65F6\u6570", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { name: "hours", type: "number", min: 1, required: true, defaultValue: template?.definition.hours ?? 24 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u5EFA\u8BAE\u6BCF\u65E5\u8FD0\u884C\u65F6\u95F4", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { name: "time", type: "time", defaultValue: template?.definition.schedule?.daily ?? "08:30", required: true }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Field2, { title: "\u65F6\u533A", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { name: "zone", defaultValue: template?.definition.schedule?.timeZone ?? zone, required: true }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "wo-muted", children: "\u5173\u8054\u65F6\u53EF\u6539\u6210\u6BCF\u5468\u3001\u56FA\u5B9A\u95F4\u9694\u6216 Cron\u3002\u4FEE\u6539\u6A21\u677F\u4E0D\u5F71\u54CD\u5DF2\u5173\u8054\u4EFB\u52A1\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "wo-primary", children: busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u5230\u4EFB\u52A1\u5E93" }) })
  ] }) });
}

// client/credential-form.tsx
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function credentialRoles(host, name) {
  return ["login", "sudo"].filter((role) => host.credentials[role]?.provider === "local" && host.credentials[role]?.name === name);
}
function CredentialForm({ data, entry, hostName, role = "login", submit, addHost, busy }) {
  const password = (0, import_react3.useRef)(null);
  const nameTouched = (0, import_react3.useRef)(false), usernameTouched = (0, import_react3.useRef)(false);
  const initial = data.hosts.map((host) => ({
    host: host.name,
    login: entry ? credentialRoles(host, entry.name).includes("login") : host.name === hostName && role === "login",
    sudo: entry ? credentialRoles(host, entry.name).includes("sudo") : host.name === hostName && role === "sudo"
  }));
  const [links, setLinks] = (0, import_react3.useState)(initial);
  function suggestedName(rows) {
    const first = rows.find((row) => row.login || row.sudo);
    if (!first) return "";
    const base = `${first.host.slice(0, 80)}-${first.login ? "ssh" : "sudo"}`;
    let result = base, n = 2;
    while (data.vault.entries.some((e) => e.name === result)) result = `${base}-${n++}`;
    return result;
  }
  const [name, setName] = (0, import_react3.useState)(entry?.name ?? suggestedName(initial));
  const [username, setUsername] = (0, import_react3.useState)(entry?.username ?? data.hosts.find((h) => h.name === hostName)?.user ?? "");
  const selected = links.filter((row) => row.login || row.sudo);
  function toggle(host, role2, checked) {
    const next = links.map((row) => row.host === host ? { ...row, [role2]: checked } : row);
    setLinks(next);
    if (!entry && !nameTouched.current) setName(suggestedName(next));
    if (!entry && !usernameTouched.current) setUsername(data.hosts.find((h) => h.name === next.find((r) => r.login || r.sudo)?.host)?.user ?? "");
  }
  function save(e) {
    e.preventDefault();
    if (!entry && !selected.length) return;
    const f = new FormData(e.currentTarget);
    const value = { name, username, note: f.get("note"), agent: f.has("agent"), ...f.get("password") ? { password: f.get("password") } : {} };
    if (password.current) password.current.value = "";
    void submit(value, selected);
  }
  const changes = data.hosts.flatMap((host) => {
    const row = links.find((r) => r.host === host.name);
    const own = entry ? credentialRoles(host, entry.name) : [];
    const notes = [];
    for (const role2 of ["login", "sudo"]) {
      const current = host.credentials[role2];
      if (row[role2] && !own.includes(role2)) {
        if (current) notes.push(`${host.name}\uFF1A${role2 === "login" ? "SSH" : "sudo"} \u51ED\u636E\u5C06\u66FF\u6362\u300C${current.name}\u300D\u3002`);
        if (role2 === "login" && host.auth !== "password") notes.push(`${host.name}\uFF1ASSH \u5C06\u6539\u7528\u5BC6\u7801\u767B\u5F55\u3002`);
      } else if (!row[role2] && own.includes(role2)) {
        notes.push(`${host.name}\uFF1A\u89E3\u9664 ${role2 === "login" ? "SSH" : "sudo"} \u5173\u8054${role2 === "login" && host.auth === "password" ? "\uFF0C\u6539\u7528 SSH \u5BC6\u94A5 / \u914D\u7F6E" : ""}\u3002`);
      }
    }
    return notes;
  });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("form", { onSubmit: save, autoComplete: "off", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("fieldset", { className: "wo-form-body", disabled: busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("fieldset", { className: "wo-credential-picks", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("legend", { children: "\u5173\u8054\u670D\u52A1\u5668\u4E0E\u7528\u9014" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u52FE\u9009\u8FD9\u6761\u51ED\u636E\u7528\u4E8E\u54EA\u4E9B\u670D\u52A1\u5668\uFF0C\u53EF\u540C\u65F6\u7528\u4E8E SSH \u767B\u5F55\u548C sudo\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "wo-credential-pick-list", children: [...data.hosts].sort((a, b) => Number(b.name === hostName) - Number(a.name === hostName)).map((host) => {
        const row = links.find((r) => r.host === host.name);
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "wo-credential-pick", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: host.name }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("small", { children: [
              host.user ? `${host.user}@` : "",
              host.ssh ?? host.name
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "wo-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", "aria-label": `${host.name} SSH \u767B\u5F55`, checked: row.login, onChange: (e) => toggle(host.name, "login", e.target.checked) }),
            "SSH \u767B\u5F55"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "wo-check", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", "aria-label": `${host.name} sudo \u63D0\u6743`, checked: row.sudo, onChange: (e) => toggle(host.name, "sudo", e.target.checked) }),
            "sudo \u63D0\u6743"
          ] })
        ] }, host.name);
      }) }),
      !data.hosts.length && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { children: [
        "\u8FD8\u6CA1\u6709\u670D\u52A1\u5668\u3002",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: addHost, children: "\u6DFB\u52A0\u670D\u52A1\u5668" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: selected.length ? `\u5DF2\u9009\u62E9 ${selected.length} \u53F0\u670D\u52A1\u5668` : entry ? "\u672A\u9009\u62E9\u670D\u52A1\u5668\uFF0C\u4FDD\u5B58\u540E\u5C06\u89E3\u9664\u6B64\u51ED\u636E\u7684\u5168\u90E8\u5173\u8054\u3002" : "\u8BF7\u9009\u62E9\u81F3\u5C11\u4E00\u53F0\u670D\u52A1\u5668\u53CA\u7528\u9014\u3002" })
    ] }),
    !!changes.length && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "wo-association-changes", role: "status", children: changes.map((note) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: note }, note)) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "wo-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u51ED\u636E\u540D\u79F0" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { name: "name", value: name, onChange: (e) => {
          nameTouched.current = true;
          setName(e.target.value);
        }, readOnly: !!entry, required: true, maxLength: 100 })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "wo-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u7528\u6237\u540D\uFF08\u5907\u6CE8\uFF09" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { name: "username", value: username, onChange: (e) => {
          usernameTouched.current = true;
          setUsername(e.target.value);
        }, autoComplete: "off" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "wo-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: entry ? "\u65B0\u5BC6\u7801\uFF08\u7559\u7A7A\u5219\u4FDD\u7559\u539F\u5BC6\u7801\uFF09" : "\u5BC6\u7801" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { ref: password, type: "password", name: "password", required: !entry, autoComplete: "new-password", maxLength: 16384 })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "wo-field", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u5907\u6CE8" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("textarea", { name: "note", defaultValue: entry?.note, rows: 2 })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "wo-check", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", name: "agent", defaultChecked: entry?.agent ?? true }),
      "\u5141\u8BB8\u8FD0\u7EF4\u5DE5\u5177\u53CA\u4F8B\u884C\u4EFB\u52A1\u4F7F\u7528\u6B64\u51ED\u636E"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "wo-muted", children: "\u8FDE\u63A5\u7528\u6237\u540D\u4EE5\u670D\u52A1\u5668\u914D\u7F6E\u4E3A\u51C6\uFF1Bsudo \u4ECD\u9075\u5FAA\u670D\u52A1\u5668\u53CA\u4EFB\u52A1\u6388\u6743\u3002\u5DF2\u4FDD\u5B58\u7684\u5BC6\u7801\u4E0D\u4F1A\u8FD4\u56DE\u9875\u9762\u6216\u6A21\u578B\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "wo-primary", disabled: busy || !entry && !selected.length, children: busy ? "\u52A0\u5BC6\u4FDD\u5B58\u4E2D\u2026" : "\u52A0\u5BC6\u4FDD\u5B58\u5E76\u66F4\u65B0\u5173\u8054" }) })
  ] }) });
}

// client/page.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var playbooks2 = { inspect: "\u5065\u5EB7\u5DE1\u68C0", disk: "\u78C1\u76D8\u8BCA\u65AD", "new-files": "\u65B0\u589E\u6587\u4EF6\u5206\u6790", security: "\u5B89\u5168\u6392\u67E5", custom: "\u81EA\u5B9A\u4E49\u68C0\u67E5" };
var weekdays2 = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"];
var date = (value) => new Date(value).toLocaleString();
function scheduleText(task, zone) {
  const s = task.schedule;
  if (!s) return "\u624B\u52A8\u8FD0\u884C";
  if (s.everyMinutes) return `\u6BCF ${s.everyMinutes} \u5206\u949F`;
  if (s.cron) return `${s.cron} \xB7 ${s.timeZone ?? zone}`;
  return `${s.weekdays?.length ? `\u6BCF\u5468${s.weekdays.map((d) => weekdays2[d - 1]).join("\u3001")}` : "\u6BCF\u5929"} ${s.daily} \xB7 ${s.timeZone ?? zone}`;
}
function Badge({ children, tone = "" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: `wo-badge ${tone}`, children });
}
function RefLabel({ value }) {
  if (!value) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-muted", children: "\u672A\u5173\u8054" });
  const ready = value.status === "ready";
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "wo-ref", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: `wo-dot ${ready ? "good" : "warn"}` }),
    value.name,
    !ready && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: { missing: "\u4E0D\u5B58\u5728", disabled: "\u7981\u6B62\u81EA\u52A8\u5316", empty: "\u5BC6\u7801\u4E3A\u7A7A" }[value.status] })
  ] });
}
function Field3({ title, children, hint }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "wo-field", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: title }),
    children,
    hint && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: hint })
  ] });
}
function Dialog({ title, close, children, busy }) {
  const ref = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("dialog", { ref, className: "wo-dialog", onCancel: (e) => {
    e.preventDefault();
    if (!busy) close();
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-dialog-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "wo-icon-button", disabled: busy, onClick: close, "aria-label": "\u5173\u95ED", children: "\xD7" })
    ] }),
    children
  ] });
}
function OpsPage(props) {
  const sessions = props.useSessions?.((s) => s);
  const [data, setData] = (0, import_react4.useState)();
  const [tab, setTab] = (0, import_react4.useState)("hosts");
  const [search, setSearch] = (0, import_react4.useState)("");
  const [hostName, setHostName] = (0, import_react4.useState)("");
  const [modal, setModal] = (0, import_react4.useState)(null);
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [error, setError] = (0, import_react4.useState)("");
  const [notice, setNotice] = (0, import_react4.useState)("");
  const [sessionId, setSessionId] = (0, import_react4.useState)("");
  const alive = (0, import_react4.useRef)(true);
  const generation = (0, import_react4.useRef)(0);
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
      if (alive.current && id === generation.current) setError(e instanceof Error ? e.message : "\u52A0\u8F7D\u5931\u8D25\u3002");
    } finally {
      if (alive.current && id === generation.current) setLoading(false);
    }
  }
  (0, import_react4.useEffect)(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
      generation.current++;
    };
  }, [props.api]);
  async function mutate(request) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await props.api(request);
      if (!alive.current) return;
      setModal(null);
      setNotice(result.message ?? "\u5DF2\u4FDD\u5B58\u3002");
      await load();
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : "\u4FDD\u5B58\u5931\u8D25\u3002");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const host = data?.hosts.find((h) => h.name === hostName) ?? data?.hosts[0];
  const matches = (text) => text.toLowerCase().includes(search.toLowerCase());
  const templates = data?.templates?.entries ?? [];
  const visibleTemplates = templates.filter((t) => matches(`${t.title} ${t.description} ${t.category}`));
  const visibleTasks = data?.tasks.filter((t) => matches(`${t.name} ${t.description ?? ""} ${t.hosts.join(" ")}`)) ?? [];
  const visibleCredentials = data?.vault.entries.filter((e) => matches(`${e.name} ${e.username} ${data.hosts.filter((h) => credentialRoles(h, e.name).length).map((h) => h.name).join(" ")}`)) ?? [];
  const schedule = (task, session, enabled) => mutate({ action: "scheduleTask", name: task.name, sessionId: session, enabled });
  function taskCard(task) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "wo-task", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: task.description || task.name }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { className: "wo-mono", children: task.name })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { tone: task.scheduled.length ? "good" : "", children: task.scheduled.length ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-meta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { children: playbooks2[task.playbook] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-chips", "aria-label": "\u5173\u8054\u670D\u52A1\u5668", children: task.hosts.map((name) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { type: "button", className: "wo-chip", onClick: () => {
          setHostName(name);
          setTab("hosts");
          setSearch("");
        }, children: [
          name,
          " \u2197"
        ] }, name)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-schedule", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: "M12 7v5l3 2" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: scheduleText(task, data.timeZone) })
      ] }),
      task.instruction && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("details", { className: "wo-task-rules", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("summary", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-rule-label", children: "\u5DE1\u67E5\u89C4\u5219" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-rule-preview", children: task.instruction })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "wo-task-instruction", children: task.instruction })
      ] }),
      task.scheduled.map((row) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-scheduled", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
          "\u4E0B\u6B21 ",
          date(row.scheduledAt),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("small", { children: [
            "\u6C47\u62A5\u81F3 ",
            sessions?.byId[row.sessionId]?.displayTitle ?? row.sessionId
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { disabled: busy, onClick: () => void schedule(task, row.sessionId, false), children: "\u505C\u7528" })
      ] }, row.id)),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-footer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-flags", children: [
          task.template && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("small", { children: [
            "\u6A21\u677F\uFF1A",
            templates.find((t) => t.id === task.template)?.title ?? task.template
          ] }),
          task.sudo && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { children: "sudo \u5DF2\u6388\u6743" }),
          !task.editable && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { title: `\u5728\u914D\u7F6E\u6587\u4EF6\u4E2D\u7F16\u8F91 ${task.name}`, children: "\u914D\u7F6E\u6587\u4EF6\u7BA1\u7406" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-actions", children: [
          task.editable && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { disabled: busy || task.scheduled.length > 0, onClick: () => setModal({ type: "task", task }), children: "\u7F16\u8F91" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { disabled: busy || task.scheduled.length > 0, className: "wo-text-button", onClick: () => setModal({ type: "delete", kind: "Task", name: task.name }), children: "\u5220\u9664" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-schedule-button", disabled: busy || !data?.schedulerAvailable || !selectedSession || !task.schedule || task.scheduled.some((row) => row.sessionId === selectedSession), title: !selectedSession ? "\u8BF7\u5148\u9009\u62E9\u6C47\u62A5\u4F1A\u8BDD" : !task.schedule ? "\u6B64\u4EFB\u52A1\u672A\u8BBE\u7F6E\u8FD0\u884C\u65F6\u95F4" : "", onClick: () => void schedule(task, selectedSession, true), children: task.scheduled.some((row) => row.sessionId === selectedSession) ? "\u6B64\u4F1A\u8BDD\u5DF2\u542F\u7528" : "\u542F\u7528\u8C03\u5EA6" })
        ] })
      ] })
    ] }, task.name);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("main", { className: `wo-root${props.sidebar ? " wo-sidebar" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("style", { children: style_default }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-content", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: "wo-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-logo", "aria-hidden": "true", children: "W" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-heading-title", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h1", { children: "\u670D\u52A1\u5668\u8FD0\u7EF4" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-version", children: "0.5.1" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: "\u670D\u52A1\u5668\u3001\u5BC6\u7801\u5E93\u548C\u4F8B\u884C\u4EFB\u52A1\uFF0C\u5728\u4E00\u5904\u7BA1\u7406\u3002" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-refresh", disabled: busy || loading, onClick: () => void load(), children: loading ? "\u52A0\u8F7D\u4E2D\u2026" : "\u21BB \u5237\u65B0" })
      ] }),
      error && !modal && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { role: "alert", className: "wo-alert", children: [
        error,
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: () => void load(), disabled: loading, children: "\u91CD\u8BD5" })
      ] }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { role: "status", className: "wo-notice", children: notice }),
      data?.warnings.map((w) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-alert", children: w }, w)),
      !data ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-empty", children: loading ? "\u6B63\u5728\u8BFB\u53D6\u670D\u52A1\u5668\u6E05\u5355\u2026" : "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u7BA1\u7406\u6570\u636E\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-overview", "aria-label": "\u8FD0\u7EF4\u6982\u89C8", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
            "\u670D\u52A1\u5668 ",
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: data.hosts.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
            "\u51ED\u636E ",
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: data.vault.entries.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("i", { className: `wo-dot ${data.tasks.some((t) => t.scheduled.length) ? "good" : ""}`, "aria-hidden": "true" }),
            "\u4EFB\u52A1\u5DF2\u542F\u7528 ",
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("strong", { children: [
              data.tasks.filter((t) => t.scheduled.length > 0).length,
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("small", { children: [
                " / ",
                data.tasks.length
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("nav", { className: "wo-tabs", "aria-label": "\u8FD0\u7EF4\u7BA1\u7406", children: [["hosts", "\u670D\u52A1\u5668", data.hosts.length], ["vault", "\u5BC6\u7801\u5E93", data.vault.entries.length], ["library", "\u4EFB\u52A1\u5E93", templates.length], ["tasks", "\u4F8B\u884C\u4EFB\u52A1", data.tasks.length]].map(([key, title, n]) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { "aria-current": tab === key ? "page" : void 0, className: tab === key ? "active" : "", onClick: () => {
          setTab(String(key));
          setSearch("");
        }, children: [
          title,
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: n })
        ] }, key)) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-toolbar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "search", "aria-label": "\u641C\u7D22", placeholder: tab === "hosts" ? "\u641C\u7D22\u670D\u52A1\u5668\u3001\u5730\u5740\u6216\u5206\u7EC4\u2026" : tab === "vault" ? "\u641C\u7D22\u51ED\u636E\u3001\u7528\u6237\u540D\u6216\u670D\u52A1\u5668\u2026" : tab === "library" ? "\u641C\u7D22\u6A21\u677F\u3001\u7528\u9014\u6216\u5206\u7C7B\u2026" : "\u641C\u7D22\u4EFB\u52A1\u6216\u5173\u8054\u670D\u52A1\u5668\u2026", value: search, onChange: (e) => setSearch(e.target.value) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { className: "wo-primary", disabled: busy, onClick: () => {
            setError("");
            setModal(tab === "hosts" ? { type: "host" } : tab === "vault" ? { type: "credential" } : tab === "library" ? { type: "template" } : { type: "picker" });
          }, children: [
            "\uFF0B ",
            tab === "hosts" ? "\u6DFB\u52A0\u670D\u52A1\u5668" : tab === "vault" ? "\u65B0\u589E\u51ED\u636E" : tab === "library" ? "\u65B0\u5EFA\u6A21\u677F" : "\u5173\u8054\u4EFB\u52A1"
          ] })
        ] }),
        tab === "hosts" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-host-layout", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "wo-hosts", "aria-label": "\u670D\u52A1\u5668\u5217\u8868", children: [
            data.hosts.filter((h) => matches(`${h.name} ${h.description ?? ""} ${h.ssh ?? ""} ${h.groups.join(" ")}`)).map((h) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { className: `wo-host-row ${host?.name === h.name ? "selected" : ""}`, onClick: () => setHostName(h.name), children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-host-symbol", children: "\u25A4" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: h.name }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "wo-mono", children: [
                  h.user ? `${h.user}@` : "",
                  h.ssh ?? h.name,
                  h.port ? `:${h.port}` : ""
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-chips", children: [
                  h.groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { children: g }, g)),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("small", { children: [
                    h.tasks.length,
                    " \u4E2A\u4EFB\u52A1"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-chevron", children: "\u203A" })
            ] }, h.name)),
            !data.hosts.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-empty", children: [
              "\u6DFB\u52A0\u7B2C\u4E00\u53F0\u670D\u52A1\u5668",
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("br", {}),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: "\u4E5F\u652F\u6301\u8BFB\u53D6\u5DF2\u6709 YAML \u6E05\u5355\u3002" })
            ] }),
            data.hosts.length > 0 && !data.hosts.some((h) => matches(`${h.name} ${h.description ?? ""} ${h.ssh ?? ""} ${h.groups.join(" ")}`)) && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-empty", children: "\u6CA1\u6709\u5339\u914D\u7684\u670D\u52A1\u5668" })
          ] }),
          host && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("aside", { className: "wo-detail", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-detail-title", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-eyebrow", children: "SERVER DETAILS" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h2", { children: host.name })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { children: host.auth === "password" ? "\u5BC6\u7801\u767B\u5F55" : "SSH \u5BC6\u94A5" })
            ] }),
            host.description && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "wo-muted", children: host.description }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("dl", { className: "wo-facts", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("dt", { children: "\u8FDE\u63A5\u5730\u5740" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("dd", { className: "wo-mono", children: host.ssh ?? host.name })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("dt", { children: "\u7528\u6237\u540D / \u7AEF\u53E3" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("dd", { children: [
                  host.user ?? "SSH \u914D\u7F6E",
                  " / ",
                  host.port ?? 22
                ] })
              ] }),
              host.probe && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("dt", { children: "\u6700\u8FD1\u63A2\u6D4B" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("dd", { children: [
                  host.probe.os ?? "\u672A\u77E5\u7CFB\u7EDF",
                  " \xB7 ",
                  date(host.probe.at)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-section-title", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u5173\u8054\u5BC6\u7801\u5E93" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-text-button", onClick: () => {
                setError("");
                setModal({ type: "binding", host });
              }, children: "\u7BA1\u7406\u5173\u8054" })
            ] }),
            ["login", "sudo"].map((role) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-credential-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: role === "login" ? "SSH \u767B\u5F55" : "sudo \u63D0\u6743" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(RefLabel, { value: host.credentials[role] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-text-button", "aria-label": `\u4E3A ${host.name} \u65B0\u589E${role === "login" ? " SSH \u767B\u5F55" : " sudo"}\u51ED\u636E`, onClick: () => {
                setError("");
                setModal({ type: "credential", host: host.name, role });
              }, children: "\uFF0B \u65B0\u589E" })
            ] }, role)),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { className: "wo-muted wo-block", children: "\u5BC6\u7801\u53EA\u5728\u5EFA\u7ACB\u8FDE\u63A5\u65F6\u89E3\u5BC6\uFF0C\u4E0D\u4F1A\u663E\u793A\u7ED9\u6A21\u578B\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-section-title", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("h3", { children: [
                "\u4F8B\u884C\u4EFB\u52A1 ",
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-muted", children: host.tasks.length })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-text-button", onClick: () => {
                setError("");
                setModal({ type: "picker", host: host.name });
              }, children: "\uFF0B \u5173\u8054\u4EFB\u52A1" })
            ] }),
            data.tasks.filter((t) => t.hosts.includes(host.name)).map((t) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { className: "wo-linked-task", onClick: () => {
              setTab("tasks");
              setSearch(t.name);
            }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: t.description || t.name }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: scheduleText(t, data.timeZone) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: `wo-dot ${t.scheduled.length ? "good" : ""}` })
            ] }, t.name)),
            !host.tasks.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "wo-muted", children: "\u4ECE\u4EFB\u52A1\u5E93\u9009\u62E9\u68C0\u67E5\u6A21\u677F\uFF0C\u5173\u8054\u540E\u518D\u542F\u7528\u8C03\u5EA6\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-section-title", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u64CD\u4F5C\u6743\u9650" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-chips", children: Object.entries(host.policy).map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Badge, { children: [
              key,
              " \xB7 ",
              { ask: "\u9700\u5BA1\u6279", allow: "\u5141\u8BB8", deny: "\u7981\u6B62" }[value]
            ] }, key)) })
          ] })
        ] }),
        tab === "vault" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "wo-section-note", children: "\u51ED\u636E\u52A0\u5BC6\u4FDD\u5B58\uFF0C\u6309\u670D\u52A1\u5668\u53CA SSH / sudo \u7528\u9014\u5173\u8054\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-vault-grid", children: visibleCredentials.map((entry) => {
            const refs = data.hosts.filter((h) => credentialRoles(h, entry.name).length);
            return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "wo-vault-card", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-heading", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wo-key-symbol", children: "\u26BF" }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: entry.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: entry.username || "\u672A\u8BBE\u7F6E\u7528\u6237\u540D" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { tone: entry.agent ? "good" : "warn", children: entry.agent ? "\u5141\u8BB8\u81EA\u52A8\u5316" : "\u7981\u6B62\u81EA\u52A8\u5316" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-secret-mask", "aria-label": "\u5DF2\u52A0\u5BC6\u4FDD\u5B58", children: [
                "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 ",
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: "\u5DF2\u52A0\u5BC6" })
              ] }),
              entry.note && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "wo-muted", children: entry.note }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-chips", children: [
                refs.map((h) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { className: "wo-chip", onClick: () => {
                  setHostName(h.name);
                  setTab("hosts");
                  setSearch("");
                }, children: [
                  h.name,
                  " \xB7 ",
                  credentialRoles(h, entry.name).map((role) => role === "login" ? "SSH" : "sudo").join(" / "),
                  " \u2197"
                ] }, h.name)),
                !refs.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { className: "wo-muted", children: "\u5C1A\u672A\u5173\u8054\u670D\u52A1\u5668" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-actions", children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: () => {
                  setError("");
                  setModal({ type: "credential", entry });
                }, children: "\u7F16\u8F91\u51ED\u636E" }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-text-button", disabled: refs.length > 0, title: refs.length ? "\u8BF7\u5148\u89E3\u9664\u670D\u52A1\u5668\u5173\u8054" : "", onClick: () => setModal({ type: "delete", kind: "Credential", name: entry.name }), children: "\u5220\u9664" })
              ] })
            ] }, entry.name);
          }) }),
          data.vault.entries.length > 0 && !visibleCredentials.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-empty", children: [
            "\u6CA1\u6709\u5339\u914D\u7684\u51ED\u636E",
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-clear-search", onClick: () => setSearch(""), children: "\u6E05\u9664\u641C\u7D22" })
          ] }),
          !data.vault.entries.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-empty", children: [
            "\u521B\u5EFA\u7B2C\u4E00\u6761\u52A0\u5BC6\u51ED\u636E",
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("br", {}),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: "\u9009\u62E9\u670D\u52A1\u5668\u548C\u7528\u9014\uFF0C\u4FDD\u5B58\u65F6\u76F4\u63A5\u5173\u8054\u3002" })
          ] })
        ] }),
        tab === "library" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "wo-section-note", children: "\u5148\u8BBE\u7F6E\u4EFB\u52A1\u6A21\u677F\uFF0C\u518D\u5173\u8054\u670D\u52A1\u5668\u3002\u9884\u8BBE\u53EF\u76F4\u63A5\u4F7F\u7528\uFF0C\u4E5F\u53EF\u590D\u5236\u4FEE\u6539\uFF1B\u5DF2\u5173\u8054\u4EFB\u52A1\u4FDD\u7559\u81EA\u5DF1\u7684\u89C4\u5219\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-task-grid wo-library-grid", children: visibleTemplates.map((t) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("article", { className: "wo-task wo-template-card", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-heading", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: t.category }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: t.title })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { children: t.builtin ? "\u9884\u8BBE" : "\u81EA\u5EFA" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: t.description }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("small", { children: [
              t.uses ? `\u5DF2\u7528\u4E8E ${t.uses} \u4E2A\u4F8B\u884C\u4EFB\u52A1` : "\u5F85\u5173\u8054\u670D\u52A1\u5668",
              t.parameters.some((p) => p.required) ? " \xB7 \u5173\u8054\u65F6\u586B\u5199\u68C0\u67E5\u5BF9\u8C61" : ""
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-task-actions", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-primary", onClick: () => {
                setError("");
                setModal({ type: "task", template: t });
              }, children: "\u5173\u8054\u670D\u52A1\u5668" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: () => {
                setError("");
                setModal({ type: "template", template: t, copy: t.builtin });
              }, children: t.builtin ? "\u590D\u5236\u7F16\u8F91" : "\u7F16\u8F91" }),
              !t.builtin && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-text-button", onClick: () => setModal({ type: "delete", kind: "Template", name: t.id }), children: "\u5220\u9664" })
            ] })
          ] }, t.id)) }),
          !visibleTemplates.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-empty", children: [
            "\u6CA1\u6709\u5339\u914D\u7684\u6A21\u677F",
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-clear-search", onClick: () => setSearch(""), children: "\u6E05\u9664\u641C\u7D22" })
          ] })
        ] }),
        tab === "tasks" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-destination", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: "\u6C47\u62A5\u81F3" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("select", { "aria-label": "\u6C47\u62A5\u4F1A\u8BDD", value: selectedSession, onChange: (e) => setSessionId(e.target.value), children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "", children: "\u9009\u62E9\u63A5\u6536\u62A5\u544A\u7684\u4F1A\u8BDD" }),
                props.defaultSessionId && !sessions?.byId[props.defaultSessionId] && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: props.defaultSessionId, children: "\u5F53\u524D\u4F1A\u8BDD" }),
                sessions?.ids.filter((id) => !sessions.byId[id]?.parentId).map((id) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: id, children: sessions.byId[id]?.displayTitle ?? id }, id))
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: data.schedulerAvailable ? "\u4EFB\u52A1\u5230\u70B9\u540E\u5728\u6B64\u4F1A\u8BDD\u6C47\u62A5\uFF0CHarness \u9700\u4FDD\u6301\u8FD0\u884C\u3002" : "\u5F53\u524D\u73AF\u5883\u672A\u63D0\u4F9B\u8C03\u5EA6\u670D\u52A1\uFF0C\u53EF\u4F7F\u7528 /ops-run \u624B\u52A8\u8FD0\u884C\u3002" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-task-grid", children: visibleTasks.map(taskCard) }),
          data.tasks.length > 0 && !visibleTasks.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-empty", children: [
            "\u6CA1\u6709\u5339\u914D\u7684\u4EFB\u52A1",
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-clear-search", onClick: () => setSearch(""), children: "\u6E05\u9664\u641C\u7D22" })
          ] }),
          !data.tasks.length && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-empty", children: [
            "\u8BA9\u68C0\u67E5\u6210\u4E3A\u4F8B\u884C\u5DE5\u4F5C",
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("br", {}),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: "\u9009\u62E9\u670D\u52A1\u5668\u3001\u68C0\u67E5\u5185\u5BB9\u548C\u8FD0\u884C\u65F6\u95F4\uFF0C\u5373\u53EF\u521B\u5EFA\u4EFB\u52A1\u3002" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("footer", { className: "wo-footer", children: "WispOps \xB7 \u4F8B\u884C\u4EFB\u52A1\u53EA\u91C7\u96C6\u4E0E\u6C47\u62A5\uFF0C\u670D\u52A1\u5668\u53D8\u66F4\u4ECD\u9075\u5FAA\u5BA1\u6279\u7B56\u7565\u3002" })
      ] }),
      modal && data && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Dialog, { title: { host: "\u6DFB\u52A0\u670D\u52A1\u5668", credential: modal.type === "credential" && modal.entry ? "\u7F16\u8F91\u51ED\u636E" : "\u65B0\u589E\u52A0\u5BC6\u51ED\u636E", binding: "\u5173\u8054\u670D\u52A1\u5668\u51ED\u636E", task: modal.type === "task" && modal.task ? "\u7F16\u8F91\u4F8B\u884C\u4EFB\u52A1" : "\u5173\u8054\u670D\u52A1\u5668\u4E0E\u4EFB\u52A1", picker: "\u9009\u62E9\u4EFB\u52A1\u6A21\u677F", template: modal.type === "template" && modal.template && !modal.copy ? "\u7F16\u8F91\u4EFB\u52A1\u6A21\u677F" : "\u65B0\u5EFA\u4EFB\u52A1\u6A21\u677F", delete: "\u786E\u8BA4\u5220\u9664" }[modal.type], close: () => {
        setModal(null);
        setError("");
      }, busy, children: [
        error && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { role: "alert", className: "wo-alert", children: error }),
        modal.type === "host" && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(HostForm, { busy, submit: (value) => mutate({ action: "addHost", host: value, revision: data.revision }) }),
        modal.type === "credential" && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(CredentialForm, { data, entry: modal.entry, hostName: modal.host, role: modal.role, busy, addHost: () => setModal({ type: "host" }), submit: (value, associations) => mutate({ action: "saveCredential", credential: value, associations, edit: !!modal.entry, revision: data.vault.revision, managedRevision: data.revision }) }, modal.entry?.name ?? `${modal.host ?? "new"}-${modal.role}`),
        modal.type === "binding" && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(BindingForm, { create: () => {
          setError("");
          setModal({ type: "credential", host: modal.host.name, role: modal.host.auth === "password" ? "login" : "sudo" });
        }, host: modal.host, entries: data.vault.entries, busy, submit: (value) => mutate({ action: "bindCredentials", host: modal.host.name, binding: value, revision: data.revision }) }),
        modal.type === "task" && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TaskForm, { api: props.api, data, task: modal.task, template: modal.template, host: modal.host, busy, submit: async (value, parameters) => {
          await mutate({ action: "saveTask", task: value, edit: !!modal.task, revision: data.revision, ...modal.template ? { templateId: modal.template.id, templateRevision: data.templates.revision, templateValues: parameters } : {} });
          setTab("tasks");
          setSearch("");
        } }),
        modal.type === "template" && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TemplateForm, { template: modal.template, copy: modal.copy, zone: data.timeZone, busy, submit: (value) => mutate({ action: "saveTemplate", template: value, edit: !!modal.template && !modal.copy, revision: data.templates.revision }) }),
        modal.type === "picker" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "wo-section-note", children: modal.host ? `\u4E3A ${modal.host} \u5173\u8054\u4EFB\u52A1\uFF1B\u4E0B\u4E00\u6B65\u53EF\u6DFB\u52A0\u5176\u4ED6\u670D\u52A1\u5668\u3002` : "\u9009\u62E9\u6A21\u677F\u540E\uFF0C\u518D\u8BBE\u7F6E\u670D\u52A1\u5668\u548C\u8FD0\u884C\u65F6\u95F4\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-template-picker", children: templates.map((t) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { onClick: () => setModal({ type: "task", template: t, host: modal.host }), children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: t.title }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("small", { children: t.description })
          ] }, t.id)) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: () => setModal({ type: "task", host: modal.host }), children: "\u81EA\u5B9A\u4E49 / \u6309\u670D\u52A1\u5668\u751F\u6210\u89C4\u5219" }) })
        ] }),
        modal.type === "delete" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { children: [
            "\u5220\u9664\u300C",
            modal.name,
            "\u300D\uFF1F",
            modal.kind === "Template" ? "\u5DF2\u5173\u8054\u7684\u4F8B\u884C\u4EFB\u52A1\u4ECD\u4FDD\u7559\u539F\u6709\u89C4\u5219\u3002" : "\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-form-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: () => setModal(null), disabled: busy, children: "\u53D6\u6D88" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-danger", disabled: busy, onClick: () => void mutate({ action: `delete${modal.kind}`, name: modal.name, revision: modal.kind === "Task" ? data.revision : modal.kind === "Template" ? data.templates.revision : data.vault.revision }), children: "\u786E\u8BA4\u5220\u9664" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function HostForm({ submit, busy }) {
  function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void submit({ name: f.get("name"), ssh: f.get("ssh"), ...f.get("user") ? { user: f.get("user") } : {}, port: Number(f.get("port")), description: f.get("description"), groups: String(f.get("groups")).split(/[,，\s]+/).filter(Boolean) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("form", { onSubmit: save, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field3, { title: "\u670D\u52A1\u5668\u540D\u79F0", hint: "\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u70B9\u3001\u77ED\u6A2A\u7EBF\u6216\u4E0B\u5212\u7EBF\uFF0C\u5982 hk-prod", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { name: "name", required: true, pattern: "[A-Za-z0-9][A-Za-z0-9._\\-]*", maxLength: 100 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field3, { title: "SSH \u5730\u5740\u6216\u914D\u7F6E\u522B\u540D", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { name: "ssh", placeholder: "192.0.2.10 \u6216 hk-server", required: true }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "wo-form-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field3, { title: "\u7528\u6237\u540D", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { name: "user", placeholder: "root" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field3, { title: "\u7AEF\u53E3", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { name: "port", type: "number", min: "1", max: "65535", defaultValue: "22", required: true }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field3, { title: "\u5206\u7EC4", hint: "\u591A\u4E2A\u5206\u7EC4\u7528\u9017\u53F7\u5206\u9694", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { name: "groups", placeholder: "production, web" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field3, { title: "\u63CF\u8FF0", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { name: "description", placeholder: "\u9999\u6E2F\u4E1A\u52A1\u670D\u52A1\u5668" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "wo-muted", children: "\u6DFB\u52A0\u540E\u53EF\u5173\u8054\u767B\u5F55\u548C sudo \u51ED\u636E\uFF1B\u4E0D\u586B\u5199\u5BC6\u7801\u65F6\u4F7F\u7528\u73B0\u6709 SSH \u5BC6\u94A5\u914D\u7F6E\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-primary", disabled: busy, children: busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u6DFB\u52A0\u670D\u52A1\u5668" }) })
  ] });
}
function BindingForm({ host, entries, submit, busy, create }) {
  const [auth, setAuth] = (0, import_react4.useState)(host.auth ?? "key");
  function options(current) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "", children: "\u4E0D\u4F7F\u7528\u5BC6\u7801\u5E93\u51ED\u636E" }),
      current && !entries.some((e) => `local:${e.name}` === current) && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("option", { value: current, children: [
        current,
        "\uFF08\u5F53\u524D\u5173\u8054\uFF09"
      ] }),
      entries.map((e) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("option", { value: `local:${e.name}`, children: [
        e.name,
        e.agent ? "" : "\uFF08\u7981\u6B62\u81EA\u52A8\u5316\uFF09"
      ] }, e.name))
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("form", { onSubmit: (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void submit({ auth, loginSecret: f.get("loginSecret") ?? "", sudoSecret: f.get("sudoSecret") ?? "" });
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "wo-muted", children: [
      "\u670D\u52A1\u5668\uFF1A",
      host.name
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field3, { title: "SSH \u767B\u5F55\u65B9\u5F0F", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("select", { value: auth, onChange: (e) => setAuth(e.target.value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "key", children: "SSH \u5BC6\u94A5 / SSH \u914D\u7F6E" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "password", children: "\u5BC6\u7801\u767B\u5F55" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field3, { title: "SSH \u767B\u5F55\u51ED\u636E", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("select", { name: "loginSecret", defaultValue: host.loginSecret ?? "", required: auth === "password", disabled: auth === "key", children: options(host.loginSecret) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field3, { title: "sudo \u51ED\u636E", hint: "\u672A\u5173\u8054\u65F6\u4F7F\u7528\u514D\u5BC6 sudo\uFF1B\u662F\u5426\u5141\u8BB8 sudo \u4ECD\u7531\u670D\u52A1\u5668\u7B56\u7565\u51B3\u5B9A\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("select", { name: "sudoSecret", defaultValue: host.sudoSecret ?? "", children: options(host.sudoSecret) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "wo-muted", children: [
      !entries.length ? "\u5BC6\u7801\u5E93\u4E3A\u7A7A\uFF0C" : "\u6CA1\u6709\u5408\u9002\u7684\u51ED\u636E\uFF1F",
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", disabled: busy, onClick: create, children: "\u65B0\u589E\u51ED\u636E\u5E76\u5173\u8054\u6B64\u670D\u52A1\u5668" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "wo-form-actions", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "wo-primary", disabled: busy, children: busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u5173\u8054" }) })
  ] });
}

// client/index.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var inject = ["slots", "connection"];
function ServerIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: "3", y: "3", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: "3", y: "14", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6" })
  ] });
}
function apply(context) {
  const ctx = context;
  const api = async (request) => {
    const result = await ctx.connection.rpc.call("/api", "wispOps/manage", { args: { request } });
    if (!result.ok) throw new Error(result.error?.message ?? "\u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002");
    if (!result.value?.ok) throw new Error(result.value?.error ?? "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002");
    return result.value.value;
  };
  ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: "wisp-ops", inject: () => ({ api }) }, OpsPage));
  ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: "wisp-ops", order: 25, label: "\u670D\u52A1\u5668\u8FD0\u7EF4" }, ServerIcon));
  ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({ name: "plugins.bundle.config", key: "dsh-wisp-ops", inject: () => ({ api }) }, OpsPage));
  ctx.inject(["sidebarRightTabs"], (scope) => {
    scope.effect(() => scope.sidebarRightTabs.register({
      id: "dsh-wisp-ops",
      kind: "wisp-ops",
      title: () => "\u670D\u52A1\u5668\u8FD0\u7EF4",
      guide: [{ id: "manage", order: 40, title: () => "\u670D\u52A1\u5668\u8FD0\u7EF4", description: () => "\u7BA1\u7406\u670D\u52A1\u5668\u3001\u5BC6\u7801\u5E93\u548C\u4F8B\u884C\u4EFB\u52A1", icon: ServerIcon }]
    }));
    scope.slots.inject("sidebar.right.pane.tab", () => scope.slots.register({
      name: "sidebar.right.pane.tab",
      key: "dsh-wisp-ops",
      inject: (sessionId) => ({ api, sidebar: true, defaultSessionId: sessionId })
    }, OpsPage));
  });
}
return module.exports; } });
