(function (global) {
  'use strict';

  var PIECE_VALUES = {
    king: 10000,
    rook: 900,
    cannon: 450,
    horse: 400,
    elephant: 200,
    advisor: 200,
    pawn: 100
  };

  var PST = {
    pawn: {
      red: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [5, 10, 20, 30, 40, 30, 20, 10, 5],
        [10, 20, 30, 40, 50, 40, 30, 20, 10],
        [20, 30, 40, 50, 60, 50, 40, 30, 20],
        [30, 40, 50, 60, 70, 60, 50, 40, 30],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      black: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [30, 40, 50, 60, 70, 60, 50, 40, 30],
        [20, 30, 40, 50, 60, 50, 40, 30, 20],
        [10, 20, 30, 40, 50, 40, 30, 20, 10],
        [5, 10, 20, 30, 40, 30, 20, 10, 5],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
    },
    horse: {
      red: [
        [-20, -10, -10, -10, -10, -10, -10, -10, -20],
        [-10, 0, 0, 10, 15, 10, 0, 0, -10],
        [-10, 5, 10, 15, 20, 15, 10, 5, -10],
        [-10, 5, 10, 15, 20, 15, 10, 5, -10],
        [-10, 5, 10, 15, 20, 15, 10, 5, -10],
        [-10, 5, 10, 15, 20, 15, 10, 5, -10],
        [-10, 5, 10, 15, 20, 15, 10, 5, -10],
        [-10, 0, 5, 10, 15, 10, 5, 0, -10],
        [-20, -10, -10, -10, -10, -10, -10, -10, -20],
        [-20, -10, -10, -10, -10, -10, -10, -10, -20]
      ],
      black: [
        [-20, -10, -10, -10, -10, -10, -10, -10, -20],
        [-20, -10, -10, -10, -10, -10, -10, -10, -20],
        [-10, 0, 5, 10, 15, 10, 5, 0, -10],
        [-10, 5, 10, 15, 20, 15, 10, 5, -10],
        [-10, 5, 10, 15, 20, 15, 10, 5, -10],
        [-10, 5, 10, 15, 20, 15, 10, 5, -10],
        [-10, 5, 10, 15, 20, 15, 10, 5, -10],
        [-10, 0, 0, 10, 15, 10, 0, 0, -10],
        [-20, -10, -10, -10, -10, -10, -10, -10, -20],
        [-20, -10, -10, -10, -10, -10, -10, -10, -20]
      ]
    },
    rook: {
      red: [
        [0, 0, 0, 5, 5, 5, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 5, 5, 5, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      black: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 5, 5, 5, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 10, 10, 10, 0, 0, 0],
        [0, 0, 0, 5, 5, 5, 0, 0, 0],
        [0, 0, 0, 5, 5, 5, 0, 0, 0]
      ]
    }
  };

  function clonePieces(pieces) {
    return pieces.map(function (p) {
      var copy = {};
      Object.keys(p).forEach(function (k) { copy[k] = p[k]; });
      return copy;
    });
  }

  function findPieceAt(pieces, col, row) {
    for (var i = 0; i < pieces.length; i++) {
      if (pieces[i].col === col && pieces[i].row === row) return pieces[i];
    }
    return null;
  }

  function findKing(pieces, color) {
    for (var i = 0; i < pieces.length; i++) {
      if (pieces[i].type === 'king' && pieces[i].color === color) return pieces[i];
    }
    return null;
  }

  function inBounds(col, row) {
    return col >= 0 && col <= 8 && row >= 0 && row <= 9;
  }

  function inPalace(col, row, color) {
    if (col < 3 || col > 5) return false;
    if (color === 'black') return row >= 0 && row <= 2;
    return row >= 7 && row <= 9;
  }

  function makeMove(pieces, move) {
    var state = clonePieces(pieces);
    var piece = findPieceAt(state, move.fromCol, move.fromRow);
    if (!piece) return null;
    var captured = findPieceAt(state, move.toCol, move.toRow);
    piece.col = move.toCol;
    piece.row = move.toRow;
    if (captured) {
      state = state.filter(function (p) { return p !== captured; });
    }
    return { pieces: state, captured: captured, piece: piece };
  }

  function isKingsFacing(pieces) {
    var redKing = findKing(pieces, 'red');
    var blackKing = findKing(pieces, 'black');
    if (!redKing || !blackKing) return false;
    if (redKing.col !== blackKing.col) return false;
    var minRow = Math.min(redKing.row, blackKing.row);
    var maxRow = Math.max(redKing.row, blackKing.row);
    for (var r = minRow + 1; r < maxRow; r++) {
      if (findPieceAt(pieces, redKing.col, r)) return false;
    }
    return true;
  }

  function countBetween(pieces, col, row1, row2) {
    var count = 0;
    var min = Math.min(row1, row2);
    var max = Math.max(row1, row2);
    for (var r = min + 1; r < max; r++) {
      if (findPieceAt(pieces, col, r)) count++;
    }
    return count;
  }

  function countBetweenCol(pieces, row, col1, col2) {
    var count = 0;
    var min = Math.min(col1, col2);
    var max = Math.max(col1, col2);
    for (var c = min + 1; c < max; c++) {
      if (findPieceAt(pieces, c, row)) count++;
    }
    return count;
  }

  function canAttack(pieces, attacker, targetCol, targetRow) {
    if (attacker.col === targetCol && attacker.row === targetRow) return false;

    var dc = targetCol - attacker.col;
    var dr = targetRow - attacker.row;
    var type = attacker.type;
    var color = attacker.color;

    if (type === 'king') {
      if (!inPalace(targetCol, targetRow, color)) return false;
      return (Math.abs(dc) + Math.abs(dr) === 1);
    }

    if (type === 'advisor') {
      if (!inPalace(targetCol, targetRow, color)) return false;
      return Math.abs(dc) === 1 && Math.abs(dr) === 1;
    }

    if (type === 'elephant') {
      if (color === 'red' && targetRow < 5) return false;
      if (color === 'black' && targetRow > 4) return false;
      if (Math.abs(dc) !== 2 || Math.abs(dr) !== 2) return false;
      var eyeCol = attacker.col + dc / 2;
      var eyeRow = attacker.row + dr / 2;
      return !findPieceAt(pieces, eyeCol, eyeRow);
    }

    if (type === 'horse') {
      var absDc = Math.abs(dc);
      var absDr = Math.abs(dr);
      if (!((absDc === 1 && absDr === 2) || (absDc === 2 && absDr === 1))) return false;
      var legCol = attacker.col + (absDc === 2 ? dc / 2 : 0);
      var legRow = attacker.row + (absDr === 2 ? dr / 2 : 0);
      return !findPieceAt(pieces, legCol, legRow);
    }

    if (type === 'rook') {
      if (dc !== 0 && dr !== 0) return false;
      if (dc === 0) {
        return countBetween(pieces, attacker.col, attacker.row, targetRow) === 0;
      }
      return countBetweenCol(pieces, attacker.row, attacker.col, targetCol) === 0;
    }

    if (type === 'cannon') {
      if (dc !== 0 && dr !== 0) return false;
      var between;
      if (dc === 0) {
        between = countBetween(pieces, attacker.col, attacker.row, targetRow);
      } else {
        between = countBetweenCol(pieces, attacker.row, attacker.col, targetCol);
      }
      var target = findPieceAt(pieces, targetCol, targetRow);
      if (target) return between === 1;
      return between === 0;
    }

    if (type === 'pawn') {
      var forward = color === 'red' ? -1 : 1;
      var crossed = color === 'red' ? attacker.row <= 4 : attacker.row >= 5;
      if (dc === 0 && dr === forward) return true;
      if (crossed && Math.abs(dc) === 1 && dr === 0) return true;
      return false;
    }

    return false;
  }

  function isSquareAttacked(pieces, col, row, byColor) {
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      if (p.color !== byColor) continue;
      if (canAttack(pieces, p, col, row)) return true;
    }
    return false;
  }

  function isInCheck(pieces, color) {
    var king = findKing(pieces, color);
    if (!king) return true;
    var opponent = color === 'red' ? 'black' : 'red';
    return isSquareAttacked(pieces, king.col, king.row, opponent);
  }

  function getPseudoMovesForPiece(pieces, piece) {
    var moves = [];
    var col = piece.col;
    var row = piece.row;
    var type = piece.type;
    var color = piece.color;

    function addMove(toCol, toRow) {
      if (!inBounds(toCol, toRow)) return;
      var target = findPieceAt(pieces, toCol, toRow);
      if (target && target.color === color) return;
      moves.push({
        fromCol: col,
        fromRow: row,
        toCol: toCol,
        toRow: toRow,
        piece: piece,
        captured: target
      });
    }

    if (type === 'king') {
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function (d) {
        var nc = col + d[0];
        var nr = row + d[1];
        if (inPalace(nc, nr, color)) addMove(nc, nr);
      });
    } else if (type === 'advisor') {
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) {
        var nc = col + d[0];
        var nr = row + d[1];
        if (inPalace(nc, nr, color)) addMove(nc, nr);
      });
    } else if (type === 'elephant') {
      [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(function (d) {
        var nc = col + d[0];
        var nr = row + d[1];
        if (!inBounds(nc, nr)) return;
        if (color === 'red' && nr < 5) return;
        if (color === 'black' && nr > 4) return;
        var eyeCol = col + d[0] / 2;
        var eyeRow = row + d[1] / 2;
        if (findPieceAt(pieces, eyeCol, eyeRow)) return;
        addMove(nc, nr);
      });
    } else if (type === 'horse') {
      var horseDirs = [
        { leg: [0, 1], dest: [1, 2] }, { leg: [0, 1], dest: [-1, 2] },
        { leg: [0, -1], dest: [1, -2] }, { leg: [0, -1], dest: [-1, -2] },
        { leg: [1, 0], dest: [2, 1] }, { leg: [1, 0], dest: [2, -1] },
        { leg: [-1, 0], dest: [-2, 1] }, { leg: [-1, 0], dest: [-2, -1] }
      ];
      horseDirs.forEach(function (h) {
        var legCol = col + h.leg[0];
        var legRow = row + h.leg[1];
        if (findPieceAt(pieces, legCol, legRow)) return;
        addMove(col + h.dest[0], row + h.dest[1]);
      });
    } else if (type === 'rook') {
      var dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      dirs.forEach(function (d) {
        var nc = col + d[0];
        var nr = row + d[1];
        while (inBounds(nc, nr)) {
          var target = findPieceAt(pieces, nc, nr);
          if (target) {
            if (target.color !== color) {
              moves.push({ fromCol: col, fromRow: row, toCol: nc, toRow: nr, piece: piece, captured: target });
            }
            break;
          }
          moves.push({ fromCol: col, fromRow: row, toCol: nc, toRow: nr, piece: piece, captured: null });
          nc += d[0];
          nr += d[1];
        }
      });
    } else if (type === 'cannon') {
      var cDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      cDirs.forEach(function (d) {
        var nc = col + d[0];
        var nr = row + d[1];
        var jumped = false;
        while (inBounds(nc, nr)) {
          var target = findPieceAt(pieces, nc, nr);
          if (!jumped) {
            if (target) {
              jumped = true;
            } else {
              moves.push({ fromCol: col, fromRow: row, toCol: nc, toRow: nr, piece: piece, captured: null });
            }
          } else if (target) {
            if (target.color !== color) {
              moves.push({ fromCol: col, fromRow: row, toCol: nc, toRow: nr, piece: piece, captured: target });
            }
            break;
          }
          nc += d[0];
          nr += d[1];
        }
      });
    } else if (type === 'pawn') {
      var forward = color === 'red' ? -1 : 1;
      var crossed = color === 'red' ? row <= 4 : row >= 5;
      addMove(col, row + forward);
      if (crossed) {
        addMove(col - 1, row);
        addMove(col + 1, row);
      }
    }

    return moves;
  }

  function getPseudoLegalMoves(pieces, color) {
    var moves = [];
    pieces.forEach(function (p) {
      if (p.color === color) {
        moves = moves.concat(getPseudoMovesForPiece(pieces, p));
      }
    });
    return moves;
  }

  function getLegalMoves(pieces, color) {
    var pseudo = getPseudoLegalMoves(pieces, color);
    var legal = [];
    for (var i = 0; i < pseudo.length; i++) {
      var move = pseudo[i];
      var result = makeMove(pieces, move);
      if (!result) continue;
      if (isInCheck(result.pieces, color)) continue;
      if (isKingsFacing(result.pieces)) continue;
      legal.push(move);
    }
    return legal;
  }

  function isGameOver(pieces, colorToMove) {
    var redKing = findKing(pieces, 'red');
    var blackKing = findKing(pieces, 'black');
    if (!redKing) return { over: true, winner: 'black', reason: '将死' };
    if (!blackKing) return { over: true, winner: 'red', reason: '将死' };

    var inCheck = isInCheck(pieces, colorToMove);
    var moves = getLegalMoves(pieces, colorToMove);
    if (moves.length === 0) {
      if (inCheck) {
        return {
          over: true,
          winner: colorToMove === 'red' ? 'black' : 'red',
          reason: '将死'
        };
      }
      return { over: true, winner: null, reason: '困毙' };
    }
    return { over: false, winner: null, reason: null };
  }

  function getPstBonus(type, color, col, row) {
    var table = PST[type];
    if (!table) return 0;
    var side = table[color];
    if (!side) return 0;
    return side[row][col] || 0;
  }

  function evaluate(pieces) {
    var score = 0;
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      var val = PIECE_VALUES[p.type] || 0;
      var pst = getPstBonus(p.type, p.color, p.col, p.row);
      if (p.color === 'red') {
        score += val + pst;
      } else {
        score -= val + pst;
      }
    }
    return score;
  }

  function scoreToWinRate(score) {
    var redWin = 1 / (1 + Math.exp(-score / 400));
    return {
      red: Math.round(redWin * 100),
      black: Math.round((1 - redWin) * 100)
    };
  }

  function getAdvantageLabel(score) {
    if (score >= 800) return '红方大优';
    if (score >= 300) return '红方略优';
    if (score <= -800) return '黑方大优';
    if (score <= -300) return '黑方略优';
    return '均势';
  }

  function movesEqual(a, b) {
    return a.fromCol === b.fromCol && a.fromRow === b.fromRow &&
      a.toCol === b.toCol && a.toRow === b.toRow;
  }

  function findBestMove(pieces, color, depth) {
    var moves = getLegalMoves(pieces, color);
    if (moves.length === 0) return { move: null, score: color === 'red' ? -99999 : 99999 };

    var maximizing = color === 'red';
    var bestMove = moves[0];
    var bestScore = maximizing ? -Infinity : Infinity;

    for (var i = 0; i < moves.length; i++) {
      var result = makeMove(pieces, moves[i]);
      var score = minimax(result.pieces, depth - 1, -Infinity, Infinity, !maximizing);
      if (maximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = moves[i];
        }
      } else if (score < bestScore) {
        bestScore = score;
        bestMove = moves[i];
      }
    }

    return { move: bestMove, score: bestScore };
  }

  function minimax(pieces, depth, alpha, beta, maximizing) {
    var colorToMove = maximizing ? 'red' : 'black';
    var gameOver = isGameOver(pieces, colorToMove);
    if (gameOver.over) {
      if (gameOver.winner === 'red') return 99999;
      if (gameOver.winner === 'black') return -99999;
      return 0;
    }
    if (depth === 0) return evaluate(pieces);

    var moves = getLegalMoves(pieces, colorToMove);
    if (maximizing) {
      var maxEval = -Infinity;
      for (var i = 0; i < moves.length; i++) {
        var result = makeMove(pieces, moves[i]);
        var evalScore = minimax(result.pieces, depth - 1, alpha, beta, false);
        if (evalScore > maxEval) maxEval = evalScore;
        if (evalScore > alpha) alpha = evalScore;
        if (beta <= alpha) break;
      }
      return maxEval;
    }

    var minEval = Infinity;
    for (var j = 0; j < moves.length; j++) {
      var res = makeMove(pieces, moves[j]);
      var ev = minimax(res.pieces, depth - 1, alpha, beta, true);
      if (ev < minEval) minEval = ev;
      if (ev < beta) beta = ev;
      if (beta <= alpha) break;
    }
    return minEval;
  }

  global.XQEngine = {
    clonePieces: clonePieces,
    findPieceAt: findPieceAt,
    findKing: findKing,
    makeMove: makeMove,
    getLegalMoves: getLegalMoves,
    getLegalMovesForPiece: function (pieces, piece) {
      return getPseudoMovesForPiece(pieces, piece).filter(function (move) {
        var result = makeMove(pieces, move);
        if (!result) return false;
        if (isInCheck(result.pieces, piece.color)) return false;
        if (isKingsFacing(result.pieces)) return false;
        return true;
      });
    },
    isInCheck: isInCheck,
    isKingsFacing: isKingsFacing,
    isGameOver: isGameOver,
    evaluate: evaluate,
    scoreToWinRate: scoreToWinRate,
    getAdvantageLabel: getAdvantageLabel,
    movesEqual: movesEqual,
    findBestMove: findBestMove,
    minimax: minimax
  };
})(typeof self !== 'undefined' ? self : window);
