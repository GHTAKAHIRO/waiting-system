// Airtable設定ファイル
const AIRTABLE_CONFIG = {
    // ベースID
    baseId: 'appPdBa4WqpdfeSb2',
    
    // APIキー
    apiKey: 'patcTvuHjHRGoKYCD.8088a02330183c0ca091c12477eeec2f0b9fba61dbc9fde350679a98f7b3ab2b'
};

// 設定の検証
function validateAirtableConfig() {
    if (AIRTABLE_CONFIG.baseId === 'YOUR_BASE_ID_HERE') {
        console.warn('⚠️ Airtable Base IDが設定されていません');
        return false;
    }
    
    if (AIRTABLE_CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('⚠️ Airtable API Keyが設定されていません');
        return false;
    }
    
    console.log('✅ Airtable設定が完了しました');
    return true;
}

// 設定をエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIRTABLE_CONFIG, validateAirtableConfig };
} else {
    window.AIRTABLE_CONFIG = AIRTABLE_CONFIG;
    window.validateAirtableConfig = validateAirtableConfig;
}