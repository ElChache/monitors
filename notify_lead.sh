#!/bin/bash
# Notify Lead Developer
tmux send-keys -t leadership_agents:2 "$1" C-m
echo "👨‍💻 Sent to Lead Dev: $1"