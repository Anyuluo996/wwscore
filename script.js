// 角色模板相关变量
let characterTemplates = {};
let currentCharacterTemplate = null;
let currentTemplateTab = 'c4';

// 属性类型配置（简化版）
const attributeTypes = {
    '': '请选择',
    'hp': '生命',
    'hp_percent': '生命百分比',
    'atk': '攻击',
    'atk_percent': '攻击百分比',
    'def': '防御',
    'def_percent': '防御百分比',
    'resonance_efficiency': '共鸣效率',
    'crit_rate': '暴击',
    'crit_damage': '暴击伤害',
    'element_damage': '属性伤害加成',
    'healing_bonus': '治疗效果加成',
    'basic_attack_damage': '普攻伤害加成',
    'heavy_attack_damage': '重击伤害加成',
    'resonance_skill_damage': '共鸣技能伤害加成',
    'resonance_liberation_damage': '共鸣解放伤害加成'
};

// 主词条1可选属性（攻击百分比、暴击、暴击伤害、生命百分比、防御百分比、治疗效果加成、共鸣效率、属性伤害加成）
const mainAttributeTypes1 = {
    '': '请选择',
    'atk_percent': '攻击百分比',
    'crit_rate': '暴击',
    'crit_damage': '暴击伤害',
    'hp_percent': '生命百分比',
    'def_percent': '防御百分比',
    'healing_bonus': '治疗效果加成',
    'resonance_efficiency': '共鸣效率',
    'element_damage': '属性伤害加成'
};

// 主词条2可选属性（攻击、生命）
const mainAttributeTypes2 = {
    '': '请选择',
    'atk': '攻击',
    'hp': '生命'
};

// 副词条可选属性
const subAttributeTypes = {
    '': '请选择',
    'atk': '攻击',
    'atk_percent': '攻击百分比',
    'hp': '生命',
    'hp_percent': '生命百分比',
    'def': '防御',
    'def_percent': '防御百分比',
    'crit_rate': '暴击',
    'crit_damage': '暴击伤害',
    'resonance_efficiency': '共鸣效率',
    'basic_attack_damage': '普攻伤害加成',
    'heavy_attack_damage': '重击伤害加成',
    'resonance_skill_damage': '共鸣技能伤害加成',
    'resonance_liberation_damage': '共鸣解放伤害加成'
};

// 默认权重配置
const defaultWeights = {
    main: {  // 主词条权重
        'hp': 0.1,
        'hp_percent': 0.2,
        'atk': 0.1,
        'atk_percent': 0.3,
        'def': 0.05,
        'def_percent': 0.1,
        'resonance_efficiency': 0.2,
        'crit_rate': 0.5,
        'crit_damage': 0.4,
        'element_damage': 0.3,
        'healing_bonus': 0.2,
        'basic_attack_damage': 0.3,
        'heavy_attack_damage': 0.3,
        'resonance_skill_damage': 0.3,
        'resonance_liberation_damage': 0.3
    },
    sub: {  // 副词条权重
        'hp': 0.1,
        'hp_percent': 0.3,
        'atk': 0.15,
        'atk_percent': 0.8,
        'def': 0.05,
        'def_percent': 0.1,
        'resonance_efficiency': 0.4,
        'crit_rate': 1.5,
        'crit_damage': 1.0,
        'element_damage': 0.5,
        'healing_bonus': 0.3,
        'basic_attack_damage': 0.8,
        'heavy_attack_damage': 0.8,
        'resonance_skill_damage': 0.8,
        'resonance_liberation_damage': 0.8
    }
};

// 全局变量
let weights = JSON.parse(JSON.stringify(defaultWeights)); // 深拷贝
let maxScore = 100;  // 修改为与HTML默认值一致
let alignmentScore = 50;

// 初始化应用
function initApp() {
    // 设置HTML输入框的初始值
    document.getElementById('maxScoreMain').value = maxScore;
    document.getElementById('alignScoreMain').value = alignmentScore;
    
    createTableEntries();
    initCharacterTemplates();
    calculateTotal();
}

// 创建表格词条
function createTableEntries() {
    const tbody = document.getElementById('entriesTableBody');
    tbody.innerHTML = '';

    // 创建主词条行
    for (let i = 1; i <= 2; i++) {
        const row = createTableRow(`main-${i}`, `主词条 ${i}`, 'main');
        tbody.appendChild(row);
    }

    // 创建副词条行
    for (let i = 1; i <= 5; i++) {
        const row = createTableRow(`sub-${i}`, `副词条 ${i}`, 'sub');
        tbody.appendChild(row);
    }
}

