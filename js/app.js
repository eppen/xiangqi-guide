(function () {
  'use strict';

  var PIECE_CHARS = {
    king: { red: '帅', black: '将' },
    advisor: { red: '仕', black: '士' },
    elephant: { red: '相', black: '象' },
    horse: { red: '马', black: '马' },
    rook: { red: '车', black: '车' },
    cannon: { red: '炮', black: '炮' },
    pawn: { red: '兵', black: '卒' }
  };

  var PIECE_INFO = {
    king: {
      title: '将 / 帅',
      desc: '只能在九宫内移动，每次走直线一步（横或竖）。将帅不能对面——同一纵线上无子相隔时，中间必须有棋子间隔。',
      tips: ['九宫内活动范围：3×3 格', '被将军时必须应将', '将帅对脸为违规（不可直接照面）']
    },
    advisor: {
      title: '士 / 仕',
      desc: '只能在九宫内沿斜线走一步（「士」字格）。作用主要是保护将帅，残局进攻价值有限。',
      tips: ['只能在九宫斜线移动', '每步一格，不能越子', '残局缺士易被车炮攻杀']
    },
    elephant: {
      title: '象 / 相',
      desc: '沿「田」字格斜走两格，不能过河。若「象眼」（田字中心）有子，则不能走，称「塞象眼」。',
      tips: ['不能越过楚河汉界', '塞象眼时无法移动', '双象齐全可构成坚固防线']
    },
    horse: {
      title: '马',
      desc: '走「日」字格：先直走一格再斜走一格。若马前进方向的相邻点（马脚）有子，则不能跳，称「蹩马腿」。',
      tips: ['八面威风，灵活多变', '马脚被蹩则无法跳跃', '中局跳马占「栏」位价值极高']
    },
    rook: {
      title: '车',
      desc: '沿直线任意步数移动，横竖均可。吃子、阻截、控线能力最强，是象棋第一子力。',
      tips: ['直线行走，不能越子（除吃子）', '占肋道、巡河威力巨大', '一车约等于双马或双炮']
    },
    cannon: {
      title: '炮',
      desc: '移动时与车相同。吃子时必须隔一个棋子（炮架）打到目标，炮架可以是己方或对方任意棋子。',
      tips: ['不吃子时与车走法相同', '吃子必须隔一子', '中局炮需找炮架才具威胁']
    },
    pawn: {
      title: '兵 / 卒',
      desc: '未过河前只能向前走一步。过河后可向前或左右走，但不能后退。过河兵价值大幅提升。',
      tips: ['过河前只能前进', '过河后可横走，仍不能后退', '逼近九宫的兵卒极具杀伤力']
    }
  };

  var TACTICS = {
    'mate-horse-cannon': {
      title: '马后炮',
      desc: '马在前面限制将帅活动，炮在后方将军，形成绝杀。马充当「炮架」的同时封锁将帅退路，是初学者必须掌握的第一杀法。',
      steps: [
        '马跳到能将军且限制将帅的位置',
        '炮在同一线路后方补一手将军',
        '将帅被马封住，无法躲避炮击'
      ],
      tip: '实战提示：中局时常以马换象士后形成马后炮，注意提前算清炮架位置。',
      pieces: [
        { type: 'king', color: 'black', col: 4, row: 0 },
        { type: 'advisor', color: 'black', col: 3, row: 0 },
        { type: 'advisor', color: 'black', col: 5, row: 0 },
        { type: 'horse', color: 'red', col: 4, row: 2, highlight: true },
        { type: 'cannon', color: 'red', col: 4, row: 7, highlight: true }
      ],
      markers: [{ col: 4, row: 1, type: 'target' }]
    },
    'mate-double-rook': {
      title: '双车错',
      desc: '双车交替在不同纵线将军，使将帅无法同时躲避。一车将军时，另一车控制将帅横向或纵向的逃生路线。',
      steps: [
        '双车分别占据不同纵线（或横线）',
        '一车将军，另一车封住将帅退路',
        '交替将军，将帅无法同时化解'
      ],
      tip: '实战提示：双车错需要配合将帅助攻，残局单缺士象时几乎无解。',
      pieces: [
        { type: 'king', color: 'black', col: 4, row: 0 },
        { type: 'advisor', color: 'black', col: 3, row: 0 },
        { type: 'rook', color: 'red', col: 0, row: 0, highlight: true },
        { type: 'rook', color: 'red', col: 8, row: 2, highlight: true },
        { type: 'king', color: 'red', col: 4, row: 9 }
      ],
      markers: [
        { col: 4, row: 0, type: 'target' },
        { col: 5, row: 0, type: 'move' },
        { col: 3, row: 0, type: 'move' }
      ]
    },
    'mate-double-cannon': {
      title: '重炮',
      desc: '双炮在同一条直线上重叠，前一炮为后一炮做炮架。后炮将军时，前一炮挡住将帅，形成绝杀。',
      steps: [
        '双炮调到同一纵线（或横线）',
        '前一炮作为炮架位于将帅前方',
        '后炮隔前炮将军，将帅被堵死'
      ],
      tip: '实战提示：重炮常配合车或马封锁将帅横向移动，注意算清炮架不会被吃掉。',
      pieces: [
        { type: 'king', color: 'black', col: 4, row: 0 },
        { type: 'advisor', color: 'black', col: 5, row: 0 },
        { type: 'cannon', color: 'red', col: 4, row: 2, highlight: true },
        { type: 'cannon', color: 'red', col: 4, row: 5, highlight: true }
      ],
      markers: [{ col: 4, row: 1, type: 'target' }]
    },
    'mate-iron-gate': {
      title: '铁门栓',
      desc: '用车直接堵住九宫内士的活动空间，配合其他子力将杀。将帅被困在九宫内，如被铁门封死。',
      steps: [
        '车占据士角或底线位置',
        '封锁士的斜线活动空间',
        '配合炮或兵完成绝杀'
      ],
      tip: '实战提示：对方缺士时铁门栓更易形成，车占肋道是关键一步。',
      pieces: [
        { type: 'king', color: 'black', col: 4, row: 0 },
        { type: 'advisor', color: 'black', col: 3, row: 0 },
        { type: 'rook', color: 'red', col: 0, row: 0, highlight: true },
        { type: 'pawn', color: 'red', col: 4, row: 2, highlight: true },
        { type: 'king', color: 'red', col: 4, row: 9 }
      ],
      markers: [
        { col: 3, row: 1, type: 'move' },
        { col: 5, row: 0, type: 'move' }
      ]
    },
    'mate-sleeve': {
      title: '闷宫',
      desc: '将帅被己方棋子（士、象、卒等）堵在九宫内，对方子力从外部将军，将帅无法移动也无法吃子，称「闷宫杀」。',
      steps: [
        '用子力堵住将帅所有出路',
        '对方炮或车从外部将军',
        '将帅被己方子力「闷」住，无法应将'
      ],
      tip: '实战提示：逼迫对方士象堵死将帅是形成闷宫的前提，炮打闷宫最为常见。',
      pieces: [
        { type: 'king', color: 'black', col: 4, row: 0 },
        { type: 'advisor', color: 'black', col: 3, row: 1 },
        { type: 'advisor', color: 'black', col: 5, row: 0 },
        { type: 'cannon', color: 'red', col: 1, row: 2, highlight: true }
      ],
      markers: [{ col: 4, row: 0, type: 'target' }]
    },
    'tactic-fork': {
      title: '捉双',
      desc: '一步棋同时威胁对方两个或以上的棋子，对方无法同时保住，必丢一子。马和车最擅长捉双。',
      steps: [
        '选择能同时攻击两子的位置',
        '走子形成双重威胁',
        '对方只能救一子，必丢另一子'
      ],
      tip: '实战提示：马捉车炮、车捉马炮最为常见。行棋时随时留意己方是否被捉双。',
      pieces: [
        { type: 'horse', color: 'red', col: 4, row: 4, highlight: true },
        { type: 'rook', color: 'black', col: 3, row: 0 },
        { type: 'cannon', color: 'black', col: 5, row: 0 },
        { type: 'king', color: 'black', col: 4, row: 0 },
        { type: 'king', color: 'red', col: 4, row: 9 }
      ],
      markers: [
        { col: 3, row: 2, type: 'target' },
        { col: 5, row: 2, type: 'target' }
      ]
    },
    'tactic-discovered': {
      title: '抽将',
      desc: '移动前方子力后，后方子力（通常是车或炮）露出将军线，对方必须应将，从而白白丢掉其他棋子。',
      steps: [
        '车或炮藏在己方棋子后方',
        '移动前方子力，露出将军线',
        '对方应将后，趁机吃掉其他子力'
      ],
      tip: '实战提示：抽将是最实用的战术之一。将军必应，对方无法兼顾防守。',
      pieces: [
        { type: 'king', color: 'black', col: 4, row: 0 },
        { type: 'pawn', color: 'red', col: 4, row: 3, highlight: true },
        { type: 'rook', color: 'red', col: 4, row: 7, highlight: true },
        { type: 'horse', color: 'black', col: 2, row: 4 },
        { type: 'king', color: 'red', col: 4, row: 9 }
      ],
      markers: [
        { col: 4, row: 0, type: 'target' },
        { col: 2, row: 4, type: 'move' }
      ]
    },
    'tactic-sacrifice': {
      title: '弃子攻杀',
      desc: '主动放弃子力（弃车、弃马、弃炮），换取将帅暴露或打开进攻通道，进而形成杀棋。讲究算路深远。',
      steps: [
        '算清弃子后能否形成杀势',
        '果断弃子，打开对方防线',
        '连续将军，完成绝杀'
      ],
      tip: '实战提示：弃子攻杀必须算清后续三步以上，否则只是送子。初学者可从弃兵、弃炮的小型攻杀练起。',
      pieces: [
        { type: 'king', color: 'black', col: 4, row: 0 },
        { type: 'advisor', color: 'black', col: 3, row: 0 },
        { type: 'advisor', color: 'black', col: 5, row: 0 },
        { type: 'rook', color: 'red', col: 4, row: 2, highlight: true },
        { type: 'horse', color: 'red', col: 2, row: 3, highlight: true },
        { type: 'king', color: 'red', col: 4, row: 9 }
      ],
      markers: [
        { col: 4, row: 0, type: 'target' },
        { col: 3, row: 1, type: 'move' }
      ]
    }
  };

  var PIECE_DEMOS = {
    king: {
      pieces: [
        { type: 'king', color: 'red', col: 4, row: 9, highlight: true },
        { type: 'advisor', color: 'red', col: 3, row: 8 },
        { type: 'advisor', color: 'red', col: 5, row: 8 }
      ],
      markers: [
        { col: 4, row: 8, type: 'move' },
        { col: 3, row: 9, type: 'move' },
        { col: 5, row: 9, type: 'move' }
      ]
    },
    advisor: {
      pieces: [
        { type: 'king', color: 'red', col: 4, row: 9 },
        { type: 'advisor', color: 'red', col: 3, row: 8, highlight: true }
      ],
      markers: [
        { col: 4, row: 9, type: 'move' },
        { col: 2, row: 7, type: 'move' }
      ]
    },
    elephant: {
      pieces: [
        { type: 'elephant', color: 'red', col: 2, row: 9, highlight: true },
        { type: 'pawn', color: 'black', col: 2, row: 7 }
      ],
      markers: [
        { col: 0, row: 7, type: 'move' },
        { col: 4, row: 7, type: 'move' }
      ]
    },
    horse: {
      pieces: [
        { type: 'horse', color: 'red', col: 4, row: 4, highlight: true },
        { type: 'pawn', color: 'black', col: 4, row: 3 }
      ],
      markers: [
        { col: 3, row: 2, type: 'move' },
        { col: 5, row: 2, type: 'move' },
        { col: 2, row: 4, type: 'move' },
        { col: 6, row: 4, type: 'move' },
        { col: 3, row: 6, type: 'move' },
        { col: 5, row: 6, type: 'move' }
      ]
    },
    rook: {
      pieces: [
        { type: 'rook', color: 'red', col: 0, row: 5, highlight: true },
        { type: 'pawn', color: 'black', col: 0, row: 3 }
      ],
      markers: [
        { col: 0, row: 4, type: 'move' },
        { col: 0, row: 6, type: 'move' },
        { col: 0, row: 7, type: 'move' },
        { col: 0, row: 8, type: 'move' },
        { col: 0, row: 9, type: 'move' },
        { col: 1, row: 5, type: 'move' },
        { col: 2, row: 5, type: 'move' }
      ]
    },
    cannon: {
      pieces: [
        { type: 'cannon', color: 'red', col: 4, row: 5, highlight: true },
        { type: 'pawn', color: 'black', col: 4, row: 3 },
        { type: 'horse', color: 'black', col: 4, row: 1 }
      ],
      markers: [
        { col: 4, row: 4, type: 'move' },
        { col: 4, row: 6, type: 'move' },
        { col: 4, row: 1, type: 'target' }
      ]
    },
    pawn: {
      pieces: [
        { type: 'pawn', color: 'red', col: 4, row: 6, highlight: true }
      ],
      markers: [
        { col: 4, row: 5, type: 'move' }
      ],
      pieces2: [
        { type: 'pawn', color: 'red', col: 4, row: 4, highlight: true }
      ],
      markers2: [
        { col: 4, row: 3, type: 'move' },
        { col: 3, row: 4, type: 'move' },
        { col: 5, row: 4, type: 'move' }
      ]
    }
  };

  var STARTING_POSITION = [
    { type: 'rook', color: 'black', col: 0, row: 0 },
    { type: 'horse', color: 'black', col: 1, row: 0 },
    { type: 'elephant', color: 'black', col: 2, row: 0 },
    { type: 'advisor', color: 'black', col: 3, row: 0 },
    { type: 'king', color: 'black', col: 4, row: 0 },
    { type: 'advisor', color: 'black', col: 5, row: 0 },
    { type: 'elephant', color: 'black', col: 6, row: 0 },
    { type: 'horse', color: 'black', col: 7, row: 0 },
    { type: 'rook', color: 'black', col: 8, row: 0 },
    { type: 'cannon', color: 'black', col: 1, row: 2 },
    { type: 'cannon', color: 'black', col: 7, row: 2 },
    { type: 'pawn', color: 'black', col: 0, row: 3 },
    { type: 'pawn', color: 'black', col: 2, row: 3 },
    { type: 'pawn', color: 'black', col: 4, row: 3 },
    { type: 'pawn', color: 'black', col: 6, row: 3 },
    { type: 'pawn', color: 'black', col: 8, row: 3 },
    { type: 'rook', color: 'red', col: 0, row: 9 },
    { type: 'horse', color: 'red', col: 1, row: 9 },
    { type: 'elephant', color: 'red', col: 2, row: 9 },
    { type: 'advisor', color: 'red', col: 3, row: 9 },
    { type: 'king', color: 'red', col: 4, row: 9 },
    { type: 'advisor', color: 'red', col: 5, row: 9 },
    { type: 'elephant', color: 'red', col: 6, row: 9 },
    { type: 'horse', color: 'red', col: 7, row: 9 },
    { type: 'rook', color: 'red', col: 8, row: 9 },
    { type: 'cannon', color: 'red', col: 1, row: 7 },
    { type: 'cannon', color: 'red', col: 7, row: 7 },
    { type: 'pawn', color: 'red', col: 0, row: 6 },
    { type: 'pawn', color: 'red', col: 2, row: 6 },
    { type: 'pawn', color: 'red', col: 4, row: 6 },
    { type: 'pawn', color: 'red', col: 6, row: 6 },
    { type: 'pawn', color: 'red', col: 8, row: 6 }
  ];

  // ===== Theme Toggle =====
  var THEME_KEY = 'xqguide-theme';
  var themeToggle = document.getElementById('themeToggle');

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function updateThemeToggleLabel() {
    if (!themeToggle) return;
    if (getTheme() === 'light') {
      themeToggle.setAttribute('aria-label', '切换暗色主题');
      themeToggle.title = '切换暗色主题';
    } else {
      themeToggle.setAttribute('aria-label', '切换亮色主题');
      themeToggle.title = '切换亮色主题';
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
    updateThemeToggleLabel();
  }

  if (themeToggle) {
    updateThemeToggleLabel();
    themeToggle.addEventListener('click', function () {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // ===== Mobile Navigation =====
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    });
  }

  // ===== Board Renderer =====
  function clonePieces(pieces) {
    return pieces.map(function (p) {
      var copy = {};
      Object.keys(p).forEach(function (k) { copy[k] = p[k]; });
      return copy;
    });
  }

  function findPieceAt(pieces, col, row) {
    return pieces.find(function (p) {
      return p.col === col && p.row === row;
    }) || null;
  }

  function applyMove(pieces, fromCol, fromRow, toCol, toRow) {
    var state = clonePieces(pieces);
    var piece = findPieceAt(state, fromCol, fromRow);
    if (!piece) return null;
    var captured = findPieceAt(state, toCol, toRow);
    piece.col = toCol;
    piece.row = toRow;
    if (captured) {
      state = state.filter(function (p) { return p !== captured; });
    }
    return { pieces: state, captured: captured, piece: piece };
  }

  function movesEqual(a, b) {
    return a.fromCol === b.fromCol && a.fromRow === b.fromRow &&
      a.toCol === b.toCol && a.toRow === b.toRow;
  }

  function renderBoard(container, pieces, markers, options) {
    options = options || {};
    if (!container) return;
    container.innerHTML = '';

    for (var row = 0; row < 10; row++) {
      for (var col = 0; col < 9; col++) {
        var cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.col = col;
        cell.dataset.row = row;

        if (row === 0) cell.classList.add('edge-top');
        if (row === 9) cell.classList.add('edge-bottom');
        if (col === 0) cell.classList.add('edge-left');
        if (col === 8) cell.classList.add('edge-right');
        if (row === 4) cell.classList.add('river-top');
        if (row === 5) cell.classList.add('river-bottom');

        if (options.lastMove) {
          var lm = options.lastMove;
          if (lm.fromCol === col && lm.fromRow === row) cell.classList.add('last-move-from');
          if (lm.toCol === col && lm.toRow === row) cell.classList.add('last-move-to');
        }

        if (options.selected && options.selected.col === col && options.selected.row === row) {
          cell.classList.add('selected');
        }

        if (options.interactive && options.onCellClick) {
          (function (c, r) {
            cell.addEventListener('click', function () {
              options.onCellClick(c, r);
            });
          })(col, row);
        }

        container.appendChild(cell);
      }
    }

    var chu = document.createElement('span');
    chu.className = 'river-text chu';
    chu.textContent = '楚 河';
    container.appendChild(chu);

    var han = document.createElement('span');
    han.className = 'river-text han';
    han.textContent = '汉 界';
    container.appendChild(han);

    addPalaceLines(container, 0);
    addPalaceLines(container, 7);

    if (markers) {
      markers.forEach(function (m) {
        var markerCell = container.querySelector('[data-col="' + m.col + '"][data-row="' + m.row + '"]');
        if (markerCell) {
          var dot = document.createElement('div');
          dot.className = 'cell-marker ' + m.type;
          markerCell.appendChild(dot);
        }
      });
    }

    if (pieces) {
      pieces.forEach(function (p) {
        var pieceCell = container.querySelector('[data-col="' + p.col + '"][data-row="' + p.row + '"]');
        if (pieceCell) {
          var pieceEl = document.createElement('div');
          pieceEl.className = 'piece ' + p.color;
          if (p.highlight) pieceEl.classList.add('highlight');
          if (p.id) pieceEl.dataset.id = p.id;
          pieceEl.textContent = PIECE_CHARS[p.type][p.color];
          pieceCell.appendChild(pieceEl);
        }
      });
    }
  }

  function addPalaceLines(container, startRow) {
    var centerCol = 4;
    var centerRow = startRow + 1;
    var cell = container.querySelector('[data-col="' + centerCol + '"][data-row="' + centerRow + '"]');
    if (!cell) return;

    var d1 = document.createElement('div');
    d1.className = 'palace-line diag-1';
    cell.appendChild(d1);

    var d2 = document.createElement('div');
    d2.className = 'palace-line diag-2';
    cell.appendChild(d2);
  }

  // ===== Hero Board =====
  renderBoard(document.getElementById('heroBoard'), STARTING_POSITION, null);

  // ===== Piece Demos =====
  var pieceCards = document.getElementById('pieceCards');
  var pieceInfo = document.getElementById('pieceInfo');
  var pieceBoard = document.getElementById('pieceBoard');
  var pawnDemoAlt = false;

  function showPieceDemo(pieceKey) {
    var demo = PIECE_DEMOS[pieceKey];
    var info = PIECE_INFO[pieceKey];
    if (!demo || !info) return;

    var pieces = demo.pieces;
    var markers = demo.markers;

    if (pieceKey === 'pawn' && pawnDemoAlt && demo.pieces2) {
      pieces = demo.pieces2;
      markers = demo.markers2;
    }

    renderBoard(pieceBoard, pieces, markers);

    pieceInfo.innerHTML =
      '<h3>' + info.title + '</h3>' +
      '<p>' + info.desc + '</p>' +
      '<ul class="piece-tips">' +
      info.tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') +
      '</ul>';

    if (pieceKey === 'pawn') {
      var note = document.createElement('p');
      note.style.cssText = 'margin-top:0.75rem;font-size:0.85rem;color:var(--gold);cursor:pointer;';
      note.textContent = pawnDemoAlt ? '← 点击查看未过河走法' : '→ 点击查看过河后走法';
      note.addEventListener('click', function () {
        pawnDemoAlt = !pawnDemoAlt;
        showPieceDemo('pawn');
      });
      pieceInfo.appendChild(note);
    } else {
      pawnDemoAlt = false;
    }
  }

  if (pieceCards) {
    pieceCards.querySelectorAll('.piece-card').forEach(function (card) {
      card.addEventListener('click', function () {
        pieceCards.querySelectorAll('.piece-card').forEach(function (c) {
          c.classList.remove('active');
        });
        card.classList.add('active');
        showPieceDemo(card.getAttribute('data-piece'));
      });
    });
    showPieceDemo('king');
  }

  // ===== Tactics =====
  var tacticList = document.getElementById('tacticList');
  var tacticBoard = document.getElementById('tacticBoard');
  var tacticTitle = document.getElementById('tacticTitle');
  var tacticDesc = document.getElementById('tacticDesc');
  var tacticSteps = document.getElementById('tacticSteps');
  var tacticTip = document.getElementById('tacticTip');

  function showTactic(tacticKey) {
    var tactic = TACTICS[tacticKey];
    if (!tactic) return;

    renderBoard(tacticBoard, tactic.pieces, tactic.markers);
    tacticTitle.textContent = tactic.title;
    tacticDesc.textContent = tactic.desc;
    tacticSteps.innerHTML = tactic.steps.map(function (s, i) {
      return '<div class="step-item"><span>' + ['①', '②', '③', '④'][i] + '</span>' + s + '</div>';
    }).join('');
    tacticTip.innerHTML = '<strong>' + tactic.tip.split('：')[0] + '：</strong>' + tactic.tip.split('：').slice(1).join('：');
  }

  if (tacticList) {
    tacticList.querySelectorAll('.tactic-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tacticList.querySelectorAll('.tactic-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        showTactic(btn.getAttribute('data-tactic'));
      });
    });
    showTactic('mate-horse-cannon');
  }

  // ===== Puzzles =====
  var PUZZLES = [
    {
      id: 'pz1',
      title: '车五进一',
      category: '杀法',
      difficulty: '入门',
      mateIn: 1,
      desc: '红先胜。五路车已控中路，再进一步即可绝杀。',
      hint: '五路车从将帅正前方一步，直取黑将。',
      pieces: [
        { id: 'bk', type: 'king', color: 'black', col: 4, row: 0 },
        { id: 'ba1', type: 'advisor', color: 'black', col: 3, row: 0 },
        { id: 'ba2', type: 'advisor', color: 'black', col: 5, row: 0 },
        { id: 'rk', type: 'king', color: 'red', col: 4, row: 9 },
        { id: 'rr', type: 'rook', color: 'red', col: 4, row: 1 }
      ],
      solution: [
        { fromCol: 4, fromRow: 1, toCol: 4, toRow: 0 }
      ]
    },
    {
      id: 'pz2',
      title: '炮二平五',
      category: '杀法',
      difficulty: '入门',
      mateIn: 1,
      desc: '红先胜。底线炮隔士平中，一步轰将成杀。',
      hint: '二路炮平到五路，以黑士为炮架绝杀。',
      pieces: [
        { id: 'bk', type: 'king', color: 'black', col: 4, row: 0 },
        { id: 'ba1', type: 'advisor', color: 'black', col: 3, row: 0 },
        { id: 'ba2', type: 'advisor', color: 'black', col: 5, row: 0 },
        { id: 'rk', type: 'king', color: 'red', col: 4, row: 9 },
        { id: 'rc', type: 'cannon', color: 'red', col: 7, row: 0 }
      ],
      solution: [
        { fromCol: 7, fromRow: 0, toCol: 4, toRow: 0 }
      ]
    },
    {
      id: 'pz3',
      title: '炮五进二',
      category: '杀法',
      difficulty: '入门',
      mateIn: 1,
      desc: '红先胜。中炮以卒为架进击，一步轰将成杀。',
      hint: '炮在五路进两步，隔卒炮轰黑将。',
      pieces: [
        { id: 'bk', type: 'king', color: 'black', col: 4, row: 0 },
        { id: 'bp', type: 'pawn', color: 'black', col: 4, row: 1 },
        { id: 'rk', type: 'king', color: 'red', col: 4, row: 9 },
        { id: 'rc', type: 'cannon', color: 'red', col: 4, row: 2 }
      ],
      solution: [
        { fromCol: 4, fromRow: 2, toCol: 4, toRow: 0 }
      ]
    },
    {
      id: 'pz4',
      title: '兵五进一',
      category: '杀法',
      difficulty: '入门',
      mateIn: 1,
      desc: '红先胜。过河兵前进一步，直取黑将。',
      hint: '五路兵已贴近九宫，再进一步成杀。',
      pieces: [
        { id: 'bk', type: 'king', color: 'black', col: 4, row: 0 },
        { id: 'ba1', type: 'advisor', color: 'black', col: 3, row: 0 },
        { id: 'ba2', type: 'advisor', color: 'black', col: 5, row: 0 },
        { id: 'rk', type: 'king', color: 'red', col: 6, row: 9 },
        { id: 'rp', type: 'pawn', color: 'red', col: 4, row: 1 }
      ],
      solution: [
        { fromCol: 4, fromRow: 1, toCol: 4, toRow: 0 }
      ]
    },
    {
      id: 'pz5',
      title: '车兵联杀',
      category: '残局',
      difficulty: '进阶',
      mateIn: 2,
      desc: '红先胜。中路兵将军，黑卒封住将门侧翼，老将只能吃兵，再车从九路平中吃将。',
      hint: '第一步兵进一将军，黑将无路可躲只能吃兵；第二步车从九路平至五路吃将。',
      pieces: [
        { id: 'bk', type: 'king', color: 'black', col: 4, row: 0 },
        { id: 'ba1', type: 'advisor', color: 'black', col: 3, row: 0 },
        { id: 'ba2', type: 'advisor', color: 'black', col: 5, row: 0 },
        { id: 'bp1', type: 'pawn', color: 'black', col: 3, row: 2 },
        { id: 'bp2', type: 'pawn', color: 'black', col: 5, row: 2 },
        { id: 'rk', type: 'king', color: 'red', col: 4, row: 9 },
        { id: 'rp', type: 'pawn', color: 'red', col: 4, row: 2 },
        { id: 'rr', type: 'rook', color: 'red', col: 8, row: 1 }
      ],
      solution: [
        { fromCol: 4, fromRow: 2, toCol: 4, toRow: 1 },
        { fromCol: 4, fromRow: 0, toCol: 4, toRow: 1, auto: true, color: 'black' },
        { fromCol: 8, fromRow: 1, toCol: 4, toRow: 1 }
      ]
    },
    {
      id: 'pz6',
      title: '车从侧翼杀',
      category: '残局',
      difficulty: '进阶',
      mateIn: 2,
      desc: '红先胜。中路兵将军，黑卒封住将门侧翼，老将只能吃兵，再车从一路平中吃将。',
      hint: '第一步兵进一将军，黑将无路可躲只能吃兵；第二步车从一路平至五路吃将。',
      pieces: [
        { id: 'bk', type: 'king', color: 'black', col: 4, row: 0 },
        { id: 'ba1', type: 'advisor', color: 'black', col: 3, row: 0 },
        { id: 'ba2', type: 'advisor', color: 'black', col: 5, row: 0 },
        { id: 'bp1', type: 'pawn', color: 'black', col: 3, row: 2 },
        { id: 'bp2', type: 'pawn', color: 'black', col: 5, row: 2 },
        { id: 'rk', type: 'king', color: 'red', col: 4, row: 9 },
        { id: 'rp', type: 'pawn', color: 'red', col: 4, row: 2 },
        { id: 'rr', type: 'rook', color: 'red', col: 0, row: 1 }
      ],
      solution: [
        { fromCol: 4, fromRow: 2, toCol: 4, toRow: 1 },
        { fromCol: 4, fromRow: 0, toCol: 4, toRow: 1, auto: true, color: 'black' },
        { fromCol: 0, fromRow: 1, toCol: 4, toRow: 1 }
      ]
    }
  ];

  var puzzleBoard = document.getElementById('puzzleBoard');
  var puzzleList = document.getElementById('puzzleList');
  var puzzleTitle = document.getElementById('puzzleTitle');
  var puzzleDesc = document.getElementById('puzzleDesc');
  var puzzleDifficulty = document.getElementById('puzzleDifficulty');
  var puzzleMate = document.getElementById('puzzleMate');
  var puzzleStatus = document.getElementById('puzzleStatus');
  var puzzleProgressText = document.getElementById('puzzleProgressText');
  var puzzleProgressFill = document.getElementById('puzzleProgressFill');
  var puzzleHintBtn = document.getElementById('puzzleHint');
  var puzzleResetBtn = document.getElementById('puzzleReset');
  var puzzleNextBtn = document.getElementById('puzzleNext');

  var currentPuzzleIndex = 0;
  var puzzlePieces = [];
  var puzzleStep = 0;
  var puzzleSelected = null;
  var puzzleSolved = {};
  var puzzleLastMove = null;

  function setPuzzleStatus(text, type) {
    if (!puzzleStatus) return;
    puzzleStatus.textContent = text;
    puzzleStatus.className = 'puzzle-status' + (type ? ' ' + type : '');
  }

  function renderPuzzleBoard() {
    renderBoard(puzzleBoard, puzzlePieces, null, {
      interactive: true,
      selected: puzzleSelected,
      lastMove: puzzleLastMove,
      onCellClick: onPuzzleCellClick
    });
  }

  function loadPuzzle(index) {
    var puzzle = PUZZLES[index];
    if (!puzzle) return;
    currentPuzzleIndex = index;
    puzzlePieces = clonePieces(puzzle.pieces);
    puzzleStep = 0;
    puzzleSelected = null;
    puzzleLastMove = null;

    puzzleTitle.textContent = puzzle.title;
    puzzleDesc.textContent = puzzle.desc;
    if (puzzleDifficulty) {
      puzzleDifficulty.textContent = puzzle.category;
      puzzleDifficulty.className = 'puzzle-difficulty' +
        (puzzle.category === '残局' ? ' category-endgame' : ' category-tactics');
    }
    puzzleMate.textContent = puzzle.mateIn === 1 ? '一步杀' : '两步杀';
    puzzleProgressText.textContent = '第 ' + (index + 1) + ' / ' + PUZZLES.length + ' 题';
    puzzleProgressFill.style.width = ((index + 1) / PUZZLES.length * 100) + '%';

    if (puzzleList) {
      puzzleList.querySelectorAll('.puzzle-item-btn').forEach(function (btn, i) {
        btn.classList.toggle('active', i === index);
      });
    }

    setPuzzleStatus('红方走棋 — 点击棋子选中，再点击目标位置');
    renderPuzzleBoard();
  }

  function onPuzzleCellClick(col, row) {
    var puzzle = PUZZLES[currentPuzzleIndex];
    var piece = findPieceAt(puzzlePieces, col, row);

    if (puzzleSelected) {
      if (puzzleSelected.col === col && puzzleSelected.row === row) {
        puzzleSelected = null;
        renderPuzzleBoard();
        return;
      }

      var expected = puzzle.solution[puzzleStep];
      if (!expected || expected.auto) return;

      var move = {
        fromCol: puzzleSelected.col,
        fromRow: puzzleSelected.row,
        toCol: col,
        toRow: row
      };

      if (movesEqual(move, expected)) {
        var result = applyMove(puzzlePieces, move.fromCol, move.fromRow, move.toCol, move.toRow);
        puzzlePieces = result.pieces;
        puzzleLastMove = move;
        puzzleSelected = null;
        puzzleStep++;

        if (puzzleStep >= puzzle.solution.length) {
          puzzleSolved[puzzle.id] = true;
          if (puzzleList) {
            var activeBtn = puzzleList.querySelector('.puzzle-item-btn.active');
            if (activeBtn) activeBtn.classList.add('solved');
          }
          setPuzzleStatus('恭喜！绝杀成功，正是「' + puzzle.title + '」！', 'success');
          renderPuzzleBoard();
          return;
        }

        var next = puzzle.solution[puzzleStep];
        if (next && next.auto) {
          setPuzzleStatus('黑方应手…', '');
          renderPuzzleBoard();
          setTimeout(function () {
            var autoResult = applyMove(puzzlePieces, next.fromCol, next.fromRow, next.toCol, next.toRow);
            puzzlePieces = autoResult.pieces;
            puzzleLastMove = {
              fromCol: next.fromCol,
              fromRow: next.fromRow,
              toCol: next.toCol,
              toRow: next.toRow
            };
            puzzleStep++;
            if (puzzleStep >= puzzle.solution.length) {
              puzzleSolved[puzzle.id] = true;
              if (puzzleList) {
                var btn = puzzleList.querySelector('.puzzle-item-btn.active');
                if (btn) btn.classList.add('solved');
              }
              setPuzzleStatus('恭喜！残局杀成，干得漂亮！', 'success');
            } else {
              setPuzzleStatus('黑方已应，请继续找出红方杀着', '');
            }
            renderPuzzleBoard();
          }, 600);
        } else {
          setPuzzleStatus('好棋！请继续找出下一步杀着', 'success');
          renderPuzzleBoard();
        }
      } else {
        setPuzzleStatus('这步不对，再想想 — 点击「提示」获取线索', 'error');
        puzzleSelected = null;
        renderPuzzleBoard();
      }
      return;
    }

    if (piece && piece.color === 'red') {
      puzzleSelected = { col: col, row: row };
      setPuzzleStatus('已选中「' + PIECE_CHARS[piece.type].red + '」，请点击目标位置', '');
      renderPuzzleBoard();
    }
  }

  if (puzzleList && PUZZLES.length) {
    PUZZLES.forEach(function (pz, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'puzzle-item-btn' + (i === 0 ? ' active' : '');
      btn.innerHTML =
        '<span class="puzzle-item-title">' + pz.title + '</span>' +
        '<span class="puzzle-item-meta">' + pz.category + ' · ' + pz.difficulty + ' · ' + (pz.mateIn === 1 ? '一步杀' : '两步杀') + '</span>';
      btn.addEventListener('click', function () {
        loadPuzzle(i);
      });
      puzzleList.appendChild(btn);
    });

    if (puzzleHintBtn) {
      puzzleHintBtn.addEventListener('click', function () {
        setPuzzleStatus('💡 ' + PUZZLES[currentPuzzleIndex].hint, 'hint');
      });
    }

    if (puzzleResetBtn) {
      puzzleResetBtn.addEventListener('click', function () {
        loadPuzzle(currentPuzzleIndex);
      });
    }

    if (puzzleNextBtn) {
      puzzleNextBtn.addEventListener('click', function () {
        var next = (currentPuzzleIndex + 1) % PUZZLES.length;
        loadPuzzle(next);
      });
    }

    loadPuzzle(0);
  }

  // ===== Replay =====
  var REPLAYS = [
    {
      id: 'rp1',
      title: '中炮对屏风马',
      desc: '最常见的开局体系。红方中炮直攻中路，黑方双马保护中卒，双方出车跃马争夺主动权。',
      startPieces: STARTING_POSITION,
      moves: [
        { notation: '炮二平五', color: 'red', fromCol: 7, fromRow: 7, toCol: 4, toRow: 7 },
        { notation: '马8进7', color: 'black', fromCol: 7, fromRow: 0, toCol: 6, toRow: 2 },
        { notation: '马二进三', color: 'red', fromCol: 7, fromRow: 9, toCol: 6, toRow: 7 },
        { notation: '马2进3', color: 'black', fromCol: 1, fromRow: 0, toCol: 2, toRow: 2 },
        { notation: '车一平二', color: 'red', fromCol: 8, fromRow: 9, toCol: 7, toRow: 9 },
        { notation: '车9平8', color: 'black', fromCol: 0, fromRow: 0, toCol: 1, toRow: 0 },
        { notation: '兵三进一', color: 'red', fromCol: 6, fromRow: 6, toCol: 6, toRow: 5 },
        { notation: '炮8平9', color: 'black', fromCol: 1, fromRow: 2, toCol: 0, toRow: 2 },
        { notation: '马八进九', color: 'red', fromCol: 1, fromRow: 9, toCol: 2, toRow: 7 },
        { notation: '车1进1', color: 'black', fromCol: 0, fromRow: 0, toCol: 0, toRow: 1 }
      ]
    },
    {
      id: 'rp2',
      title: '顺炮直车',
      desc: '对攻型开局。双方同侧炮互攻，出车迅速，适合学习进攻节奏与对杀思路。',
      startPieces: STARTING_POSITION,
      moves: [
        { notation: '炮二平五', color: 'red', fromCol: 7, fromRow: 7, toCol: 4, toRow: 7 },
        { notation: '炮8平5', color: 'black', fromCol: 1, fromRow: 2, toCol: 4, toRow: 2 },
        { notation: '马二进三', color: 'red', fromCol: 7, fromRow: 9, toCol: 6, toRow: 7 },
        { notation: '马8进7', color: 'black', fromCol: 7, fromRow: 0, toCol: 6, toRow: 2 },
        { notation: '车一平二', color: 'red', fromCol: 8, fromRow: 9, toCol: 7, toRow: 9 },
        { notation: '车9进1', color: 'black', fromCol: 0, fromRow: 0, toCol: 0, toRow: 1 },
        { notation: '车二进六', color: 'red', fromCol: 7, fromRow: 9, toCol: 7, toRow: 3 },
        { notation: '车9平8', color: 'black', fromCol: 0, fromRow: 1, toCol: 1, toRow: 1 }
      ]
    },
    {
      id: 'rp3',
      title: '马后炮杀棋',
      desc: '经典杀法实战演示。红方通过跳马、运炮配合，三步构成马后炮绝杀。',
      startPieces: [
        { type: 'king', color: 'black', col: 4, row: 0 },
        { type: 'advisor', color: 'black', col: 3, row: 0 },
        { type: 'advisor', color: 'black', col: 5, row: 0 },
        { type: 'elephant', color: 'black', col: 2, row: 2 },
        { type: 'elephant', color: 'black', col: 6, row: 2 },
        { type: 'king', color: 'red', col: 4, row: 9 },
        { type: 'horse', color: 'red', col: 1, row: 7 },
        { type: 'cannon', color: 'red', col: 7, row: 5 },
        { type: 'rook', color: 'red', col: 0, row: 9 }
      ],
      moves: [
        { notation: '马八进七', color: 'red', fromCol: 1, fromRow: 7, toCol: 2, toRow: 5 },
        { notation: '将5平4', color: 'black', fromCol: 4, fromRow: 0, toCol: 3, toRow: 0 },
        { notation: '马七进五', color: 'red', fromCol: 2, fromRow: 5, toCol: 4, toRow: 4 },
        { notation: '将4进1', color: 'black', fromCol: 3, fromRow: 0, toCol: 3, toRow: 1 },
        { notation: '炮二平五', color: 'red', fromCol: 7, fromRow: 5, toCol: 4, toRow: 5, highlight: true }
      ]
    }
  ];

  var replayBoard = document.getElementById('replayBoard');
  var replaySelector = document.getElementById('replaySelector');
  var replayTitle = document.getElementById('replayTitle');
  var replayDesc = document.getElementById('replayDesc');
  var replayMoveBadge = document.getElementById('replayMoveBadge');
  var notationList = document.getElementById('notationList');
  var replayPlayBtn = document.getElementById('replayPlay');
  var replayFirstBtn = document.getElementById('replayFirst');
  var replayPrevBtn = document.getElementById('replayPrev');
  var replayNextBtn = document.getElementById('replayNext');
  var replayLastBtn = document.getElementById('replayLast');
  var replaySpeedInput = document.getElementById('replaySpeed');
  var replaySpeedLabel = document.getElementById('replaySpeedLabel');
  var replaySoundToggle = document.getElementById('replaySoundToggle');
  var sound = window.XQSound;
  var replayEngine = window.XQEngine;

  var currentReplayIndex = 0;
  var replayStep = 0;
  var replayPieces = [];
  var replayTimer = null;
  var replayPlaying = false;

  function getReplay() {
    return REPLAYS[currentReplayIndex];
  }

  function buildReplayPosition(step) {
    var replay = getReplay();
    var pieces = clonePieces(replay.startPieces);
    var lastMove = null;
    for (var i = 0; i < step; i++) {
      var m = replay.moves[i];
      var result = applyMove(pieces, m.fromCol, m.fromRow, m.toCol, m.toRow);
      pieces = result.pieces;
      lastMove = {
        fromCol: m.fromCol,
        fromRow: m.fromRow,
        toCol: m.toCol,
        toRow: m.toRow
      };
    }
    if (step > 0 && replay.moves[step - 1].highlight) {
      var last = replay.moves[step - 1];
      pieces.forEach(function (p) {
        if (p.col === last.toCol && p.row === last.toRow) p.highlight = true;
      });
    }
    return { pieces: pieces, lastMove: lastMove };
  }

  function updateNotationList() {
    if (!notationList) return;
    var replay = getReplay();
    notationList.innerHTML = '';
    var moveNum = 1;
    replay.moves.forEach(function (m, i) {
      var li = document.createElement('li');
      var prefix = m.color === 'red' ? moveNum + '. ' : '';
      if (m.color === 'black') moveNum++;
      li.className = (m.color === 'red' ? 'red-move' : 'black-move') + (i + 1 === replayStep ? ' active' : '');
      li.innerHTML = '<span class="move-num">' + prefix + '</span>' + m.notation;
      li.addEventListener('click', function () {
        stopReplay();
        goToReplayStep(i + 1);
      });
      notationList.appendChild(li);
    });
  }

  function updateReplayBadge() {
    if (!replayMoveBadge) return;
    var replay = getReplay();
    if (replayStep === 0) {
      replayMoveBadge.textContent = '开局准备';
    } else {
      var m = replay.moves[replayStep - 1];
      replayMoveBadge.textContent = (m.color === 'red' ? '红方 ' : '黑方 ') + m.notation;
      replayMoveBadge.classList.remove('animate-in');
      void replayMoveBadge.offsetWidth;
      replayMoveBadge.classList.add('animate-in');
    }
  }

  function renderReplayBoard() {
    var state = buildReplayPosition(replayStep);
    renderBoard(replayBoard, state.pieces, null, { lastMove: state.lastMove });
    updateNotationList();
    updateReplayBadge();
  }

  function updateReplaySoundToggle() {
    if (!replaySoundToggle || !sound) return;
    var on = sound.isEnabled();
    replaySoundToggle.textContent = on ? '音效开' : '音效关';
    replaySoundToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    replaySoundToggle.setAttribute('aria-label', on ? '音效已开启' : '音效已关闭');
  }

  function initReplaySoundToggle() {
    if (!replaySoundToggle || !sound) return;
    updateReplaySoundToggle();
    replaySoundToggle.addEventListener('click', function () {
      sound.ensureContext();
      sound.setEnabled(!sound.isEnabled());
      updateReplaySoundToggle();
      if (sound.isEnabled()) sound.playSelect();
    });
  }

  function playReplayMoveSound(moveIndex) {
    if (!sound) return;
    sound.ensureContext();
    var replay = getReplay();
    var m = replay.moves[moveIndex];
    if (!m) return;

    var piecesBefore = clonePieces(replay.startPieces);
    for (var i = 0; i < moveIndex; i++) {
      var prev = replay.moves[i];
      var applied = applyMove(piecesBefore, prev.fromCol, prev.fromRow, prev.toCol, prev.toRow);
      if (!applied) return;
      piecesBefore = applied.pieces;
    }

    var moveResult = applyMove(piecesBefore, m.fromCol, m.fromRow, m.toCol, m.toRow);
    if (!moveResult) return;

    var opponent = m.color === 'red' ? 'black' : 'red';
    var inCheck = replayEngine && replayEngine.isInCheck(moveResult.pieces, opponent);
    sound.playStepSound(moveResult.captured, inCheck);
  }

  function goToReplayStep(step, options) {
    options = options || {};
    var replay = getReplay();
    var prevStep = replayStep;
    replayStep = Math.max(0, Math.min(step, replay.moves.length));
    if (!options.silent && replayStep === prevStep + 1 && replayStep > 0) {
      playReplayMoveSound(replayStep - 1);
    }
    renderReplayBoard();
  }

  function stopReplay() {
    replayPlaying = false;
    if (replayTimer) {
      clearInterval(replayTimer);
      replayTimer = null;
    }
    if (replayPlayBtn) replayPlayBtn.classList.remove('playing');
  }

  function playReplay() {
    if (replayPlaying) {
      stopReplay();
      return;
    }
    if (sound) sound.ensureContext();
    var replay = getReplay();
    if (replayStep >= replay.moves.length) {
      replayStep = 0;
      renderReplayBoard();
    }
    replayPlaying = true;
    if (replayPlayBtn) replayPlayBtn.classList.add('playing');
    var interval = replaySpeedInput ? parseInt(replaySpeedInput.value, 10) : 1200;
    replayTimer = setInterval(function () {
      if (replayStep >= replay.moves.length) {
        stopReplay();
        return;
      }
      goToReplayStep(replayStep + 1);
    }, interval);
  }

  function loadReplay(index) {
    stopReplay();
    currentReplayIndex = index;
    replayStep = 0;
    var replay = getReplay();
    if (replayTitle) replayTitle.textContent = replay.title;
    if (replayDesc) replayDesc.textContent = replay.desc;
    if (replaySelector) {
      replaySelector.querySelectorAll('.replay-select-btn').forEach(function (btn, i) {
        btn.classList.toggle('active', i === index);
      });
    }
    renderReplayBoard();
  }

  if (replaySelector && REPLAYS.length) {
    REPLAYS.forEach(function (rp, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'replay-select-btn' + (i === 0 ? ' active' : '');
      btn.textContent = rp.title;
      btn.addEventListener('click', function () {
        loadReplay(i);
      });
      replaySelector.appendChild(btn);
    });

    initReplaySoundToggle();

    if (replayPlayBtn) replayPlayBtn.addEventListener('click', playReplay);
    if (replayFirstBtn) replayFirstBtn.addEventListener('click', function () { if (sound) sound.ensureContext(); stopReplay(); goToReplayStep(0); });
    if (replayPrevBtn) replayPrevBtn.addEventListener('click', function () { if (sound) sound.ensureContext(); stopReplay(); goToReplayStep(replayStep - 1); });
    if (replayNextBtn) replayNextBtn.addEventListener('click', function () { if (sound) sound.ensureContext(); stopReplay(); goToReplayStep(replayStep + 1); });
    if (replayLastBtn) replayLastBtn.addEventListener('click', function () { if (sound) sound.ensureContext(); stopReplay(); goToReplayStep(getReplay().moves.length); });

    if (replaySpeedInput && replaySpeedLabel) {
      replaySpeedInput.addEventListener('input', function () {
        var ms = parseInt(replaySpeedInput.value, 10);
        replaySpeedLabel.textContent = (ms / 1000).toFixed(1) + ' 秒/手';
        if (replayPlaying) {
          stopReplay();
          playReplay();
        }
      });
    }

    loadReplay(0);
  }

  // ===== Scroll reveal =====
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.card, .rule-step, .opening-card, .endgame-card, .puzzle-item-btn, .replay-select-btn').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  window.XQBoard = {
    renderBoard: renderBoard,
    clonePieces: clonePieces,
    findPieceAt: findPieceAt,
    applyMove: applyMove,
    STARTING_POSITION: STARTING_POSITION,
    PIECE_CHARS: PIECE_CHARS
  };
})();
