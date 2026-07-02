

---

# Myraid Assignment — DevOps Technical Assessment

Node.js/Express app deployed on AWS EC2, with automated backups, CI/CD, monitoring, and load testing.

**Live App:** http://13.211.215.91:5000/

## Architecture

```
Developer → GitHub (push to main) → GitHub Actions
                                          │
                                    AWS SSM SendCommand
                                          │
                                     EC2 (Node + PM2)
                                     /              \
                                Amazon S3        CloudWatch
                               (backups)      (metrics, alarms)
                                     \              /
                                    Load Testing (k6)
                                          │
                              Optimization Recommendations
```

No SSH used anywhere — access and deployment go through AWS Systems Manager only.

## Stack
EC2 (t3.micro) · Node.js/Express + PM2 · S3 · CloudWatch · GitHub Actions · k6 · SSM Session Manager

## Setup
EC2 instance runs the app under PM2 for auto-restart. No SSH key pair used; managed entirely via SSM Session Manager.

## S3 Backups
Private bucket `anagha-myraid-backups`. EC2 has an IAM role scoped only to `PutObject`/`GetObject`/`ListBucket` on this bucket — no static AWS keys on the server. App is tar'd and uploaded via cron nightly + on demand. Verified: `app-backup-2026-07-02.tar.gz` (708.7 KB) in bucket.

## CI/CD
Push to `main` → GitHub Actions → authenticates with an IAM user scoped only to `ssm:SendCommand` → sends a command via SSM to `git pull`, `npm install`, `pm2 restart all` on EC2. No SSH keys, no long-lived credentials on the instance. Verified working (Run #2 — Success, 13s).

## Security
- No SSH / no open port 22 — SSM Session Manager only
- IAM user for deploys scoped to one action (`ssm:SendCommand`)
- IAM role for backups scoped to one bucket
- All sessions and commands logged via CloudTrail

## Monitoring (CloudWatch)
- Tracked: CPU, NetworkIn/Out, NetworkPacketsOut
- Alarm: `HighCPU-Alarm`, triggers at CPU > 70% for 5 min — currently OK
- App logs via PM2 (`pm2 logs`)

## Load Testing (k6)
100 VUs ramped over ~3 min:

| Metric | Result |
|---|---|
| Avg response time | 187.09 ms |
| p95 latency | 257.01 ms |
| Max latency | 510.54 ms |
| Throughput | 9.12 req/s (4,519 requests) |
| Error rate | 0.00% |

Memory during test: 908MB total, 486MB used, 422MB available. CPU stayed well under alarm threshold.

## Bottleneck Analysis
Zero errors under load, but CPU stayed low while p95 latency trailed the average — pointing to Node's single-threaded event loop as the limiting factor, not raw compute.

## Optimization Recommendations
1. **Enable PM2 cluster mode** — uses all CPU cores instead of just one
2. **Add Nginx** in front of the app for compression and serving static files
3. **Move static assets to S3 + CloudFront** for faster delivery
4. **Cache frequent API responses** (Redis or in-memory) to reduce repeat work
5. **Scale up** — bigger instance or Auto Scaling + Load Balancer for real traffic
6. **Add rate limiting** to protect against traffic spikes
7. **Add a memory alarm** in CloudWatch alongside the existing CPU alarm
