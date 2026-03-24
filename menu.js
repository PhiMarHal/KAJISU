// menu.js - UI Elements for KAJISU

const UI = {
    kajisuli: {
        enabled: function () {
            return (typeof KAJISULI_MODE !== 'undefined') ? KAJISULI_MODE : false;
        }
    },

    game: {
        getWidth: function () { return 1200; },
        getHeight: function () { return 800; },
        init: function (scene) {
            if (scene && scene.sys && scene.sys.game) {
                this.getWidth = function () {
                    const canvas = scene.sys.game.canvas;
                    return canvas ? canvas.width : scene.sys.game.config.width;
                };
                this.getHeight = function () {
                    const canvas = scene.sys.game.canvas;
                    return canvas ? canvas.height : scene.sys.game.config.height;
                };
            }
        }
    },

    rel: {
        width: function (pct) { return UI.game.getWidth() * (pct / 100); },
        height: function (pct) { return UI.game.getHeight() * (pct / 100); },
        x: function (pct) { return UI.game.getWidth() * (pct / 100); },
        y: function (pct) { return UI.game.getHeight() * (pct / 100); },
        fontSize: function (pct) { return Math.floor(UI.game.getHeight() * (pct / 100)); }
    },

    // HP bar — left of timer, open right side
    playerHpBar: {
        barWidth: function () { return UI.rel.width(25); },
        height: function () { return UI.rel.width(0.8); },
        borderWidth: 2,
        innerMargin: 2,
        segmentGap: function () { return Math.max(2, UI.rel.width(0.4)); },
        y: function () { return UI.statusDisplay.timerY(); },
        rightEdge: function () { return UI.rel.x(50) - UI.statusDisplay.timerWidth() / 2 - 16; },
        leftEdge: function () { return this.rightEdge() - this.barWidth(); },
        width: function () { return this.barWidth(); },
        centerX: function () { return (this.leftEdge() + this.rightEdge()) / 2; },
    },

    // Legacy healthBar — preserved for boss bar in enemy.js
    healthBar: {
        width: function () { return UI.rel.width(25); },
        height: function () { return UI.rel.height(1.25); },
        borderWidth: 2,
        innerMargin: 2,
        segmentGap: function () { return UI.rel.width(0.33); },
        y: function () { return UI.rel.y(2.5); },
        centerX: function () { return UI.rel.x(50); },
        startX: function () { return UI.rel.x(37.5); },
    },

    // EXP bar — right of timer, open left side
    expBar: {
        barWidth: function () { return UI.rel.width(25); },
        height: function () { return UI.rel.width(0.6); },
        borderWidth: 2,
        innerMargin: 2,
        y: function () { return UI.statusDisplay.timerY(); },
        leftEdge: function () { return UI.rel.x(50) + UI.statusDisplay.timerWidth() / 2 + 16; },
        rightEdge: function () { return this.leftEdge() + this.barWidth(); },
        width: function () { return this.barWidth(); },
        centerX: function () { return this.leftEdge() + this.width() / 2; },
        barColor: 0x00ffff,
    },

    // Timer — center
    statusDisplay: {
        timerY: function () { return UI.rel.y(5); },
        timerWidth: function () { return UI.rel.width(8); },
        timerHeight: function () { return UI.buttons.common.size(); },
        centerX: function () { return UI.rel.x(50); },
        borderWidth: 2,
        x: function () { return UI.rel.x(1.33); },
        scoreX: function () { return UI.rel.x(13.33); },
        scoreWidth: function () { return UI.rel.width(10); },
        height: function () { return UI.rel.height(2.5); },
        textPadding: function () { return UI.rel.width(0.33); },
        clockSymbol: "時",
        scoreSymbol: "点",
    },

    // Level — below timer, same row as stats
    levelDisplay: {
        y: function () { return UI.rel.y(10); },
        centerX: function () { return UI.rel.x(50); },
        barGap: function () { return UI.rel.width(1.2); },
        chevronHalfH: function () { return UI.rel.height(1.8); },
        chevronDepth: function () { return UI.rel.height(1.8) * 0.8; },
    },

    // Stats — 2+2 under HP bar and EXP bar
    statDisplay: {
        y: function () { return UI.statusDisplay.timerY() + UI.buttons.common.size() / 2 + UI.rel.height(2.5); },
        pairHalfSpacing: function () { return UI.rel.width(5); },
        chevronHH: function () { return UI.rel.height(2.2); },
        chevronDepth: function () { return UI.rel.height(2.8) * 0.8; },
        ringGap: 4,
        innerPad: function () { return UI.rel.width(0.8); },
        outerBorder: 2,
        innerBorder: 1,
        colorBorder: 1,
        symbols: { POW: "力", AGI: "速", LUK: "運", END: "耐" },
        symbolColors: { POW: "#cc0000", AGI: "#0088ff", LUK: "#aa55cc", END: "#00aa00" },
        fillColors: { POW: 0xcc0000, AGI: 0x0088ff, LUK: 0xaa55cc, END: 0x00aa00 },
        fontSize: function () { return UI.rel.fontSize(2.5); },
    },

    buttons: {
        common: {
            size: function () { return UI.rel.height(5); },
            borderWidth: 2,
            margin: function () {
                const longestDimension = Math.max(UI.game.getWidth(), UI.game.getHeight());
                return longestDimension * 0.02;
            },
            fontSize: function () { return UI.buttons.common.size() * 0.6; }
        },
        pause: {
            symbol: "休",
            x: function () { return UI.buttons.common.margin() + (UI.buttons.common.size() / 2); },
            y: function () { return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2); },
            fontSize: function () { return UI.buttons.common.fontSize(); }
        },
        music: {
            symbol: "音",
            mutedSymbol: "静",
            x: function () { return UI.game.getWidth() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2); },
            y: function () { return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2); },
            fontSize: function () { return UI.buttons.common.fontSize(); }
        },
        help: {
            symbol: "?",
            x: function () { return UI.buttons.common.margin() + (UI.buttons.common.size() / 2); },
            y: function () { return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2); },
            fontSize: function () { return UI.buttons.common.fontSize(); }
        },
        resume: {
            symbol: "続",
            x: function () { return UI.game.getWidth() / 2; },
            y: function () { return UI.game.getHeight() * 0.875; },
            fontSize: function () { return UI.buttons.common.fontSize() * 1.2; },
            size: function () { return UI.buttons.common.size() * 1.5; }
        }
    },

    colors: { gold: 0xFFD700, green: 0x00cc00, black: 0x000000, grey: 0x333333 },
    depth: { ui: 100 },

    fonts: {
        level: { size: function () { return `${UI.rel.fontSize(2.25)}px`; }, family: 'Arial', color: '#FFD700' },
        xpNeeded: { size: function () { return `${UI.rel.fontSize(1.5)}px`; }, family: 'Arial', color: '#00ffff' },
        stats: { size: function () { return `${UI.rel.fontSize(2.5)}px`; }, family: 'Arial', color: '#FFFFFF' },
        timer: { size: function () { return `${UI.rel.fontSize(3.6)}px`; }, family: 'Arial', color: '#FFFFFF' },
        kills: { size: function () { return `${UI.rel.fontSize(2.25)}px`; }, family: 'Arial', color: '#FFFFFF' },
        hpCount: { size: function () { return `${UI.rel.fontSize(3)}px`; }, family: 'Arial', color: '#FFD700' },
        xpCount: { size: function () { return `${UI.rel.fontSize(3)}px`; }, family: 'Arial', color: '#00ffff' },
        levelLabel: { size: function () { return `${UI.rel.fontSize(3.125)}px`; }, family: 'Arial', color: '#FFD700' },
        statValue: { size: function () { return `${UI.rel.fontSize(2.5)}px`; }, family: 'Arial', color: '#FFFFFF' }
    }
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function formatLargeNumber(number) {
    if (number < 10000) return number.toString();
    const kanjiUnits = [
        { value: 1000000000000, kanji: '兆' }, { value: 100000000, kanji: '億' },
        { value: 10000000, kanji: '千万' }, { value: 1000000, kanji: '百万' },
        { value: 10000, kanji: '万' }, { value: 1000, kanji: '千' },
        { value: 100, kanji: '百' }, { value: 10, kanji: '十' }
    ];
    for (const unit of kanjiUnits) {
        if (number >= unit.value) {
            const significantPart = Math.floor(number / unit.value);
            const remainder = number % unit.value;
            const nextUnit = kanjiUnits[kanjiUnits.indexOf(unit) + 1];
            if (significantPart >= 10 || !nextUnit || remainder < nextUnit.value) return `${significantPart}${unit.kanji}`;
            return `${significantPart}${unit.kanji}${Math.floor(remainder / nextUnit.value)}${nextUnit.kanji}`;
        }
    }
    return number.toString();
}

