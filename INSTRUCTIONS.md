# FastCLI Installation Instructions

## Why?

While maintaining CI is often viewed as a low-priority task, neglecting it is risky. Without regular maintenance, technical debt accumulates, and the CI pipeline eventually becomes a major development bottleneck.

## What?

A drop-in agent that lives in your CI and automatically optimizes performance.

## How?

Run FastCLI at the start of each job to flag bottlenecks as GitHub Issues. To automate fixes, deploy the `fastci-agent.yaml` workflow—it automatically converts those issues into clean, ready-to-merge PRs.

---

<details>
<summary> <b>Step 1: Add FastCLI to Each Job </b> </summary>  

> <br/> [![fix_in_cursor](https://github.com/user-attachments/assets/2aa1148f-ecb9-4949-8e64-c0d6a0a7e556)](https://cursor.com/link/prompt?text=Add+the+following+step+as+the+**first+step**+in+each+job+of+your+GitHub+Actions+workflows.%0A%0A%3E+**Note%3A**+This+workflow+requires+%60issues%3A+write%60+permission+to+create+issues.%0A%0A%60%60%60yaml%0A-+uses%3A+jfrog-fastci%2Ffastci%40v0%0A++with%3A%0A++++github_token%3A+%24%7B%7B+secrets.GITHUB_TOKEN+%7D%7D%0A%60%60%60%0A%0A%23%23%23+Example%0A%0A%60%60%60yaml%0Ajobs%3A%0A++permissions%3A%0A++++contents%3A+read%0A++++issues%3A+write%0A%0A++build%3A%0A++++runs-on%3A+ubuntu-latest%0A++++steps%3A%0A++++++-+uses%3A+jfrog-fastci%2Ffastci%40v0%0A++++++++with%3A%0A++++++++++github_token%3A+%24%7B%7B+secrets.GITHUB_TOKEN+%7D%7D%0A++++++%0A++++++-+uses%3A+actions%2Fcheckout%40v4%0A++++++%23+...+rest+of+your+build+steps%0A%60%60%60) <br/> <br/> 


Add the following step as the **first step** in each job of your GitHub Actions workflows.

> **Note:** This workflow requires `issues: write` permission to create issues.

```yaml
- uses: jfrog-fastci/fastci@v0
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Example

```yaml
jobs:
  permissions:
    contents: read
    issues: write

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: jfrog-fastci/fastci@v0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
      
      - uses: actions/checkout@v4
      # ... rest of your build steps
```

</details>

<details>
<summary> <b>Step 2: Add the FastCI Agent Workflow (Recommended)</b> </summary>

> <br> [![fix_in_cursor](https://github.com/user-attachments/assets/2aa1148f-ecb9-4949-8e64-c0d6a0a7e556)](https://cursor.com/link/prompt?text=To+automatically+fix+issues+flagged+by+FastCLI%2C+create+the+following+workflow+file+at+%60.github%2Fworkflows%2Ffastci-agent.yaml%60%3A%0A%0A%60%60%60yaml%0Aname%3A+FastCI+Agent+%E2%9A%A1%0A%0Aon%3A%0A++issues%3A%0A++++types%3A+%5Bopened%2C+reopened%5D%0A%0Apermissions%3A%0A++contents%3A+write%0A++pull-requests%3A+write%0A++issues%3A+write%0A%0Ajobs%3A%0A++attempt-fix%3A%0A++++if%3A+contains%28github.event.issue.labels.*.name%2C+%27fastci-insight%27%29+%7C%7C+startsWith%28github.event.issue.title%2C+%27%5BFastCI%5D%27%29%0A++++runs-on%3A+ubuntu-latest%0A++++steps%3A%0A++++++-+uses%3A+actions%2Fcheckout%40v4%0A%0A++++++-+name%3A+Setup%0A++++++++id%3A+setup%0A++++++++env%3A%0A++++++++++ISSUE_BODY%3A+%24%7B%7B+github.event.issue.body+%7D%7D%0A++++++++++ISSUE_TITLE%3A+%24%7B%7B+github.event.issue.title+%7D%7D%0A++++++++++ISSUE_NUMBER%3A+%24%7B%7B+github.event.issue.number+%7D%7D%0A++++++++run%3A+%7C%0A++++++++++curl+https%3A%2F%2Fcursor.com%2Finstall+-fsS+%7C+bash%0A++++++++++echo+%22%24HOME%2F.cursor%2Fbin%22+%3E%3E+%24GITHUB_PATH%0A++++++++++git+config+user.name+%22Cursor+Agent%22%0A++++++++++git+config+user.email+%22cursoragent%40cursor.com%22%0A++++++++++%0A++++++++++%23+Extract+AI+prompt+from+%22For+AI+Agents%22+section+or+use+full+body%0A++++++++++AI_PROMPT%3D%24%28echo+%22%24ISSUE_BODY%22+%7C+sed+-n+%27%2F%23%23+For+AI+Agents%2F%2C%2F%60%60%60%24%2Fp%27+%7C+sed+-n+%27%2F%60%60%60%2F%2C%2F%60%60%60%2Fp%27+%7C+sed+%271d%3B%24d%27%29%0A++++++++++%5B+-z+%22%24AI_PROMPT%22+%5D+%26%26+AI_PROMPT%3D%22%24ISSUE_BODY%22%0A++++++++++echo+%22%24AI_PROMPT%22+%3E+%2Ftmp%2Fai_prompt.txt%0A++++++++++%0A++++++++++%23+Generate+branch+name%0A++++++++++CLEAN_TITLE%3D%24%28echo+%22%24ISSUE_TITLE%22+%7C+sed+%27s%2F%5E%5C%5BFastCI%5C%5D+%2F%2F%27+%7C+tr+%27%5B%3Aupper%3A%5D%27+%27%5B%3Alower%3A%5D%27+%7C+tr+%27+%27+%27-%27+%7C+tr+-cd+%27a-z0-9-%27+%7C+cut+-c1-40%29%0A++++++++++echo+%22branch%3D%24%7BISSUE_NUMBER%7D-bugfix%2F%24%7BCLEAN_TITLE%7D%22+%3E%3E+%24GITHUB_OUTPUT%0A%0A++++++-+name%3A+Fix+FastCI+insight%0A++++++++env%3A%0A++++++++++CURSOR_API_KEY%3A+%24%7B%7B+secrets.CURSOR_API_KEY+%7D%7D%0A++++++++++GH_TOKEN%3A+%24%7B%7B+secrets.GH_ACCESS_TOKEN+%7D%7D%0A++++++++++BRANCH%3A+%24%7B%7B+steps.setup.outputs.branch+%7D%7D%0A++++++++++ISSUE_NUM%3A+%24%7B%7B+github.event.issue.number+%7D%7D%0A++++++++++REPO%3A+%24%7B%7B+github.repository+%7D%7D%0A++++++++run%3A+%7C%0A++++++++++agent+-p+%22Fix+CI+issue+in+%24REPO.+GitHub+CLI+%28%5C%60gh%5C%60%29+is+authenticated.%0A%0A++++++++++Issue+%23%24ISSUE_NUM%3A+%24%7B%7B+github.event.issue.title+%7D%7D%0A++++++++++Task%3A+%24%28cat+%2Ftmp%2Fai_prompt.txt%29%0A%0A++++++++++Steps%3A%0A++++++++++1.+Create+branch%3A+%24BRANCH%0A++++++++++2.+Implement+the+fix+with+minimal%2C+targeted+changes%0A++++++++++3.+Commit+with+message%3A+%27Fix+%23%24ISSUE_NUM%3A+%3Cdescription%3E%27%0A++++++++++4.+Push+and+create+PR+with+body+containing+%27Fixes+%23%24ISSUE_NUM%27%0A++++++++++5.+Comment+on+issue+%23%24ISSUE_NUM+with+PR+link%0A%0A++++++++++If+fix+cannot+be+automated%2C+comment+on+the+issue+explaining+why.%0A++++++++++%22+--force+--model+composer-1+--output-format%3Dtext%0A%60%60%60) 
<br/> <br/>


## Step 2: Add the FastCI Agent Workflow (Recommended)

To automatically fix issues flagged by FastCLI, create the following workflow file at `.github/workflows/fastci-agent.yaml`:

```yaml
name: FastCI Agent ⚡

on:
  issues:
    types: [opened, reopened]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  attempt-fix:
    if: contains(github.event.issue.labels.*.name, 'fastci-insight') || startsWith(github.event.issue.title, '[FastCI]')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        id: setup
        env:
          ISSUE_BODY: ${{ github.event.issue.body }}
          ISSUE_TITLE: ${{ github.event.issue.title }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
        run: |
          curl https://cursor.com/install -fsS | bash
          echo "$HOME/.cursor/bin" >> $GITHUB_PATH
          git config user.name "Cursor Agent"
          git config user.email "cursoragent@cursor.com"
          
          # Extract AI prompt from "For AI Agents" section or use full body
          AI_PROMPT=$(echo "$ISSUE_BODY" | sed -n '/## For AI Agents/,/```$/p' | sed -n '/```/,/```/p' | sed '1d;$d')
          [ -z "$AI_PROMPT" ] && AI_PROMPT="$ISSUE_BODY"
          echo "$AI_PROMPT" > /tmp/ai_prompt.txt
          
          # Generate branch name
          CLEAN_TITLE=$(echo "$ISSUE_TITLE" | sed 's/^\[FastCI\] //' | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' | cut -c1-40)
          echo "branch=${ISSUE_NUMBER}-bugfix/${CLEAN_TITLE}" >> $GITHUB_OUTPUT

      - name: Fix FastCI insight
        env:
          CURSOR_API_KEY: ${{ secrets.CURSOR_API_KEY }}
          GH_TOKEN: ${{ secrets.GH_ACCESS_TOKEN }}
          BRANCH: ${{ steps.setup.outputs.branch }}
          ISSUE_NUM: ${{ github.event.issue.number }}
          REPO: ${{ github.repository }}
        run: |
          agent -p "Fix CI issue in $REPO. GitHub CLI (\`gh\`) is authenticated.

          Issue #$ISSUE_NUM: ${{ github.event.issue.title }}
          Task: $(cat /tmp/ai_prompt.txt)

          Steps:
          1. Create branch: $BRANCH
          2. Implement the fix with minimal, targeted changes
          3. Commit with message: 'Fix #$ISSUE_NUM: <description>'
          4. Push and create PR with body containing 'Fixes #$ISSUE_NUM'
          5. Comment on issue #$ISSUE_NUM with PR link

          If fix cannot be automated, comment on the issue explaining why.
          " --force --model composer-1 --output-format=text
```

</details>

<details>
<summary>Step 3: Configure the Required Secrets</summary>


For the FastCI Agent workflow to function, you need to configure these secrets in your repository:

| Secret | Description |
|--------|-------------|
| `CURSOR_API_KEY` | API key for the Cursor AI agent |
| `GH_ACCESS_TOKEN` | Personal Access Token with `repo` and `issues` permissions (needed for PR creation) |

</details>

## How It Works

1. **FastCLI analyzes your CI runs** and identifies performance bottlenecks
2. **Issues are automatically created** with the `fastci-insight` label or `[FastCI]` prefix
3. **The FastCI Agent workflow triggers** on new issues matching these criteria
4. **An AI agent implements the fix** and creates a pull request
5. **Merging the PR auto-closes the issue** via GitHub's linking feature

---

## Quick Start Checklist

- [ ] Add the FastCLI step to all jobs in your workflows
- [ ] Create the `fastci-agent.yaml` workflow
- [ ] Prompt the User to configure `CURSOR_API_KEY` and `GH_ACCESS_TOKEN` secrets
- [ ] Run your CI pipeline and watch for FastCI insights!
