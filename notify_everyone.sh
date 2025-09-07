#!/bin/bash
# Notify ALL agents (Leadership + Core Dev Teams)

echo "📡 Broadcasting to all agents: $1"

# Leadership Team (PM, Architect, Lead Dev)
for i in {0..2}; do
  tmux send-keys -t leadership_agents:$i "$1" C-m
done

# Core Dev Team (Backend, Frontend, AI) 
for i in {0..2}; do
  tmux send-keys -t core_dev_agents:$i "$1" C-m
done

echo "✅ Sent to 6 agents total: Leadership Team (3) + Core Dev Team (3)"