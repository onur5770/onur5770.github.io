console.log("Script dosyası yüklendi.");

// --- GLOBAL DEĞİŞKENLER ---
let timerInterval;
let elapsedTime = 0;
let isRunning = false;
let myTools = [];
let editingIndex = -1; 
let quickLinks = [];   
let isLinkEditMode = false;

// Dashboard Verileri
let dashboardNotes = [];
let dashboardTasks = [];

// --- SAYFA YÜKLENDİĞİNDE ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        updateDate();
        
        // Tema Kontrolü
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon(true);
        }

        // Verileri Yükle
        loadTools();        
        loadDashboardData();
        loadQuickLinks();   
        loadAITools(); 
        loadProjects(); 
        loadWebsites();
        loadPasswords(); // <--- YENİ EKLENDİ
        
        // AJANDA VERİLERİNİ YÜKLE
        loadEvents();
        updateDashboardReminders();

        // Arayüzü Çiz
        renderTools('all');
        renderDashboardNotes();
        renderDashboardTasks();
        renderQuickLinks();
        renderWebsites('all'); // <--- YENİ EKLENDİ
        
        updateDashboardStats();

    } catch (error) {
        console.error("Başlangıç hatası:", error);
    }
});

// ==========================================
// 1. İSTATİSTİK GÜNCELLEME (GÖREVLER)
// ==========================================
function updateDashboardStats() {
    const activeTasks = dashboardTasks.filter(t => !t.completed).length;
    const taskStat = document.getElementById('stat-task-count');
    if (taskStat) taskStat.innerText = `${activeTasks} Aktif`;
}

// ==========================================
// 2. GENEL FONKSİYONLAR
// ==========================================
window.showPage = function(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => { p.style.display = 'none'; p.classList.remove('active-page'); });
    document.querySelectorAll('.sidebar li').forEach(i => i.classList.remove('active'));

    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.style.display = 'block';
        selectedPage.classList.add('active-page');
        if(pageId === 'agenda') refreshCalendar();
    }
    const navItem = document.getElementById('nav-' + pageId);
    if (navItem) navItem.classList.add('active');
    updateTitle(pageId);
}

function updateTitle(pageId) {
    const titles = { 
        'dashboard': 'Genel Bakış', 
        'ctf': 'CTF & Tools', 
        'projects': 'Projelerim', 
        'ai-tools': 'Yapay Zeka Merkezi',
        'passwords': 'Şifre Yöneticisi', 
        'agenda': 'Ajanda',
        'websites': 'Web Siteleri' // <--- YENİ EKLENDİ
    };
    const t = document.getElementById('page-title');
    if(t) t.innerText = titles[pageId] || 'Panelim';
}

