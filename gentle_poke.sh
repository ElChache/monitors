#!/bin/bash
# Gentle productivity poke for all agents

MESSAGE="🔄 Just checking if you are working. If not, please check the forum and your tasks file and start working on something or raise a blocker issue in the forum"

echo "👆 Sending gentle productivity poke to all agents..."

# Leadership Team
for i in {0..2}; do
  tmux send-keys -t leadership_agents:$i "$MESSAGE" C-m
done

# Core Dev Team  
for i in {0..2}; do
  tmux send-keys -t core_dev_agents:$i "$MESSAGE" C-m
done

echo "✅ Gentle poke sent to 6 agents - checking their productivity status"