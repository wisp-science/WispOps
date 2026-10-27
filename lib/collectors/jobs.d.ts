export interface SchedulerJob {
    id: string;
    user: string;
    workdir: string;
    scheduler?: 'slurm' | 'pbs' | 'lsf';
}
/** Query only directory metadata; never send a complete PBS environment to the model. */
export declare const JOBS_SCRIPT: string;
export declare function parseSchedulerJobs(sections: ReadonlyMap<string, readonly string[]>): SchedulerJob[];