// 创建表格行
function createTableRow(id, title, type) {
    // 根据类型和位置选择对应的属性选项
    let attributeOptions;
    if (type === 'main') {
        if (id === 'main-1') {
            attributeOptions = mainAttributeTypes1;
        } else if (id === 'main-2') {
            attributeOptions = mainAttributeTypes2;
        }
    } else {
        attributeOptions = subAttributeTypes;
    }
    
    // 创建简洁版本的标题（用于小屏幕）
    const shortTitle = title.replace('主词条', '主').replace('副词条', '副');
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <span class="entry-position ${type}">
                <span class="full-text">${title}</span>
                <span class="short-text">${shortTitle}</span>
            </span>
        </td>
        <td>
            <select id="${id}-attribute" class="table-select" onchange="handleAttributeChange('${id}')">
                ${Object.entries(attributeOptions).map(([value, text]) => 
                    `<option value="${value}">${text}</option>`
                ).join('')}
            </select>
        </td>
        <td>
            <input type="number" id="${id}-value" class="table-input" 
                   step="0.1" min="0" placeholder="输入数值" 
                   onchange="updateEntry('${id}')">
        </td>
        <td>
            <input type="number" id="${id}-weight" class="table-input weight-editable" 
                   step="0.1" min="0" placeholder="权重" value="0"
                   onchange="updateEntry('${id}')" 
                   title="一次性权重调整，不会保存">
        </td>
        <td>
            <span id="${id}-result" class="entry-score">0.00</span>
        </td>
    `;
    return row;
}

// 处理属性选择改变
function handleAttributeChange(entryId) {
    const attributeSelect = document.getElementById(`${entryId}-attribute`);
    const weightInput = document.getElementById(`${entryId}-weight`);
    
    const selectedAttribute = attributeSelect.value;
    
    if (!selectedAttribute) {
        // 如果没有选择属性，权重设置为0
        weightInput.value = 0;
    } else {
        // 优先使用当前模板的权重，如果没有则使用默认权重
        let templateWeight = getTemplateWeight(entryId, selectedAttribute);
        
        if (templateWeight !== null) {
            // 使用模板权重
            weightInput.value = templateWeight;
        } else if (currentCharacterTemplate && entryId.startsWith('sub-')) {
            // 如果当前有应用模板，且是副词条，但模板中没有该属性，则设置为0
            weightInput.value = 0;
        } else {
            // 没有应用模板时，使用默认权重
            const isMainAttribute = entryId.startsWith('main-');
            const weightType = isMainAttribute ? 'main' : 'sub';
            const defaultWeight = defaultWeights[weightType][selectedAttribute];
            
            if (defaultWeight !== undefined) {
                weightInput.value = defaultWeight;
            } else {
                weightInput.value = 0;
            }
        }
    }
    
    updateEntry(entryId);
}

// 获取当前模板中指定词条和属性的权重
function getTemplateWeight(entryId, attributeKey) {
    if (!currentCharacterTemplate) {
        return null;
    }
    
    // 将属性键转换为中文名称
    const chineseName = getChineseNameFromKey(attributeKey);
    if (!chineseName) {
        return null;
    }
    
    if (entryId.startsWith('main-')) {
        // 主词条 - 根据当前标签页确定槽位
        const slotNumber = currentTemplateTab === 'c4' ? '4' : 
                          currentTemplateTab === 'c3' ? '3' : '1';
        const mainProps = currentCharacterTemplate.main_props;
        
        if (mainProps && mainProps[slotNumber] && mainProps[slotNumber][chineseName] !== undefined) {
            return mainProps[slotNumber][chineseName];
        }
    } else {
        // 副词条
        const subProps = currentCharacterTemplate.sub_props;
        if (subProps && subProps[chineseName] !== undefined) {
            return subProps[chineseName];
        }
    }
    
    return null;
}

// 根据属性键获取中文名称
function getChineseNameFromKey(attributeKey) {
    // 反向映射表
    const reverseMapping = {
        'atk': '攻击',
        'atk_percent': '攻击%',
        'hp': '生命',
        'hp_percent': '生命%',
        'def': '防御',
        'def_percent': '防御%',
        'crit_rate': '暴击',
        'crit_damage': '暴击伤害',
        'resonance_efficiency': '共鸣效率',
        'element_damage': '属性伤害加成',
        'healing_bonus': '治疗效果加成',
        'skill_damage': '技能伤害加成',
        'basic_attack_damage': '普攻伤害加成',
        'heavy_attack_damage': '重击伤害加成',
        'resonance_skill_damage': '共鸣技能伤害加成',
        'resonance_liberation_damage': '共鸣解放伤害加成'
    };
    
    return reverseMapping[attributeKey] || null;
}

// 更新词条
function updateEntry(entryId) {
    const attributeSelect = document.getElementById(`${entryId}-attribute`);
    const valueInput = document.getElementById(`${entryId}-value`);
    const weightInput = document.getElementById(`${entryId}-weight`);
    const resultSpan = document.getElementById(`${entryId}-result`);

    const attribute = attributeSelect.value;
    const value = parseFloat(valueInput.value) || 0;
    const weight = parseFloat(weightInput.value) || 0;

    // 计算分数
    const score = calculateEntryScore(attribute, value, weight);
    resultSpan.textContent = score.toFixed(2);

    // 重新计算总分
    calculateTotal();
}

// 计算单个词条分数
function calculateEntryScore(attribute, value, weight) {
    // 如果没有选择属性或数值为0或负数，返回0
    if (!attribute || value <= 0) {
        return 0;
    }
    
    // 如果权重为0或负数，返回0
    if (weight <= 0) {
        return 0;
    }

    // 计算公式：(词条数值 × 当前词条权重 ÷ 声未对齐最高分) × 对齐分数
    return (value * weight / maxScore) * alignmentScore;
}

// 计算总分
function calculateTotal() {
    let total = 0;
    
    // 计算主词条分数
    for (let i = 1; i <= 2; i++) {
        const attribute = document.getElementById(`main-${i}-attribute`).value;
        const value = parseFloat(document.getElementById(`main-${i}-value`).value) || 0;
        const weight = parseFloat(document.getElementById(`main-${i}-weight`).value) || 0;
        total += calculateEntryScore(attribute, value, weight);
    }
    
    // 计算副词条分数
    for (let i = 1; i <= 5; i++) {
        const attribute = document.getElementById(`sub-${i}-attribute`).value;
        const value = parseFloat(document.getElementById(`sub-${i}-value`).value) || 0;
        const weight = parseFloat(document.getElementById(`sub-${i}-weight`).value) || 0;
        total += calculateEntryScore(attribute, value, weight);
    }

    document.getElementById('totalScore').textContent = total.toFixed(2);
}

// 初始化权重设置
// 更新全局设置
function updateMaxScore() {
    maxScore = parseFloat(document.getElementById('maxScoreMain').value) || 100;
    calculateTotal();
}

function updateAlignmentScore() {
    alignmentScore = parseFloat(document.getElementById('alignScoreMain').value) || 50;
    calculateTotal();
}

// 角色模板相关函数
async function initCharacterTemplates() {
    try {
        console.log('开始初始化角色模板...');
        
        // 确保DOM元素存在 - 桌面端
        const characterSelect = document.getElementById('characterSelect');
        const templateContent = document.getElementById('templateContent');
        const rightPanel = document.querySelector('.right-panel');
        const templateSection = document.querySelector('.template-section');
        
        // 移动端元素
        const mobileCharacterSelect = document.getElementById('mobileCharacterSelect');
        const mobileTemplateContent = document.getElementById('mobileTemplateContent');
        
        console.log('DOM元素检查:', {
            characterSelect: !!characterSelect,
            templateContent: !!templateContent,
            rightPanel: !!rightPanel,
            templateSection: !!templateSection,
            mobileCharacterSelect: !!mobileCharacterSelect,
            mobileTemplateContent: !!mobileTemplateContent
        });
        
        if (!characterSelect && !mobileCharacterSelect) {
            console.warn('角色选择元素未找到，跳过角色模板初始化');
            return;
        }
        
        // 确保移动端显示
        if (rightPanel) {
            rightPanel.style.display = 'block';
            rightPanel.style.visibility = 'visible';
            rightPanel.style.opacity = '1';
        }
        
        if (templateSection) {
            templateSection.style.display = 'block';
            templateSection.style.visibility = 'visible';
        }
        
        // 获取角色列表
        const characters = getCharacterList();
        populateCharacterSelect(characters);
        initTemplateEvents();
        
        // 设置默认选中的费位
        currentTemplateTab = 'c4';
        
        console.log('角色模板初始化成功，角色数量:', characters.length);
    } catch (error) {
        console.error('初始化角色模板失败:', error);
    }
}

function getCharacterList() {
    // 从配置文件中获取角色列表
    if (typeof CharacterConfig !== 'undefined' && CharacterConfig.getCharacterList) {
        return CharacterConfig.getCharacterList();
    }
    
    // 如果配置文件未加载，返回空数组并显示错误
    console.error('角色配置文件未加载，请检查 config.js 文件');
    return [];
}

function populateCharacterSelect(characters) {
    // 桌面端角色选择器
    const select = document.getElementById('characterSelect');
    if (select) {
        select.innerHTML = '<option value="">选择角色</option>';
        characters.forEach(character => {
            const option = document.createElement('option');
            option.value = character;
            option.textContent = character;
            select.appendChild(option);
        });
    }
    
    // 移动端角色选择器
    const mobileSelect = document.getElementById('mobileCharacterSelect');
    if (mobileSelect) {
        mobileSelect.innerHTML = '<option value="">选择角色</option>';
        characters.forEach(character => {
            const option = document.createElement('option');
            option.value = character;
            option.textContent = character;
            mobileSelect.appendChild(option);
        });
    }
}

function initTemplateEvents() {
    // 桌面端角色选择事件
    const characterSelect = document.getElementById('characterSelect');
    if (characterSelect) {
        characterSelect.addEventListener('change', onCharacterChange);
    }
    
    // 移动端角色选择事件
    const mobileCharacterSelect = document.getElementById('mobileCharacterSelect');
    if (mobileCharacterSelect) {
        mobileCharacterSelect.addEventListener('change', onMobileCharacterChange);
    }
    
    // 费位切换事件 (桌面端和移动端共用)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTemplateTab(tab);
        });
    });
    
    // 桌面端应用模板按钮
    const applyBtn = document.getElementById('applyTemplate');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyTemplate);
    }
    
    // 桌面端清除模板按钮
    const clearBtn = document.getElementById('clearTemplate');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearTemplate);
    }
    
    // 移动端应用模板按钮
    const mobileApplyBtn = document.getElementById('mobileApplyTemplate');
    if (mobileApplyBtn) {
        mobileApplyBtn.addEventListener('click', () => {
            applyTemplate();
            // 应用后关闭侧边栏
            const mobileSidebar = document.getElementById('mobileSidebar');
            const sidebarOverlay = document.getElementById('sidebarOverlay');
            if (mobileSidebar && sidebarOverlay) {
                mobileSidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // 移动端清除模板按钮
    const mobileClearBtn = document.getElementById('mobileClearTemplate');
    if (mobileClearBtn) {
        mobileClearBtn.addEventListener('click', clearTemplate);
    }
}

async function onCharacterChange() {
    const characterName = document.getElementById('characterSelect').value;
    await handleCharacterChange(characterName);
}

async function onMobileCharacterChange() {
    const characterName = document.getElementById('mobileCharacterSelect').value;
    // 同步桌面端选择器
    const desktopSelect = document.getElementById('characterSelect');
    if (desktopSelect) {
        desktopSelect.value = characterName;
    }
    await handleCharacterChange(characterName);
}

async function handleCharacterChange(characterName) {
    if (!characterName) {
        currentCharacterTemplate = null;
        updateTemplateDisplay();
        return;
    }
    
    try {
        const template = await loadCharacterTemplate(characterName);
        currentCharacterTemplate = template;
        updateTemplateDisplay();
    } catch (error) {
        console.error('加载角色模板失败:', error);
        alert('加载角色模板失败');
    }
}

async function loadCharacterTemplate(characterName) {
    try {
        // 对角色名进行URL编码，处理中文字符
        const encodedName = encodeURIComponent(characterName);
        const response = await fetch(`character/${encodedName}/calc.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const template = await response.json();
        return template;
    } catch (error) {
        console.error('加载角色模板失败:', error);
        throw error;
    }
}

