# ─── Stage 1: Build the React app ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (layer cached unless package-lock changes)
# --legacy-peer-deps: needed because @vitejs/plugin-react@4 declares peer dep
# on vite ^4-7 but the project uses vite 8 (works fine at runtime)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build


# ─── Stage 2: Serve with Nginx ───────────────────────────────────────────────
FROM nginx:1.27-alpine

# envsubst is included in nginx:alpine; gettext provides it on other images
# (already present here, no extra install needed)

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy the nginx config template — $BACKEND_URL will be substituted at startup.
# Only $BACKEND_URL is substituted; nginx's own $host / $remote_addr etc. are
# left intact because we pass the explicit variable list to envsubst.
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Copy built React files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Substitute only $BACKEND_URL, then hand off to nginx with PID 1
CMD ["/bin/sh", "-c", \
  "envsubst '$BACKEND_URL' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
