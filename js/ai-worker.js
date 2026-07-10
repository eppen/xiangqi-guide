importScripts('engine.js');

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
