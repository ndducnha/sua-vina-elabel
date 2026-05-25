# GitLab CI Telegram Alert

Shared GitLab CI template to send **Telegram alerts when a pipeline FAILS**.

- Works for **all branches**
- Channel and owner are configured **per project via CI variables**
- No secrets stored in this repo

---

## Usage

### 1. Copy alert template into your project

In your project repository, create the following structure:

    .gitlab/
    └─ alerts/
       └─ telegram.yml

Copy the content of `telegram.yml` from this repository into
`.gitlab/alerts/telegram.yml`.

------------------------------------------------------------------------

### 2. Include the alert locally in `.gitlab-ci.yml`

At the top of your project `.gitlab-ci.yml`, add:

``` yaml
include:
  - local: .gitlab/alerts/telegram.yml
```

This approach ensures: 
- Pipelines can be created by Developers and Maintainers 
- No cross-project permission is required 
- No CI/CD job token or personal access token is needed

---

## Required CI Variables

### Global (Instance or Group level)
Set once by DevOps:

| Variable | Description |
|--------|-------------|
| `TG_BOT_TOKEN` | Telegram bot token |
| `TG_CHAT_CRITICAL` | Telegram chat ID for critical alerts |
| `TG_CHAT_WARNING` | Telegram chat ID for warning alerts |

---

### Project-level configuration

Set in **Project → Settings → CI/CD → Variables**:

| Variable | Example | Default |
|-------|--------|--------|
| `ALERT_ENABLED` | `true` / `false` | `false` |
| `ALERT_CHANNEL` | `CRITICAL` / `WARNING` | `WARNING` |
| `ALERT_OWNER` | `team-backend` / `@alice` | `unknown` |

---

## Alert behavior
- Alert is sent **only when the pipeline status is FAILED**
- No alert for success, canceled, or skipped pipelines

---

## Disable alert
To temporarily disable alerts for a project:

```
ALERT_ENABLED=false
```

---

## Ownership
Alert logic is maintained by the DevOps team.  
Projects must not modify the template.