function switchTemplateTab(tab) {
    currentTemplateTab = tab;
    
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // 更新模板显示
    updateTemplateDisplay();
}

function updateTemplateDisplay() {
    const container = document.getElementById('templateContent');
    const mobileContainer = document.getElementById('mobileTemplateContent');
    
    if (!container && !mobileContainer) {
        console.error('模板内容容器未找到');
        return;
    }
    
    let html = '';
    
    if (!currentCharacterTemplate || !currentTemplateTab) {
        html = '<p>请选择角色</p>';
    } else {
        // 将c4, c3, c1转换为4, 3, 1
        const tabMapping = { 'c4': '4', 'c3': '3', 'c1': '1' };
        const jsonKey = tabMapping[currentTemplateTab];
        
        const mainProps = currentCharacterTemplate.main_props[jsonKey];
        if (!mainProps) {
            html = '<p>该角色没有此费位配置</p>';
        } else {
            html = '<div class="template-props">';
            
            // 显示未对齐最高分
            if (currentCharacterTemplate.score_max) {
                const scoreIndex = { 'c1': 0, 'c3': 1, 'c4': 2 }[currentTemplateTab];
                const scoreMax = currentCharacterTemplate.score_max[scoreIndex];
                if (scoreMax) {
                    html += `
                        <div class="score-max-section">
                            <h4>未对齐最高分</h4>
                            <div class="score-max-value">${scoreMax}</div>
                        </div>
                    `;
                }
            }
            
            html += `<h4>${currentTemplateTab.toUpperCase()}费位主词条权重</h4>`;
            
            // 显示主词条权重
            Object.entries(mainProps).forEach(([prop, weight]) => {
                if (weight > 0) { // 只显示权重大于0的属性
                    html += `
                        <div class="prop-item">
                            <span class="prop-name">${prop}:</span>
                            <span class="prop-value">${weight}</span>
                        </div>
                    `;
                }
            });
            
            // 显示副词条权重
            if (currentCharacterTemplate.sub_props) {
                html += '<h4>副词条权重</h4>';
                Object.entries(currentCharacterTemplate.sub_props).forEach(([prop, weight]) => {
                    if (weight > 0) { // 只显示权重大于0的属性
                        html += `
                            <div class="prop-item">
                                <span class="prop-name">${prop}:</span>
                                <span class="prop-value">${weight}</span>
                            </div>
                        `;
                    }
                });
            }
            
            html += '</div>';
        }
    }
    
    // 更新桌面端显示
    if (container) {
        container.innerHTML = html;
    }
    
    // 更新移动端显示
    if (mobileContainer) {
        mobileContainer.innerHTML = html;
    }
}

