# Contributing

Thank you for your interest in contributing to the 3D Industrial Simulation Studio.

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Docker (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Browser-based 3D AI Simulation Studio"
   ```

2. **Install dependencies**
   ```bash
   make install
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Start the database**
   ```bash
   docker-compose up -d db
   ```

5. **Start development servers**
   ```bash
   make dev
   ```

### Using Docker

```bash
docker-compose up -d
```

## Code Style

### Frontend (TypeScript/React)

- Follow ESLint configuration
- Use Prettier for formatting
- Use functional components with hooks
- Follow React best practices

### Backend (Python/FastAPI)

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for public functions
- Keep functions small and focused

## Testing

### Backend Tests

```bash
cd backend
pytest -v
```

### Frontend Linting

```bash
cd frontend
npm run lint
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests as needed
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request

## Commit Messages

Use conventional commit format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example: `feat: add camera animation for zoom commands`

## Architecture Guidelines

### Adding New Prompt Commands

1. Add pattern matching in `backend/app/services/prompt_parser.py`
2. Add action type in `backend/app/schemas/action.py`
3. Handle action in `frontend/src/context/SceneContext.tsx`
4. Add tests in `backend/tests/test_prompt_parser.py`

### Adding New 3D Objects

1. Add object type in `frontend/src/types/index.ts`
2. Create geometry in `frontend/src/hooks/useThreeScene.ts`
3. Update prompt parser mappings in backend

## Questions?

Open an issue for any questions or concerns.
