#!/bin/bash
set -e

# Required Environment Variables:
# SLACK_TOKEN
# PROMOTION_STATUS (success/failure)
# PROMOTION_STAGE (release-to-dev/dev-to-main)
# VERSION
# PR_URL (if success)
# GITHUB_ACTOR
# GITHUB_REPOSITORY
# GITHUB_RUN_ID
# GITHUB_SERVER_URL
# FAILED_JOBS (if failure)

echo "Preparing Slack Notification for Version Promotion..."

if [ -z "$SLACK_TOKEN" ]; then
    echo "ERROR: SLACK_TOKEN not set."
    exit 1
fi

# Calculate Duration
CREATED_AT=$(gh run view $GITHUB_RUN_ID --json createdAt -q .createdAt)
START_TIME=$(date -d "$CREATED_AT" +%s)
CURRENT_TIME=$(date +%s)
DURATION_SECONDS=$((CURRENT_TIME - START_TIME))
DURATION=$(date -u -d @${DURATION_SECONDS} +"%Hh %Mm %Ss")

WORKFLOW_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
PROJECT_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}"

# Determine stage text
if [ "$PROMOTION_STAGE" == "release-to-dev" ]; then
    STAGE_TEXT="Release → Dev"
    ENVIRONMENT="dev"
else
    STAGE_TEXT="Dev → Main"
    ENVIRONMENT="main"
fi

if [ "$PROMOTION_STATUS" == "success" ]; then
    # Blue for dev, Yellow for main
    if [ "$PROMOTION_STAGE" == "release-to-dev" ]; then
        COLOR="#0000FF"  # Blue
        EMOJI="📦 → 🧪"
    else
        COLOR="#0000FF"  # Yellow/Gold
        EMOJI="📦 → 🚢"
    fi
    
    MAIN_TEXT="${EMOJI} Version ${VERSION} promoted to ${ENVIRONMENT}"
    HEADER_TEXT="${EMOJI} Promotion Succeeded: ${VERSION} → ${ENVIRONMENT}"
    STATUS_MSG="Version ${VERSION} successfully promoted from ${STAGE_TEXT}."
    
    # For success, show PR and workflow buttons (only include PR button if URL is valid)
    if [ -n "$PR_URL" ] && [ "$PR_URL" != "N/A" ]; then
        ACTIONS_ELEMENTS=$(jq -n --arg pr_url "$PR_URL" --arg workflow_url "$WORKFLOW_URL" '[
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View Pull Request",
                    "emoji": true
                },
                "url": $pr_url,
                "style": "primary"
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View Workflow",
                    "emoji": true
                },
                "url": $workflow_url
            }
        ]')
    else
        # Only show workflow button if PR URL is not available
        ACTIONS_ELEMENTS=$(jq -n --arg workflow_url "$WORKFLOW_URL" '[
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View Workflow",
                    "emoji": true
                },
                "url": $workflow_url,
                "style": "primary"
            }
        ]')
    fi
else
    COLOR="#ff0000"  # Red for failure
    MAIN_TEXT="🚨 Failed to promote version ${VERSION} to ${ENVIRONMENT}"
    HEADER_TEXT="🚨 Promotion Failed: ${VERSION} → ${ENVIRONMENT}"
    
    STATUS_MSG="Failed to promote version ${VERSION} from ${STAGE_TEXT}."
    
    if [ -n "$FAILED_JOBS" ]; then
        STATUS_MSG="Failed to promote version ${VERSION} from ${STAGE_TEXT}.\n\n*Failed jobs:* ${FAILED_JOBS}"
    fi
    
    # For failure, just View Workflow
    ACTIONS_ELEMENTS=$(jq -n --arg url "$WORKFLOW_URL" '[
        {
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": "View Workflow",
                "emoji": true
            },
            "url": $url,
            "style": "danger"
        }
    ]')
fi

# Construct Blocks
BLOCKS=$(jq -n \
    --arg header "$HEADER_TEXT" \
    --arg project "$PROJECT_URL" \
    --arg actor "$GITHUB_ACTOR" \
    --arg duration "$DURATION" \
    --arg status "$STATUS_MSG" \
    --arg stage "$STAGE_TEXT" \
    --arg version "$VERSION" \
    --argjson actions "$ACTIONS_ELEMENTS" \
    '[
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": $header,
                "emoji": true
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": ("*Project:*\n" + $project)
                },
                {
                    "type": "mrkdwn",
                    "text": ("*Version:*\n" + $version)
                },
                {
                    "type": "mrkdwn",
                    "text": ("*Stage:*\n" + $stage)
                },
                {
                    "type": "mrkdwn",
                    "text": ("*Triggered By:*\n" + $actor)
                },
                {
                    "type": "mrkdwn",
                    "text": ("*Duration:*\n" + $duration)
                }
            ]
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": $status
            }
        },
        {
            "type": "actions",
            "elements": $actions
        }
    ]')

# Construct Full Payload
PAYLOAD=$(jq -n \
    --arg channel "#fast-releases" \
    --arg text "$MAIN_TEXT" \
    --arg color "$COLOR" \
    --argjson blocks "$BLOCKS" \
    '{
        "channel": $channel,
        "text": $text,
        "attachments": [
            {
                "color": $color,
                "blocks": $blocks
            }
        ]
    }')

echo "Sending notification to Slack..."
curl -s -X POST "https://slack.com/api/chat.postMessage" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${SLACK_TOKEN}" \
    -d "$PAYLOAD"

echo "Notification sent."

