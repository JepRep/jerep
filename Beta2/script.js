var board = null;
var game = new Chess();
var $status = $('#status');

var stockfish = new Worker('stockfish-10.js');

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if (piece.search(/^b/) !== -1) return false;
}

function askStockfish() {
    $status.html("Judit está analizando la posición...");
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth 13');
}

stockfish.onmessage = function(event) {
    if (event.data.includes('bestmove')) {
        var move = event.data.split(' ')[1];
        game.move({ from: move.substring(0, 2), to: move.substring(2, 4), promotion: 'q' });
        board.position(game.fen());
        updateStatus();
    }
};

function onDrop(source, target) {
    var move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    updateStatus();
    window.setTimeout(askStockfish, 250);
}

function updateStatus() {
    var status = '';
    var moveColor = game.turn() === 'b' ? 'Negras (Polgar)' : 'Tu turno';
    if (game.in_checkmate()) status = 'Mate. Ganó ' + (game.turn() === 'w' ? 'Judit Polgar' : '¡Tú!');
    else if (game.in_draw()) status = 'Empate (Tablas)';
    else status = moveColor + (game.in_check() ? ' — ¡Jaque!' : '');
    $status.html(status);
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: function() { board.position(game.fen()); },
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('myBoard', config);
$(window).resize(board.resize);
updateStatus();

function reiniciar() {
    game.reset();
    board.start();
    updateStatus();
}

// ---- Scroll Reveal ----
var revealEls = document.querySelectorAll('.reveal');
var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

revealEls.forEach(function(el) { observer.observe(el); });

// ---- Touch → Mouse para chessboard.js ----
function simulateMouseEvent(event, type) {
    var touch = event.changedTouches[0];
    var mouseEvent = new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window,
        clientX: touch.clientX, clientY: touch.clientY,
        screenX: touch.screenX, screenY: touch.screenY
    });
    touch.target.dispatchEvent(mouseEvent);
}

document.addEventListener('touchstart', function(e) {
    if (e.target.closest('#myBoard')) { e.preventDefault(); simulateMouseEvent(e, 'mousedown'); }
}, { passive: false });

document.addEventListener('touchmove', function(e) {
    if (e.target.closest('#myBoard')) { e.preventDefault(); simulateMouseEvent(e, 'mousemove'); }
}, { passive: false });

document.addEventListener('touchend', function(e) {
    if (e.target.closest('#myBoard')) { e.preventDefault(); simulateMouseEvent(e, 'mouseup'); }
}, { passive: false });