// Regular or elongated hexagon — used by buttons and boss bar.
// Only 4 of the 6 sides are drawn (top-left, left, right, top-right) so when
// the button is positioned at a screen corner the open bottom extends off-screen,
// producing the "partial clipped hexagon" look from the original UI.
function createHexagon(scene, x, y, size, fillColor = 0x000000, fillAlpha = 1.0, width = null, height = null) {
    const graphics = scene.add.graphics();
    graphics.x = x;
    graphics.y = y;

    let points;

    if (width !== null && height !== null) {
        const chamferY = height * 0.25;
        const chamferX = chamferY * Math.sqrt(3);
        const hw = width / 2, hh = height / 2;
        points = [
            { x: -hw + chamferX, y: -hh },   // [0] Top-left chamfered
            { x: hw - chamferX, y: -hh },   // [1] Top-right chamfered
            { x: hw, y: 0 },   // [2] Right mid — replaced by: Top-right corner
            { x: hw - chamferX, y: hh },   // [3] Bottom-right chamfered
            { x: -hw + chamferX, y: hh },   // [4] Bottom-left chamfered
            { x: -hw, y: 0 },   // [5] Left mid
        ];
    } else {
        const hexWidth = size * 0.85;
        const hexHeight = size * 0.866;
        points = [
            { x: 0, y: -hexHeight / 2 },  // [0] Top
            { x: hexWidth / 2, y: -hexHeight / 4 },  // [1] Top-right
            { x: hexWidth / 2, y: hexHeight / 4 },  // [2] Bottom-right
            { x: 0, y: hexHeight / 2 },  // [3] Bottom
            { x: -hexWidth / 2, y: hexHeight / 4 },  // [4] Bottom-left
            { x: -hexWidth / 2, y: -hexHeight / 4 }   // [5] Top-left
        ];
    }

    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillPoints(points, true);

    graphics.lineStyle(3, UI.colors.gold, 1);

    if (width !== null && height !== null) {
        // Left side + top-left side
        graphics.beginPath(); graphics.moveTo(points[5].x, points[5].y); graphics.lineTo(points[0].x, points[0].y); graphics.strokePath();
        graphics.beginPath(); graphics.moveTo(points[0].x, points[0].y); graphics.lineTo(points[1].x, points[1].y); graphics.strokePath();
        // Right side + top-right side
        graphics.beginPath(); graphics.moveTo(points[1].x, points[1].y); graphics.lineTo(points[2].x, points[2].y); graphics.strokePath();
        graphics.beginPath(); graphics.moveTo(points[2].x, points[2].y); graphics.lineTo(points[3].x, points[3].y); graphics.strokePath();
    } else {
        // Left side [4]→[5] and top-left [5]→[0]
        graphics.beginPath(); graphics.moveTo(points[4].x, points[4].y); graphics.lineTo(points[5].x, points[5].y); graphics.strokePath();
        graphics.beginPath(); graphics.moveTo(points[5].x, points[5].y); graphics.lineTo(points[0].x, points[0].y); graphics.strokePath();
        // Right side [1]→[2] and bottom-right [2]→[3]
        graphics.beginPath(); graphics.moveTo(points[1].x, points[1].y); graphics.lineTo(points[2].x, points[2].y); graphics.strokePath();
        graphics.beginPath(); graphics.moveTo(points[2].x, points[2].y); graphics.lineTo(points[3].x, points[3].y); graphics.strokePath();
    }

    return graphics;
}

