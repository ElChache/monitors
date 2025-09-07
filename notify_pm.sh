#!/bin/bash
# Notify Product Manager
tmux send-keys -t leadership_agents:0 "$1" C-m
echo "📢 Sent to PM: $1"