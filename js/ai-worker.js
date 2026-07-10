importScripts('engine.js');

function rebuildPosition(startPieces, moves, upToIndex) {
  var pieces = XQEngine.clonePieces(startPieces);
  for (var i = 0; i < upToIndex; i++) {
    var result = XQEngine.makeMove(pieces, moves[i]);
    if (!result) break;
    pieces = result.pieces;
  }
  return pieces;
}

function classifyRedMove(loss) {
  if (loss <= 80) return 'good';
  if (loss <= 200) return 'inaccuracy';
  return 'blunder';
}

function analyzeGame(startPieces, moves, maxDepth, timeLimitMs, requestId) {
  var results = [];
  var redTotal = 0;
  var redDone = 0;

  for (var r = 0; r < moves.length; r++) {
    if (moves[r].color === 'red') redTotal++;
  }

  var startScore = XQEngine.evaluate(startPieces);
  results.push({
    type: 'start',
    score: startScore,
    winRate: XQEngine.scoreToWinRate(startScore),
    label: XQEngine.getAdvantageLabel(startScore)
  });

  for (var i = 0; i < moves.length; i++) {
    var move = moves[i];
    var piecesBefore = rebuildPosition(startPieces, moves, i);
    var scoreBefore = XQEngine.evaluate(piecesBefore);
    var entry = {
      index: i,
      color: move.color,
      notation: move.notation,
      scoreBefore: scoreBefore,
      winRateBefore: XQEngine.scoreToWinRate(scoreBefore),
      labelBefore: XQEngine.getAdvantageLabel(scoreBefore)
    };

    if (move.color === 'red') {
      var best = XQEngine.findBestMoveTimed(piecesBefore, 'red', maxDepth, timeLimitMs);
      var playedResult = XQEngine.makeMove(XQEngine.clonePieces(piecesBefore), move);
      var scoreAfterPlayed = playedResult ? XQEngine.evaluate(playedResult.pieces) : scoreBefore;
      var scoreAfterBest = scoreAfterPlayed;

      if (best.move) {
        var bestResult = XQEngine.makeMove(XQEngine.clonePieces(piecesBefore), best.move);
        scoreAfterBest = bestResult ? XQEngine.evaluate(bestResult.pieces) : scoreAfterPlayed;
        entry.bestMove = {
          fromCol: best.move.fromCol,
          fromRow: best.move.fromRow,
          toCol: best.move.toCol,
          toRow: best.move.toRow
        };
      }

      var loss = scoreAfterBest - scoreAfterPlayed;
      entry.scoreAfter = scoreAfterPlayed;
      entry.winRateAfter = XQEngine.scoreToWinRate(scoreAfterPlayed);
      entry.labelAfter = XQEngine.getAdvantageLabel(scoreAfterPlayed);
      entry.loss = loss;
      entry.quality = classifyRedMove(loss);

      redDone++;
      self.postMessage({
        requestId: requestId,
        action: 'analyzeProgress',
        current: redDone,
        total: redTotal
      });
    } else {
      var blackResult = XQEngine.makeMove(XQEngine.clonePieces(piecesBefore), move);
      entry.scoreAfter = blackResult ? XQEngine.evaluate(blackResult.pieces) : scoreBefore;
      entry.winRateAfter = XQEngine.scoreToWinRate(entry.scoreAfter);
      entry.labelAfter = XQEngine.getAdvantageLabel(entry.scoreAfter);
    }

    results.push(entry);
  }

  return results;
}

self.onmessage = function (e) {
  var data = e.data || {};
  var pieces = data.pieces;
  var action = data.action || 'move';

  if (action === 'eval') {
    var score = XQEngine.evaluate(pieces);
    self.postMessage({
      requestId: data.requestId,
      action: 'eval',
      score: score,
      winRate: XQEngine.scoreToWinRate(score),
      label: XQEngine.getAdvantageLabel(score)
    });
    return;
  }

  if (action === 'analyze') {
    var analysisResults = analyzeGame(
      data.startPieces,
      data.moves || [],
      data.maxDepth || 3,
      data.timeLimitMs || 800,
      data.requestId
    );
    self.postMessage({
      requestId: data.requestId,
      action: 'analyze',
      results: analysisResults
    });
    return;
  }

  if (action === 'move') {
    var maxDepth = data.maxDepth || data.depth || 3;
    var timeLimitMs = data.timeLimitMs || 2500;
    var result = XQEngine.findBestMoveTimed(pieces, 'black', maxDepth, timeLimitMs);
    var move = result.move;
    self.postMessage({
      requestId: data.requestId,
      action: 'move',
      move: move ? {
        fromCol: move.fromCol,
        fromRow: move.fromRow,
        toCol: move.toCol,
        toRow: move.toRow
      } : null,
      score: result.score,
      winRate: XQEngine.scoreToWinRate(result.score),
      label: XQEngine.getAdvantageLabel(result.score)
    });
  }
};
