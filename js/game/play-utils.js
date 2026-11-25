/* ==========================================
   NIGHT ROAD｜共用工具
========================================== */

(() => {
    const P = window.NIGHTROAD_PLAY;

    P.$ = function (id) {
        return document.getElementById(id);
    };

    P.shuffle = function (array) {
        const result = [...array];

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
    };

    P.makeElement = function (tag, className, text) {
        const node = document.createElement(tag);

        if (className) {
            node.className = className;
        }

        if (text !== undefined) {
            node.textContent = text;
        }

        return node;
    };

    P.setVisible = function (element, visible) {
        if (!element) return;
        element.hidden = !visible;
    };

    P.showInlineMessage = function (message) {
        const el = P.el;

        if (!el) return;

        el.mainStatus.textContent = message;
        el.mainStatus.style.color = "#e05252";

        if (el.hostHintText) {
            el.hostHintText.textContent = message;
            el.hostHintText.style.color = "#e05252";
        }

        if (el.actionResult && !el.actionArea.hidden) {
            el.actionResult.textContent = message;
            el.actionResult.style.color = "#e05252";
        }
    };

    P.updateHostHint = function (message) {
        if (!P.el?.hostHintText) return;

        P.el.hostHintText.textContent = message;
    };

    P.save = function () {
        P.STATE.save();
        P.gameData = P.STATE.get();
    };
})();