/**
 * 旅人の杖と救いの泉 Ver 2.0.22
 * メインロジック（東海自然歩道・本線緑/支線青 完璧塗り分け版）
 */

const map = L.map('map', { center: [34.6937, 135.5023], zoom: 13, maxZoom: 19, zoomControl: false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
map.attributionControl.setPosition('bottomleft');

const icons = {
    red: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    blue: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    green: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    purple: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    orange: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] })
};

// 名前取得の共通安全関数
function getFeatureName(p) {
    if (!p) return "名称未定";
    let name = p.name || p.名称 || p.屋号 || p.地区名 || p.観光資源名 || p.指定名称 || p.文化財名 || p.通称 || "名称未定";
    if (String(name) === "0" || name === "" || name === null) name = "名称未定";
    if (name === "名称未定") {
        for (let propKey in p) {
            if (propKey.includes("名") && !propKey.includes("都道府県") && !propKey.includes("市区町村")) {
                name = p[propKey];
                break;
            }
        }
    }
    return name;
}

// 🚨 ルート別の固定色設定（東海自然歩道の塗り分けを最優先！）
function getRouteStyle(feature) {
    const name = getFeatureName(feature.properties);
    
    // 1. 東海自然歩道の判定（本線以外を先に判定するのがコツだぜ！）
    if (name.includes("東海自然歩道本線以外")) {
        return { color: "#0052cc", weight: 4, opacity: 0.8 }; // 🔵 支線は「青」
    }
    if (name.includes("東海自然歩道")) {
        return { color: "#27ae60", weight: 6, opacity: 0.9 }; // 🟢 本線は「太い緑」
    }
    
    // 2. 五街道の判定
    const palettes = {
        "東海道": "#0052cc",     // 青
        "中山道": "#d91e18",     // 赤
        "甲州街道": "#f39c12",   // オレンジ
        "奥州街道": "#8e44ad",   // 紫
        "日光街道": "#16a085"    // ターコイズ
    };
    for (let key in palettes) {
        if (name.includes(key)) return { color: palettes[key], weight: 5, opacity: 0.8 };
    }

    // 3. その他（自動生成色）
    const fallbackColors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    let color = fallbackColors[Math.abs(hash) % fallbackColors.length];
    return { color: color, weight: 4, opacity: 0.8 };
}

const layerDefs = {

    rel: { url: 'rel.geojson', icon: icons.blue },
    park: { url: 'park.geojson', icon: icons.blue },
    com: { url: 'com.geojson', icon: icons.green },
    mus: { url: 'mus.geojson', icon: icons.green },
    gym: { url: 'gym.geojson', icon: icons.green },
    cul: { url: 'cul.geojson', icon: icons.green },
    wc: { url: 'wc.geojson', isCircle: true },
    keikan: { url: 'A35b_景観地区_近畿.geojson', style: {color: '#1E90FF', weight: 2, fillOpacity: 0.3} },
    tree: { url: 'A35c_景観重要建造物樹木_近畿.geojson', style: {color: '#32CD32', weight: 2, fillOpacity: 0.3} },
    fudo: { url: 'A42_歴史的風土保存区域_近畿.geojson', style: {color: '#8B4513', weight: 2, fillOpacity: 0.3} },
    denken: { url: 'A43_伝統的建造物群保存地区_近畿.geojson', style: {color: '#800080', weight: 2, fillOpacity: 0.3} },
    fuchi: { url: 'A44_歴史的風致重点地区_近畿.geojson', style: {color: '#FFD700', weight: 2, fillOpacity: 0.3} },
    kanko: { url: 'P12_観光資源_近畿.geojson', style: {color: '#FF8C00', weight: 2, fillOpacity: 0.3} },
    restaurants: { url: 'restaurant.geojson', icon: icons.orange },
    trail: { url: 'OSM_trail.geojson', icon: icons.purple },
　　shizenhodo: { url: 'TokaiNatureTrail_Route.geojson', style: getRouteStyle },
    gokaido: { url: 'gokaido_routes.geojson', style: getRouteStyle }, // 👈 このカンマを絶対に追加！

    // ▼ 実験ライブマップ（1つのファイルからカテゴリ別に抽出して50m円を描く）
    live_trend: { url: 'https://raw.githubusercontent.com/ResoSynQ/wayfarer-trend-engine/main/trend_spots.geojson', category: 'trend', color: '#ff4b00' }, // オレンジ赤
    live_flower: { url: 'https://raw.githubusercontent.com/ResoSynQ/wayfarer-trend-engine/main/trend_spots.geojson', category: 'flower', color: '#ff69b4' }, // ピンク
    live_local: { url: 'https://raw.githubusercontent.com/ResoSynQ/wayfarer-trend-engine/main/trend_spots.geojson', category: 'local', color: '#32cd32' }  // ライムグリーン
}; // 👈 最後にフタを閉める

const immediateLayers = ['keikan', 'tree', 'fudo', 'denken', 'fuchi', 'kanko', 'trail', 'shizenhodo', 'gokaido'];