function applyTemplate() {
    if (!currentCharacterTemplate || !currentTemplateTab) {
        alert('请先选择角色和费位');
        return;
    }
    
    // 将c4, c3, c1转换为4, 3, 1
    const tabMapping = { 'c4': '4', 'c3': '3', 'c1': '1' };
    const jsonKey = tabMapping[currentTemplateTab];
    
    const mainProps = currentCharacterTemplate.main_props[jsonKey];
    if (!mainProps) {
        alert('该角色没有此费位配置');
        return;
    }
    
    // 应用未对齐最高分
    if (currentCharacterTemplate.score_max) {
        const scoreIndex = { 'c1': 0, 'c3': 1, 'c4': 2 }[currentTemplateTab];
        const scoreMax = currentCharacterTemplate.score_max[scoreIndex];
        if (scoreMax) {
            maxScore = scoreMax;
            document.getElementById('maxScoreMain').value = scoreMax;
        }
    }
    
    // 只清空权重，保留属性选择和数值
    clearAttributesAndWeights();
    
    // 应用主词条权重（根据已有属性设置权重）
    for (let i = 1; i <= 2; i++) {
        const attributeSelect = document.getElementById(`main-${i}-attribute`);
        const weightInput = document.getElementById(`main-${i}-weight`);
        
        if (attributeSelect && weightInput && attributeSelect.value) {
            // 根据当前选择的属性查找模板中的权重
            const templateWeight = getTemplateWeightForAttribute(attributeSelect.value, 'main');
            if (templateWeight !== null) {
                weightInput.value = templateWeight.toString();
                console.log(`主词条${i}权重设置: ${attributeSelect.value} = ${templateWeight}`);
            }
            
            // 触发change事件以更新显示
            attributeSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // 应用副词条权重（根据已有属性设置权重）
    for (let i = 1; i <= 5; i++) {
        const attributeSelect = document.getElementById(`sub-${i}-attribute`);
        const weightInput = document.getElementById(`sub-${i}-weight`);
        
        if (attributeSelect && weightInput && attributeSelect.value) {
            // 根据当前选择的属性查找模板中的权重
            const templateWeight = getTemplateWeightForAttribute(attributeSelect.value, 'sub');
            if (templateWeight !== null) {
                weightInput.value = templateWeight.toString();
                console.log(`副词条${i}权重设置: ${attributeSelect.value} = ${templateWeight}`);
            }
            
            // 触发change事件以更新显示
            attributeSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // 重新计算总分
    calculateTotal();
    
    // 静默应用，不显示弹窗
    console.log('模板应用成功！已根据现有属性设置权重');
}

// 辅助函数：根据中文名称查找属性键
function findAttributeKey(chineseName, type) {
    let attributeTypes;
    if (type === 'main') {
        // 对于主词条，需要检查两个配置
        attributeTypes = { ...mainAttributeTypes1, ...mainAttributeTypes2 };
    } else {
        attributeTypes = subAttributeTypes;
    }
    
    // 完整的属性名称映射表
    const mapping = {
        // 基础属性
        '攻击': 'atk',
        '攻击%': 'atk_percent',
        '攻击百分比': 'atk_percent',
        '生命': 'hp',
        '生命%': 'hp_percent',
        '生命百分比': 'hp_percent',
        '防御': 'def',
        '防御%': 'def_percent',
        '防御百分比': 'def_percent',
        
        // 暴击相关
        '暴击': 'crit_rate',
        '暴击率': 'crit_rate',
        '暴击伤害': 'crit_damage',
        
        // 特殊属性
        '共鸣效率': 'resonance_efficiency',
        '属性伤害加成': 'element_damage',
        '治疗效果加成': 'healing_bonus',
        
        // 技能伤害
        '普攻伤害加成': 'basic_attack_damage',
        '重击伤害加成': 'heavy_attack_damage',
        '共鸣技能伤害加成': 'resonance_skill_damage',
        '共鸣解放伤害加成': 'resonance_liberation_damage'
    };
    
    // 首先尝试直接映射
    const mappedKey = mapping[chineseName];
    if (mappedKey && attributeTypes[mappedKey]) {
        return mappedKey;
    }
    
    // 如果直接映射失败，尝试反向查找
    for (const [key, value] of Object.entries(attributeTypes)) {
        if (value === chineseName) {
            return key;
        }
    }
    
    console.warn(`未找到属性映射: ${chineseName} (类型: ${type})`);
    return null;
}

function clearTemplate() {
    clearAllSelections();
    console.log('已清除所有选择');
}

function clearAttributesAndWeights() {
    // 只清空主词条和副词条的权重，保留属性选择和数值
    for (let i = 1; i <= 2; i++) {
        const weightInput = document.getElementById(`main-${i}-weight`);
        const resultSpan = document.getElementById(`main-${i}-result`);
        
        if (weightInput) weightInput.value = '';
        if (resultSpan) resultSpan.textContent = '0.00';
    }
    
    // 只清空副词条的权重，保留属性选择和数值
    for (let i = 1; i <= 5; i++) {
        const weightInput = document.getElementById(`sub-${i}-weight`);
        const resultSpan = document.getElementById(`sub-${i}-result`);
        
        if (weightInput) weightInput.value = '';
        if (resultSpan) resultSpan.textContent = '0.00';
    }
    
    calculateTotal();
}

function clearAllSelections() {
    // 清空主词条
    for (let i = 1; i <= 2; i++) {
        const attributeSelect = document.getElementById(`main-${i}-attribute`);
        const valueInput = document.getElementById(`main-${i}-value`);
        const weightInput = document.getElementById(`main-${i}-weight`);
        const resultSpan = document.getElementById(`main-${i}-result`);
        
        if (attributeSelect) attributeSelect.value = '';
        if (valueInput) valueInput.value = '';
        if (weightInput) weightInput.value = '';
        if (resultSpan) resultSpan.textContent = '0.00';
    }
    
    // 清空副词条
    for (let i = 1; i <= 5; i++) {
        const attributeSelect = document.getElementById(`sub-${i}-attribute`);
        const valueInput = document.getElementById(`sub-${i}-value`);
        const weightInput = document.getElementById(`sub-${i}-weight`);
        const resultSpan = document.getElementById(`sub-${i}-result`);
        
        if (attributeSelect) attributeSelect.value = '';
        if (valueInput) valueInput.value = '';
        if (weightInput) weightInput.value = '';
        if (resultSpan) resultSpan.textContent = '0.00';
    }
    
    calculateTotal();
}

// 初始化移动端侧边栏
function initMobileSidebar() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const templateEntryBtn = document.getElementById('templateEntryBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (!mobileSidebar || !sidebarCloseBtn || !sidebarOverlay) {
        console.log('移动端侧边栏元素未找到');
        return;
    }
    
    // 打开侧边栏
    function openSidebar() {
        mobileSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
    
    // 关闭侧边栏
    function closeSidebar() {
        mobileSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = ''; // 恢复滚动
    }
    
    // 事件监听
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openSidebar);
    }
    
    // 为角色模板入口按钮添加事件监听器
    if (templateEntryBtn) {
        templateEntryBtn.addEventListener('click', openSidebar);
    }
    
    sidebarCloseBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // ESC键关闭侧边栏
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileSidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
    
    console.log('移动端侧边栏初始化完成');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化应用...');
    
    // 初始化移动端侧边栏
    initMobileSidebar();
    
    // 检查关键DOM元素
    const rightPanel = document.querySelector('.right-panel');
    const templateSection = document.querySelector('.template-section');
    const characterSelect = document.getElementById('characterSelect');
    const templateContent = document.getElementById('templateContent');
    
    console.log('关键DOM元素检查:', {
        rightPanel: !!rightPanel,
        templateSection: !!templateSection,
        characterSelect: !!characterSelect,
        templateContent: !!templateContent
    });
    
    if (rightPanel) {
        console.log('右侧面板样式:', {
            display: getComputedStyle(rightPanel).display,
            visibility: getComputedStyle(rightPanel).visibility,
            opacity: getComputedStyle(rightPanel).opacity,
            width: getComputedStyle(rightPanel).width,
            height: getComputedStyle(rightPanel).height
        });
    }
    
    if (templateSection) {
        console.log('模板区域样式:', {
            display: getComputedStyle(templateSection).display,
            visibility: getComputedStyle(templateSection).visibility,
            height: getComputedStyle(templateSection).height
        });
    }
    
    // 强制确保移动端显示
    if (window.innerWidth <= 768) {
        console.log('检测到移动端设备，强制显示角色模板');
        if (rightPanel) {
            rightPanel.style.display = 'block';
            rightPanel.style.visibility = 'visible';
            rightPanel.style.opacity = '1';
            rightPanel.style.width = '100%';
        }
        if (templateSection) {
            templateSection.style.display = 'block';
            templateSection.style.visibility = 'visible';
            templateSection.style.minHeight = '200px';
        }
    }
    
    initApp();
    
    // 初始化OCR功能
    initOCR();
});

// OCR功能相关变量
let currentImageFile = null;
let ocrResults = [];

// 初始化OCR功能
function initOCR() {
    console.log('开始初始化OCR功能...');
    
    // 获取OCR相关DOM元素
    const ocrBtn = document.getElementById('ocrBtn');
    const ocrModal = document.getElementById('ocrModal');
    const closeOcrModal = document.getElementById('closeOcrModal');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const previewArea = document.getElementById('previewArea');
    const previewImg = document.getElementById('previewImg');
    const startOcrBtn = document.getElementById('startOcrBtn');
    const ocrLoading = document.getElementById('ocrLoading');
    const ocrResult = document.getElementById('ocrResult');
    const resultContent = document.getElementById('resultContent');
    const applyResultsBtn = document.getElementById('applyResultsBtn');
    
    if (!ocrBtn || !ocrModal) {
        console.log('OCR相关DOM元素未找到，跳过OCR功能初始化');
        return;
    }
    
    // 打开OCR弹窗
    ocrBtn.addEventListener('click', () => {
        ocrModal.style.display = 'flex';
        resetOCRModal();
    });
    
    // 关闭OCR弹窗
    closeOcrModal.addEventListener('click', () => {
        ocrModal.style.display = 'none';
        resetOCRModal();
    });
    
    // 点击弹窗背景关闭
    ocrModal.addEventListener('click', (e) => {
        if (e.target === ocrModal) {
            ocrModal.style.display = 'none';
            resetOCRModal();
        }
    });
    
    // 文件选择
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // 点击上传区域选择文件
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 开始OCR识别
    startOcrBtn.addEventListener('click', performOCR);
    
    // 应用识别结果
    applyResultsBtn.addEventListener('click', applyOCRResults);
    
    console.log('OCR功能初始化完成');
}

// 处理文件选择
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// 处理文件
function handleFile(file) {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
    }
    
    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
        alert('图片文件大小不能超过5MB');
        return;
    }
    
    currentImageFile = file;
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = document.getElementById('previewImg');
        const uploadArea = document.getElementById('uploadArea');
        const previewArea = document.getElementById('previewArea');
        
        previewImg.src = e.target.result;
        uploadArea.style.display = 'none';
        previewArea.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 执行OCR识别
