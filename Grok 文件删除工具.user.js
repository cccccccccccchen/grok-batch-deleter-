// ==UserScript==
// @name         Grok 文件删除工具
// @namespace    http://tampermonkey.net/
// @version      2026-05-08
// @description  try to take over the world!
// @author       You
// @match        https://grok.com/files
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==
// ==UserScript==
// @name         Grok Batch File Deleter
// @namespace    http://tampermonkey.net/
// @version      5.0
// @author       Edison & Vishwas R
// @description  Batch delete files from grok.com/files. Built upon Grok Batch Deleter by Vishwas R.
// @match        https://grok.com/files
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // ========== 配置 ==========
    const CONFIG = {
        deleteDelayMs: 1500,
        scrollDelayMs: 2000,
        confirmTimeoutMs: 5000,
        maxScrollAttempts: 5,
        storageKey: 'grok_batch_deleter_config',
    };

    // ========== 本地存储 ==========
    function loadConfig() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    skipExtensions: parsed.skipExtensions || [],
                    skipKeywords: parsed.skipKeywords || [],
                };
            }
        } catch(e) {}
        return null;
    }

    function saveConfig(exts, kws) {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify({
                skipExtensions: exts,
                skipKeywords: kws,
            }));
        } catch(e) {}
    }

    // ========== UI ==========
    function createUI() {
        const oldPanel = document.getElementById('grok-batch-deleter');
        if (oldPanel) oldPanel.remove();

        const savedConfig = loadConfig();
        const defaultExts = savedConfig ? savedConfig.skipExtensions.join(', ') : '';
        const defaultKws = savedConfig ? savedConfig.skipKeywords.join(', ') : '';

        const panel = document.createElement('div');
        panel.id = 'grok-batch-deleter';
        panel.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 99999;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 16px;
                width: 340px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 13px;
                color: #fff;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            ">
                <div style="font-weight: 600; font-size: 15px; margin-bottom: 2px;">
                    🗑️ Grok Batch Deleter
                </div>
                <div style="font-size: 10px; color: #666; margin-bottom: 12px;">
                    by Edison &amp; Vishwas R
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">
                        跳过的扩展名（逗号分隔）
                    </label>
                    <input id="skip-exts" type="text" value="${defaultExts}"
                        placeholder="pdf, jpg, png..."
                        style="width: 100%; background: #2a2a2a; border: 1px solid #444; border-radius: 6px;
                               padding: 6px 8px; color: #fff; font-size: 12px; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 12px;">
                    <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">
                        跳过的文件名关键词（逗号分隔）
                    </label>
                    <input id="skip-kw" type="text" value="${defaultKws}"
                        placeholder="important, backup..."
                        style="width: 100%; background: #2a2a2a; border: 1px solid #444; border-radius: 6px;
                               padding: 6px 8px; color: #fff; font-size: 12px; box-sizing: border-box;">
                </div>

                <div id="confirm-box" style="
                    display: none;
                    background: #2a2a2a;
                    border: 1px solid #ff9800;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 12px;
                    font-size: 12px;
                ">
                    <div style="color: #ff9800; font-weight: 600; margin-bottom: 8px;">
                        ⚠️ 开始前请确认
                    </div>
                    <div id="confirm-details" style="color: #ccc; line-height: 1.6;"></div>
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button id="btn-confirm-yes" style="
                            flex: 1; background: #4caf50; color: #fff; border: none; border-radius: 6px;
                            padding: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
                        ">✅ 确认删除</button>
                        <button id="btn-confirm-no" style="
                            flex: 1; background: #555; color: #fff; border: none; border-radius: 6px;
                            padding: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
                        ">❌ 取消</button>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <button id="btn-start" style="
                        flex: 1; background: #e53935; color: #fff; border: none; border-radius: 8px;
                        padding: 8px 12px; font-size: 13px; font-weight: 600; cursor: pointer;
                    ">▶ 开始删除</button>
                    <button id="btn-stop" style="
                        flex: 1; background: #555; color: #fff; border: none; border-radius: 8px;
                        padding: 8px 12px; font-size: 13px; font-weight: 600; cursor: pointer;
                        display: none;
                    ">⏹ 停止</button>
                </div>

                <div style="
                    background: #111; border-radius: 8px; padding: 10px;
                    font-size: 12px; line-height: 1.8;
                ">
                    <div>✅ 已删除: <span id="stat-deleted" style="color: #4caf50;">0</span></div>
                    <div>⏭️ 已跳过: <span id="stat-skipped" style="color: #ff9800;">0</span></div>
                    <div>🔄 滚动次数: <span id="stat-scrolls" style="color: #9c27b0;">0</span></div>
                    <div id="current-file" style="color: #888; margin-top: 4px; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">-</div>
                    <div id="status-msg" style="color: #4caf50; margin-top: 4px;">准备就绪</div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('btn-start').addEventListener('click', showConfirmBox);
        document.getElementById('btn-stop').addEventListener('click', stopDeletion);
        document.getElementById('btn-confirm-yes').addEventListener('click', confirmAndStart);
        document.getElementById('btn-confirm-no').addEventListener('click', hideConfirmBox);
    }

    // ========== 状态 ==========
    let isRunning = false;
    let stats = { deleted: 0, skipped: 0, scrolls: 0 };
    let scrollFailCount = 0;
    let processedFileIds = new Set(); // 追踪已处理的文件，避免重复

    // ========== 工具函数 ==========
    function updateStats() {
        document.getElementById('stat-deleted').textContent = stats.deleted;
        document.getElementById('stat-skipped').textContent = stats.skipped;
        document.getElementById('stat-scrolls').textContent = stats.scrolls;
    }

    function setStatus(msg, color = '#4caf50') {
        const el = document.getElementById('status-msg');
        el.textContent = msg;
        el.style.color = color;
    }

    function setCurrentFile(filename) {
        document.getElementById('current-file').textContent = filename;
    }

    function getConfig() {
        const exts = document.getElementById('skip-exts').value.split(',').map(s => s.trim().toLowerCase().replace(/^\./, '')).filter(s => s);
        const kws = document.getElementById('skip-kw').value.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        return { exts, kws };
    }

    function shouldSkip(filename, config) {
        const lower = filename.toLowerCase();
        for (const ext of config.exts) {
            if (lower.endsWith('.' + ext)) return true;
        }
        for (const kw of config.kws) {
            if (kw && lower.includes(kw)) return true;
        }
        return false;
    }

    function closeCookieBanner() {
        const closeBtn = document.querySelector('#close-pc-btn-handler, .ot-close-icon[aria-label="关闭偏好中心"]');
        if (closeBtn) {
            closeBtn.click();
            return true;
        }
        return false;
    }

    function waitForConfirmDialog() {
        return new Promise((resolve) => {
            const startTime = Date.now();

            function check() {
                if (!isRunning) {
                    resolve(false);
                    return;
                }

                closeCookieBanner();

                const dialogs = document.querySelectorAll('[role="dialog"]');
                for (const dialog of dialogs) {
                    if (dialog.textContent.includes('Are you sure') && dialog.textContent.includes('Delete')) {
                        const buttons = dialog.querySelectorAll('button');
                        for (const btn of buttons) {
                            if (btn.textContent.trim() === 'Delete') {
                                btn.click();
                                resolve(true);
                                return;
                            }
                        }
                    }
                }

                if (Date.now() - startTime > CONFIG.confirmTimeoutMs) {
                    resolve(false);
                    return;
                }

                setTimeout(check, 100);
            }

            check();
        });
    }

    // ========== 确认框 ==========
    function showConfirmBox() {
        const config = getConfig();
        const extsText = config.exts.length > 0 ? config.exts.map(e => '.' + e).join(', ') : '(无)';
        const kwsText = config.kws.length > 0 ? config.kws.join(', ') : '(无)';

        document.getElementById('confirm-details').innerHTML = `
            <div>跳过的扩展名: <span style="color: #4caf50;">${extsText}</span></div>
            <div>跳过的关键词: <span style="color: #4caf50;">${kwsText}</span></div>
            <div style="margin-top: 8px; color: #ff9800;">
                ⚠️ 将开始批量删除，删除后无法恢复！
            </div>
        `;
        document.getElementById('confirm-box').style.display = 'block';
    }

    function hideConfirmBox() {
        document.getElementById('confirm-box').style.display = 'none';
    }

    function confirmAndStart() {
        hideConfirmBox();
        const config = getConfig();
        saveConfig(config.exts, config.kws);
        startDeletion_real();
    }

    // ========== 核心删除逻辑 ==========
    async function processOneFile() {
        if (!isRunning) return;

        closeCookieBanner();

        const config = getConfig();
        const scrollContainer = document.querySelector('div.flex-1.flex.flex-col.overflow-y-auto');

        if (!scrollContainer) {
            setStatus('找不到滚动容器', '#f44336');
            return;
        }

        const fileItems = Array.from(scrollContainer.querySelectorAll('a[href*="/files?file="]'));

        if (fileItems.length === 0) {
            setStatus('滚动加载更多...', '#ff9800');
            await scrollAndWait();
            if (isRunning) processOneFile();
            return;
        }

        for (const item of fileItems) {
            if (!isRunning) return;

            // 获取文件 ID，用于去重
            const href = item.getAttribute('href');
            const fileIdMatch = href ? href.match(/file=([a-zA-Z0-9-]+)/) : null;
            if (fileIdMatch) {
                const fileId = fileIdMatch[1];
                if (processedFileIds.has(fileId)) {
                    continue; // 跳过已处理过的文件
                }
                processedFileIds.add(fileId);
            }

            const filenameEl = item.querySelector('span[style*="mask-image"]');
            const filename = filenameEl ? filenameEl.textContent.trim() : item.textContent.trim();
            setCurrentFile(filename);

            if (shouldSkip(filename, config)) {
                stats.skipped++;
                updateStats();
                setStatus(`跳过: ${filename}`, '#ff9800');
                continue;
            }

            item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            await sleep(200);

            const deleteBtn = item.querySelector('button[aria-label="Delete file"]');
            if (!deleteBtn) {
                stats.skipped++;
                updateStats();
                continue;
            }

            setStatus(`等待确认: ${filename}`, '#ff9800');
            deleteBtn.click();

            const confirmed = await waitForConfirmDialog();

            if (confirmed) {
                stats.deleted++;
                setStatus(`已删除: ${filename}`, '#4caf50');
            } else {
                stats.deleted++;
                setStatus(`已处理: ${filename}`, '#9c27b0');
            }

            updateStats();
            await sleep(CONFIG.deleteDelayMs);
            closeCookieBanner();
        }

        setStatus('滚动加载更多...', '#ff9800');
        await scrollAndWait();

        if (isRunning) {
            processOneFile();
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function scrollAndWait() {
        if (!isRunning) return;

        closeCookieBanner();

        const scrollContainer = document.querySelector('div.flex-1.flex.flex-col.overflow-y-auto');
        if (!scrollContainer) return;

        const beforeScroll = scrollContainer.scrollTop;
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        stats.scrolls++;
        updateStats();

        await sleep(CONFIG.scrollDelayMs);

        const afterScroll = scrollContainer.scrollTop;

        if (afterScroll === beforeScroll) {
            scrollFailCount++;
            setStatus(`没有更多内容 (${scrollFailCount}/${CONFIG.maxScrollAttempts})`, '#ff9800');

            if (scrollFailCount >= CONFIG.maxScrollAttempts) {
                setStatus(`✅ 完成！删除: ${stats.deleted}, 跳过: ${stats.skipped}`, '#4caf50');
                stopDeletion();
                return;
            }
        } else {
            scrollFailCount = 0;
        }
    }

    function startDeletion_real() {
        if (isRunning) return;

        isRunning = true;
        stats = { deleted: 0, skipped: 0, scrolls: 0 };
        scrollFailCount = 0;
        processedFileIds = new Set(); // 清空已处理记录

        document.getElementById('btn-start').style.display = 'none';
        document.getElementById('btn-stop').style.display = 'block';

        setStatus('开始删除...', '#ff9800');
        processOneFile();
    }

    function stopDeletion() {
        isRunning = false;

        document.getElementById('btn-start').style.display = 'block';
        document.getElementById('btn-stop').style.display = 'none';

        setStatus(`已停止 - 删除: ${stats.deleted}, 跳过: ${stats.skipped}`, '#f44336');
    }

    // ========== 初始化 ==========
    function init() {
        createUI();
        setStatus('准备就绪，点击"开始删除"', '#4caf50');
    }

    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();
