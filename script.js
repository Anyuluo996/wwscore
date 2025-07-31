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
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <span class="entry-position ${type}">${title}</span>
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
    
    // 清空所有表格内容
    clearAllSelections();
    
    // 收集所有主词条并按类型分类（包括权重为0的）
    const mainPropsForSlot1 = []; // 主词条1的属性
    const mainPropsForSlot2 = []; // 主词条2的属性
    
    Object.entries(mainProps).forEach(([prop, weight]) => {
        // 处理所有权重的词条，包括权重为0的
        const attributeKey = findAttributeKey(prop, 'main');
        if (attributeKey) {
            // 检查属性属于哪个主词条类型
            if (mainAttributeTypes1[attributeKey]) {
                mainPropsForSlot1.push({ prop, weight, attributeKey });
            } else if (mainAttributeTypes2[attributeKey]) {
                mainPropsForSlot2.push({ prop, weight, attributeKey });
            } else {
                console.warn(`主词条属性不在任何类型中: ${prop} -> ${attributeKey}`);
            }
        } else {
            console.warn(`主词条属性映射失败: ${prop}`);
        }
    });
    
    // 应用主词条1权重（优先选择权重最高的，如果都是0则选择第一个）
    if (mainPropsForSlot1.length > 0) {
        const sortedProps = mainPropsForSlot1.sort((a, b) => b.weight - a.weight);
        const topProp = sortedProps[0];
        const attributeSelect = document.getElementById('main-1-attribute');
        const weightInput = document.getElementById('main-1-weight');
        
        if (attributeSelect && weightInput) {
            attributeSelect.value = topProp.attributeKey;
            weightInput.value = topProp.weight;
            
            // 触发change事件以更新显示
            attributeSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // 应用主词条2权重（优先选择权重最高的，如果都是0则选择第一个）
    if (mainPropsForSlot2.length > 0) {
        const sortedProps = mainPropsForSlot2.sort((a, b) => b.weight - a.weight);
        const topProp = sortedProps[0];
        const attributeSelect = document.getElementById('main-2-attribute');
        const weightInput = document.getElementById('main-2-weight');
        
        if (attributeSelect && weightInput) {
            attributeSelect.value = topProp.attributeKey;
            weightInput.value = topProp.weight;
            
            // 触发change事件以更新显示
            attributeSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // 收集所有副词条（包括权重为0的）
    const subPropsWithWeight = [];
    if (currentCharacterTemplate.sub_props) {
        Object.entries(currentCharacterTemplate.sub_props).forEach(([prop, weight]) => {
            // 处理所有权重的词条，包括权重为0的
            const attributeKey = findAttributeKey(prop, 'sub');
            if (attributeKey) {
                subPropsWithWeight.push({ prop, weight, attributeKey });
            } else {
                console.warn(`副词条属性映射失败: ${prop}`);
            }
        });
    }
    
    // 按权重排序副词条（权重高的优先，权重为0的排在后面）
    subPropsWithWeight.sort((a, b) => b.weight - a.weight);
    
    // 应用副词条权重到表格（最多5行）
    subPropsWithWeight.slice(0, 5).forEach((item, index) => {
        const subIndex = index + 1;
        const attributeSelect = document.getElementById(`sub-${subIndex}-attribute`);
        const weightInput = document.getElementById(`sub-${subIndex}-weight`);
        
        if (attributeSelect && weightInput) {
            attributeSelect.value = item.attributeKey;
            weightInput.value = item.weight;
            
            // 触发change事件以更新显示
            attributeSelect.dispatchEvent(new Event('change'));
        }
    });
    
    // 重新计算总分
    calculateTotal();
    
    // 静默应用，不显示弹窗
    const appliedMain = mainPropsForSlot1.length + mainPropsForSlot2.length;
    const appliedSub = subPropsWithWeight.length;
    console.log(`模板应用成功！主词条: ${appliedMain}个（主词条1: ${mainPropsForSlot1.length}个，主词条2: ${mainPropsForSlot2.length}个），副词条: ${appliedSub}个`);
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
});