function updateDate() {
    const d = document.getElementById('currentDate');
    if(d) d.innerText = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

window.toggleTheme = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    updateThemeIcon(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function updateThemeIcon(isDark) {
    // Sadece 'Tema Değiştir' başlığına (title) sahip olan butonu hedef alıyoruz
    const themeBtn = document.querySelector('button[title="Tema Değiştir"] i');
    if(themeBtn) {
        themeBtn.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ==========================================
// 3. DASHBOARD NOTLAR VE GÖREVLER
// ==========================================

function loadDashboardData() {
    const storedNotes = localStorage.getItem('dashboardNotes');
    dashboardNotes = storedNotes ? JSON.parse(storedNotes) : [];

    const storedTasks = localStorage.getItem('dashboardTasks');
    dashboardTasks = storedTasks ? JSON.parse(storedTasks) : [];
}

function saveDashboardData() {
    localStorage.setItem('dashboardNotes', JSON.stringify(dashboardNotes));
    localStorage.setItem('dashboardTasks', JSON.stringify(dashboardTasks));
    updateDashboardStats();
}

// --- NOT İŞLEMLERİ ---
window.quickAddNote = function() {
    document.getElementById('noteModal').style.display = 'flex';
    document.getElementById('newNoteText').focus();
}

window.closeNoteModal = function() {
    document.getElementById('noteModal').style.display = 'none';
    document.getElementById('newNoteText').value = '';
}

window.saveNote = function() {
    const noteText = document.getElementById('newNoteText').value;
    if(noteText.trim()) {
        dashboardNotes.push({ text: noteText, date: new Date().toLocaleTimeString() });
        saveDashboardData();
        renderDashboardNotes();
        closeNoteModal();
    } else {
        showToast("Lütfen bir not yazın.", "warning");
    }
}

function renderDashboardNotes() {
    const container = document.getElementById('dashboardNotesList');
    const countBadge = document.getElementById('noteCount');
    if(!container) return;

    container.innerHTML = '';
    countBadge.innerText = dashboardNotes.length;

    if (dashboardNotes.length === 0) {
        container.innerHTML = '<div class="empty-state">Henüz not yok.</div>';
        return;
    }

    dashboardNotes.forEach((note, index) => {
        const div = document.createElement('div');
        div.className = 'dashboard-note';
        div.innerHTML = `
            ${note.text}
            <button class="delete-note-btn" onclick="deleteDashboardNote(${index})" title="Sil">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

window.deleteDashboardNote = function(index) {
    dashboardNotes.splice(index, 1);
    saveDashboardData();
    renderDashboardNotes();
}

// --- GÖREV İŞLEMLERİ ---
window.quickAddTask = function() {
    document.getElementById('taskModal').style.display = 'flex';
    document.getElementById('newTaskText').focus();
}

window.closeTaskModal = function() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('newTaskText').value = '';
}

window.saveTask = function() {
    const taskText = document.getElementById('newTaskText').value;
    if(taskText.trim()) {
        dashboardTasks.push({ text: taskText, completed: false });
        saveDashboardData();
        renderDashboardTasks();
        closeTaskModal();
    } else {
        showToast("Lütfen görev adını yazın.", "warning");
    }
}

function renderDashboardTasks() {
    const container = document.getElementById('dashboardTasksList');
    const countBadge = document.getElementById('taskCount');
    if(!container) return;

    container.innerHTML = '';
    const activeCount = dashboardTasks.filter(t => !t.completed).length;
    countBadge.innerText = activeCount;

    if (dashboardTasks.length === 0) {
        container.innerHTML = '<div class="empty-state">Görev eklenmedi.</div>';
        return;
    }

    dashboardTasks.forEach((task, index) => {
        const div = document.createElement('div');
        div.className = `dashboard-task ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})">
            <span>${task.text}</span>
            <button class="delete-task-btn" onclick="deleteDashboardTask(${index})" title="Sil">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

window.toggleTask = function(index) {
    dashboardTasks[index].completed = !dashboardTasks[index].completed;
    saveDashboardData();
    renderDashboardTasks();
}

window.deleteDashboardTask = function(index) {
    dashboardTasks.splice(index, 1);
    saveDashboardData();
    renderDashboardTasks();
}

// ==========================================
// 4. KRONOMETRE
// ==========================================
window.startTimer = function() { 
    if (isRunning) return; 
    isRunning = true;
    timerInterval = setInterval(() => {
        elapsedTime++; 
        updateTimerDisplay();
    }, 1000);
}

window.stopTimer = function() {
    clearInterval(timerInterval);
    isRunning = false;
}

window.resetTimer = function() {
    clearInterval(timerInterval);
    isRunning = false;
    elapsedTime = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const t = document.getElementById('timer');
    if(t) {
        const m = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const s = (elapsedTime % 60).toString().padStart(2, '0');
        t.innerText = `${m}:${s}`;
    }
}

// ==========================================
// 5. HIZLI ERİŞİM (TAMAMEN BOŞ)
// ==========================================
function loadQuickLinks() {
    const stored = localStorage.getItem('quickLinks');
    if (stored) {
        quickLinks = JSON.parse(stored);
    } else {
        quickLinks = []; // Varsayılan: BOMBOŞ
    }
}

function saveLinksLocal() {
    localStorage.setItem('quickLinks', JSON.stringify(quickLinks));
}

function renderQuickLinks() {
    const container = document.getElementById('quickLinksContainer');
    if (!container) return;
    container.innerHTML = '';

    if (isLinkEditMode) {
        container.classList.add('editing');
        document.getElementById('btnEditLinks').classList.add('active');
    } else {
        container.classList.remove('editing');
        const btn = document.getElementById('btnEditLinks');
        if(btn) btn.classList.remove('active');
    }

    quickLinks.forEach((link, index) => {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = "_blank";
        a.className = "link-item";

        if(isLinkEditMode) {
            a.style.pointerEvents = "none";
        }

        a.innerHTML = `
            <i class="${link.icon || 'fas fa-link'}"></i> ${link.name}
            <button class="delete-link-btn" style="pointer-events: auto;" onclick="deleteLink(event, ${index})" title="Sil">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(a);
    });
}

window.toggleLinkEditMode = function() {
    isLinkEditMode = !isLinkEditMode;
    renderQuickLinks();
}

window.deleteLink = function(event, index) {
    event.preventDefault();
    quickLinks.splice(index, 1);
    saveLinksLocal();
    renderQuickLinks();
}

window.openLinkModal = function() { document.getElementById('linkModal').style.display = 'flex'; }
window.closeLinkModal = function() { document.getElementById('linkModal').style.display = 'none'; }

window.saveLink = function() {
    const name = document.getElementById('linkName').value;
    let url = document.getElementById('linkUrl').value;
    const icon = document.getElementById('linkIcon').value;

    if (!name || !url) return;
    if (!url.startsWith('http')) url = 'https://' + url;

    quickLinks.push({ name, url, icon });
    saveLinksLocal();
    isLinkEditMode = false; 
    renderQuickLinks();
    closeLinkModal();
}

// ==========================================
// 6. CTF TOOLS SİSTEMİ
// ==========================================
function loadTools() {
    try {
        const stored = localStorage.getItem('myTools');
        if (stored) myTools = JSON.parse(stored);
        else myTools = []; // Varsayılan: BOŞ
    } catch (e) {
        myTools = [];
    }
}

function saveTools() {
    localStorage.setItem('myTools', JSON.stringify(myTools));
}

function renderTools(filterCategory) {
    const container = document.getElementById('toolsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    document.querySelectorAll('#ctf .cat-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('#ctf .cat-btn')).find(b => 
        b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${filterCategory}'`)
    );
    if(activeBtn) activeBtn.classList.add('active');
    
    const filtered = (filterCategory === 'all') ? myTools : myTools.filter(t => t.category === filterCategory);
    
    filtered.forEach(tool => {
        const originalIndex = myTools.indexOf(tool);
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-cat', tool.category);
        
        card.innerHTML = `
            <button onclick="editTool(${originalIndex})" class="btn-edit-tool"><i class="fas fa-pencil-alt"></i></button>
            <div class="tool-header">
                <span class="tool-tag tag-${tool.category}">${tool.category}</span>
            </div>
            <h3>${tool.name}</h3>
            <p>${tool.desc}</p>
            <a href="${tool.link}" target="_blank" class="tool-link">Aç -></a>
        `;
        container.appendChild(card);
    });
}

window.editTool = function(index) {
    editingIndex = index;
    const tool = myTools[index];
    document.getElementById('toolName').value = tool.name;
    document.getElementById('toolCategory').value = tool.category;
    document.getElementById('toolDesc').value = tool.desc;
    document.getElementById('toolLink').value = tool.link;
    
    const title = document.querySelector('#toolModal .modal-content h3');
    if(title) title.innerText = "Aracı Düzenle";
    
    openToolModal();
}

window.openToolModal = function() { 
    const modal = document.getElementById('toolModal');
    const deleteBtn = document.getElementById('btnDeleteTool'); 
    if(modal) modal.style.display = 'flex'; 
    
    if (editingIndex === -1) {
        const title = document.querySelector('#toolModal .modal-content h3');
        if(title) title.innerText = "Yeni Araç Ekle";
        document.getElementById('toolName').value = '';
        document.getElementById('toolDesc').value = '';
        document.getElementById('toolLink').value = '';
        if(deleteBtn) deleteBtn.style.display = 'none';
    } else {
        if(deleteBtn) deleteBtn.style.display = 'flex';
    }
}

window.deleteCurrentTool = function() {
    if (editingIndex > -1) {
        if(confirm("Bu aracı silmek istediğine emin misin?")) {
            myTools.splice(editingIndex, 1);
            saveTools();
            renderTools('all');
            closeToolModal();
        }
    }
}

window.closeToolModal = function() { 
    document.getElementById('toolModal').style.display = 'none'; editingIndex = -1; 
}

window.saveTool = function() {
    const name = document.getElementById('toolName').value;
    const link = document.getElementById('toolLink').value;
    const cat = document.getElementById('toolCategory').value;
    const desc = document.getElementById('toolDesc').value;
    if(!name || !link) return;

    const toolObj = { name, category: cat, desc, link };
    if (editingIndex > -1) myTools[editingIndex] = toolObj;
    else myTools.push(toolObj);

    saveTools();
    renderTools('all');
    closeToolModal();
}

window.filterTools = function(cat) { renderTools(cat); }

// ==========================================
// 7. PROJELER & YÖNETİM SİSTEMİ
// ==========================================

let myProjects = [];
let currentProjectId = -1;

function loadProjects() {
    const stored = localStorage.getItem('myProjects');
    if (stored) {
        myProjects = JSON.parse(stored);
    } else {
        myProjects = []; // Varsayılan: BOŞ
    }
    renderProjects();
    updateDashboardProjectCount();
}

function saveProjects() {
    localStorage.setItem('myProjects', JSON.stringify(myProjects));
    updateDashboardProjectCount();
}

function updateDashboardProjectCount() {
    const countEl = document.getElementById('stat-project-count');
    if (!countEl) return;
    const activeCount = myProjects.filter(p => p.status === 'devam').length;
    countEl.innerText = `${activeCount} Devam Eden`;
}

function renderProjects(filterText = '') {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    container.innerHTML = '';

    const filtered = myProjects.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = `project-card status-${p.status}`;
        card.onclick = () => openProjectDetail(p.id);
        
        const totalTasks = p.tasks ? p.tasks.length : 0;
        const completedTasks = p.tasks ? p.tasks.filter(t => t.completed).length : 0;
        const progressText = totalTasks > 0 ? `${completedTasks}/${totalTasks} Görev` : 'Görev Yok';

        card.innerHTML = `
            <h3>${p.name}</h3>
            <p>${p.desc}</p>
            <div class="project-meta">
                <span>${new Date(p.id).toLocaleDateString()}</span>
                <span>${progressText}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

window.searchProjects = function() {
    const txt = document.getElementById('projectSearch').value;
    renderProjects(txt);
}

window.openProjectDetail = function(id) {
    currentProjectId = id;
    const project = myProjects.find(p => p.id === id);
    if (!project) return;

    document.getElementById('pmTitleInput').value = project.name;
    document.getElementById('pmStatusInput').value = project.status;
    document.getElementById('pmNotes').value = project.notes || "";
    renderProjectTasks(project);

    document.getElementById('projectDetailModal').style.display = 'flex';
}

window.closeProjectDetail = function() {
    saveProjectDetails();
    document.getElementById('projectDetailModal').style.display = 'none';
    currentProjectId = -1;
    renderProjects();
}

window.saveProjectDetails = function() {
    if (currentProjectId === -1) return;
    const project = myProjects.find(p => p.id === currentProjectId);
    if(project) {
        project.name = document.getElementById('pmTitleInput').value;
        project.status = document.getElementById('pmStatusInput').value;
        project.notes = document.getElementById('pmNotes').value;
        saveProjects();
    }
}

function renderProjectTasks(project) {
    const list = document.getElementById('pmTaskList');
    list.innerHTML = '';
    if (!project.tasks) project.tasks = [];

    project.tasks.forEach((task, index) => {
        const item = document.createElement('div');
        item.className = `pm-task-item ${task.completed ? 'completed' : ''}`;
        item.innerHTML = `
            <input type="checkbox" class="pm-task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleProjectTask(${index})">
            <span class="pm-task-text">${task.text}</span>
            <button class="pm-btn-del-task" onclick="deleteProjectTask(${index})"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(item);
    });
}

window.addProjectTask = function() {
    const input = document.getElementById('pmNewTask');
    const text = input.value.trim();
    if (!text) return;

    const project = myProjects.find(p => p.id === currentProjectId);
    if (project) {
        if (!project.tasks) project.tasks = [];
        project.tasks.push({ text: text, completed: false });
        input.value = ''; 
        saveProjects();
        renderProjectTasks(project);
    }
}

window.handleTaskEnter = function(e) {
    if (e.key === 'Enter') addProjectTask();
}

window.toggleProjectTask = function(index) {
    const project = myProjects.find(p => p.id === currentProjectId);
    if (project && project.tasks[index]) {
        project.tasks[index].completed = !project.tasks[index].completed;
        saveProjects();
        renderProjectTasks(project);
    }
}

window.deleteProjectTask = function(index) {
    const project = myProjects.find(p => p.id === currentProjectId);
    if (project) {
        project.tasks.splice(index, 1);
        saveProjects();
        renderProjectTasks(project);
    }
}

window.openNewProjectModal = function() { document.getElementById('newProjectModal').style.display = 'flex'; }
window.closeNewProjectModal = function() { document.getElementById('newProjectModal').style.display = 'none'; }

window.createNewProject = function() {
    const name = document.getElementById('newProjName').value;
    const status = document.getElementById('newProjStatus').value;
    const desc = document.getElementById('newProjDesc').value;

    if (!name) { showToast("Lütfen proje adı girin!", "warning"); return; }

    myProjects.push({
        id: Date.now(),
        name, status, desc, 
        notes: "", 
        tasks: []
    });
    
    saveProjects();
    renderProjects();
    closeNewProjectModal();
    
    document.getElementById('newProjName').value = '';
    document.getElementById('newProjDesc').value = '';
}

window.deleteCurrentProject = function() {
    if (currentProjectId === -1) return;
    if(confirm("Bu projeyi silmek istediğine emin misin?")) {
        const index = myProjects.findIndex(p => p.id === currentProjectId);
        if (index > -1) {
            myProjects.splice(index, 1);
            saveProjects();
            renderProjects();
            document.getElementById('projectDetailModal').style.display = 'none';
            currentProjectId = -1;
        }
    }
}

// ==========================================
// 8. AI TOOLS YÖNETİMİ
// ==========================================

let aiTools = [];
let editingAIIndex = -1;

function loadAITools() {
    const stored = localStorage.getItem('aiTools');
    if (stored) {
        aiTools = JSON.parse(stored);
        aiTools.forEach(tool => {
            if (typeof tool.category === 'string') {
                tool.categories = [tool.category];
                delete tool.category;
            }
        });
    } else {
        aiTools = []; // Varsayılan: BOŞ
    }
    renderAITools('all');
}

function saveAITools() {
    localStorage.setItem('aiTools', JSON.stringify(aiTools));
}

function renderAITools(filterCat) {
    const container = document.getElementById('aiToolsContainer');
    if (!container) return;
    container.innerHTML = '';

    const btns = document.querySelectorAll('#ai-tools .cat-btn');
    btns.forEach(b => b.classList.remove('active'));
    const activeBtn = Array.from(btns).find(b => b.getAttribute('onclick').includes(`'${filterCat}'`));
    if(activeBtn) activeBtn.classList.add('active');

    const filtered = (filterCat === 'all') 
        ? aiTools 
        : aiTools.filter(t => t.categories && t.categories.includes(filterCat));

    // Kategori isimlerini Türkçeleştirmek için
    const categoryNames = {
        chat: "SOHBET", code: "KOD", image: "GÖRSEL", audio: "SES",
        cyber: "GÜVENLİK", lesson: "DERS", general: "GENEL"
    };

    filtered.forEach((tool) => {
        const originalIndex = aiTools.indexOf(tool);
        const card = document.createElement('div');
        
        // ÖNEMLİ DEĞİŞİKLİK: Artık 'tool-card' sınıfını kullanıyoruz (Diğerleri gibi görünmesi için)
        card.className = 'project-card'; 
        
        // Renk şeridi için ilk kategoriyi baz alalım
        const mainCat = tool.categories[0] || 'general';
        card.setAttribute('data-cat', mainCat);
        
        // Etiket ismini belirle
        const tagName = categoryNames[mainCat] || mainCat.toUpperCase();

        card.innerHTML = `
            <button onclick="editAI(${originalIndex})" class="btn-edit-tool"><i class="fas fa-pencil-alt"></i></button>
            <div class="tool-header">
                <span class="tool-tag tag-${mainCat}">${tagName}</span>
            </div>
            <h3>${tool.name}</h3>
            <p>${tool.desc}</p>
            <a href="${tool.link}" target="_blank" class="tool-link">Aç -></a>
        `;
        container.appendChild(card);
    });
}

window.filterAITools = function(cat) { renderAITools(cat); }

window.openAIModal = function() {
    document.getElementById('aiModal').style.display = 'flex';
    const deleteBtn = document.getElementById('btnDeleteAI');
    document.querySelectorAll('.checkbox-group input').forEach(cb => cb.checked = false);

    if (editingAIIndex === -1) {
        document.querySelector('#aiModal h3').innerText = "Yeni Yapay Zeka Ekle";
        document.getElementById('aiName').value = '';
        document.getElementById('aiDesc').value = '';
        document.getElementById('aiLink').value = '';
        if(deleteBtn) deleteBtn.style.display = 'none'; 
        const genCb = document.querySelector('.checkbox-group input[value="general"]');
        if(genCb) genCb.checked = true;
    } else {
        if(deleteBtn) deleteBtn.style.display = 'flex'; 
    }
}

window.editAI = function(index) {
    editingAIIndex = index;
    const tool = aiTools[index];
    document.getElementById('aiName').value = tool.name;
    document.getElementById('aiDesc').value = tool.desc;
    document.getElementById('aiLink').value = tool.link;
    
    document.querySelectorAll('.checkbox-group input').forEach(cb => {
        if (tool.categories.includes(cb.value)) cb.checked = true;
        else cb.checked = false;
    });
    
    document.querySelector('#aiModal h3').innerText = "Aracı Düzenle";
    const deleteBtn = document.getElementById('btnDeleteAI');
    if(deleteBtn) deleteBtn.style.display = 'flex';
    document.getElementById('aiModal').style.display = 'flex';
}

window.saveAI = function() {
    const name = document.getElementById('aiName').value;
    const desc = document.getElementById('aiDesc').value;
    const link = document.getElementById('aiLink').value;

    const selectedCats = [];
    document.querySelectorAll('.checkbox-group input:checked').forEach(cb => {
        selectedCats.push(cb.value);
    });

    if (!name || !link) { showToast("İsim ve Link zorunlu!", "warning"); return; }
    if (selectedCats.length === 0) { showToast("En az bir kategori seçmelisin!", "warning"); return; }

    const newTool = { name, categories: selectedCats, desc, link };

    if (editingAIIndex > -1) aiTools[editingAIIndex] = newTool;
    else aiTools.push(newTool);

    saveAITools();
    renderAITools('all');
    closeAIModal();
}

window.closeAIModal = function() {
    document.getElementById('aiModal').style.display = 'none';
    editingAIIndex = -1;
}

window.deleteCurrentAI = function() {
    if (editingAIIndex > -1) {
        if(confirm("Silmek istediğine emin misin?")) {
            aiTools.splice(editingAIIndex, 1);
            saveAITools();
            renderAITools('all');
            closeAIModal();
        }
    }
}

// ==========================================
// 9. AJANDA (YIL & AY GÖRÜNÜMÜ)
// ==========================================

let myEvents = [];
let currentDate = new Date(); 
let currentView = 'month';    
let editingEventId = -1;

function loadEvents() {
    const stored = localStorage.getItem('myEvents');
    if (stored) myEvents = JSON.parse(stored);
    else myEvents = []; // Varsayılan: BOŞ
    
    refreshCalendar();
    updateDashboardReminders();
}

function saveEvents() {
    localStorage.setItem('myEvents', JSON.stringify(myEvents));
    refreshCalendar();
    updateDashboardReminders();
}

function refreshCalendar() {
    if (currentView === 'month') {
        renderMonthView();
    } else {
        renderYearView();
    }
    updateHeaderTitle();
}

window.setCalendarView = function(view) {
    currentView = view;
    document.getElementById('viewMonthBtn').className = `cal-view-btn ${view === 'month' ? 'active' : ''}`;
    document.getElementById('viewYearBtn').className = `cal-view-btn ${view === 'year' ? 'active' : ''}`;
    document.getElementById('monthViewContainer').style.display = (view === 'month') ? 'flex' : 'none';
    document.getElementById('yearViewContainer').style.display = (view === 'year') ? 'grid' : 'none';
    refreshCalendar();
}

window.changeDate = function(delta) {
    if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + delta);
    } else {
        currentDate.setFullYear(currentDate.getFullYear() + delta);
    }
    refreshCalendar();
}

window.goToday = function() {
    currentDate = new Date();
    refreshCalendar();
}

function updateHeaderTitle() {
    const year = currentDate.getFullYear();
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    
    if (currentView === 'month') {
        document.getElementById('calendarTitle').innerText = `${monthNames[currentDate.getMonth()]} ${year}`;
    } else {
        document.getElementById('calendarTitle').innerText = `${year}`;
    }
}

function renderMonthView() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
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
        num.innerText = day;
        cell.appendChild(num);

        const dayEvents = myEvents.filter(e => e.date === cellDateStr);
        dayEvents.forEach(evt => {
            const bar = document.createElement('div');
            bar.className = `cal-event-bar cal-event-${evt.type}`;
            if (evt.completed) bar.classList.add('cal-event-completed');
            bar.innerText = evt.title;
            bar.onclick = (e) => {
                e.stopPropagation();
                openEventModal(cellDateStr, evt.id);
            };
            cell.appendChild(bar);
        });
        grid.appendChild(cell);
    }
}

