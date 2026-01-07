// 恋爱记录应用主要逻辑
class LoveRecordApp {
    constructor() {
        this.records = [];
        this.anniversaries = [];
        this.operationLogs = [];
        this.currentTab = 'K';
        this.editingId = null;
        this.editingAnniversaryId = null;
        this.settings = {
            theme: 'pink',
            font: 'Inter',
            background: 'default',
            customBackground: null,
            backgroundOpacity: 0.8
        };
        this.apiBase = '/api';
        this.init();
    }

    // 初始化应用
    async init() {
        this.loadSettings();
        this.applySettings();
        this.bindEvents();
        await this.loadRecordsFromAPI();
        await this.loadAnniversariesFromAPI();
        await this.loadOperationLogsFromAPI();
        this.renderRecords();
        this.updateStats();
        this.setCurrentDate();
    }

    // API调用方法
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API调用失败:', error);
            this.showNotification('网络请求失败，请检查连接', 'error');
            throw error;
        }
    }

    // 从API加载记录
    async loadRecordsFromAPI() {
        try {
            this.showLoading(true);
            const records = await this.apiCall('/records');
            this.records = records.map(record => ({
                ...record,
                id: record.id.toString() // 确保ID是字符串
            }));
        } catch (error) {
            console.error('加载记录失败:', error);
            this.records = [];
        } finally {
            this.showLoading(false);
        }
    }

    // 从API加载纪念日
    async loadAnniversariesFromAPI() {
        try {
            const anniversaries = await this.apiCall('/anniversaries');
            this.anniversaries = anniversaries.map(anniversary => ({
                ...anniversary,
                id: anniversary.id.toString() // 确保ID是字符串
            }));
        } catch (error) {
            console.error('加载纪念日失败:', error);
            this.anniversaries = [];
        }
    }

    // 从API加载操作日志
    async loadOperationLogsFromAPI() {
        try {
            const logs = await this.apiCall('/operation-logs?limit=50');
            this.operationLogs = logs;
        } catch (error) {
            console.error('加载操作日志失败:', error);
            this.operationLogs = [];
        }
    }

    // 显示/隐藏加载状态
    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const recordsContainer = document.getElementById('recordsContainer');
        
        if (!loadingState || !recordsContainer) {
            console.warn('showLoading: 找不到必要的DOM元素');
            return;
        }
        
        if (show) {
            loadingState.classList.remove('hidden');
            recordsContainer.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
            recordsContainer.classList.remove('hidden');
        }
    }

    // 显示通知
    showNotification(message, type = 'success') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 绑定事件监听器
    bindEvents() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 确保获取到正确的按钮元素
                const button = e.target.closest('.tab-btn');
                if (button && button.dataset.tab) {
                    this.switchTab(button.dataset.tab);
                }
            });
        });

        // 添加记录按钮
        document.getElementById('addRecordBtn').addEventListener('click', () => {
            if (this.currentTab === 'anniversaries') {
                this.openAnniversaryModal();
            } else {
                this.openModal();
            }
        });

        // 导出按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportRecords();
        });

        // 模态框相关
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // 表单提交
        document.getElementById('recordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRecord();
        });

        // 心情标签选择
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectMood(e.target.dataset.mood);
            });
        });

        // 排序和筛选
        document.getElementById('sortSelect').addEventListener('change', () => {
            this.renderRecords();
        });

        document.getElementById('moodFilter').addEventListener('change', () => {
            this.renderRecords();
        });

        // 删除确认模态框
        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        // 纪念日相关事件
        document.getElementById('closeAnniversaryModal').addEventListener('click', () => {
            this.closeAnniversaryModal();
        });

        document.getElementById('cancelAnniversaryBtn').addEventListener('click', () => {
            this.closeAnniversaryModal();
        });

        document.getElementById('anniversaryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAnniversary();
        });

        // 删除纪念日确认模态框
        document.getElementById('confirmDeleteAnniversary').addEventListener('click', () => {
            this.confirmDeleteAnniversary();
        });

        document.getElementById('cancelDeleteAnniversary').addEventListener('click', () => {
            this.closeDeleteAnniversaryModal();
        });

        // 设置相关事件
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettingsModal();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeSettingsModal();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });

        // 主题选择
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTheme(e.target.dataset.theme);
            });
        });

        // 字体选择
        document.querySelectorAll('.font-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectFont(e.target.dataset.font);
            });
        });

        // 背景选择
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectBackground(e.target.dataset.bg);
            });
        });

        // 背景透明度调节
        document.getElementById('bgOpacitySlider').addEventListener('input', (e) => {
            this.updateBackgroundOpacity(e.target.value);
        });

        // 自定义背景上传
        document.getElementById('uploadCustomBgBtn').addEventListener('click', () => {
            document.getElementById('customBgInput').click();
        });

        document.getElementById('customBgInput').addEventListener('change', (e) => {
            this.handleCustomBackgroundUpload(e);
        });

        document.getElementById('removeCustomBg').addEventListener('click', () => {
            this.removeCustomBackground();
        });
    }

    // 导出记录
    async exportRecords() {
        try {
            const category = this.currentTab === 'all' ? null : this.currentTab;
            const exportData = await this.apiCall(`/records/export${category ? `?category=${category}` : ''}`);
            
            // 创建下载链接
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `恋爱记录_${category || '全部'}_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('记录导出成功！');
        } catch (error) {
            console.error('导出失败:', error);
            this.showNotification('导出失败，请重试', 'error');
        }
    }

    // 切换标签页
    switchTab(tab) {
        // 验证tab参数
        if (!tab) {
            console.warn('switchTab: tab参数为空');
            return;
        }
        
        this.currentTab = tab;
        
        // 更新标签页样式
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active', 'text-pink-600', 'border-pink-500');
            btn.classList.add('text-gray-600');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'text-pink-600', 'border-pink-500');
            activeBtn.classList.remove('text-gray-600');
        } else {
            console.warn(`switchTab: 找不到data-tab="${tab}"的按钮`);
        }
        
        // 更新添加按钮文本和显示/隐藏
        const addBtn = document.getElementById('addBtn');
        const addBtnText = document.getElementById('addBtnText');
        if (addBtnText && addBtn) {
            if (tab === 'anniversaries') {
                addBtnText.textContent = '添加纪念日';
                addBtn.style.display = 'flex';
            } else if (tab === 'logs') {
                addBtn.style.display = 'none'; // 操作日志页面不显示添加按钮
            } else {
                addBtnText.textContent = '添加记录';
                addBtn.style.display = 'flex';
            }
        }
        
        // 根据标签页类型渲染不同内容
        if (tab === 'anniversaries') {
            this.renderAnniversaries();
        } else if (tab === 'logs') {
            this.renderOperationLogs();
        } else {
            this.renderRecords();
        }
    }

    // 渲染记录列表
    renderRecords() {
        const container = document.getElementById('recordsContainer');
        const emptyState = document.getElementById('emptyState');
        
        // 筛选记录
        let filteredRecords = this.records;
        
        // 按分类筛选
        if (this.currentTab !== 'all') {
            filteredRecords = filteredRecords.filter(record => record.category === this.currentTab);
        }
        
        // 按心情筛选
        const moodFilter = document.getElementById('moodFilter').value;
        if (moodFilter !== 'all') {
            filteredRecords = filteredRecords.filter(record => record.mood === moodFilter);
        }
        
        // 排序
        const sortOrder = document.getElementById('sortSelect').value;
        filteredRecords.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortOrder === 'date-desc' ? dateB - dateA : dateA - dateB;
        });
        
        // 显示记录或空状态
        if (filteredRecords.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            container.innerHTML = filteredRecords.map(record => this.createRecordCard(record)).join('');
            
            // 绑定卡片事件
            this.bindCardEvents();
        }
    }

    // 创建记录卡片
    createRecordCard(record) {
        const categoryClass = record.category.replace('&', '-');
        return `
            <div class="record-card category-${categoryClass} fade-in" data-id="${record.id}">
                <div class="category-tag ${categoryClass}">${record.category}</div>
                <div class="card-content p-6">
                    <div class="date-display">${this.formatDate(record.date)}</div>
                    <p class="description-text">${record.description}</p>
                    <div class="flex items-center justify-between">
                        <span class="mood-tag ${record.mood}">${this.getMoodEmoji(record.mood)} ${record.mood}</span>
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" onclick="app.editRecord('${record.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="app.deleteRecord('${record.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 绑定卡片事件
    bindCardEvents() {
        // 这里可以添加额外的卡片交互事件
    }

    // 获取心情表情符号
    getMoodEmoji(mood) {
        const emojiMap = {
            '开心': '😊',
            '难过': '😢',
            '感动': '🥺',
            '兴奋': '🤩',
            '平静': '😌',
            '甜蜜': '🥰'
        };
        return emojiMap[mood] || '😊';
    }

    // 格式化日期
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 打开模态框
    openModal(record = null) {
        const modal = document.getElementById('recordModal');
        const title = document.getElementById('modalTitle');
        
        if (!modal) {
            console.warn('openModal: 找不到recordModal元素');
            return;
        }
        
        if (title) {
            if (record) {
                title.textContent = '编辑记录';
                this.editingId = record.id;
                this.fillForm(record);
            } else {
                title.textContent = '添加记录';
                this.editingId = null;
                this.clearForm();
            }
        }
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('recordModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        document.body.style.overflow = 'auto';
        this.clearForm();
    }

    // 填充表单
    fillForm(record) {
        const categoryInput = document.getElementById('categoryInput');
        const dateInput = document.getElementById('dateInput');
        const descInput = document.getElementById('descriptionInput');
        const moodInput = document.getElementById('moodInput');
        
        if (categoryInput) categoryInput.value = record.category;
        if (dateInput) dateInput.value = record.date;
        if (descInput) descInput.value = record.description;
        if (moodInput) moodInput.value = record.mood;
        
        // 选中心情按钮
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mood === record.mood) {
                btn.classList.add('selected');
            }
        });
    }

    // 清空表单
    clearForm() {
        const form = document.getElementById('recordForm');
        const categoryInput = document.getElementById('categoryInput');
        
        if (form) form.reset();
        if (categoryInput) categoryInput.value = this.currentTab;
        
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }

    // 选择心情
    selectMood(mood) {
        document.getElementById('moodInput').value = mood;
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mood === mood) {
                btn.classList.add('selected');
            }
        });
    }

    // 保存记录
    async saveRecord() {
        const categoryInput = document.getElementById('categoryInput');
        const dateInput = document.getElementById('dateInput');
        const descInput = document.getElementById('descriptionInput');
        const moodInput = document.getElementById('moodInput');
        
        if (!categoryInput || !dateInput || !descInput || !moodInput) {
            console.warn('saveRecord: 找不到必要的表单元素');
            this.showNotification('表单元素缺失，请刷新页面重试', 'error');
            return;
        }
        
        const formData = {
            category: categoryInput.value,
            date: dateInput.value,
            description: descInput.value,
            mood: moodInput.value,
            timestamp: new Date(dateInput.value).getTime()
        };

        try {
            if (this.editingId) {
                // 更新记录
                const updatedRecord = await this.apiCall(`/records/${this.editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                
                // 更新本地记录
                const index = this.records.findIndex(r => r.id.toString() === this.editingId);
                if (index !== -1) {
                    this.records[index] = { ...updatedRecord, id: updatedRecord.id.toString() };
                }
                
                this.showNotification('记录更新成功！');
            } else {
                // 创建新记录
                const newRecord = await this.apiCall('/records', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                // 添加到本地记录
                this.records.unshift({ ...newRecord, id: newRecord.id.toString() });
                this.showNotification('记录添加成功！');
            }
            
            this.closeModal();
            this.renderRecords();
            this.updateStats();
        } catch (error) {
            console.error('保存记录失败:', error);
            this.showNotification('保存失败，请重试', 'error');
        }
    }

    // 编辑记录
    editRecord(id) {
        const record = this.records.find(r => r.id.toString() === id.toString());
        if (record) {
            this.openModal(record);
        }
    }

    // 删除记录
    deleteRecord(id) {
        this.deletingId = id;
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            console.warn('deleteRecord: 找不到deleteModal元素');
        }
    }

    // 确认删除
    async confirmDelete() {
        try {
            await this.apiCall(`/records/${this.deletingId}`, {
                method: 'DELETE'
            });
            
            // 从本地记录中移除
            this.records = this.records.filter(r => r.id.toString() !== this.deletingId.toString());
            
            this.closeDeleteModal();
            this.renderRecords();
            this.updateStats();
            this.showNotification('记录删除成功！');
        } catch (error) {
            console.error('删除记录失败:', error);
            this.showNotification('删除失败，请重试', 'error');
        }
    }

    // 关闭删除模态框
    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.deletingId = null;
    }

    // 更新统计信息
    updateStats() {
        const totalCount = this.records.length;
        const happyCount = this.records.filter(r => r.mood === '开心').length;
        const sweetCount = this.records.filter(r => r.mood === '甜蜜').length;
        
        const totalCountEl = document.getElementById('totalCount');
        const happyCountEl = document.getElementById('happyCount');
        const sweetCountEl = document.getElementById('sweetCount');
        
        if (totalCountEl) totalCountEl.textContent = totalCount;
        if (happyCountEl) happyCountEl.textContent = happyCount;
        if (sweetCountEl) sweetCountEl.textContent = sweetCount;
    }

    // 设置当前日期
    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('dateInput');
        if (dateInput) {
            dateInput.value = today;
        }
    }

    // 设置相关方法
    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.updateSettingsUI();
        } else {
            console.warn('openSettingsModal: 找不到settingsModal元素');
        }
    }

    closeSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    updateSettingsUI() {
        // 更新主题选择
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.theme === this.settings.theme) {
                btn.classList.add('selected');
            }
        });

        // 更新字体选择
        document.querySelectorAll('.font-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.font === this.settings.font) {
                btn.classList.add('selected');
            }
        });

        // 更新背景选择
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.bg === this.settings.background) {
                btn.classList.add('selected');
            }
        });

        // 更新透明度滑块
        document.getElementById('bgOpacitySlider').value = this.settings.backgroundOpacity;
        document.getElementById('opacityValue').textContent = Math.round(this.settings.backgroundOpacity * 100) + '%';
    }

    selectTheme(theme) {
        this.settings.theme = theme;
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.theme === theme) {
                btn.classList.add('selected');
            }
        });
        this.applyTheme();
    }

    selectFont(font) {
        this.settings.font = font;
        document.querySelectorAll('.font-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.font === font) {
                btn.classList.add('selected');
            }
        });
        this.applyFont();
    }

    selectBackground(bg) {
        this.settings.background = bg;
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.bg === bg) {
                btn.classList.add('selected');
            }
        });
        this.applyBackground();
    }

    updateBackgroundOpacity(opacity) {
        this.settings.backgroundOpacity = parseFloat(opacity);
        document.getElementById('opacityValue').textContent = Math.round(opacity * 100) + '%';
        this.applyBackground();
    }

    handleCustomBackgroundUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.settings.customBackground = e.target.result;
                document.getElementById('customBgImg').src = e.target.result;
                document.getElementById('customBgPreview').classList.remove('hidden');
                document.getElementById('customBgBtn').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    removeCustomBackground() {
        this.settings.customBackground = null;
        document.getElementById('customBgPreview').classList.add('hidden');
        document.getElementById('customBgBtn').classList.add('hidden');
        document.getElementById('customBgInput').value = '';
    }

    applySettings() {
        this.applyTheme();
        this.applyFont();
        this.applyBackground();
    }

    applyTheme() {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${this.settings.theme}`);
    }

    applyFont() {
        document.body.className = document.body.className.replace(/font-\w+/g, '');
        document.body.classList.add(`font-${this.settings.font}`);
    }

    applyBackground() {
        const body = document.body;
        
        // 移除所有背景类
        body.className = body.className.replace(/bg-\w+/g, '');
        body.classList.remove('bg-overlay');
        
        if (this.settings.background === 'custom' && this.settings.customBackground) {
            body.style.backgroundImage = `url(${this.settings.customBackground})`;
            body.classList.add('bg-custom');
        } else if (this.settings.background !== 'default') {
            body.classList.add(`bg-${this.settings.background}`);
        } else {
            body.style.backgroundImage = '';
            body.classList.add('bg-gradient-to-br', 'from-pink-50', 'to-purple-50');
        }
        
        if (this.settings.background !== 'default') {
            body.classList.add('bg-overlay');
            const overlay = body.querySelector('::before') || body;
            if (overlay) {
                body.style.setProperty('--bg-opacity', this.settings.backgroundOpacity);
            }
        }
    }

    saveSettings() {
        localStorage.setItem('loveRecordSettings', JSON.stringify(this.settings));
        this.showNotification('设置保存成功！');
        this.closeSettingsModal();
    }

    loadSettings() {
        const saved = localStorage.getItem('loveRecordSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    resetSettings() {
        this.settings = {
            theme: 'pink',
            font: 'Inter',
            background: 'default',
            customBackground: null,
            backgroundOpacity: 0.8
        };
        this.applySettings();
        this.updateSettingsUI();
        this.showNotification('设置已重置为默认值！');
    }

    // 纪念日相关方法
    renderAnniversaries() {
        const container = document.getElementById('recordsContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (this.anniversaries.length === 0) {
            container.innerHTML = '';
            emptyState.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-calendar-heart text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">还没有纪念日记录</h3>
                    <p class="text-gray-500 mb-6">记录下那些特殊的日子吧</p>
                    <button onclick="app.openAnniversaryModal()" class="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                        <i class="fas fa-plus mr-2"></i>添加纪念日
                    </button>
                </div>
            `;
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            // 按日期排序纪念日
            const sortedAnniversaries = [...this.anniversaries].sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
            });
            
            container.innerHTML = `
                <div class="mb-8 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">纪念日记录</h2>
                    <button onclick="app.openAnniversaryModal()" class="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                        <i class="fas fa-plus mr-2"></i>添加纪念日
                    </button>
                </div>
                <div class="anniversary-grid">
                    ${sortedAnniversaries.map(anniversary => this.createAnniversaryCard(anniversary)).join('')}
                </div>
            `;
            
            // 绑定纪念日卡片事件
            this.bindAnniversaryCardEvents();
        }
    }

    createAnniversaryCard(anniversary) {
        const date = new Date(anniversary.date);
        const today = new Date();
        const currentYear = today.getFullYear();
        
        // 计算距离下次纪念日的天数
        let nextDate = new Date(anniversary.date);
        if (anniversary.is_recurring) {
            nextDate.setFullYear(currentYear);
            if (nextDate < today) {
                nextDate.setFullYear(currentYear + 1);
            }
        }
        
        const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        const isPast = !anniversary.is_recurring && date < today;
        
        const categoryIcons = {
            love: 'fas fa-heart',
            birthday: 'fas fa-birthday-cake',
            meeting: 'fas fa-handshake',
            holiday: 'fas fa-star',
            anniversary: 'fas fa-calendar-heart'
        };
        
        const categoryColors = {
            love: 'text-red-500',
            birthday: 'text-yellow-500',
            meeting: 'text-blue-500',
            holiday: 'text-purple-500',
            anniversary: 'text-pink-500'
        };
        
        return `
            <div class="anniversary-card bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 p-6 ${isPast ? 'opacity-75' : ''}">
                <div class="flex justify-between items-start mb-6">
                    <div class="flex items-center">
                        <i class="${categoryIcons[anniversary.category] || 'fas fa-calendar-heart'} ${categoryColors[anniversary.category] || 'text-pink-500'} text-3xl mr-4"></i>
                        <div>
                            <h3 class="font-bold text-xl text-gray-800 mb-2 leading-tight">${anniversary.title}</h3>
                            <p class="text-base text-gray-500 font-medium">${date.toLocaleDateString('zh-CN')}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="app.editAnniversary('${anniversary.id}')" class="text-blue-500 hover:text-blue-700 p-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.deleteAnniversary('${anniversary.id}')" class="text-red-500 hover:text-red-700 p-2">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${anniversary.description ? `<p class="text-gray-600 mb-6 text-base leading-relaxed line-clamp-3">${anniversary.description}</p>` : ''}
                
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        ${anniversary.is_recurring ? '<span class="bg-green-100 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">每年重复</span>' : '<span class="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium">单次</span>'}
                        ${anniversary.reminder_days > 0 ? `<span class="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-sm font-medium">提前${anniversary.reminder_days}天提醒</span>` : ''}
                    </div>
                    ${!isPast && daysUntil >= 0 ? `
                        <div class="text-right">
                            <span class="text-pink-600 font-semibold text-lg">
                                ${daysUntil === 0 ? '今天！' : daysUntil === 1 ? '明天' : `${daysUntil}天后`}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    bindAnniversaryCardEvents() {
        // 纪念日卡片事件已通过onclick绑定
    }

    openAnniversaryModal(anniversaryId = null) {
        this.editingAnniversaryId = anniversaryId;
        const modal = document.getElementById('anniversaryModal');
        const title = document.getElementById('anniversaryModalTitle');
        
        if (!modal) {
            console.warn('openAnniversaryModal: 找不到anniversaryModal元素');
            return;
        }
        
        if (title) {
            if (anniversaryId) {
                title.textContent = '编辑纪念日';
                const anniversary = this.anniversaries.find(a => a.id === anniversaryId);
                if (anniversary) {
                    const titleInput = document.getElementById('anniversaryTitleInput');
                    const dateInput = document.getElementById('anniversaryDateInput');
                    const descInput = document.getElementById('anniversaryDescriptionInput');
                    const categoryInput = document.getElementById('anniversaryCategoryInput');
                    const recurringInput = document.getElementById('anniversaryRecurringInput');
                    const reminderInput = document.getElementById('anniversaryReminderInput');
                    
                    if (titleInput) titleInput.value = anniversary.title;
                    if (dateInput) dateInput.value = anniversary.date;
                    if (descInput) descInput.value = anniversary.description || '';
                    if (categoryInput) categoryInput.value = anniversary.category;
                    if (recurringInput) recurringInput.checked = anniversary.is_recurring;
                    if (reminderInput) reminderInput.value = anniversary.reminder_days;
                }
            } else {
                title.textContent = '添加纪念日';
                const form = document.getElementById('anniversaryForm');
                if (form) form.reset();
            }
        }
        
        modal.classList.remove('hidden');
    }

    closeAnniversaryModal() {
        const modal = document.getElementById('anniversaryModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingAnniversaryId = null;
    }

    async saveAnniversary() {
        const titleInput = document.getElementById('anniversaryTitleInput');
        const dateInput = document.getElementById('anniversaryDateInput');
        const descInput = document.getElementById('anniversaryDescriptionInput');
        const categoryInput = document.getElementById('anniversaryCategoryInput');
        const recurringInput = document.getElementById('anniversaryRecurringInput');
        const reminderInput = document.getElementById('anniversaryReminderInput');
        
        if (!titleInput || !dateInput || !categoryInput) {
            console.warn('saveAnniversary: 找不到必要的表单元素');
            this.showNotification('表单元素缺失，请刷新页面重试', 'error');
            return;
        }
        
        const title = titleInput.value;
        const date = dateInput.value;
        const description = descInput ? descInput.value : '';
        const category = categoryInput.value;
        const isRecurring = recurringInput ? recurringInput.checked : false;
        const reminderDays = reminderInput ? parseInt(reminderInput.value) : 1;
        
        const anniversaryData = {
            title,
            date,
            description,
            category,
            is_recurring: isRecurring,
            reminder_days: reminderDays
        };
        
        try {
            if (this.editingAnniversaryId) {
                // 更新纪念日
                await this.apiCall(`/anniversaries/${this.editingAnniversaryId}`, {
                    method: 'PUT',
                    body: JSON.stringify(anniversaryData)
                });
                this.showNotification('纪念日更新成功！');
            } else {
                // 创建新纪念日
                await this.apiCall('/anniversaries', {
                    method: 'POST',
                    body: JSON.stringify(anniversaryData)
                });
                this.showNotification('纪念日添加成功！');
            }
            
            await this.loadAnniversariesFromAPI();
            this.renderAnniversaries();
            this.closeAnniversaryModal();
        } catch (error) {
            console.error('保存纪念日失败:', error);
            this.showNotification('保存失败，请重试', 'error');
        }
    }

    editAnniversary(anniversaryId) {
        this.openAnniversaryModal(anniversaryId);
    }

    deleteAnniversary(anniversaryId) {
        this.editingAnniversaryId = anniversaryId;
        const modal = document.getElementById('deleteAnniversaryModal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            console.warn('deleteAnniversary: 找不到deleteAnniversaryModal元素');
        }
    }

    closeDeleteAnniversaryModal() {
        const modal = document.getElementById('deleteAnniversaryModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingAnniversaryId = null;
    }

    async confirmDeleteAnniversary() {
        if (!this.editingAnniversaryId) return;
        
        try {
            await this.apiCall(`/anniversaries/${this.editingAnniversaryId}`, {
                method: 'DELETE'
            });
            
            this.showNotification('纪念日删除成功！');
            await this.loadAnniversariesFromAPI();
            this.renderAnniversaries();
            this.closeDeleteAnniversaryModal();
        } catch (error) {
            console.error('删除纪念日失败:', error);
            this.showNotification('删除失败，请重试', 'error');
        }
    }

    // 渲染操作日志
    renderOperationLogs() {
        const container = document.getElementById('recordsContainer');
        if (!container) {
            console.warn('renderOperationLogs: 找不到recordsContainer元素');
            return;
        }

        if (this.operationLogs.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <i class="fas fa-history text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">暂无操作日志</h3>
                    <p class="text-gray-400">系统操作记录将显示在这里</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="col-span-full">
                <div class="bg-white rounded-2xl shadow-lg p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">操作日志</h2>
                        <button onclick="app.refreshOperationLogs()" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                            <i class="fas fa-sync-alt mr-2"></i>刷新
                        </button>
                    </div>
                    <div class="space-y-4">
                        ${this.operationLogs.map(log => this.createOperationLogItem(log)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // 创建操作日志项
    createOperationLogItem(log) {
        const operationTypeMap = {
            'CREATE': { text: '创建', color: 'text-green-600', icon: 'fas fa-plus-circle' },
            'UPDATE': { text: '更新', color: 'text-blue-600', icon: 'fas fa-edit' },
            'DELETE': { text: '删除', color: 'text-red-600', icon: 'fas fa-trash' }
        };

        const tableNameMap = {
            'love_records': '恋爱记录',
            'anniversaries': '纪念日'
        };

        const operation = operationTypeMap[log.operation_type] || { text: log.operation_type, color: 'text-gray-600', icon: 'fas fa-info-circle' };
        const tableName = tableNameMap[log.table_name] || log.table_name;
        const createdAt = new Date(log.created_at).toLocaleString('zh-CN');

        let operationDetails = '';
        if (log.operation_data) {
            if (log.operation_type === 'CREATE') {
                const data = log.operation_data;
                operationDetails = `
                    <div class="mt-2 text-sm text-gray-600">
                        ${data.title ? `标题: ${data.title}` : ''}
                        ${data.category ? `分类: ${data.category}` : ''}
                        ${data.description ? `描述: ${data.description.substring(0, 50)}${data.description.length > 50 ? '...' : ''}` : ''}
                    </div>
                `;
            } else if (log.operation_type === 'UPDATE' && log.operation_data.new_data) {
                const newData = log.operation_data.new_data;
                const changes = Object.keys(newData).map(key => `${key}: ${newData[key]}`).join(', ');
                operationDetails = `
                    <div class="mt-2 text-sm text-gray-600">
                        更新字段: ${changes}
                    </div>
                `;
            }
        }

        return `
            <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                    <i class="${operation.icon} ${operation.color} text-lg"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <span class="${operation.color} font-medium">${operation.text}</span>
                        <span class="text-gray-600">${tableName}</span>
                        ${log.record_id ? `<span class="text-gray-400">#${log.record_id}</span>` : ''}
                    </div>
                    ${operationDetails}
                    <div class="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                        <span><i class="fas fa-clock mr-1"></i>${createdAt}</span>
                        ${log.ip_address ? `<span><i class="fas fa-map-marker-alt mr-1"></i>${log.ip_address}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // 刷新操作日志
    async refreshOperationLogs() {
        try {
            await this.loadOperationLogsFromAPI();
            this.renderOperationLogs();
            this.showNotification('操作日志已刷新');
        } catch (error) {
            console.error('刷新操作日志失败:', error);
            this.showNotification('刷新失败，请重试', 'error');
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    window.app = new LoveRecordApp();
});