// menu.js - UI Elements for KAJISU

// UI Element constants with relative positioning
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

    // Player HP bar — left of timer, 20% wide, segments fill right-to-left (last HP nearest timer)
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

    // Legacy health bar config — preserved for boss health bar compatibility in enemy.js
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

    // EXP bar — right of timer, symmetrical with HP bar (20% wide), thinner
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

    // Timer — front and center
    statusDisplay: {
        timerY: function () { return UI.rel.y(5); },
        timerWidth: function () { return UI.rel.width(8); },
        timerHeight: function () { return UI.buttons.common.size(); },
        centerX: function () { return UI.rel.x(50); },
        borderWidth: 2,
        // Legacy properties for compatibility with any external references
        x: function () { return UI.rel.x(1.33); },
        scoreX: function () { return UI.rel.x(13.33); },
        scoreWidth: function () { return UI.rel.width(10); },
        height: function () { return UI.rel.height(2.5); },
        textPadding: function () { return UI.rel.width(0.33); },
        clockSymbol: "時",
        scoreSymbol: "点",
    },

    // Level display — centered below timer with flanking gold bars
    levelDisplay: {
        y: function () { return UI.rel.y(10); },
        centerX: function () { return UI.rel.x(50); },
        barGap: function () { return UI.rel.width(1.2); },
        chevronHalfH: function () { return UI.rel.height(1.8); },
        chevronDepth: function () { return UI.rel.height(1.8) * 0.8; },
    },

    // Stat display — 4 open-chevron badges: ‹‹‹ number ›››  (like level display but 3 rings)
    statDisplay: {
        y: function () { return UI.rel.y(15); },
        chevronHH: function () { return UI.rel.height(2.2); },   // arm half-height
        chevronDepth: function () { return UI.rel.height(2.8) * 0.8; },// horizontal depth of tip
        ringGap: 4,       // px between concentric rings
        innerPad: function () { return UI.rel.width(0.8); },       // space between innermost ring and number
        badgeSpacing: function () { return UI.rel.width(6); },   // center-to-center spacing
        centerX: function () { return UI.rel.x(50); },
        outerBorder: 2,
        innerBorder: 1,
        colorBorder: 1,
        symbols: {
            POW: "力",
            AGI: "速",
            LUK: "運",
            END: "耐"
        },
        symbolColors: {
            POW: "#cc0000",
            AGI: "#0088ff",
            LUK: "#aa55cc",
            END: "#00aa00"
        },
        fillColors: {
            POW: 0xcc0000,
            AGI: 0x0088ff,
            LUK: 0xaa55cc,
            END: 0x00aa00
        },
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
            x: function () {
                return UI.buttons.common.margin() + (UI.buttons.common.size() / 2);
            },
            y: function () {
                return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
            fontSize: function () { return UI.buttons.common.fontSize(); }
        },
        music: {
            symbol: "音",
            mutedSymbol: "静",
            x: function () {
                return UI.game.getWidth() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
            y: function () {
                return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
            fontSize: function () { return UI.buttons.common.fontSize(); }
        },
        help: {
            symbol: "?",
            x: function () {
                return UI.buttons.common.margin() + (UI.buttons.common.size() / 2);
            },
            y: function () {
                return UI.game.getHeight() - UI.buttons.common.margin() - (UI.buttons.common.size() / 2);
            },
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

    colors: {
        gold: 0xFFD700,
        green: 0x00cc00,
        black: 0x000000,
        grey: 0x333333
    },

    depth: {
        ui: 100
    },

    fonts: {
        level: {
            size: function () { return `${UI.rel.fontSize(2.25)}px`; },
            family: 'Arial',
            color: '#FFD700'
        },
        xpNeeded: {
            size: function () { return `${UI.rel.fontSize(1.5)}px`; },
            family: 'Arial',
            color: '#00ffff'
        },
        stats: {
            size: function () { return `${UI.rel.fontSize(2.5)}px`; },
            family: 'Arial',
            color: '#FFFFFF'
        },
        timer: {
            size: function () { return `${UI.rel.fontSize(3.6)}px`; },
            family: 'Arial',
            color: '#FFFFFF'
        },
        kills: {
            size: function () { return `${UI.rel.fontSize(2.25)}px`; },
            family: 'Arial',
            color: '#FFFFFF'
        },
        hpCount: {
            size: function () { return `${UI.rel.fontSize(3)}px`; },
            family: 'Arial',
            color: '#FFD700'
        },
        xpCount: {
            size: function () { return `${UI.rel.fontSize(3)}px`; },
            family: 'Arial',
            color: '#00ffff'
        },
        levelLabel: {
            size: function () { return `${UI.rel.fontSize(3.125)}px`; },
            family: 'Arial',
            color: '#FFD700'
        },
        statValue: {
            size: function () { return `${UI.rel.fontSize(2.5)}px`; },
            family: 'Arial',
            color: '#FFFFFF'
        }
    }
};

// Format large numbers using kanji units
function formatLargeNumber(number) {
    if (number < 10000) return number.toString();

    const kanjiUnits = [
        { value: 1000000000000, kanji: '兆' },
        { value: 100000000, kanji: '億' },
        { value: 10000000, kanji: '千万' },
        { value: 1000000, kanji: '百万' },
        { value: 10000, kanji: '万' },
        { value: 1000, kanji: '千' },
        { value: 100, kanji: '百' },
        { value: 10, kanji: '十' }
    ];

    for (const unit of kanjiUnits) {
        if (number >= unit.value) {
            const significantPart = Math.floor(number / unit.value);
            const remainder = number % unit.value;
            const nextUnit = kanjiUnits[kanjiUnits.indexOf(unit) + 1];

            if (significantPart >= 10 || !nextUnit || remainder < nextUnit.value) {
                return `${significantPart}${unit.kanji}`;
            }
            const nextSignificant = Math.floor(remainder / nextUnit.value);
            return `${significantPart}${unit.kanji}${nextSignificant}${nextUnit.kanji}`;
        }
    }

    return number.toString();
}

// Unified hexagon creation — supports regular and elongated hexagons
function createHexagon(scene, x, y, size, fillColor = 0x000000, fillAlpha = 1.0, width = null, height = null) {
    const graphics = scene.add.graphics();

    graphics.x = x;
    graphics.y = y;

    if (width !== null && height !== null) {
        const chamferY = height * 0.25;
        const chamferX = chamferY * Math.sqrt(3);
        const hw = width / 2;
        const hh = height / 2;

        const points = [
            { x: -hw + chamferX, y: -hh },
            { x: hw - chamferX, y: -hh },
            { x: hw, y: 0 },
            { x: hw - chamferX, y: hh },
            { x: -hw + chamferX, y: hh },
            { x: -hw, y: 0 }
        ];

        graphics.fillStyle(fillColor, fillAlpha);
        graphics.fillPoints(points, true);

        graphics.lineStyle(2, UI.colors.gold, 1);

        for (let i = 0; i < points.length; i++) {
            const next = points[(i + 1) % points.length];
            graphics.beginPath();
            graphics.moveTo(points[i].x, points[i].y);
            graphics.lineTo(next.x, next.y);
            graphics.strokePath();
        }
    } else {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 180) * (60 * i - 30);
            points.push({ x: size * Math.cos(angle), y: size * Math.sin(angle) });
        }

        graphics.fillStyle(fillColor, fillAlpha);
        graphics.fillPoints(points, true);

        graphics.lineStyle(2, UI.colors.gold, 1);
        for (let i = 0; i < points.length; i++) {
            const next = points[(i + 1) % points.length];
            graphics.beginPath();
            graphics.moveTo(points[i].x, points[i].y);
            graphics.lineTo(next.x, next.y);
            graphics.strokePath();
        }
    }

    return graphics;
}

// ─────────────────────────────────────────────────────────────────
// HP Bar — left of timer, right-to-left fill (last HP nearest timer)
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
        const borderWidth = UI.playerHpBar.borderWidth;
        const innerMargin = UI.playerHpBar.innerMargin;
        const y = UI.playerHpBar.y();

        scene.healthBarBg = scene.add.graphics();
        scene.healthBarBg.fillStyle(UI.colors.black, 0.5);
        scene.healthBarBg.fillRect(leftEdge, y - height / 2, width, height);
        // Gold border on 3 sides only — right side (nearest timer) is open
        scene.healthBarBg.lineStyle(borderWidth, UI.colors.gold, 1);
        scene.healthBarBg.beginPath();
        scene.healthBarBg.moveTo(leftEdge, y - height / 2);
        scene.healthBarBg.lineTo(rightEdge, y - height / 2);
        scene.healthBarBg.strokePath();
        scene.healthBarBg.beginPath();
        scene.healthBarBg.moveTo(leftEdge, y + height / 2);
        scene.healthBarBg.lineTo(rightEdge, y + height / 2);
        scene.healthBarBg.strokePath();
        scene.healthBarBg.beginPath();
        scene.healthBarBg.moveTo(leftEdge, y - height / 2);
        scene.healthBarBg.lineTo(leftEdge, y + height / 2);
        scene.healthBarBg.strokePath();
        scene.healthBarBg.setDepth(UI.depth.ui);

        scene.healthSegments = scene.add.group();
        scene.healthSeparators = scene.add.group();
        scene.healthBarInnerMargin = innerMargin;
        scene.healthBarLeftEdge = leftEdge;
        scene.healthBarRightEdge = rightEdge;

        // HP count tucked into bottom-right corner (nearest timer)
        // Y anchored to timer height so it aligns with XP count
        const timerH_hp = UI.statusDisplay.timerHeight();
        scene.hpCountText = scene.add.text(
            rightEdge - UI.rel.width(1),
            y + timerH_hp / 2 + UI.rel.height(0.4),
            `${playerHealth}`,
            {
                fontFamily: UI.fonts.hpCount.family,
                fontSize: UI.fonts.hpCount.size(),
                color: UI.fonts.hpCount.color
            }
        ).setOrigin(1, 0).setDepth(UI.depth.ui);

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
        const totalGaps = (maxPlayerHealth - 1) * segGap;
        const segWidth = Math.max(1, (contentWidth - totalGaps) / maxPlayerHealth);

        // Rightmost segment = last HP (nearest timer), filled last as health drops
        for (let i = 0; i < maxPlayerHealth; i++) {
            const isFilled = i >= (maxPlayerHealth - playerHealth);
            const segX = contentLeft + i * (segWidth + segGap);

            const segment = scene.add.graphics();
            segment.fillStyle(isFilled ? UI.colors.green : UI.colors.grey, 1.0);
            segment.fillRect(segX, y - contentHeight / 2, segWidth, contentHeight);
            segment.setDepth(UI.depth.ui + 1);
            scene.healthSegments.add(segment);

            if (i < maxPlayerHealth - 1) {
                const sepX = segX + segWidth + segGap / 2;
                const separator = scene.add.graphics();
                separator.fillStyle(UI.colors.gold, 1.0);
                separator.fillRect(sepX - 1, y - contentHeight / 2, 2, contentHeight);
                separator.setDepth(UI.depth.ui + 1);
                scene.healthSeparators.add(separator);
            }
        }

        if (scene.hpCountText) {
            scene.hpCountText.setText(`${playerHealth}`);
        }
    }
};