async function performOCR() {
    if (!currentImageFile) {
        alert('请先选择图片');
        return;
    }
    
    const ocrLoading = document.getElementById('ocrLoading');
    const ocrResult = document.getElementById('ocrResult');
    const startOcrBtn = document.getElementById('startOcrBtn');
    
    try {
        // 显示加载状态
        ocrLoading.style.display = 'block';
        ocrResult.style.display = 'none';
        startOcrBtn.disabled = true;
        
        // 只使用百度OCR
        const results = await baiduOCR(currentImageFile);
        
        if (results && results.length > 0) {
            displayOCRResults(results);
            ocrResult.style.display = 'block';
        } else {
            alert('未识别到词条信息，请尝试其他图片');
        }
        
    } catch (error) {
        console.error('OCR识别失败:', error);
        alert('OCR识别失败: ' + error.message);
    } finally {
        ocrLoading.style.display = 'none';
        startOcrBtn.disabled = false;
    }
}

// 百度OCR识别
async function baiduOCR(imageFile) {
    try {
        console.log('开始百度OCR识别...');
        
        // 百度OCR已启用
        
        // 将图片转换为Base64
        const imageBase64 = await fileToBase64(imageFile);
        
        // 调用本地后端API
        const response = await fetch('/api/baidu-ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageBase64
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error_code) {
            throw new Error(`百度OCR API错误: ${data.error_msg}`);
        }
        
        if (!data.words_result || data.words_result.length === 0) {
            console.log('百度OCR未识别到文字内容');
            return [];
        }
        
        // 解析百度OCR结果
        return parseBaiduOCRResult(data);
        
    } catch (error) {
        console.error('百度OCR识别失败:', error);
        throw error;
    }
}



