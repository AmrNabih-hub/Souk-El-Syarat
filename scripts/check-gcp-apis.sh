#!/bin/bash

echo "🔍 CHECKING GOOGLE CLOUD APIS & SERVICES"
echo "========================================="

PROJECT="souk-el-syarat"

echo -e "\n📋 Required APIs for Firebase & Cloud Services:"
echo "-----------------------------------------------"

# List of required APIs
APIS=(
  "cloudfunctions.googleapis.com:Cloud Functions"
  "cloudbuild.googleapis.com:Cloud Build"
  "run.googleapis.com:Cloud Run"
  "firestore.googleapis.com:Firestore"
  "firebase.googleapis.com:Firebase Management"
  "firebasehosting.googleapis.com:Firebase Hosting"
  "identitytoolkit.googleapis.com:Identity Toolkit"
  "securetoken.googleapis.com:Token Service"
  "firebasestorage.googleapis.com:Firebase Storage"
  "firebaseauth.googleapis.com:Firebase Auth"
  "firebasedatabase.googleapis.com:Realtime Database"
  "artifactregistry.googleapis.com:Artifact Registry"
  "eventarc.googleapis.com:Eventarc"
  "pubsub.googleapis.com:Pub/Sub"
  "storage.googleapis.com:Cloud Storage"
  "logging.googleapis.com:Cloud Logging"
  "monitoring.googleapis.com:Cloud Monitoring"
)

echo -e "\nChecking API status using gcloud..."

# Check if gcloud is available
if command -v gcloud &> /dev/null; then
  for api_pair in "${APIS[@]}"; do
    IFS=':' read -r api name <<< "$api_pair"
    status=$(gcloud services list --enabled --filter="name:$api" --project=$PROJECT 2>/dev/null | grep -c "$api")
    if [ "$status" -gt 0 ]; then
      echo "  ✅ $name ($api)"
    else
      echo "  ❌ $name ($api) - NOT ENABLED"
    fi
  done
else
  echo "  ⚠️ gcloud CLI not available - checking via Firebase..."
fi

echo -e "\n📊 Firebase Project Configuration:"
echo "-----------------------------------"
firebase projects:get $PROJECT 2>/dev/null || echo "  ❌ Cannot fetch project details"

echo -e "\n🔑 Authentication Providers Status:"
echo "------------------------------------"
echo "  Checking auth providers..."
firebase auth:export /tmp/users.json --project $PROJECT 2>/dev/null && {
  echo "  ✅ Auth export successful - providers configured"
  rm -f /tmp/users.json
} || echo "  ⚠️ Cannot verify auth providers"

echo -e "\n⚡ Cloud Functions Status:"
echo "--------------------------"
firebase functions:list --project $PROJECT 2>/dev/null || echo "  ❌ Cannot list functions"

echo -e "\n🔒 Security Rules Status:"
echo "-------------------------"
echo "  Firestore Rules:"
firebase firestore:rules:get --project $PROJECT 2>/dev/null | head -5 || echo "    ❌ Cannot fetch rules"

echo -e "\n📈 Current API Usage:"
echo "--------------------"
curl -s "https://us-central1-souk-el-syarat.cloudfunctions.net/api/api/health" -o /dev/null -w "  API Response Time: %{time_total}s\n  HTTP Status: %{http_code}\n"

echo -e "\n========================================="
echo "�� RECOMMENDATIONS:"
echo "========================================="
echo ""
echo "If any APIs are not enabled, run:"
echo "  gcloud services enable [API_NAME] --project=$PROJECT"
echo ""
echo "Or enable them in Firebase Console:"
echo "  https://console.firebase.google.com/project/$PROJECT/settings/serviceaccounts/adminsdk"
echo ""
