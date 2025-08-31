#!/bin/bash

# Direct Firestore REST API Population Script
# Using Firebase REST API to add data directly

API_KEY="AIzaSyDyKJOF5XmZPxKlWyTpZGSaYyL8Y-nVVsM"
PROJECT_ID="souk-el-syarat"
BASE_URL="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents"

echo "🚀 DIRECT API DATABASE POPULATION"
echo "================================="
echo ""

# Function to add a document
add_document() {
    local collection=$1
    local doc_id=$2
    local data=$3
    
    echo "Adding to ${collection}/${doc_id}..."
    
    curl -X PATCH \
        "${BASE_URL}/${collection}/${doc_id}?key=${API_KEY}" \
        -H "Content-Type: application/json" \
        -d "${data}" \
        --silent --output /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Added ${doc_id}"
    else
        echo "❌ Failed to add ${doc_id}"
    fi
}

# Add Categories
echo "📁 Adding Categories..."
echo ""

add_document "categories" "sedan" '{
  "fields": {
    "id": {"stringValue": "sedan"},
    "name": {"stringValue": "Sedan"},
    "nameAr": {"stringValue": "سيدان"},
    "icon": {"stringValue": "🚗"},
    "featured": {"booleanValue": true},
    "order": {"integerValue": "1"}
  }
}'

add_document "categories" "suv" '{
  "fields": {
    "id": {"stringValue": "suv"},
    "name": {"stringValue": "SUV"},
    "nameAr": {"stringValue": "دفع رباعي"},
    "icon": {"stringValue": "🚙"},
    "featured": {"booleanValue": true},
    "order": {"integerValue": "2"}
  }
}'

add_document "categories" "electric" '{
  "fields": {
    "id": {"stringValue": "electric"},
    "name": {"stringValue": "Electric"},
    "nameAr": {"stringValue": "كهربائية"},
    "icon": {"stringValue": "⚡"},
    "featured": {"booleanValue": true},
    "order": {"integerValue": "3"}
  }
}'

add_document "categories" "luxury" '{
  "fields": {
    "id": {"stringValue": "luxury"},
    "name": {"stringValue": "Luxury"},
    "nameAr": {"stringValue": "فاخرة"},
    "icon": {"stringValue": "💎"},
    "featured": {"booleanValue": false},
    "order": {"integerValue": "4"}
  }
}'

echo ""
echo "🚗 Adding Products..."
echo ""

# Add Toyota Camry
add_document "products" "toyota_camry_2024" '{
  "fields": {
    "id": {"stringValue": "toyota_camry_2024"},
    "title": {"stringValue": "2024 Toyota Camry Hybrid Executive"},
    "titleAr": {"stringValue": "تويوتا كامري 2024 هايبرد إكزيكيوتيف"},
    "description": {"stringValue": "Premium hybrid sedan with Toyota Safety Sense 3.0, adaptive cruise control, lane tracing assist. Full service history available. One owner, no accidents."},
    "descriptionAr": {"stringValue": "سيدان هايبرد فاخرة مع نظام تويوتا للسلامة 3.0. مالك واحد، بدون حوادث."},
    "price": {"integerValue": "1150000"},
    "originalPrice": {"integerValue": "1350000"},
    "discount": {"integerValue": "15"},
    "category": {"stringValue": "sedan"},
    "brand": {"stringValue": "Toyota"},
    "model": {"stringValue": "Camry"},
    "year": {"integerValue": "2024"},
    "mileage": {"integerValue": "5000"},
    "condition": {"stringValue": "like-new"},
    "fuelType": {"stringValue": "hybrid"},
    "transmission": {"stringValue": "automatic"},
    "color": {"stringValue": "Pearl White"},
    "colorHex": {"stringValue": "#F8F8FF"},
    "engineSize": {"stringValue": "2.5L"},
    "seats": {"integerValue": "5"},
    "governorate": {"stringValue": "Cairo"},
    "available": {"booleanValue": true},
    "featured": {"booleanValue": true},
    "images": {
      "arrayValue": {
        "values": [
          {"stringValue": "https://source.unsplash.com/800x600/?toyota,camry,white"},
          {"stringValue": "https://source.unsplash.com/800x600/?car,interior,luxury"},
          {"stringValue": "https://source.unsplash.com/800x600/?toyota,dashboard"},
          {"stringValue": "https://source.unsplash.com/800x600/?car,engine,hybrid"}
        ]
      }
    },
    "vendorId": {"stringValue": "vendor_001"},
    "vendorName": {"stringValue": "Premium Cars Egypt"},
    "views": {"integerValue": "1250"},
    "likes": {"integerValue": "89"}
  }
}'

