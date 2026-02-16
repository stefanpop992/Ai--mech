from fastapi import FastAPI

app = FastAPI(title="Ai Mechanic API")


@app.get("/health")
def health_check():
    return {"status": "ok"}