// 将文件转换为base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // 移除data:image/...;base64,前缀
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 解析百度OCR结果
function parseBaiduOCRResult(ocrData) {
    console.log('解析百度OCR结果:', ocrData);
    
    if (!ocrData.words_result || ocrData.words_result.length === 0) {
        return [];
    }
    
    const wordsResult = ocrData.words_result;
    const results = [];
    
    // 属性名称映射
    const attributeMap = {
        '生命': 'hp',
        '攻击': 'atk', 
        '防御': 'def',
        '暴击': 'crit_rate',
        '暴击伤害': 'crit_damage',
        '共鸣效率': 'resonance_efficiency',
        '普攻伤害加成': 'basic_attack_damage',
        '重击伤害加成': 'heavy_attack_damage',
        '共鸣技能伤害加成': 'resonance_skill_damage',
        '共鸣解放伤害加成': 'resonance_liberation_damage',
        '属性伤害加成': 'element_damage',
        '治疗效果加成': 'healing_bonus'
    };
    
    // 遍历识别结果，寻找属性和数值的配对
    for (let i = 0; i < wordsResult.length; i++) {
        const currentWord = wordsResult[i].words.trim();
        
        // 检查是否是属性名称
        if (attributeMap[currentWord]) {
            // 寻找后续的数值
            for (let j = i + 1; j < Math.min(i + 3, wordsResult.length); j++) {
                const nextWord = wordsResult[j].words.trim();
                
                // 匹配数值（可能包含%号）
                const valueMatch = nextWord.match(/^(\d+\.?\d*)%?$/);
                if (valueMatch) {
                    const value = parseFloat(valueMatch[1]);
                    const isPercent = nextWord.includes('%');
                    
                    if (!isNaN(value) && value > 0) {
                        // 智能确定属性类型（根据%号区分基础属性和百分比属性）
                        let attributeType = attributeMap[currentWord];
                        let displayName = currentWord;
                        
                        // 根据是否有%号来区分属性类型
                        if (currentWord === '攻击') {
                            if (isPercent) {
                                attributeType = 'atk_percent';
                                displayName = '攻击百分比';
                            } else {
                                attributeType = 'atk';
                                displayName = '攻击';
                            }
                        } else if (currentWord === '生命') {
                            if (isPercent) {
                                attributeType = 'hp_percent';
                                displayName = '生命百分比';
                            } else {
                                attributeType = 'hp';
                                displayName = '生命';
                            }
                        } else if (currentWord === '防御') {
                            if (isPercent) {
                                attributeType = 'def_percent';
                                displayName = '防御百分比';
                            } else {
                                attributeType = 'def';
                                displayName = '防御';
                            }
                        } else {
                            // 其他属性保持原有逻辑
                            displayName = currentWord;
                        }
                        
                        results.push({
                            attribute: displayName,
                            attributeKey: attributeType,
                            value: value.toString(),
                            confidence: 0.9
                        });
                        
                        console.log(`识别到词条: ${displayName} = ${value}${isPercent ? '%' : ''}`);
                        break;
                    }
                }
            }
        }
    }
    
    console.log('解析结果:', results);
    return results;
}

