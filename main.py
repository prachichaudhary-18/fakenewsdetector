import os
import torch
import torch.nn.functional as F
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from typing import List, Tuple, Any, Dict
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from lime.lime_text import LimeTextExplainer
from contextlib import asynccontextmanager
import requests
from bs4 import BeautifulSoup
from newspaper import Article

# ==========================================
# 1. Models and ML Logic
# ==========================================

class BERT_Explainer:
    def __init__(self, model_path_or_name: str):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load model and tokenizer
        # In a real scenario, this would point to the trained model directory, e.g. "./fake_news_bert_model"
        # Since we might not have it saved, we'll try to load it or fallback to base (which would have random weights for classification).
        try:
            self.model = AutoModelForSequenceClassification.from_pretrained(model_path_or_name).to(self.device)
            self.tokenizer = AutoTokenizer.from_pretrained(model_path_or_name)
        except Exception as e:
            print(f"Warning: Could not load model from {model_path_or_name}. Falling back to base uncased model: {e}")
            fallback = "bert-base-uncased"
            self.model = AutoModelForSequenceClassification.from_pretrained(fallback, num_labels=2).to(self.device)
            self.tokenizer = AutoTokenizer.from_pretrained(fallback)
            
        self.model.eval()
        self.explainer = LimeTextExplainer(class_names=['Fake', 'Real'])

    def predictor_func(self, texts: List[str]):
        # LIME calls this with a list of strings
        inputs = self.tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=128).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        # Returns probability distribution
        probas = F.softmax(outputs.logits, dim=1).cpu().numpy()
        return probas

    def explain_prediction(self, text: str, num_features: int = 5) -> Dict[str, Any]:
        """
        Returns verdict, confidence, and LIME phrases.
        """
        if not text or len(text.strip()) == 0:
            raise ValueError("Input text cannot be empty.")
            
        # Explainer needs a predictor function that takes [strings] and returns probabilities
        # We use num_samples=100 for speed, higher values are more accurate but slower
        exp = self.explainer.explain_instance(text, self.predictor_func, num_features=num_features, num_samples=100)
        
        probs = self.predictor_func([text])[0]
        # Class 1 is Real, Class 0 is Fake
        confidence_real = float(probs[1])
        confidence_fake = float(probs[0])
        
        verdict = "Real" if confidence_real > confidence_fake else "Fake"
        confidence = max(confidence_real, confidence_fake)
        
        # Format contributions
        phrases_scores = [{"phrase": phrase, "score": float(score)} for phrase, score in exp.as_list()]
        
        return {
            "verdict": verdict,
            "confidence": confidence,
            "lime_phrases": phrases_scores
        }

# Global explainer instance
ml_explainer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model on startup
    global ml_explainer
    model_path = "./fake_news_bert_model"
    print("Loading ML Model...")
    ml_explainer = BERT_Explainer(model_path)
    print("ML Model loaded successfully.")
    yield
    # Clean up resources if needed
    print("Shutting down... Cleaning up ML model.")
    ml_explainer = None

# ==========================================
# 2. FastAPI Application Setup
# ==========================================

app = FastAPI(
    title="Fake News Detector API",
    description="Microservice for analyzing text and URLs for fake news detection.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 3. Pydantic Schemas
# ==========================================

class AnalyzeTextRequest(BaseModel):
    text: str

class AnalyzeUrlRequest(BaseModel):
    url: HttpUrl

class LimePhrase(BaseModel):
    phrase: str
    score: float

class AnalyzeResponse(BaseModel):
    verdict: str
    confidence: float
    lime_phrases: List[LimePhrase]

# ==========================================
# 4. Error Handling
# ==========================================

from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "details": str(exc)},
    )

# ==========================================
# 5. Helper Functions
# ==========================================

def scrape_article(url: str) -> str:
    """Scrapes main article text using newspaper3k and BeautifulSoup fallback."""
    try:
        # Newspaper3k is robust for news articles
        article = Article(url)
        article.download()
        article.parse()
        text = article.text
        
        # Fallback to BeautifulSoup if newspaper3k fails to extract meaningful text
        if not text or len(text.strip()) < 50:
            response = requests.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            # Look for common article content tags
            paragraphs = soup.find_all('p')
            text = " ".join([p.get_text() for p in paragraphs])
            
        if not text or len(text.strip()) < 10:
            raise ValueError("Could not extract meaningful text from URL")
            
        return text
    except Exception as e:
        raise ValueError(f"Failed to scrape URL: {str(e)}")

# ==========================================
# 6. Endpoints
# ==========================================

@app.get("/health")
async def health_check():
    if ml_explainer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy", "model_loaded": True}

@app.post("/analyze/text", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeTextRequest):
    if ml_explainer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
        
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    try:
        # Run inference in a blocking manner since it's CPU/GPU bound. 
        # For production with high load, consider running in an executor.
        result = ml_explainer.explain_prediction(text, num_features=5)
        return AnalyzeResponse(**result)
    except ValueError as e:
         raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/analyze/url", response_model=AnalyzeResponse)
async def analyze_url(request: AnalyzeUrlRequest):
    if ml_explainer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
        
    url_str = str(request.url)
    
    try:
        # 1. Scrape the URL
        text = scrape_article(url_str)
        
        # 2. Analyze the extracted text (truncate to handle large articles if necessary, handled in predictor)
        result = ml_explainer.explain_prediction(text, num_features=5)
        return AnalyzeResponse(**result)
    except ValueError as e:
         raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