// ─────────────────────────────────────────────────────────────────
// EXP Bar — right of timer, fills left-to-right
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
        const outerWidth = UI.expBar.width();
        const outerHeight = UI.expBar.height();
        const borderWidth = UI.expBar.borderWidth;
        const innerMargin = UI.expBar.innerMargin;
        const y = UI.expBar.y();
        const centerX = UI.expBar.centerX();

        const rightEdge = UI.expBar.rightEdge();

        // Draw background fill + 3-sided gold border (no left side — open toward timer)
        scene.expBarBg = scene.add.graphics();
        scene.expBarBg.fillStyle(UI.colors.black, 1);
        scene.expBarBg.fillRect(leftEdge, y - outerHeight / 2, outerWidth, outerHeight);
        scene.expBarBg.lineStyle(borderWidth, UI.colors.gold, 1);
        scene.expBarBg.beginPath();
        scene.expBarBg.moveTo(leftEdge, y - outerHeight / 2);
        scene.expBarBg.lineTo(rightEdge, y - outerHeight / 2);
        scene.expBarBg.strokePath();
        scene.expBarBg.beginPath();
        scene.expBarBg.moveTo(leftEdge, y + outerHeight / 2);
        scene.expBarBg.lineTo(rightEdge, y + outerHeight / 2);
        scene.expBarBg.strokePath();
        scene.expBarBg.beginPath();
        scene.expBarBg.moveTo(rightEdge, y - outerHeight / 2);
        scene.expBarBg.lineTo(rightEdge, y + outerHeight / 2);
        scene.expBarBg.strokePath();
        scene.expBarBg.setDepth(UI.depth.ui);

        // EXP fill — originates from the left content edge (no left border so content starts right at leftEdge + margin)
        const contentStartX = leftEdge + innerMargin;
        scene.expBar = scene.add.rectangle(
            contentStartX, y,
            0,
            outerHeight - innerMargin * 2,
            UI.expBar.barColor
        ).setOrigin(0, 0.5).setDepth(UI.depth.ui + 1);

        // XP remaining tucked into bottom-left corner (nearest timer)
        // Y anchored to timer height so it aligns with HP count
        const timerH_xp = UI.statusDisplay.timerHeight();
        scene.xpNeededText = scene.add.text(
            leftEdge + UI.rel.width(1),
            y + timerH_xp / 2 + UI.rel.height(0.4),
            '',
            {
                fontFamily: UI.fonts.xpCount.family,
                fontSize: UI.fonts.xpCount.size(),
                color: UI.fonts.xpCount.color
            }
        ).setOrigin(0, 0).setDepth(UI.depth.ui);

        this.update(scene);
    },

    update: function (scene) {
        if (!scene.expBar) return;

        const outerWidth = UI.expBar.width();
        const innerMargin = UI.expBar.innerMargin;
        const contentWidth = outerWidth - innerMargin * 2;

        const expPct = Math.max(0, Math.min(1, heroExp / xpForNextLevel(playerLevel)));
        scene.expBar.width = expPct * contentWidth;

        if (scene.xpNeededText) {
            const xpRemaining = xpForNextLevel(playerLevel) - heroExp;
            scene.xpNeededText.setText(formatLargeNumber(Math.max(0, xpRemaining)));
        }
    }
};

