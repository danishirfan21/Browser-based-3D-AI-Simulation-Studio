import pytest
from unittest.mock import AsyncMock, patch
from app.services.ai_prompt_parser import AIPromptParser
from app.schemas.action import ActionType

@pytest.mark.asyncio
async def test_ai_prompt_parser_no_api_key():
    with patch("app.services.ai_prompt_parser.settings") as mock_settings:
        mock_settings.AI_API_KEY = None
        parser = AIPromptParser()
        actions = await parser.parse("Add a robot")
        assert actions == []

@pytest.mark.asyncio
async def test_ai_prompt_parser_success():
    with patch("app.services.ai_prompt_parser.settings") as mock_settings:
        mock_settings.AI_API_KEY = "test_key"
        mock_settings.AI_MODEL_NAME = "gpt-4"
        mock_settings.AI_API_URL = "https://api.openai.com/v1/chat/completions"

        parser = AIPromptParser()

        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": '[{"action": "add_object", "target": "robot_1", "params": {"type": "robot_arm"}}]'
                }
            }]
        }
        mock_response.raise_for_status = lambda: None

        with patch("httpx.AsyncClient.post", return_value=mock_response):
            actions = await parser.parse("Add a robot")
            assert len(actions) == 1
            assert actions[0].action == ActionType.ADD_OBJECT
            assert actions[0].target == "robot_1"
            assert actions[0].params["type"] == "robot_arm"
