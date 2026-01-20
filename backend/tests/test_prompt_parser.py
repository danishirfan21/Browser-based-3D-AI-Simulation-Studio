"""
Tests for the PromptParser service.
Run with: pytest tests/test_prompt_parser.py -v
"""
import pytest
from app.services.prompt_parser import PromptParser
from app.schemas.action import ActionType, ObjectType


@pytest.fixture
def parser():
    return PromptParser()


@pytest.fixture
def scene_context():
    return {
        "objects": [
            {
                "id": "conveyor_1",
                "type": "conveyor",
                "name": "Main Conveyor",
                "position": {"x": 0, "y": 0.5, "z": 0}
            },
            {
                "id": "robot_arm_1",
                "type": "robot_arm",
                "name": "Robot Arm",
                "position": {"x": -5, "y": 0, "z": 0}
            }
        ]
    }


class TestAddCommands:
    def test_add_robot_arm(self, parser):
        actions = parser.parse("Add a robotic arm")
        assert len(actions) == 1
        assert actions[0].action == ActionType.ADD_OBJECT
        assert actions[0].params["type"] == ObjectType.ROBOT_ARM.value

    def test_add_conveyor(self, parser):
        actions = parser.parse("Create a conveyor belt")
        assert len(actions) == 1
        assert actions[0].action == ActionType.ADD_OBJECT
        assert actions[0].params["type"] == ObjectType.CONVEYOR.value

    def test_add_with_color(self, parser):
        actions = parser.parse("Add a blue box")
        assert len(actions) == 1
        assert actions[0].params["color"] == "#4444ff"

    def test_add_with_position(self, parser):
        actions = parser.parse("Add a box on the left")
        assert len(actions) == 1
        assert actions[0].params["position"]["x"] < 0

    def test_add_next_to_object(self, parser, scene_context):
        actions = parser.parse("Add a box next to the conveyor", scene_context)
        assert len(actions) == 1
        # Position should be relative to conveyor
        pos = actions[0].params["position"]
        assert pos["x"] != 0 or pos["z"] != 0


class TestRotateCommands:
    def test_rotate_with_degrees(self, parser, scene_context):
        actions = parser.parse("Rotate the robot arm 45 degrees", scene_context)
        assert len(actions) == 1
        assert actions[0].action == ActionType.ROTATE_OBJECT
        assert actions[0].params["degrees"] == 45

    def test_rotate_default_axis(self, parser, scene_context):
        actions = parser.parse("Rotate the conveyor 30 degrees", scene_context)
        assert len(actions) == 1
        assert actions[0].params["axis"] == "y"  # Default axis

    def test_rotate_specific_axis(self, parser, scene_context):
        actions = parser.parse("Rotate the robot arm 90 degrees on x axis", scene_context)
        assert len(actions) == 1
        assert actions[0].params["axis"] == "x"


class TestMoveCommands:
    def test_move_left(self, parser, scene_context):
        actions = parser.parse("Move the conveyor left", scene_context)
        assert len(actions) == 1
        assert actions[0].action == ActionType.MOVE_OBJECT
        assert actions[0].params.get("delta", {}).get("x", 0) < 0 or \
               actions[0].params.get("position", {}).get("x", 0) < 0

    def test_move_up(self, parser, scene_context):
        actions = parser.parse("Move the robot arm up", scene_context)
        assert len(actions) == 1


class TestColorCommands:
    def test_set_color_red(self, parser, scene_context):
        actions = parser.parse("Paint the conveyor red", scene_context)
        assert len(actions) == 1
        assert actions[0].action == ActionType.SET_COLOR
        assert actions[0].params["color"] == "#ff4444"

    def test_set_color_hex(self, parser, scene_context):
        actions = parser.parse("Change the robot arm color to #00ff00", scene_context)
        assert len(actions) == 1
        assert actions[0].params["color"] == "#00ff00"


class TestCameraCommands:
    def test_zoom_in(self, parser):
        actions = parser.parse("Zoom in")
        assert len(actions) == 1
        assert actions[0].action == ActionType.CAMERA_ZOOM
        assert actions[0].params["direction"] == "in"

    def test_zoom_out(self, parser):
        actions = parser.parse("Zoom out")
        assert len(actions) == 1
        assert actions[0].params["direction"] == "out"

    def test_camera_focus(self, parser):
        actions = parser.parse("Zoom camera to inspection area")
        assert len(actions) == 1
        assert actions[0].action == ActionType.CAMERA_FOCUS


class TestHighlightCommands:
    def test_highlight_safety_zone(self, parser):
        actions = parser.parse("Highlight safety zone in red")
        assert len(actions) == 1
        assert actions[0].action == ActionType.ADD_SAFETY_ZONE
        assert actions[0].params["color"] == "#ff4444"

    def test_highlight_object(self, parser, scene_context):
        actions = parser.parse("Highlight the conveyor", scene_context)
        assert len(actions) == 1
        assert actions[0].action == ActionType.HIGHLIGHT_OBJECT


class TestVisibilityCommands:
    def test_hide_object(self, parser, scene_context):
        actions = parser.parse("Hide the robot arm", scene_context)
        assert len(actions) == 1
        assert actions[0].action == ActionType.SET_VISIBILITY
        assert actions[0].params["visible"] is False

    def test_show_object(self, parser, scene_context):
        actions = parser.parse("Show the conveyor", scene_context)
        assert len(actions) == 1
        assert actions[0].params["visible"] is True


class TestScaleCommands:
    def test_scale_up(self, parser, scene_context):
        actions = parser.parse("Scale the conveyor to 1.5", scene_context)
        assert len(actions) == 1
        assert actions[0].action == ActionType.SCALE_OBJECT
        assert actions[0].params["factor"] == 1.5

    def test_grow_object(self, parser, scene_context):
        actions = parser.parse("Grow the robot arm", scene_context)
        assert len(actions) == 1
        assert actions[0].params["factor"] > 1


class TestResetCommands:
    def test_reset_scene(self, parser):
        actions = parser.parse("Reset the scene")
        assert len(actions) == 1
        assert actions[0].action == ActionType.RESET_SCENE


class TestAnimationCommands:
    def test_start_animation(self, parser, scene_context):
        actions = parser.parse("Start animating the robot arm", scene_context)
        assert len(actions) == 1
        assert actions[0].action == ActionType.ANIMATE_OBJECT
        assert actions[0].params["animate"] is True

    def test_stop_animation(self, parser, scene_context):
        actions = parser.parse("Stop the conveyor", scene_context)
        assert len(actions) == 1
        assert actions[0].params["animate"] is False


class TestEdgeCases:
    def test_empty_prompt(self, parser):
        actions = parser.parse("")
        assert len(actions) == 0

    def test_unknown_command(self, parser):
        actions = parser.parse("Do something completely random xyz")
        # Should return empty or try to infer
        assert isinstance(actions, list)

    def test_multiple_objects_same_type(self, parser):
        # First add
        actions1 = parser.parse("Add a box")
        # Second add
        actions2 = parser.parse("Add a box")
        # IDs should be different
        assert actions1[0].target != actions2[0].target