function renderYearView() {
    const container = document.getElementById('yearViewContainer');
    container.innerHTML = '';
    const year = currentDate.getFullYear();
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    for (let m = 0; m < 12; m++) {
        const monthCard = document.createElement('div');
        monthCard.className = 'mini-month-card';
        const title = document.createElement('div');
        title.className = 'mini-month-title';
        title.innerText = monthNames[m];
        monthCard.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'mini-cal-grid';
        const daysShort = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];
        daysShort.forEach(d => {
            const h = document.createElement('div');
            h.className = 'mini-day-header';
            h.innerText = d;
            grid.appendChild(h);
        });

        const firstDay = new Date(year, m, 1).getDay();
        const daysTotal = new Date(year, m + 1, 0).getDate();
        let offset = firstDay === 0 ? 6 : firstDay - 1;

        for(let i=0; i<offset; i++) grid.appendChild(document.createElement('div'));

        for(let d=1; d<=daysTotal; d++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'mini-day';
            dayCell.innerText = d;
            
            const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const evts = myEvents.filter(e => e.date === dateStr);
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
}

window.openEventModal = function(dateStr, eventId = -1) {
    editingEventId = eventId;
    document.getElementById('eventDate').value = dateStr;
    const delBtn = document.getElementById('btnDeleteEvent');

    if (eventId > -1) {
        const evt = myEvents.find(e => e.id === eventId);
        document.getElementById('eventTitle').value = evt.title;
        document.getElementById('eventType').value = evt.type;
        document.getElementById('eventCompleted').checked = evt.completed;
        delBtn.style.display = 'flex';
    } else {
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventType').value = 'deadline';
        document.getElementById('eventCompleted').checked = false;
        delBtn.style.display = 'none';
    }
    document.getElementById('eventModal').style.display = 'flex';
}

window.saveEvent = function() {
    const title = document.getElementById('eventTitle').value;
    const type = document.getElementById('eventType').value;
    const date = document.getElementById('eventDate').value;
    const completed = document.getElementById('eventCompleted').checked;

    if (!title) { showToast("Başlık giriniz!", "warning"); return; }

    const newEvent = {
        id: (editingEventId === -1) ? Date.now() : editingEventId,
        title, type, date, completed
    };

    if (editingEventId === -1) myEvents.push(newEvent);
    else {
        const index = myEvents.findIndex(e => e.id === editingEventId);
        if (index > -1) myEvents[index] = newEvent;
    }

    saveEvents();
    closeEventModal();
}

window.deleteCurrentEvent = function() {
    if (editingEventId === -1) return;
    if (confirm("Bu etkinliği silmek istediğine emin misin?")) {
        const index = myEvents.findIndex(e => e.id === editingEventId);
        if (index > -1) myEvents.splice(index, 1);
        saveEvents();
        closeEventModal();
    }
}

window.closeEventModal = function() {
    document.getElementById('eventModal').style.display = 'none';
}

function updateDashboardReminders() {
    const countEl = document.getElementById('stat-upcoming-count');
    if (!countEl) return;

    const today = new Date();
    today.setHours(0,0,0,0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcomingEvents = myEvents.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= today && eDate <= nextWeek && !e.completed;
    });

    const count = upcomingEvents.length;
    countEl.innerText = count > 0 ? `${count} Hatırlatma` : "Hatırlatma Yok";
    
    const cardIcon = document.querySelector('.stat-card .icon-box.orange');
    if(count > 0 && cardIcon) cardIcon.style.animation = "pulse 2s infinite";
    else if(cardIcon) cardIcon.style.animation = "none";
}