// ─────────────────────────────────────────────────────────────────
// HP Bar — 3-sided gold border (open right), transparent background,
//          transparent empty segments, HP count on LEFT side
// ─────────────────────────────────────────────────────────────────
const HealthBar = {
    create: function (scene) {
        UI.game.init(scene);
        if (scene.healthBarBg) scene.healthBarBg.destroy();
        if (scene.healthSegments) { scene.healthSegments.clear(true, true); scene.healthSegments.destroy(); }
        if (scene.healthSeparators) { scene.healthSeparators.clear(true, true); scene.healthSeparators.destroy(); }
        if (scene.hpCountText) scene.hpCountText.destroy();

        const leftEdge = UI.playerHpBar.leftEdge();
        const rightEdge = UI.playerHpBar.rightEdge();
        const width = UI.playerHpBar.width();
        const height = UI.playerHpBar.height();
        const bw = UI.playerHpBar.borderWidth;
        const innerMargin = UI.playerHpBar.innerMargin;
        const y = UI.playerHpBar.y();

        // Draw 3-sided gold border only — NO background fill so game shows through
        scene.healthBarBg = scene.add.graphics();
        scene.healthBarBg.lineStyle(bw, UI.colors.gold, 1);
        scene.healthBarBg.beginPath(); scene.healthBarBg.moveTo(leftEdge, y - height / 2); scene.healthBarBg.lineTo(rightEdge, y - height / 2); scene.healthBarBg.strokePath();
        scene.healthBarBg.beginPath(); scene.healthBarBg.moveTo(leftEdge, y + height / 2); scene.healthBarBg.lineTo(rightEdge, y + height / 2); scene.healthBarBg.strokePath();
        scene.healthBarBg.beginPath(); scene.healthBarBg.moveTo(leftEdge, y - height / 2); scene.healthBarBg.lineTo(leftEdge, y + height / 2); scene.healthBarBg.strokePath();
        scene.healthBarBg.setDepth(UI.depth.ui);

        scene.healthSegments = scene.add.group();
        scene.healthSeparators = scene.add.group();
        scene.healthBarInnerMargin = innerMargin;
        scene.healthBarLeftEdge = leftEdge;
        scene.healthBarRightEdge = rightEdge;

        // HP count on LEFT side of HP bar, vertically centered with timer
        scene.hpCountText = scene.add.text(
            leftEdge - UI.rel.width(0.5), y, `${playerHealth}`,
            { fontFamily: UI.fonts.hpCount.family, fontSize: UI.fonts.hpCount.size(), color: UI.fonts.hpCount.color }
        ).setOrigin(1, 0.5).setDepth(UI.depth.ui);

        this.update(scene);
    },

    update: function (scene) {
        if (!scene.healthSegments || !scene.healthSegments.scene) return;
        scene.healthSegments.clear(true, true);
        scene.healthSeparators.clear(true, true);

        const leftEdge = scene.healthBarLeftEdge ?? UI.playerHpBar.leftEdge();
        const rightEdge = scene.healthBarRightEdge ?? UI.playerHpBar.rightEdge();
        const height = UI.playerHpBar.height();
        const innerMargin = scene.healthBarInnerMargin ?? UI.playerHpBar.innerMargin;
        const y = UI.playerHpBar.y();

        const contentLeft = leftEdge + innerMargin;
        const contentRight = rightEdge - innerMargin;
        const contentWidth = contentRight - contentLeft;
        const contentHeight = height - innerMargin * 2;
        const segGap = UI.playerHpBar.segmentGap();
        const segWidth = Math.max(1, (contentWidth - (maxPlayerHealth - 1) * segGap) / maxPlayerHealth);

        for (let i = 0; i < maxPlayerHealth; i++) {
            const isFilled = i >= (maxPlayerHealth - playerHealth);
            const segX = contentLeft + i * (segWidth + segGap);

            // Only draw FILLED segments — empty slots stay transparent
            if (isFilled) {
                const segment = scene.add.graphics();
                segment.fillStyle(UI.colors.green, 1.0);
                segment.fillRect(segX, y - contentHeight / 2, segWidth, contentHeight);
                segment.setDepth(UI.depth.ui + 1);
                scene.healthSegments.add(segment);
            }

            if (i < maxPlayerHealth - 1) {
                const sepX = segX + segWidth + segGap / 2;
                const separator = scene.add.graphics();
                separator.fillStyle(UI.colors.gold, 1.0);
                separator.fillRect(sepX - 1, y - contentHeight / 2, 2, contentHeight);
                separator.setDepth(UI.depth.ui + 1);
                scene.healthSeparators.add(separator);
            }
        }

        if (scene.hpCountText) scene.hpCountText.setText(`${playerHealth}`);
    }
};

