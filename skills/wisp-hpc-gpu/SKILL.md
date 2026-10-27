---
name: wisp-hpc-gpu
description: Diagnose GPU and Slurm problems on research servers with WispOps — idle GPUs held by forgotten processes, drained or down nodes, stuck or pending jobs, Xid errors — and propose fixes that respect other users' jobs.
---

# GPU and Slurm on research servers

- Start with `ops_inspect targets=@gpu detail=true`: per-GPU utilization, memory, temperature, owning PIDs; Slurm node states and job counts; kernel errors (NVIDIA `Xid` lines).
- **Idle but held GPU** (0% util, memory used): identify the process (`ps -o pid,user,etimes,args -p <pid>`), often a dead Jupyter kernel or an interactive session. Ask the owner; killing another user's process is a change that needs approval and a reason.
- **Drained/down nodes**: `scontrol show node <n>` for the reason; common ones are `Kill task failed` (stuck process — check `ps` on the node), `Not responding` (slurmd down — `systemctl status slurmd`), `Low RealMemory`. Resume with `scontrol update nodename=<n> state=resume` only after the cause is fixed (change, approval).
- **Pending jobs**: `squeue -t PD -o '%i %u %R'` — the reason column explains (Resources, Priority, QOSMaxGRESPerUser, ReqNodeNotAvail).
- **Xid errors**: 79 (fell off the bus) / 48 (double-bit ECC) usually need a reboot or hardware ticket; 31/43 are application faults. Reboot is destructive — drain the node first (`scontrol update ... state=drain reason=...`) and wait for jobs to finish.
- Never run heavy work on login nodes; use `srun`/`sbatch` for anything beyond a quick check.
