import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "market_mind_ai")

client = AsyncIOMotorClient(MONGODB_URI)
db = client[DB_NAME]

async def get_database():
    return db

async def save_report(report_data: dict):
    collection = db["reports"]
    result = await collection.insert_one(report_data)
    return str(result.inserted_id)

async def get_all_reports():
    collection = db["reports"]
    cursor = collection.find().sort("created_at", -1)
    reports = await cursor.to_list(length=100)
    for report in reports:
        report["_id"] = str(report["_id"])
    return reports

async def get_report_by_id(report_id: str):
    collection = db["reports"]
    from bson import ObjectId
    try:
        # Try both the custom report_id and the MongoDB _id
        query = {"$or": [{"report_id": report_id}]}
        if len(report_id) == 24: # Valid ObjectId length
            query["$or"].append({"_id": ObjectId(report_id)})
            
        report = await collection.find_one(query)
    except Exception:
        report = await collection.find_one({"report_id": report_id})
        
    if report:
        report["_id"] = str(report["_id"])
    return report
