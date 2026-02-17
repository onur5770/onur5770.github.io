// ==========================================
// ROOTPANEL v2.0 - İYİLEŞTİRİLMİŞ VERSİYON
// Güvenlik, Performans ve Kod Kalitesi İyileştirmeleri
// ==========================================

console.log("RootPanel v2.0 - İyileştirilmiş Versiyon Yüklendi");

// ==========================================
// 1. GÜVENLİK: INPUT SANİTİZASYON
// ==========================================

function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function isValidURL(url) {
    try {
        new URL(url.startsWith('http') ? url : 'https://' + url);
        return true;
    } catch {
        return false;
    }
}

// ==========================================
// 2. PERFORMANS: DEBOUNCE
// ==========================================

function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Kategori sekme aktifliğini güncelle
function updateCatBtns(selector, activeCategory) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('active');
        const onclick = btn.getAttribute('onclick') || '';
        if (onclick.includes(`'${activeCategory}'`)) {
            btn.classList.add('active');
        }
    });
}

// ==========================================
// 3. STATE MANAGEMENT
// ==========================================

const AppState = {
    tools: [],
    projects: [],
    events: [],
    aiTools: [],
    websites: [],
    passwords: [],
    quickLinks: [],
    dashboardNotes: [],
    dashboardTasks: [],
    
    editing: {
        toolIndex: -1,
        projectId: -1,
        eventId: -1,
        aiIndex: -1,
        webIndex: -1,
        passIndex: -1
    },
    
    ui: {
        isLinkEditMode: false,
        currentDate: new Date(),
        currentView: 'month'
    },
    
    timer: {
        interval: null,
        elapsedTime: 0,
        isRunning: false
    }
};

// ==========================================
// 4. STORAGE MANAGER
// ==========================================

const StorageManager = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Storage okuma hatası (${key}):`, error);
            showToast(`Veri yüklenemedi: ${key}`, 'error');
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Storage yazma hatası (${key}):`, error);
            showToast('Veri kaydedilemedi!', 'error');
        }
    },
    
    loadAll() {
        AppState.tools = this.get('myTools', []);
        AppState.projects = this.get('myProjects', []);
        AppState.events = this.get('myEvents', []);
        AppState.aiTools = this.get('aiTools', []);
        AppState.websites = this.get('myWebsites', []);
        AppState.passwords = this.get('myPasswords', []);
        AppState.quickLinks = this.get('quickLinks', []);
        AppState.dashboardNotes = this.get('dashboardNotes', []);
        AppState.dashboardTasks = this.get('dashboardTasks', []);
        
        AppState.aiTools.forEach(tool => {
            if (typeof tool.category === 'string') {
                tool.categories = [tool.category];
                delete tool.category;
            }
        });
    },
    
    clearAll() {
        // Önce ayarlar modalını kapat
        closeSettingsModal();
        
        // Sonra confirm göster
        setTimeout(() => {
            showConfirm(
                "⚠️ Tüm Verileri Sil?",
                "DİKKAT: Tüm veriler kalıcı olarak silinecek!\n\nBu işlem geri alınamaz.\n\nDevam etmek istediğine emin misin?",
                "Evet, Tümünü Sil"
            ).then((confirmed) => {
                if (confirmed) {
                    localStorage.clear();
                    showToast("Tüm veriler silindi. Sayfa yenileniyor...", "success");
                    setTimeout(() => location.reload(), 1000);
                }
            });
        }, 100);
    }
};

const debouncedSave = {
    tools: debounce(() => StorageManager.set('myTools', AppState.tools), 500),
    projects: debounce(() => StorageManager.set('myProjects', AppState.projects), 500),
    events: debounce(() => StorageManager.set('myEvents', AppState.events), 500),
    aiTools: debounce(() => StorageManager.set('aiTools', AppState.aiTools), 500),
    websites: debounce(() => StorageManager.set('myWebsites', AppState.websites), 500),
    passwords: debounce(() => StorageManager.set('myPasswords', AppState.passwords), 500),
    quickLinks: debounce(() => StorageManager.set('quickLinks', AppState.quickLinks), 500),
    notes: debounce(() => StorageManager.set('dashboardNotes', AppState.dashboardNotes), 500),
    tasks: debounce(() => StorageManager.set('dashboardTasks', AppState.dashboardTasks), 500)
};

// ==========================================
// 5. ŞİFRE ŞİFRELEME
// ==========================================

const PasswordCrypto = {
    key: 'RootPanel_2024_SecureKey',
    
    encrypt(password) {
        try {
            let encrypted = '';
            for (let i = 0; i < password.length; i++) {
                const charCode = password.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length);
                encrypted += String.fromCharCode(charCode);
            }
            return btoa(encrypted);
        } catch (error) {
            console.error('Şifreleme hatası:', error);
            return password;
        }
    },
    
    decrypt(encrypted) {
        try {
            const decoded = atob(encrypted);
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length);
                decrypted += String.fromCharCode(charCode);
            }
            return decrypted;
        } catch (error) {
            console.error('Şifre çözme hatası:', error);
            return encrypted;
        }
    }
};

// ==========================================
// 6. SAYFA YÖNETİMİ
// ==========================================

window.showPage = function(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => { 
        p.style.display = 'none'; 
        p.classList.remove('active-page'); 
    });
    
    document.querySelectorAll('.sidebar li').forEach(i => i.classList.remove('active'));

    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.style.display = 'block';
        selectedPage.classList.add('active-page');
        if(pageId === 'agenda') CalendarManager.refresh();
    }
    
    const navItem = document.getElementById('nav-' + pageId);
    if (navItem) navItem.classList.add('active');
    
    updateTitle(pageId);
};

function updateTitle(pageId) {
    const titles = { 
        'dashboard': 'Genel Bakış', 
        'ctf': 'CTF & Tools', 
        'projects': 'Projelerim', 
        'ai-tools': 'Yapay Zeka Merkezi',
        'passwords': 'Şifre Yöneticisi', 
        'agenda': 'Ajanda',
        'websites': 'Web Siteleri'
    };
    const t = document.getElementById('page-title');
    if(t) t.innerText = titles[pageId] || 'Panelim';
}