// ==========================================
// 10. WEB SİTELERİ (YENİ EKLENEN KISIM)
// ==========================================

let myWebsites = [];
let editingWebIndex = -1;

function loadWebsites() {
    const stored = localStorage.getItem('myWebsites');
    if (stored) {
        myWebsites = JSON.parse(stored);
    } else {
        myWebsites = []; // Varsayılan: BOŞ
    }
    renderWebsites('all');
}

function saveWebsites() {
    localStorage.setItem('myWebsites', JSON.stringify(myWebsites));
}

function renderWebsites(filterCat) {
    const container = document.getElementById('websitesContainer');
    if (!container) return;
    container.innerHTML = '';

    const btns = document.querySelectorAll('#websites .cat-btn');
    btns.forEach(b => b.classList.remove('active'));
    
    const activeBtn = Array.from(btns).find(b => 
        b.getAttribute('onclick') && b.getAttribute('onclick').includes(`'${filterCat}'`)
    );
    if(activeBtn) activeBtn.classList.add('active');

    const filtered = (filterCat === 'all') 
        ? myWebsites 
        : myWebsites.filter(w => w.category === filterCat);

    // İŞTE EKSİK OLAN TÜRKÇE SÖZLÜK BURASIYDI:
    const trNames = {
        news: "HABER",
        tech: "TEKNOLOJİ",
        social: "SOSYAL",
        dev: "YAZILIM",
        design: "TASARIM",
        other: "DİĞER"
    };

    filtered.forEach(web => {
        const originalIndex = myWebsites.indexOf(web);
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-cat', web.category);
        
        // Burada artık Türkçe ismini çekiyoruz
        const tagName = trNames[web.category] || web.category.toUpperCase();

        card.innerHTML = `
            <button onclick="editWebsite(${originalIndex})" class="btn-edit-tool"><i class="fas fa-pencil-alt"></i></button>
            <div class="tool-header">
                <span class="tool-tag tag-${web.category}">${tagName}</span>
            </div>
            <h3>${web.name}</h3>
            <p>${web.desc}</p>
            <a href="${web.link}" target="_blank" class="tool-link">Aç -></a>
        `;
        container.appendChild(card);
    });
}

