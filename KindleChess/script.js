"use strict";

var selectedsquare = null;

function screenWidth() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 600;
}

function screenHeight() {
    return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 800;
}

function setClass(el, name, on) {
    if (!el) return;
    if (el.classList) {
        if (on) el.classList.add(name);
        else el.classList.remove(name);
        return;
    }
    var current = (" " + el.className + " ").replace(" " + name + " ", " ");
    el.className = (on ? current + name : current).replace(/^\s+|\s+$/g, "");
}

function setHidden(el, hidden) {
    if (!el) return;
    if (hidden) el.setAttribute("hidden", "hidden");
    else el.removeAttribute("hidden");
}

function isHidden(el) {
    return !el || el.getAttribute("hidden") !== null;
}

function popupOpen() {
    return !isHidden(document.getElementById("confirm")) || !isHidden(document.getElementById("result-layer")) || !isHidden(document.getElementById("promote")) || !isHidden(document.getElementById("settings"));
}

var PIECE_SETS = ["3d_chesskid", "3d_plastic", "3d_staunton", "3d_wood", "8_bit", "8qetl", "alpha", "bases", "book", "bubblegum", "ca09k", "cases", "classic", "club", "condal", "dash", "ejgfv", "game_room", "glass", "gothic", "graffiti", "icy_sea", "light", "lolz", "luca", "marble", "maya", "metal", "modern", "nature", "neo_wood", "neon", "newspaper", "ocean", "sky", "space", "tigers", "tournament", "vintage", "wood"];
var BOARD_SETS = ["4fs27.png", "6m5lc.png", "8_bit.png", "9rdwe.png", "bases.png", "bju81.png", "blue.png", "brown.png", "burled_wood.png", "checkers.png", "dark_wood.png", "dash.png", "g715q.png", "glass.png", "icy_sea.png", "light.png", "lolz.png", "marble.png", "metal.png", "my2xa.png", "neon.png", "newspaper.png", "ohdxn.png", "orange.png", "parchment.png", "purple.png", "red.png", "sand.png", "stone.png", "tan.png", "tournament.png", "translucent.png", "walnut.png", "z4m3d.png"];
var SKIN_KEY = "kindlechess-skins";
var skinChoice = { pieces: "", board: "" };
var settingsView = "home";

function skinLabel(id) {
    var name = String(id || "").replace(/\.png$/i, "").replace(/_/g, " ");
    var parts = name.split(" ");
    var i;
    for (i = 0; i < parts.length; i++) {
        if (!parts[i]) continue;
        parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
    }
    return parts.join(" ");
}

function skinKnown(list, id) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === id) return true;
    }
    return false;
}

