FROM denoland/deno:alpine-1.35.0

WORKDIR /app

# Copy project
COPY . .

# Cache dependencies for the web server
RUN deno cache web/server.ts

EXPOSE 8000

# Run the web server; in production you'll supply SUPABASE_URL and keys via secrets
CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "web/server.ts"]
