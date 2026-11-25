/* ==========================================
   NIGHT ROAD｜額外討論倒數計時器
   檔案：play-timer.js
========================================== */

(() => {
    const P = window.NIGHTROAD_PLAY;

    let timerInterval = null;

    function getTimer() {
        return P.gameData?.extraDiscussion || null;
    }

    function getRemaining(timer) {
        if (timer.running && timer.endsAt) {
            return Math.max(
                0,
                Math.ceil((timer.endsAt - Date.now()) / 1000)
            );
        }

        return timer.remainingSeconds;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(remaining).padStart(2, "0")
        );
    }

    function saveTimer() {
        P.save();
    }

    function stopInterval() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateDisplay() {
        const timer = getTimer();

        if (!timer) return;

        const display = document.getElementById(
            "extraDiscussionTimerDisplay"
        );

        const status = document.getElementById(
            "extraDiscussionTimerStatus"
        );

        const toggleButton = document.getElementById(
            "extraDiscussionTimerToggle"
        );

        if (!display || !status || !toggleButton) return;

        const remaining = getRemaining(timer);

        display.textContent = formatTime(remaining);

        if (remaining <= 0) {
            display.style.color = "#e05252";
            status.textContent = "額外討論時間結束";
            toggleButton.textContent = "已結束";
            toggleButton.disabled = true;
        } else if (timer.running) {
            display.style.color = "#c9a66b";
            status.textContent = "全隊額外討論中";
            toggleButton.textContent = "暫停";
            toggleButton.disabled = false;
        } else {
            display.style.color = "#c9a66b";
            status.textContent = "討論時間已暫停";
            toggleButton.textContent = "繼續";
            toggleButton.disabled = false;
        }
    }

    // 額外討論結束
    function finishExtraDiscussion() {
        stopInterval();

        const timer = getTimer();

        if (!timer) return;

        timer.remainingSeconds = 0;
        timer.running = false;
        timer.endsAt = null;

        // 記錄結束狀態
        P.gameData.extraDiscussion = null;

        saveTimer();

        P.addLog("舊式懷錶的額外討論時間結束。");

        // 移除額外討論計時器視窗
        P.hideExtraDiscussion();

        // 回到原本遊戲畫面
        P.renderAll();

        P.el.hostHintText.textContent =
            "額外討論時間結束，請繼續原本的遊戲流程。";

        P.el.hostHintText.style.color = "#c9a66b";

        P.el.actionResult.textContent =
            "舊式懷錶的額外討論已結束。";

        P.el.hostHintText.textContent =
            "額外討論時間結束，請繼續原本的遊戲流程。";

        P.el.hostHintText.style.color = "#c9a66b";

        P.el.actionResult.textContent =
            "舊式懷錶的額外討論已結束。";
    }

    // 開始倒數
    function startCountdown() {
        const timer = getTimer();

        if (!timer) return;

        if (timer.remainingSeconds <= 0) {
            finishExtraDiscussion();
            return;
        }

        timer.running = true;
        timer.endsAt =
            Date.now() + timer.remainingSeconds * 1000;

        saveTimer();

        stopInterval();

        timerInterval = setInterval(() => {
            const remaining = getRemaining(timer);

            if (remaining <= 0) {
                finishExtraDiscussion();
                return;
            }

            updateDisplay();
        }, 250);

        updateDisplay();
    }

    // 暫停倒數
    function pauseCountdown() {
        const timer = getTimer();

        if (!timer) return;

        timer.remainingSeconds = getRemaining(timer);
        timer.running = false;
        timer.endsAt = null;

        stopInterval();

        saveTimer();
        updateDisplay();
    }

    // 暫停／繼續
    function toggleCountdown() {
        const timer = getTimer();

        if (!timer) return;

        if (timer.running) {
            pauseCountdown();
        } else {
            startCountdown();
        }
    }

    // 重新開始 3 分鐘
    function resetCountdown() {
        const timer = getTimer();

        if (!timer) return;

        stopInterval();

        timer.remainingSeconds = 180;
        timer.durationSeconds = 180;
        timer.running = true;
        timer.endsAt = Date.now() + 180 * 1000;

        saveTimer();

        updateDisplay();

        timerInterval = setInterval(() => {
            if (getRemaining(timer) <= 0) {
                finishExtraDiscussion();
                return;
            }

            updateDisplay();
        }, 250);
    }

    // 建立額外討論介面
    P.renderExtraDiscussion = function (anchor) {
        const timer = getTimer();

        if (!timer || !anchor) return;

        let panel = document.getElementById(
            "extraDiscussionTimerPanel"
        );

        if (!panel) {
            panel = document.createElement("section");
            panel.id = "extraDiscussionTimerPanel";
            panel.className = "discussion-timer-panel";

            panel.innerHTML = `
                <div class="discussion-timer-heading">
                    舊式懷錶｜額外規則討論
                </div>

                <div
                    id="extraDiscussionTimerDisplay"
                    class="discussion-timer-display"
                >03:00</div>

                <div
                    id="extraDiscussionTimerStatus"
                    class="discussion-timer-status"
                >全隊額外討論中</div>

                <div class="discussion-timer-buttons">
                    <button
                        type="button"
                        id="extraDiscussionTimerToggle"
                        class="primary-btn"
                    >暫停</button>

                    <button
                        type="button"
                        id="extraDiscussionTimerReset"
                        class="secondary-btn"
                    >重新計時</button>

                    <button
                        type="button"
                        id="extraDiscussionFinish"
                        class="danger-btn"
                    >結束討論</button>
                </div>
            `;

            anchor.insertAdjacentElement("afterend", panel);

            document
                .getElementById("extraDiscussionTimerToggle")
                .addEventListener("click", toggleCountdown);

            document
                .getElementById("extraDiscussionTimerReset")
                .addEventListener("click", resetCountdown);
            document
                .getElementById("extraDiscussionFinish")
                .addEventListener("click", () => {
                    finishExtraDiscussion();
                });
        }

        updateDisplay();

        // 重新整理後，繼續原本的倒數
        if (timer.running) {
            if (getRemaining(timer) <= 0) {
                finishExtraDiscussion();
            } else {
                startCountdown();
            }
        }
    };

    // 開始額外討論
    P.startExtraDiscussion = function (minutes = 3) {
        if (!P.gameData) return;

        // 避免重複啟動
        if (P.gameData.extraDiscussion) {
            return;
        }

        const duration = Math.max(1, Number(minutes) || 3) * 60;

        P.gameData.extraDiscussion = {
            durationSeconds: duration,
            remainingSeconds: duration,
            running: true,
            endsAt: Date.now() + duration * 1000
        };

        saveTimer();

        P.addLog(
            `全隊立即進入額外規則討論，時間 ${minutes} 分鐘。`
        );

        P.renderAll();
    };

    // 離開額外討論畫面
    P.hideExtraDiscussion = function () {
        const panel = document.getElementById(
            "extraDiscussionTimerPanel"
        );

        if (panel) {
            panel.remove();
        }
    };

})();