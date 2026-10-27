/**
 * Knowledge about sequencing and analysis files: what a file is, whether it
 * is raw data, a final result, a regenerable intermediate, or a cache, and
 * what to do about it. Rules are advisory — every suggestion keeps raw data
 * and final results, and asks for a check that the producing run finished.
 * @module dsh-wisp-ops/collectors/omics
 */

/** How valuable a file is to keep. */
export type Retention =
  /** Instrument output or downloaded raw reads: keep, archive to cold storage. */
  | 'raw'
  /** Pipeline deliverables: keep. */
  | 'final'
  /** Regenerable from inputs once the run succeeded. */
  | 'intermediate'
  /** Same content in a smaller form (compression, CRAM, bigWig). */
  | 'reducible'
  /** Re-downloadable or rebuildable caches. */
  | 'cache'
  /** Scratch and temporary files. */
  | 'temp'
  /** Logs: keep recent, compress or rotate old. */
  | 'log'
  /** Unknown value: ask the owner. */
  | 'review'

export interface FileKind {
  readonly id: string
  readonly label: string
  readonly retention: Retention
  readonly advice: string
}

interface Rule extends FileKind {
  readonly test: RegExp
}

/** Ordered: the first matching rule wins; tests run on the lowercased full path. */
const RULES: readonly Rule[] = [
  // Pipeline working directories.
  { id: 'nextflow-work', test: /\/work\/[0-9a-f]{2}\/[0-9a-f]{20,}\//, label: 'Nextflow work directory', retention: 'intermediate', advice: 'Task scratch of a Nextflow run. After the run completed and results were published, `nextflow clean -f` (or remove work/) — keep it only while you may `-resume`.' },
  { id: 'snakemake-meta', test: /\/\.snakemake\/(?:shadow|incomplete|conda-archive|singularity|metadata)\//, label: 'Snakemake shadow/metadata', retention: 'intermediate', advice: 'Snakemake bookkeeping; shadow/ and incomplete/ can go once no run is active (`snakemake --cleanup-shadow`, `--cleanup-metadata`). Conda envs in .snakemake/conda are rebuildable.' },
  { id: 'star-tmp', test: /\/_star(?:tmp|genome)\/|_startmp\//, label: 'STAR temporary', retention: 'temp', advice: 'STAR leftovers of a finished or crashed alignment; remove when no STAR process is running.' },
  { id: 'cellranger-pipeline', test: /\/sc_(?:rna|atac|multi|vdj)_[a-z_]*cs\//, label: 'Cell Ranger pipeline stage', retention: 'intermediate', advice: 'Cell Ranger internal stage directories; when outs/ (web_summary.html, filtered matrices) exists the stage directory can be removed.' },
  { id: 'gatk-tmp', test: /\/(?:gatk_tmp|tmp_gatk|\.gatk)|\.tmp\.\d+\.bam$|\.bam\.tmp\.\d{4}\.bam$|\.sorting\.bam$/, label: 'sort/GATK temporary', retention: 'temp', advice: 'Temporary sort or GATK files from an interrupted job; remove if no process holds them.' },
  // Raw instrument data.
  { id: 'bcl', test: /\.(?:c?bcl)(?:\.gz|\.bgzf)?$|\/thumbnail_images\//, label: 'Illumina run data (BCL)', retention: 'raw', advice: 'Raw sequencer output. Once demultiplexed FASTQ is verified, archive the run folder (or keep per your facility policy) instead of keeping it on fast storage.' },
  { id: 'nanopore-raw', test: /\.(?:fast5|pod5|blow5|slow5)$/, label: 'Nanopore raw signal', retention: 'raw', advice: 'Raw signal is needed for re-basecalling. Archive to cold storage; POD5 is smaller than FAST5 (`pod5 convert fast5`).' },
  { id: 'sra', test: /\.sra(?:lite)?$/, label: 'SRA archive', retention: 'intermediate', advice: 'Re-downloadable by accession. After fasterq-dump produced (and you checked) FASTQ, delete the .sra.' },
  // Reads.
  { id: 'fastq-trimmed', test: /(?:trim|clean|filtered|_val_[12]|\.paired|\.unpaired|_unpaired|fastp|cutadapt|\.qc\.)[^/]*\.(?:fastq|fq)(?:\.gz|\.bz2|\.zst)?$/, label: 'Trimmed/filtered FASTQ', retention: 'intermediate', advice: 'Regenerable from raw reads with the logged trimming command. Delete once alignments are final.' },
  { id: 'fastq-plain', test: /\.(?:fastq|fq)$/, label: 'Uncompressed FASTQ', retention: 'reducible', advice: 'Compress (`pigz -p 8` or `zstd -T8`); aligners and most tools read .gz directly. Typically 3–5× smaller.' },
  { id: 'fastq', test: /\.(?:fastq|fq)\.(?:gz|bz2|xz|zst)$|\.(?:fastq|fq)\.ora$/, label: 'Raw FASTQ', retention: 'raw', advice: 'Raw reads: keep, and archive a verified copy (md5sum) to cold storage.' },
  { id: 'fasta-plain', test: /\.(?:fa|fasta|fna|ffn|faa)$/, label: 'Uncompressed FASTA', retention: 'reducible', advice: 'Large FASTA can be bgzip-compressed (`bgzip` + `samtools faidx` keeps random access).' },
  // Alignments.
  { id: 'sam', test: /\.sam$/, label: 'SAM alignment', retention: 'reducible', advice: 'Uncompressed alignments. Convert to sorted BAM/CRAM (`samtools sort -@8 -o x.bam x.sam && samtools quickcheck x.bam`), then delete the SAM.' },
  { id: 'bam-unsorted', test: /(?:unsorted|\.raw|aligned\.out|\.unsort)[^/]*\.bam$/, label: 'Unsorted BAM', retention: 'intermediate', advice: 'Pre-sort alignment; delete once the sorted, indexed BAM passes `samtools quickcheck`.' },
  { id: 'bam', test: /\.bam$/, label: 'BAM alignment', retention: 'reducible', advice: 'Final alignments can be stored as CRAM (`samtools view -C -T ref.fa`, roughly 40–60% smaller) once the reference FASTA is archived with it.' },
  { id: 'cram', test: /\.cram$/, label: 'CRAM alignment', retention: 'final', advice: 'Keep together with the exact reference FASTA it was encoded against.' },
  { id: 'index', test: /\.(?:bai|crai|csi|tbi|fai|gzi)$/, label: 'Index', retention: 'final', advice: 'Small; keep or delete together with the file it indexes.' },
  // Variants and tracks.
  { id: 'gvcf', test: /\.g\.vcf(?:\.gz)?$/, label: 'gVCF', retention: 'review', advice: 'Needed to re-run joint genotyping with new samples; delete only when the cohort is final.' },
  { id: 'vcf-plain', test: /\.vcf$/, label: 'Uncompressed VCF', retention: 'reducible', advice: 'Compress and index: `bgzip x.vcf && tabix -p vcf x.vcf.gz` (or convert to BCF).' },
  { id: 'vcf', test: /\.(?:vcf\.gz|bcf)$/, label: 'Variant calls', retention: 'final', advice: 'Results: keep.' },
  { id: 'track-plain', test: /\.(?:bedgraph|bdg|wig)$/, label: 'Text coverage track', retention: 'reducible', advice: 'Convert to bigWig (`bedGraphToBigWig`) and remove the text track.' },
  { id: 'pileup', test: /\.(?:mpileup|pileup)$/, label: 'Pileup', retention: 'intermediate', advice: 'Regenerable from BAM; delete after variant calling.' },
  // Single-cell and analysis objects.
  { id: 'sc-object', test: /\.(?:h5ad|loom|rds|rdata|rda|h5seurat|qs)$/, label: 'Analysis object', retention: 'review', advice: 'Checkpoints of interactive analysis; keep the latest per project, ask the owner about older ones.' },
  { id: 'matrix', test: /\.(?:mtx|mtx\.gz|h5)$/, label: 'Count matrix / HDF5', retention: 'final', advice: 'Usually results; keep.' },
  // Generic.
  { id: 'core', test: /\/core(?:\.\d+)?$|\.core$/, label: 'Core dump', retention: 'temp', advice: 'Crash dump; inspect with gdb if needed, then delete.' },
  { id: 'archive', test: /\.(?:tar|tar\.gz|tgz|tar\.bz2|tar\.zst|zip|7z)$/, label: 'Archive', retention: 'review', advice: 'If it has already been extracted, keep either the archive or the extracted copy, not both.' },
  { id: 'log-rotated', test: /\.(?:log|out|err)\.(?:\d+|gz|xz)$/, label: 'Rotated log', retention: 'log', advice: 'Old rotated logs; compress or delete beyond your retention period.' },
  { id: 'log', test: /\.(?:log|out|err|stdout|stderr)$|\/slurm-\d+(?:_\d+)?\.out$/, label: 'Log', retention: 'log', advice: 'Large logs: check what is writing them (verbosity), compress old ones; never delete a log a process still writes.' },
  { id: 'checkpoint', test: /\.(?:ckpt|pt|pth|safetensors|bin|onnx)$/, label: 'Model weights / checkpoint', retention: 'review', advice: 'Training checkpoints: keep the best and latest, ask the owner about the rest.' },
  { id: 'cache', test: /\/\.cache\/|\/pkgs\/|\/\.conda\/|\/site-packages\/|\/node_modules\//, label: 'Cache / packages', retention: 'cache', advice: 'Rebuildable caches: `conda clean --all`, `pip cache purge`, `huggingface-cli delete-cache` as the owning user.' },
  { id: 'temp', test: /\/(?:tmp|temp|scratch)\/|\.(?:tmp|temp|swp|part)$/, label: 'Temporary', retention: 'temp', advice: 'Scratch files; remove those older than a few days that no process holds.' },
]

const OTHER: FileKind = { id: 'other', label: 'Other', retention: 'review', advice: 'Unclassified; ask the owner.' }

export function classifyPath(path: string): FileKind {
  const lower = path.toLowerCase()
  const rule = RULES.find(r => r.test.test(lower))
  if (rule === undefined) return OTHER
  const { test: _test, ...kind } = rule
  return kind
}

export function kindById(id: string): FileKind {
  if (id === OTHER.id) return OTHER
  const rule = RULES.find(r => r.id === id)
  if (rule === undefined) return OTHER
  const { test: _test, ...kind } = rule
  return kind
}

/** Sample stem: file name up to its first dot, with read-pair markers removed. */
function stem(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  return name.split('.')[0]?.replace(/_(?:r?[12]|read[12])$/i, '') ?? name
}

function dirOf(path: string): string {
  return path.slice(0, path.lastIndexOf('/'))
}

/** Stage words that mark a BAM as derived from an earlier BAM of the same sample. */
const BAM_STAGES = ['sorted', 'sort', 'dedup', 'dedupped', 'markdup', 'markdups', 'md', 'rmdup', 'filtered', 'filt', 'recal', 'bqsr', 'realigned', 'clean', 'final']

function stageDepth(name: string): number {
  const parts = name.toLowerCase().split(/[._-]/)
  return parts.filter(p => BAM_STAGES.includes(p)).length
}

export interface Redundancy {
  readonly path: string
  /** The file that makes this one redundant. */
  readonly supersededBy: string
  readonly reason: string
}

/**
 * Files made redundant by a sibling: SAM next to BAM/CRAM, BAM next to CRAM,
 * an earlier-stage BAM next to a later-stage BAM of the same sample, plain
 * FASTQ/VCF next to the compressed copy, SRA next to its FASTQ.
 */
export function findRedundant(paths: readonly string[]): Redundancy[] {
  const byDirStem = new Map<string, string[]>()
  for (const path of paths) {
    const key = `${dirOf(path)}\u0000${stem(path)}`
    byDirStem.set(key, [...byDirStem.get(key) ?? [], path])
  }
  const all = new Set(paths)
  const out: Redundancy[] = []
  const add = (path: string, supersededBy: string, reason: string) => {
    if (!out.some(r => r.path === path)) out.push({ path, supersededBy, reason })
  }
  for (const group of byDirStem.values()) {
    const lower = (p: string) => p.toLowerCase()
    const bams = group.filter(p => lower(p).endsWith('.bam'))
    const crams = group.filter(p => lower(p).endsWith('.cram'))
    const fastqs = group.filter(p => /\.(?:fastq|fq)(?:\.gz|\.zst|\.bz2)?$/.test(lower(p)))
    for (const sam of group.filter(p => lower(p).endsWith('.sam'))) {
      const target = bams[0] ?? crams[0]
      if (target !== undefined) add(sam, target, 'a BAM/CRAM of the same sample exists; verify it with `samtools quickcheck` and delete the SAM')
    }
    if (crams.length > 0) {
      for (const bam of bams) add(bam, crams[0] as string, 'a CRAM of the same sample exists; verify it, then the BAM is a duplicate')
    } else if (bams.length > 1) {
      const deepest = [...bams].sort((a, b) => stageDepth(b) - stageDepth(a))[0] as string
      for (const bam of bams) {
        if (bam !== deepest && stageDepth(bam) < stageDepth(deepest)) add(bam, deepest, 'a later processing stage of the same sample exists; this earlier-stage BAM is an intermediate once the final BAM is validated')
      }
    }
    for (const sra of group.filter(p => /\.sra(?:lite)?$/.test(lower(p)))) {
      if (fastqs[0] !== undefined) add(sra, fastqs[0], 'FASTQ already extracted from this SRA')
    }
  }
  for (const path of paths) {
    const l = path.toLowerCase()
    if (/\.(?:fastq|fq|vcf|fa|fasta)$/.test(l)) {
      const compressed = [`${path}.gz`, `${path}.zst`, `${path}.bz2`].find(p => all.has(p))
      if (compressed !== undefined) add(path, compressed, 'a compressed copy exists; verify it (`gzip -t` / `zstd -t`), then remove the uncompressed file')
    }
  }
  return out
}

export const RETENTION_ORDER: readonly Retention[] = ['temp', 'intermediate', 'cache', 'reducible', 'log', 'review', 'final', 'raw']

export const RETENTION_LABEL: Record<Retention, string> = {
  raw: 'raw data — keep/archive',
  final: 'results — keep',
  intermediate: 'regenerable intermediate',
  reducible: 'can be compressed/converted',
  cache: 'rebuildable cache',
  temp: 'temporary',
  log: 'log',
  review: 'ask the owner',
}