# Add BMW X5
add_document "products" "bmw_x5_2023" '{
  "fields": {
    "id": {"stringValue": "bmw_x5_2023"},
    "title": {"stringValue": "2023 BMW X5 xDrive40i M Sport"},
    "titleAr": {"stringValue": "بي إم دبليو X5 2023 إكس درايف 40i إم سبورت"},
    "description": {"stringValue": "Luxury SUV with M Sport package, panoramic roof, Harman Kardon sound system, adaptive LED headlights. Low mileage, pristine condition."},
    "descriptionAr": {"stringValue": "SUV فاخرة مع حزمة M Sport، سقف بانورامي، نظام صوت هارمان كاردون. عداد منخفض، حالة ممتازة."},
    "price": {"integerValue": "3500000"},
    "originalPrice": {"integerValue": "4200000"},
    "discount": {"integerValue": "17"},
    "category": {"stringValue": "suv"},
    "brand": {"stringValue": "BMW"},
    "model": {"stringValue": "X5"},
    "year": {"integerValue": "2023"},
    "mileage": {"integerValue": "15000"},
    "condition": {"stringValue": "like-new"},
    "fuelType": {"stringValue": "petrol"},
    "transmission": {"stringValue": "automatic"},
    "color": {"stringValue": "Carbon Black"},
    "colorHex": {"stringValue": "#1C1C1C"},
    "engineSize": {"stringValue": "3.0L"},
    "seats": {"integerValue": "7"},
    "governorate": {"stringValue": "Giza"},
    "available": {"booleanValue": true},
    "featured": {"booleanValue": true},
    "images": {
      "arrayValue": {
        "values": [
          {"stringValue": "https://source.unsplash.com/800x600/?bmw,x5,black"},
          {"stringValue": "https://source.unsplash.com/800x600/?bmw,interior,luxury"},
          {"stringValue": "https://source.unsplash.com/800x600/?bmw,dashboard,sport"},
          {"stringValue": "https://source.unsplash.com/800x600/?bmw,wheels"}
        ]
      }
    },
    "vendorId": {"stringValue": "vendor_002"},
    "vendorName": {"stringValue": "Bavaria Motors Cairo"},
    "views": {"integerValue": "2100"},
    "likes": {"integerValue": "156"}
  }
}'

# Add Tesla Model 3
add_document "products" "tesla_model3_2024" '{
  "fields": {
    "id": {"stringValue": "tesla_model3_2024"},
    "title": {"stringValue": "2024 Tesla Model 3 Long Range AWD"},
    "titleAr": {"stringValue": "تسلا موديل 3 2024 طويلة المدى دفع رباعي"},
    "description": {"stringValue": "Full Self-Driving capability, Premium interior, Glass roof, 19-inch sport wheels. Zero emissions, 500km range. Supercharger network access."},
    "descriptionAr": {"stringValue": "قيادة ذاتية كاملة، داخلية فاخرة، سقف زجاجي. صفر انبعاثات، مدى 500 كم. الوصول إلى شبكة الشحن الفائق."},
    "price": {"integerValue": "2200000"},
    "originalPrice": {"integerValue": "2500000"},
    "discount": {"integerValue": "12"},
    "category": {"stringValue": "electric"},
    "brand": {"stringValue": "Tesla"},
    "model": {"stringValue": "Model 3"},
    "year": {"integerValue": "2024"},
    "mileage": {"integerValue": "2000"},
    "condition": {"stringValue": "new"},
    "fuelType": {"stringValue": "electric"},
    "transmission": {"stringValue": "automatic"},
    "color": {"stringValue": "Pearl White"},
    "colorHex": {"stringValue": "#FFFFFF"},
    "engineSize": {"stringValue": "Electric"},
    "seats": {"integerValue": "5"},
    "governorate": {"stringValue": "Alexandria"},
    "available": {"booleanValue": true},
    "featured": {"booleanValue": true},
    "images": {
      "arrayValue": {
        "values": [
          {"stringValue": "https://source.unsplash.com/800x600/?tesla,model3,white"},
          {"stringValue": "https://source.unsplash.com/800x600/?tesla,interior,minimalist"},
          {"stringValue": "https://source.unsplash.com/800x600/?tesla,screen,dashboard"},
          {"stringValue": "https://source.unsplash.com/800x600/?electric,car,charging"}
        ]
      }
    },
    "vendorId": {"stringValue": "vendor_003"},
    "vendorName": {"stringValue": "EV Motors Egypt"},
    "views": {"integerValue": "3500"},
    "likes": {"integerValue": "289"}
  }
}'

