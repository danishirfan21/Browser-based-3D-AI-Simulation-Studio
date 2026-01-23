import pytest
from unittest.mock import AsyncMock, patch, MagicMock

# Mocking the database before importing anything that might use it
with patch("sqlalchemy.create_engine"), \
     patch("app.core.database.Base.metadata.create_all"), \
     patch("app.main.Base.metadata.create_all"):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.config import settings

client = TestClient(app)

@pytest.fixture
def mock_ai_parser():
    with patch("app.api.routes.prompt.ai_prompt_parser") as mock:
        yield mock

@pytest.fixture
def mock_rule_parser():
    with patch("app.api.routes.prompt.prompt_parser") as mock:
        yield mock

def test_parse_prompt_use_ai_false(mock_rule_parser, mock_ai_parser):
    mock_rule_parser.parse.return_value = []

    response = client.post("/api/v1/prompt/demo", json={"prompt": "test", "use_ai": False})

    assert response.status_code == 200
    mock_rule_parser.parse.assert_called_once()
    mock_ai_parser.parse.assert_not_called()

@pytest.mark.asyncio
async def test_parse_prompt_use_ai_true_no_key():
    with patch("app.api.routes.prompt.settings") as mock_settings:
        mock_settings.AI_API_KEY = None

        response = client.post("/api/v1/prompt/demo", json={"prompt": "test", "use_ai": True})

        assert response.status_code == 200
        assert "AI parsing is not enabled" in response.json()["message"]

@pytest.mark.asyncio
async def test_parse_prompt_use_ai_true_with_key(mock_ai_parser):
    with patch("app.api.routes.prompt.settings") as mock_settings:
        mock_settings.AI_API_KEY = "test_key"
        mock_ai_parser.parse = AsyncMock(return_value=[])

        # When AI returns nothing, it should fall back to rule parser
        with patch("app.api.routes.prompt.prompt_parser") as mock_rule:
            mock_rule.parse.return_value = []
            response = client.post("/api/v1/prompt/demo", json={"prompt": "test", "use_ai": True})

            assert response.status_code == 200
            mock_ai_parser.parse.assert_called_once()
            mock_rule.parse.assert_called_once()