function updateDate() {
    const d = document.getElementById('currentDate');
    if(d) d.innerText = new Date().toLocaleDateString('tr-TR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

window.toggleTheme = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    updateThemeIcon(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

function updateThemeIcon(isDark) {
    const themeBtn = document.querySelector('button[title="Tema Değiştir"] i');
    if(themeBtn) {
        themeBtn.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ==========================================
// 7. DASHBOARD YÖNETİMİ
// ==========================================

const DashboardManager = {
    updateStats() {
        const activeTasks = AppState.dashboardTasks.filter(t => !t.completed).length;
        const taskStat = document.getElementById('stat-task-count');
        if (taskStat) taskStat.innerText = `${activeTasks} Aktif`;
        
        const activeProjects = AppState.projects.filter(p => p.status === 'devam').length;
        const projStat = document.getElementById('stat-project-count');
        if (projStat) projStat.innerText = `${activeProjects} Devam Eden`;
    },
    
    renderNotes() {
        const container = document.getElementById('dashboardNotesList');
        const countBadge = document.getElementById('noteCount');
        if(!container) return;

        container.innerHTML = '';
        countBadge.innerText = AppState.dashboardNotes.length;

        if (AppState.dashboardNotes.length === 0) {
            container.innerHTML = '<div class="empty-state">Henüz not yok.</div>';
            return;
        }

        AppState.dashboardNotes.forEach((note, index) => {
            const div = document.createElement('div');
            div.className = 'dashboard-note';
            div.textContent = note.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-note-btn';
            deleteBtn.title = 'Sil';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.onclick = () => this.deleteNote(index);
            
            div.appendChild(deleteBtn);
            container.appendChild(div);
        });
    },
    
    renderTasks() {
        const container = document.getElementById('dashboardTasksList');
        const countBadge = document.getElementById('taskCount');
        if(!container) return;

        container.innerHTML = '';
        const activeCount = AppState.dashboardTasks.filter(t => !t.completed).length;
        countBadge.innerText = activeCount;

        if (AppState.dashboardTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">Görev eklenmedi.</div>';
            return;
        }

        AppState.dashboardTasks.forEach((task, index) => {
            const div = document.createElement('div');
            div.className = `dashboard-task ${task.completed ? 'completed' : ''}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.onchange = () => this.toggleTask(index);
            
            const span = document.createElement('span');
            span.textContent = task.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-task-btn';
            deleteBtn.title = 'Sil';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = () => this.deleteTask(index);
            
            div.appendChild(checkbox);
            div.appendChild(span);
            div.appendChild(deleteBtn);
            container.appendChild(div);
        });
        
        this.updateStats();
    },
    
    addNote(text) {
        if(text.trim()) {
            AppState.dashboardNotes.push({ 
                text: text.trim(), 
                date: new Date().toISOString() 
            });
            debouncedSave.notes();
            this.renderNotes();
        } else {
            showToast("Lütfen bir not yazın.", "warning");
        }
    },
    
    deleteNote(index) {
        AppState.dashboardNotes.splice(index, 1);
        debouncedSave.notes();
        this.renderNotes();
    },
    
    addTask(text) {
        if(text.trim()) {
            AppState.dashboardTasks.push({ 
                text: text.trim(), 
                completed: false,
                createdAt: new Date().toISOString()
            });
            debouncedSave.tasks();
            this.renderTasks();
        } else {
            showToast("Lütfen görev adını yazın.", "warning");
        }
    },
    
    toggleTask(index) {
        AppState.dashboardTasks[index].completed = !AppState.dashboardTasks[index].completed;
        debouncedSave.tasks();
        this.renderTasks();
    },
    
    deleteTask(index) {
        AppState.dashboardTasks.splice(index, 1);
        debouncedSave.tasks();
        this.renderTasks();
    }
};

window.quickAddNote = function() {
    document.getElementById('noteModal').style.display = 'flex';
    document.getElementById('newNoteText').focus();
};

window.closeNoteModal = function() {
    document.getElementById('noteModal').style.display = 'none';
    document.getElementById('newNoteText').value = '';
};

window.saveNote = function() {
    const noteText = document.getElementById('newNoteText').value;
    DashboardManager.addNote(noteText);
    closeNoteModal();
};

window.quickAddTask = function() {
    document.getElementById('taskModal').style.display = 'flex';
    document.getElementById('newTaskText').focus();
};

window.closeTaskModal = function() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('newTaskText').value = '';
};

window.saveTask = function() {
    const taskText = document.getElementById('newTaskText').value;
    DashboardManager.addTask(taskText);
    closeTaskModal();
};

window.deleteDashboardNote = function(index) { DashboardManager.deleteNote(index); };
window.toggleTask = function(index) { DashboardManager.toggleTask(index); };
window.deleteDashboardTask = function(index) { DashboardManager.deleteTask(index); };

// ==========================================
// 8. KRONOMETRE
// ==========================================

const TimerManager = {
    start() {
        if (AppState.timer.isRunning) return;
        AppState.timer.isRunning = true;
        AppState.timer.interval = setInterval(() => {
            AppState.timer.elapsedTime++;
            this.updateDisplay();
        }, 1000);
    },
    
    stop() {
        clearInterval(AppState.timer.interval);
        AppState.timer.isRunning = false;
    },
    
    reset() {
        this.stop();
        AppState.timer.elapsedTime = 0;
        this.updateDisplay();
    },
    
    updateDisplay() {
        const t = document.getElementById('timer');
        if(t) {
            const m = Math.floor(AppState.timer.elapsedTime / 60).toString().padStart(2, '0');
            const s = (AppState.timer.elapsedTime % 60).toString().padStart(2, '0');
            t.innerText = `${m}:${s}`;
        }
    }
};

window.startTimer = () => TimerManager.start();
window.stopTimer = () => TimerManager.stop();
window.resetTimer = () => TimerManager.reset();

// ==========================================
// 9. HIZLI ERİŞİM
// ==========================================

const QuickLinksManager = {
    render() {
        const container = document.getElementById('quickLinksContainer');
        if (!container) return;
        container.innerHTML = '';

        if (AppState.ui.isLinkEditMode) {
            container.classList.add('editing');
            document.getElementById('btnEditLinks').classList.add('active');
        } else {
            container.classList.remove('editing');
            const btn = document.getElementById('btnEditLinks');
            if(btn) btn.classList.remove('active');
        }

        AppState.quickLinks.forEach((link, index) => {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = "_blank";
            a.className = "link-item";

            if(AppState.ui.isLinkEditMode) {
                a.style.pointerEvents = "none";
            }

            const icon = document.createElement('i');
            icon.className = link.icon || 'fas fa-link';
            
            const text = document.createTextNode(' ' + link.name);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-link-btn';
            deleteBtn.style.pointerEvents = 'auto';
            deleteBtn.title = 'Sil';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                this.delete(index);
            };
            
            a.appendChild(icon);
            a.appendChild(text);
            a.appendChild(deleteBtn);
            container.appendChild(a);
        });
    },
    
    toggleEditMode() {
        AppState.ui.isLinkEditMode = !AppState.ui.isLinkEditMode;
        this.render();
    },
    
    delete(index) {
        AppState.quickLinks.splice(index, 1);
        debouncedSave.quickLinks();
        this.render();
    },
    
    add(name, url, icon) {
        if (!name || !url) {
            showToast("İsim ve URL zorunlu!", "warning");
            return false;
        }
        
        if (!isValidURL(url)) {
            showToast("Geçersiz URL!", "error");
            return false;
        }
        
        if (!url.startsWith('http')) url = 'https://' + url;
        
        AppState.quickLinks.push({ 
            name: sanitizeHTML(name), 
            url, 
            icon 
        });
        debouncedSave.quickLinks();
        AppState.ui.isLinkEditMode = false;
        this.render();
        return true;
    }
};

window.toggleLinkEditMode = () => QuickLinksManager.toggleEditMode();
window.deleteLink = (event, index) => {
    event.preventDefault();
    QuickLinksManager.delete(index);
};

window.openLinkModal = function() { 
    document.getElementById('linkModal').style.display = 'flex'; 
};

window.closeLinkModal = function() { 
    document.getElementById('linkModal').style.display = 'none'; 
};

window.saveLink = function() {
    const name = document.getElementById('linkName').value;
    const url = document.getElementById('linkUrl').value;
    const icon = document.getElementById('linkIcon').value;
    
    if(QuickLinksManager.add(name, url, icon)) {
        closeLinkModal();
        document.getElementById('linkName').value = '';
        document.getElementById('linkUrl').value = '';
    }
};

// ==========================================
// 10. GENERIC CARD MANAGER
// ==========================================

class CardManager {
    constructor(config) {
        this.dataKey = config.dataKey;
        this.containerId = config.containerId;
        this.editIndexKey = config.editIndexKey;
        this.saveFunction = config.saveFunction;
        this.renderCard = config.renderCard;
        this.categoryTabs = config.categoryTabs;
    }
    
    getData() {
        return AppState[this.dataKey];
    }
    
    setData(data) {
        AppState[this.dataKey] = data;
    }
    
    render(filterCategory = 'all') {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '';
        
        if (this.categoryTabs) {
            document.querySelectorAll(this.categoryTabs).forEach(btn => btn.classList.remove('active'));
            const activeBtn = Array.from(document.querySelectorAll(this.categoryTabs)).find(b => 
                b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${filterCategory}'`)
            );
            if(activeBtn) activeBtn.classList.add('active');
        }
        
        const data = this.getData();
        const filtered = (filterCategory === 'all') 
            ? data 
            : data.filter(item => this.matchesFilter(item, filterCategory));
        
        filtered.forEach((item, filteredIndex) => {
            const originalIndex = data.indexOf(item);
            const card = this.renderCard(item, originalIndex);
            container.appendChild(card);
        });
    }
    
    matchesFilter(item, category) {
        if (item.categories) {
            return item.categories.includes(category);
        }
        return item.category === category;
    }
    
    add(item) {
        const data = this.getData();
        data.push(item);
        this.setData(data);
        this.saveFunction();
    }
    
    update(index, item) {
        const data = this.getData();
        data[index] = item;
        this.setData(data);
        this.saveFunction();
    }
    
    delete(index) {
        const data = this.getData();
        data.splice(index, 1);
        this.setData(data);
        this.saveFunction();
    }
}

// ==========================================
// 11. CTF TOOLS
// ==========================================

const ToolsManager = new CardManager({
    dataKey: 'tools',
    containerId: 'toolsContainer',
    editIndexKey: 'toolIndex',
    saveFunction: debouncedSave.tools,
    categoryTabs: '#ctf .cat-btn',
    renderCard: (tool, index) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-cat', tool.category);
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit-tool';
        editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        editBtn.onclick = () => editTool(index);
        
        const header = document.createElement('div');
        header.className = 'tool-header';
        const tag = document.createElement('span');
        tag.className = `tool-tag tag-${tool.category}`;
        tag.textContent = tool.category.toUpperCase();
        header.appendChild(tag);
        
        const title = document.createElement('h3');
        title.textContent = sanitizeHTML(tool.name);
        
        const desc = document.createElement('p');
        desc.textContent = sanitizeHTML(tool.desc);
        
        const link = document.createElement('a');
        link.href = tool.link;
        link.target = '_blank';
        link.className = 'tool-link';
        link.textContent = 'Aç ->';
        
        card.appendChild(editBtn);
        card.appendChild(header);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(link);
        
        return card;
    }
});

window.renderTools = (cat) => ToolsManager.render(cat);
window.filterTools = (cat) => {
    updateCatBtns('#ctf .category-tabs-bar', cat);
    ToolsManager.render(cat);
};

window.searchTools = function() {
    const txt = document.getElementById('toolSearch').value.toLowerCase();
    const container = document.getElementById('toolsContainer');
    container.innerHTML = '';
    const filtered = AppState.tools.filter(t =>
        t.name.toLowerCase().includes(txt) || t.desc.toLowerCase().includes(txt)
    );
    filtered.forEach((tool) => {
        const idx = AppState.tools.indexOf(tool);
        container.appendChild(ToolsManager.renderCard(tool, idx));
    });
};

window.editTool = function(index) {
    AppState.editing.toolIndex = index;
    const tool = AppState.tools[index];
    document.getElementById('toolName').value = tool.name;
    document.getElementById('toolCategory').value = tool.category;
    document.getElementById('toolDesc').value = tool.desc;
    document.getElementById('toolLink').value = tool.link;
    
    const title = document.querySelector('#toolModal .modal-content h3');
    if(title) title.innerText = "Aracı Düzenle";
    
    openToolModal();
};

window.openToolModal = function() {
    const modal = document.getElementById('toolModal');
    const deleteBtn = document.getElementById('btnDeleteTool');
    if(modal) modal.style.display = 'flex';
    
    if (AppState.editing.toolIndex === -1) {
        const title = document.querySelector('#toolModal .modal-content h3');
        if(title) title.innerText = "Yeni Araç Ekle";
        document.getElementById('toolName').value = '';
        document.getElementById('toolDesc').value = '';
        document.getElementById('toolLink').value = '';
        if(deleteBtn) deleteBtn.style.display = 'none';
    } else {
        if(deleteBtn) deleteBtn.style.display = 'flex';
    }
};

window.deleteCurrentTool = async function() {
    if (AppState.editing.toolIndex > -1) {
        const confirmed = await showConfirm(
            "Aracı Sil?",
            "Bu aracı silmek istediğine emin misin? Bu işlem geri alınamaz.",
            "Evet, Sil"
        );
        
        if (confirmed) {
            ToolsManager.delete(AppState.editing.toolIndex);
            ToolsManager.render('all');
            closeToolModal();
            showToast("Araç silindi!", "success");
        }
    }
};

window.closeToolModal = function() {
    document.getElementById('toolModal').style.display = 'none';
    AppState.editing.toolIndex = -1;
};

window.saveTool = function() {
    const name = document.getElementById('toolName').value.trim();
    const link = document.getElementById('toolLink').value.trim();
    const cat = document.getElementById('toolCategory').value;
    const desc = document.getElementById('toolDesc').value.trim();
    
    if(!name || !link) {
        showToast("İsim ve Link zorunlu!", "warning");
        return;
    }
    
    if (!isValidURL(link)) {
        showToast("Geçersiz URL!", "error");
        return;
    }

    const toolObj = { 
        name: sanitizeHTML(name), 
        category: cat, 
        desc: sanitizeHTML(desc), 
        link 
    };
    
    if (AppState.editing.toolIndex > -1) {
        ToolsManager.update(AppState.editing.toolIndex, toolObj);
    } else {
        ToolsManager.add(toolObj);
    }

    ToolsManager.render('all');
    closeToolModal();
};

// ==========================================
// 12. PROJELER
// ==========================================

const ProjectsManager = {
    render(filterText = '') {
        const container = document.getElementById('projectsContainer');
        if (!container) return;
        container.innerHTML = '';

        const filtered = AppState.projects.filter(p => 
            p.name.toLowerCase().includes(filterText.toLowerCase())
        );

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = `project-card status-${p.status}`;
            card.onclick = () => this.openDetail(p.id);
            
            const totalTasks = p.tasks ? p.tasks.length : 0;
            const completedTasks = p.tasks ? p.tasks.filter(t => t.completed).length : 0;
            const progressText = totalTasks > 0 ? `${completedTasks}/${totalTasks} Görev` : 'Görev Yok';

            const title = document.createElement('h3');
            title.textContent = sanitizeHTML(p.name);
            
            const desc = document.createElement('p');
            desc.textContent = sanitizeHTML(p.desc);
            
            const meta = document.createElement('div');
            meta.className = 'project-meta';
            
            const date = document.createElement('span');
            date.textContent = new Date(p.id).toLocaleDateString();
            
            const progress = document.createElement('span');
            progress.textContent = progressText;
            
            meta.appendChild(date);
            meta.appendChild(progress);
            
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(meta);
            container.appendChild(card);
        });
    },
    
    openDetail(id) {
        AppState.editing.projectId = id;
        const project = AppState.projects.find(p => p.id === id);
        if (!project) return;

        document.getElementById('pmTitleInput').value = project.name;
        document.getElementById('pmStatusInput').value = project.status;
        document.getElementById('pmNotes').value = project.notes || "";
        this.renderProjectTasks(project);

        document.getElementById('projectDetailModal').style.display = 'flex';
    },
    
    closeDetail() {
        this.saveDetails();
        document.getElementById('projectDetailModal').style.display = 'none';
        AppState.editing.projectId = -1;
        this.render();
    },
    
    saveDetails() {
        if (AppState.editing.projectId === -1) return;
        const project = AppState.projects.find(p => p.id === AppState.editing.projectId);
        if(project) {
            project.name = sanitizeHTML(document.getElementById('pmTitleInput').value);
            project.status = document.getElementById('pmStatusInput').value;
            project.notes = document.getElementById('pmNotes').value;
            debouncedSave.projects();
        }
    },
    
    renderProjectTasks(project) {
        const list = document.getElementById('pmTaskList');
        list.innerHTML = '';
        if (!project.tasks) project.tasks = [];

        project.tasks.forEach((task, index) => {
            const item = document.createElement('div');
            item.className = `pm-task-item ${task.completed ? 'completed' : ''}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'pm-task-checkbox';
            checkbox.checked = task.completed;
            checkbox.onchange = () => this.toggleTask(index);
            
            const text = document.createElement('span');
            text.className = 'pm-task-text';
            text.textContent = sanitizeHTML(task.text);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'pm-btn-del-task';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = () => this.deleteTask(index);
            
            item.appendChild(checkbox);
            item.appendChild(text);
            item.appendChild(deleteBtn);
            list.appendChild(item);
        });
    },
    
    addTask() {
        const input = document.getElementById('pmNewTask');
        const text = input.value.trim();
        if (!text) return;

        const project = AppState.projects.find(p => p.id === AppState.editing.projectId);
        if (project) {
            if (!project.tasks) project.tasks = [];
            project.tasks.push({ 
                text: sanitizeHTML(text), 
                completed: false,
                createdAt: new Date().toISOString()
            });
            input.value = ''; 
            debouncedSave.projects();
            this.renderProjectTasks(project);
        }
    },
    
    toggleTask(index) {
        const project = AppState.projects.find(p => p.id === AppState.editing.projectId);
        if (project && project.tasks[index]) {
            project.tasks[index].completed = !project.tasks[index].completed;
            debouncedSave.projects();
            this.renderProjectTasks(project);
        }
    },
    
    deleteTask(index) {
        const project = AppState.projects.find(p => p.id === AppState.editing.projectId);
        if (project) {
            project.tasks.splice(index, 1);
            debouncedSave.projects();
            this.renderProjectTasks(project);
        }
    },
    
    create(name, status, desc) {
        if (!name) {
            showToast("Proje adı zorunlu!", "warning");
            return false;
        }

        AppState.projects.push({
            id: Date.now(),
            name: sanitizeHTML(name),
            status,
            desc: sanitizeHTML(desc),
            notes: "",
            tasks: [],
            createdAt: new Date().toISOString()
        });
        
        debouncedSave.projects();
        this.render();
        return true;
    },
    
    delete() {
        if (AppState.editing.projectId === -1) return;
        
        showConfirm(
            "Projeyi Sil?",
            "Bu projeyi ve tüm görevlerini silmek istediğine emin misin?",
            "Evet, Sil"
        ).then((confirmed) => {
            if (confirmed) {
                const index = AppState.projects.findIndex(p => p.id === AppState.editing.projectId);
                if (index > -1) {
                    AppState.projects.splice(index, 1);
                    debouncedSave.projects();
                    this.render();
                    document.getElementById('projectDetailModal').style.display = 'none';
                    AppState.editing.projectId = -1;
                    showToast("Proje silindi!", "success");
                }
            }
        });
    }
};

window.searchProjects = () => {
    const txt = document.getElementById('projectSearch').value;
    ProjectsManager.render(txt);
};

window.openProjectDetail = (id) => ProjectsManager.openDetail(id);
window.closeProjectDetail = () => ProjectsManager.closeDetail();
window.saveProjectDetails = () => ProjectsManager.saveDetails();
window.addProjectTask = () => ProjectsManager.addTask();
window.toggleProjectTask = (i) => ProjectsManager.toggleTask(i);
window.deleteProjectTask = (i) => ProjectsManager.deleteTask(i);
window.deleteCurrentProject = () => ProjectsManager.delete();

window.handleTaskEnter = function(e) {
    if (e.key === 'Enter') ProjectsManager.addTask();
};

window.openNewProjectModal = function() {
    document.getElementById('newProjectModal').style.display = 'flex';
};

window.closeNewProjectModal = function() {
    document.getElementById('newProjectModal').style.display = 'none';
};

window.createNewProject = function() {
    const name = document.getElementById('newProjName').value;
    const status = document.getElementById('newProjStatus').value;
    const desc = document.getElementById('newProjDesc').value;

    if(ProjectsManager.create(name, status, desc)) {
        closeNewProjectModal();
        document.getElementById('newProjName').value = '';
        document.getElementById('newProjDesc').value = '';
    }
};

// ==========================================
// 13. AI TOOLS
// ==========================================

const AIToolsManager = new CardManager({
    dataKey: 'aiTools',
    containerId: 'aiToolsContainer',
    editIndexKey: 'aiIndex',
    saveFunction: debouncedSave.aiTools,
    categoryTabs: '#ai-tools .cat-btn',
    renderCard: (tool, index) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const mainCat = tool.categories[0] || 'general';
        card.setAttribute('data-cat', mainCat);
        
        const categoryNames = {
            chat: "SOHBET", code: "KOD", image: "GÖRSEL", audio: "SES",
            cyber: "GÜVENLİK", lesson: "DERS", general: "GENEL"
        };
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit-tool';
        editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        editBtn.onclick = () => editAI(index);
        
        const header = document.createElement('div');
        header.className = 'tool-header';
        const tag = document.createElement('span');
        tag.className = `tool-tag tag-${mainCat}`;
        tag.textContent = categoryNames[mainCat] || mainCat.toUpperCase();
        header.appendChild(tag);
        
        const title = document.createElement('h3');
        title.textContent = sanitizeHTML(tool.name);
        
        const desc = document.createElement('p');
        desc.textContent = sanitizeHTML(tool.desc);
        
        const link = document.createElement('a');
        link.href = tool.link;
        link.target = '_blank';
        link.className = 'tool-link';
        link.textContent = 'Aç ->';
        
        card.appendChild(editBtn);
        card.appendChild(header);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(link);
        
        return card;
    }
});

window.filterAITools = (cat) => {
    updateCatBtns('#ai-tools .category-tabs-bar', cat);
    AIToolsManager.render(cat);
};

window.searchAITools = function() {
    const txt = document.getElementById('aiSearch').value.toLowerCase();
    const container = document.getElementById('aiToolsContainer');
    container.innerHTML = '';
    const filtered = AppState.aiTools.filter(t =>
        t.name.toLowerCase().includes(txt) || t.desc.toLowerCase().includes(txt)
    );
    filtered.forEach((tool) => {
        const idx = AppState.aiTools.indexOf(tool);
        container.appendChild(AIToolsManager.renderCard(tool, idx));
    });
};

window.editAI = function(index) {
    AppState.editing.aiIndex = index;
    const tool = AppState.aiTools[index];
    document.getElementById('aiName').value = tool.name;
    document.getElementById('aiDesc').value = tool.desc;
    document.getElementById('aiLink').value = tool.link;
    
    document.querySelectorAll('.checkbox-group input').forEach(cb => {
        cb.checked = tool.categories.includes(cb.value);
    });
    
    document.querySelector('#aiModal h3').innerText = "Aracı Düzenle";
    document.getElementById('aiModal').style.display = 'flex';
    document.getElementById('btnDeleteAI').style.display = 'flex';
};

window.openAIModal = function() {
    AppState.editing.aiIndex = -1;
    document.getElementById('aiModal').style.display = 'flex';
    document.querySelector('#aiModal h3').innerText = "Yeni Yapay Zeka Ekle";
    document.getElementById('aiName').value = '';
    document.getElementById('aiDesc').value = '';
    document.getElementById('aiLink').value = '';
    document.getElementById('btnDeleteAI').style.display = 'none';
    
    document.querySelectorAll('.checkbox-group input').forEach(cb => cb.checked = false);
    const genCb = document.querySelector('.checkbox-group input[value="general"]');
    if(genCb) genCb.checked = true;
};

window.saveAI = function() {
    const name = document.getElementById('aiName').value.trim();
    const desc = document.getElementById('aiDesc').value.trim();
    const link = document.getElementById('aiLink').value.trim();

    const selectedCats = [];
    document.querySelectorAll('.checkbox-group input:checked').forEach(cb => {
        selectedCats.push(cb.value);
    });

    if (!name || !link) {
        showToast("İsim ve Link zorunlu!", "warning");
        return;
    }
    
    if (!isValidURL(link)) {
        showToast("Geçersiz URL!", "error");
        return;
    }
    
    if (selectedCats.length === 0) {
        showToast("En az bir kategori seç!", "warning");
        return;
    }

    const newTool = { 
        name: sanitizeHTML(name), 
        categories: selectedCats, 
        desc: sanitizeHTML(desc), 
        link 
    };

    if (AppState.editing.aiIndex > -1) {
        AIToolsManager.update(AppState.editing.aiIndex, newTool);
    } else {
        AIToolsManager.add(newTool);
    }

    AIToolsManager.render('all');
    closeAIModal();
};

window.closeAIModal = function() {
    document.getElementById('aiModal').style.display = 'none';
    AppState.editing.aiIndex = -1;
};

window.deleteCurrentAI = async function() {
    if (AppState.editing.aiIndex > -1) {
        const confirmed = await showConfirm(
            "Yapay Zeka Aracını Sil?",
            "Bu aracı silmek istediğine emin misin?",
            "Evet, Sil"
        );
        
        if (confirmed) {
            AIToolsManager.delete(AppState.editing.aiIndex);
            AIToolsManager.render('all');
            closeAIModal();
            showToast("Araç silindi!", "success");
        }
    }
};

// ==========================================
// 14. WEB SİTELERİ
// ==========================================

const WebsitesManager = new CardManager({
    dataKey: 'websites',
    containerId: 'websitesContainer',
    editIndexKey: 'webIndex',
    saveFunction: debouncedSave.websites,
    categoryTabs: '#websites .cat-btn',
    renderCard: (web, index) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-cat', web.category);
        
        const trNames = {
            news: "HABER",
            tech: "TEKNOLOJİ",
            siber: "SİBER",
            dev: "YAZILIM",
            design: "TASARIM",
            other: "DİĞER"
        };
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit-tool';
        editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        editBtn.onclick = () => editWebsite(index);
        
        const header = document.createElement('div');
        header.className = 'tool-header';
        const tag = document.createElement('span');
        tag.className = `tool-tag tag-${web.category}`;
        tag.textContent = trNames[web.category] || web.category.toUpperCase();
        header.appendChild(tag);
        
        const title = document.createElement('h3');
        title.textContent = sanitizeHTML(web.name);
        
        const desc = document.createElement('p');
        desc.textContent = sanitizeHTML(web.desc);
        
        const link = document.createElement('a');
        link.href = web.link;
        link.target = '_blank';
        link.className = 'tool-link';
        link.textContent = 'Aç ->';
        
        card.appendChild(editBtn);
        card.appendChild(header);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(link);
        
        return card;
    }
});

window.filterWebsites = (cat) => {
    updateCatBtns('#websites .category-tabs-bar', cat);
    WebsitesManager.render(cat);
};
window.renderWebsites = (cat) => WebsitesManager.render(cat);

window.searchWebsites = function() {
    const txt = document.getElementById('websiteSearch').value.toLowerCase();
    const container = document.getElementById('websitesContainer');
    container.innerHTML = '';
    const filtered = AppState.websites.filter(w =>
        w.name.toLowerCase().includes(txt) || (w.desc && w.desc.toLowerCase().includes(txt))
    );
    filtered.forEach((web) => {
        const idx = AppState.websites.indexOf(web);
        container.appendChild(WebsitesManager.renderCard(web, idx));
    });
};

window.editWebsite = function(index) {
    AppState.editing.webIndex = index;
    const web = AppState.websites[index];
    document.getElementById('webName').value = web.name;
    document.getElementById('webCategory').value = web.category;
    document.getElementById('webDesc').value = web.desc;
    document.getElementById('webLink').value = web.link;
    
    document.querySelector('#websiteModal h3').innerText = "Siteyi Düzenle";
    openWebsiteModal();
};

window.openWebsiteModal = function() {
    const modal = document.getElementById('websiteModal');
    const deleteBtn = document.getElementById('btnDeleteWeb');
    if(modal) modal.style.display = 'flex';
    
    if (AppState.editing.webIndex === -1) {
        document.querySelector('#websiteModal h3').innerText = "Yeni Web Sitesi Ekle";
        document.getElementById('webName').value = '';
        document.getElementById('webCategory').value = 'news';
        document.getElementById('webDesc').value = '';
        document.getElementById('webLink').value = '';
        if(deleteBtn) deleteBtn.style.display = 'none';
    } else {
        if(deleteBtn) deleteBtn.style.display = 'flex';
    }
};

window.saveWebsite = function() {
    const name = document.getElementById('webName').value.trim();
    const cat = document.getElementById('webCategory').value;
    const desc = document.getElementById('webDesc').value.trim();
    let link = document.getElementById('webLink').value.trim();

    if (!name || !link) {
        showToast("İsim ve Link zorunlu!", "warning");
        return;
    }
    
    if (!isValidURL(link)) {
        showToast("Geçersiz URL!", "error");
        return;
    }
    
    if (!link.startsWith('http')) link = 'https://' + link;

    const newWeb = { 
        name: sanitizeHTML(name), 
        category: cat, 
        desc: sanitizeHTML(desc), 
        link 
    };

    if (AppState.editing.webIndex > -1) {
        WebsitesManager.update(AppState.editing.webIndex, newWeb);
    } else {
        WebsitesManager.add(newWeb);
    }

    WebsitesManager.render('all');
    closeWebsiteModal();
};

window.closeWebsiteModal = function() {
    document.getElementById('websiteModal').style.display = 'none';
    AppState.editing.webIndex = -1;
};

window.deleteCurrentWebsite = async function() {
    if (AppState.editing.webIndex > -1) {
        const confirmed = await showConfirm(
            "Web Sitesini Sil?",
            "Bu web sitesini silmek istediğine emin misin?",
            "Evet, Sil"
        );
        
        if (confirmed) {
            WebsitesManager.delete(AppState.editing.webIndex);
            WebsitesManager.render('all');
            closeWebsiteModal();
            showToast("Site silindi!", "success");
        }
    }
};

// ==========================================
// 15. ŞİFRE YÖNETİCİSİ
// ==========================================

const PasswordsManager = {
    render(filterText = '') {
        const container = document.getElementById('passwordsContainer');
        if (!container) return;
        container.innerHTML = '';

        const filtered = AppState.passwords.filter(p => 
            p.title.toLowerCase().includes(filterText.toLowerCase()) || 
            p.user.toLowerCase().includes(filterText.toLowerCase())
        );

        filtered.forEach((p, filteredIndex) => {
            const originalIndex = AppState.passwords.indexOf(p);
            const card = document.createElement('div');
            card.className = 'project-card';
            card.setAttribute('data-cat', 'other');
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-edit-tool';
            editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            editBtn.onclick = () => this.edit(originalIndex);
            
            const header = document.createElement('div');
            header.className = 'tool-header';
            const tag = document.createElement('span');
            tag.className = 'tool-tag';
            tag.textContent = 'GÜVENLİ';
            header.appendChild(tag);
            
            const body = document.createElement('div');
            body.className = 'password-card-body';
            
            const title = document.createElement('h3');
            title.textContent = sanitizeHTML(p.title);
            
            const user = document.createElement('p');
            user.className = 'password-card-user';
            user.innerHTML = `<strong>Kullanıcı:</strong> ${sanitizeHTML(p.user)}`;
            
            body.appendChild(title);
            body.appendChild(user);
            
            const actions = document.createElement('div');
            actions.className = 'password-card-actions';
            
            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'btn-copy-password';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Şifreyi Kopyala';
            copyBtn.onclick = () => this.copy(originalIndex);
            
            actions.appendChild(copyBtn);
            
            card.appendChild(editBtn);
            card.appendChild(header);
            card.appendChild(body);
            card.appendChild(actions);
            container.appendChild(card);
        });
    },
    
    edit(index) {
        AppState.editing.passIndex = index;
        const p = AppState.passwords[index];
        document.getElementById('passTitle').value = p.title;
        document.getElementById('passUser').value = p.user;
        
        const decrypted = PasswordCrypto.decrypt(p.pass);
        document.getElementById('passValue').value = decrypted;
        
        document.getElementById('btnDeletePass').style.display = 'flex';
        document.getElementById('passwordModal').style.display = 'flex';
    },
    
    save() {
        const title = document.getElementById('passTitle').value.trim();
        const user = document.getElementById('passUser').value.trim();
        const pass = document.getElementById('passValue').value;

        if (!title || !pass) {
            showToast("Başlık ve Şifre zorunlu!", "warning");
            return;
        }

        const encrypted = PasswordCrypto.encrypt(pass);
        
        const passObj = { 
            title: sanitizeHTML(title), 
            user: sanitizeHTML(user), 
            pass: encrypted 
        };
        
        if (AppState.editing.passIndex > -1) {
            AppState.passwords[AppState.editing.passIndex] = passObj;
        } else {
            AppState.passwords.push(passObj);
        }

        debouncedSave.passwords();
        this.render();
        this.closeModal();
    },
    
    delete() {
        if (AppState.editing.passIndex > -1) {
            showConfirm(
                "Şifreyi Sil?",
                "Bu şifreyi silmek istediğine emin misin? Bu işlem geri alınamaz.",
                "Evet, Sil"
            ).then((confirmed) => {
                if (confirmed) {
                    AppState.passwords.splice(AppState.editing.passIndex, 1);
                    debouncedSave.passwords();
                    this.render();
                    this.closeModal();
                    showToast("Şifre silindi!", "success");
                }
            });
        }
    },
    
    copy(index) {
        if (AppState.passwords[index]) {
            const decrypted = PasswordCrypto.decrypt(AppState.passwords[index].pass);
            navigator.clipboard.writeText(decrypted).then(() => {
                showToast("Şifre panoya kopyalandı!", "success");
            }).catch(() => {
                showToast("Kopyalama başarısız!", "error");
            });
        }
    },
    
    closeModal() {
        document.getElementById('passwordModal').style.display = 'none';
        AppState.editing.passIndex = -1;
    }
};

window.openPasswordModal = function() {
    AppState.editing.passIndex = -1;
    document.getElementById('passTitle').value = '';
    document.getElementById('passUser').value = '';
    document.getElementById('passValue').value = '';
    document.getElementById('btnDeletePass').style.display = 'none';
    document.getElementById('passwordModal').style.display = 'flex';
};

window.editPassword = (i) => PasswordsManager.edit(i);
window.savePassword = () => PasswordsManager.save();
window.closePasswordModal = () => PasswordsManager.closeModal();
window.deleteCurrentPassword = () => PasswordsManager.delete();
window.copyPasswordByIndex = (i) => PasswordsManager.copy(i);
window.searchPasswords = () => {
    const txt = document.getElementById('passwordSearch').value;
    PasswordsManager.render(txt);
};

window.togglePassVisibility = function() {
    const input = document.getElementById('passValue');
    input.type = input.type === 'password' ? 'text' : 'password';
};

window.generateSecurePassword = function() {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let retVal = "";
    
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
        retVal += charset.charAt(array[i] % charset.length);
    }
    
    const passInput = document.getElementById('passValue');
    passInput.value = retVal;
    passInput.type = "text";
    
    showToast("Güçlü şifre oluşturuldu!", "info");
};

// ==========================================
// 16. TAKVİM (AJANDA)
// ==========================================

const CalendarManager = {
    refresh() {
        if (AppState.ui.currentView === 'month') {
            this.renderMonth();
        } else {
            this.renderYear();
        }
        this.updateHeader();
    },
    
    init() {
        this.refresh();
        this.updateDashboardReminders();
    },
    
    updateHeader() {
        const year = AppState.ui.currentDate.getFullYear();
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
                           "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        
        if (AppState.ui.currentView === 'month') {
            document.getElementById('calendarTitle').innerText = 
                `${monthNames[AppState.ui.currentDate.getMonth()]} ${year}`;
        } else {
            document.getElementById('calendarTitle').innerText = `${year}`;
        }
    },
    
    renderMonth() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const year = AppState.ui.currentDate.getFullYear();
        const month = AppState.ui.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let offset = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < offset; i++) {
            const empty = document.createElement('div');
            empty.className = 'cal-day other-month';
            grid.appendChild(empty);
        }

        const todayStr = new Date().toISOString().split('T')[0];

        for (let day = 1; day <= daysInMonth; day++) {
            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            if (cellDateStr === todayStr) cell.classList.add('today');
            
            cell.onclick = () => openEventModal(cellDateStr);

            const num = document.createElement('div');
            num.className = 'cal-day-num';
            num.textContent = day;
            cell.appendChild(num);

            const dayEvents = AppState.events.filter(e => e.date === cellDateStr);
            dayEvents.forEach(evt => {
                const bar = document.createElement('div');
                bar.className = `cal-event-bar cal-event-${evt.type}`;
                if (evt.completed) bar.classList.add('cal-event-completed');
                bar.textContent = evt.title;
                bar.onclick = (e) => {
                    e.stopPropagation();
                    openEventModal(cellDateStr, evt.id);
                };
                cell.appendChild(bar);
            });
            grid.appendChild(cell);
        }
    },
    
    renderYear() {
        const container = document.getElementById('yearViewContainer');
        if (!container) return;
        container.innerHTML = '';
        
        const year = AppState.ui.currentDate.getFullYear();
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
                           "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

        for (let m = 0; m < 12; m++) {
            const monthCard = document.createElement('div');
            monthCard.className = 'mini-month-card';
            
            const title = document.createElement('div');
            title.className = 'mini-month-title';
            title.textContent = monthNames[m];
            monthCard.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'mini-cal-grid';
            
            const daysShort = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];
            daysShort.forEach(d => {
                const h = document.createElement('div');
                h.className = 'mini-day-header';
                h.textContent = d;
                grid.appendChild(h);
            });

            const firstDay = new Date(year, m, 1).getDay();
            const daysTotal = new Date(year, m + 1, 0).getDate();
            let offset = firstDay === 0 ? 6 : firstDay - 1;

            for(let i=0; i<offset; i++) grid.appendChild(document.createElement('div'));

            for(let d=1; d<=daysTotal; d++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'mini-day';
                dayCell.textContent = d;
                
                const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const evts = AppState.events.filter(e => e.date === dateStr);
                
                if(evts.length > 0) {
                    dayCell.classList.add('has-event');
                    const dotsDiv = document.createElement('div');
                    dotsDiv.className = 'event-dots';
                    evts.slice(0, 3).forEach(ev => {
                        const dot = document.createElement('div');
                        dot.className = `dot ${ev.type}`;
                        dotsDiv.appendChild(dot);
                    });
                    dayCell.appendChild(dotsDiv);
                }
                grid.appendChild(dayCell);
            }
            monthCard.appendChild(grid);
            container.appendChild(monthCard);
        }
    },
    
    updateDashboardReminders() {
        const countEl = document.getElementById('stat-upcoming-count');
        if (!countEl) return;

        const today = new Date();
        today.setHours(0,0,0,0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const upcomingEvents = AppState.events.filter(e => {
            const eDate = new Date(e.date);
            return eDate >= today && eDate <= nextWeek && !e.completed;
        });

        const count = upcomingEvents.length;
        countEl.innerText = count > 0 ? `${count} Hatırlatma` : "Hatırlatma Yok";
    }
};

window.setCalendarView = function(view) {
    AppState.ui.currentView = view;
    document.getElementById('viewMonthBtn').className = `cal-view-btn ${view === 'month' ? 'active' : ''}`;
    document.getElementById('viewYearBtn').className = `cal-view-btn ${view === 'year' ? 'active' : ''}`;
    document.getElementById('monthViewContainer').style.display = (view === 'month') ? 'flex' : 'none';
    document.getElementById('yearViewContainer').style.display = (view === 'year') ? 'grid' : 'none';
    CalendarManager.refresh();
};

window.changeDate = function(delta) {
    if (AppState.ui.currentView === 'month') {
        AppState.ui.currentDate.setMonth(AppState.ui.currentDate.getMonth() + delta);
    } else {
        AppState.ui.currentDate.setFullYear(AppState.ui.currentDate.getFullYear() + delta);
    }
    CalendarManager.refresh();
};

window.goToday = function() {
    AppState.ui.currentDate = new Date();
    CalendarManager.refresh();
};

window.openEventModal = function(dateStr, eventId = -1) {
    AppState.editing.eventId = eventId;
    document.getElementById('eventDate').value = dateStr;
    const delBtn = document.getElementById('btnDeleteEvent');

    if (eventId > -1) {
        const evt = AppState.events.find(e => e.id === eventId);
        if (evt) {
            document.getElementById('eventTitle').value = evt.title;
            document.getElementById('eventType').value = evt.type;
            document.getElementById('eventCompleted').checked = evt.completed;
        }
        delBtn.style.display = 'flex';
    } else {
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventType').value = 'deadline';
        document.getElementById('eventCompleted').checked = false;
        delBtn.style.display = 'none';
    }
    document.getElementById('eventModal').style.display = 'flex';
};

window.saveEvent = function() {
    const title = document.getElementById('eventTitle').value.trim();
    const type = document.getElementById('eventType').value;
    const date = document.getElementById('eventDate').value;
    const completed = document.getElementById('eventCompleted').checked;

    if (!title) {
        showToast("Başlık giriniz!", "warning");
        return;
    }

    const newEvent = {
        id: (AppState.editing.eventId === -1) ? Date.now() : AppState.editing.eventId,
        title: sanitizeHTML(title),
        type,
        date,
        completed
    };

    if (AppState.editing.eventId === -1) {
        AppState.events.push(newEvent);
    } else {
        const index = AppState.events.findIndex(e => e.id === AppState.editing.eventId);
        if (index > -1) AppState.events[index] = newEvent;
    }

    debouncedSave.events();
    CalendarManager.refresh();
    CalendarManager.updateDashboardReminders();
    closeEventModal();
};

window.deleteCurrentEvent = function() {
    if (AppState.editing.eventId === -1) return;
    
    showConfirm(
        "Etkinliği Sil?",
        "Bu etkinliği silmek istediğine emin misin?",
        "Evet, Sil"
    ).then((confirmed) => {
        if (confirmed) {
            const index = AppState.events.findIndex(e => e.id === AppState.editing.eventId);
            if (index > -1) AppState.events.splice(index, 1);
            debouncedSave.events();
            CalendarManager.refresh();
            CalendarManager.updateDashboardReminders();
            closeEventModal();
            showToast("Etkinlik silindi!", "success");
        }
    });
};

window.closeEventModal = function() {
    document.getElementById('eventModal').style.display = 'none';
    AppState.editing.eventId = -1;
};

// ==========================================
// 17. AYARLAR & YEDEKLEME
// ==========================================

window.openSettingsModal = function() {
    document.getElementById('settingsModal').style.display = 'flex';
};

window.closeSettingsModal = function() {
    document.getElementById('settingsModal').style.display = 'none';
};

window.exportData = function() {
    const backupData = {
        meta: {
            date: new Date().toISOString(),
            appName: "RootPanel",
            version: "2.0"
        },
        data: {
            theme: localStorage.getItem('theme'),
            tools: AppState.tools,
            dashboardNotes: AppState.dashboardNotes,
            dashboardTasks: AppState.dashboardTasks,
            quickLinks: AppState.quickLinks,
            projects: AppState.projects,
            aiTools: AppState.aiTools,
            events: AppState.events,
            websites: AppState.websites,
            passwords: AppState.passwords
        }
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `RootPanel_Yedek_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast("Yedek indirildi!", "success");
};

window.triggerImport = function() {
    document.getElementById('importFile').click();
};

window.importData = function(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            if (!json.data || !json.meta) {
                showToast("Hata: Geçersiz yedek dosyası!", "error");
                return;
            }

            const backupDate = new Date(json.meta.date).toLocaleDateString('tr-TR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            showConfirm(
                "Yedeği Geri Yükle?",
                `Bu yedeği yüklemek mevcut verilerinizi değiştirecektir.\n\nYedek Tarihi:\n${backupDate}\n\nDevam edilsin mi?`,
                "Evet, Yükle"
            ).then((confirmed) => {
                if (confirmed) {
                    localStorage.clear();
                    const d = json.data;
                    
                    if(d.theme) localStorage.setItem('theme', d.theme);
                    StorageManager.set('myTools', d.tools || []);
                    StorageManager.set('dashboardNotes', d.dashboardNotes || []);
                    StorageManager.set('dashboardTasks', d.dashboardTasks || []);
                    StorageManager.set('quickLinks', d.quickLinks || []);
                    StorageManager.set('myProjects', d.projects || []);
                    StorageManager.set('aiTools', d.aiTools || []);
                    StorageManager.set('myEvents', d.events || []);
                    StorageManager.set('myWebsites', d.websites || []);
                    StorageManager.set('myPasswords', d.passwords || []);

                    showToast("Yedek başarıyla yüklendi! Sayfa yenileniyor...", "success");
                    setTimeout(() => location.reload(), 1200);
                }
            });
        } catch (err) {
            console.error(err);
            showToast("Dosya okunamadı! JSON formatı bozuk olabilir.", "error");
        }
    };
    reader.readAsText(file);
    input.value = '';
};

window.clearAllData = () => StorageManager.clearAll();

// ==========================================
// 18. TOAST NOTIFICATION & MODERN CONFIRM
// ==========================================

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');

    const content = document.createElement('div');
    content.className = 'toast-content';
    
    const icon = document.createElement('i');
    icon.className = `fas ${icons[type] || icons.success} toast-icon`;
    
    const msg = document.createElement('span');
    msg.className = 'toast-message';
    msg.textContent = sanitizeHTML(message);
    
    content.appendChild(icon);
    content.appendChild(msg);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.setAttribute('aria-label', 'Kapat');

    function dismiss() {
        if (toast.classList.contains('hide')) return;
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 320);
    }

    closeBtn.addEventListener('click', dismiss);
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    setTimeout(dismiss, 4000);
};

