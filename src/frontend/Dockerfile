# ─── Stage 1: Build the React app ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build


# ─── Stage 2: Serve with Nginx ───────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf.template /etc/nginx/nginx.conf.template

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
  "envsubst '$BACKEND_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
