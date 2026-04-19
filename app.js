/**
 * 旅人の杖 Ver 2.0.23 (全国熱気レーダー対応版)
 * メインロジック（東海自然歩道・本線緑/支線青 完璧塗り分け版）
 * 
 * [修正箇所]
 * Fix①: kankoレイヤー定義をisCircle:true + circleColor指定に変更（Point対応）
 * Fix②: getFeatureName()にP12_001プロパティ名を追加
 * Fix③: pointToLayerでdef.circleColorを参照するよう変更
 */

const map = L.map('map', { center: [34.6937, 135.5023], zoom: 13, maxZoom: 19, zoomControl: false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
map.attributionControl.setPosition('bottomleft');

// ▼ Yahoo! APIのクレジット表記用テキスト
const yahooCredit = '<a href="https://developer.yahoo.co.jp/sitemap/">Web Services by Yahoo! JAPAN</a>';

const icons = {
    red: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    blue: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    green: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    purple: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    orange: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] })
};

// 名前取得の共通安全関数
// [Fix②] p.P12_001（国土数値情報P12の正式な観光資源名属性）を追加
function getFeatureName(p) {
    if (!p) return "名称未定";
    let name = p.name || p.名称 || p.屋号 || p.地区名 || p.観光資源名 || p.P12_001 || p.指定名称 || p.文化財名 || p.通称 || "名称未定";
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

// 🚨 ルート別の固定色設定
function getRouteStyle(feature) {
    const name = getFeatureName(feature.properties);
    if (name.includes("東海自然歩道本線以外")) return { color: "#0052cc", weight: 4, opacity: 0.8 }; // 🔵 支線
    if (name.includes("東海自然歩道")) return { color: "#27ae60", weight: 6, opacity: 0.9 }; // 🟢 本線
    
    const palettes = { "東海道": "#0052cc", "中山道": "#d91e18", "甲州街道": "#f39c12", "奥州街道": "#8e44ad", "日光街道": "#16a085" };
    for (let key in palettes) {
        if (name.includes(key)) return { color: palettes[key], weight: 5, opacity: 0.8 };
    }

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
    // [Fix①] isCircle:true と circleColor を追加。Pointジオメトリを正しくcircleMarkerで描画する
    kanko: { url: 'P12_観光資源_近畿.geojson', isCircle: true, circleColor: '#FF8C00', style: {color: '#FF8C00', weight: 2, fillOpacity: 0.3} },
    restaurants: { url: 'restaurant.geojson', icon: icons.orange },
    trail: { url: 'OSM_trail.geojson', icon: icons.purple },
    shizenhodo: { url: 'TokaiNatureTrail_Route.geojson', style: getRouteStyle },
    gokaido: { url: 'gokaido_routes.geojson', style: getRouteStyle },
    // ▼ 実験ライブマップ
    live_trend: { url: 'https://raw.githubusercontent.com/ResoSynQ/wayfarer-trend-engine/main/trend_spots.geojson', category: 'trend', color: '#ff4b00' },
    live_flower: { url: 'https://raw.githubusercontent.com/ResoSynQ/wayfarer-trend-engine/main/trend_spots.geojson', category: 'flower', color: '#ff69b4' },
    live_local: { url: 'https://raw.githubusercontent.com/ResoSynQ/wayfarer-trend-engine/main/trend_spots.geojson', category: 'local', color: '#32cd32' } 
};

const immediateLayers = ['keikan', 'tree', 'fudo', 'denken', 'fuchi', 'kanko', 'trail', 'shizenhodo', 'gokaido'];

const rawData = {};
const layers = {};
Object.keys(layerDefs).forEach(key => { layers[key] = L.layerGroup(); });

// [Fix④ 真の原因] 不正ジオメトリ修復関数
// P12等で geometry が {"type":"Point","coordinates":[...]} ではなく
// 生配列 [lng, lat] になっているfeatureをLeafletが読める形式に変換する
function repairGeoJson(data) {
    if (!data || !data.features) return data;
    return {
        ...data,
        features: data.features.map(ft => {
            const geom = ft.geometry;
            // [lng, lat] の生配列をPointジオメトリに正規化
            if (Array.isArray(geom) && geom.length === 2 &&
                typeof geom[0] === 'number' && typeof geom[1] === 'number') {
                return { ...ft, geometry: { type: 'Point', coordinates: geom } };
            }
            return ft;
        })
    };
}

function renderGeoJson(key, bounds = null) {
    layers[key].clearLayers();
    const def = layerDefs[key];
    L.geoJSON(repairGeoJson(rawData[key]), {
        filter: function(feature) {
            // ライブマップ用フィルタ
            if (key === 'live_trend' || key === 'live_flower' || key === 'live_local') {
                if (feature.properties.category !== def.category) return false;
            }
            if (bounds && feature.geometry && feature.geometry.type === "Point") {
                const latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                return bounds.contains(latlng);
            }
            return true;
        },
        pointToLayer: function(feature, latlng) {
            if (key === 'live_trend' || key === 'live_flower' || key === 'live_local') {
                return L.circleMarker(latlng, {
                    radius: 12,
                    color: '#ffffff',
                    weight: 2,
                    fillColor: def.color,
                    fillOpacity: 0.8
                }).bindPopup(`
                    <div style="text-align:center;">
                        <b style="color:${def.color}; font-size:1.1em;">【${feature.properties.category}】</b><br>
                        <span style="font-size:1.2em; font-weight:bold;">${feature.properties.trend_word}</span><br>
                        <span style="color:#666;">📍 ${feature.properties.name}</span>
                    </div>
                `);
            }

            // [Fix③] def.circleColorを参照することでkankoのオレンジ色を反映
            if(def.isCircle) return L.circleMarker(latlng, {
                radius: 6,
                fillColor: def.circleColor || 'red',
                color: '#fff',
                weight: 2,
                fillOpacity: 0.8
            });
            return L.marker(latlng, { icon: def.icon || new L.Icon.Default() });
        },
        style: def.style,
        onEachFeature: function(feature, layer) {
            // ライブマップは上でPopupを設定済みなのでスキップ
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
    "♟️ 道標": layers.rel, "🌳 公園・遊具": layers.park, "🏟️ 公共施設": layers.com, "📚 文化施設": layers.mus, "🏃‍♂️ 体育施設": layers.gym, "🏯 文化財": layers.cul, "🚾 トイレ": layers.wc,
    "🏞️ 景観地区": layers.keikan, "🌲 景観重要建造物樹木": layers.tree, "📜 歴史的風土保存区域": layers.fudo, "🏘️ 伝統的建造物群保存地区": layers.denken, "🗺️ 歴史的風致重点地区": layers.fuchi, "🎆 観光資源": layers.kanko, 
    "🍽️ 喫茶店・レストラン": layers.restaurants, "🐾 トレイル.古道": layers.trail, "🛤️ 東海自然歩道": layers.shizenhodo, "🛣️ 五街道": layers.gokaido,
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
    if (e.name.includes('トレンド') && rawData['live_trend']) renderGeoJson('live_trend');
    if (e.name.includes('開花') && rawData['live_flower']) renderGeoJson('live_flower');
    if (e.name.includes('ローカル') && rawData['live_local']) renderGeoJson('live_local');

    if (e.name.includes('トレンド') || e.name.includes('開花') || e.name.includes('ローカル')) {
        map.attributionControl.addAttribution(yahooCredit);
    }

    if (e.name.includes('喫茶店') && !restaurantWarningShown) { alert("飲食店データは最大で10mの誤差があることがあります。立ち寄る際は十分に確認してください。"); restaurantWarningShown = true; }
    if ((e.name.includes('トレイル') || e.name.includes('自然歩道') || e.name.includes('五街道')) && !advanceWarningShown) { alert("【上級者向け警告】\n難易度の高いルートが含まれます。事前に計画を立てましょう。"); advanceWarningShown = true; }
});

map.on('overlayremove', function(e) {
    if (e.name.includes('トレンド') || e.name.includes('開花') || e.name.includes('ローカル')) {
        let hasLiveLayer = false;
        if (layers['live_trend'] && map.hasLayer(layers['live_trend'])) hasLiveLayer = true;
        if (layers['live_flower'] && map.hasLayer(layers['live_flower'])) hasLiveLayer = true;
        if (layers['live_local'] && map.hasLayer(layers['live_local'])) hasLiveLayer = true;
        if (!hasLiveLayer) map.attributionControl.removeAttribution(yahooCredit);
    }
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

// ▼ リロードボタン（↻）を押した時の処理（スマート・リロード）
document.getElementById('reload-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('reload-btn');
    btn.innerText = "⏳";

    try {
        map.closePopup();
        const freshUrl = layerDefs.live_trend.url + '?t=' + new Date().getTime();
        const res = await fetch(freshUrl);
        if (res.ok) {
            const freshData = await res.json();
            rawData['live_trend'] = freshData;
            rawData['live_flower'] = freshData;
            rawData['live_local'] = freshData;

            if (map.hasLayer(layers['live_trend'])) renderGeoJson('live_trend');
            if (map.hasLayer(layers['live_flower'])) renderGeoJson('live_flower');
            if (map.hasLayer(layers['live_local'])) renderGeoJson('live_local');
        }
    } catch(e) {
        console.error("最新データの取得に失敗しました:", e);
    }

    setTimeout(() => { btn.innerText = "↻"; }, 500);
});
// ▼ マップDJ リクエスト機能（申請ピン）
let requestMarker = null;

document.getElementById('request-btn')?.addEventListener('click', () => {
    if (requestMarker) map.removeLayer(requestMarker);

    const center = map.getCenter();
    requestMarker = L.marker(center, {
        draggable: true,
        icon: icons.red
    }).addTo(map);

    const popupContent = `
        <div style="text-align:center; min-width:180px;">
            <b style="font-size:1.1em; color:#d35400;">この地点を申請しますか？</b><br>
            <span style="font-size:0.8em; color:#666;">※ピンをドラッグして微調整できます</span><br><br>
            <button id="confirm-request-btn" style="padding:8px 15px; background:#e67e22; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; width:100%;">✉️ この地点を申請</button>
        </div>
    `;

    requestMarker.bindPopup(popupContent).openPopup();

    requestMarker.on('popupclose', () => {
        if (requestMarker) {
            map.removeLayer(requestMarker);
            requestMarker = null;
        }
    });
});

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'confirm-request-btn') {
        if (!requestMarker) return;

        const latlng = requestMarker.getLatLng();
        const lat = latlng.lat.toFixed(6);
        const lng = latlng.lng.toFixed(6);

        // ★相棒のサポート用メールアドレスに変更してくれ！
        const supportEmail = "your-support-email@example.com"; 

        const subject = encodeURIComponent("【マップDJ】新規スポット追加申請");

        const body = encodeURIComponent(
`マップDJへ！新しい熱気スポットの申請だ！

【スポット名】
（ここに名称を入力してください）

【おすすめの理由・説明】
（ここにおすすめの理由を入力してください）

-------------------------
【位置情報（自動取得）】
緯度: ${lat}
経度: ${lng}
Googleマップで確認:
https://www.google.com/maps?q=$${lat},${lng}
-------------------------`
        );

        window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

        map.closePopup();
        map.removeLayer(requestMarker);
        requestMarker = null;
    }
});
