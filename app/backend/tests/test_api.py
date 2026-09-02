import os

os.environ["DATABASE_URL"] = "sqlite:///./test_poschair.db"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database import Base, get_db
from src.main import app

TEST_DATABASE_URL = "sqlite:///./test_poschair.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_module():
    if os.path.exists("test_poschair.db"):
        os.remove("test_poschair.db")


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_profile_create_get_update_flow():
    client = TestClient(app)

    create_response = client.post(
        "/profile/",
        json={
            "name": "Aarush",
            "height_cm": 175,
            "chair_type": "office",
            "mode": "office",
        },
    )
    assert create_response.status_code == 200
    created = create_response.json()
    user_id = created["id"]

    get_response = client.get(f"/profile/{user_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Aarush"

    update_response = client.put(
        f"/profile/{user_id}",
        json={
            "name": "Aarush Updated",
            "height_cm": 176,
            "chair_type": "office",
            "mode": "gaming",
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["mode"] == "gaming"


def test_calibration_create_and_get_latest_flow():
    client = TestClient(app)

    user = client.post(
        "/profile/",
        json={
            "name": "Cal User",
            "height_cm": 170,
            "chair_type": "office",
            "mode": "study",
        },
    ).json()

    calibration_payload = {
        "user_id": user["id"],
        "spine_angle_0": 1.2,
        "shoulder_width": 0.21,
        "lateral_angle_0": -0.5,
        "neck_angle_0": 14.5,
        "torso_length": 0.31,
    }
    save_response = client.post("/calibration/", json=calibration_payload)
    assert save_response.status_code == 200

    get_latest = client.get(f"/calibration/{user['id']}")
    assert get_latest.status_code == 200
    latest = get_latest.json()
    assert latest["spine_angle_0"] == calibration_payload["spine_angle_0"]
    assert latest["neck_angle_0"] == calibration_payload["neck_angle_0"]


def test_session_log_and_list_flow():
    client = TestClient(app)

    user = client.post(
        "/profile/",
        json={
            "name": "Session User",
            "height_cm": 168,
            "chair_type": "office",
            "mode": "relax",
        },
    ).json()

    log_payload = {
        "user_id": user["id"],
        "score_avg": 82.5,
        "pct_good": 76.0,
        "pct_bad": 24.0,
        "score_history": [
            {"t": 1000, "score": 80},
            {"t": 2000, "score": 85},
        ],
    }

    log_response = client.post("/sessions/", json=log_payload)
    assert log_response.status_code == 200
    assert log_response.json()["score_avg"] == 82.5

    sessions_response = client.get(f"/sessions/{user['id']}")
    assert sessions_response.status_code == 200
    sessions = sessions_response.json()
    assert len(sessions) == 1
    assert sessions[0]["pct_good"] == 76.0