// ─────────────────────────────────────────────────────────────────
// EXP Bar — 3-sided gold border (open left), transparent background,
//           XP count on RIGHT side
// ─────────────────────────────────────────────────────────────────
const ExpBar = {
    create: function (scene) {
        UI.game.init(scene);
        if (scene.expBar) scene.expBar.destroy();
        if (scene.expBarBg) scene.expBarBg.destroy();
        if (scene.expBarInnerBg) scene.expBarInnerBg.destroy();
        if (scene.xpNeededText) scene.xpNeededText.destroy();
        if (scene.expText) scene.expText.destroy();
        if (scene.levelText) scene.levelText.destroy();

        const leftEdge = UI.expBar.leftEdge();
        const rightEdge = UI.expBar.rightEdge();
        const outerWidth = UI.expBar.width();
        const outerHeight = UI.expBar.height();
        const bw = UI.expBar.borderWidth;
        const innerMargin = UI.expBar.innerMargin;
        const y = UI.expBar.y();

        // 3-sided gold border only — NO background fill
        scene.expBarBg = scene.add.graphics();
        scene.expBarBg.lineStyle(bw, UI.colors.gold, 1);
        scene.expBarBg.beginPath(); scene.expBarBg.moveTo(leftEdge, y - outerHeight / 2); scene.expBarBg.lineTo(rightEdge, y - outerHeight / 2); scene.expBarBg.strokePath();
        scene.expBarBg.beginPath(); scene.expBarBg.moveTo(leftEdge, y + outerHeight / 2); scene.expBarBg.lineTo(rightEdge, y + outerHeight / 2); scene.expBarBg.strokePath();
        scene.expBarBg.beginPath(); scene.expBarBg.moveTo(rightEdge, y - outerHeight / 2); scene.expBarBg.lineTo(rightEdge, y + outerHeight / 2); scene.expBarBg.strokePath();
        scene.expBarBg.setDepth(UI.depth.ui);

        // EXP fill from left edge
        scene.expBar = scene.add.rectangle(
            leftEdge + innerMargin, y, 0, outerHeight - innerMargin * 2, UI.expBar.barColor
        ).setOrigin(0, 0.5).setDepth(UI.depth.ui + 1);

        // XP count on RIGHT side of EXP bar, vertically centered with timer
        scene.xpNeededText = scene.add.text(
            rightEdge + UI.rel.width(0.5), y, '',
            { fontFamily: UI.fonts.xpCount.family, fontSize: UI.fonts.xpCount.size(), color: UI.fonts.xpCount.color }
        ).setOrigin(0, 0.5).setDepth(UI.depth.ui);

        this.update(scene);
    },

    update: function (scene) {
        if (!scene.expBar) return;
        const outerWidth = UI.expBar.width();
        const innerMargin = UI.expBar.innerMargin;
        const contentWidth = outerWidth - innerMargin * 2;
        scene.expBar.width = Math.max(0, Math.min(1, heroExp / xpForNextLevel(playerLevel))) * contentWidth;
        if (scene.xpNeededText) {
            scene.xpNeededText.setText(formatLargeNumber(Math.max(0, xpForNextLevel(playerLevel) - heroExp)));
        }
    }
};