window.filterWebsites = function(cat) { renderWebsites(cat); }

window.openWebsiteModal = function() {
    const modal = document.getElementById('websiteModal');
    const deleteBtn = document.getElementById('btnDeleteWeb');
    if(modal) modal.style.display = 'flex';
    
    if (editingWebIndex === -1) {
        document.querySelector('#websiteModal h3').innerText = "Yeni Web Sitesi Ekle";
        document.getElementById('webName').value = '';
        document.getElementById('webCategory').value = 'news';
        document.getElementById('webDesc').value = '';
        document.getElementById('webLink').value = '';
        if(deleteBtn) deleteBtn.style.display = 'none';
    } else {
        if(deleteBtn) deleteBtn.style.display = 'flex';
    }
}

window.editWebsite = function(index) {
    editingWebIndex = index;
    const web = myWebsites[index];
    document.getElementById('webName').value = web.name;
    document.getElementById('webCategory').value = web.category;
    document.getElementById('webDesc').value = web.desc;
    document.getElementById('webLink').value = web.link;
    
    document.querySelector('#websiteModal h3').innerText = "Siteyi Düzenle";
    openWebsiteModal();
}

window.saveWebsite = function() {
    const name = document.getElementById('webName').value;
    const cat = document.getElementById('webCategory').value;
    const desc = document.getElementById('webDesc').value;
    let link = document.getElementById('webLink').value;

    if (!name || !link) { showToast("İsim ve Link zorunlu!", "warning"); return; }
    if (!link.startsWith('http')) link = 'https://' + link;

    const newWeb = { name, category: cat, desc, link };

    if (editingWebIndex > -1) myWebsites[editingWebIndex] = newWeb;
    else myWebsites.push(newWeb);

    saveWebsites();
    renderWebsites('all');
    closeWebsiteModal();
}