# Add Mercedes S-Class
add_document "products" "mercedes_s450_2023" '{
  "fields": {
    "id": {"stringValue": "mercedes_s450_2023"},
    "title": {"stringValue": "2023 Mercedes-Benz S450 4MATIC Luxury"},
    "titleAr": {"stringValue": "مرسيدس بنز S450 2023 4MATIC فاخرة"},
    "description": {"stringValue": "Ultimate luxury sedan with MBUX, Burmester 3D sound, massage seats, air suspension, night vision. Executive rear seating package."},
    "descriptionAr": {"stringValue": "سيدان فاخرة مع MBUX، نظام صوت Burmester 3D، مقاعد مساج، تعليق هوائي. حزمة المقاعد الخلفية التنفيذية."},
    "price": {"integerValue": "5800000"},
    "originalPrice": {"integerValue": "6500000"},
    "discount": {"integerValue": "11"},
    "category": {"stringValue": "luxury"},
    "brand": {"stringValue": "Mercedes-Benz"},
    "model": {"stringValue": "S-Class"},
    "year": {"integerValue": "2023"},
    "mileage": {"integerValue": "8000"},
    "condition": {"stringValue": "like-new"},
    "fuelType": {"stringValue": "petrol"},
    "transmission": {"stringValue": "automatic"},
    "color": {"stringValue": "Obsidian Black"},
    "colorHex": {"stringValue": "#000000"},
    "engineSize": {"stringValue": "3.0L"},
    "seats": {"integerValue": "5"},
    "governorate": {"stringValue": "Cairo"},
    "available": {"booleanValue": true},
    "featured": {"booleanValue": true},
    "images": {
      "arrayValue": {
        "values": [
          {"stringValue": "https://source.unsplash.com/800x600/?mercedes,s-class,black"},
          {"stringValue": "https://source.unsplash.com/800x600/?mercedes,luxury,interior"},
          {"stringValue": "https://source.unsplash.com/800x600/?mercedes,dashboard,digital"},
          {"stringValue": "https://source.unsplash.com/800x600/?luxury,car,seats"}
        ]
      }
    },
    "vendorId": {"stringValue": "vendor_004"},
    "vendorName": {"stringValue": "Star Motors Egypt"},
    "views": {"integerValue": "1800"},
    "likes": {"integerValue": "145"}
  }
}'