// ─────────────────────────────────────────────────────────────────
// Timer — < 00:00 >
// ─────────────────────────────────────────────────────────────────
const StatusDisplay = {
    create: function (scene) {
        UI.game.init(scene);
        if (scene.timerHexagon) scene.timerHexagon.destroy();
        if (scene.timerText) scene.timerText.destroy();
        if (scene.timerSymbol) scene.timerSymbol.destroy();
        if (scene.scoreHexagon) scene.scoreHexagon.destroy();
        if (scene.scoreText) scene.scoreText.destroy();
        if (scene.scoreSymbol) scene.scoreSymbol.destroy();

        const cx = UI.statusDisplay.centerX();
        const y = UI.statusDisplay.timerY();
        const timerW = UI.statusDisplay.timerWidth();
        const timerH = UI.statusDisplay.timerHeight();
        const arrowD = timerH * 0.38;
        const bw = 4;

        const g = scene.add.graphics();
        g.fillStyle(UI.colors.black, 0.6);
        g.fillRect(cx - timerW / 2, y - timerH / 2, timerW, timerH);
        g.lineStyle(bw, UI.colors.gold, 1);
        g.beginPath(); g.moveTo(cx - timerW / 2, y - timerH / 2); g.lineTo(cx - timerW / 2 - arrowD, y); g.lineTo(cx - timerW / 2, y + timerH / 2); g.strokePath();
        g.beginPath(); g.moveTo(cx + timerW / 2, y - timerH / 2); g.lineTo(cx + timerW / 2 + arrowD, y); g.lineTo(cx + timerW / 2, y + timerH / 2); g.strokePath();
        g.setDepth(UI.depth.ui + 2);
        scene.timerHexagon = g;

        scene.timerText = scene.add.text(cx, y, '00:00', {
            fontFamily: UI.fonts.timer.family, fontSize: UI.fonts.timer.size(), color: UI.fonts.timer.color
        }).setOrigin(0.5).setDepth(UI.depth.ui + 3);

        this.update(scene);
    },

    update: function (scene, time) {
        if (scene.timerText) scene.timerText.setText(formatTime(time ?? elapsedTime));
        LevelDisplay.update(scene);
    }
};

