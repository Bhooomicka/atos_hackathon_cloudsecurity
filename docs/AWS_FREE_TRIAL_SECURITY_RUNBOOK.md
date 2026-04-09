# AWS Free-Trial Security Runbook (Aligned to Technology Design Slide)

This runbook implements the architecture blocks from your slide in a **single AWS account** with a **credit-conscious setup**.

## Scope and Goals

Architecture blocks covered:

1. AWS IAM and least-privilege controls
2. CloudTrail + GuardDuty
3. Secrets Manager (+ optional rotation Lambda)
4. AWS Config + Security Hub
5. EventBridge + Lambda (automated offboarding action)
6. CI/CD policy-as-code checks

This runbook is optimized for:

- Startup/prototype security baseline
- AWS trial/credit accounts
- Fast setup without multi-account organization overhead

## Important Cost Guardrails

1. Start in one region: `us-east-1`.
2. Use one trail, one Config recorder, and only a small set of rules.
3. GuardDuty/Security Hub are useful, but still set calendar reminders to review or disable if you are not actively using them.
4. Avoid NAT Gateway, always-on ECS/Fargate, and DocumentDB while on trial credits.
5. Turn on AWS Budgets alerts first, before enabling security services.

## Phase 0: Budget Safety Net (Do This First)

1. In AWS Console, go to `Billing and Cost Management -> Budgets`.
2. Create a monthly **cost budget** with alerts at:
   1. `20 USD`
   2. `50 USD`
   3. `80 USD`
3. Add your email as alert recipient.
4. In `Billing Preferences`, enable:
   1. `Receive billing alerts`
   2. `Receive Free Tier usage alerts`

## Phase 1: IAM Baseline

1. Create an admin group for yourself; avoid using root credentials for daily work.
2. Enable MFA for:
   1. root account
   2. all IAM users
3. Create a deployment role for CI (GitHub Actions or other pipeline).
4. Use permission boundaries for app roles to prevent accidental over-permissioning.

### Minimal IAM Practices

- Do not create long-lived access keys unless absolutely required.
- Prefer temporary credentials from roles.
- Tag IAM roles and policies (`Environment`, `Owner`, `Purpose`) for auditability.

## Phase 2: CloudTrail + GuardDuty

### CloudTrail

1. Create one multi-service trail in `us-east-1`.
2. Send logs to an S3 bucket, for example: `sentinel-cloudtrail-logs-<account-id>`.
3. Enable log file validation.
4. (Optional) Send events to CloudWatch Logs for near-real-time monitoring.

### GuardDuty

1. Enable GuardDuty in the same region.
2. Keep findings export simple at first (Console dashboard is enough for trial phase).
3. Later, route high-severity findings to EventBridge for notifications/automation.

## Phase 3: Secrets Manager (+ Rotation)

1. Store app secrets (JWT key, DB URL, API keys) in Secrets Manager.
2. Do not hardcode secrets in `.env` committed to git.
3. Grant read access only to runtime roles that need each secret.

### Rotation Pattern

- For trial/prototype, start with scheduled reminder + manual rotation.
- Add Lambda rotation only for secrets where automatic rotation is needed now.

## Phase 4: Config + Security Hub

### AWS Config

1. Enable Config recorder in one region.
2. Start with a small rule set:
   1. root MFA enabled
   2. S3 buckets not publicly writable
   3. IAM policy should not allow full admin (`*:*`) broadly

### Security Hub

1. Enable Security Hub in one region.
2. Keep only necessary standards initially to reduce noise.
3. Triage findings weekly and suppress only with documented reason.

## Phase 5: EventBridge + Lambda (Offboarding Automation)

This is the direct implementation of your slide's "departure event revokes access quickly" idea.

### Event Flow

1. HR system (or internal tool) sends an offboarding event.
2. EventBridge rule matches `detail-type = employee.offboarding`.
3. Lambda revokes IAM login profile, disables active access keys, and tags user as offboarded.

### Example Event Payload

```json
{
  "source": "company.hr",
  "detail-type": "employee.offboarding",
  "detail": {
    "username": "jane.doe",
    "ticket_id": "HR-1248",
    "reason": "termination"
  }
}
```

### Lambda Handler (Python)

```python
import boto3
from botocore.exceptions import ClientError

iam = boto3.client("iam")


def lambda_handler(event, context):
    username = event["detail"]["username"]

    # 1) Remove console login if present
    try:
        iam.delete_login_profile(UserName=username)
    except ClientError as e:
        if e.response["Error"]["Code"] != "NoSuchEntity":
            raise

    # 2) Disable all active access keys
    keys = iam.list_access_keys(UserName=username).get("AccessKeyMetadata", [])
    for key in keys:
        iam.update_access_key(
            UserName=username,
            AccessKeyId=key["AccessKeyId"],
            Status="Inactive",
        )

    # 3) Tag for audit trail
    iam.tag_user(
        UserName=username,
        Tags=[
            {"Key": "Offboarded", "Value": "true"},
            {"Key": "OffboardingSource", "Value": event.get("source", "unknown")},
        ],
    )

    return {"status": "ok", "username": username}
```

## Phase 6: CI/CD Policy-as-Code

Keep IAM and security config in version control.

### Recommended Pipeline Checks

1. `terraform fmt -check`
2. `terraform validate`
3. static IaC scanner (for example `tfsec` or `checkov`)
4. policy linting for IAM JSON policies
5. block merge on high-severity findings

## Suggested 2-Week Execution Plan

1. Day 1-2: Budget alarms + IAM + MFA
2. Day 3-4: CloudTrail + baseline logging bucket
3. Day 5: GuardDuty enabled and reviewed
4. Day 6-7: Secrets moved to Secrets Manager
5. Day 8-9: Config + Security Hub minimal controls
6. Day 10-11: EventBridge + Lambda offboarding flow
7. Day 12-14: CI policy checks + cleanup of unused resources

## Cleanup Checklist (To Protect Credits)

If pausing project work:

1. Disable GuardDuty (if not needed)
2. Disable Security Hub (if not needed)
3. Stop non-essential Lambda schedules
4. Remove test secrets and stale CloudWatch log groups
5. Re-check Budgets and current month spend

## Mapping Back to the Slide

1. AWS IAM & SCPs -> IAM roles, permission boundaries, MFA baseline
2. CloudTrail + GuardDuty -> audit + threat detection
3. AWS Secrets Manager -> centralized secrets and optional rotation
4. AWS Config + Security Hub -> continuous posture findings
5. EventBridge + Lambda -> near real-time offboarding revocation
6. CI/CD policy-as-code -> validated IaC and IAM changes on every PR

