#!/bin/bash
set -e  # Выход при ошибке
set -o pipefail  # Выход при ошибке в пайпе

# Логирование
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >&2
}

log "Starting cursor-agent execution"
log "Working directory: $(pwd)"
log "User: $(whoami)"
log "PATH: $PATH"

# Проверка наличия CURSOR_API_KEY
if [ -z "$CURSOR_API_KEY" ]; then
    log "ERROR: CURSOR_API_KEY is not set"
    exit 1
fi

log "CURSOR_API_KEY is set (length: ${#CURSOR_API_KEY})"

# Проверка наличия cursor-agent
if ! command -v cursor-agent &> /dev/null; then
    log "ERROR: cursor-agent not found in PATH"
    log "Trying to find in common locations..."

    # Проверяем стандартные пути
    if [ -f "$HOME/.cursor/bin/cursor-agent" ]; then
        log "Found cursor-agent at $HOME/.cursor/bin/cursor-agent"
        export PATH="$HOME/.cursor/bin:$PATH"
    else
        log "ERROR: cursor-agent not found. Please install cursor-cli first."
        exit 1
    fi
fi

log "Using cursor-agent: $(which cursor-agent)"
log "cursor-agent version: $(cursor-agent --version 2>&1 || echo 'version check failed')"

# Параметры команды
INSTRUCTION_FILE="$1"
if [ -z "$INSTRUCTION_FILE" ]; then
    log "ERROR: Instruction file path is required"
    exit 1
fi

if [ ! -f "$INSTRUCTION_FILE" ]; then
    log "ERROR: Instruction file not found: $INSTRUCTION_FILE"
    exit 1
fi

log "Instruction file: $INSTRUCTION_FILE"

# Запуск cursor-agent
log "Executing cursor-agent..."
log "Command: cursor-agent -p --force --model=sonnet-4.5 --output-format text \"Implement instructions in the file $INSTRUCTION_FILE\""

# Выполняем команду с логированием
cursor-agent \
    -p \
    --force \
    --model=sonnet-4.5 \
    --output-format stream-json \
    --stream-partial-output \
    "Implement instructions in the file $INSTRUCTION_FILE" 2>&1 | while IFS= read -r line; do
    log "cursor-agent: $line"
done

EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    log "cursor-agent completed successfully"
else
    log "ERROR: cursor-agent exited with code $EXIT_CODE"
    exit $EXIT_CODE
fi
