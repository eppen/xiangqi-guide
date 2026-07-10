(function () {
  'use strict';

  if (!window.XQBoard || !window.XQEngine) return;

  var boardApi = window.XQBoard;
  var engine = window.XQEngine;

  var playBoard = document.getElementById('playBoard');
  var playStatus = document.getElementById('playStatus');
  var playWinRateRed = document.getElementById('playWinRateRed');
  var playWinRateBlack = document.getElementById('playWinRateBlack');
  var playWinRateRedBar = document.getElementById('playWinRateRedBar');
  var playWinRateBlackBar = document.getElementById('playWinRateBlackBar');
  var playWinRateLabel = document.getElementById('playWinRateLabel');
  var playMoveList = document.getElementById('playMoveList');
  var playNewBtn = document.getElementById('playNewBtn');
  var playUndoBtn = document.getElementById('playUndoBtn');
  var playResignBtn = document.getElementById('playResignBtn');
  var playDifficulty = document.getElementById('playDifficulty');
  var playSoundToggle = document.getElementById('playSoundToggle');
  var playAnalyzeBtn = document.getElementById('playAnalyzeBtn');

  if (!playBoard) return;

  var sound = window.XQSound;
  var playAnalysis = window.XQPlayAnalysis;

  var DIFFICULTY_CONFIG = {
    easy: { maxDepth: 2, timeLimitMs: 800 },
    medium: { maxDepth: 3, timeLimitMs: 1500 },
    hard: { maxDepth: 4, timeLimitMs: 2500 }
  };

  var playPieces = [];
  var playTurn = 'red';
  var playSelected = null;
  var playLegalTargets = [];
  var playLastMove = null;
  var playHistory = [];
  var playMoveRecords = [];
  var playGameMoves = [];
  var playGameResult = null;
  var playGameOver = false;
  var playAiThinking = false;
  var playWorker = null;
  var playRequestId = 0;
  var playMoveRequestId = 0;

  function getGameLog() {
    return {
      startPieces: engine.clonePieces(boardApi.STARTING_POSITION),
      moves: playGameMoves.map(function (m) {
        return {
          color: m.color,
          fromCol: m.fromCol,
          fromRow: m.fromRow,
          toCol: m.toCol,
          toRow: m.toRow,
          captured: m.captured,
          notation: m.notation
        };
      }),
      result: playGameResult
    };
  }

  function showAnalyzeButton() {
    if (!playAnalyzeBtn) return;
    if (playGameMoves.length > 0) {
      playAnalyzeBtn.hidden = false;
      playAnalyzeBtn.disabled = false;
      playAnalyzeBtn.title = '';
    } else {
      playAnalyzeBtn.hidden = false;
      playAnalyzeBtn.disabled = true;
      playAnalyzeBtn.title = '步数不足，无法复盘';
    }
  }

  function hideAnalyzeButton() {
    if (!playAnalyzeBtn) {
      return;
    }
    playAnalyzeBtn.hidden = true;
    playAnalyzeBtn.disabled = false;
    playAnalyzeBtn.title = '';
  }

  function exitReviewMode() {
    if (playAnalysis && playAnalysis.isActive()) {
      playAnalysis.exit();
    }
    var reviewPanel = document.getElementById('playReviewPanel');
    var moveHistory = document.getElementById('playMoveHistory');
    if (reviewPanel) reviewPanel.hidden = true;
    if (moveHistory) moveHistory.hidden = false;
  }

  function startReviewAnalysis() {
    if (!playAnalysis || playGameMoves.length === 0) return;
    if (playAnalysis.start(getGameLog(), {
      updateWinRateUI: updateWinRateUI,
      onExit: function () {
        exitReviewMode();
        renderPlayBoard();
        if (playUndoBtn) playUndoBtn.disabled = false;
        if (playResignBtn) playResignBtn.disabled = playGameOver;
        if (playGameOver) showAnalyzeButton();
      }
    })) {
      hideAnalyzeButton();
      if (playUndoBtn) playUndoBtn.disabled = true;
      if (playResignBtn) playResignBtn.disabled = true;
    }
  }

  function setPlayStatus(text, type) {
    if (!playStatus) return;
    playStatus.textContent = text;
    playStatus.className = 'play-status' + (type ? ' ' + type : '');
  }

  function updateSoundToggleUI() {
    if (!playSoundToggle || !sound) return;
    var on = sound.isEnabled();
    playSoundToggle.textContent = on ? '音效开' : '音效关';
    playSoundToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    playSoundToggle.setAttribute('aria-label', on ? '音效已开启' : '音效已关闭');
  }

  function initSoundToggle() {
    if (!playSoundToggle || !sound) return;
    updateSoundToggleUI();
    playSoundToggle.addEventListener('click', function () {
      sound.ensureContext();
      sound.setEnabled(!sound.isEnabled());
      updateSoundToggleUI();
      if (sound.isEnabled()) sound.playSelect();
    });
  }

  function playMoveSound(captured) {
    if (!sound) return;
    sound.ensureContext();
    if (captured) {
      sound.playCapture();
    } else {
      sound.playMove();
    }
    var endStatus = engine.isGameOver(playPieces, playTurn);
    if (!endStatus.over && engine.isInCheck(playPieces, playTurn)) {
      window.setTimeout(function () {
        if (sound.isEnabled()) sound.playCheck();
      }, 90);
    }
  }

  function playGameEndSound(winner) {
    if (!sound) return;
    sound.ensureContext();
    if (winner === 'red') {
      sound.playWin();
    } else if (winner === 'black') {
      sound.playLose();
    } else {
      sound.playDraw();
    }
  }

  function initWorker() {
    if (playWorker) return;
    try {
      playWorker = new Worker('js/ai-worker.js?v=3');
      playWorker.onmessage = onWorkerMessage;
      playWorker.onerror = onWorkerError;
    } catch (err) {
      playWorker = null;
    }
  }

  function onWorkerError() {
    runAiMoveSync();
  }

  function onWorkerMessage(e) {
    var data = e.data || {};
    if (data.action === 'eval') {
      updateWinRateUI(data.winRate, data.label);
      return;
    }

    if (data.action === 'move') {
      if (data.requestId !== playMoveRequestId) return;

      playAiThinking = false;
      if (playGameOver || playTurn !== 'black') return;

      if (data.move) {
        applyPlayMove(data.move, 'black');
        updateWinRateUI(data.winRate, data.label);
      } else {
        checkGameEnd();
      }

      if (!playGameOver) {
        setPlayStatus(getTurnStatusText(), isInCheckNow('red') ? 'check' : '');
      }
      renderPlayBoard();
    }
  }

  function getDifficultyConfig() {
    return DIFFICULTY_CONFIG[getDifficulty()] || DIFFICULTY_CONFIG.medium;
  }

  function runAiMoveSync() {
    var cfg = getDifficultyConfig();
    var result = engine.findBestMoveTimed(playPieces, 'black', cfg.maxDepth, cfg.timeLimitMs);
    playAiThinking = false;
    if (playGameOver || playTurn !== 'black') return;

    if (result.move) {
      applyPlayMove(result.move, 'black');
      updateWinRateFromScore(result.score);
    } else {
      checkGameEnd();
    }

    if (!playGameOver) {
      setPlayStatus(getTurnStatusText(), isInCheckNow('red') ? 'check' : '');
    }
    renderPlayBoard();
  }

  function postWorker(action, extra) {
    initWorker();
    if (!playWorker) {
      if (action === 'move') {
        runAiMoveSync();
      } else if (action === 'eval') {
        var score = engine.evaluate(playPieces);
        updateWinRateFromScore(score);
      }
      return;
    }

    playRequestId++;
    if (action === 'move') {
      playMoveRequestId = playRequestId;
    }
    var payload = {
      requestId: playRequestId,
      action: action,
      pieces: engine.clonePieces(playPieces)
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
    }
    playWorker.postMessage(payload);
  }

  function getDifficulty() {
    if (!playDifficulty) return 'medium';
    return playDifficulty.value || 'medium';
  }

  function requestAiMove() {
    if (playGameOver) return;

    postWorker('eval');
    playTurn = 'black';
    playAiThinking = true;
    setPlayStatus(getTurnStatusText(), 'thinking');
    var aiCfg = getDifficultyConfig();
    postWorker('move', {
      maxDepth: aiCfg.maxDepth,
      timeLimitMs: aiCfg.timeLimitMs
    });
  }

  function getTurnStatusText() {
    if (playGameOver) return playStatus.textContent;
    if (playAiThinking) return '电脑思考中…';
    if (playTurn === 'red') {
      return isInCheckNow('red') ? '红方走棋 — 你被将军了！' : '红方走棋 — 点击棋子选中，再点击目标位置';
    }
    return '黑方走棋';
  }

  function isInCheckNow(color) {
    return engine.isInCheck(playPieces, color);
  }

  function updateWinRateFromScore(score) {
    updateWinRateUI(engine.scoreToWinRate(score), engine.getAdvantageLabel(score));
  }

  function updateWinRateUI(winRate, label) {
    if (!winRate) return;
    if (playWinRateRed) playWinRateRed.textContent = winRate.red + '%';
    if (playWinRateBlack) playWinRateBlack.textContent = winRate.black + '%';
    if (playWinRateRedBar) playWinRateRedBar.style.width = winRate.red + '%';
    if (playWinRateBlackBar) playWinRateBlackBar.style.width = winRate.black + '%';
    if (playWinRateLabel) playWinRateLabel.textContent = label || '均势';
  }

  function resetWinRate() {
    updateWinRateUI({ red: 50, black: 50 }, '均势');
  }

  function renderPlayBoard() {
    var markers = playLegalTargets.map(function (m) {
      return { col: m.toCol, row: m.toRow, type: m.captured ? 'target' : 'move' };
    });

    boardApi.renderBoard(playBoard, playPieces, markers, {
      interactive: !playGameOver && !playAiThinking && playTurn === 'red',
      selected: playSelected,
      lastMove: playLastMove,
      onCellClick: onPlayCellClick
    });
  }

  function onPlayCellClick(col, row) {
    if (playGameOver || playAiThinking || playTurn !== 'red') return;
    if (sound) sound.ensureContext();

    var piece = engine.findPieceAt(playPieces, col, row);

    if (playSelected) {
      if (playSelected.col === col && playSelected.row === row) {
        playSelected = null;
        playLegalTargets = [];
        renderPlayBoard();
        return;
      }

      var chosen = null;
      for (var i = 0; i < playLegalTargets.length; i++) {
        if (playLegalTargets[i].toCol === col && playLegalTargets[i].toRow === row) {
          chosen = playLegalTargets[i];
          break;
        }
      }

      if (chosen) {
        applyPlayMove(chosen, 'red');
        playSelected = null;
        playLegalTargets = [];
        renderPlayBoard();

        if (playGameOver) return;

        requestAiMove();
        return;
      }
    }

    if (piece && piece.color === 'red') {
      playSelected = piece;
      playLegalTargets = engine.getLegalMovesForPiece(playPieces, piece);
      if (sound) sound.playSelect();
      renderPlayBoard();
      return;
    }

    playSelected = null;
    playLegalTargets = [];
    renderPlayBoard();
  }

  function applyPlayMove(move, color) {
    var piecesBefore = playPieces;
    var result = engine.makeMove(playPieces, move);
    if (!result) return;

    playHistory.push({
      pieces: engine.clonePieces(piecesBefore),
      turn: playTurn,
      lastMove: playLastMove
    });

    playPieces = result.pieces;
    playLastMove = {
      fromCol: move.fromCol,
      fromRow: move.fromRow,
      toCol: move.toCol,
      toRow: move.toRow
    };
    playTurn = color === 'red' ? 'black' : 'red';
    var notation = formatMoveRecord(move, color, result.captured, piecesBefore);
    playMoveRecords.push(notation);
    playGameMoves.push({
      color: color,
      fromCol: move.fromCol,
      fromRow: move.fromRow,
      toCol: move.toCol,
      toRow: move.toRow,
      captured: result.captured ? {
        type: result.captured.type,
        color: result.captured.color
      } : null,
      notation: notation
    });
    renderMoveList();
    playMoveSound(result.captured);
    checkGameEnd();
  }

  function formatMoveRecord(move, color, captured, piecesBefore) {
    var colNames = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
    var piece = engine.findPieceAt(piecesBefore, move.fromCol, move.fromRow);
    var pieceName = piece ? boardApi.PIECE_CHARS[piece.type][color] : '';
    var fromColName = colNames[move.fromCol];
    var toColName = colNames[move.toCol];
    var action = move.toCol === move.fromCol
      ? (color === 'red' ? (move.toRow < move.fromRow ? '进' : '退') : (move.toRow > move.fromRow ? '进' : '退'))
      : (move.toCol > move.fromCol ? '平' : '平');
    var dist = move.toCol === move.fromCol
      ? Math.abs(move.toRow - move.fromRow)
      : toColName;
    var side = color === 'red' ? '红' : '黑';
    var cap = captured ? ' 吃' + boardApi.PIECE_CHARS[captured.type][captured.color] : '';
    return side + pieceName + fromColName + action + dist + cap;
  }

  function renderMoveList() {
    if (!playMoveList) return;
    playMoveList.innerHTML = '';
    var start = Math.max(0, playMoveRecords.length - 10);
    for (var i = start; i < playMoveRecords.length; i++) {
      var item = document.createElement('div');
      item.className = 'play-move-item';
      item.textContent = (i + 1) + '. ' + playMoveRecords[i];
      playMoveList.appendChild(item);
    }
  }

  function checkGameEnd() {
    var status = engine.isGameOver(playPieces, playTurn);
    if (!status.over) return;

    playGameOver = true;
    playSelected = null;
    playLegalTargets = [];

    if (status.winner === 'red') {
      playGameResult = { winner: 'red', reason: status.reason || '将死' };
      if (status.reason === '困毙') {
        setPlayStatus('黑方困毙，红方获胜！', 'success');
      } else {
        setPlayStatus('恭喜！你将死电脑，红方获胜！', 'success');
      }
      updateWinRateUI({ red: 100, black: 0 }, '红方胜');
      playGameEndSound('red');
    } else if (status.winner === 'black') {
      playGameResult = { winner: 'black', reason: status.reason || '将死' };
      if (status.reason === '困毙') {
        setPlayStatus('红方困毙，黑方获胜。再试一局吧！', 'fail');
      } else {
        setPlayStatus('电脑将死你，黑方获胜。再试一局吧！', 'fail');
      }
      updateWinRateUI({ red: 0, black: 100 }, '黑方胜');
      playGameEndSound('black');
    } else {
      playGameResult = { winner: null, reason: status.reason || '和棋' };
      setPlayStatus('和棋。', 'success');
      updateWinRateUI({ red: 50, black: 50 }, '和棋');
      playGameEndSound(null);
    }
    showAnalyzeButton();
    renderPlayBoard();
  }

  function startNewGame() {
    exitReviewMode();
    hideAnalyzeButton();
    playPieces = engine.clonePieces(boardApi.STARTING_POSITION);
    playTurn = 'red';
    playSelected = null;
    playLegalTargets = [];
    playLastMove = null;
    playHistory = [];
    playMoveRecords = [];
    playGameMoves = [];
    playGameResult = null;
    playGameOver = false;
    playAiThinking = false;
    resetWinRate();
    setPlayStatus(getTurnStatusText(), '');
    if (playUndoBtn) playUndoBtn.disabled = false;
    if (playResignBtn) playResignBtn.disabled = false;
    renderMoveList();
    renderPlayBoard();
  }

  function undoMove() {
    if (playHistory.length === 0 || (playAnalysis && playAnalysis.isActive())) return;

    playAiThinking = false;
    playMoveRequestId++;

    // 人机对弈：悔棋回到红方行棋
    // - 当前轮到红方（刚走完一整回合）→ 撤 2 步（黑应 + 红走）
    // - 当前轮到黑方（红刚走、AI 未应）→ 撤 1 步（仅红走）
    var steps = playTurn === 'red' ? 2 : 1;
    if (playHistory.length < steps) steps = playHistory.length;

    for (var i = 0; i < steps; i++) {
      if (playHistory.length === 0) break;
      var prev = playHistory.pop();
      playPieces = prev.pieces;
      playTurn = prev.turn;
      playLastMove = prev.lastMove;
      if (playMoveRecords.length) playMoveRecords.pop();
      if (playGameMoves.length) playGameMoves.pop();
    }

    playGameOver = false;
    playGameResult = null;
    hideAnalyzeButton();
    playSelected = null;
    playLegalTargets = [];
    setPlayStatus(getTurnStatusText(), isInCheckNow('red') ? 'check' : '');
    renderMoveList();
    renderPlayBoard();
    postWorker('eval');
  }

  function resignGame() {
    if (playGameOver || (playAnalysis && playAnalysis.isActive())) return;
    playGameOver = true;
    playGameResult = { winner: 'black', reason: '认输' };
    playSelected = null;
    playLegalTargets = [];
    setPlayStatus('你认输了，黑方获胜。', 'fail');
    updateWinRateUI({ red: 0, black: 100 }, '黑方胜');
    playGameEndSound('black');
    showAnalyzeButton();
    renderPlayBoard();
  }

  if (playNewBtn) playNewBtn.addEventListener('click', startNewGame);
  if (playUndoBtn) playUndoBtn.addEventListener('click', undoMove);
  if (playResignBtn) playResignBtn.addEventListener('click', resignGame);
  if (playAnalyzeBtn) playAnalyzeBtn.addEventListener('click', startReviewAnalysis);
  if (playDifficulty) {
    playDifficulty.addEventListener('change', function () {
      if (!playGameOver && playTurn === 'red') {
        setPlayStatus(getTurnStatusText(), isInCheckNow('red') ? 'check' : '');
      }
    });
  }

  initSoundToggle();
  startNewGame();
})();
