// script.js - 微信公众号图文预览系统交互逻辑

document.addEventListener('DOMContentLoaded', () => {

    // --- State & Title Options ---
    const titleOptions = {
        A: "Rust 强力注入！Pydantic V3 暴涨 20 倍性能，数据工作流迎来“骨架重塑”？",
        B: "告别 C 扩展！Pydantic V3 正式并入 Rust 核心：数据流水线的“类型炼金术”与 SDA 革命",
        C: "智能体大脑的“交响指挥家”：为什么 Prefect 3.0 + Pydantic AI 成为 2026 年 Agent 架构首选？"
    };

    // --- DOM Elements Selection ---
    const globalThemeToggle = document.getElementById('globalThemeToggle');
    const simThemeToggle = document.getElementById('simThemeToggle');
    const mobileScreen = document.getElementById('mobileScreen');
    
    // Inputs
    const inputTitleSelect = document.getElementById('inputTitleSelect');
    const inputAuthor = document.getElementById('inputAuthor');
    const inputDate = document.getElementById('inputDate');
    const inputAvatarName = document.getElementById('inputAvatarName');
    
    // Outputs in Simulator
    const wechatTitle = document.getElementById('wechatTitle');
    const metaAuthor = document.getElementById('metaAuthor');
    const metaDate = document.getElementById('metaDate');
    const wechatAccount = document.querySelector('.wechat-account');

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Copy Panel Actions
    const btnCopyHtml = document.getElementById('btnCopyHtml');
    const btnCopyMarkdown = document.getElementById('btnCopyMarkdown');
    const btnCopyText = document.getElementById('btnCopyText');
    const copyTextarea = document.getElementById('copyTextarea');

    // Image Modal Lightbox
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeLightbox = document.getElementById('closeLightbox');
    const viewHighresBtns = document.querySelectorAll('.view-highres');

    // Toast
    const clipboardToast = document.getElementById('clipboardToast');

    // --- 1. Global & Simulator Theme Toggles ---
    globalThemeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
    });

    simThemeToggle.addEventListener('click', () => {
        if (mobileScreen.classList.contains('sim-light')) {
            mobileScreen.classList.remove('sim-light');
            mobileScreen.classList.add('sim-dark');
            simThemeToggle.textContent = '☀️';
        } else {
            mobileScreen.classList.remove('sim-dark');
            mobileScreen.classList.add('sim-light');
            simThemeToggle.textContent = '🌙';
        }
    });
    // Set initial simulator theme
    mobileScreen.classList.add('sim-light');

    // --- 2. Live Synchronizer & Enhanced Features ---
    const inputCustomTitle = document.getElementById('inputCustomTitle');
    const btnAiSuggestTitle = document.getElementById('btnAiSuggestTitle');
    const aiTitleSuggestions = document.getElementById('aiTitleSuggestions');

    // Initialize custom title input and left simulator title
    if (inputCustomTitle) {
        inputCustomTitle.value = titleOptions[inputTitleSelect.value];
        wechatTitle.textContent = inputCustomTitle.value;
    }

    inputTitleSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        const newTitle = titleOptions[selectedValue];
        if (inputCustomTitle) {
            inputCustomTitle.value = newTitle;
        }
        wechatTitle.textContent = newTitle;
        updateCopyPreview();
    });

    if (inputCustomTitle) {
        inputCustomTitle.addEventListener('input', (e) => {
            wechatTitle.textContent = e.target.value;
            updateCopyPreview();
        });
    }

    // Title Suggestions Toggle
    if (btnAiSuggestTitle && aiTitleSuggestions) {
        btnAiSuggestTitle.addEventListener('click', () => {
            btnAiSuggestTitle.disabled = true;
            btnAiSuggestTitle.textContent = '⏳ Agent 正在调用神经网络深度分析大纲...';
            setTimeout(() => {
                btnAiSuggestTitle.disabled = false;
                btnAiSuggestTitle.textContent = '🤖 让 Agent 推荐爆款标题款式 (Agent Suggestions)';
                aiTitleSuggestions.style.display = 'flex';
                showToast("🤖 Agent 已为您智能拟定了 3 个高转化爆款标题款式！");
            }, 1000);
        });
    }

    // Handle suggested titles click selection
    document.querySelectorAll('.ai-suggested-item').forEach(item => {
        item.addEventListener('click', () => {
            const suggestedTitle = item.getAttribute('data-title');
            if (inputCustomTitle) {
                inputCustomTitle.value = suggestedTitle;
            }
            wechatTitle.textContent = suggestedTitle;
            updateCopyPreview();
            showToast("已自动采用 Agent 推荐标题！");
        });
    });

    // Author, Date, Avatar Name Sync
    inputAuthor.addEventListener('input', (e) => {
        metaAuthor.textContent = e.target.value;
        updateCopyPreview();
    });

    inputDate.addEventListener('input', (e) => {
        metaDate.textContent = e.target.value;
        updateCopyPreview();
    });

    inputAvatarName.addEventListener('input', (e) => {
        wechatAccount.textContent = e.target.value;
        updateCopyPreview();
    });

    // Password Visiblity Toggle
    const btnToggleSecret = document.getElementById('btnToggleSecret');
    const inputWechatSecret = document.getElementById('inputWechatSecret');
    if (btnToggleSecret && inputWechatSecret) {
        btnToggleSecret.addEventListener('click', () => {
            if (inputWechatSecret.type === 'password') {
                inputWechatSecret.type = 'text';
                btnToggleSecret.textContent = '🙈';
            } else {
                inputWechatSecret.type = 'password';
                btnToggleSecret.textContent = '👁️';
            }
        });
    }

    // Save Credentials to wechat.env via POST
    const btnSaveCredentials = document.getElementById('btnSaveCredentials');
    const inputWechatAppId = document.getElementById('inputWechatAppId');
    if (btnSaveCredentials) {
        btnSaveCredentials.addEventListener('click', async () => {
            const appid = inputWechatAppId.value.trim();
            const secret = inputWechatSecret.value.trim();
            
            if (!appid || !secret) {
                showToast("⚠️ 请先输入 AppID 和 AppSecret！");
                return;
            }
            
            try {
                btnSaveCredentials.disabled = true;
                btnSaveCredentials.textContent = '⏳ 正在写入 wechat.env...';
                
                const response = await fetch('http://127.0.0.1:8080/save_env', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ appid, secret })
                });
                
                const data = await response.json();
                if (data.status === 'success') {
                    showToast("✅ wechat.env 凭证文件已成功保存至 output 目录！");
                } else {
                    showToast("❌ 凭证保存失败: " + data.message);
                }
            } catch (err) {
                console.error(err);
                showToast("❌ 连接后台服务失败，请确保后台在运行。");
            } finally {
                btnSaveCredentials.disabled = false;
                btnSaveCredentials.textContent = '💾 保存 API 秘钥到本地 wechat.env';
            }
        });
    }

    // AI Copilot Dialogue Chat Engine
    const btnSendAiPrompt = document.getElementById('btnSendAiPrompt');
    const aiPromptInput = document.getElementById('aiPromptInput');
    const aiChatLog = document.getElementById('aiChatLog');
    const aiBaseUrlInput = document.getElementById('aiBaseUrl');
    const aiApiKeyInput = document.getElementById('aiApiKey');
    const aiModelNameInput = document.getElementById('aiModelName');

    if (aiPromptInput) {
        aiPromptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendAiMessage();
            }
        });
    }

    if (btnSendAiPrompt) {
        btnSendAiPrompt.addEventListener('click', sendAiMessage);
    }

    // Hook quick prompt triggers
    document.querySelectorAll('.btn-ai-quick').forEach(btn => {
        btn.addEventListener('click', () => {
            const prompt = btn.getAttribute('data-prompt');
            if (aiPromptInput) {
                aiPromptInput.value = prompt;
            }
            sendAiMessage();
        });
    });

    async function sendAiMessage() {
        const prompt = aiPromptInput.value.trim();
        if (!prompt) return;

        const apiKey = aiApiKeyInput ? aiApiKeyInput.value.trim() : '';
        const baseUrl = aiBaseUrlInput ? aiBaseUrlInput.value.trim() : 'https://api.deepseek.com/v1';
        const modelName = aiModelNameInput ? aiModelNameInput.value.trim() : 'deepseek-chat';

        // Clear input
        aiPromptInput.value = '';

        // Append User message to Chat Log
        const userMsg = document.createElement('div');
        userMsg.className = 'ai-chat-message-user';
        userMsg.style.marginTop = '8px';
        userMsg.innerHTML = `
            <span style="color: var(--accent-cyan); font-weight: 500;">👤 您: </span>
            <div style="color: var(--text-main); margin-top: 2px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px;">${prompt}</div>
        `;
        aiChatLog.appendChild(userMsg);
        aiChatLog.scrollTop = aiChatLog.scrollHeight;

        // Append Pending AI message
        const pendingMsg = document.createElement('div');
        pendingMsg.className = 'ai-chat-message-ai';
        pendingMsg.id = 'ai-msg-pending';
        pendingMsg.style.marginTop = '8px';
        pendingMsg.innerHTML = `
            <span style="color: var(--accent-orange); font-weight: 500;">🦊 AI 小助手: </span>
            <div style="color: var(--text-main); margin-top: 2px; background: rgba(249,115,22,0.05); border: 1px solid rgba(249,115,22,0.15); border-radius: 6px; padding: 8px;">⏳ 正在调遣大模型脑细胞深度写作中...</div>
        `;
        aiChatLog.appendChild(pendingMsg);
        aiChatLog.scrollTop = aiChatLog.scrollHeight;

        if (!apiKey) {
            // Simulated Response (Fidelity Mock)
            setTimeout(() => {
                let mockReply = '';
                if (prompt.includes('标题')) {
                    mockReply = `呜～本智能体帮您拟定了 3 个超级吸睛的公众号标题！这几款在微信排版中能够实现极高的点击转化率：<br><br>` +
                                `🌟 **爆款款式一**：Pydantic V3 底层全部 Rust 化！千万级数据校验毫秒达成，2026 编排技术格局变天了！<br>` +
                                `🌟 **爆款款式二**：解密 2026 数据交响乐：如何用 Dagster 资产血缘与 Prefect 事务重组你的企业管道？<br>` +
                                `🌟 **爆款款式三**：告别 C 扩展与慢类型验证！Pydantic V3 强力并入 Rust 二进制内核，编排迎来“降维打击”。<br><br>` +
                                `您可以直接复制这些标题贴到左边的编辑区中哦！🦊✨`;
                } else if (prompt.includes('导读') || prompt.includes('核心导读')) {
                    mockReply = `好的，为您量身定制的公众号生动核心导读如下（字数约 150 字，Snug 紧密排版风格）：<br><br>` +
                                `“如果说 Polars 等分析引擎是数据分析的‘烈火’，那么工作流编排就是保障流转的‘钢筋骨架’。2026 年，数据工程正在从凌乱的过程式 DAG 迈向声明式资产（SDA）的全新范式。本期我们深度拆解 Pydantic V3 强力注入 Rust 核心后带来的 20 倍性能飙升，并对决 Dagster 声明式资产与 Prefect 3.0 持久化状态机。这不仅是一场数据秩序 of 博弈，更是一本写给每个工程师的黄金架构指南！”<br><br>` +
                                `喜欢这段话的话，可以点击下方的“复制”按钮一键带走！🦊✨`;
                } else if (prompt.includes('结论') || prompt.includes('结论提炼')) {
                    mockReply = `收到！帮您提炼出本文关于“数据编排与类型”的 3 个硬核结论：<br><br>` +
                                `1. **Rust 接管底层**：Pydantic V3 通过 Rust 重构，将校验速度提升了 20 倍，千万级数据流在微秒级别被过滤并转化。<br>` +
                                `2. **代码即血缘**：Dagster 倡导的声明式资产（SDA）将数据 lineage 关系写进代码，比传统的任务后置血缘稳定百倍，是合规的首选。<br>` +
                                `3. **AI 智能体首选**：Prefect 3.0 以其分布式事务回滚以及对 Pydantic AI 的原生适配，成为 2026 动态智能体工作流的最佳伴侣。<br><br>` +
                                `已为您格式化为Snug样式，请放心采用！`;
                } else {
                    mockReply = `AI 小助手已收到您的问题：“${prompt}”！<br><br>` +
                                `由于您还没有在上方配置 **API Key**，我目前正在用本地“模拟大脑”为您进行智能模拟回复：<br><br>` +
                                `💡 **本地助手特别解答**：<br>` +
                                `现代数据工作流已全面步入“强类型安全”时代。如果您需要大模型为您源源不断地生成最新的代码案例和润色长文，**强烈建议您在上方‘配置 AI 模型 API’中输入您的 API Key（如 DeepSeek、OpenAI 等）**，保存后，这里将直接无缝变成大模型实时对话框哦！快去配置试试看吧！🦊✨`;
                }
                displayAiReply(mockReply);
            }, 1200);
        } else {
            // Real fetch call to OpenAI/DeepSeek API!
            try {
                const response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.7
                    })
                });

                const data = await response.json();
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    displayAiReply(data.choices[0].message.content.replace(/\n/g, '<br>'));
                } else {
                    throw new Error(JSON.stringify(data));
                }
            } catch (err) {
                console.error("API call error: ", err);
                displayAiReply(`⚠️ **API 接口调用失败**：<br>` +
                               `在连接大模型时发生了网络错误或鉴权失败。这通常是由于网络跨域（CORS）或者您的 API Key 配置不正确导致的。<br><br>` +
                               `*本地模拟大脑已为您提供备用智能模拟文案：*<br><br>` +
                               `“在 2026 年，Pydantic V3 与 Rust 核心的合并标志着强类型安全的终极形态。快去核对您的 API 凭证与网络设置吧！🚀”`);
            }
        }
    }

    function displayAiReply(htmlText) {
        const pendingMsg = document.getElementById('ai-msg-pending');
        if (pendingMsg) {
            pendingMsg.removeAttribute('id');
            const contentDiv = pendingMsg.querySelector('div');
            
            contentDiv.innerHTML = htmlText;
            contentDiv.style.background = 'rgba(249,115,22,0.07)';
            contentDiv.style.border = '1px solid rgba(249,115,22,0.3)';
            
            // Add copy button
            const btnCopy = document.createElement('button');
            btnCopy.className = 'btn btn-secondary btn-sm';
            btnCopy.style.marginTop = '8px';
            btnCopy.style.fontSize = '0.7rem';
            btnCopy.style.padding = '3px 8px';
            btnCopy.textContent = '📋 复制此段文案';
            btnCopy.addEventListener('click', () => {
                const cleanText = contentDiv.innerText.replace('📋 复制此段文案', '').trim();
                navigator.clipboard.writeText(cleanText)
                    .then(() => showToast("已复制 AI 推荐内容！"))
                    .catch(() => showToast("复制失败！"));
            });
            
            contentDiv.appendChild(btnCopy);
            aiChatLog.scrollTop = aiChatLog.scrollHeight;
        }
    }

    // --- 3. Tab System ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            if (tabId === 'copy') {
                updateCopyPreview();
            }
        });
    });

    // --- 4. Highres Image Modal Viewer ---
    viewHighresBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const imgSrc = btn.getAttribute('data-img');
            lightboxImg.src = imgSrc;
            lightboxModal.classList.add('active');
        });
    });

    const closeLightboxFunc = () => {
        lightboxModal.classList.remove('active');
    };

    closeLightbox.addEventListener('click', closeLightboxFunc);
    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
            closeLightboxFunc();
        }
    });

    // --- 5. Article Formatting & Clipboard Operations ---
    
    // Toast Show Helper
    function showToast(message) {
        const msgNode = clipboardToast.querySelector('.toast-message');
        msgNode.textContent = message;
        clipboardToast.classList.add('show');
        setTimeout(() => {
            clipboardToast.classList.remove('show');
        }, 2200);
    }

    // Markdown content compiler
    function compileMarkdown() {
        const title = wechatTitle.textContent;
        const author = metaAuthor.textContent;
        const date = metaDate.textContent;
        
        let markdown = `# ${title}\n\n`;
        markdown += `*发表于：${date} | 作者：${author} | 来源公众号：${inputAvatarName.value}*\n\n`;
        markdown += `### 💡 核心导读\n> 如果说 Polars 是数据炼金术中的“烈火”，那么工作流编排（Orchestration）就是维系数据流转的“钢筋骨架”。本章将深度解剖 Dagster、Prefect 3.0 如何与 Pydantic V3 的 Rust 核心深度耦合，在数据流动的每一比特中植入安全与秩序。\n\n`;
        markdown += `---\n\n`;
        markdown += `## 一、类型炼金 — Pydantic V3 的 Rust 铁骨\n\n`;
        markdown += `在 Python 类型校验演进史上，Pydantic V3 标志着一个划时代的分水岭：\n\n`;
        markdown += `* **20倍性能加速**：底层校验核心由 Rust 重构，在海量数据严格验证中实现千万级数据毫秒级校验。\n`;
        markdown += `* **Alias 重映射**：新增 \`AliasPath\` 级联机制，零成本自适应处理复杂多变的前端 JSON 嵌套。\n`;
        markdown += `* **Strict 严格模式**：拒绝 Python 隐式类型强制转换，杜绝数据微小误差导致的灾难级奔溃。\n`;
        markdown += `* **@computed_field 计算字段**：支持二进制缓存，免去大型报表重算延迟。\n\n`;
        markdown += `## 二、教育者扩展包：人话版“数据编排”童话词典\n\n`;
        markdown += `> 以前干数据分析，像在混乱无序的工地施工，只要一块转的形状不对，整座违章建筑就会坍塌（类型不匹配导致崩溃）。\n`;
        markdown += `> 现在，我们搬进了自动化数字示范工厂。原料进入前，会有安检员（Pydantic V3）用激光扫描仪严格检查每块材料的格式；交响乐指挥家（Orchestration）则在中央监控大屏幕前挥动指挥棒，保证每个工序完美交接，最终产出合格的数据黄金资产（SDA）。\n\n`;
        markdown += `## 三、秩序博弈 — Dagster vs Prefect 3.0 终极对决\n\n`;
        markdown += `在 2026 年的编排舞台上，两位核心巨头各自完成了自己终极的进化跃迁：\n\n`;
        markdown += `### 1. Dagster：声明式资产 (Software-Defined Assets)\n`;
        markdown += `Dagster 推翻了传统的“任务依赖”过程流逻辑，强推以资产为核心的 **SDA** 模式。在代码中，**血缘关系是代码的一部分，而非后期生成的图表**。开发人员定义的是“这个数据资产应该由哪些上游资产算出”，Dagster 则自动物化调度，在企业资产治理维度极其成功。\n\n`;
        markdown += `### 2. Prefect 3.0：AI Agent 后端\n`;
        markdown += `Prefect 3.0 基于 Pydantic V3 彻底重构了分布式状态机，首次在行业内引入**分布式事务语义与“原子回滚”**。通过与 **Pydantic AI** 深度集成，成为 2026 年主流 Agent 架构的默认编排后端，实现极简 Python 装饰器即开即用体验。\n\n`;
        markdown += `## 四、编排选型选型建议\n\n`;
        markdown += `2026 年行业最终结论是：**“中后台选 Dagster，前台 Agent 选 Prefect”**。\n`;
        markdown += `Dagster 的 SDA 模型是企业资产治理的救星，精准确定数据源头血缘；而 Prefect 3.0 以无与伦比的灵活性和对 Pydantic 的深度支持，是动态 AI 应用与市场监测 Agent 流程的黄金骨架。\n\n`;
        markdown += `## 五、本章小结与下期预告\n\n`;
        markdown += `我们已经重塑了数据的“铁骨”（编排系统）与“灵魂”（类型安全）。然而，完美的逻辑如果无法优美触达，依然只是沉寂的二进制。下一章我们将迎来**“视觉先知” Streamlit 2.0 与 Marimo** 的数据可视化响应式革命，敬请期待！\n\n`;
        markdown += `--- \n\n*关注公众号【${inputAvatarName.value}】，点个“在看”，获取更多最前沿的 AI 科技深度解析！*`;
        
        return markdown;
    }

    // HTML Content compiler for WeChat pasting
    function compileWechatHtml() {
        const bodyContent = document.getElementById('articleBody').innerHTML;
        const title = wechatTitle.textContent;
        const author = metaAuthor.textContent;
        const date = metaDate.textContent;

        let cleanHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.75; color: #333333; max-width: 677px; margin: 0 auto; padding: 20px;">
            <h1 style="font-size: 22px; font-weight: bold; line-height: 1.4; color: #111111; margin-bottom: 12px;">${title}</h1>
            <div style="font-size: 14px; color: #888888; margin-bottom: 22px; display: flex; gap: 8px;">
                <span>${date}</span>
                <span style="color: #576b95; font-weight: 500;">${inputAvatarName.value}</span>
                <span>作者：${author}</span>
            </div>
            ${bodyContent}
        </div>
        `;

        // Replace all relative assets path with proper naming guides to help pasting
        cleanHtml = cleanHtml.replace(/src="data_orchestration_cover.png"/g, 'src="[请上传：插图1-data_orchestration_cover.png]" style="border-radius: 8px; width: 100%;"');
        cleanHtml = cleanHtml.replace(/src="pydantic_rust_core.png"/g, 'src="[请上传：插图2-pydantic_rust_core.png]" style="border-radius: 8px; width: 100%;"');
        cleanHtml = cleanHtml.replace(/src="woodland_roadmap.png"/g, 'src="[请上传：插图3-woodland_roadmap.png]" style="border-radius: 8px; width: 100%;"');

        // Style table and lists inline for WeChat
        cleanHtml = cleanHtml.replace(/<table class="wechat-table">/g, '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; border: 1px solid #e5e7eb;">');
        cleanHtml = cleanHtml.replace(/<thead>/g, '<thead style="background-color: #f9fafb;">');
        cleanHtml = cleanHtml.replace(/<th(.*?)>/g, '<th$1 style="padding: 8px 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #111111; text-align: left;">');
        cleanHtml = cleanHtml.replace(/<td(.*?)>/g, '<td$1 style="padding: 8px 10px; border: 1px solid #e5e7eb; color: #374151;">');
        
        // Quote box styles (orange and cyan)
        cleanHtml = cleanHtml.replace(/<div class="wechat-quote-box">/g, '<div style="margin: 24px 0; padding: 16px; border-left: 4px solid #f97316; background-color: #fff7ed; border-radius: 0 8px 8px 0; font-size: 15px;">');
        cleanHtml = cleanHtml.replace(/<div class="wechat-quote-box cyan">/g, '<div style="margin: 24px 0; padding: 18px; border-left: 4px solid #06b6d4; background-color: #ecfeff; border-radius: 0 8px 8px 0; font-size: 15px;">');
        
        // Quote nested paragraph styles
        cleanHtml = cleanHtml.replace(/<p class="quote-title-orange">/g, '<p style="margin: 0 0 6px 0; color: #ea580c; font-weight: bold; line-height: 1.6;">');
        cleanHtml = cleanHtml.replace(/<p class="quote-body-orange">/g, '<p style="margin: 0; color: #4b5563; line-height: 1.6; text-align: justify; text-indent: 0;">');
        cleanHtml = cleanHtml.replace(/<p class="quote-title-cyan">/g, '<p style="margin: 0 0 6px 0; color: #0891b2; font-weight: bold; line-height: 1.6;">');
        cleanHtml = cleanHtml.replace(/<p class="quote-body-cyan">/g, '<p style="margin: 0; color: #374151; line-height: 1.7; text-align: justify; text-indent: 0;">');
        cleanHtml = cleanHtml.replace(/<p class="quote-body-cyan spaced">/g, '<p style="margin: 6px 0 0 0; color: #374151; line-height: 1.7; text-align: justify; text-indent: 0;">');

        // Headers inline styles
        cleanHtml = cleanHtml.replace(/<h2 class="wechat-h2">/g, '<h2 style="font-size: 19px; font-weight: bold; color: #111111; margin: 32px 0 16px 0; border-bottom: 2px solid #f97316; padding-bottom: 4px; display: block;">');
        cleanHtml = cleanHtml.replace(/<h3 class="wechat-h3">/g, '<h3 style="font-size: 17px; font-weight: bold; color: #111111; margin: 20px 0 10px 0;">');
        
        // Paragraph styles (Standard & Intro)
        cleanHtml = cleanHtml.replace(/<p>/g, '<p style="margin-bottom: 16px; text-align: justify; text-indent: 0; padding-left: 0; margin-left: 0;">');
        cleanHtml = cleanHtml.replace(/<p class="intro-text">/g, '<p style="margin-bottom: 16px; font-size: 16px; font-weight: 500; text-align: justify; text-indent: 0; padding-left: 0; margin-left: 0;">');

        // List style
        cleanHtml = cleanHtml.replace(/<ul class="wechat-list">/g, '<ul style="margin-bottom: 20px; padding-left: 20px; color: #4b5563; line-height: 1.8;">');
        cleanHtml = cleanHtml.replace(/<li>/g, '<li style="margin-bottom: 8px;">');
        
        // Horizontal divider
        cleanHtml = cleanHtml.replace(/<hr class="wechat-hr">/g, '<hr style="border: none; height: 1px; background-color: #e5e7eb; margin: 30px 0;">');

        return cleanHtml;
    }

    // Update the visual textarea showing preview copy
    function updateCopyPreview() {
        const activeTabBtn = document.querySelector('.tab-btn.active');
        if (!activeTabBtn) return;
        
        const activeTab = activeTabBtn.getAttribute('data-tab');
        if (activeTab === 'copy') {
            copyTextarea.value = compileMarkdown();
        }
    }

    // --- 6. Clipboard Triggers ---
    
    // 1. Copy Markdown
    btnCopyMarkdown.addEventListener('click', () => {
        const mdText = compileMarkdown();
        navigator.clipboard.writeText(mdText)
            .then(() => {
                copyTextarea.value = mdText;
                showToast("Markdown 格式已成功复制！");
            })
            .catch(err => {
                console.error(err);
                showToast("复制失败，请手动右侧文本框全选复制。");
            });
    });

    // 2. Copy Plain Text
    btnCopyText.addEventListener('click', () => {
        const rawText = document.getElementById('articleBody').innerText;
        const titleText = `${wechatTitle.textContent}\n\n`;
        navigator.clipboard.writeText(titleText + rawText)
            .then(() => {
                copyTextarea.value = titleText + rawText;
                showToast("纯文本格式已复制！");
            })
            .catch(err => {
                console.error(err);
                showToast("复制失败！");
            });
    });

    // 3. Copy HTML/RichText
    btnCopyHtml.addEventListener('click', async () => {
        const formattedHtml = compileWechatHtml();
        const plainText = wechatTitle.textContent + '\n\n' + document.getElementById('articleBody').innerText;
        
        try {
            const htmlBlob = new Blob([formattedHtml], { type: 'text/html' });
            const plainBlob = new Blob([plainText], { type: 'text/plain' });
            
            const clipboardItem = new ClipboardItem({
                'text/html': htmlBlob,
                'text/plain': plainBlob
            });
            
            await navigator.clipboard.write([clipboardItem]);
            copyTextarea.value = formattedHtml;
            showToast("富文本格式复制成功！可在微信后台直接 Ctrl+V！");
        } catch (err) {
            console.error("Rich text copy failed, using HTML string backup: ", err);
            navigator.clipboard.writeText(formattedHtml)
                .then(() => {
                    copyTextarea.value = formattedHtml;
                    showToast("富文本代码已复制！您可以粘贴代码使用。");
                });
        }
    });

    // --- Dynamic Block-Based Editor Engine ---
    let articleBlocks = [];
    let maxId = 1000;

    function parseHtmlToBlocks() {
        const body = document.getElementById('articleBody');
        articleBlocks = [];
        let idCounter = 1;

        Array.from(body.children).forEach(child => {
            let block = { id: idCounter++ };
            
            if (child.classList.contains('wechat-img-container')) {
                const img = child.querySelector('img');
                const caption = child.querySelector('.img-caption');
                block.type = 'image';
                block.src = img ? img.getAttribute('src') : '';
                block.caption = caption ? caption.innerHTML : '';
            } else if (child.classList.contains('wechat-video-block-wrapper') || child.classList.contains('wechat-video-container')) {
                const video = child.querySelector('video');
                const caption = child.querySelector('.img-caption') || child.nextElementSibling;
                block.type = 'video';
                block.src = video ? video.getAttribute('src') : '';
                block.caption = caption ? caption.innerHTML : '视频素材';
            } else if (child.tagName.toLowerCase() === 'p' && child.classList.contains('intro-text')) {
                block.type = 'intro';
                block.content = child.innerHTML;
            } else if (child.classList.contains('wechat-quote-box')) {
                if (child.classList.contains('cyan')) {
                    block.type = 'quote-cyan';
                    const titleNode = child.querySelector('.quote-title-cyan');
                    const bodies = child.querySelectorAll('.quote-body-cyan');
                    block.title = titleNode ? titleNode.innerHTML : '🌲 场景直观比喻：';
                    block.body1 = bodies[0] ? bodies[0].innerHTML : '';
                    block.body2 = bodies[1] ? bodies[1].innerHTML : '';
                } else {
                    block.type = 'quote-orange';
                    const titleNode = child.querySelector('.quote-title-orange');
                    const bodyNode = child.querySelector('.quote-body-orange');
                    block.title = titleNode ? titleNode.innerHTML : '💡 架构深思：';
                    block.body = bodyNode ? bodyNode.innerHTML : '';
                }
            } else if (child.classList.contains('wechat-h2')) {
                block.type = 'h2';
                block.content = child.innerHTML;
            } else if (child.classList.contains('wechat-h3')) {
                block.type = 'h3';
                block.content = child.innerHTML;
            } else if (child.classList.contains('wechat-list')) {
                block.type = 'list';
                block.items = Array.from(child.querySelectorAll('li')).map(li => li.innerHTML);
            } else if (child.classList.contains('wechat-table')) {
                block.type = 'table';
                block.content = child.outerHTML;
            } else if (child.classList.contains('wechat-hr')) {
                block.type = 'hr';
            } else if (child.classList.contains('wechat-footer')) {
                block.type = 'footer';
                const strong = child.querySelector('strong');
                block.content = strong ? strong.innerHTML : child.innerHTML;
            } else if (child.tagName.toLowerCase() === 'p') {
                block.type = 'paragraph';
                block.content = child.innerHTML;
            } else {
                block.type = 'paragraph';
                block.content = child.outerHTML;
            }
            articleBlocks.push(block);
        });
    }

    function renderSimulator() {
        const body = document.getElementById('articleBody');
        body.innerHTML = '';
        
        articleBlocks.forEach(block => {
            let element;
            
            if (block.type === 'image') {
                element = document.createElement('div');
                element.className = 'wechat-img-container';
                element.innerHTML = `
                    <img src="${block.src}" alt="Image">
                    <span class="img-caption">${block.caption}</span>
                `;
            } else if (block.type === 'video') {
                element = document.createElement('div');
                element.className = 'wechat-video-block-wrapper';
                element.innerHTML = `
                    <div class="wechat-video-container" id="simVideoContainer-${block.id}">
                        <video src="${block.src}" id="simVideo-${block.id}" playsinline></video>
                        <div class="wechat-video-overlay" id="simVideoOverlay-${block.id}">
                            <div class="wechat-play-btn">▶</div>
                        </div>
                    </div>
                    <span class="img-caption" style="display: block; text-align: center; margin-bottom: 18px; margin-top: -12px;">${block.caption}</span>
                `;
                
                setTimeout(() => {
                    const container = document.getElementById(`simVideoContainer-${block.id}`);
                    const video = document.getElementById(`simVideo-${block.id}`);
                    const overlay = document.getElementById(`simVideoOverlay-${block.id}`);
                    if (container && video && overlay) {
                        container.addEventListener('click', () => {
                            if (video.paused) {
                                video.play();
                                overlay.classList.add('playing');
                            } else {
                                video.pause();
                                overlay.classList.remove('playing');
                            }
                        });
                        video.addEventListener('ended', () => {
                            overlay.classList.remove('playing');
                        });
                    }
                }, 50);
                
            } else if (block.type === 'intro') {
                element = document.createElement('p');
                element.className = 'intro-text';
                element.innerHTML = block.content;
            } else if (block.type === 'paragraph') {
                element = document.createElement('p');
                element.innerHTML = block.content;
            } else if (block.type === 'h2') {
                element = document.createElement('h2');
                element.className = 'wechat-h2';
                element.innerHTML = block.content;
            } else if (block.type === 'h3') {
                element = document.createElement('h3');
                element.className = 'wechat-h3';
                element.innerHTML = block.content;
            } else if (block.type === 'quote-orange') {
                element = document.createElement('div');
                element.className = 'wechat-quote-box';
                element.innerHTML = `
                    <p class="quote-title-orange">${block.title}</p>
                    <p class="quote-body-orange">${block.body}</p>
                `;
            } else if (block.type === 'quote-cyan') {
                element = document.createElement('div');
                element.className = 'wechat-quote-box cyan';
                element.innerHTML = `
                    <p class="quote-title-cyan">${block.title}</p>
                    <p class="quote-body-cyan">${block.body1}</p>
                    <p class="quote-body-cyan spaced">${block.body2}</p>
                `;
            } else if (block.type === 'list') {
                element = document.createElement('ul');
                element.className = 'wechat-list';
                element.innerHTML = block.items.map(item => `<li>${item}</li>`).join('');
            } else if (block.type === 'table') {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = block.content;
                element = tempDiv.firstElementChild || document.createElement('table');
            } else if (block.type === 'hr') {
                element = document.createElement('hr');
                element.className = 'wechat-hr';
            } else if (block.type === 'footer') {
                element = document.createElement('p');
                element.className = 'wechat-footer';
                element.innerHTML = `<strong>${block.content}</strong>`;
            }
            
            if (element) {
                body.appendChild(element);
            }
        });
    }

    function renderBlocksEditor() {
        const container = document.getElementById('blocksContainer');
        container.innerHTML = '';
        
        articleBlocks.forEach((block, index) => {
            const card = document.createElement('div');
            card.className = 'block-card';
            card.setAttribute('data-id', block.id);
            
            const header = document.createElement('div');
            header.className = 'block-card-header';
            header.innerHTML = `
                <span class="block-badge ${block.type}">${block.type}</span>
                <div class="block-actions">
                    <button class="block-act-btn btn-move-up" title="上移" ${index === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>🔼</button>
                    <button class="block-act-btn btn-move-down" title="下移" ${index === articleBlocks.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>🔽</button>
                    <button class="block-act-btn btn-insert-below" title="下方插入新区块">➕</button>
                    <button class="block-act-btn delete btn-delete-block" title="删除">❌</button>
                </div>
            `;
            
            const body = document.createElement('div');
            body.className = 'block-card-body';
            
            if (block.type === 'paragraph' || block.type === 'intro' || block.type === 'h2' || block.type === 'h3' || block.type === 'footer' || block.type === 'table') {
                const textarea = document.createElement('textarea');
                textarea.className = 'block-textarea';
                textarea.value = block.content;
                textarea.placeholder = block.type === 'table' ? '<table> 原始 HTML...' : '输入文本内容...';
                textarea.addEventListener('input', (e) => {
                    block.content = e.target.value;
                    renderSimulator();
                    saveState();
                });
                body.appendChild(textarea);
            } else if (block.type === 'quote-orange') {
                const titleInput = document.createElement('input');
                titleInput.className = 'form-control btn-sm';
                titleInput.value = block.title;
                titleInput.style.fontWeight = 'bold';
                titleInput.addEventListener('input', (e) => {
                    block.title = e.target.value;
                    renderSimulator();
                    saveState();
                });
                
                const bodyText = document.createElement('textarea');
                bodyText.className = 'block-textarea';
                bodyText.value = block.body;
                bodyText.addEventListener('input', (e) => {
                    block.body = e.target.value;
                    renderSimulator();
                    saveState();
                });
                
                body.appendChild(titleInput);
                body.appendChild(bodyText);
            } else if (block.type === 'quote-cyan') {
                const titleInput = document.createElement('input');
                titleInput.className = 'form-control btn-sm';
                titleInput.value = block.title;
                titleInput.style.fontWeight = 'bold';
                titleInput.addEventListener('input', (e) => {
                    block.title = e.target.value;
                    renderSimulator();
                    saveState();
                });
                
                const bodyText1 = document.createElement('textarea');
                bodyText1.className = 'block-textarea';
                bodyText1.value = block.body1;
                bodyText1.placeholder = '段落 1...';
                bodyText1.addEventListener('input', (e) => {
                    block.body1 = e.target.value;
                    renderSimulator();
                    saveState();
                });
                
                const bodyText2 = document.createElement('textarea');
                bodyText2.className = 'block-textarea';
                bodyText2.value = block.body2;
                bodyText2.placeholder = '段落 2...';
                bodyText2.addEventListener('input', (e) => {
                    block.body2 = e.target.value;
                    renderSimulator();
                    saveState();
                });
                
                body.appendChild(titleInput);
                body.appendChild(bodyText1);
                body.appendChild(bodyText2);
            } else if (block.type === 'image' || block.type === 'video') {
                const preview = document.createElement('div');
                preview.className = 'block-media-preview';
                if (block.type === 'image') {
                    preview.innerHTML = `<img src="${block.src || 'placeholder.png'}" alt="Preview">`;
                } else {
                    preview.innerHTML = `<video src="${block.src || ''}" controls style="width:100%;height:100%;"></video>`;
                }
                
                const uploadContainer = document.createElement('div');
                uploadContainer.className = 'block-media-upload';
                uploadContainer.innerHTML = `
                    <span>📁 选择本地${block.type === 'image' ? '图片' : '视频'}文件</span>
                    <input type="file" accept="${block.type === 'image' ? 'image/*' : 'video/*'}" style="display:none;">
                    <span style="font-size:0.7rem; color:var(--accent-cyan); word-break:break-all;">${block.filename || block.src || '未选择文件'}</span>
                `;
                
                const fileInput = uploadContainer.querySelector('input');
                uploadContainer.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const url = URL.createObjectURL(file);
                        block.src = url;
                        block.filename = file.name;
                        
                        if (block.type === 'image') {
                            preview.querySelector('img').src = url;
                        } else {
                            preview.querySelector('video').src = url;
                        }
                        
                        uploadContainer.querySelector('span:last-child').textContent = file.name;
                        renderSimulator();
                        saveState();
                    }
                });
                
                const captionInput = document.createElement('input');
                captionInput.className = 'form-control btn-sm';
                captionInput.value = block.caption;
                captionInput.placeholder = '编辑媒体下标说明...';
                captionInput.addEventListener('input', (e) => {
                    block.caption = e.target.value;
                    renderSimulator();
                    saveState();
                });
                
                body.appendChild(preview);
                body.appendChild(uploadContainer);
                body.appendChild(captionInput);
            } else if (block.type === 'list') {
                const listItemsContainer = document.createElement('div');
                listItemsContainer.style.display = 'flex';
                listItemsContainer.style.flexDirection = 'column';
                listItemsContainer.style.gap = '6px';
                
                block.items.forEach((item, itemIdx) => {
                    const itemRow = document.createElement('div');
                    itemRow.style.display = 'flex';
                    itemRow.style.gap = '6px';
                    
                    const itemInput = document.createElement('input');
                    itemInput.className = 'form-control btn-sm';
                    itemInput.value = item;
                    itemInput.style.flexGrow = '1';
                    itemInput.addEventListener('input', (e) => {
                        block.items[itemIdx] = e.target.value;
                        renderSimulator();
                        saveState();
                    });
                    
                    const btnDelItem = document.createElement('button');
                    btnDelItem.className = 'block-act-btn delete';
                    btnDelItem.textContent = '✖';
                    btnDelItem.addEventListener('click', () => {
                        block.items.splice(itemIdx, 1);
                        renderBlocksEditor();
                        renderSimulator();
                        saveState();
                    });
                    
                    itemRow.appendChild(itemInput);
                    itemRow.appendChild(btnDelItem);
                    listItemsContainer.appendChild(itemRow);
                });
                
                const btnAddItem = document.createElement('button');
                btnAddItem.className = 'btn btn-secondary btn-sm';
                btnAddItem.textContent = '➕ 增加列表项';
                btnAddItem.style.marginTop = '6px';
                btnAddItem.addEventListener('click', () => {
                    block.items.push('新列表项...');
                    renderBlocksEditor();
                    renderSimulator();
                    saveState();
                });
                
                body.appendChild(listItemsContainer);
                body.appendChild(btnAddItem);
            } else if (block.type === 'hr') {
                const label = document.createElement('span');
                label.style.fontSize = '0.8rem';
                label.style.color = 'var(--text-muted)';
                label.textContent = '--- 微信水平分割线 (无文字) ---';
                body.appendChild(label);
            }
            
            card.appendChild(header);
            card.appendChild(body);
            container.appendChild(card);
            
            header.querySelector('.btn-move-up').addEventListener('click', (e) => {
                e.stopPropagation();
                if (index > 0) {
                    swapBlocks(index, index - 1);
                }
            });
            
            header.querySelector('.btn-move-down').addEventListener('click', (e) => {
                e.stopPropagation();
                if (index < articleBlocks.length - 1) {
                    swapBlocks(index, index + 1);
                }
            });
            
            header.querySelector('.btn-delete-block').addEventListener('click', (e) => {
                e.stopPropagation();
                articleBlocks.splice(index, 1);
                renderBlocksEditor();
                renderSimulator();
                saveState();
            });
            
            header.querySelector('.btn-insert-below').addEventListener('click', (e) => {
                e.stopPropagation();
                showInsertMenu(index);
            });
        });
    }

    function swapBlocks(idx1, idx2) {
        const temp = articleBlocks[idx1];
        articleBlocks[idx1] = articleBlocks[idx2];
        articleBlocks[idx2] = temp;
        renderBlocksEditor();
        renderSimulator();
        saveState();
    }

    function saveState() {
        localStorage.setItem('wechat_article_blocks', JSON.stringify(articleBlocks));
    }

    function showInsertMenu(index) {
        const existingMenu = document.getElementById('insertMenu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.id = 'insertMenu';
        menu.style.background = 'var(--bg-secondary)';
        menu.style.border = '1.5px solid var(--accent-cyan)';
        menu.style.borderRadius = '8px';
        menu.style.padding = '12px';
        menu.style.margin = '10px 0';
        menu.style.display = 'flex';
        menu.style.flexWrap = 'wrap';
        menu.style.gap = '8px';
        
        const types = [
            { type: 'paragraph', name: '➕ 段落' },
            { type: 'h2', name: '➕ H2标题' },
            { type: 'h3', name: '➕ H3标题' },
            { type: 'quote-orange', name: '➕ 橙色引用' },
            { type: 'quote-cyan', name: '➕ 青色引用' },
            { type: 'image', name: '➕ 图片' },
            { type: 'video', name: '➕ 视频' },
            { type: 'list', name: '➕ 列表' },
            { type: 'table', name: '➕ 表格' },
            { type: 'hr', name: '➕ 分割线' }
        ];
        
        types.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary btn-sm';
            btn.textContent = t.name;
            btn.addEventListener('click', () => {
                insertBlock(index + 1, t.type);
                menu.remove();
            });
            menu.appendChild(btn);
        });
        
        const cards = document.querySelectorAll('.block-card');
        const targetCard = cards[index];
        targetCard.after(menu);
    }

    function insertBlock(index, type) {
        let block = {
            id: maxId++,
            type: type
        };
        
        if (type === 'paragraph' || type === 'h2' || type === 'h3' || type === 'footer') {
            block.content = '新内容...';
        } else if (type === 'quote-orange') {
            block.title = '💡 架构深思：';
            block.body = '新思考内容...';
        } else if (type === 'quote-cyan') {
            block.title = '🌲 场景直观比喻：';
            block.body1 = '输入第一段比喻...';
            block.body2 = '输入第二段比喻...';
        } else if (type === 'image') {
            block.src = 'pydantic_rust_core.png';
            block.caption = '新图片下标描述';
        } else if (type === 'video') {
            block.src = '';
            block.caption = '新视频下标描述';
        } else if (type === 'list') {
            block.items = ['第一个列表项...'];
        } else if (type === 'table') {
            block.content = '<table class="wechat-table"><thead><tr><th>对比维度</th><th>系统A</th><th>系统B</th></tr></thead><tbody><tr><td>性能</td><td>慢</td><td>快</td></tr></tbody></table>';
        } else if (type === 'hr') {
            // divider
        }
        
        articleBlocks.splice(index, 0, block);
        renderBlocksEditor();
        renderSimulator();
        saveState();
    }

    // --- Toolbar Handlers ---
    document.getElementById('btnAddParagraph').addEventListener('click', () => {
        insertBlock(articleBlocks.length, 'paragraph');
        renderBlocksEditor();
    });
    document.getElementById('btnAddH2').addEventListener('click', () => {
        insertBlock(articleBlocks.length, 'h2');
        renderBlocksEditor();
    });
    document.getElementById('btnAddH3').addEventListener('click', () => {
        insertBlock(articleBlocks.length, 'h3');
        renderBlocksEditor();
    });
    document.getElementById('btnAddQuoteOrange').addEventListener('click', () => {
        insertBlock(articleBlocks.length, 'quote-orange');
        renderBlocksEditor();
    });
    document.getElementById('btnAddQuoteCyan').addEventListener('click', () => {
        insertBlock(articleBlocks.length, 'quote-cyan');
        renderBlocksEditor();
    });

    // --- Headless CMS Sync ---
    const btnSaveHeadless = document.getElementById('btnSaveHeadless');
    btnSaveHeadless.addEventListener('click', async () => {
        const html = compileWechatHtml();
        
        try {
            btnSaveHeadless.textContent = '⏳ 正在保存至 CMS...';
            btnSaveHeadless.disabled = true;
            
            const response = await fetch('http://127.0.0.1:8080/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8'
                },
                body: html
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                showToast("成功保存至 Headless CMS (pushed_article.html)！");
            } else {
                showToast("保存失败: " + data.message);
            }
        } catch (err) {
            console.error(err);
            showToast("连接 Headless CMS 失败，请确保本地服务处于运行状态。");
        } finally {
            btnSaveHeadless.textContent = '💾 保存至本地 Headless CMS';
            btnSaveHeadless.disabled = false;
        }
    });

    // --- Boot Initializer ---
    const savedBlocks = localStorage.getItem('wechat_article_blocks');
    if (savedBlocks) {
        articleBlocks = JSON.parse(savedBlocks);
        renderSimulator();
    } else {
        parseHtmlToBlocks();
    }
    
    // Bind Tab Click to block editor rendering
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            if (tabId === 'blocks') {
                renderBlocksEditor();
            }
        });
    });

    // Clean Video tags for WeChat pasting inside compileWechatHtml
    const originalCompileWechatHtml = compileWechatHtml;
    compileWechatHtml = function() {
        let html = originalCompileWechatHtml();
        // Replace simulated video containers with a gorgeous WeChat-styled guide box
        html = html.replace(/<div class="wechat-video-block-wrapper">([\s\S]*?)<\/div>/g, (match, p1) => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = p1;
            const captionNode = tempDiv.querySelector('.img-caption') || tempDiv.nextElementSibling;
            const captionText = captionNode ? captionNode.textContent : '视频素材';
            return `<div style="margin: 20px 0; padding: 18px; border: 1.5px dashed #ec4899; background-color: #fdf2f8; border-radius: 8px; text-align: center; font-size: 15px; color: #db2777; font-family: sans-serif;">🎥 [请在此处插入视频素材：${captionText}]</div>`;
        });
        return html;
    };

});
