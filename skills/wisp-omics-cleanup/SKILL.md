---
name: wisp-omics-cleanup
description: Space-cleanup advice for sequencing and bioinformatics servers — which FASTQ/BAM/CRAM/VCF, pipeline work directories and intermediates are safe to remove or shrink, how to verify first, and how to talk to data owners. Use with ops_files results.
---

# Cleaning up genomics / analysis storage

Use `ops_files host=<host> paths=<roots> days=<N> sudo=true` first; its plan already excludes files that are open or inside running Slurm jobs. This skill tells you how to turn the plan into safe actions.

## Never delete
- **Raw data**: BCL run folders, raw FASTQ (`*.fastq.gz`, `*.fq.gz`, `.ora`), POD5/FAST5. Suggest archiving (md5sum, copy to cold storage, verify, then remove the hot copy — only with the owner's written OK).
- **Final results**: CRAM with its reference, VCF/BCF, count matrices, `outs/` of Cell Ranger, published pipeline `results/`.
- Anything another user owns, without that user's agreement. Propose a message to them instead.

## Usually safe after the run succeeded (verify first)
| What | How to verify | Action |
|---|---|---|
| Nextflow `work/` | `.nextflow.log` ends with `Execution complete -- Goodbye`; results published | `nextflow clean -f` in the launch dir, or remove `work/` |
| Snakemake `.snakemake/shadow`, `incomplete/` | no running snakemake, no locks | `snakemake --cleanup-shadow`; `--unlock` only if no run is active |
| Cell Ranger `SC_*_CS/` | `outs/web_summary.html` exists | remove the stage directory |
| SAM next to BAM/CRAM | `samtools quickcheck x.bam && samtools flagstat x.bam` | delete the SAM |
| Unsorted / earlier-stage BAM (`sorted` vs `sorted.markdup`) | final BAM passes quickcheck and is indexed | delete the earlier stage |
| Trimmed/filtered FASTQ | raw FASTQ still present; alignments final | delete trimmed reads |
| `.sra` after fasterq-dump | FASTQ read counts match (`seqkit stats`) | delete the .sra (re-downloadable by accession) |
| STAR `_STARtmp`, sort temp `*.tmp.NNNN.bam` | no STAR/samtools process | delete |
| Pileups, intermediate BED/bedGraph | downstream outputs exist | delete or convert to bigWig |

## Shrink instead of delete
- Uncompressed FASTQ: `pigz -p 8 x.fastq` (or `zstd -T8 --rm`), verify with `gzip -t`.
- BAM → CRAM: `samtools view -@8 -C -T ref.fa -o x.cram x.bam && samtools index x.cram && samtools quickcheck x.cram`, keep `ref.fa` + `.fai` next to it; then delete the BAM. Saves ~40–60%.
- VCF: `bgzip x.vcf && tabix -p vcf x.vcf.gz`.
- Many small files (inode pressure): `tar --zstd -cf run.tar.zst dir/` then verify `tar -tf`.

## Caches
`conda clean --all -y`, `mamba clean -a`, `pip cache purge`, `huggingface-cli scan-cache` / `delete-cache` — run as the owning user (ops_exec runs as the SSH user; use `sudo -u <user>` only with approval).

## How to present
Group by owner and by action; give reclaimable size, the verification command, and the exact action. Execute only the parts the user approves, one category at a time, then re-run `ops_files` / `ops_disk` to show the effect.