// ─────────────────────────────────────────────────────────────────
// Level Display — < N >
// ─────────────────────────────────────────────────────────────────
const LevelDisplay = {
    create: function (scene) {
        UI.game.init(scene);
        if (scene.levelText) scene.levelText.destroy();
        if (scene.levelBarLeft) scene.levelBarLeft.destroy();
        if (scene.levelBarRight) scene.levelBarRight.destroy();

        scene.levelText = scene.add.text(
            UI.levelDisplay.centerX(), UI.levelDisplay.y(), `${playerLevel}`,
            { fontFamily: UI.fonts.levelLabel.family, fontSize: UI.fonts.levelLabel.size(), color: UI.fonts.levelLabel.color, fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(UI.depth.ui + 1);

        scene.levelBarLeft = scene.add.graphics().setDepth(UI.depth.ui);
        scene.levelBarRight = scene.add.graphics().setDepth(UI.depth.ui);
        this.update(scene);
    },

    update: function (scene) {
        if (!scene.levelText) return;
        scene.levelText.setText(`${playerLevel}`);
        if (!scene.levelBarLeft || !scene.levelBarRight) return;

        const y = UI.levelDisplay.y();
        const cx = UI.levelDisplay.centerX();
        const gap = UI.levelDisplay.barGap();
        const hh = UI.levelDisplay.chevronHalfH();
        const d = UI.levelDisplay.chevronDepth();
        const bw = 3;
        const hw = scene.levelText.width / 2;

        scene.levelBarLeft.clear();
        scene.levelBarLeft.lineStyle(bw, UI.colors.gold, 1);
        const lx = cx - hw - gap;
        scene.levelBarLeft.beginPath(); scene.levelBarLeft.moveTo(lx, y - hh); scene.levelBarLeft.lineTo(lx - d, y); scene.levelBarLeft.lineTo(lx, y + hh); scene.levelBarLeft.strokePath();

        scene.levelBarRight.clear();
        scene.levelBarRight.lineStyle(bw, UI.colors.gold, 1);
        const rx = cx + hw + gap;
        scene.levelBarRight.beginPath(); scene.levelBarRight.moveTo(rx, y - hh); scene.levelBarRight.lineTo(rx + d, y); scene.levelBarRight.lineTo(rx, y + hh); scene.levelBarRight.strokePath();
    }
};

// ─────────────────────────────────────────────────────────────────
// Stat Display — 2+2 open chevrons (‹ N ›) style
// POW + AGI under HP bar   |   LUK + END under EXP bar
// 3 concentric chevron rings per stat, touching (ringGap=2)
// ─────────────────────────────────────────────────────────────────
const StatDisplay = {
    create: function (scene) {
        UI.game.init(scene);
        if (scene.statHexagons) {
            scene.statHexagons.forEach(item => {
                if (item.gLeft) item.gLeft.destroy();
                if (item.gRight) item.gRight.destroy();
                if (item.valueText) item.valueText.destroy();
            });
        }
        scene.statHexagons = [];

        const stats = [
            { key: 'POW', hexColor: UI.statDisplay.fillColors.POW },
            { key: 'AGI', hexColor: UI.statDisplay.fillColors.AGI },
            { key: 'LUK', hexColor: UI.statDisplay.fillColors.LUK },
            { key: 'END', hexColor: UI.statDisplay.fillColors.END },
        ];

        const y = UI.statDisplay.y();
        const hps = UI.statDisplay.pairHalfSpacing();

        // Anchor each pair to the center of its bar
        const hpCX = UI.playerHpBar.centerX();
        const expCX = UI.expBar.centerX();

        const xPositions = [
            hpCX - hps,  // POW
            hpCX + hps,  // AGI
            expCX - hps,  // LUK
            expCX + hps,  // END
        ];

        stats.forEach((stat, index) => {
            const x = xPositions[index];
            const gLeft = scene.add.graphics().setDepth(UI.depth.ui);
            const gRight = scene.add.graphics().setDepth(UI.depth.ui);
            this._drawOpenChevrons(gLeft, gRight, x, y, stat.hexColor);

            const valueText = scene.add.text(x, y, '0', {
                fontFamily: UI.fonts.statValue.family, fontSize: UI.fonts.statValue.size(),
                color: UI.fonts.statValue.color, fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(UI.depth.ui + 1);

            scene.statHexagons.push({ gLeft, gRight, valueText, key: stat.key });
        });

        this.update(scene);
    },

    // Draws 3 open chevron rings per side using the same technique as the timer borders:
    // lineStyle → beginPath → moveTo → lineTo → lineTo → strokePath (no fill, no polygons).
    // Rings shrink by ringGap each step so they sit touching with no black space between.
    _drawOpenChevrons: function (gL, gR, cx, cy, statColor) {
        const hh = UI.statDisplay.chevronHH();
        const d = UI.statDisplay.chevronDepth();
        const rg = UI.statDisplay.ringGap;
        const pad = UI.statDisplay.innerPad();

        const rings = [
            { bw: UI.statDisplay.outerBorder, color: UI.colors.gold },
            { bw: UI.statDisplay.colorBorder, color: statColor },
            { bw: UI.statDisplay.innerBorder, color: UI.colors.gold },
        ];

        rings.forEach((ring, i) => {
            const shrink = i * rg;
            const rHH = hh - shrink;
            const rD = d - shrink;
            if (rHH <= 0 || rD <= 0) return;

            // Left < : tip points left, open end faces number
            const ltip = cx - pad - d + shrink;
            const lbase = ltip + rD;
            gL.lineStyle(ring.bw, ring.color, 1);
            gL.beginPath(); gL.moveTo(lbase, cy - rHH); gL.lineTo(ltip, cy); gL.lineTo(lbase, cy + rHH); gL.strokePath();

            // Right > : mirrored
            const rtip = cx + pad + d - shrink;
            const rbase = rtip - rD;
            gR.lineStyle(ring.bw, ring.color, 1);
            gR.beginPath(); gR.moveTo(rbase, cy - rHH); gR.lineTo(rtip, cy); gR.lineTo(rbase, cy + rHH); gR.strokePath();
        });
    },

    update: function (scene) {
        if (!scene.statHexagons) return;
        scene.statHexagons.forEach(item => {
            let value = 0;
            switch (item.key) {
                case 'POW': value = getEffectiveDamage() ?? 0; break;
                case 'AGI': value = getEffectiveFireRate() ?? 0; break;
                case 'LUK': value = playerLuck ?? 0; break;
                case 'END': value = maxPlayerHealth ?? 0; break;
            }
            item.valueText.setText(Math.floor(value).toString());
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// Button Display — pure delegation to UnifiedButtonManager (help.js)
// menu.js creates NO buttons directly so there is no double-creation.
// createButton kept for pause.js compatibility (takes a config object).
// ─────────────────────────────────────────────────────────────────
const ButtonDisplay = {
    create: function (scene) {
        UI.game.init(scene);
        if (window.UnifiedButtonManager) {
            window.UnifiedButtonManager.createAllButtons(scene);
        }
    },

    createButton: function (scene, buttonConfig, onClickCallback, options = {}) {
        UI.game.init(scene);
        if (!buttonConfig || typeof buttonConfig !== 'object') return null;
        const size = buttonConfig.size ? buttonConfig.size() : UI.buttons.common.size() * 1.32;
        const depth = options.depth ?? 1002;
        const visible = options.visible ?? true;
        const x = typeof buttonConfig.x === 'function' ? buttonConfig.x() : 0;
        const y = typeof buttonConfig.y === 'function' ? buttonConfig.y() : 0;
        const fs = typeof buttonConfig.fontSize === 'function' ? buttonConfig.fontSize() : 24;

        const hexagon = createHexagon(scene, x, y, size, 0x000000, 0.5);
        hexagon.setDepth(depth - 1).setVisible(visible);

        const buttonText = scene.add.text(x, y, buttonConfig.symbol || '', {
            fontFamily: 'Arial', fontSize: `${fs}px`, color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(depth).setVisible(visible);

        hexagon.setInteractive(new Phaser.Geom.Circle(0, 0, size * 0.8), Phaser.Geom.Circle.Contains, { useHandCursor: true });
        hexagon.on('pointerover', function () { buttonText.setColor('#ffff00'); buttonText.setScale(1.1); });
        hexagon.on('pointerout', function () { buttonText.setColor('#ffffff'); buttonText.setScale(1); });
        if (onClickCallback) hexagon.on('pointerdown', onClickCallback);

        return {
            hexagon, text: buttonText,
            setVisible: function (v) { hexagon.setVisible(v); buttonText.setVisible(v); },
            destroy: function () { if (hexagon) hexagon.destroy(); if (buttonText) buttonText.destroy(); }
        };
    },

    update: function (scene) {
        if (window.UnifiedButtonManager && window.UnifiedButtonManager.buttons) {
            window.UnifiedButtonManager.updateButtonPositions(scene);
        }
    }
};

// ─────────────────────────────────────────────────────────────────
// createUI / resizeUI / exports
// ─────────────────────────────────────────────────────────────────
function createUI(scene) {
    UI.game.init(scene);
    HealthBar.create(scene);
    ExpBar.create(scene);
    StatusDisplay.create(scene);
    LevelDisplay.create(scene);
    StatDisplay.create(scene);
    ButtonDisplay.create(scene);
}

function resizeUI(scene) { createUI(scene); }

window.GameUI = {
    createUI: createUI,
    updateHealthBar: HealthBar.update,
    updateExpBar: ExpBar.update,
    updateStatusDisplay: StatusDisplay.update,
    updateStatCircles: StatDisplay.update,
    updateButtons: ButtonDisplay.update,
    resize: resizeUI
};

window.ButtonDisplay = ButtonDisplay;

// ─────────────────────────────────────────────────────────────────
// Game End Screen config + GameEndMenu (required by playerhit.js)
// ─────────────────────────────────────────────────────────────────
UI.gameEndScreen = {
    width: function () { return Math.max(UI.rel.width(50), 600); },
    height: function () { return UI.rel.height(64); },
    y: function () { return UI.rel.y(50); },
    x: function () { return UI.rel.x(50); },
    borderWidth: 4,
    innerPadding: function () { return UI.rel.width(2); },
    scaleFactor: function () {
        const minScale = 0.8;
        return Math.max(minScale, UI.game.getWidth() / 1200);
    },
    fontSizes: {
        title: function () { return `${UI.rel.fontSize(4) * UI.gameEndScreen.scaleFactor()}px`; },
        kanjiLarge: function () { return `${UI.rel.fontSize(6) * UI.gameEndScreen.scaleFactor()}px`; },
        subtitle: function () { return `${UI.rel.fontSize(3) * UI.gameEndScreen.scaleFactor()}px`; },
        stats: function () { return `${UI.rel.fontSize(2.5) * UI.gameEndScreen.scaleFactor()}px`; },
        button: function () { return `${UI.rel.fontSize(3) * UI.gameEndScreen.scaleFactor()}px`; }
    }
};

const GameEndMenu = {
    elements: {
        container: null, background: null, borderRect: null,
        heroKanji: null, titleText: null, subtitleText: null,
        enemyKanji: null, statsText: null, restartButton: null, restartButtonBorder: null
    },
    enterKeyHandler: null,

    create: function (scene, isVictory = false, enemyKanji = null, bossKanji = null) {
        this.destroy();
        this.elements.container = scene.add.container(0, 0);
        this.elements.container.setDepth(1000);

        const fullscreenBg = scene.add.rectangle(
            UI.game.getWidth() / 2, UI.game.getHeight() / 2,
            UI.game.getWidth(), UI.game.getHeight(), 0x000000, 0.7
        );
        this.elements.container.add(fullscreenBg);

        this.elements.background = scene.add.rectangle(
            UI.gameEndScreen.x(), UI.gameEndScreen.y(),
            UI.gameEndScreen.width(), UI.gameEndScreen.height(), 0x000000
        );
        this.elements.container.add(this.elements.background);

        this.elements.borderRect = scene.add.rectangle(
            UI.gameEndScreen.x(), UI.gameEndScreen.y(),
            UI.gameEndScreen.width(), UI.gameEndScreen.height()
        );
        this.elements.borderRect.setStrokeStyle(UI.gameEndScreen.borderWidth, 0xFFD700);
        this.elements.container.add(this.elements.borderRect);

        if (isVictory) { this.createVictoryContent(scene, bossKanji); }
        else { this.createDefeatContent(scene, enemyKanji); }

        this.createRestartButton(scene);
        this.setupKeyboardHandler(scene);
        return this.elements.container;
    },

    createEndGameContent: function (scene, options) {
        const config = {
            isVictory: false, titleText: '', subtitleText: '', enemyKanji: '敵', statsTemplate: '',
            ...options
        };
        const centerX = UI.gameEndScreen.x();
        const centerY = UI.gameEndScreen.y();
        const lineSpacing = UI.gameEndScreen.height() / 8;

        this.elements.heroKanji = scene.add.text(centerX, centerY - lineSpacing * 3, HERO_CHARACTER, {
            fontFamily: 'Arial', fontSize: UI.gameEndScreen.fontSizes.kanjiLarge(), color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.elements.container.add(this.elements.heroKanji);

        this.elements.titleText = scene.add.text(centerX, centerY - lineSpacing * 2, config.titleText, {
            fontFamily: 'Arial', fontSize: UI.gameEndScreen.fontSizes.title(), color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.elements.container.add(this.elements.titleText);

        this.elements.subtitleText = scene.add.text(centerX, centerY - lineSpacing, config.subtitleText, {
            fontFamily: 'Arial', fontSize: UI.gameEndScreen.fontSizes.subtitle(), color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.elements.container.add(this.elements.subtitleText);

        this.elements.enemyKanji = scene.add.text(centerX, centerY, config.enemyKanji, {
            fontFamily: 'Arial', fontSize: UI.gameEndScreen.fontSizes.kanjiLarge(), color: '#FF5555', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.elements.container.add(this.elements.enemyKanji);

        this.elements.statsText = scene.add.text(centerX, centerY + lineSpacing * 1.5, config.statsTemplate, {
            fontFamily: 'Arial', fontSize: UI.gameEndScreen.fontSizes.stats(), color: '#FFD700', align: 'center'
        }).setOrigin(0.5);
        this.elements.container.add(this.elements.statsText);

        if (window.ScoreSystem) {
            const sc = ScoreSystem.calculateScore(config.isVictory);
            ScoreSystem.animateScoreReveal(scene, this.elements.statsText, sc, config.isVictory);
        }
    },

    createVictoryContent: function (scene, bossKanji) {
        const bossSymbol = bossKanji ?? (activeBoss?.text ?? '魔');
        this.createEndGameContent(scene, {
            isVictory: true, titleText: 'ESCAPED THE LOOP', subtitleText: 'VANQUISHING',
            enemyKanji: bossSymbol, statsTemplate: `IN ${formatTime(elapsedTime)}          FREED ${score}`
        });
    },

    createDefeatContent: function (scene, enemyKanji) {
        const enemySymbol = enemyKanji ?? '敵';
        this.createEndGameContent(scene, {
            isVictory: false, titleText: 'FOUND THEIR DEMISE', subtitleText: 'AT THE HANDS OF',
            enemyKanji: enemySymbol, statsTemplate: `SURVIVED ${formatTime(elapsedTime)}          DEFEATED ${score}`
        });
    },

    createRestartButton: function (scene) {
        const buttonY = UI.gameEndScreen.y() + UI.gameEndScreen.height() / 2.5;
        const buttonX = UI.gameEndScreen.x();
        const pad = 20;

        this.elements.restartButton = scene.add.text(buttonX, buttonY, 'RESTART THE LOOP', {
            fontFamily: 'Arial', fontSize: UI.gameEndScreen.fontSizes.button(), color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.elements.restartButtonBorder = scene.add.rectangle(
            buttonX, buttonY,
            this.elements.restartButton.width + pad * 2,
            this.elements.restartButton.height + pad * 2
        );
        this.elements.restartButtonBorder.setStrokeStyle(2, 0xFFD700);
        this.elements.container.add(this.elements.restartButtonBorder);
        this.elements.container.add(this.elements.restartButton);

        this.elements.restartButtonBorder.setInteractive({ useHandCursor: true });
        this.elements.restartButtonBorder.on('pointerover', () => {
            this.elements.restartButton.setColor('#FFFFFF');
            this.elements.restartButtonBorder.setStrokeStyle(3, 0xFFD700);
            scene.tweens.add({ targets: [this.elements.restartButton, this.elements.restartButtonBorder], scale: 1.05, duration: 100 });
        });
        this.elements.restartButtonBorder.on('pointerout', () => {
            this.elements.restartButton.setColor('#FFD700');
            this.elements.restartButtonBorder.setStrokeStyle(2, 0xFFD700);
            scene.tweens.add({ targets: [this.elements.restartButton, this.elements.restartButtonBorder], scale: 1, duration: 100 });
        });
        this.elements.restartButtonBorder.on('pointerdown', function () {
            const animationSkipped = window.ScoreSystem?.skipToFinalScore?.() || false;
            if (animationSkipped) { scene.time.delayedCall(250, () => startGame.call(scene)); }
            else { startGame.call(scene); }
        });
    },

    setupKeyboardHandler: function (scene) {
        this.cleanupKeyboardHandler();
        this.enterKeyHandler = function (event) {
            if (event.key === 'Enter') { GameEndMenu.cleanupKeyboardHandler(); startGame.call(scene); }
        };
        window.addEventListener('keydown', this.enterKeyHandler);
    },

    showVictoryScreen: function (scene) {
        return this.create(scene, true, null, activeBoss ? activeBoss.text : null);
    },

    showDefeatScreen: function (scene, enemyKanji) {
        return this.create(scene, false, enemyKanji);
    },

    cleanupKeyboardHandler: function () {
        if (this.enterKeyHandler) {
            window.removeEventListener('keydown', this.enterKeyHandler);
            this.enterKeyHandler = null;
        }
    },

    destroy: function () {
        this.cleanupKeyboardHandler();
        if (this.elements.container) this.elements.container.destroy();
        Object.keys(this.elements).forEach(key => { this.elements[key] = null; });
    }
};

window.GameEndMenu = GameEndMenu;

// Start screen buttons
const StartButtonsDisplay = {
    create: function (scene) {
        UI.game.init(scene);
        if (window.HelpButtonManager) {
            window.HelpButtonManager.createHelpButton(scene);
            window.HelpButtonManager.showHelpButton(scene);
        }
    }
};

window.StartButtonsDisplay = StartButtonsDisplay;