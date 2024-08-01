const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = ""; // Clear the board
  console.log(`Rendering board. Player role: ${playerRole}`); // Debugging log
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
        pieceElement.innerText = getPieceUnicode(square);
        
        // Pieces should be draggable if playerRole matches the piece color
        pieceElement.draggable = playerRole && playerRole === square.color;
        
        // Debugging log for draggable property
        console.log(`Piece draggable: ${pieceElement.draggable}, Player role: ${playerRole}, Piece color: ${square.color}`);

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault(); // Allow drop
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col)
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });
  if(playerRole==="b"){
    boardElement.classList.add("flipped");

  }
  else{
    boardElement.classList.remove("flipped");
  }
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: 'q', // Always promote to queen for simplicity
  };
  console.log(`Move: ${JSON.stringify(move)}`); // Debugging log for move
  socket.emit("move", move); // Emit the move to the server
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♙",
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙"
  };
  return unicodePieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
  playerRole = role === "White" ? "w" : "b"; // Convert to 'w' or 'b'
  console.log(`Assigned player role: ${playerRole}`); // Debugging log for player role
  renderBoard(); // Render the board again after role is assigned
});

socket.on("spectatorRole", () => {
  playerRole = null; // No role for spectators
  console.log("Assigned role: spectator"); // Debugging log for spectator role
  renderBoard(); // Render the board
});

socket.on("boardState", (fen) => {
  chess.load(fen); // Load the new board state
  console.log(`Board state updated: ${fen}`); // Debugging log for board state
  renderBoard(); // Render the board
});

socket.on("move", (move) => {
  chess.move(move); // Update the board with the new move
  console.log(`Move received: ${JSON.stringify(move)}`); // Debugging log for received move
  renderBoard(); // Render the board
});

console.log("Initial render"); // Debugging log for initial render
renderBoard(); // Initial rendering of the board