# Add Hyundai Tucson
add_document "products" "hyundai_tucson_2024" '{
  "fields": {
    "id": {"stringValue": "hyundai_tucson_2024"},
    "title": {"stringValue": "2024 Hyundai Tucson Ultimate AWD"},
    "titleAr": {"stringValue": "هيونداي توسان 2024 التيميت دفع رباعي"},
    "description": {"stringValue": "Modern SUV with SmartSense safety, panoramic sunroof, Bose audio, wireless charging, remote parking assist. Great value for money."},
    "descriptionAr": {"stringValue": "SUV حديثة مع نظام SmartSense للسلامة، فتحة سقف بانورامية، نظام صوت Bose. قيمة ممتازة مقابل المال."},
    "price": {"integerValue": "950000"},
    "originalPrice": {"integerValue": "1100000"},
    "discount": {"integerValue": "14"},
    "category": {"stringValue": "suv"},
    "brand": {"stringValue": "Hyundai"},
    "model": {"stringValue": "Tucson"},
    "year": {"integerValue": "2024"},
    "mileage": {"integerValue": "3000"},
    "condition": {"stringValue": "new"},
    "fuelType": {"stringValue": "petrol"},
    "transmission": {"stringValue": "automatic"},
    "color": {"stringValue": "Shimmering Silver"},
    "colorHex": {"stringValue": "#C0C0C0"},
    "engineSize": {"stringValue": "2.5L"},
    "seats": {"integerValue": "5"},
    "governorate": {"stringValue": "Giza"},
    "available": {"booleanValue": true},
    "featured": {"booleanValue": false},
    "images": {
      "arrayValue": {
        "values": [
          {"stringValue": "https://source.unsplash.com/800x600/?hyundai,tucson,silver"},
          {"stringValue": "https://source.unsplash.com/800x600/?hyundai,interior,modern"},
          {"stringValue": "https://source.unsplash.com/800x600/?suv,dashboard"},
          {"stringValue": "https://source.unsplash.com/800x600/?hyundai,wheels"}
        ]
      }
    },
    "vendorId": {"stringValue": "vendor_005"},
    "vendorName": {"stringValue": "Hyundai Egypt"},
    "views": {"integerValue": "890"},
    "likes": {"integerValue": "67"}
  }
}'

echo ""
echo "👤 Adding Sample Users..."
echo ""

# Add Admin User
add_document "users" "admin_001" '{
  "fields": {
    "id": {"stringValue": "admin_001"},
    "email": {"stringValue": "admin@souk-elsyarat.com"},
    "name": {"stringValue": "Ahmed Hassan"},
    "phone": {"stringValue": "+201012345678"},
    "role": {"stringValue": "admin"},
    "emailVerified": {"booleanValue": true},
    "phoneVerified": {"booleanValue": true},
    "governorate": {"stringValue": "Cairo"},
    "createdAt": {"timestampValue": "2024-01-01T00:00:00Z"},
    "preferences": {
      "mapValue": {
        "fields": {
          "language": {"stringValue": "ar"},
          "currency": {"stringValue": "EGP"}
        }
      }
    }
  }
}'

# Add Vendor User
add_document "users" "vendor_001" '{
  "fields": {
    "id": {"stringValue": "vendor_001"},
    "email": {"stringValue": "vendor@premiumcars.com"},
    "name": {"stringValue": "Mohamed Ali"},
    "phone": {"stringValue": "+201123456789"},
    "role": {"stringValue": "vendor"},
    "emailVerified": {"booleanValue": true},
    "phoneVerified": {"booleanValue": true},
    "governorate": {"stringValue": "Cairo"},
    "vendorProfile": {
      "mapValue": {
        "fields": {
          "companyName": {"stringValue": "Premium Cars Egypt"},
          "verified": {"booleanValue": true},
          "rating": {"doubleValue": 4.8},
          "totalSales": {"integerValue": "156"}
        }
      }
    }
  }
}'

# Add Customer User
add_document "users" "customer_001" '{
  "fields": {
    "id": {"stringValue": "customer_001"},
    "email": {"stringValue": "customer@example.com"},
    "name": {"stringValue": "Sara Ahmed"},
    "phone": {"stringValue": "+201234567890"},
    "role": {"stringValue": "customer"},
    "emailVerified": {"booleanValue": true},
    "phoneVerified": {"booleanValue": false},
    "governorate": {"stringValue": "Giza"},
    "preferences": {
      "mapValue": {
        "fields": {
          "language": {"stringValue": "en"},
          "currency": {"stringValue": "EGP"}
        }
      }
    }
  }
}'

echo ""
echo "✅ DATABASE POPULATION COMPLETE!"
echo "================================="
echo ""
echo "Summary:"
echo "- 4 Categories added"
echo "- 5 Products added"
echo "- 3 Users added"
echo ""
echo "You can now test the application with this data!"
echo ""