#!/bin/bash
# Notify all Developers (Backend, Frontend, AI)
for i in {0..2}; do
  tmux send-keys -t core_dev_agents:$i "$1" C-m
done
echo "⚡ Sent to Core Dev Team (3 agents): $1"