function loadSkins() {
    try {
        if (!window.localStorage) return;
        var raw = localStorage.getItem(SKIN_KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        if (data && skinKnown(PIECE_SETS, data.pieces)) skinChoice.pieces = data.pieces;
        if (data && skinKnown(BOARD_SETS, data.board)) skinChoice.board = data.board;
    } catch (ignore) {}
}

function saveSkins() {
    try {
        if (!window.localStorage) return;
        localStorage.setItem(SKIN_KEY, JSON.stringify({ pieces: skinChoice.pieces, board: skinChoice.board }));
    } catch (ignore) {}
}

function pieceSrc(color, type) {
    if (skinChoice.pieces) return "img/pieces/" + skinChoice.pieces + "/" + color + String(type).toLowerCase() + ".png";
    return "img/chesspieces/wikipedia/" + color + String(type).toUpperCase() + ".png";
}

function pieceThemeSrc(piece) {
    return pieceSrc(piece.charAt(0), piece.charAt(1));
}

function pieceChoiceName() {
    return skinChoice.pieces ? skinLabel(skinChoice.pieces) : "Default";
}

function boardChoiceName() {
    return skinChoice.board ? skinLabel(skinChoice.board) : "Default";
}

loadSkins();

function fittedLayout(width, height) {
    var margin = 12;
    var gap = 8;
    var buttonH = 64;
    var reset = document.getElementById("reset-white");
    if (reset && reset.offsetHeight) buttonH = reset.offsetHeight;
    var statusFont = Math.max(16, Math.min(28, Math.floor(width * 0.022)));
    var statusH = Math.ceil(statusFont * 1.3 * 2) + 4;
    var piece = Math.max(26, Math.min(43, Math.floor(width * 0.0336)));
    var side = Math.max(statusH, piece);
    var chrome = margin * 2 + buttonH * 2 + gap * 4 + side * 2;
    var maxByHeight = height - chrome - 8;
    var maxByWidth = Math.floor(width * 0.95) - 8;
    var size = Math.min(maxByWidth, maxByHeight);
    if (size < 240) size = Math.max(160, Math.min(maxByWidth, height - buttonH * 2 - margin * 2));
    return {
        size: Math.floor(size),
        statusFont: statusFont,
        piece: piece,
        count: Math.max(12, Math.min(16, Math.floor(width * 0.014))),
        result: Math.max(20, Math.min(40, Math.floor(width * 0.035))),
        notation: Math.max(18, Math.min(28, Math.floor(width * 0.02)))
    };
}

function applyScreenMetrics() {
    var fit = fittedLayout(screenWidth(), screenHeight());
    var node = document.getElementById("screen-metrics");
    if (!node) return;
    var css = ".capture img{width:" + fit.piece + "px;height:" + fit.piece + "px}" + ".capture-count{font-size:" + fit.count + "px;margin-right:-" + Math.round(fit.piece * 12 / 80) + "px}" + ".capture-row + .capture-row{margin-top:-" + Math.round(fit.piece * 12 / 80) + "px}" + ".check-mark{border-width:" + Math.max(6, Math.floor(fit.size / 120)) + "px}" + ".status, .player-clock, .last-move{font-size:" + fit.statusFont + "px}" + ".result-message{font-size:" + fit.result + "px}" + "#chessboard .notation-322f9{font-size:" + fit.notation + "px;line-height:1}";
    while (node.firstChild) node.removeChild(node.firstChild);
    node.appendChild(document.createTextNode(css));
}

function sizePage() {
    var w = screenWidth();
    var h = screenHeight();
    if (!w || !h) return false;
    document.documentElement.style.width = w + "px";
    document.documentElement.style.height = h + "px";
    document.body.style.width = w + "px";
    document.body.style.height = h + "px";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return true;
}

var game;
var board;

try {
    game = new Chess();
    var chessboardEl = document.getElementById("chessboard");
    if (chessboardEl) chessboardEl.style.width = fittedLayout(screenWidth(), screenHeight()).size + "px";
    board = Chessboard("chessboard", {
    draggable: false,
    position: "start",
    pieceTheme: function (piece) {
        return pieceThemeSrc(piece);
    },
    onSnapEnd: function onSnapEnd() {
        return board.position(game.fen());
    }
});
    applyBoardSkin();
} catch (err) {}

function syncPieceFacing() {
    setClass(document.body, "black-to-move", game.turn() === "b");
}

var captureOrder = ["p", "n", "b", "r", "q"];

function renderCaptures() {
    var taken = {
        w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
        b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    };
    game.history({ verbose: true }).forEach(function (move) {
        if (!move.captured) return;
        var capturedColor = move.color === "w" ? "b" : "w";
        taken[capturedColor][move.captured] += 1;
    });
    fillCaptureTray(document.getElementById("captures-white"), "b", taken.b, "w", taken.w);
    fillCaptureTray(document.getElementById("captures-black"), "w", taken.w, "b", taken.b);
}

function fillCaptureTray(tray, takenColor, takenCounts, lostColor, lostCounts) {
    tray.innerHTML = "";
    appendCaptureRow(tray, takenColor, takenCounts);
    appendCaptureRow(tray, lostColor, lostCounts);
}

function appendCaptureRow(tray, color, counts) {
    var row = document.createElement("div");
    row.className = "capture-row";
    var any = false;
    captureOrder.forEach(function (type) {
        var count = counts[type];
        if (!count) return;
        any = true;
        var item = document.createElement("span");
        item.className = "capture";
        if (count > 1) {
            var label = document.createElement("span");
            label.className = "capture-count";
            label.textContent = count + "x";
            item.appendChild(label);
        }
        var img = document.createElement("img");
        img.src = pieceSrc(color, type);
        img.alt = "";
        item.appendChild(img);
        row.appendChild(item);
    });
    if (any) tray.appendChild(row);
}

var piecePoints = { p: 1, n: 3, b: 3, r: 5, q: 9 };

function renderStatus() {
    var scores = { w: 0, b: 0 };
    var rows = game.board();
    for (var y = 0; y < 8; y++) {
        for (var x = 0; x < 8; x++) {
            var piece = rows[y][x];
            if (!piece || !piecePoints[piece.type]) continue;
            scores[piece.color] += piecePoints[piece.type];
        }
    }
    var diff = scores.w - scores.b;
    var diffText = diff === 0 ? "Difference 0" : diff > 0 ? "White +" + diff : "Black +" + -diff;
    var turnText = game.turn() === "w" ? "White to move" : "Black to move";
    var second = diffText + " \u2022 " + turnText;
    document.getElementById("status-white").textContent = "White " + scores.w + " \u2022 Black " + scores.b + "\n" + second;
    document.getElementById("status-black").textContent = "Black " + scores.b + " \u2022 White " + scores.w + "\n" + second;
}

function lastMoveText() {
    if (!game) return "";
    var hist = game.history({ verbose: true });
    if (!hist.length) return "";
    var last = hist[hist.length - 1];
    var n = Math.floor((hist.length - 1) / 2) + 1;
    if (last.color === "w") return n + ". " + last.san;
    return n + "... " + last.san;
}

function renderLastMove() {
    var text = lastMoveText();
    var white = document.getElementById("last-move-white");
    var black = document.getElementById("last-move-black");
    if (white) white.textContent = text;
    if (black) black.textContent = text;
}

function placeLastMoves() {
    var boardEl = document.querySelector("#chessboard .board-b72b1");
    if (!boardEl) return;
    var rect = boardEl.getBoundingClientRect();
    var gap = 8;
    var height = screenHeight();
    var boxW = Math.min(360, Math.floor(rect.width * 0.4));
    var left = Math.round(rect.left + (rect.width - boxW) / 2);
    var white = document.getElementById("last-move-white");
    var black = document.getElementById("last-move-black");
    if (white) {
        white.style.width = boxW + "px";
        white.style.left = left + "px";
        white.style.top = rect.bottom + gap + "px";
        white.style.right = "auto";
        white.style.bottom = "auto";
    }
    if (black) {
        black.style.width = boxW + "px";
        black.style.left = left + "px";
        black.style.bottom = height - rect.top + gap + "px";
        black.style.top = "auto";
        black.style.right = "auto";
    }
}

function kingSquare() {
    var turn = game.turn();
    var files = "abcdefgh";
    var rank;
    var file;
    var sq;
    var piece;
    for (rank = 1; rank <= 8; rank++) {
        for (file = 0; file < 8; file++) {
            sq = files.charAt(file) + rank;
            piece = game.get(sq);
            if (piece && piece.type === "k" && piece.color === turn) return sq;
        }
    }
    return null;
}

function renderLastFrom() {
    var marked = document.querySelectorAll("#chessboard .last-from");
    var i;
    for (i = marked.length - 1; i >= 0; i--) setClass(marked[i], "last-from", false);
    if (!game) return;
    var hist = game.history({ verbose: true });
    if (!hist.length) return;
    var square = document.querySelector("#chessboard .square-" + hist[hist.length - 1].from);
    setClass(square, "last-from", true);
}

function renderCheck() {
    var old = document.querySelectorAll(".check-mark");
    var i;
    for (i = old.length - 1; i >= 0; i--) {
        if (old[i].parentNode) old[i].parentNode.removeChild(old[i]);
    }
    if (!game || !game.in_check()) return;
    var sq = kingSquare();
    if (!sq) return;
    var square = document.querySelector("#chessboard .square-" + sq);
    if (!square) return;
    var mark = document.createElement("div");
    mark.className = "check-mark";
    square.appendChild(mark);
}

function placeCaptures() {
    var boardEl = document.querySelector("#chessboard .board-b72b1");
    if (!boardEl) return;
    var rect = boardEl.getBoundingClientRect();
    var gap = 8;
    var piece = fittedLayout(screenWidth(), screenHeight()).piece;
    var captureGap = gap - Math.round(piece * 14 / 80);
    if (captureGap < 0) captureGap = 0;
    var width = screenWidth();
    var height = screenHeight();
    var white = document.getElementById("captures-white");
    var black = document.getElementById("captures-black");
    var whiteStatus = document.getElementById("status-white");
    var blackStatus = document.getElementById("status-black");
    white.style.top = rect.bottom + captureGap + "px";
    white.style.right = width - rect.right + "px";
    white.style.left = "auto";
    white.style.bottom = "auto";
    black.style.left = rect.left + "px";
    black.style.bottom = height - rect.top + captureGap + "px";
    black.style.top = "auto";
    black.style.right = "auto";
    whiteStatus.style.top = rect.bottom + gap + "px";
    whiteStatus.style.left = rect.left + "px";
    whiteStatus.style.right = "auto";
    whiteStatus.style.bottom = "auto";
    blackStatus.style.right = width - rect.right + "px";
    blackStatus.style.bottom = height - rect.top + gap + "px";
    blackStatus.style.left = "auto";
    blackStatus.style.top = "auto";
}

function layoutBoard() {
    sizePage();
    applyScreenMetrics();
    if (!board) return;
    var width = screenWidth();
    var height = screenHeight();
    var el = document.getElementById("chessboard");
    el.style.width = fittedLayout(width, height).size + "px";
    board.resize();
    var inner = document.querySelector("#chessboard .board-b72b1");
    if (!inner) return;
    var innerRect = inner.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    var left = (width - innerRect.width) / 2 - (innerRect.left - elRect.left);
    var top = (height - innerRect.height) / 2 - (innerRect.top - elRect.top);
    el.style.left = left + "px";
    el.style.top = top + "px";
    applyBoardSkin();
    placeCaptures();
    placeLastMoves();
    placeCornerButtons();
    placeClocks();
    placeResultLayer();
    placeConfirm();
    placePromote();
    placeSettings();
    renderCheck();
    renderLastFrom();
}

function durationParts(ms) {
    var total = Math.floor(ms / 1000);
    if (total < 0) total = 0;
    return {
        hours: Math.floor(total / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60
    };
}

function setText(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
}

function setPx(el, name, px) {
    if (!el) return;
    var next = px + "px";
    if (el.style[name] !== next) el.style[name] = next;
}

function measureClockText(text) {
    var probe = document.getElementById("clock-probe");
    if (!probe) {
        probe = document.createElement("span");
        probe.id = "clock-probe";
        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        probe.style.whiteSpace = "nowrap";
        probe.style.left = "0";
        probe.style.top = "0";
        probe.style.padding = "0";
        probe.style.margin = "0";
        document.body.appendChild(probe);
    }
    probe.style.fontSize = fittedLayout(screenWidth(), screenHeight()).statusFont + "px";
    probe.style.fontFamily = "Merriweather, Georgia, serif";
    probe.textContent = text;
    return Math.ceil(probe.offsetWidth);
}

function makeClockPart(kind) {
    var part = document.createElement("span");
    part.className = "clock-part clock-" + kind;
    var num = document.createElement("span");
    num.className = "clock-num";
    var unit = document.createElement("span");
    unit.className = "clock-unit";
    part.appendChild(num);
    part.appendChild(unit);
    return part;
}

function makeClockLine(label, role) {
    var line = document.createElement("div");
    line.className = "clock-line";
    line.setAttribute("data-role", role);
    var lab = document.createElement("span");
    lab.className = "clock-label";
    lab.textContent = label;
    line.appendChild(lab);
    line.appendChild(makeClockPart("hours"));
    line.appendChild(makeClockPart("minutes"));
    line.appendChild(makeClockPart("seconds"));
    return line;
}

function buildClock(el, firstRole, firstLabel, secondRole, secondLabel) {
    if (!el || el.getAttribute("data-built") === "yes") return;
    var lines = document.createElement("div");
    lines.className = "clock-lines";
    lines.appendChild(makeClockLine(firstLabel, firstRole));
    lines.appendChild(makeClockLine(secondLabel, secondRole));
    var world = document.createElement("div");
    world.className = "clock-world";
    var hour = document.createElement("span");
    hour.className = "clock-hour";
    var colon = document.createElement("span");
    colon.className = "clock-colon";
    colon.textContent = ":";
    var minute = document.createElement("span");
    minute.className = "clock-minute";
    world.appendChild(hour);
    world.appendChild(colon);
    world.appendChild(minute);
    el.appendChild(lines);
    el.appendChild(world);
    el.setAttribute("data-built", "yes");
}

function clockLine(root, role) {
    var lines = root.querySelectorAll(".clock-line");
    var i;
    for (i = 0; i < lines.length; i++) {
        if (lines[i].getAttribute("data-role") === role) return lines[i];
    }
    return null;
}

function fillPart(line, kind, value, unit, always) {
    var part = line.querySelector(".clock-" + kind);
    if (!part) return;
    var show = always || value !== 0;
    setText(part.querySelector(".clock-num"), show ? "" + value : "");
    setText(part.querySelector(".clock-unit"), show ? unit : "");
}

function fillLine(line, ms) {
    if (!line) return;
    var parts = durationParts(ms);
    fillPart(line, "hours", parts.hours, "\u00a0h", false);
    fillPart(line, "minutes", parts.minutes, "\u00a0min", false);
    fillPart(line, "seconds", parts.seconds, "\u00a0sec", true);
}

function fillClock(root) {
    if (!root) return;
    var whiteLine = clockLine(root, "w");
    var blackLine = clockLine(root, "b");
    if (whiteLine) fillLine(whiteLine, clockMs.w);
    if (blackLine) fillLine(blackLine, clockMs.b);
}

function widestDigit() {
    var i;
    var max = 0;
    var w;
    for (i = 0; i < 10; i++) {
        w = measureClockText("" + i);
        if (w > max) max = w;
    }
    return max;
}

function applyClockMetrics(width) {
    var fontSize = fittedLayout(width, screenHeight()).statusFont;
    var digit = widestDigit();
    var labelW = measureClockText("White:");
    var blackW = measureClockText("Black:");
    if (blackW > labelW) labelW = blackW;
    var hourNum = digit * 2;
    var minNum = digit * 2;
    var secNum = digit * 2;
    var hourUnit = measureClockText("\u00a0h");
    var minUnit = measureClockText("\u00a0min");
    var secUnit = measureClockText("\u00a0sec");
    var gap = measureClockText("n n") - measureClockText("nn");
    if (gap < 1) gap = Math.max(4, Math.ceil(digit / 3));
    var labels = document.querySelectorAll(".player-clock .clock-label");
    var i;
    for (i = 0; i < labels.length; i++) setPx(labels[i], "width", labelW);
    var clocks = [document.getElementById("clock-white"), document.getElementById("clock-black")];
    var c;
    var parts;
    var kind;
    var numW;
    var unitW;
    var total = labelW + hourNum + hourUnit + gap + minNum + minUnit + gap + secNum + secUnit;
    for (c = 0; c < clocks.length; c++) {
        if (!clocks[c]) continue;
        parts = clocks[c].querySelectorAll(".clock-part");
        for (i = 0; i < parts.length; i++) {
            kind = parts[i].className;
            numW = secNum;
            unitW = secUnit;
            if (kind.indexOf("clock-hours") !== -1) {
                numW = hourNum;
                unitW = hourUnit;
            } else if (kind.indexOf("clock-minutes") !== -1) {
                numW = minNum;
                unitW = minUnit;
            }
            setPx(parts[i].querySelector(".clock-num"), "width", numW);
            setPx(parts[i].querySelector(".clock-unit"), "width", unitW);
            setPx(parts[i], "marginRight", kind.indexOf("clock-seconds") === -1 ? gap : 0);
        }
        setPx(clocks[c].querySelector(".clock-lines"), "width", total);
        setPx(clocks[c].querySelector(".clock-world"), "height", Math.ceil(fontSize * 1.3));
        setPx(clocks[c].querySelector(".clock-world"), "width", width);
    }
    return digit;
}

function placeWorldColon(root, width, digit, offset) {
    var colon = root.querySelector(".clock-colon");
    var hour = root.querySelector(".clock-hour");
    var minute = root.querySelector(".clock-minute");
    if (!colon || !hour || !minute) return;
    var colonW = colon.offsetWidth || measureClockText(":");
    var colonLeft = (offset || 0) + (width - colonW) / 2;
    var box = digit * 2;
    setPx(colon, "left", colonLeft);
    setPx(hour, "width", box);
    setPx(hour, "left", colonLeft - box);
    setPx(minute, "width", box);
    setPx(minute, "left", colonLeft + colonW);
}

function placeClockInGap(root, gapLeft, gapRight, digit) {
    var width = screenWidth();
    var left = gapLeft;
    var right = gapRight;
    if (!(right - left > 40)) {
        left = 0;
        right = width;
    }
    var lines = root.querySelector(".clock-lines");
    if (lines) {
        var gap = right - left;
        setPx(lines, "marginLeft", left + Math.max(0, Math.round((gap - lines.offsetWidth) / 2)));
    }
    placeWorldColon(root, right - left, digit, left);
}

var clockMs = { w: 0, b: 0 };
var clockTickAt = null;
var clockStarted = false;

function renderClocks(now) {
    var whiteEl = document.getElementById("clock-white");
    var blackEl = document.getElementById("clock-black");
    buildClock(whiteEl, "w", "White:", "b", "Black:");
    buildClock(blackEl, "b", "Black:", "w", "White:");
    fillClock(whiteEl);
    fillClock(blackEl);
    var date = new Date(now);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var hourText = hours < 10 ? "0" + hours : "" + hours;
    var minuteText = minutes < 10 ? "0" + minutes : "" + minutes;
    if (whiteEl) {
        setText(whiteEl.querySelector(".clock-hour"), hourText);
        setText(whiteEl.querySelector(".clock-minute"), minuteText);
    }
    if (blackEl) {
        setText(blackEl.querySelector(".clock-hour"), hourText);
        setText(blackEl.querySelector(".clock-minute"), minuteText);
    }
    placeClocks();
}

function tickClocks() {
    var now = new Date().getTime();
    if (game && !game.game_over() && clockTickAt !== null && game.history().length > 0) clockMs[game.turn()] += now - clockTickAt;
    clockTickAt = now;
    renderClocks(now);
}

function resetClocks() {
    clockMs.w = 0;
    clockMs.b = 0;
    clockTickAt = new Date().getTime();
    renderClocks(clockTickAt);
}

function placeClocks() {
    var width = screenWidth();
    var height = screenHeight();
    var margin = 12;
    var white = document.getElementById("clock-white");
    var black = document.getElementById("clock-black");
    if (!white || !black) return;
    buildClock(white, "w", "White:", "b", "Black:");
    buildClock(black, "b", "Black:", "w", "White:");
    var digit = applyClockMetrics(width);
    setPx(white, "left", 0);
    setPx(black, "left", 0);
    setPx(white, "width", width);
    setPx(black, "width", width);
    setPx(white, "top", Math.max(0, height - white.offsetHeight - margin));
    setPx(black, "top", margin);
    var settingsWhite = document.getElementById("settings-white");
    var exitWhite = document.getElementById("exit-white");
    var exitBlack = document.getElementById("exit-black");
    var settingsBlack = document.getElementById("settings-black");
    var whiteLeft = settingsWhite ? settingsWhite.getBoundingClientRect().right + 8 : 0;
    var whiteRight = exitWhite ? exitWhite.getBoundingClientRect().left - 8 : width;
    var blackScreenLeft = exitBlack ? exitBlack.getBoundingClientRect().right + 8 : 0;
    var blackScreenRight = settingsBlack ? settingsBlack.getBoundingClientRect().left - 8 : width;
    // The black clock is rotated 180 degrees, so place it in the mirrored gap.
    placeClockInGap(white, whiteLeft, whiteRight, digit);
    placeClockInGap(black, width - blackScreenRight, width - blackScreenLeft, digit);
}

function placeCornerButtons() {
    var width = screenWidth();
    var height = screenHeight();
    var margin = 12;
    function place(id, x, y) {
        var el = document.getElementById(id);
        if (!el) return;
        el.style.position = "absolute";
        el.style.zIndex = "40";
        el.style.margin = "0";
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.right = "auto";
        el.style.bottom = "auto";
    }
    var exitWhite = document.getElementById("exit-white");
    var resetWhite = document.getElementById("reset-white");
    var resetBlack = document.getElementById("reset-black");
    var settingsWhite = document.getElementById("settings-white");
    var settingsBlack = document.getElementById("settings-black");
    var ew = exitWhite ? exitWhite.offsetWidth : 90;
    var eh = exitWhite ? exitWhite.offsetHeight : 52;
    var rw = resetWhite ? resetWhite.offsetWidth : 180;
    var rh = resetWhite ? resetWhite.offsetHeight : 52;
    var rbw = resetBlack ? resetBlack.offsetWidth : 180;
    var sw = settingsWhite ? settingsWhite.offsetWidth : 160;
    var sh = settingsWhite ? settingsWhite.offsetHeight : rh;
    var sbw = settingsBlack ? settingsBlack.offsetWidth : 160;
    var gap = 10;
    place("exit-white", Math.max(margin, width - ew - margin), Math.max(margin, height - eh - margin));
    place("reset-white", margin, Math.max(margin, height - rh - margin));
    place("settings-white", margin + rw + gap, Math.max(margin, height - sh - margin));
    place("exit-black", margin, margin);
    place("reset-black", Math.max(margin, width - rbw - margin), margin);
    place("settings-black", Math.max(margin, width - margin - rbw - gap - sbw), margin);
}

var resultReady = { w: false, b: false };

function placeBox(el, centerX, centerY) {
    el.style.position = "absolute";
    el.style.margin = "0";
    el.style.left = Math.max(0, Math.floor(centerX - el.offsetWidth / 2)) + "px";
    el.style.top = Math.max(0, Math.floor(centerY - el.offsetHeight / 2)) + "px";
}

function placeResultLayer() {
    var layer = document.getElementById("result-layer");
    if (!layer || isHidden(layer)) return;
    var width = screenWidth();
    var height = screenHeight();
    var margin = 8;
    var gap = 8;
    var black = document.getElementById("result-black");
    var white = document.getElementById("result-white");
    var qr = document.getElementById("result-qr");
    var blackOpen = black && !isHidden(black);
    var whiteOpen = white && !isHidden(white);
    var topEdge = margin;
    var bottomEdge = height - margin;
    var avail;
    var size;
    var chrome;
    layer.style.left = "0px";
    layer.style.top = "0px";
    layer.style.width = width + "px";
    layer.style.height = height + "px";
    if (blackOpen) {
        placeBox(black, width / 2, margin + black.offsetHeight / 2);
        topEdge = margin + black.offsetHeight + gap;
    }
    if (whiteOpen) {
        placeBox(white, width / 2, height - margin - white.offsetHeight / 2);
        bottomEdge = height - margin - white.offsetHeight - gap;
    }
    if (qr && !isHidden(qr)) {
        var clockBlack = document.getElementById("clock-black");
        var clockWhite = document.getElementById("clock-white");
        if (clockBlack && clockBlack.offsetHeight) {
            topEdge = Math.max(topEdge, clockBlack.offsetTop + clockBlack.offsetHeight + gap);
        }
        if (clockWhite && clockWhite.offsetHeight) {
            bottomEdge = Math.min(bottomEdge, clockWhite.offsetTop - gap);
        }
        avail = Math.max(48, Math.min(width - margin * 2, bottomEdge - topEdge));
        avail = Math.floor(avail * 0.9);
        chrome = 24;
        size = Math.max(40, avail - chrome);
        fillAnalysisQr(qr, size);
        if (qr.offsetHeight > avail && qr.offsetHeight > 0) {
            size = Math.max(40, Math.floor(size * avail / qr.offsetHeight));
            fillAnalysisQr(qr, size);
        }
        placeBox(qr, width / 2, (topEdge + bottomEdge) / 2);
    }
}

function analysisMoves() {
    if (!game) return "";
    var hist = game.history({ verbose: true });
    var parts = [];
    var i;
    var move;
    for (i = 0; i < hist.length; i++) {
        move = hist[i];
        parts.push(move.from + move.to + (move.promotion ? move.promotion : ""));
    }
    return parts.join("");
}

function analysisResult() {
    if (!game || !game.game_over()) return "";
    if (game.in_checkmate()) return game.turn() === "w" ? "0-1" : "1-0";
    return "1/2-1/2";
}

function analysisUrl() {
    var url = "https://kc.01e.cc/?m=" + analysisMoves();
    var result = analysisResult();
    var boardId;
    if (result) url += "&r=" + encodeURIComponent(result);
    if (skinChoice.pieces) url += "&pieces=" + encodeURIComponent(skinChoice.pieces);
    if (skinChoice.board) {
        boardId = String(skinChoice.board).replace(/\.png$/i, "");
        url += "&board=" + encodeURIComponent(boardId);
    }
    return url;
}

function fillAnalysisQr(el, size) {
    var url = analysisUrl();
    var qr;
    var count;
    var cell;
    var html;
    var r;
    var c;
    if (!el || typeof qrcode !== "function") return;
    try {
        qr = qrcode(0, "M");
        qr.addData(url);
        qr.make();
    } catch (ignore) {
        el.innerHTML = "";
        return;
    }
    count = qr.getModuleCount();
    cell = Math.max(2, Math.floor(size / (count + 2)));
    html = '<table style="border-collapse:collapse;border-spacing:0">';
    for (r = 0; r < count; r++) {
        html += "<tr>";
        for (c = 0; c < count; c++) {
            html += '<td style="width:' + cell + "px;height:" + cell + "px;background:" + (qr.isDark(r, c) ? "#000" : "#fff") + '"></td>';
        }
        html += "</tr>";
    }
    html += "</table>";
    el.innerHTML = html;
}

function showAnalysisQr() {
    var qr = document.getElementById("result-qr");
    if (!qr) return;
    setHidden(qr, false);
}

function hideAnalysisQr() {
    var qr = document.getElementById("result-qr");
    if (!qr) return;
    qr.innerHTML = "";
    setHidden(qr, true);
}

function placeConfirm() {
    var dialog = document.getElementById("confirm");
    var box = dialog ? dialog.getElementsByClassName("confirm-box")[0] : null;
    if (!dialog || !box || isHidden(dialog)) return;
    var width = screenWidth();
    var height = screenHeight();
    dialog.style.height = height + "px";
    placeBox(box, width / 2, height / 2);
}

function applyBoardSkin() {
    var root = document.getElementById("chessboard");
    var boardEl = document.querySelector("#chessboard .board-b72b1");
    if (!root) return;
    setClass(root, "skin-board", !!skinChoice.board);
    if (!boardEl) return;
    if (!skinChoice.board) {
        boardEl.style.backgroundImage = "";
        boardEl.style.backgroundSize = "";
        boardEl.style.backgroundRepeat = "";
        return;
    }
    boardEl.style.backgroundImage = "url(\"img/boards/" + skinChoice.board + "\")";
    boardEl.style.backgroundSize = "100% 100%";
    boardEl.style.backgroundRepeat = "no-repeat";
    boardEl.style.backgroundPosition = "center";
}

function applyPieceSkin() {
    if (board && game) board.position(game.fen(), false);
    renderCaptures();
}

function updateSettingsRows() {
    var pieces = document.getElementById("settings-pieces");
    var boards = document.getElementById("settings-boards");
    if (pieces) pieces.textContent = "Pieces (" + pieceChoiceName() + ") >";
    if (boards) boards.textContent = "Board (" + boardChoiceName() + ") >";
}

function showSettingsHome() {
    settingsView = "home";
    setHidden(document.getElementById("settings-home"), false);
    setHidden(document.getElementById("settings-chooser"), true);
    setHidden(document.getElementById("settings-about"), true);
}

var creditsText = null;

function renderCredits(text) {
    var root = document.getElementById("about-credits");
    if (!root) return;
    while (root.firstChild) root.removeChild(root.firstChild);
    var lines = String(text || "").replace(/\r/g, "").split("\n");
    var list = null;
    var i;
    for (i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/^\s+|\s+$/g, "");
        if (!line) {
            list = null;
            continue;
        }
        if (line.charAt(0) === "#") {
            list = null;
            var heading = document.createElement("p");
            heading.className = "about-credits-title";
            heading.textContent = line.replace(/^#+\s*/, "");
            root.appendChild(heading);
        } else if (line.indexOf("- ") === 0) {
            if (!list) {
                list = document.createElement("ul");
                list.className = "about-credits-list";
                root.appendChild(list);
            }
            var item = document.createElement("li");
            item.textContent = line.substring(2);
            list.appendChild(item);
        } else {
            list = null;
            var paragraph = document.createElement("p");
            paragraph.className = "about-text";
            paragraph.textContent = line;
            root.appendChild(paragraph);
        }
    }
}

function loadCredits(callback) {
    if (creditsText !== null) {
        callback(creditsText);
        return;
    }
    var request = new XMLHttpRequest();
    request.open("GET", "credits.md", true);
    request.onreadystatechange = function () {
        if (request.readyState !== 4) return;
        var body = request.responseText ? request.responseText.replace(/^\s+|\s+$/g, "") : "";
        if ((request.status === 200 || request.status === 0) && body.indexOf("- ") !== -1) {
            creditsText = request.responseText;
            callback(creditsText);
        }
    };
    try {
        request.send();
    } catch (ignore) {
        creditsText = "";
        callback(creditsText);
    }
}

function openAbout() {
    settingsView = "about";
    setHidden(document.getElementById("settings-home"), true);
    setHidden(document.getElementById("settings-chooser"), true);
    setHidden(document.getElementById("settings-about"), false);
    loadCredits(function (text) {
        renderCredits(text);
        placeSettings();
    });
    placeSettings();
}

function sortSkins(list) {
    return list.slice().sort(function (a, b) {
        var left = skinLabel(a).toLowerCase();
        var right = skinLabel(b).toLowerCase();
        if (left < right) return -1;
        if (left > right) return 1;
        return 0;
    });
}

function appendPiecePreview(parent, id) {
    var codes = ["wk", "wq", "wn", "bk"];
    var i;
    for (i = 0; i < codes.length; i++) {
        var img = document.createElement("img");
        img.src = "img/pieces/" + id + "/" + codes[i] + ".png";
        img.alt = "";
        parent.appendChild(img);
    }
}

function fillSkinList(kind) {
    var list = document.getElementById("settings-list");
    if (!list) return;
    var isBoards = kind === "boards";
    var items = sortSkins(isBoards ? BOARD_SETS : PIECE_SETS);
    var selected = isBoards ? skinChoice.board : skinChoice.pieces;
    setClass(list, "is-boards", isBoards);
    while (list.firstChild) list.removeChild(list.firstChild);
    var i;
    for (i = 0; i < items.length; i++) {
        var id = items[i];
        var button = document.createElement("button");
        button.type = "button";
        button.className = "skin-option" + (isBoards ? " is-board" : "");
        if (id === selected) button.className += " is-selected";
        button.setAttribute("data-id", id);
        var preview = document.createElement("span");
        preview.className = "skin-preview";
        if (isBoards) {
            var thumb = document.createElement("img");
            thumb.className = "board-thumb";
            thumb.src = "img/boards/" + id;
            thumb.alt = "";
            preview.appendChild(thumb);
        } else {
            appendPiecePreview(preview, id);
        }
        var name = document.createElement("span");
        name.className = "skin-name";
        name.textContent = skinLabel(id);
        button.appendChild(preview);
        button.appendChild(name);
        if (id === selected) {
            var mark = document.createElement("span");
            mark.className = "skin-check";
            mark.textContent = "\u2713";
            button.appendChild(mark);
        }
        list.appendChild(button);
    }
}

function markSkinSelection(id) {
    var options = document.getElementsByClassName("skin-option");
    var i;
    for (i = 0; i < options.length; i++) {
        var on = options[i].getAttribute("data-id") === id;
        setClass(options[i], "is-selected", on);
        var existing = options[i].getElementsByClassName("skin-check")[0];
        if (on && !existing) {
            var mark = document.createElement("span");
            mark.className = "skin-check";
            mark.textContent = "\u2713";
            options[i].appendChild(mark);
        } else if (!on && existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }
}

function openSkinChooser(kind) {
    settingsView = kind;
    var title = document.getElementById("settings-chooser-title");
    if (title) title.textContent = kind === "pieces" ? "Pieces" : "Board";
    fillSkinList(kind);
    setHidden(document.getElementById("settings-home"), true);
    setHidden(document.getElementById("settings-chooser"), false);
    placeSettings();
}

function openSettings(forBlack) {
    showSettingsHome();
    updateSettingsRows();
    var dialog = document.getElementById("settings");
    setClass(dialog, "for-black", forBlack);
    setHidden(dialog, false);
    placeSettings();
}

function closeSettings() {
    showSettingsHome();
    setHidden(document.getElementById("settings"), true);
}

function placeSettings() {
    var dialog = document.getElementById("settings");
    var box = dialog ? dialog.getElementsByClassName("settings-box")[0] : null;
    if (!dialog || !box || isHidden(dialog)) return;
    var width = screenWidth();
    var height = screenHeight();
    dialog.style.width = width + "px";
    dialog.style.height = height + "px";
    var list = document.getElementById("settings-list");
    var listShell = document.getElementById("settings-list-shell");
    var chooser = document.getElementById("settings-chooser");
    var about = document.getElementById("settings-about");
    var showingChooser = chooser && !isHidden(chooser);
    var showingAbout = about && !isHidden(about);
    setClass(box, "settings-fullscreen", showingChooser);
    if (showingChooser) {
        box.style.width = width + "px";
        box.style.height = height + "px";
        box.style.left = "0px";
        box.style.top = "0px";
        var title = document.getElementById("settings-chooser-title");
        var back = document.getElementById("settings-back");
        var used = (title ? title.offsetHeight : 40) + (back ? back.offsetHeight : 48) + 80;
        var listH = Math.max(120, height - used);
        if (listShell) listShell.style.height = listH + "px";
        if (list) list.style.height = listH + "px";
        return;
    }
    var boxW = Math.max(280, Math.min(760, width - 36));
    box.style.width = boxW + "px";
    if (!showingAbout) {
        box.style.height = "auto";
        placeBox(box, width / 2, height / 2);
        return;
    }
    var boxH = Math.max(320, Math.min(height - 36, Math.floor(height * 0.9)));
    box.style.height = boxH + "px";
    placeBox(box, width / 2, height / 2);
    var aboutBody = document.getElementById("about-body");
    var aboutBack = document.getElementById("about-back");
    var aboutUsed = (aboutBack ? aboutBack.offsetHeight : 48) + 68;
    if (aboutBody) aboutBody.style.height = Math.max(160, boxH - aboutUsed) + "px";
}

function placePromote() {
    var dialog = document.getElementById("promote");
    var box = dialog ? dialog.getElementsByClassName("confirm-box")[0] : null;
    if (!dialog || !box || isHidden(dialog)) return;
    var width = screenWidth();
    var height = screenHeight();
    dialog.style.height = height + "px";
    placeBox(box, width / 2, height / 2);
}

function hideResult() {
    resultReady.w = false;
    resultReady.b = false;
    hideAnalysisQr();
    setHidden(document.getElementById("result-layer"), true);
}

function showResult(whiteMessage, blackMessage) {
    resultReady.w = false;
    resultReady.b = false;
    document.querySelector("#result-white .result-message").textContent = whiteMessage;
    document.querySelector("#result-black .result-message").textContent = blackMessage;
    setHidden(document.getElementById("result-white"), false);
    setHidden(document.getElementById("result-black"), false);
    setHidden(document.getElementById("result-layer"), false);
    showAnalysisQr();
    placeResultLayer();
}

function acknowledgeResult(player) {
    var layer = document.getElementById("result-layer");
    if (isHidden(layer) || resultReady[player]) return;
    resultReady[player] = true;
    setHidden(document.getElementById(player === "w" ? "result-white" : "result-black"), true);
    if (resultReady.w && resultReady.b) resetgame();
    else placeResultLayer();
}

function resetgame() {
    hideResult();
    game.reset();
    syncPieceFacing();
    board.position("start");
    renderCaptures();
    renderStatus();
    renderLastMove();
    renderCheck();
    renderLastFrom();
    resetClocks();
    removegreysquares();
    selectedsquare = null;
}

var whitesquaregrey = "#a9a9a9";
var blacksquaregrey = "#696969";

function removegreysquares() {
    $("#chessboard .square-55d63").css("outline", "").css("outline-offset", "");
}

function greysquare(sq) {
    var s = $("#chessboard .square-" + sq);
    s.css({
        outline: "5px dashed black",
        "outline-offset": "-5px"
    });
}

$("#chessboard").on("click", ".square-55d63", function () {
    if (popupOpen()) return;
    var sq = $(this).attr("data-square");
    var pc = game.get(sq);
    var tc = game.turn();
    var ip = pc && pc.color === tc;
    var lm = game.moves({ square: sq, verbose: true });
    if (!selectedsquare) {
        if (!ip || lm.length === 0) return;
        selectedsquare = sq;
        removegreysquares();
        greysquare(sq);
        lm.forEach(function (m) {
            return greysquare(m.to);
        });
        return;
    }
    if (selectedsquare === sq) {
        removegreysquares();
        selectedsquare = null;
        return;
    }
    if (ip) {
        if (lm.length === 0) {
            removegreysquares();
            selectedsquare = null;
            return;
        }
        selectedsquare = sq;
        removegreysquares();
        greysquare(sq);
        lm.forEach(function (m) {
            return greysquare(m.to);
        });
        return;
    }
    var choices = promotionChoices(selectedsquare, sq);
    if (choices.length) {
        openPromote(game.turn() === "b", selectedsquare, sq);
        return;
    }
    var mv = game.move({ from: selectedsquare, to: sq, promotion: "q" });
    removegreysquares();
    if (!mv) {
        greysquare(selectedsquare);
        game.moves({ square: selectedsquare, verbose: true }).forEach(function (m) {
            return greysquare(m.to);
        });
        return;
    }
    finishMove();
});

function finishMove() {
    syncPieceFacing();
    if (game.history().length === 1) clockTickAt = new Date().getTime();
    board.position(game.fen());
    renderCaptures();
    renderStatus();
    renderLastMove();
    renderCheck();
    renderLastFrom();
    selectedsquare = null;
    handlegameover();
}

function promotionChoices(from, to) {
    var moves = game.moves({ square: from, verbose: true });
    var found = [];
    var i;
    for (i = 0; i < moves.length; i++) {
        if (moves[i].to === to && moves[i].promotion) found.push(moves[i].promotion);
    }
    return found;
}

var pendingPromotion = null;

function openPromote(forBlack, from, to) {
    pendingPromotion = { from: from, to: to };
    var dialog = document.getElementById("promote");
    setClass(dialog, "for-black", forBlack);
    var color = forBlack ? "b" : "w";
    var letters = { q: "Q", r: "R", b: "B", n: "N" };
    var size = Math.max(64, Math.min(96, Math.floor(screenWidth() * 0.07)));
    var buttons = dialog.getElementsByClassName("promote-choice");
    var i;
    for (i = 0; i < buttons.length; i++) {
        var piece = buttons[i].getAttribute("data-piece");
        var img = buttons[i].getElementsByTagName("img")[0];
        img.src = pieceSrc(color, letters[piece]);
        img.style.width = size + "px";
        img.style.height = size + "px";
    }
    setHidden(dialog, false);
    placePromote();
}

function closePromote() {
    pendingPromotion = null;
    setHidden(document.getElementById("promote"), true);
}

$(".promote-choice").on("click", function (e) {
    e.stopPropagation();
    if (!pendingPromotion) return;
    var from = pendingPromotion.from;
    var to = pendingPromotion.to;
    var piece = this.getAttribute("data-piece");
    closePromote();
    removegreysquares();
    var mv = game.move({ from: from, to: to, promotion: piece });
    if (!mv) return;
    finishMove();
});

$("#chessboard").parent().on("click", function (e) {
    if (popupOpen()) return;
    if (!$(e.target).closest(".square-55d63").length) {
        removegreysquares();
        selectedsquare = null;
    }
});

function handlegameover() {
    if (!game.game_over()) return;
    if (!game.in_checkmate()) {
        showResult("draw", "draw");
        return;
    }
    var whiteLost = game.turn() === "w";
    showResult(whiteLost ? "you lost" : "you won", whiteLost ? "you won" : "you lost");
}

var confirmAction = "reset";

function hideChrome() {
    try {
        if (!window.kindle || !kindle.messaging || !kindle.messaging.sendMessage) return;
        kindle.messaging.sendMessage("com.lab126.chromebar", "configureChrome", {
            appId: "net.barpos.kindlechess",
            topNavBar: { template: "none" }
        });
        if (kindle.messaging.sendStringMessage) {
            kindle.messaging.sendStringMessage("com.lab126.pillow", "dismissChrome", "net.barpos.kindlechess");
            kindle.messaging.sendStringMessage("com.lab126.mfa", "switchViewMode", "fullscreen");
        }
    } catch (ignore) {}
}

function showChrome() {
    try {
        if (!window.kindle || !kindle.messaging || !kindle.messaging.sendMessage) return;
        kindle.messaging.sendMessage("com.lab126.chromebar", "configureChrome", {
            appId: "net.barpos.kindlechess",
            topNavBar: {
                template: "title",
                title: "Chess",
                buttons: [{ id: "KPP_CLOSE", state: "enabled", handling: "system" }]
            }
        });
    } catch (ignore) {}
}

function exitApp() {
    showChrome();
    try {
        if (window.kindle && kindle.messaging && kindle.messaging.sendStringMessage) {
            kindle.messaging.sendStringMessage("com.lab126.appmgrd", "stop", "app://net.barpos.kindlechess");
        }
    } catch (ignore) {}
}

function openConfirm(forBlack, action) {
    confirmAction = action || "reset";
    var message = document.getElementById("confirm-message");
    if (message) message.textContent = confirmAction === "exit" ? "Exit the app?" : "Clear the board?";
    var dialog = document.getElementById("confirm");
    setClass(dialog, "for-black", forBlack);
    setHidden(dialog, false);
    placeConfirm();
}

function closeConfirm() {
    setHidden(document.getElementById("confirm"), true);
}

$("#reset-white").on("click", function (e) {
    e.stopPropagation();
    if (popupOpen()) return;
    openConfirm(false, "reset");
});

$("#reset-black").on("click", function (e) {
    e.stopPropagation();
    if (popupOpen()) return;
    openConfirm(true, "reset");
});

$("#exit-white").on("click", function (e) {
    e.stopPropagation();
    if (popupOpen()) return;
    openConfirm(false, "exit");
});

$("#exit-black").on("click", function (e) {
    e.stopPropagation();
    if (popupOpen()) return;
    openConfirm(true, "exit");
});

$("#confirm-yes").on("click", function (e) {
    e.stopPropagation();
    var action = confirmAction;
    closeConfirm();
    if (action === "exit") exitApp();
    else resetgame();
});

$("#confirm-no").on("click", function (e) {
    e.stopPropagation();
    closeConfirm();
});

$("#settings-white").on("click", function (e) {
    e.stopPropagation();
    if (popupOpen()) return;
    openSettings(false);
});

$("#settings-black").on("click", function (e) {
    e.stopPropagation();
    if (popupOpen()) return;
    openSettings(true);
});

$("#settings-pieces").on("click", function (e) {
    e.stopPropagation();
    openSkinChooser("pieces");
});

$("#settings-boards").on("click", function (e) {
    e.stopPropagation();
    openSkinChooser("boards");
});

$("#settings-about-row").on("click", function (e) {
    e.stopPropagation();
    openAbout();
});

$("#about-back").on("click", function (e) {
    e.stopPropagation();
    showSettingsHome();
    placeSettings();
});

$("#settings-back").on("click", function (e) {
    e.stopPropagation();
    showSettingsHome();
    placeSettings();
});

$("#settings-done").on("click", function (e) {
    e.stopPropagation();
    closeSettings();
});

function skinListRowHeight(list) {
    var option = list ? list.getElementsByClassName("skin-option")[0] : null;
    return option && option.offsetHeight ? option.offsetHeight : 170;
}

function scrollSkinList(direction) {
    var list = document.getElementById("settings-list");
    if (!list) return;
    var rows = settingsView === "boards" ? 1.1 : 2.2;
    var step = Math.round(skinListRowHeight(list) * rows);
    list.scrollTop = list.scrollTop + direction * step;
}

$("#settings-list").on("click", ".skin-option", function (e) {
    e.stopPropagation();
    var id = this.getAttribute("data-id");
    if (!id) return;
    if (settingsView === "pieces") {
        if (!skinKnown(PIECE_SETS, id)) return;
        skinChoice.pieces = id;
        saveSkins();
        applyPieceSkin();
    } else if (settingsView === "boards") {
        if (!skinKnown(BOARD_SETS, id)) return;
        skinChoice.board = id;
        saveSkins();
        applyBoardSkin();
        renderLastFrom();
        renderCheck();
    }
    updateSettingsRows();
    markSkinSelection(id);
});

$("#settings-scroll-up").on("click", function (e) {
    e.stopPropagation();
    scrollSkinList(-1);
});

$("#settings-scroll-down").on("click", function (e) {
    e.stopPropagation();
    scrollSkinList(1);
});

$(".result-ok").on("click", function (e) {
    e.stopPropagation();
    acknowledgeResult(this.getAttribute("data-player"));
});

var nextFrame = window.requestAnimationFrame || function (fn) {
    return setTimeout(fn, 16);
};

$(window).on("resize", function () {
    nextFrame(layoutBoard);
});

var bootTries = 0;

function boot() {
    bootTries = bootTries + 1;
    try {
        if ((!screenWidth() || !screenHeight()) && bootTries < 20) {
            setTimeout(boot, 250);
            return;
        }
        sizePage();
        hideChrome();
        placeCornerButtons();
        if (!game || !board) return;
        syncPieceFacing();
        renderCaptures();
        renderStatus();
        renderLastMove();
        layoutBoard();
        if (!clockStarted) {
            clockStarted = true;
            resetClocks();
            setInterval(tickClocks, 1000);
        }
        hideChrome();
        try {
            if (window.kindle && kindle.appmgr) {
                var previousOngo = kindle.appmgr.ongo;
                kindle.appmgr.ongo = function (ctx) {
                    if (previousOngo) previousOngo(ctx);
                    hideChrome();
                    placeCornerButtons();
                };
            }
        } catch (ignore) {}
        var chromeTries = 0;
        var chromeTimer = setInterval(function () {
            chromeTries = chromeTries + 1;
            hideChrome();
            layoutBoard();
            if (chromeTries >= 8) clearInterval(chromeTimer);
        }, 500);
    } catch (err) {}
}

boot();
