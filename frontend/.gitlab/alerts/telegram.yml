telegram_alert:
  stage: .post
  image: curlimages/curl:8.5.0
  when: on_failure
  allow_failure: true
  tags:
    - deploy

  script:
    - |
      set -e

      if [ "$ALERT_ENABLED" = "false" ]; then
        echo "Alert disabled"
        exit 0
      fi

      case "$ALERT_CHANNEL" in
        WARNING)
          CHAT_ID="$TG_CHAT_WARNING"
          ICON="🟡"
          ;;
        *)
          CHAT_ID="$TG_CHAT_CRITICAL"
          ICON="🔴"
          ;;
      esac

      OWNER="${ALERT_OWNER:-unknown}"

      MESSAGE=$(cat <<EOF
      $ICON *GitLab CI FAILED*

      *Project:* $CI_PROJECT_PATH
      *Branch:* $CI_COMMIT_REF_NAME
      *Owner:* $OWNER
      *Pipeline:* $CI_PIPELINE_URL
      *Commit:* $CI_COMMIT_SHORT_SHA
      *Author:* $GITLAB_USER_NAME
      EOF
      )

      curl -s -X POST "https://api.telegram.org/bot$TG_BOT_TOKEN/sendMessage" \
        -d chat_id="$CHAT_ID" \
        -d parse_mode="Markdown" \
        --data-urlencode text="$MESSAGE"