window.closeWebsiteModal = function() {
    document.getElementById('websiteModal').style.display = 'none';
    editingWebIndex = -1;
}

window.deleteCurrentWebsite = function() {
    if (editingWebIndex > -1) {
        if(confirm("Silmek istediğine emin misin?")) {
            myWebsites.splice(editingWebIndex, 1);
            saveWebsites();
            renderWebsites('all');
            closeWebsiteModal();
        }
    }
}

// ==========================================
// 11. KLAVYE KISAYOLLARI (GLOBAL)
// ==========================================
document.addEventListener('keydown', function(event) {
    const openModal = Array.from(document.querySelectorAll('.modal-overlay')).find(modal => modal.style.display === 'flex');
    if (!openModal) return;

    if (event.key === 'Escape') {
        const cancelBtn = openModal.querySelector('.btn-cancel');
        const closeIconBtn = openModal.querySelector('.btn-close-pm');
        if (cancelBtn) cancelBtn.click();
        else if (closeIconBtn) closeIconBtn.click();
    }

    if (event.key === 'Enter') {
        if (document.activeElement.tagName === 'TEXTAREA') return;
        const saveBtn = openModal.querySelector('.btn-save, .btn-save-snip, .btn-save-header, .btn-save-notes');
        if (saveBtn) {
            event.preventDefault(); 
            saveBtn.click(); 
        }
    }
});

