#!/bin/bash
# HeartFlow GitHub Sync Script
# Run this to push to GitHub if automatic push fails

cd ~/.hermes/skills-marketplace/skills/heartflow

echo "Adding SSH key..."
ssh-add ~/.ssh/id_ed25519

echo "Pushing to GitHub..."
git push origin main

echo "Done! Check: https://github.com/yun520-1/mark-heartflow-skill"