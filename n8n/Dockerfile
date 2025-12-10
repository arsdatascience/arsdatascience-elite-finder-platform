FROM docker.n8n.io/n8nio/n8n:1.122.3

# Switch to root to install any additional tools if needed
USER root

# Install dependencies for specific n8n nodes if required (e.g. pg, python)
# RUN apk add --no-cache python3 py3-pip

# Switch back to node user
USER node

# Expose the port n8n runs on
EXPOSE 5678

# The command is handled by the base image, but we can override if needed
# CMD ["n8n"]