// ==========================================
// 12. AYARLAR & YEDEKLEME SİSTEMİ
// ==========================================

function openSettingsModal() {
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function exportData() {
    const backupData = {
        meta: {
            date: new Date().toISOString(),
            appName: "RootPanel"
        },
        data: {
            theme: localStorage.getItem('theme'),
            myTools: JSON.parse(localStorage.getItem('myTools') || '[]'),
            dashboardNotes: JSON.parse(localStorage.getItem('dashboardNotes') || '[]'),
            dashboardTasks: JSON.parse(localStorage.getItem('dashboardTasks') || '[]'),
            quickLinks: JSON.parse(localStorage.getItem('quickLinks') || '[]'),
            myProjects: JSON.parse(localStorage.getItem('myProjects') || '[]'),
            aiTools: JSON.parse(localStorage.getItem('aiTools') || '[]'),
            myEvents: JSON.parse(localStorage.getItem('myEvents') || '[]'),
            myWebsites: JSON.parse(localStorage.getItem('myWebsites') || '[]'),
            myPasswords: JSON.parse(localStorage.getItem('myPasswords') || '[]'),
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
}

function triggerImport() {
    document.getElementById('importFile').click();
}

function importData(input) {
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

            if(confirm(`Bu yedeği yüklemek mevcut verilerinizi değiştirecektir.\n\nYedek Tarihi: ${new Date(json.meta.date).toLocaleString()}\nDevam edilsin mi?`)) {
                localStorage.clear();
                const d = json.data;
                if(d.theme) localStorage.setItem('theme', d.theme);
                localStorage.setItem('myTools', JSON.stringify(d.myTools || []));
                localStorage.setItem('dashboardNotes', JSON.stringify(d.dashboardNotes || []));
                localStorage.setItem('dashboardTasks', JSON.stringify(d.dashboardTasks || []));
                localStorage.setItem('quickLinks', JSON.stringify(d.quickLinks || []));
                localStorage.setItem('myProjects', JSON.stringify(d.myProjects || []));
                localStorage.setItem('aiTools', JSON.stringify(d.aiTools || []));
                localStorage.setItem('myEvents', JSON.stringify(d.myEvents || []));
                localStorage.setItem('myWebsites', JSON.stringify(d.myWebsites || [])); 
                localStorage.setItem('myPasswords', JSON.stringify(d.myPasswords || []));

                showToast("Yedek başarıyla yüklendi! Sayfa yenileniyor...", "success");
                setTimeout(function() { location.reload(); }, 1200);
            }
        } catch (err) {
            console.error(err);
            showToast("Dosya okunamadı! JSON formatı bozuk olabilir.", "error");
        }
    };
    reader.readAsText(file);
    input.value = '';
}

function clearAllData() {
    if(confirm("DİKKAT: Tüm verilerin silinecek! Bu işlem geri alınamaz.\n\nEmin misin?")) {
        localStorage.clear();
        location.reload();
    }
}
/**
 * Custom toast notification (replaces browser alert).
 * @param {string} message - Message to show
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 */
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
    msg.textContent = message;
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

    const autoDismiss = setTimeout(dismiss, 4000);
    toast._autoDismiss = autoDismiss;
}
let myPasswords = [];
let editingPassIndex = -1;

