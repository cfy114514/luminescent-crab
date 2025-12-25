
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../src/services/core/prompts/tree');
const DATA_FILE = path.resolve(__dirname, '../tree_data.js');

// ... (previous code)


const DICT = {
    // Keys (English Regex Keywords) -> Value (Chinese)
    "Physics Lock": "物理定律锁",
    "Geometry": "几何结构",
    "Orientation": "3D方向",
    "Frozen": "冻结",
    "No Straightening": "禁止自动矫正",
    "Zero Rotation": "零旋转",
    "Studio Light": "影棚光",
    "Contact Shadow": "接触阴影",
    "Symmetry": "对称性",
    "Full Width": "完整宽度",
    "Dimensionality": "立体感",
    "Closure Focus": "扣件聚焦",
    "Bird's Eye": "上帝视角",
    "Macro": "微距",
    "Texture": "纹理",
    "Sweatband": "汗带",
    "Anchor": "锚点",
    "Pitch Sync": "俯仰角同步",
    "Direct Gaze": "直视镜头",
    "Square Shoulders": "正向站位",
    "Silhouette": "剪影",
    "No Eye Contact": "无眼神接触",
    "No Face": "不露脸",
    "Oblique": "斜侧",
    "Pose": "姿势",
    "Casual": "休闲",
    "Fashion": "时尚",
    "Lifestyle": "生活方式",
    "Candid": "抓拍",
    "Motion": "动态",
    "Zero Roll": "零滚转",
    "Buckram": "帽撑",
    "Fabric": "面料",
    "1cm": "1厘米深度",
    "Hat is a fixed": "帽子是固定",
    "Half-Body": "半身",
    "View specific": "视角专属",
    "Front": "正面",
    "Back": "背面",
    "Side": "侧面",
    "Top": "顶部",
    "Detail": "细节"
};

function translate(text) {
    let res = text;
    for (const [key, val] of Object.entries(DICT)) {
        if (text.toLowerCase().includes(key.toLowerCase())) {
            if (/[\u4e00-\u9fa5]/.test(text)) return text;
            return `${val} (${text.replace(/\*\*/g, '').trim()})`;
        }
    }
    return text.replace(/\*\*/g, '').trim();
}

function extractData(filePath) {
    if (!fs.existsSync(filePath)) return { summary: ["File not found"], full: "" };
    const content = fs.readFileSync(filePath, 'utf-8');

    // --- SUMMARY EXTRACTION ---
    const lines = content.split('\n');
    let points = [];
    lines.forEach(line => {
        const trimmed = line.trim();
        if ((trimmed.startsWith('1.') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) && trimmed.length > 5) {
            let clean = trimmed.replace(/^[0-9]+\.\s*/, '').replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
            if (clean.length > 40) clean = clean.substring(0, 38) + '...';
            points.push(translate(clean));
        }
    });

    return {
        summary: points.slice(0, 3),
        full: content
    };
}

function buildNode(name, type, relativeFilePath, customDetails = null) {
    const fullPath = path.join(ROOT_DIR, relativeFilePath);
    if (!fs.existsSync(fullPath) && !customDetails) {
        // Handle directory logic or virtual nodes if needed, but for now specific files
    }

    let extraction = { summary: [], full: "" };
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        extraction = extractData(fullPath);
    }

    const details = customDetails || extraction.summary;

    return {
        name,
        type,
        file: relativeFilePath.replace(/\/$/, ''), // Remove trailing slash for display
        details: details,
        fullContent: extraction.full
    };
}

function generateTree() {
    // --- BUILD DATA STRUCTURE ---
    const treeData = {
        ...buildNode("根基宪法 (ROOT)", "root", "00_root_integrity.js"),
        children: [
            {
                name: "静物系统 (PRODUCT)",
                type: "branch-p",
                file: "10_product",
                details: ["纯静物 (Still Life)", "无人类 (No Human)"],
                children: [
                    {
                        name: "通用逻辑 (Common)",
                        type: "common",
                        file: "10_product/geometry.js",
                        // Overriding details extraction logic slightly for Common nodes if we want merged files
                        ...buildNode("通用逻辑 (Common)", "common", "10_product/geometry.js"),
                        children: [
                            buildNode("正面 (Front)", "leaf-p", "10_product/leaves/front.js"),
                            buildNode("侧角 (Angle)", "leaf-p", "10_product/leaves/angle.js"),
                            buildNode("背面 (Back)", "leaf-p", "10_product/leaves/back.js"),
                            buildNode("顶部 (Top)", "leaf-p", "10_product/leaves/top.js"),
                            buildNode("细节 (Detail)", "leaf-p", "10_product/leaves/detail.js"),
                            buildNode("内衬 (Inside)", "leaf-p", "10_product/leaves/inside.js")
                        ]
                    }
                ]
            },
            {
                name: "模特系统 (MODEL)",
                type: "branch-m",
                file: "11_model",
                details: ["人类宿主 (Human Host)", "帽子锚点 (Hat Anchor)"],
                children: [
                    {
                        name: "通用逻辑 (Common)",
                        type: "common",
                        file: "11_model/0_geometry_locks.js",
                        ...buildNode("通用逻辑 (Common)", "common", "11_model/0_geometry_locks.js"),
                        children: [
                            buildNode("正面 (Front)", "leaf-m", "11_model/leaves/front.js"),
                            buildNode("侧面 (Side)", "leaf-m", "11_model/leaves/side.js"),
                            buildNode("背面 (Back)", "leaf-m", "11_model/leaves/back.js"),
                            buildNode("背侧 (Back Angle)", "leaf-m", "11_model/leaves/back_angle.js"),
                            buildNode("Pose A (Casual)", "leaf-m", "11_model/leaves/pose1.js"),
                            buildNode("Pose B (Fashion)", "leaf-m", "11_model/leaves/pose2.js"),
                            buildNode("Pose C (Lifestyle)", "leaf-m", "11_model/leaves/pose3.js")
                        ]
                    }
                ]
            }
        ]
    };

    // --- WRITE TO EXTERNAL DATA FILE ---
    try {
        const treeDataJson = JSON.stringify(treeData, null, 4);
        const fileContent = `// Auto-generated by scripts/sync_viz.js\nconst data = ${treeDataJson};\n`;
        fs.writeFileSync(DATA_FILE, fileContent, 'utf-8');
        console.log(`[${new Date().toLocaleTimeString()}] Tree data synced to tree_data.js`);
    } catch (e) {
        console.error("Error updating JS data file:", e);
    }
}

// --- MAIN EXECUTION ---
const args = process.argv.slice(2);

if (args.includes('--watch')) {
    console.log("Starting Watch Mode...");
    console.log("Watching directory:", ROOT_DIR);
    generateTree(); // Initial run

    let debounceTimer;
    fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
        if (filename && (filename.endsWith('.js') || filename.endsWith('.json'))) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log(`File changed: ${filename}. Regenerating...`);
                generateTree();
            }, 100);
        }
    });
} else {
    generateTree();
}