const rawData = {};
const layers = {};
Object.keys(layerDefs).forEach(key => { layers[key] = L.layerGroup(); });

function renderGeoJson(key, bounds = null) {
    layers[key].clearLayers();
    const def = layerDefs[key];
    L.geoJSON(rawData[key], {
filter: function(feature) {
            // ▼ 実験ライブマップ用：自分のカテゴリ以外のデータは無視する
            if (key === 'live_trend' || key === 'live_flower' || key === 'live_local') {
                if (feature.properties.category !== def.category) {
                    return false; // カテゴリが違えば表示しない
                }
            }
            // ... (これ以降は元々あった if (bounds && ...) などの処理をそのまま残す) ...
            if (bounds && feature.geometry && feature.geometry.type === "Point") {
                const latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                return bounds.contains(latlng);
            }
            return true;
        },
pointToLayer: function(feature, latlng) {
            // ▼ ここから追加：実験ライブマップ用（50mのホットサークルを描く！）
            if (key === 'live_trend' || key === 'live_flower' || key === 'live_local') {
                return L.circle(latlng, {
                    color: def.color,
                    fillColor: def.color,
                    fillOpacity: 0.5,
                    radius: 50,  // 50メートル
                    weight: 2
                }).bindPopup(`
                    <div style="text-align:center;">
                        <b style="color:${def.color}; font-size:1.1em;">【${feature.properties.category}】</b><br>
                        <span style="font-size:1.2em; font-weight:bold;">${feature.properties.trend_word}</span><br>
                        <span style="color:#666;">📍 ${feature.properties.name}</span>
                    </div>
                `);
            }
            // ▲ ここまで追加
    
if(def.isCircle) return L.circleMarker(latlng, { radius: 6, fillColor: 'red', color: '#fff', weight: 2, fillOpacity: 0.8 });
            return L.marker(latlng, { icon: def.icon || new L.Icon.Default() });
        },
        style: def.style,
        onEachFeature: function(feature, layer) {
            // ▼ この1行を絶対に追加！（ライブマップのカッコいい吹き出しを守る盾）
            if (key === 'live_trend' || key === 'live_flower' || key === 'live_local') return;

            const name = getFeatureName(feature.properties);
            layer.bindPopup(`<strong>${name}</strong>`);
        }
    }).addTo(layers[key]);
}

async function fetchAllData() {
    for (const [key, def] of Object.entries(layerDefs)) {
        try {
            const res = await fetch(def.url);
            if(res.ok) {
                rawData[key] = await res.json();
                if (immediateLayers.includes(key)) renderGeoJson(key);
            }
        } catch (e) { console.error(`Failed to load ${key}:`, e); }
    }
}
fetchAllData();

const overlayMaps = {
    "♟️ 道標": layers.rel, "🌳 公園・遊具": layers.park, "🏟️ 公共施設": layers.com, "📚 文化施設": layers.mus, "🏃‍♂️ 体育施設": layers.gym, "🏯 文化財": layers.cul, "🚾 トイレ (赤丸)": layers.wc,
    "🏞️ 景観地区": layers.keikan, "🌲 景観重要建造物樹木": layers.tree, "📜 歴史的風土保存区域": layers.fudo, "🏘️ 伝統的建造物群保存地区": layers.denken, "🗺️ 歴史的風致重点地区": layers.fuchi, "🎆 観光資源": layers.kanko, 
    "🍽️ 喫茶店・レストラン": layers.restaurants, "🐾 トレイル.古道": layers.trail, "🛤️ 東海自然歩道": layers.shizenhodo, "🛣️ 五街道": layers.gokaido,
    // ▼ ここに「実験ライブマップ」の3つを追加！ ▼
    "🌍 トレンド": layers.live_trend,
    "🌸 開花": layers.live_flower,
    "😊 ローカルニュース": layers.live_local
};

layers.rel.addTo(map); layers.park.addTo(map); layers.com.addTo(map);
layers.mus.addTo(map); layers.gym.addTo(map); layers.cul.addTo(map);

L.control.layers({}, overlayMaps, {collapsed: false, position: 'topleft'}).addTo(map);

