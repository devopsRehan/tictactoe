#!/usr/bin/env python3
import os
import json
import time
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
import requests

def get_ai_explanation(log_content, gemini_api_key):
    prompt = (
        "You're an expert in CI/CD/CT and DevOps. Please explain the error in the following log: \n\n"
        f"{log_content}\n\n"
        "Please explain only the error."
    )
    gemini_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }
    try:
        resp = requests.post(gemini_url, headers={"Content-Type": "application/json"}, json=payload, timeout=30)
        resp.raise_for_status()
        ai_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        return ai_text
    except Exception as e:
        return f"⚠️ AI explanation failed: {str(e)}"

def main():
    token = os.environ["SLACK_BOT_TOKEN"]
    channel = os.environ["SLACK_CHANNEL"]
    repo = os.environ["REPO"]
    branch = os.environ["BRANCH"]
    actor = os.environ["ACTOR"]
    run_id = os.environ["RUN_ID"]
    run_number = os.environ["RUN_NUMBER"]
    gemini_api_key = os.environ.get("GEMINI_API_KEY")

    client = WebClient(token=token)

    # 1) Upload the error.log file
    try:
        upload_resp = client.files_upload_v2(
            channel=channel,
            file="error.log",
            title="🚨 Build Error Log",
            filename="error.log",
            initial_comment=":x: Build failed. Here's the full error log."
        )
        file_id = upload_resp["file"]["id"]
        file_url = upload_resp["file"].get("url_private_download")
        # print(f"Slack file download URL: {file_url}")
    except SlackApiError as e:
        print(f"Failed to upload file: {e.response['error']}")
        file_id = None
        file_url = None

    # 2) Automatically post AI explanation
    try:
        with open("error.log", "r", encoding="utf-8") as f:
            log_content = f.read()
    except Exception as e:
        log_content = None

    ai_msg = "⚠️ Could not read error.log for AI explanation."
    if log_content and gemini_api_key:
        ai_text = get_ai_explanation(log_content, gemini_api_key)
        ai_msg = f"💡 *AI Explanation of the error:*\n```{ai_text}```"
    elif not gemini_api_key:
        ai_msg = "⚠️ GEMINI_API_KEY not set. Cannot provide AI explanation."

    # 3) Post the message with Fix and Re-run buttons only
    blocks = [        
        # 1. AI explanation
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ai_msg
            }
        },
        # 2. Info (repo, branch, actor)
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"*Repository:* `{repo}`\n"
                    f"*Branch:* `{branch}`\n"
                    f"*Triggered by:* `{actor}`"
                )
            }
        },
        # 3. Buttons
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "Suggestion Fix"},
                    "style": "primary",
                    "value": json.dumps({
                        "error_log_url": f"https://devopsrehan.github.io/tictactoe/{run_number}/error.log",
                        "repo": repo,
                        "branch": branch,
                        "run_id": run_id
                    }),
                    "action_id": "fix_click"
                },
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "Re-run"},
                    "style": "danger",
                    "value": json.dumps({"run_id": run_id}),
                    "action_id": "rerun_click"
                }
            ]
        }
    ]

    try:
        client.chat_postMessage(
            channel=channel,
            text=":x: *Build Failed*",
            blocks=blocks
        )
    except SlackApiError as e:
        print(f"Failed to post message: {e.response['error']}")

    # 4) Send file info to FastAPI (if available)
    fastapi_url = os.environ.get("FASTAPI_NOTIFY_URL")
    if fastapi_url and file_id:
        payload = {
            "repo": repo,
            "branch": branch,
            "actor": actor,
            "run_id": run_id,
            "run_number": run_number,
            "slack_file_id": file_id,
            "slack_file_url": file_url,
            "slack_channel": channel
        }
        try:
            resp = requests.post(fastapi_url, json=payload, timeout=15)
            print(f"FastAPI notify response: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"Failed to notify FastAPI: {str(e)}")

if __name__ == "__main__":
    main()
