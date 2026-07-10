(function (global) {
  'use strict';

  if (!global.XQBoard || !global.XQEngine) return;

  var boardApi = global.XQBoard;
  var engine = global.XQEngine;

  var ANALYSIS_DEPTH = 3;
  var ANALYSIS_TIME_MS = 800;

  var QUALITY_LABELS = {
    good: '好棋',
    inaccuracy: '欠佳',
    blunder: '失误'
  };

  var active = false;
  var gameLog = null;
  var analysisResults = null;
  var reviewStep = 0;
  var analyzeWorker = null;
  var analyzeRequestId = 0;
  var callbacks = null;

  var playBoard = null;
  var panel = null;
  var progressWrap = null;
  var progressBar = null;
  var progressText = null;
  var reviewBody = null;
  var summaryEl = null;
  var stepInfoEl = null;
  var moveListEl = null;

  function getEl(id) {
    return document.getElementById(id);
  }

  function formatMoveNotation(move, color, captured, piecesBefore) {
    var colNames = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
    var piece = engine.findPieceAt(piecesBefore, move.fromCol, move.fromRow);
    var pieceName = piece ? boardApi.PIECE_CHARS[piece.type][color] : '';
    var fromColName = colNames[move.fromCol];
    var toColName = colNames[move.toCol];
    var action = move.toCol === move.fromCol
      ? (color === 'red' ? (move.toRow < move.fromRow ? '进' : '退') : (move.toRow > move.fromRow ? '进' : '退'))
      : '平';
    var dist = move.toCol === move.fromCol
      ? Math.abs(move.toRow - move.fromRow)
      : toColName;
    var side = color === 'red' ? '红' : '黑';
    var cap = captured ? ' 吃' + boardApi.PIECE_CHARS[captured.type][captured.color] : '';
    return side + pieceName + fromColName + action + dist + cap;
  }

  function rebuildPosition(step) {
    if (!gameLog) return { pieces: [], lastMove: null };
    var pieces = engine.clonePieces(gameLog.startPieces);
    var lastMove = null;
    for (var i = 0; i < step; i++) {
      var m = gameLog.moves[i];
      var result = engine.makeMove(pieces, m);
      if (!result) break;
      pieces = result.pieces;
      lastMove = {
        fromCol: m.fromCol,
        fromRow: m.fromRow,
        toCol: m.toCol,
        toRow: m.toRow
      };
    }
    return { pieces: pieces, lastMove: lastMove };
  }

  function getStepEval(step) {
    if (!analysisResults || analysisResults.length === 0) return null;
    if (step === 0) return analysisResults[0];
    var entry = analysisResults[step];
    if (!entry) return null;
    return {
      score: entry.scoreAfter,
      winRate: entry.winRateAfter,
      label: entry.labelAfter
    };
  }

  function getMoveAnalysis(moveIndex) {
    if (!analysisResults) return null;
    return analysisResults[moveIndex + 1] || null;
  }

  function countRedQuality() {
    var counts = { good: 0, inaccuracy: 0, blunder: 0 };
    if (!analysisResults) return counts;
    for (var i = 1; i < analysisResults.length; i++) {
      var entry = analysisResults[i];
      if (entry.color === 'red' && entry.quality) {
        counts[entry.quality]++;
      }
    }
    return counts;
  }

  function updateWinRate(winRate, label) {
    if (callbacks && callbacks.updateWinRateUI) {
      callbacks.updateWinRateUI(winRate, label);
    }
  }

  function renderBoardAtStep() {
    if (!playBoard || !gameLog) return;
    var state = rebuildPosition(reviewStep);
    boardApi.renderBoard(playBoard, state.pieces, null, {
      interactive: false,
      lastMove: state.lastMove
    });

    var evalData = getStepEval(reviewStep);
    if (evalData && evalData.winRate) {
      updateWinRate(evalData.winRate, evalData.label);
    }
  }

  function renderSummary() {
    if (!summaryEl) return;
    var counts = countRedQuality();
    summaryEl.innerHTML =
      '红方着法：<span class="review-tag-good">' + counts.good + ' 好棋</span> · ' +
      '<span class="review-tag-inaccuracy">' + counts.inaccuracy + ' 欠佳</span> · ' +
      '<span class="review-tag-blunder">' + counts.blunder + ' 失误</span>';
  }

  function renderStepInfo() {
    if (!stepInfoEl) return;
    if (reviewStep === 0) {
      stepInfoEl.innerHTML = '<strong>开局</strong><p>点击「下一步」查看第一手棋。</p>';
      return;
    }

    var move = gameLog.moves[reviewStep - 1];
    var analysis = getMoveAnalysis(reviewStep - 1);
    var html = '<strong>第 ' + reviewStep + ' 手</strong> · ' +
      (move.color === 'red' ? '红方' : '黑方') + ' ' + move.notation;

    if (analysis && analysis.scoreBefore != null) {
      html += '<p class="review-eval">走棋前评估：' + analysis.labelBefore +
        '（红方 ' + analysis.winRateBefore.red + '%）</p>';
    }

    if (move.color === 'red' && analysis && analysis.quality) {
      html += '<p class="review-quality"><span class="review-tag-' + analysis.quality + '">' +
        QUALITY_LABELS[analysis.quality] + '</span>';
      if (analysis.loss > 0) {
        html += ' · 较推荐着法评估差 ' + Math.round(analysis.loss) + ' 分';
      }
      html += '</p>';
      if (analysis.bestMove) {
        var piecesBefore = rebuildPosition(reviewStep - 1).pieces;
        var bestNotation = formatMoveNotation(analysis.bestMove, 'red', null, piecesBefore);
        html += '<p class="review-best">推荐：' + bestNotation + '</p>';
      }
    }

    stepInfoEl.innerHTML = html;
  }

  function renderMoveList() {
    if (!moveListEl || !gameLog) return;
    moveListEl.innerHTML = '';
    var moveNum = 1;
    gameLog.moves.forEach(function (m, i) {
      var li = document.createElement('li');
      var prefix = m.color === 'red' ? moveNum + '. ' : '';
      if (m.color === 'black') moveNum++;

      var analysis = getMoveAnalysis(i);
      var tagHtml = '';
      if (m.color === 'red' && analysis && analysis.quality) {
        tagHtml = ' <span class="review-tag-' + analysis.quality + '">' +
          QUALITY_LABELS[analysis.quality] + '</span>';
      }

      li.className = (m.color === 'red' ? 'red-move' : 'black-move') +
        (i + 1 === reviewStep ? ' active' : '');
      li.innerHTML = '<span class="move-num">' + prefix + '</span>' + m.notation + tagHtml;
      li.addEventListener('click', function () {
        goToStep(i + 1);
      });
      moveListEl.appendChild(li);
    });
  }

  function renderReviewUI() {
    renderBoardAtStep();
    renderSummary();
    renderStepInfo();
    renderMoveList();
  }

  function goToStep(step) {
    if (!gameLog) return;
    reviewStep = Math.max(0, Math.min(step, gameLog.moves.length));
    renderReviewUI();
  }

  function setProgress(current, total) {
    if (!progressBar || !progressText) return;
    var pct = total > 0 ? Math.round((current / total) * 100) : 0;
    progressBar.style.width = pct + '%';
    progressText.textContent = '正在分析红方着法… ' + current + ' / ' + total;
  }

  function showProgress(show) {
    if (progressWrap) progressWrap.hidden = !show;
    if (reviewBody) reviewBody.hidden = show;
  }

  function runAnalyzeSync() {
    var startPieces = gameLog.startPieces;
    var moves = gameLog.moves;
    var results = [];
    var redTotal = 0;
    var redDone = 0;

    for (var r = 0; r < moves.length; r++) {
      if (moves[r].color === 'red') redTotal++;
    }

    var startScore = engine.evaluate(startPieces);
    results.push({
      type: 'start',
      score: startScore,
      winRate: engine.scoreToWinRate(startScore),
      label: engine.getAdvantageLabel(startScore)
    });

    for (var i = 0; i < moves.length; i++) {
      var move = moves[i];
      var state = rebuildPosition(i);
      var piecesBefore = state.pieces;
      var scoreBefore = engine.evaluate(piecesBefore);
      var entry = {
        index: i,
        color: move.color,
        notation: move.notation,
        scoreBefore: scoreBefore,
        winRateBefore: engine.scoreToWinRate(scoreBefore),
        labelBefore: engine.getAdvantageLabel(scoreBefore)
      };

      if (move.color === 'red') {
        var best = engine.findBestMoveTimed(piecesBefore, 'red', ANALYSIS_DEPTH, ANALYSIS_TIME_MS);
        var playedResult = engine.makeMove(engine.clonePieces(piecesBefore), move);
        var scoreAfterPlayed = playedResult ? engine.evaluate(playedResult.pieces) : scoreBefore;
        var scoreAfterBest = scoreAfterPlayed;

        if (best.move) {
          var bestResult = engine.makeMove(engine.clonePieces(piecesBefore), best.move);
          scoreAfterBest = bestResult ? engine.evaluate(bestResult.pieces) : scoreAfterPlayed;
          entry.bestMove = best.move;
        }

        var loss = scoreAfterBest - scoreAfterPlayed;
        entry.scoreAfter = scoreAfterPlayed;
        entry.winRateAfter = engine.scoreToWinRate(scoreAfterPlayed);
        entry.labelAfter = engine.getAdvantageLabel(scoreAfterPlayed);
        entry.loss = loss;
        entry.quality = loss <= 80 ? 'good' : (loss <= 200 ? 'inaccuracy' : 'blunder');

        redDone++;
        setProgress(redDone, redTotal);
      } else {
        var blackResult = engine.makeMove(engine.clonePieces(piecesBefore), move);
        entry.scoreAfter = blackResult ? engine.evaluate(blackResult.pieces) : scoreBefore;
        entry.winRateAfter = engine.scoreToWinRate(entry.scoreAfter);
        entry.labelAfter = engine.getAdvantageLabel(entry.scoreAfter);
      }

      results.push(entry);
    }

    onAnalyzeComplete(results);
  }

  function onAnalyzeComplete(results) {
    analysisResults = results;
    showProgress(false);
    reviewStep = gameLog.moves.length;
    renderReviewUI();
  }

  function initAnalyzeWorker() {
    if (analyzeWorker) return;
    try {
      analyzeWorker = new Worker('js/ai-worker.js?v=3');
      analyzeWorker.onmessage = function (e) {
        var data = e.data || {};
        if (data.requestId !== analyzeRequestId) return;

        if (data.action === 'analyzeProgress') {
          setProgress(data.current, data.total);
          return;
        }

        if (data.action === 'analyze') {
          onAnalyzeComplete(data.results);
        }
      };
      analyzeWorker.onerror = function () {
        runAnalyzeSync();
      };
    } catch (err) {
      analyzeWorker = null;
    }
  }

  function startAnalysis(log, cbs) {
    if (active || !log || !log.moves || log.moves.length === 0) return false;

    gameLog = log;
    callbacks = cbs || {};
    analysisResults = null;
    reviewStep = 0;
    active = true;

    playBoard = getEl('playBoard');
    panel = getEl('playReviewPanel');
    progressWrap = getEl('playReviewProgressWrap');
    progressBar = getEl('playReviewProgress');
    progressText = getEl('playReviewProgressText');
    reviewBody = getEl('playReviewBody');
    summaryEl = getEl('playReviewSummary');
    stepInfoEl = getEl('playReviewStepInfo');
    moveListEl = getEl('playReviewMoveList');

    var moveHistory = getEl('playMoveHistory');
    if (moveHistory) moveHistory.hidden = true;
    if (panel) panel.hidden = false;

    showProgress(true);
    setProgress(0, log.moves.filter(function (m) { return m.color === 'red'; }).length);

    initAnalyzeWorker();
    analyzeRequestId++;

    if (analyzeWorker) {
      analyzeWorker.postMessage({
        requestId: analyzeRequestId,
        action: 'analyze',
        startPieces: engine.clonePieces(log.startPieces),
        moves: log.moves,
        maxDepth: ANALYSIS_DEPTH,
        timeLimitMs: ANALYSIS_TIME_MS
      });
    } else {
      window.setTimeout(runAnalyzeSync, 30);
    }

    return true;
  }

  function exitAnalysis() {
    active = false;
    gameLog = null;
    analysisResults = null;
    reviewStep = 0;
    callbacks = null;

    var moveHistory = getEl('playMoveHistory');
    if (moveHistory) moveHistory.hidden = false;
    if (panel) panel.hidden = true;
    showProgress(true);
  }

  function bindControls() {
    var firstBtn = getEl('playReviewFirst');
    var prevBtn = getEl('playReviewPrev');
    var nextBtn = getEl('playReviewNext');
    var lastBtn = getEl('playReviewLast');
    var exitBtn = getEl('playReviewExitBtn');

    if (firstBtn) firstBtn.addEventListener('click', function () { goToStep(0); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goToStep(reviewStep - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goToStep(reviewStep + 1); });
    if (lastBtn) lastBtn.addEventListener('click', function () {
      if (gameLog) goToStep(gameLog.moves.length);
    });
    if (exitBtn) exitBtn.addEventListener('click', function () {
      if (callbacks && callbacks.onExit) callbacks.onExit();
    });
  }

  bindControls();

  global.XQPlayAnalysis = {
    start: startAnalysis,
    exit: exitAnalysis,
    isActive: function () { return active; },
    goToStep: goToStep
  };
})(window);
