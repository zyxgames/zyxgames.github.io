
class Minesweeper {
    constructor() {
        this.boardSize = 10;
        this.mineCount = 15;
        this.board = [];
        this.revealedCount = 0;
        this.flaggedCount = 0;
        this.gameOver = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;

        this.difficultySettings = {
            easy: { size: 8, mines: 10 },
            medium: { size: 10, mines: 15 },
            hard: { size: 12, mines: 22 }
        };

        this.initElements();
        this.initEventListeners();
        this.startNewGame();
    }

    initElements() {
        this.boardElement = document.getElementById('game-board');
        this.minesCountElement = document.getElementById('mines-count');
        this.timerElement = document.getElementById('timer');
        this.difficultySelect = document.getElementById('difficulty');
        this.restartButton = document.getElementById('restart');
        this.gameResultModal = document.getElementById('game-result');
        this.resultMessage = document.getElementById('result-message');
        this.playAgainButton = document.getElementById('play-again');
    }

    initEventListeners() {
        this.restartButton.addEventListener('click', () => this.startNewGame());
        this.difficultySelect.addEventListener('change', () => this.startNewGame());
        this.playAgainButton.addEventListener('click', () => {
            this.gameResultModal.classList.add('hidden');
            this.startNewGame();
        });
    }

    startNewGame() {
        const difficulty = this.difficultySelect.value;
        const settings = this.difficultySettings[difficulty];
        this.boardSize = settings.size;
        this.mineCount = settings.mines;

        this.board = [];
        this.revealedCount = 0;
        this.flaggedCount = 0;
        this.gameOver = false;
        this.firstClick = true;
        this.timer = 0;
        
        clearInterval(this.timerInterval);
        this.timerElement.textContent = this.timer;
        this.minesCountElement.textContent = this.mineCount;

        this.createBoard();
        this.renderBoard();
    }

    createBoard() {
        // Initialize empty board
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = {
                    isMine: false,
                    revealed: false,
                    flagged: false,
                    adjacentMines: 0
                };
            }
        }
    }

    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.boardSize);
            const col = Math.floor(Math.random() * this.boardSize);
            
            // Don't place mine on first click position or adjacent cells
            const isFirstClickArea = 
                Math.abs(row - firstClickRow) <= 1 && 
                Math.abs(col - firstClickCol) <= 1;
                
            if (!this.board[row][col].isMine && !isFirstClickArea) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate adjacent mines for each cell
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (!this.board[i][j].isMine) {
                    this.board[i][j].adjacentMines = this.countAdjacentMines(i, j);
                }
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let i = Math.max(0, row - 1); i <= Math.min(this.boardSize - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(this.boardSize - 1, col + 1); j++) {
                if (this.board[i][j].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    renderBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;

        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                const cellData = this.board[i][j];
                
                if (cellData.revealed) {
                    cell.classList.add('revealed');
                    if (cellData.isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (cellData.adjacentMines > 0) {
                        cell.textContent = cellData.adjacentMines;
                        cell.classList.add(`cell-${cellData.adjacentMines}`);
                    }
                } else if (cellData.flagged) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                }

                cell.addEventListener('click', () => this.handleCellClick(i, j));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(i, j);
                });

                this.boardElement.appendChild(cell);
            }
        }
    }

    handleCellClick(row, col) {
        if (this.gameOver || this.board[row][col].flagged || this.board[row][col].revealed) {
            return;
        }

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }

        if (this.board[row][col].isMine) {
            this.revealAllMines();
            this.gameOver = true;
            this.endGame(false);
            return;
        }

        this.revealCell(row, col);
        this.renderBoard();

        if (this.checkWin()) {
            this.gameOver = true;
            this.endGame(true);
        }
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.board[row][col].revealed) {
            return;
        }

        const cell = this.board[row][col];
        if (cell.flagged) {
            cell.flagged = false;
            this.flaggedCount--;
        } else {
            cell.flagged = true;
            this.flaggedCount++;
        }

        this.minesCountElement.textContent = this.mineCount - this.flaggedCount;
        this.renderBoard();
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize || 
            this.board[row][col].revealed || this.board[row][col].flagged) {
            return;
        }

        this.board[row][col].revealed = true;
        this.revealedCount++;

        if (this.board[row][col].adjacentMines === 0) {
            // Reveal adjacent cells if this cell has no adjacent mines
            for (let i = Math.max(0, row - 1); i <= Math.min(this.boardSize - 1, row + 1); i++) {
                for (let j = Math.max(0, col - 1); j <= Math.min(this.boardSize - 1, col + 1); j++) {
                    if (i !== row || j !== col) {
                        this.revealCell(i, j);
                    }
                }
            }
        }
    }

    revealAllMines() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j].isMine) {
                    this.board[i][j].revealed = true;
                }
            }
        }
    }

    checkWin() {
        return this.revealedCount === (this.boardSize * this.boardSize - this.mineCount);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.timerElement.textContent = this.timer;
        }, 1000);
    }

    endGame(isWin) {
        clearInterval(this.timerInterval);
        
        if (isWin) {
            this.resultMessage.textContent = `恭喜你赢了！用时 ${this.timer} 秒`;
        } else {
            this.resultMessage.textContent = '很遗憾，你踩到地雷了！';
        }
        
        this.gameResultModal.classList.remove('hidden');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
