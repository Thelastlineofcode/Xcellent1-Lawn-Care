FROM denoland/deno:1.38.0

WORKDIR /app

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p web/uploads

# Expose port
EXPOSE 8000

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "server.ts"]
