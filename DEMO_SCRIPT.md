```
# Product Demo Flow  
**Prompt-Driven 3D Industrial Simulation Studio**

**Recommended Duration:** 2–3 minutes

---

## Demo Objective

Demonstrate how natural language prompts can be used to **interactively build and manipulate an industrial 3D scene in the browser**, highlighting frontend performance, product UX, and a clean prompt-to-action architecture.

---

## 1. Initial Scene Overview

Start with the default industrial workspace loaded.

- Show the conveyor belt and robotic arm
- Pan the camera slightly to establish spatial context

**Narrative focus:**  
The application starts with a minimal industrial setup designed for clarity and extensibility.

---

## 2. Interface Layout

Briefly walk through the interface layout:

- **Prompt Panel (Left):** Natural language input and prompt history  
- **3D Viewport (Center):** Interactive Three.js scene with orbit controls  
- **Inspector Panel (Right):** Object properties and direct manipulation  

**Narrative focus:**  
The UI is designed to balance free-form prompt interaction with precise manual control.

---

## 3. Prompt-Driven Interaction

### 3.1 Object Creation

Execute the prompt:

```

Add a blue box next to the robot arm

```

- Show the object appearing instantly in the scene

**Narrative focus:**  
Prompts are sent to the backend, converted into structured actions, and deterministically applied to the scene.

---

### 3.2 Object Modification

Select the robot arm in the scene.

Execute:

```

Rotate the robot arm 45 degrees

```

- Show smooth rotation
- Highlight Inspector panel updates

**Narrative focus:**  
The system understands object context and applies transformations in real time.

---

### 3.3 Camera Control

Execute:

```

Zoom camera to inspection area

```

- Show animated camera transition

**Narrative focus:**  
Camera movement is prompt-driven but remains smooth and user-friendly.

---

### 3.4 Safety Visualization

Execute:

```

Highlight safety zone in red

```

- Show translucent safety zone overlay

**Narrative focus:**  
Safety zones are first-class objects, supporting industrial and robotics workflows.

---

## 4. Inspector Panel Interaction

Select an object and demonstrate:

- Position, rotation, and scale adjustments  
- Color changes  
- Visibility toggling  

**Narrative focus:**  
Prompt-based control is complemented by precise inspector-based editing.

---

## 5. Scene Persistence

Demonstrate persistence features:

- Sign in  
- Save the current scene with a name  
- Reload the saved scene  

Optionally show JSON export.

**Narrative focus:**  
Scenes can be versioned, persisted, and restored, supporting real product workflows.

---

## 6. Technical Architecture Overview

Briefly show a diagram or code structure:

- React + Vite frontend  
- Three.js for rendering  
- FastAPI backend  
- Structured scene action schema  
- JWT-based authentication  
- PostgreSQL persistence  

**Narrative focus:**  
The architecture cleanly separates UI rendering, prompt interpretation, and scene state management.

---

## 7. Conclusion

End on a fully modified scene with multiple objects.

**Narrative focus:**  
This project demonstrates how natural language interfaces can make complex 3D environments more accessible, while remaining deterministic, performant, and production-ready.

---

## Suggested Prompts for Demo

Use the following prompts for consistent results:

1. `Add a robotic arm next to the conveyor`  
2. `Rotate the robot arm 45 degrees`  
3. `Add a blue box on the conveyor`  
4. `Highlight safety zone in red`  
5. `Zoom camera to inspection area`  
6. `Scale the conveyor to 1.5`  
7. `Start animating the robot arm`  
8. `Move the box to the left`  
```
