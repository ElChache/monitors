#!/bin/bash
# Restart QA Specialist with proper token limits

echo "🔧 Restarting QA Specialist (Haiku)..."

# Navigate to QA specialist's worktree
tmux send-keys -t specialist_agents:0 "cd /Users/davidcerezo/Projects/monitors" C-m

# Clear any existing Claude Code session
tmux send-keys -t specialist_agents:0 C-c
sleep 1

# Start Claude Code with Haiku model and appropriate token limit
tmux send-keys -t specialist_agents:0 "claude --model haiku --max-tokens 8000" C-m
sleep 2

# Send the initial prompt
tmux send-keys -t specialist_agents:0 "You are a QA Engineer specialist working on the Monitors! project. Check coordination/QA_TASKS.md for your tasks. Your role is to develop comprehensive test suites and ensure quality across the codebase. Check the forum at coordination/FORUM.md for team communications. If you have questions, post them there. Focus on test coverage, integration testing, and quality assurance." C-m

echo "✅ QA Specialist restarted with proper Haiku token limits"