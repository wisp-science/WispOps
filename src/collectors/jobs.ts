export interface SchedulerJob { id: string; user: string; workdir: string; scheduler?: 'slurm' | 'pbs' | 'lsf' }

/** Query only directory metadata; never send a complete PBS environment to the model. */
export const JOBS_SCRIPT = String.raw`
JT=''
command -v timeout >/dev/null 2>&1 && JT='timeout 15'
echo @@jobs
command -v squeue >/dev/null 2>&1 && $JT squeue -h -t R,CG,S -o '%i|%u|%Z' 2>/dev/null | head -n 500
echo @@pbs_jobs
if command -v qstat >/dev/null 2>&1; then
  $JT qstat -f 2>/dev/null | awk '
    function emit(  n,a,i,d,u) {
      if (state !~ /^(R|E|S|B)$/) return
      n=split(vars,a,","); d=""
      for(i=1;i<=n;i++) if(a[i] ~ /^PBS_O_WORKDIR=/) d=substr(a[i],15)
      u=owner; sub(/@.*/,"",u)
      if (d ~ /^\// && id != "") print id "|" u "|" d
    }
    /^Job Id:/ {emit(); id=$3; state=""; owner=""; vars=""; key=""; next}
    /^[ \t]+[A-Za-z_][A-Za-z0-9_.]* = / {
      line=$0; sub(/^[ \t]+/,"",line); key=line; sub(/ = .*/,"",key); sub(/^[^=]*= /,"",line)
      if(key=="job_state") state=line
      if(key=="Job_Owner") owner=line
      if(key=="Variable_List") vars=line
      next
    }
    key=="Variable_List" && /^[ \t]+/ {line=$0; sub(/^[ \t]+/,"",line); vars=vars line}
    END {emit()}' | head -n 500
fi
echo @@lsf_jobs
command -v bjobs >/dev/null 2>&1 && $JT bjobs -u all -noheader -o "jobid stat user exec_cwd sub_cwd delimiter='|'" 2>/dev/null | head -n 500
`

export function parseSchedulerJobs(sections: ReadonlyMap<string, readonly string[]>): SchedulerJob[] {
  const jobs: SchedulerJob[] = []
  for (const [section, scheduler] of [['jobs', 'slurm'], ['pbs_jobs', 'pbs'], ['lsf_jobs', 'lsf']] as const) {
    for (const line of sections.get(section) ?? []) {
      const cells = line.split('|').map(c => c.trim())
      let id: string | undefined, user: string | undefined, workdir: string | undefined
      if (scheduler === 'lsf') {
        const [job, state, owner, cwd, submitted] = cells
        if (!['RUN', 'SSUSP', 'USUSP', 'PSUSP'].includes(state ?? '')) continue
        id = job; user = owner; workdir = cwd?.startsWith('/') ? cwd : submitted
      } else [id, user, workdir] = cells
      if (!id || !user || !workdir?.startsWith('/') || /[\0\r\n]/.test(workdir)) continue
      jobs.push({ id, user, workdir: workdir.replace(/\/+$/, '') || '/', scheduler })
    }
  }
  return jobs
}
