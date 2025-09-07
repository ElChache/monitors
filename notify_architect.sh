#!/bin/bash
# Notify System Architect
tmux send-keys -t leadership_agents:1 "$1" C-m
echo "🏗️  Sent to Architect: $1"