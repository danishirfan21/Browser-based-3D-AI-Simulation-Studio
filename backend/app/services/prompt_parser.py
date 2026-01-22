import re
import uuid
from typing import List, Dict, Any, Optional, Tuple
from ..schemas.action import SceneAction, ActionType, ObjectType


class PromptParser:
    """
    Rule-based natural language parser for converting user prompts into scene actions.
    Uses pattern matching and keyword extraction to understand intent.
    """

    # Object type mappings from natural language
    OBJECT_MAPPINGS = {
        "robot": ObjectType.ROBOT_ARM,
        "robotic arm": ObjectType.ROBOT_ARM,
        "robot arm": ObjectType.ROBOT_ARM,
        "arm": ObjectType.ROBOT_ARM,
        "conveyor belt": ObjectType.CONVEYOR,
        "conveyor": ObjectType.CONVEYOR,
        "belt": ObjectType.CONVEYOR,
        "box": ObjectType.BOX,
        "cube": ObjectType.BOX,
        "crate": ObjectType.BOX,
        "package": ObjectType.BOX,
        "safety zone": ObjectType.SAFETY_ZONE,
        "safety area": ObjectType.SAFETY_ZONE,
        "hazard zone": ObjectType.SAFETY_ZONE,
        "warning zone": ObjectType.SAFETY_ZONE,
        "cylinder": ObjectType.CYLINDER,
        "pipe": ObjectType.CYLINDER,
        "sphere": ObjectType.SPHERE,
        "ball": ObjectType.SPHERE,
    }

    # Color mappings
    COLOR_MAPPINGS = {
        "red": "#ff4444",
        "green": "#44ff44",
        "blue": "#4444ff",
        "yellow": "#ffff44",
        "orange": "#ff8844",
        "purple": "#8844ff",
        "pink": "#ff44ff",
        "cyan": "#44ffff",
        "white": "#ffffff",
        "black": "#222222",
        "gray": "#888888",
        "grey": "#888888",
        "silver": "#c0c0c0",
        "gold": "#ffd700",
        "brown": "#8b4513",
    }

    # Position keywords (ordered by specificity/preference)
    POSITION_KEYWORDS = [
        ("next to", {"x": 3, "y": 0, "z": 0}),
        ("beside", {"x": 3, "y": 0, "z": 0}),
        ("near", {"x": 2, "y": 0, "z": 2}),
        ("above", {"x": 0, "y": 3, "z": 0}),
        ("below", {"x": 0, "y": -3, "z": 0}),
        ("on the left", {"x": -5, "y": 0, "z": 0}),
        ("on the right", {"x": 5, "y": 0, "z": 0}),
        ("on the front", {"x": 0, "y": 0, "z": 5}),
        ("on the back", {"x": 0, "y": 0, "z": -5}),
        ("on", {"x": 0, "y": 1, "z": 0}),
        ("left", {"x": -5, "y": 0, "z": 0}),
        ("right", {"x": 5, "y": 0, "z": 0}),
        ("front", {"x": 0, "y": 0, "z": 5}),
        ("back", {"x": 0, "y": 0, "z": -5}),
        ("behind", {"x": 0, "y": 0, "z": -5}),
        ("center", {"x": 0, "y": 0, "z": 0}),
        ("middle", {"x": 0, "y": 0, "z": 0}),
    ]

    # Camera positions for common areas
    CAMERA_TARGETS = {
        "inspection area": {"position": {"x": 5, "y": 5, "z": 5}, "target": {"x": 0, "y": 1, "z": 0}},
        "conveyor": {"position": {"x": 0, "y": 8, "z": 10}, "target": {"x": 0, "y": 0, "z": 0}},
        "robot": {"position": {"x": 8, "y": 6, "z": 8}, "target": {"x": -3, "y": 2, "z": 0}},
        "overview": {"position": {"x": 15, "y": 15, "z": 15}, "target": {"x": 0, "y": 0, "z": 0}},
        "top": {"position": {"x": 0, "y": 20, "z": 0.1}, "target": {"x": 0, "y": 0, "z": 0}},
        "side": {"position": {"x": 20, "y": 5, "z": 0}, "target": {"x": 0, "y": 2, "z": 0}},
    }

    def __init__(self):
        self.object_counter = {}

    def parse(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> List[SceneAction]:
        """
        Parse a natural language prompt and return a list of scene actions.
        """
        prompt_lower = prompt.lower().strip()
        actions = []

        # Try each parser in order of specificity
        parsers = [
            self._parse_add_command,
            self._parse_remove_command,
            self._parse_rotate_command,
            self._parse_move_command,
            self._parse_scale_command,
            self._parse_color_command,
            self._parse_highlight_command,
            self._parse_camera_command,
            self._parse_visibility_command,
            self._parse_reset_command,
            self._parse_animate_command,
        ]

        for parser in parsers:
            result = parser(prompt_lower, context)
            if result:
                actions.extend(result)

        # If no actions were parsed, try to infer intent
        if not actions:
            actions = self._infer_intent(prompt_lower, context)

        return actions

    def _generate_object_id(self, object_type: str, context: Optional[Dict] = None) -> str:
        """Generate a unique ID for a new object, ensuring it doesn't exist in context."""
        if object_type not in self.object_counter:
            self.object_counter[object_type] = 0

        existing_ids = set()
        if context and "objects" in context:
            existing_ids = {obj.get("id") for obj in context["objects"]}

        while True:
            self.object_counter[object_type] += 1
            new_id = f"{object_type}_{self.object_counter[object_type]}"
            if new_id not in existing_ids:
                return new_id

    def _extract_object_type(self, text: str) -> Optional[Tuple[ObjectType, str]]:
        """Extract object type from text, returns (type, matched_text)."""
        matches = []
        for phrase, obj_type in self.OBJECT_MAPPINGS.items():
            index = text.find(phrase)
            if index != -1:
                matches.append((index, len(phrase), obj_type, phrase))

        if not matches:
            return None, None

        # Sort by index (earliest first), then by length (longest first)
        matches.sort(key=lambda x: (x[0], -x[1]))
        return matches[0][2], matches[0][3]

    def _extract_color(self, text: str) -> Optional[str]:
        """Extract color from text."""
        for color_name, hex_code in self.COLOR_MAPPINGS.items():
            if color_name in text:
                return hex_code
        # Check for hex color
        hex_match = re.search(r'#[0-9a-fA-F]{6}', text)
        if hex_match:
            return hex_match.group()
        return None

    def _extract_number(self, text: str, default: float = 0) -> float:
        """Extract a number from text."""
        match = re.search(r'[-+]?\d*\.?\d+', text)
        if match:
            return float(match.group())
        return default

    def _extract_degrees(self, text: str) -> Optional[float]:
        """Extract degrees from text."""
        patterns = [
            r'(\d+)\s*degrees?',
            r'(\d+)\s*deg',
            r'(\d+)°',
            r'rotate.*?(\d+)',
            r'turn.*?(\d+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return float(match.group(1))
        return None

    def _extract_axis(self, text: str) -> str:
        """Extract axis from text."""
        if any(word in text for word in ['horizontal', 'side to side', 'yaw']):
            return 'y'
        if any(word in text for word in ['vertical', 'up and down', 'pitch']):
            return 'x'
        if any(word in text for word in ['roll', 'twist']):
            return 'z'
        # Check explicit axis mentions
        if ' x ' in text or text.endswith(' x') or 'x-axis' in text or 'x axis' in text:
            return 'x'
        if ' y ' in text or text.endswith(' y') or 'y-axis' in text or 'y axis' in text:
            return 'y'
        if ' z ' in text or text.endswith(' z') or 'z-axis' in text or 'z axis' in text:
            return 'z'
        return 'y'  # Default to Y axis

    def _extract_position(self, text: str, context: Optional[Dict] = None) -> Dict[str, float]:
        """Extract position from text relative to existing objects or absolute."""
        position = {"x": 0, "y": 0, "z": 0}

        # Find all matching keywords and their positions
        matches = []
        for keyword, offset in self.POSITION_KEYWORDS:
            # Check for keyword with word boundaries
            pattern = rf'\b{re.escape(keyword)}\b'
            match = re.search(pattern, text)
            if match:
                matches.append((match.start(), keyword, offset))

        # Use the earliest match if any
        if matches:
            matches.sort(key=lambda x: x[0])
            position = matches[0][2].copy()

        # Check for explicit coordinates
        coord_pattern = r'\(?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)?'
        match = re.search(coord_pattern, text)
        if match:
            position = {
                "x": float(match.group(1)),
                "y": float(match.group(2)),
                "z": float(match.group(3))
            }

        # Check for relative positioning to other objects
        if context and "objects" in context:
            for obj in context["objects"]:
                obj_name = obj.get("name", "").lower()
                obj_type = obj.get("type", "").lower()
                if obj_name in text or obj_type in text:
                    base_pos = obj.get("position", {"x": 0, "y": 0, "z": 0})
                    # Add offset based on position keywords
                    matches = []
                    for keyword, offset in self.POSITION_KEYWORDS:
                        pattern = rf'\b{re.escape(keyword)}\b'
                        match = re.search(pattern, text)
                        if match:
                            target_y = base_pos["y"] + offset["y"]
                            # For keywords that imply being on the ground next to something,
                            # ensure y is 0 (ground level)
                            if keyword in ["near", "beside", "next to", "left", "right", "front", "back", "on the left", "on the right", "on the front", "on the back"]:
                                target_y = 0

                            pos = {
                                "x": base_pos["x"] + offset["x"],
                                "y": target_y,
                                "z": base_pos["z"] + offset["z"]
                            }
                            matches.append((match.start(), pos))

                    if matches:
                        matches.sort(key=lambda x: x[0])
                        position = matches[0][1]
                    else:
                        # Default offset if no keyword (default to ground level next to object)
                        position = {
                            "x": base_pos["x"] + 3,
                            "y": 0,
                            "z": base_pos["z"]
                        }
                    break

        return position

    def _find_target_object(self, text: str, context: Optional[Dict] = None) -> Optional[str]:
        """Find the target object ID from text."""
        if not context or "objects" not in context:
            return None

        # Find all matching objects and their positions in the text
        text_lower = text.lower()
        matches = []
        for obj in context["objects"]:
            obj_name = obj.get("name", "").lower()
            obj_type = obj.get("type", "").lower().replace("_", " ")
            obj_id = obj.get("id", "")

            # Check for name match
            if obj_name:
                index = text_lower.find(obj_name)
                if index != -1:
                    matches.append((index, len(obj_name), obj_id))

            # Check for type match
            index = text_lower.find(obj_type)
            if index != -1:
                matches.append((index, len(obj_type), obj_id))

        if matches:
            # Sort by index (earliest first), then by length (longest first)
            matches.sort(key=lambda x: (x[0], -x[1]))
            return matches[0][2]

        # Try to match object type from OBJECT_MAPPINGS if no direct match in context
        obj_type_enum, _ = self._extract_object_type(text_lower)
        if obj_type_enum:
            for obj in context["objects"]:
                if obj.get("type") == obj_type_enum.value:
                    return obj.get("id")

        return None

    def _parse_add_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse add/create/place commands."""
        add_patterns = [
            r'\b(add|create|place|put|insert|spawn|generate)\b',
        ]

        for pattern in add_patterns:
            if re.search(pattern, text):
                obj_type, matched = self._extract_object_type(text)
                if obj_type:
                    position = self._extract_position(text, context)
                    color = self._extract_color(text) or "#888888"
                    obj_id = self._generate_object_id(obj_type.value, context)

                    return [SceneAction(
                        action=ActionType.ADD_OBJECT,
                        target=obj_id,
                        params={
                            "type": obj_type.value,
                            "name": obj_type.value.replace("_", " ").title(),
                            "position": position,
                            "rotation": {"x": 0, "y": 0, "z": 0},
                            "scale": {"x": 1, "y": 1, "z": 1},
                            "color": color
                        }
                    )]
        return []

    def _parse_remove_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse remove/delete commands."""
        remove_patterns = [
            r'\b(remove|delete|destroy|clear|erase)\b',
        ]

        for pattern in remove_patterns:
            if re.search(pattern, text):
                target = self._find_target_object(text, context)
                if target:
                    return [SceneAction(
                        action=ActionType.REMOVE_OBJECT,
                        target=target,
                        params={}
                    )]
                # Check for "all" or "everything"
                if any(word in text for word in ['all', 'everything', 'scene']):
                    return [SceneAction(
                        action=ActionType.RESET_SCENE,
                        target="scene",
                        params={"keep_defaults": False}
                    )]
        return []

    def _parse_rotate_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse rotate/turn/spin commands."""
        rotate_patterns = [
            r'\b(rotate|turn|spin|twist|orient)\b',
        ]

        for pattern in rotate_patterns:
            if re.search(pattern, text):
                target = self._find_target_object(text, context)
                if target:
                    degrees = self._extract_degrees(text) or 30
                    axis = self._extract_axis(text)

                    return [SceneAction(
                        action=ActionType.ROTATE_OBJECT,
                        target=target,
                        params={
                            "axis": axis,
                            "degrees": degrees
                        }
                    )]
        return []

    def _parse_move_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse move/shift/translate commands."""
        move_patterns = [
            r'\b(move|shift|translate|position|relocate)\b',
        ]

        for pattern in move_patterns:
            if re.search(pattern, text):
                target = self._find_target_object(text, context)
                if target:
                    # Extract movement direction and amount
                    delta = {"x": 0, "y": 0, "z": 0}
                    amount = self._extract_number(text, 2)

                    if 'left' in text:
                        delta["x"] = -amount
                    elif 'right' in text:
                        delta["x"] = amount
                    if 'up' in text:
                        delta["y"] = amount
                    elif 'down' in text:
                        delta["y"] = -amount
                    if 'forward' in text or 'front' in text:
                        delta["z"] = amount
                    elif 'back' in text or 'backward' in text:
                        delta["z"] = -amount

                    # Check for absolute position
                    position = self._extract_position(text, context)
                    if position != {"x": 0, "y": 0, "z": 0}:
                        return [SceneAction(
                            action=ActionType.MOVE_OBJECT,
                            target=target,
                            params={"position": position, "absolute": True}
                        )]

                    return [SceneAction(
                        action=ActionType.MOVE_OBJECT,
                        target=target,
                        params={"delta": delta, "absolute": False}
                    )]
        return []

    def _parse_scale_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse scale/resize/grow/shrink commands."""
        scale_patterns = [
            r'\b(scale|resize|grow|shrink|enlarge|expand|reduce)\b',
        ]

        for pattern in scale_patterns:
            if re.search(pattern, text):
                target = self._find_target_object(text, context)
                if target:
                    factor = self._extract_number(text, 1.5)
                    if any(word in text for word in ['shrink', 'reduce', 'smaller']):
                        factor = 1 / max(factor, 1)
                    elif factor < 0.1 or factor > 10:
                        factor = 1.5 if 'grow' in text or 'enlarge' in text else 0.5

                    return [SceneAction(
                        action=ActionType.SCALE_OBJECT,
                        target=target,
                        params={"factor": factor}
                    )]
        return []

    def _parse_color_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse color/paint commands."""
        color_patterns = [
            r'\b(color|paint|make|set|change).*?(red|green|blue|yellow|orange|purple|pink|cyan|white|black|gray|grey|silver|gold|brown|#[0-9a-fA-F]{6})\b',
        ]

        color = self._extract_color(text)
        if color and any(word in text for word in ['color', 'paint', 'make', 'set', 'change']):
            target = self._find_target_object(text, context)
            if target:
                return [SceneAction(
                    action=ActionType.SET_COLOR,
                    target=target,
                    params={"color": color}
                )]
        return []

    def _parse_highlight_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse highlight/glow/mark commands."""
        highlight_patterns = [
            r'\b(highlight|glow|mark|emphasize|select)\b',
        ]

        for pattern in highlight_patterns:
            if re.search(pattern, text):
                target = self._find_target_object(text, context)
                color = self._extract_color(text) or "#ffff00"

                # Check for safety zone highlighting
                if 'safety' in text or 'zone' in text or 'area' in text:
                    obj_id = self._generate_object_id("safety_zone", context)
                    position = self._extract_position(text, context)
                    return [SceneAction(
                        action=ActionType.ADD_SAFETY_ZONE,
                        target=obj_id,
                        params={
                            "position": position,
                            "color": color,
                            "size": {"x": 5, "y": 0.1, "z": 5}
                        }
                    )]

                if target:
                    return [SceneAction(
                        action=ActionType.HIGHLIGHT_OBJECT,
                        target=target,
                        params={"color": color, "duration": 3000}
                    )]
        return []

    def _parse_camera_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse camera/zoom/view commands."""
        camera_patterns = [
            r'\b(zoom|camera|view|look|focus|pan)\b',
        ]

        for pattern in camera_patterns:
            if re.search(pattern, text):
                # Check for predefined camera positions
                for target_name, camera_config in self.CAMERA_TARGETS.items():
                    if target_name in text:
                        return [SceneAction(
                            action=ActionType.CAMERA_FOCUS,
                            target="camera",
                            params=camera_config
                        )]

                # Check for zoom in/out
                if 'zoom' in text:
                    if 'in' in text:
                        return [SceneAction(
                            action=ActionType.CAMERA_ZOOM,
                            target="camera",
                            params={"direction": "in", "amount": 0.5}
                        )]
                    elif 'out' in text:
                        return [SceneAction(
                            action=ActionType.CAMERA_ZOOM,
                            target="camera",
                            params={"direction": "out", "amount": 0.5}
                        )]

                # Focus on a specific object
                target = self._find_target_object(text, context)
                if target and context:
                    for obj in context.get("objects", []):
                        if obj.get("id") == target:
                            pos = obj.get("position", {"x": 0, "y": 0, "z": 0})
                            return [SceneAction(
                                action=ActionType.CAMERA_FOCUS,
                                target="camera",
                                params={
                                    "position": {
                                        "x": pos["x"] + 8,
                                        "y": pos["y"] + 6,
                                        "z": pos["z"] + 8
                                    },
                                    "target": pos
                                }
                            )]
        return []

    def _parse_visibility_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse show/hide commands."""
        if re.search(r'\b(hide|invisible)\b', text):
            target = self._find_target_object(text, context)
            if target:
                return [SceneAction(
                    action=ActionType.SET_VISIBILITY,
                    target=target,
                    params={"visible": False}
                )]

        if re.search(r'\b(show|visible|reveal)\b', text):
            target = self._find_target_object(text, context)
            if target:
                return [SceneAction(
                    action=ActionType.SET_VISIBILITY,
                    target=target,
                    params={"visible": True}
                )]

        return []

    def _parse_reset_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse reset/clear commands."""
        if re.search(r'\b(reset|clear|restart)\b(?:\s+the)?\s*\b(scene|all|everything)\b', text):
            return [SceneAction(
                action=ActionType.RESET_SCENE,
                target="scene",
                params={"keep_defaults": True}
            )]
        return []

    def _parse_animate_command(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Parse animate/start/stop commands."""
        if re.search(r'\b(animate|start|run|activate)\b', text):
            target = self._find_target_object(text, context)
            if target:
                return [SceneAction(
                    action=ActionType.ANIMATE_OBJECT,
                    target=target,
                    params={"animate": True}
                )]

        if re.search(r'\b(stop|pause|deactivate)\b', text):
            target = self._find_target_object(text, context)
            if target:
                return [SceneAction(
                    action=ActionType.ANIMATE_OBJECT,
                    target=target,
                    params={"animate": False}
                )]

        return []

    def _infer_intent(self, text: str, context: Optional[Dict]) -> List[SceneAction]:
        """Try to infer user intent when no explicit command is found."""
        # Check if user is describing a scene element
        obj_type, _ = self._extract_object_type(text)
        if obj_type:
            # Assume they want to add it
            position = self._extract_position(text, context)
            color = self._extract_color(text) or "#888888"
            obj_id = self._generate_object_id(obj_type.value, context)

            return [SceneAction(
                action=ActionType.ADD_OBJECT,
                target=obj_id,
                params={
                    "type": obj_type.value,
                    "name": obj_type.value.replace("_", " ").title(),
                    "position": position,
                    "rotation": {"x": 0, "y": 0, "z": 0},
                    "scale": {"x": 1, "y": 1, "z": 1},
                    "color": color
                }
            )]

        return []