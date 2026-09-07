import os
import io
import math
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

app = FastAPI(title="Kabadiwala Connect ML Classifier", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RATE_CARD = {
    "Plastic": {"rate": 18.0, "advice": "Rinse containers and remove caps for higher scrap value."},
    "Paper": {"rate": 14.0, "advice": "Keep dry and bundle newspapers and cartons separately."},
    "Metal": {"rate": 36.0, "advice": "Separate ferrous (iron) from non-ferrous (copper/brass/aluminum)."},
    "E-waste": {"rate": 55.0, "advice": "Ensure batteries and toxic components are handled safely."},
    "Glass": {"rate": 5.0, "advice": "Keep unbroken bottles segregated by color if possible."},
    "Organic": {"rate": 3.0, "advice": "Compost wet waste or dry out for bio-fertilizer."}
}

class ClassificationResponse(BaseModel):
    category: str
    confidence: float
    estRate: float
    advice: str
    filename: str
    dimensions: str

@app.get("/")
def read_root():
    return {"status": "online", "service": "Kabadiwala Connect ML Microservice", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/classify", response_model=ClassificationResponse)
async def classify_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image")

    contents = await file.read()
    filename_lower = (file.filename or "").lower()

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        width, height = image.size
        # Sample average color
        small = image.resize((32, 32))
        pixels = list(small.getdata())
        r_avg = sum(p[0] for p in pixels) / len(pixels)
        g_avg = sum(p[1] for p in pixels) / len(pixels)
        b_avg = sum(p[2] for p in pixels) / len(pixels)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

    # Heuristic & keyword classification
    detected_category = None
    confidence = 0.92

    # Check filename cues if present
    if any(k in filename_lower for k in ["bottle", "plastic", "pet", "polythene", "container"]):
        detected_category = "Plastic"
        confidence = 0.95
    elif any(k in filename_lower for k in ["paper", "cardboard", "newspaper", "box", "carton", "book"]):
        detected_category = "Paper"
        confidence = 0.94
    elif any(k in filename_lower for k in ["metal", "iron", "steel", "aluminum", "can", "tin", "copper", "wire"]):
        detected_category = "Metal"
        confidence = 0.96
    elif any(k in filename_lower for k in ["ewaste", "e-waste", "circuit", "phone", "pcb", "laptop", "battery", "cable"]):
        detected_category = "E-waste"
        confidence = 0.93
    elif any(k in filename_lower for k in ["glass", "jar", "wine", "beer"]):
        detected_category = "Glass"
        confidence = 0.91
    elif any(k in filename_lower for k in ["organic", "leaf", "peel", "food", "bio"]):
        detected_category = "Organic"
        confidence = 0.89

    # If no keyword matched, classify by image color palette & variance
    if not detected_category:
        max_c = max(r_avg, g_avg, b_avg)
        min_c = min(r_avg, g_avg, b_avg)
        sat = (max_c - min_c) / (max_c + 1e-5)
        brightness = (r_avg + g_avg + b_avg) / 3.0

        if sat < 0.15 and brightness > 60: # Desaturated, metallic gray/silver/white
            detected_category = "Metal" if brightness < 170 else "Paper"
            confidence = 0.88
        elif r_avg > g_avg and g_avg > b_avg and sat > 0.25: # Brown/cardboard tones
            detected_category = "Paper"
            confidence = 0.90
        elif g_avg > r_avg and g_avg > b_avg: # Green tones
            detected_category = "Organic" if brightness < 120 else "Glass"
            confidence = 0.87
        elif b_avg > r_avg and sat > 0.2: # Blue/plastic tones
            detected_category = "Plastic"
            confidence = 0.91
        elif brightness < 60: # Dark, tech or heavy scrap
            detected_category = "E-waste"
            confidence = 0.86
        else:
            detected_category = "Plastic"
            confidence = 0.85

    rate_info = RATE_CARD.get(detected_category, {"rate": 15.0, "advice": "Segregate cleanly for maximum price."})

    return ClassificationResponse(
        category=detected_category,
        confidence=round(confidence, 2),
        estRate=rate_info["rate"],
        advice=rate_info["advice"],
        filename=file.filename or "uploaded_scrap.jpg",
        dimensions=f"{width}x{height}"
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
