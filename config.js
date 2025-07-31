// 鸣潮词条分数计算器 - 配置文件
// 角色列表配置

/**
 * 支持的角色列表
 * 注意：添加新角色时需要确保在 character/ 目录下有对应的文件夹和 calc.json 文件
 */
const CHARACTERS = [
    // 主要角色（按拼音排序）
    '安可', '白芷', '布兰特', '长离', '炽霞', '椿', 
    '弗洛洛', '忌炎', '今汐', '卡卡罗', '卡提希娅', '坎特蕾拉', 
    '珂莱塔', '灯灯', '露帕', '洛可可', '桃祈', '维里奈', 
    '相里要', '夏空', '秧秧', '吟霖', '渊武', '赞妮', 
    '折枝', '鉴心', '散华', '釉瑚', '莫特斐',
    '漂泊者·气动', '漂泊者·湮灭', '漂泊者·衍射',
    '丹瑾', '凌阳', '守岸人', '秋水', '菲比',
    
    // 测试角色（开发用）
    '测试'
];

/**
 * 获取角色列表
 * @returns {string[]} 角色名称数组
 */
function getCharacterList() {
    return [...CHARACTERS]; // 返回副本，避免外部修改
}

/**
 * 检查角色是否存在
 * @param {string} characterName 角色名称
 * @returns {boolean} 是否存在
 */
function isValidCharacter(characterName) {
    return CHARACTERS.includes(characterName);
}

/**
 * 获取角色数量
 * @returns {number} 角色总数
 */
function getCharacterCount() {
    return CHARACTERS.length;
}

// 导出配置（兼容不同的模块系统）
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 环境
    module.exports = {
        CHARACTERS,
        getCharacterList,
        isValidCharacter,
        getCharacterCount
    };
} else if (typeof window !== 'undefined') {
    // 浏览器环境
    window.CharacterConfig = {
        CHARACTERS,
        getCharacterList,
        isValidCharacter,
        getCharacterCount
    };
}