// ─────────────────────────────────────────────────────────────────
// Status Display — timer only, front and center
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
        const arrowDepth = timerH * 0.38;
        const bw = 4; // border thickness

        // Draw: black background rect + only the < and > chevron borders
        const g = scene.add.graphics();

        // Black semi-transparent background
        g.fillStyle(UI.colors.black, 0.6);
        g.fillRect(cx - timerW / 2, y - timerH / 2, timerW, timerH);

        // Left < chevron
        g.lineStyle(bw, UI.colors.gold, 1);
        g.beginPath();
        g.moveTo(cx - timerW / 2, y - timerH / 2);
        g.lineTo(cx - timerW / 2 - arrowDepth, y);
        g.lineTo(cx - timerW / 2, y + timerH / 2);
        g.strokePath();

        // Right > chevron
        g.beginPath();
        g.moveTo(cx + timerW / 2, y - timerH / 2);
        g.lineTo(cx + timerW / 2 + arrowDepth, y);
        g.lineTo(cx + timerW / 2, y + timerH / 2);
        g.strokePath();

        g.setDepth(UI.depth.ui + 2);
        scene.timerHexagon = g;

        scene.timerText = scene.add.text(cx, y, '00:00', {
            fontFamily: UI.fonts.timer.family,
            fontSize: UI.fonts.timer.size(),
            color: UI.fonts.timer.color
        }).setOrigin(0.5).setDepth(UI.depth.ui + 3);

        this.update(scene);
    },

    update: function (scene, time) {
        if (scene.timerText) {
            scene.timerText.setText(formatTime(time ?? elapsedTime));
        }
        LevelDisplay.update(scene);
    }
};