// Modern Confirm Dialog
window.showConfirm = function(message, onConfirm, onCancel) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const confirmToast = document.createElement('div');
    confirmToast.className = 'toast confirm-toast';
    confirmToast.setAttribute('role', 'alert');

    const content = document.createElement('div');
    content.className = 'toast-content';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-exclamation-triangle toast-icon';
    
    const msg = document.createElement('span');
    msg.className = 'toast-message';
    msg.textContent = message;
    
    content.appendChild(icon);
    content.appendChild(msg);

    const actions = document.createElement('div');
    actions.className = 'toast-actions';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'toast-btn toast-btn-cancel';
    cancelBtn.textContent = 'İptal';
    cancelBtn.onclick = () => {
        dismiss();
        if (onCancel) onCancel();
    };
    
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'toast-btn toast-btn-confirm';
    confirmBtn.textContent = 'Sil';
    confirmBtn.onclick = () => {
        dismiss();
        if (onConfirm) onConfirm();
    };
    
    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);

    function dismiss() {
        if (confirmToast.classList.contains('hide')) return;
        confirmToast.classList.add('hide');
        setTimeout(() => confirmToast.remove(), 320);
    }

    confirmToast.appendChild(content);
    confirmToast.appendChild(actions);
    container.appendChild(confirmToast);
};