function insertCategoryHeaders() {
    document.querySelectorAll('.custom-layer-header').forEach(el => el.remove());
    document.querySelectorAll('.leaflet-control-layers-overlays label').forEach(label => {
        const text = label.textContent.trim();
        let headerHtml = "";
        if (text.includes("道標")) headerHtml = "<div class='custom-layer-header' style='margin:18px 0 10px 0;'><hr style='margin:0 0 12px 0; border:0; border-top:1px solid #ddd;'><div style='font-size:1.05em; font-weight:bold; color:#1565C0;'>【基本探索】</div></div>";
        else if (text.includes("景観地区")) headerHtml = "<div class='custom-layer-header' style='margin:18px 0 10px 0;'><hr style='margin:0 0 12px 0; border:0; border-top:1px solid #ddd;'><div style='font-size:1.05em; font-weight:bold; color:#E65100;'>【広域地域データ】</div></div>";
        else if (text.includes("喫茶店")) headerHtml = "<div class='custom-layer-header' style='margin:18px 0 10px 0;'><hr style='margin:0 0 12px 0; border:0; border-top:1px solid #ddd;'><div style='font-size:1.05em; font-weight:bold; color:#2E7D32;'>【上級者向け】</div></div>";
        // ▼ メニューの最後に【実験機能】のヘッダーを追加 ▼
        else if (text.includes("トレンド")) headerHtml = "<div class='custom-layer-header' style='margin:18px 0 10px 0;'><hr style='margin:0 0 12px 0; border:0; border-top:1px solid #ddd;'><div style='font-size:1.05em; font-weight:bold; color:#8e44ad;'>【実験機能】</div></div>";
        
        if (headerHtml) label.insertAdjacentHTML('beforebegin', headerHtml);
    });
}
insertCategoryHeaders();
map.on('layeradd layerremove', () => setTimeout(insertCategoryHeaders, 10));

const SCAN_ZOOM = 15;
const scanBtn = document.getElementById('scan-btn');
function updateScanBtn() {
    if(!scanBtn) return;
    if (map.getZoom() >= SCAN_ZOOM) { scanBtn.classList.remove('disabled'); scanBtn.disabled = false; scanBtn.innerText = "📡 周囲をスキャン"; }
    else { scanBtn.classList.add('disabled'); scanBtn.disabled = true; scanBtn.innerText = "もっと近づいてスキャン"; }
}
map.on('zoomend', updateScanBtn);
updateScanBtn();

scanBtn?.addEventListener('click', () => {
    if (map.getZoom() < SCAN_ZOOM) return;
    scanBtn.innerText = "🔄 スキャン中...";
    scanBtn.classList.add('disabled');
    const bounds = map.getBounds();
    setTimeout(() => {
        Object.keys(layerDefs).forEach(key => { if (!immediateLayers.includes(key) && map.hasLayer(layers[key]) && rawData[key]) renderGeoJson(key, bounds); });
        scanBtn.innerText = "📡 周囲をスキャン"; scanBtn.classList.remove('disabled');
    }, 600);
});

let restaurantWarningShown = false, advanceWarningShown = false;
map.on('overlayadd', function(e) {
    // ▼ メニューのチェックを入れた瞬間にデータを地図に描画する仕掛け ▼
    if (e.name.includes('トレンド') && rawData['live_trend']) renderGeoJson('live_trend');
    if (e.name.includes('開花') && rawData['live_flower']) renderGeoJson('live_flower');
    if (e.name.includes('ローカル') && rawData['live_local']) renderGeoJson('live_local');

    if (e.name.includes('喫茶店') && !restaurantWarningShown) { alert("飲食店データは最大で10mの誤差があることがあります。立ち寄る際は十分に確認してください。"); restaurantWarningShown = true; }
    if ((e.name.includes('トレイル') || e.name.includes('自然歩道') || e.name.includes('五街道')) && !advanceWarningShown) { alert("【上級者向け警告】\n難易度の高いルートが含まれます。事前に計画を立てましょう。"); advanceWarningShown = true; }
});

document.getElementById('menu-btn')?.addEventListener('click', (e) => { e.stopPropagation(); document.body.classList.toggle('menu-open'); });
document.getElementById('help-btn')?.addEventListener('click', () => { window.location.href = "help.html"; });
document.getElementById('license-btn')?.addEventListener('click', () => { window.location.href = "license.html"; });
document.getElementById('location-btn')?.addEventListener('click', () => { map.locate({setView: true, maxZoom: 16}); });

function hideLoadingScreen() {
    const s = document.getElementById('loading-screen');
    if(s && s.style.display !== 'none') { s.style.opacity = '0'; setTimeout(() => s.style.display = 'none', 800); }
}
window.addEventListener('load', () => setTimeout(hideLoadingScreen, 1500));
setTimeout(hideLoadingScreen, 4000);

map.on('locationfound', (e) => { L.circleMarker(e.latlng, {radius: 8, fillColor: '#007BFF', color: '#fff', weight: 2, fillOpacity: 1}).addTo(map).bindPopup("現在地").openPopup(); });
map.on('locationerror', () => { alert("現在地を取得できませんでした。端末の位置情報設定を確認してください。"); });
// ▼ 追加：実験ライブマップのチェックボックス用ON/OFF機能 ▼
window.toggleLayer = function(key) {
    if (map.hasLayer(layers[key])) {
        map.removeLayer(layers[key]); // チェックが外れたら消す
    } else {
        map.addLayer(layers[key]);    // チェックが入ったら表示する
        // 今見ている画面の範囲内だけを計算して描画（重くならないための工夫！）
        renderGeoJson(key, map.getBounds()); 
    }
};
// ▲ ここまで ▲
