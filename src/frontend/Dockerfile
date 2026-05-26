# ─── Stage 1: Build the React app ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build


# ─── Stage 2: Serve with Nginx ───────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Put the template in /tmp — NOT in /etc/nginx/templates/ because the nginx
# Docker entrypoint auto-processes that directory with a full envsubst (which
# would wipe out nginx's own $host / $remote_addr / $scheme variables).
COPY nginx.conf.template /tmp/nginx.conf.template

# Copy built React files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Override the nginx entrypoint entirely so only $BACKEND_URL is substituted.
# 'envsubst "$BACKEND_URL"' (double-quoted) expands to the value of BACKEND_URL
# at shell parse time — use the explicit variable-list form instead:
#   envsubst with a literal '$BACKEND_URL' argument restricts substitution to
#   that one variable, leaving nginx's $host / $remote_addr etc. untouched.
ENTRYPOINT []
CMD ["/bin/sh", "-c", \
  "envsubst '$BACKEND_URL' < /tmp/nginx.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