function loadPasswords() {
    const stored = localStorage.getItem('myPasswords');
    myPasswords = stored ? JSON.parse(stored) : [];
    renderPasswords();
}

function savePasswordsLocal() {
    localStorage.setItem('myPasswords', JSON.stringify(myPasswords));
}

function renderPasswords(filterText = '') {
    const container = document.getElementById('passwordsContainer');
    if (!container) return;
    container.innerHTML = '';

    const filtered = myPasswords.filter(p => 
        p.title.toLowerCase().includes(filterText.toLowerCase()) || 
        p.user.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.forEach((p, index) => {
        const originalIndex = myPasswords.indexOf(p);
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-cat', 'other'); 
        
        card.innerHTML = `
            <button onclick="editPassword(${originalIndex})" class="btn-edit-tool"><i class="fas fa-pencil-alt"></i></button>
            <div class="tool-header">
                <span class="tool-tag">GÜVENLİ</span>
            </div>
            <div class="password-card-body">
                <h3>${p.title}</h3>
                <p class="password-card-user"><strong>Kullanıcı:</strong> ${p.user}</p>
            </div>
            <div class="password-card-actions">
                <button type="button" onclick="copyPasswordByIndex(${originalIndex})" class="btn-copy-password">
                    <i class="fas fa-copy"></i> Şifreyi Kopyala
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.openPasswordModal = function() {
    editingPassIndex = -1;
    document.getElementById('passTitle').value = '';
    document.getElementById('passUser').value = '';
    document.getElementById('passValue').value = '';
    document.getElementById('btnDeletePass').style.display = 'none';
    document.getElementById('passwordModal').style.display = 'flex';
}

window.editPassword = function(index) {
    editingPassIndex = index;
    const p = myPasswords[index];
    document.getElementById('passTitle').value = p.title;
    document.getElementById('passUser').value = p.user;
    document.getElementById('passValue').value = p.pass;
    document.getElementById('btnDeletePass').style.display = 'flex';
    document.getElementById('passwordModal').style.display = 'flex';
}

window.savePassword = function() {
    const title = document.getElementById('passTitle').value;
    const user = document.getElementById('passUser').value;
    const pass = document.getElementById('passValue').value;

    if (!title || !pass) return;

    const passObj = { title, user, pass };
    if (editingPassIndex > -1) myPasswords[editingPassIndex] = passObj;
    else myPasswords.push(passObj);

    savePasswordsLocal();
    renderPasswords();
    closePasswordModal();
}

window.closePasswordModal = function() {
    document.getElementById('passwordModal').style.display = 'none';
}

window.deleteCurrentPassword = function() {
    if (confirm("Bu şifreyi silmek istediğine emin misin?")) {
        myPasswords.splice(editingPassIndex, 1);
        savePasswordsLocal();
        renderPasswords();
        closePasswordModal();
    }
}

window.togglePassVisibility = function() {
    const input = document.getElementById('passValue');
    input.type = input.type === 'password' ? 'text' : 'password';
}

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Şifre panoya kopyalandı!", "success");
    });
}

window.copyPasswordByIndex = function(index) {
    if (myPasswords[index]) copyToClipboard(myPasswords[index].pass);
}

window.searchPasswords = function() {
    const txt = document.getElementById('passwordSearch').value;
    renderPasswords(txt);
}
window.generateSecurePassword = function() {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let retVal = "";
    
    // Güvenlik için kriptografik rastgele değerler kullanıyoruz
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
        retVal += charset.charAt(array[i] % charset.length);
    }
    
    const passInput = document.getElementById('passValue');
    passInput.value = retVal;
    
    // Şifrenin göründüğünden emin olmak için tipi text yapalım
    passInput.type = "text";
    
    if(window.showToast) showToast("Güçlü şifre oluşturuldu!", "info");
}