// 解析OCR文本结果
function parseOCRText(text) {
    const results = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // 词条属性匹配模式
    const patterns = [
        // 攻击相关
        { regex: /攻击\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '攻击百分比', isPercent: true },
        { regex: /攻击\s*[+]?\s*(\d+\.?\d*)/i, attribute: '攻击', isPercent: false },
        
        // 生命相关
        { regex: /生命\s*[+]?\s*(\d+\.?\d*)%/i, attribute: '生命百分比', isPercent: true },
        { regex: /生命\s*[+]?\s*(\d+\.?\d*)/i, attribute: '生命', isPercent: false },
        
        // 防御相关
        { regex: /防御\s*[+]?\s*(\d+\.?\d*)%/i, attribute: '防御百分比', isPercent: true },
        { regex: /防御\s*[+]?\s*(\d+\.?\d*)/i, attribute: '防御', isPercent: false },
        
        // 暴击相关
        { regex: /暴击率?\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '暴击', isPercent: true },
        { regex: /暴击伤害\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '暴击伤害', isPercent: true },
        
        // 特殊属性
        { regex: /共鸣效率\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '共鸣效率', isPercent: true },
        { regex: /属性伤害加成\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '属性伤害加成', isPercent: true },
        { regex: /治疗效果加成\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '治疗效果加成', isPercent: true },
        
        // 技能伤害
        { regex: /普攻伤害加成\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '普攻伤害加成', isPercent: true },
        { regex: /重击伤害加成\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '重击伤害加成', isPercent: true },
        { regex: /共鸣技能伤害加成\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '共鸣技能伤害加成', isPercent: true },
        { regex: /共鸣解放伤害加成\s*[+]?\s*(\d+\.?\d*)%?/i, attribute: '共鸣解放伤害加成', isPercent: true }
    ];
    
    // 遍历每一行文本
    for (const line of lines) {
        for (const pattern of patterns) {
            const match = line.match(pattern.regex);
            if (match) {
                const value = parseFloat(match[1]);
                if (!isNaN(value) && value > 0) {
                    results.push({
                        attribute: pattern.attribute,
                        value: value.toString(),
                        confidence: 0.8 // 默认置信度
                    });
                    break; // 找到匹配后跳出内层循环
                }
            }
        }
    }
    
    // 去重并按置信度排序
    const uniqueResults = [];
    const seen = new Set();
    
    for (const result of results) {
        const key = `${result.attribute}-${result.value}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueResults.push(result);
        }
    }
    
    return uniqueResults.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

// 显示OCR识别结果
function displayOCRResults(results) {
    ocrResults = results;
    const resultContent = document.getElementById('resultContent');
    resultContent.innerHTML = '';

    if (results.length === 0) {
        resultContent.innerHTML = '<p style="text-align: center; color: #718096;">未识别到词条信息</p>';
        return;
    }

    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // 根据置信度设置样式
        const confidence = result.confidence || 0;
        const confidenceClass = confidence >= 0.8 ? 'high-confidence' : 
                              confidence >= 0.6 ? 'medium-confidence' : 'low-confidence';
        
        resultItem.innerHTML = `
            <span class="result-label">${result.attribute}</span>
            <span class="result-value">${result.value}</span>
            <span class="result-confidence ${confidenceClass}" title="识别置信度 ${(confidence * 100).toFixed(1)}%">
                ${(confidence * 100).toFixed(1)}%
            </span>
        `;
        resultContent.appendChild(resultItem);
    });
}

// 应用OCR识别结果到表格
function applyOCRResults() {
    if (ocrResults.length === 0) {
        alert('没有识别结果可以应用');
        return;
    }

    let appliedCount = 0;
    
    // 按顺序定义词条位置：主词条1、主词条2、副词条1-5
    const orderedSlots = [
        { id: 'main-1', type: 'main' },
        { id: 'main-2', type: 'main' },
        { id: 'sub-1', type: 'sub' },
        { id: 'sub-2', type: 'sub' },
        { id: 'sub-3', type: 'sub' },
        { id: 'sub-4', type: 'sub' },
        { id: 'sub-5', type: 'sub' }
    ];

    // 按顺序应用OCR识别结果
    ocrResults.forEach((result, index) => {
        if (index >= orderedSlots.length) {
            console.warn(`OCR结果超出可用位置数量: ${result.attribute}`);
            return;
        }
        
        const slot = orderedSlots[index];
        const attributeKey = result.attributeKey || findAttributeKey(result.attribute, slot.type);
        
        if (attributeKey) {
            const attributeSelect = document.getElementById(`${slot.id}-attribute`);
            const valueInput = document.getElementById(`${slot.id}-value`);
            const weightInput = document.getElementById(`${slot.id}-weight`);
            
            if (attributeSelect && valueInput) {
                // 检查该属性是否在当前词条类型的选项中
                const option = attributeSelect.querySelector(`option[value="${attributeKey}"]`);
                if (option) {
                    // 设置属性和数值
                    attributeSelect.value = attributeKey;
                    valueInput.value = result.value;
                    
                    // 自动设置权重（如果当前有模板，使用模板权重；否则使用默认权重）
                    let weight = '';
                    if (currentCharacterTemplate) {
                        // 从当前模板中查找对应属性的权重
                        const templateWeight = getTemplateWeightForAttribute(attributeKey, slot.type);
                        if (templateWeight !== null) {
                            weight = templateWeight.toString();
                        }
                    }
                    
                    if (weightInput) {
                        weightInput.value = weight;
                    }
                    
                    // 触发属性改变事件以更新权重和显示
                    handleAttributeChange(slot.id);
                    updateEntry(slot.id);
                    
                    appliedCount++;
                    console.log(`应用词条到 ${slot.id}: ${result.attribute} = ${result.value}, 权重: ${weight}`);
                } else {
                    console.warn(`属性 ${result.attribute} (${attributeKey}) 不适用于 ${slot.type} 词条位置`);
                }
            }
        } else {
            console.warn(`无法映射属性: ${result.attribute}`);
        }
    });

    if (appliedCount > 0) {
        alert(`成功按顺序应用了 ${appliedCount} 个词条！`);
        calculateTotal();
        
        // 关闭OCR弹窗
        document.getElementById('ocrModal').style.display = 'none';
        resetOCRModal();
    } else {
        alert('没有找到合适的词条位置或属性映射！');
    }
}

// 从当前模板中获取指定属性的权重
function getTemplateWeightForAttribute(attributeKey, slotType) {
    if (!currentCharacterTemplate || !currentTemplateTab) {
        return null;
    }
    
    // 将c4, c3, c1转换为4, 3, 1
    const tabMapping = { 'c4': '4', 'c3': '3', 'c1': '1' };
    const jsonKey = tabMapping[currentTemplateTab];
    
    // 查找主词条权重
    if (slotType === 'main' && currentCharacterTemplate.main_props && currentCharacterTemplate.main_props[jsonKey]) {
        const mainProps = currentCharacterTemplate.main_props[jsonKey];
        
        // 根据attributeKey查找对应的中文名称
        const chineseName = getChineseNameForAttributeKey(attributeKey);
        if (chineseName && mainProps[chineseName] !== undefined) {
            return mainProps[chineseName];
        }
    }
    
    // 查找副词条权重
    if (slotType === 'sub' && currentCharacterTemplate.sub_props) {
        const subProps = currentCharacterTemplate.sub_props;
        
        // 根据attributeKey查找对应的中文名称
        const chineseName = getChineseNameForAttributeKey(attributeKey);
        if (chineseName && subProps[chineseName] !== undefined) {
            return subProps[chineseName];
        }
    }
    
    return null;
}

// 根据属性键获取中文名称
function getChineseNameForAttributeKey(attributeKey) {
    const keyToChineseMap = {
        'atk': '攻击',
        'atk_percent': '攻击%',
        'hp': '生命',
        'hp_percent': '生命%',
        'def': '防御',
        'def_percent': '防御%',
        'crit_rate': '暴击',
        'crit_damage': '暴击伤害',
        'resonance_efficiency': '共鸣效率',
        'basic_attack_damage': '普攻伤害加成',
        'heavy_attack_damage': '重击伤害加成',
        'resonance_skill_damage': '共鸣技能伤害加成',
        'resonance_liberation_damage': '共鸣解放伤害加成',
        'element_damage': '属性伤害加成',
        'healing_bonus': '治疗效果加成'
    };
    
    return keyToChineseMap[attributeKey] || null;
}

// 重置OCR弹窗状态
function resetOCRModal() {
    currentImageFile = null;
    ocrResults = [];
    
    const uploadArea = document.getElementById('uploadArea');
    const previewArea = document.getElementById('previewArea');
    const ocrLoading = document.getElementById('ocrLoading');
    const ocrResult = document.getElementById('ocrResult');
    const previewImg = document.getElementById('previewImg');
    const fileInput = document.getElementById('fileInput');
    const resultContent = document.getElementById('resultContent');
    
    if (uploadArea) uploadArea.style.display = 'block';
    if (previewArea) previewArea.style.display = 'none';
    if (ocrLoading) ocrLoading.style.display = 'none';
    if (ocrResult) ocrResult.style.display = 'none';
    
    if (previewImg) previewImg.src = '';
    if (fileInput) fileInput.value = '';
    if (resultContent) resultContent.innerHTML = '';
    if (uploadArea) uploadArea.classList.remove('dragover');
}
