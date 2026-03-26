#!/usr/bin/env bash
set -euo pipefail

# GCP Cloud Run deploy script for Xcellent1 Lawn Care
# Requirements: gcloud CLI authenticated, environment variables set
#
# Required env vars:
#   GCP_PROJECT_ID - GCP project ID
#   GCP_REGION     - GCP region (default: us-central1)
#   DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET

GCP_PROJECT_ID="${GCP_PROJECT_ID:-gen-lang-client-0072608241}"
GCP_REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="xcellent1-lawn-care"
ARTIFACT_REGISTRY="us-central1-docker.pkg.dev"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "========================================"
echo "Deploying to GCP Cloud Run"
echo "  Project:  $GCP_PROJECT_ID"
echo "  Region:   $GCP_REGION"
echo "  Service:  $SERVICE_NAME"
echo "========================================"

# Ensure we're authenticated
if ! gcloud auth print-identity-token &>/dev/null; then
  echo "ERROR: Not authenticated to GCP. Run: gcloud auth login"
  exit 1
fi

# Set project
gcloud config set project "$GCP_PROJECT_ID"

# Enable required APIs (idempotent)
echo "Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  --quiet

# Create Artifact Registry repository if needed
echo "Ensuring Artifact Registry repository exists..."
gcloud artifacts repositories describe xcellent1 \
  --location="$GCP_REGION" &>/dev/null || \
gcloud artifacts repositories create xcellent1 \
  --repository-format=docker \
  --location="$GCP_REGION" \
  --description="Xcellent1 Lawn Care container images"

# Configure Docker for Artifact Registry
echo "Configuring Docker authentication..."
gcloud auth configure-docker "$ARTIFACT_REGISTRY" --quiet

# Build and push image
IMAGE_URI="$ARTIFACT_REGISTRY/$GCP_PROJECT_ID/xcellent1/server:$IMAGE_TAG"
echo "Building Docker image: $IMAGE_URI"
docker build -t "$IMAGE_URI" .

echo "Pushing image to Artifact Registry..."
docker push "$IMAGE_URI"

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_URI" \
  --region "$GCP_REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "APP_ENV=production"

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$GCP_REGION" \
  --format 'value(status.url)')

echo ""
echo "========================================"
echo "Deployment complete!"
echo "Service URL: $SERVICE_URL"
echo ""
echo "Next steps:"
echo "  1. Set secrets in Secret Manager (or via Cloud Run console)"
echo "  2. Test: curl $SERVICE_URL/health"
echo "========================================"
