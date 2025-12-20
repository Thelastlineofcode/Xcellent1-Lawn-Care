FROM denoland/deno:2.5.6

WORKDIR /app

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p web/uploads

# Expose port
EXPOSE 8000

# Cache dependencies
RUN deno cache server.ts

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "server.ts"]