// ─────────────────────────────────────────────────────────────────
// Level Display — centered below timer with < > chevron borders
// ─────────────────────────────────────────────────────────────────
const LevelDisplay = {
    create: function (scene) {
        UI.game.init(scene);

        if (scene.levelText) scene.levelText.destroy();
        if (scene.levelBarLeft) scene.levelBarLeft.destroy();
        if (scene.levelBarRight) scene.levelBarRight.destroy();

        const y = UI.levelDisplay.y();
        const cx = UI.levelDisplay.centerX();

        scene.levelText = scene.add.text(cx, y, `${playerLevel}`, {
            fontFamily: UI.fonts.levelLabel.family,
            fontSize: UI.fonts.levelLabel.size(),
            color: UI.fonts.levelLabel.color,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(UI.depth.ui + 1);

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
        const depth = UI.levelDisplay.chevronDepth();
        const bw = 3;

        // Half the text width (after setText, width is available)
        const hw = scene.levelText.width / 2;

        scene.levelBarLeft.clear();
        scene.levelBarLeft.lineStyle(bw, UI.colors.gold, 1);
        // < left of text
        const lx = cx - hw - gap;
        scene.levelBarLeft.beginPath();
        scene.levelBarLeft.moveTo(lx, y - hh);
        scene.levelBarLeft.lineTo(lx - depth, y);
        scene.levelBarLeft.lineTo(lx, y + hh);
        scene.levelBarLeft.strokePath();

        scene.levelBarRight.clear();
        scene.levelBarRight.lineStyle(bw, UI.colors.gold, 1);
        // > right of text
        const rx = cx + hw + gap;
        scene.levelBarRight.beginPath();
        scene.levelBarRight.moveTo(rx, y - hh);
        scene.levelBarRight.lineTo(rx + depth, y);
        scene.levelBarRight.lineTo(rx, y + hh);
        scene.levelBarRight.strokePath();
    }
};

// ─────────────────────────────────────────────────────────────────
// Stat Display — open < number > style per stat, 3 concentric chevron rings each side
// Identical drawing technique to timer and level chevrons.
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

        const spacing = UI.statDisplay.badgeSpacing();
        const y = UI.statDisplay.y();
        const cx = UI.statDisplay.centerX();
        const total = stats.length;
        // Center the row: position badges symmetrically around cx
        const startX = cx - (total - 1) / 2 * spacing;

        stats.forEach((stat, index) => {
            const x = startX + index * spacing;

            const gLeft = scene.add.graphics().setDepth(UI.depth.ui);
            const gRight = scene.add.graphics().setDepth(UI.depth.ui);
            this._drawOpenChevrons(gLeft, gRight, x, y, stat.hexColor);

            const valueText = scene.add.text(x, y, '0', {
                fontFamily: UI.fonts.statValue.family,
                fontSize: UI.fonts.statValue.size(),
                color: UI.fonts.statValue.color,
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(UI.depth.ui + 1);

            scene.statHexagons.push({ gLeft, gRight, valueText, key: stat.key });
        });

        this.update(scene);
    },

    // Draw the 3-ring open left-chevron and right-chevron for one stat badge.
    // Each ring: beginPath / moveTo / lineTo / lineTo / strokePath — exactly like the timer.
    _drawOpenChevrons: function (gL, gR, cx, cy, statColor) {
        const hh = UI.statDisplay.chevronHH();
        const d = UI.statDisplay.chevronDepth();
        const rg = UI.statDisplay.ringGap;
        const pad = UI.statDisplay.innerPad();

        // Ring offsets: ring 0 = outer gold (outerBorder width), ring 1 = stat color, ring 2 = inner gold
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

            // Left < chevron — tip points left, base (open end) faces the number
            const lx = cx - pad - d;   // tip x of outermost ring, shifted by ring offset
            const ltip = lx + shrink;  // this ring's tip
            const lbase = ltip + rD;   // this ring's base x

            gL.lineStyle(ring.bw, ring.color, 1);
            gL.beginPath();
            gL.moveTo(lbase, cy - rHH);
            gL.lineTo(ltip, cy);
            gL.lineTo(lbase, cy + rHH);
            gL.strokePath();

            // Right > chevron — mirrored
            const rx = cx + pad + d;
            const rtip = rx - shrink;
            const rbase = rtip - rD;

            gR.lineStyle(ring.bw, ring.color, 1);
            gR.beginPath();
            gR.moveTo(rbase, cy - rHH);
            gR.lineTo(rtip, cy);
            gR.lineTo(rbase, cy + rHH);
            gR.strokePath();
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
// Button Display — delegates entirely to UnifiedButtonManager.
// menu.js creates NO buttons of its own; all button logic lives in help.js.
// createButton kept with original object-signature for pause.js compat.
// ─────────────────────────────────────────────────────────────────
const ButtonDisplay = {
    create: function (scene) {
        UI.game.init(scene);
        if (window.UnifiedButtonManager) {
            window.UnifiedButtonManager.createAllButtons(scene);
        }
        // If UnifiedButtonManager is absent, buttons are simply not created here —
        // they will be created by whatever system owns them.
    },

    // Called by pause.js / other systems with the original (scene, buttonConfig, cb, opts) signature.
    createButton: function (scene, buttonConfig, onClickCallback, options = {}) {
        UI.game.init(scene);
        if (!buttonConfig || typeof buttonConfig !== 'object') return null;

        const defaults = {
            depth: 1002,
            visible: true,
            size: buttonConfig.size ? buttonConfig.size() : UI.buttons.common.size() * 1.32
        };
        const config = { ...defaults, ...options };
        const x = typeof buttonConfig.x === 'function' ? buttonConfig.x() : 0;
        const y = typeof buttonConfig.y === 'function' ? buttonConfig.y() : 0;

        const hexagon = createHexagon(scene, x, y, config.size, 0x000000, 0.5);
        hexagon.setDepth(config.depth - 1);
        hexagon.setVisible(config.visible);

        const symbol = buttonConfig.symbol || '';
        const fs = typeof buttonConfig.fontSize === 'function' ? buttonConfig.fontSize() : 24;
        const buttonText = scene.add.text(x, y, symbol, {
            fontFamily: 'Arial', fontSize: `${fs}px`, color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(config.depth);
        buttonText.setVisible(config.visible);

        hexagon.setInteractive(new Phaser.Geom.Circle(0, 0, config.size * 0.8), Phaser.Geom.Circle.Contains, { useHandCursor: true });
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
// Create / resize all UI elements
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

function resizeUI(scene) {
    createUI(scene);
}

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
// Game End Screen config
// ─────────────────────────────────────────────────────────────────
UI.gameEndScreen = {
    width: function () {
        return Math.max(UI.rel.width(50), 600);
    },
    height: function () { return UI.rel.height(64); },
    y: function () { return UI.rel.y(50); },
    x: function () { return UI.rel.x(50); },
    borderWidth: 4,
    innerPadding: function () { return UI.rel.width(2); },
    scaleFactor: function () {
        const minScale = 0.8;
        const maxScale = 1.4;
        const scale = UI.game.getWidth() / 1200;
        return Math.max(minScale, Math.min(maxScale, scale));
    }
};