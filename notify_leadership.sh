#!/bin/bash
# Notify all Leadership Team (PM, Architect, Lead Dev)
for i in {0..2}; do
  tmux send-keys -t leadership_agents:$i "$1" C-m
done
echo "🎯 Sent to Leadership Team (3 agents): $1"