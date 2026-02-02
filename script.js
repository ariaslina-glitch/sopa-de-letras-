// Configuración del juego
const GRID_SIZE = 12;
const WORDS = [
    'JAVASCRIPT',
    'HTML',
    'CSS',
    'REACT',
    'PYTHON',
    'JAVA',
    'ANGULAR',
    'NODE'
];

// Variables del juego
let grid = [];
let wordPositions = [];
let selectedCells = [];
let foundWords = new Set();
let isSelecting = false;
let startTime;
let timerInterval;

// Inicializar el juego
function initGame() {
    grid = createEmptyGrid();
    wordPositions = [];
    foundWords = new Set();
    selectedCells = [];
    isSelecting = false;
    
    placeWords();
    fillEmptySpaces();
    renderGrid();
    renderWordList();
    updateScore();
    startTimer();
    
    const message = document.getElementById('message');
    message.classList.remove('show');
}

// Crear grid vacía
function createEmptyGrid() {
    const newGrid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        newGrid[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            newGrid[i][j] = '';
        }
    }
    return newGrid;
}

// Colocar palabras en la grid
function placeWords() {
    const directions = [
        { dx: 0, dy: 1 },   // horizontal derecha
        { dx: 1, dy: 0 },   // vertical abajo
        { dx: 1, dy: 1 },   // diagonal abajo-derecha
        { dx: -1, dy: 1 }   // diagonal arriba-derecha
    ];

    WORDS.forEach(word => {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);
            
            if (canPlaceWord(word, row, col, direction)) {
                placeWord(word, row, col, direction);
                placed = true;
            }
            attempts++;
        }
    });
}

// Verificar si se puede colocar una palabra
function canPlaceWord(word, row, col, direction) {
    const endRow = row + direction.dx * (word.length - 1);
    const endCol = col + direction.dy * (word.length - 1);
    
    if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) {
        return false;
    }
    
    for (let i = 0; i < word.length; i++) {
        const r = row + direction.dx * i;
        const c = col + direction.dy * i;
        
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
            return false;
        }
    }
    
    return true;
}

// Colocar palabra en la grid
function placeWord(word, row, col, direction) {
    const positions = [];
    
    for (let i = 0; i < word.length; i++) {
        const r = row + direction.dx * i;
        const c = col + direction.dy * i;
        grid[r][c] = word[i];
        positions.push({ row: r, col: c });
    }
    
    wordPositions.push({
        word: word,
        positions: positions
    });
}

// Llenar espacios vacíos con letras aleatorias
function fillEmptySpaces() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === '') {
                grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
}

// Renderizar la grid en el DOM
function renderGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';
    
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = grid[i][j];
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            gridElement.appendChild(cell);
        }
    }
    
    // Agregar eventos al grid completo
    gridElement.addEventListener('mousedown', handleMouseDown);
    gridElement.addEventListener('mousemove', handleMouseMove);
    gridElement.addEventListener('mouseup', handleMouseUp);
    gridElement.addEventListener('mouseleave', handleMouseUp);
    
    // Prevenir selección de texto
    gridElement.addEventListener('selectstart', (e) => e.preventDefault());
}

// Renderizar lista de palabras
function renderWordList() {
    const wordList = document.getElementById('word-list');
    wordList.innerHTML = '';
    
    WORDS.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        li.dataset.word = word;
        wordList.appendChild(li);
    });
    
    document.getElementById('total-count').textContent = WORDS.length;
}

// Manejador de mousedown
function handleMouseDown(e) {
    if (e.target.classList.contains('cell')) {
        isSelecting = true;
        selectedCells = [];
        selectCell(e.target);
    }
}

// Manejador de mousemove
function handleMouseMove(e) {
    if (isSelecting && e.target.classList.contains('cell')) {
        selectCell(e.target);
    }
}

// Manejador de mouseup
function handleMouseUp() {
    if (isSelecting) {
        checkSelectedWord();
        clearSelection();
        isSelecting = false;
    }
}

// Seleccionar celda
function selectCell(cellElement) {
    const row = parseInt(cellElement.dataset.row);
    const col = parseInt(cellElement.dataset.col);
    
    // Verificar si la celda ya está en la selección
    const alreadySelected = selectedCells.some(cell => 
        cell.row === row && cell.col === col
    );
    
    if (!alreadySelected) {
        selectedCells.push({ row, col, element: cellElement });
        cellElement.classList.add('selected');
    }
}

// Verificar palabra seleccionada
function checkSelectedWord() {
    if (selectedCells.length < 2) return;
    
    const selectedWord = selectedCells.map(cell => 
        grid[cell.row][cell.col]
    ).join('');
    
    const reverseWord = selectedWord.split('').reverse().join('');
    
    // Buscar coincidencias
    wordPositions.forEach(wordPos => {
        if ((wordPos.word === selectedWord || wordPos.word === reverseWord) && 
            !foundWords.has(wordPos.word)) {
            
            if (isValidSelection(selectedCells, wordPos.positions)) {
                markWordAsFound(wordPos);
            }
        }
    });
}

// Verificar si la selección es válida (línea recta)
function isValidSelection(selected, positions) {
    if (selected.length !== positions.length) return false;
    
    // Ordenar ambas listas
    const sortedSelected = selected.map(s => `${s.row},${s.col}`).sort();
    const sortedPositions = positions.map(p => `${p.row},${p.col}`).sort();
    
    // Comparar
    return sortedSelected.every((val, index) => val === sortedPositions[index]);
}

// Marcar palabra como encontrada
function markWordAsFound(wordPos) {
    foundWords.add(wordPos.word);
    
    // Marcar celdas como encontradas
    wordPos.positions.forEach(pos => {
        const cell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            cell.classList.remove('selected');
            cell.classList.add('found');
        }
    });
    
    // Marcar palabra en la lista
    const wordItem = document.querySelector(`[data-word="${wordPos.word}"]`);
    if (wordItem) {
        wordItem.classList.add('found');
    }
    
    updateScore();
    showMessage(`¡Encontraste "${wordPos.word}"! 🎉`, 'success');
    
    // Verificar si se completó el juego
    if (foundWords.size === WORDS.length) {
        stopTimer();
        showMessage('¡Felicidades! ¡Completaste el juego! 🏆', 'complete');
    }
}

// Limpiar selección
function clearSelection() {
    selectedCells.forEach(cell => {
        if (!cell.element.classList.contains('found')) {
            cell.element.classList.remove('selected');
        }
    });
    selectedCells = [];
}

// Actualizar puntuación
function updateScore() {
    document.getElementById('found-count').textContent = foundWords.size;
}

// Mostrar mensaje
function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type} show`;
    
    setTimeout(() => {
        message.classList.remove('show');
    }, 3000);
}

// Timer
function startTimer() {
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        document.getElementById('timer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Event listeners
document.getElementById('reset-btn').addEventListener('click', initGame);

// Iniciar el juego al cargar la página
window.addEventListener('load', initGame);