// ==========================================
// 19. MODERN CONFIRM DIALOG
// ==========================================

let confirmCallback = null;

window.showConfirm = function(title, message, confirmText = "Evet, Sil") {
    return new Promise((resolve) => {
        confirmCallback = resolve;
        
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmBtn').textContent = confirmText;
        document.getElementById('confirmModal').style.display = 'flex';
    });
};

window.acceptConfirm = function() {
    document.getElementById('confirmModal').style.display = 'none';
    if (confirmCallback) {
        confirmCallback(true);
        confirmCallback = null;
    }
};

window.cancelConfirm = function() {
    document.getElementById('confirmModal').style.display = 'none';
    if (confirmCallback) {
        confirmCallback(false);
        confirmCallback = null;
    }
};

// ==========================================
// 20. GLOBAL KLAVYE KISAYOLLARI
// ==========================================

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // Önce confirm modal kontrol et
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal && confirmModal.style.display === 'flex') {
            cancelConfirm();
            return;
        }
        
        // Sonra diğer modallar
        const openModal = Array.from(document.querySelectorAll('.modal-overlay'))
            .find(modal => modal.style.display === 'flex');
        
        if (openModal) {
            const cancelBtn = openModal.querySelector('.btn-cancel');
            const closeIconBtn = openModal.querySelector('.btn-close-pm');
            if (cancelBtn) cancelBtn.click();
            else if (closeIconBtn) closeIconBtn.click();
        }
    }

    if (event.key === 'Enter') {
        if (document.activeElement.tagName === 'TEXTAREA') return;
        
        const openModal = Array.from(document.querySelectorAll('.modal-overlay'))
            .find(modal => modal.style.display === 'flex');
            
        if (openModal) {
            const saveBtn = openModal.querySelector('.btn-save');
            if (saveBtn) {
                event.preventDefault();
                saveBtn.click();
            }
        }
    }
});

// ==========================================
// 20. CLEANUP
// ==========================================

window.addEventListener('beforeunload', () => {
    if (AppState.timer.interval) {
        clearInterval(AppState.timer.interval);
    }
});

// ==========================================
// 21. BAŞLANGIÇ
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 RootPanel v2.0 başlatılıyor...');
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon(true);
        }
        
        StorageManager.loadAll();
        
        updateDate();
        DashboardManager.renderNotes();
        DashboardManager.renderTasks();
        DashboardManager.updateStats();
        QuickLinksManager.render();
        ToolsManager.render('all');
        ProjectsManager.render();
        AIToolsManager.render('all');
        WebsitesManager.render('all');
        PasswordsManager.render();
        CalendarManager.init();
        
        console.log('✅ RootPanel v2.0 başarıyla yüklendi!');
        
    } catch (error) {
        console.error("❌ Başlangıç hatası:", error);
        showToast("Uygulama başlatılamadı!", "error");
    }
});

console.log('📦 RootPanel v2.0 - Tüm modüller yüklendi!');
