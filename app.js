/**
 * 旅人の杖 Ver 3.5 (ミャクミャク完全召喚・爆速WebP対応版)
 */

const map = L.map('map', { center: [34.6937, 135.5023], zoom: 13, maxZoom: 19, zoomControl: false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
map.attributionControl.setPosition('bottomleft');

const zoomDebug = document.createElement('div');
zoomDebug.id = 'zoom-debug';
zoomDebug.setAttribute('aria-live', 'polite');
document.body.appendChild(zoomDebug);

function updateZoomDebug() {
    zoomDebug.textContent = `Zoom: ${map.getZoom()}`;
}
map.on('zoomend', updateZoomDebug);
updateZoomDebug();

// ▼ Yahoo! APIのクレジット表記用テキスト
const yahooCredit = '<a href="https://developer.yahoo.co.jp/sitemap/">Web Services by Yahoo! JAPAN</a>';

// 🛡️ 基本のピン
const icons = {
    red: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    blue: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    green: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    purple: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] }),
    orange: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] })
};

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

function getRouteStyle(feature) {
    const name = getFeatureName(feature.properties);
    if (name.includes("東海自然歩道本線以外")) return { color: "#0052cc", weight: 4, opacity: 0.8 }; 
    if (name.includes("東海自然歩道")) return { color: "#27ae60", weight: 6, opacity: 0.9 }; 
    
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
    kanko: { url: 'P12_観光資源_近畿.geojson', isCircle: true, circleColor: '#FF8C00', style: {color: '#FF8C00', weight: 2, fillOpacity: 0.3} },
    restaurants: { url: 'restaurant.geojson', icon: icons.orange },
    trail: { url: 'OSM_trail.geojson', icon: icons.purple },
    shizenhodo: { url: 'TokaiNatureTrail_Route.geojson', style: getRouteStyle },
    gokaido: { url: 'gokaido_routes.geojson', style: getRouteStyle },
    live_trend: { url: 'trend_spots.geojson?t=' + new Date().getTime(), category: 'trend', color: '#ff4b00' },
    live_flower: { url: 'trend_spots.geojson?t=' + new Date().getTime(), category: 'flower', color: '#ff69b4' },
    live_local: { url: 'trend_spots.geojson?t=' + new Date().getTime(), category: 'local', color: '#32cd32' },
    user_spots: { url: 'user_spots.geojson?t=' + new Date().getTime(), icon: icons.orange, isUserSpot: true },
    legacy_spots: { url: 'legacy_spots.geojson?t=' + new Date().getTime(), icon: icons.red, isLegacy: true }
};

const immediateLayers = ['keikan', 'tree', 'fudo', 'denken', 'fuchi', 'kanko', 'trail', 'shizenhodo', 'gokaido'];

const rawData = {};
const layers = {};
let legacyClusterGroup = null; // ズーム連動のためスコープを外に出す
let myakuLargeMarker = null;
let legacyGeoJsonLayer = null;
Object.keys(layerDefs).forEach(key => { layers[key] = L.layerGroup(); });
const drawSelectionLayer = L.layerGroup();
const drawAreaLayer = L.layerGroup();
const municipalityBoundaryLayer = L.layerGroup();
const municipalitySelectionLayer = L.layerGroup();
const legacySearchLayer = L.layerGroup();
let drawPathLayer = null;
let drawSelectionActive = false;
let drawSavedVisibleLayers = new Set();
let drawPoints = [];
let drawPointerId = null;
let drawSelectionCounts = {};
let drawSelectionTotal = 0;
let drawSelectedFeatureIds = new Set();
let drawActiveTouchPointers = new Set();
let drawSelectedEntries = [];
let drawVisibleKeys = new Set();
let municipalityData = null;
let municipalitySavedVisibleLayers = new Set();
let municipalitySelectedEntries = [];
let municipalitySelectionCounts = {};
let municipalitySelectionTotal = 0;
let municipalityVisibleKeys = new Set();
let municipalityModeActive = false;
const ENABLE_MUNICIPALITY_SEARCH = false;
let townIndexData = null;
const townSplitDataCache = {};
let legacySearchCandidateFeatures = [];
let currentShareUrl = "";
let legacyListOpen = false;

function setShareUrl(query) {
    const url = new URL(window.location.href);
    url.searchParams.set('q', query);
    url.searchParams.delete('spot');
    url.searchParams.delete('name');
    url.searchParams.delete('lat');
    url.searchParams.delete('lng');
    url.searchParams.delete('z');
    url.hash = '';
    currentShareUrl = url.toString();
    window.history.replaceState(null, '', currentShareUrl);
    document.body.classList.add('municipality-share-ready');
}

function setLegacyShareUrl(feature, latlng) {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('spot', 'legacy');
    url.searchParams.set('name', feature.properties?.name || '');
    url.searchParams.set('lat', latlng.lat.toFixed(6));
    url.searchParams.set('lng', latlng.lng.toFixed(6));
    url.searchParams.set('z', String(Math.max(map.getZoom(), 17)));
    url.hash = '';
    currentShareUrl = url.toString();
    window.history.replaceState(null, '', currentShareUrl);
    document.body.classList.add('municipality-share-ready');
}

function clearShareUrl() {
    currentShareUrl = "";
    document.body.classList.remove('municipality-share-ready', 'municipality-share-url-visible');
    const shareInput = document.getElementById('municipality-share-url');
    if (shareInput) shareInput.value = "";
}

async function copyCurrentShareUrl() {
    const urlToCopy = currentShareUrl || window.location.href;
    if (!urlToCopy) return;

    const shareInput = document.getElementById('municipality-share-url');
    if (shareInput) {
        shareInput.value = urlToCopy;
        document.body.classList.add('municipality-share-url-visible');
        shareInput.focus();
        shareInput.select();
    }
    setMunicipalityPanel("共有URLを表示しました。選択されたURLをコピーしてください。");
}

function clearSharedSearchFromAddressBar() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('q') && !url.searchParams.has('spot')) return;
    url.search = '';
    url.hash = '';
    window.history.replaceState(null, '', url.toString());
}

function repairGeoJson(data) {
    if (!data || !data.features) return data;
    return {
        ...data,
        features: data.features.map(ft => {
            const geom = ft.geometry;
            if (Array.isArray(geom) && geom.length === 2 &&
                typeof geom[0] === 'number' && typeof geom[1] === 'number') {
                return { ...ft, geometry: { type: 'Point', coordinates: geom } };
            }
            return ft;
        })
    };
}

function getLegacyClusterCenterLatLng() {
    if (!legacyClusterGroup || !legacyGeoJsonLayer) return null;

    let firstMarker = null;
    legacyGeoJsonLayer.eachLayer(layer => {
        if (!firstMarker) firstMarker = layer;
    });
    if (!firstMarker) return null;

    const visibleParent = legacyClusterGroup.getVisibleParent(firstMarker);
    return visibleParent ? visibleParent.getLatLng() : firstMarker.getLatLng();
}

function updateStandaloneMyakuLarge() {
    if (!layers.legacy_spots) return;
    if (myakuLargeMarker) {
        layers.legacy_spots.removeLayer(myakuLargeMarker);
        myakuLargeMarker = null;
    }

    if (map.getZoom() > 3 || !rawData.legacy_spots) return;

    const center = getLegacyClusterCenterLatLng();
    if (!center) return;

    myakuLargeMarker = L.marker(center, {
        interactive: false,
        icon: L.divIcon({
            html: `<img src="./myaku_large.webp" class="myaku-large-img" style="width:100px; height:auto;">`,
            className: 'standalone-myaku-large',
            iconSize: [100, 100],
            iconAnchor: [50, 50]
        })
    });
    layers.legacy_spots.addLayer(myakuLargeMarker);
}

function updateLegacyClusterVisibility() {
    if (!layers.legacy_spots || !legacyClusterGroup) return;

    if (map.getZoom() <= 3) {
        if (layers.legacy_spots.hasLayer(legacyClusterGroup)) {
            layers.legacy_spots.removeLayer(legacyClusterGroup);
        }
        return;
    }

    if (!layers.legacy_spots.hasLayer(legacyClusterGroup)) {
        layers.legacy_spots.addLayer(legacyClusterGroup);
    }
}

function renderGeoJson(key, bounds = null) {
    layers[key].clearLayers();
    const def = layerDefs[key];

    // ▼ ▼ ▼ 万博レガシー専用のクラスタリング（ミャクミャク召喚ギミック） ▼ ▼ ▼
    if (key === 'legacy_spots') {
        legacyClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 60,
            showCoverageOnHover: false,
            iconCreateFunction: function(cluster) {
                const childMarkers = cluster.getAllChildMarkers();
                const count = cluster.getChildCount();
                
                let hasStore = false;
                let hasKomyaku = false;
                
                // 🌟 ReferenceError対策：引数名を m にし、明示的な function を使用して絶対防壁を張る！
                childMarkers.forEach(function(m) {
                    if (m && m.feature && m.feature.properties) {
                        const props = m.feature.properties;
                        if (props.isStore) hasStore = true;
                        if (props.isKomyaku) hasKomyaku = true;
                    }
                });

                let imgUrl = './komyaku_red.webp';
                if (hasStore) imgUrl = './komyaku_blue.webp';
                else if (hasKomyaku) imgUrl = './komyaku_gray.webp';

                return L.divIcon({
                    html: `<div style="position:relative; width:50px; height:50px;">
                               <img src="${imgUrl}" style="width:100%; height:100%; object-fit:contain; filter: drop-shadow(1px 2px 3px rgba(0,0,0,0.4));">
                               <div style="position:absolute; bottom:-5px; right:-5px; background:rgba(0,0,0,0.7); color:white; border-radius:50%; width:22px; height:22px; line-height:22px; text-align:center; font-size:12px; font-weight:bold;">${count}</div>
                           </div>`,
                    className: 'custom-cluster-komyaku',
                    iconSize: [50, 50],
                    iconAnchor: [25, 25]
                });
            }
        });
        legacyClusterGroup.on('spiderfied', function(e) {
            if (e.cluster && e.cluster._icon) e.cluster._icon.style.display = 'none';
        });
        legacyClusterGroup.on('unspiderfied', function(e) {
            if (e.cluster && e.cluster._icon) e.cluster._icon.style.display = '';
        });

        const geoJsonLayer = L.geoJSON(repairGeoJson(rawData[key]), {
            pointToLayer: function(feature, latlng) {
                let mIconUrl = './myakupin_red.webp';
                if (feature.properties) {
                    if (feature.properties.isStore) mIconUrl = './myakupin_blue.webp';
                    else if (feature.properties.isKomyaku) mIconUrl = './myakupin_gray.webp';
                }

                const mIcon = L.icon({
                    iconUrl: mIconUrl,
                    iconSize: [30, 45],
                    iconAnchor: [15, 45],
                    popupAnchor: [0, -45]
                });
                
                const marker = L.marker(latlng, { icon: mIcon });
                marker.feature = feature; 
                return marker;
            },
            onEachFeature: function(feature, layer) {
                const imgHtml = feature.properties.image_url ? `<div style="text-align:center;"><img src="${feature.properties.image_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>` : '';
                layer.bindPopup(`<div style="min-width:200px;">${imgHtml}${feature.properties.popupContent}</div>`);
            }
        });
        legacyGeoJsonLayer = geoJsonLayer;

        legacyClusterGroup.addLayer(geoJsonLayer);
        layers[key].addLayer(legacyClusterGroup);
        updateLegacyClusterVisibility();
        setTimeout(updateStandaloneMyakuLarge, 0);
        return; 
    }
    // ▲ ▲ ▲ ここまでレガシー専用処理 ▲ ▲ ▲

    L.geoJSON(repairGeoJson(rawData[key]), {
        filter: function(feature) {
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
                const imgHtml = feature.properties.image_url ? `<img src="${feature.properties.image_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-top: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><br>` : '';
                const linkHtml = feature.properties.link ? `<br><a href="${feature.properties.link}" target="_blank" style="display:inline-block; margin-top:8px; padding:6px 12px; background:${def.color}; color:#fff; text-decoration:none; border-radius:6px; font-size:0.9em; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.2);">📰 ニュースを見る</a>` : '';

                return L.circleMarker(latlng, {
                    radius: 12, color: '#ffffff', weight: 2, fillColor: def.color, fillOpacity: 0.8
                }).bindPopup(`
                    <div style="text-align:center;">
                        <b style="color:${def.color}; font-size:1.1em;">【${feature.properties.category}】</b><br>
                        <span style="font-size:1.2em; font-weight:bold;">${feature.properties.trend_word}</span><br>
                        <span style="color:#666;">📍 ${feature.properties.name}</span><br>
                        ${imgHtml}
                        ${linkHtml}
                    </div>
                `);
            }
            if(def.isCircle) return L.circleMarker(latlng, { radius: 6, fillColor: def.circleColor || 'red', color: '#fff', weight: 2, fillOpacity: 0.8 });
            return L.marker(latlng, { icon: def.icon || new L.Icon.Default() });
        },
        style: def.style,
        onEachFeature: function(feature, layer) {
            if (key === 'live_trend' || key === 'live_flower' || key === 'live_local') return;
            if (def.isUserSpot) {
                const name = feature.properties.name || "名称未定";
                const reason = feature.properties.reason || "";
                layer.bindPopup(`
                    <div style="text-align:center; min-width:180px;">
                        <b style="color:#e67e22; font-size:1.1em;">【🗣️ ユーザー投稿】</b><br>
                        <span style="font-size:1.2em; font-weight:bold;">${name}</span><br>
                        <hr style="margin:8px 0; border:0; border-top:1px dashed #ccc;">
                        <span style="color:#555; font-size:0.9em;">${reason}</span>
                    </div>
                `);
                return;
            }
            const name = getFeatureName(feature.properties);
            layer.bindPopup(`<strong>${name}</strong>`);
        }
    }).addTo(layers[key]);
}

async function fetchLayerData(key, def, renderAfterLoad = false) {
    if (rawData[key]) {
        if (renderAfterLoad) renderGeoJson(key);
        return true;
    }

    try {
        const res = await fetch(def.url);
        if (!res.ok) return false;

        rawData[key] = await res.json();
        if (renderAfterLoad) {
            renderGeoJson(key);
        }
        return true;
    } catch (e) {
        console.error(`Failed to load ${key}:`, e);
        return false;
    }
}

async function fetchAllData() {
    for (const key of immediateLayers) {
        await fetchLayerData(key, layerDefs[key], true);
    }
}
fetchAllData();

const overlayMaps = {
    "♟️ 道標": layers.rel, "🌳 公園・遊具": layers.park, "🏟️ 公共施設": layers.com, "📚 文化施設": layers.mus, "🏃‍♂️ 体育施設": layers.gym, "🏯 文化財": layers.cul, "🚾 トイレ": layers.wc,
    "🍽️ 喫茶店・レストラン": layers.restaurants,
    "🏞️ 景観地区": layers.keikan, "🌲 景観重要建造物樹木": layers.tree, "📜 歴史的風土保存区域": layers.fudo, "🏘️ 伝統的建造物群保存地区": layers.denken, "🗺️ 歴史的風致重点地区": layers.fuchi, "🎆 観光資源": layers.kanko, 
    "🐾 トレイル.古道": layers.trail, "🛤️ 東海自然歩道": layers.shizenhodo, "🛣️ 五街道": layers.gokaido,
    "😊 ローカルニュース": layers.live_local, "🎡 万博・レガシー": layers.legacy_spots,
    "🗣️ ユーザー投稿スポット": layers.user_spots
};
const layerLabels = Object.fromEntries(
    Object.entries(overlayMaps).map(([label, layer]) => {
        const key = Object.keys(layers).find(layerKey => layers[layerKey] === layer);
        return [key, label];
    }).filter(([key]) => key)
);
const drawSelectableKeys = [
    'rel', 'park', 'com', 'mus', 'gym', 'cul', 'wc',
    'keikan', 'tree', 'fudo', 'denken', 'fuchi', 'kanko',
    'restaurants', 'trail', 'shizenhodo', 'gokaido',
    'live_local',
    'user_spots', 'legacy_spots'
];

function pointInPolygon(point, polygon) {
    const x = point.lng;
    const y = point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng;
        const yi = polygon[i].lat;
        const xj = polygon[j].lng;
        const yj = polygon[j].lat;
        const intersects = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / ((yj - yi) || Number.EPSILON) + xi);
        if (intersects) inside = !inside;
    }

    return inside;
}

function getLatLngBoundsFromPolygon(polygon) {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    polygon.forEach(point => {
        minLat = Math.min(minLat, point.lat);
        maxLat = Math.max(maxLat, point.lat);
        minLng = Math.min(minLng, point.lng);
        maxLng = Math.max(maxLng, point.lng);
    });

    return { minLat, maxLat, minLng, maxLng };
}

function pointInBounds(point, bounds) {
    return point.lat >= bounds.minLat &&
        point.lat <= bounds.maxLat &&
        point.lng >= bounds.minLng &&
        point.lng <= bounds.maxLng;
}

function coordToLatLng(coord) {
    if (!Array.isArray(coord) || coord.length < 2) return null;
    if (typeof coord[0] !== 'number' || typeof coord[1] !== 'number') return null;
    return L.latLng(coord[1], coord[0]);
}

function latLngsFromGeometry(geometry) {
    if (!geometry) return [];

    if (geometry.type === 'Point') {
        const point = coordToLatLng(geometry.coordinates);
        return point ? [point] : [];
    }

    if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') {
        return (geometry.coordinates || []).map(coordToLatLng).filter(Boolean);
    }

    if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') {
        return (geometry.coordinates || []).flatMap(line => (line || []).map(coordToLatLng).filter(Boolean));
    }

    if (geometry.type === 'MultiPolygon') {
        return (geometry.coordinates || []).flatMap(poly =>
            (poly || []).flatMap(ring => (ring || []).map(coordToLatLng).filter(Boolean))
        );
    }

    return [];
}

function polygonRingsFromGeometry(geometry) {
    if (!geometry) return [];
    if (geometry.type === 'Polygon') return geometry.coordinates || [];
    if (geometry.type === 'MultiPolygon') return (geometry.coordinates || []).flatMap(poly => poly || []);
    return [];
}

function featurePolygonContainsDrawPoint(feature, polygon) {
    const rings = polygonRingsFromGeometry(feature.geometry);
    if (!rings.length) return false;

    return rings.some(ring => {
        const ringLatLngs = (ring || []).map(coordToLatLng).filter(Boolean);
        if (ringLatLngs.length < 3) return false;
        return polygon.some(point => pointInPolygon(point, ringLatLngs));
    });
}

function featureIntersectsPolygon(feature, polygon, polygonBounds) {
    if (!feature || !feature.geometry) return false;
    const points = latLngsFromGeometry(feature.geometry);
    if (!points.length) return false;

    return points.some(point => pointInBounds(point, polygonBounds) && pointInPolygon(point, polygon)) ||
        featurePolygonContainsDrawPoint(feature, polygon);
}

function getBoundsFromLatLngs(points) {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    points.forEach(point => {
        minLat = Math.min(minLat, point.lat);
        maxLat = Math.max(maxLat, point.lat);
        minLng = Math.min(minLng, point.lng);
        maxLng = Math.max(maxLng, point.lng);
    });

    return { minLat, maxLat, minLng, maxLng };
}

function geometryBounds(geometry) {
    const points = latLngsFromGeometry(geometry);
    return points.length ? getBoundsFromLatLngs(points) : null;
}

function boundsIntersect(a, b) {
    if (!a || !b) return false;
    return a.minLat <= b.maxLat &&
        a.maxLat >= b.minLat &&
        a.minLng <= b.maxLng &&
        a.maxLng >= b.minLng;
}

function buildMunicipalityShape(features) {
    const rings = [];
    const ringItems = [];
    const points = [];

    features.forEach(feature => {
        polygonRingsFromGeometry(feature.geometry).forEach(ring => {
            const latLngRing = (ring || []).map(coordToLatLng).filter(Boolean);
            if (latLngRing.length < 3) return;
            rings.push(latLngRing);
            ringItems.push({ ring: latLngRing, bounds: getBoundsFromLatLngs(latLngRing) });
            points.push(...latLngRing);
        });
    });

    return { rings, ringItems, points, bounds: getBoundsFromLatLngs(points) };
}

function pointInMunicipalityShape(point, shape) {
    return pointInBounds(point, shape.bounds) &&
        shape.ringItems.some(item => pointInBounds(point, item.bounds) && pointInPolygon(point, item.ring));
}

function featureIntersectsMunicipality(feature, shape) {
    if (!feature || !feature.geometry || !shape.rings.length) return false;

    if (feature.geometry.type === 'Point') {
        const point = coordToLatLng(feature.geometry.coordinates);
        return point ? pointInMunicipalityShape(point, shape) : false;
    }

    const points = latLngsFromGeometry(feature.geometry);
    if (!points.length) return false;
    const bounds = getBoundsFromLatLngs(points);
    if (!boundsIntersect(bounds, shape.bounds)) return false;

    return points.some(point => pointInMunicipalityShape(point, shape)) ||
        shape.points.some(point => featurePolygonContainsDrawPoint(feature, [point]));
}

function getFeatureLatLng(feature) {
    if (!feature || !feature.geometry || feature.geometry.type !== "Point") return null;
    const coords = feature.geometry.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return null;
    return L.latLng(coords[1], coords[0]);
}

function featureMatchesLayerCategory(key, feature) {
    const def = layerDefs[key];
    if (!def || !feature || !feature.properties) return true;
    if (key === 'live_trend' || key === 'live_flower' || key === 'live_local') {
        return feature.properties.category === def.category;
    }
    return true;
}

function createDrawSelectionMarker(key, feature, latlng) {
    const def = layerDefs[key];

    if (key === 'legacy_spots') {
        let mIconUrl = './myakupin_red.webp';
        if (feature.properties) {
            if (feature.properties.isStore) mIconUrl = './myakupin_blue.webp';
            else if (feature.properties.isKomyaku) mIconUrl = './myakupin_gray.webp';
        }
        const marker = L.marker(latlng, {
            icon: L.icon({
                iconUrl: mIconUrl,
                iconSize: [30, 45],
                iconAnchor: [15, 45],
                popupAnchor: [0, -45]
            })
        });
        const imgHtml = feature.properties.image_url ? `<div style="text-align:center;"><img src="${feature.properties.image_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>` : '';
        marker.bindPopup(`<div style="min-width:200px;">${imgHtml}${feature.properties.popupContent || getFeatureName(feature.properties)}</div>`);
        return marker;
    }

    if (key === 'live_trend' || key === 'live_flower' || key === 'live_local') {
        const imgHtml = feature.properties.image_url ? `<img src="${feature.properties.image_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-top: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><br>` : '';
        const linkHtml = feature.properties.link ? `<br><a href="${feature.properties.link}" target="_blank" style="display:inline-block; margin-top:8px; padding:6px 12px; background:${def.color}; color:#fff; text-decoration:none; border-radius:6px; font-size:0.9em; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.2);">📰 ニュースを見る</a>` : '';
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
                <span style="color:#666;">📍 ${feature.properties.name}</span><br>
                ${imgHtml}
                ${linkHtml}
            </div>
        `);
    }

    if (def.isUserSpot) {
        const name = feature.properties.name || "名称未定";
        const reason = feature.properties.reason || "";
        return L.marker(latlng, { icon: def.icon || new L.Icon.Default() }).bindPopup(`
            <div style="text-align:center; min-width:180px;">
                <b style="color:#e67e22; font-size:1.1em;">【🗣️ ユーザー投稿】</b><br>
                <span style="font-size:1.2em; font-weight:bold;">${name}</span><br>
                <hr style="margin:8px 0; border:0; border-top:1px dashed #ccc;">
                <span style="color:#555; font-size:0.9em;">${reason}</span>
            </div>
        `);
    }

    if (def.isCircle) {
        return L.circleMarker(latlng, {
            radius: 6,
            fillColor: def.circleColor || 'red',
            color: '#fff',
            weight: 2,
            fillOpacity: 0.8
        }).bindPopup(`<strong>${getFeatureName(feature.properties)}</strong>`);
    }

    return L.marker(latlng, { icon: def.icon || new L.Icon.Default() })
        .bindPopup(`<strong>${getFeatureName(feature.properties)}</strong>`);
}

function bindDrawFeaturePopup(key, feature, layer) {
    const def = layerDefs[key];

    if (key === 'live_trend' || key === 'live_flower' || key === 'live_local') return;

    if (def.isUserSpot) {
        const name = feature.properties.name || "名称未定";
        const reason = feature.properties.reason || "";
        layer.bindPopup(`
            <div style="text-align:center; min-width:180px;">
                <b style="color:#e67e22; font-size:1.1em;">【🗣️ ユーザー投稿】</b><br>
                <span style="font-size:1.2em; font-weight:bold;">${name}</span><br>
                <hr style="margin:8px 0; border:0; border-top:1px dashed #ccc;">
                <span style="color:#555; font-size:0.9em;">${reason}</span>
            </div>
        `);
        return;
    }

    layer.bindPopup(`<strong>${getFeatureName(feature.properties)}</strong>`);
}

function createDrawSelectionLayer(key, feature) {
    const def = layerDefs[key];
    const latlng = getFeatureLatLng(feature);

    if (latlng) {
        return createDrawSelectionMarker(key, feature, latlng);
    }

    return L.geoJSON(feature, {
        style: typeof def.style === 'function' ? def.style : (def.style || { color: '#f59e0b', weight: 3, fillOpacity: 0.18 }),
        onEachFeature: function(ft, layer) {
            bindDrawFeaturePopup(key, ft, layer);
        }
    });
}

function renderDrawVisibleResults() {
    drawSelectionLayer.clearLayers();
    drawSelectedEntries.forEach(entry => {
        if (!drawVisibleKeys.has(entry.key)) return;
        drawSelectionLayer.addLayer(createDrawSelectionLayer(entry.key, entry.feature));
    });
}

function setDrawPanel(summary, counts = {}) {
    const summaryEl = document.getElementById('draw-result-summary');
    const breakdownEl = document.getElementById('draw-result-breakdown');
    if (summaryEl) summaryEl.textContent = summary;
    if (!breakdownEl) return;

    const rows = Object.entries(counts)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => `
            <div class="draw-breakdown-row">
                <span class="draw-breakdown-label">${layerLabels[key] || key}</span>
                <span class="draw-breakdown-count">${count}件</span>
            </div>
        `);
    breakdownEl.innerHTML = rows.length ? rows.join('') : '';
}

function resetDrawSelectionResults() {
    drawSelectionLayer.clearLayers();
    drawAreaLayer.clearLayers();
    drawSelectionCounts = {};
    drawSelectionTotal = 0;
    drawSelectedFeatureIds = new Set();
    drawSelectedEntries = [];
}

function canUseDrawSelection() {
    return map.getZoom() >= DRAW_ZOOM;
}

function isMunicipalitySearchActive() {
    return municipalityModeActive ||
        document.body.classList.contains('municipality-search-open') ||
        document.body.classList.contains('municipality-results-visible');
}

function updateDrawSelectBtn() {
    if (!drawSelectBtn) return;
    const hasDrawResults = document.body.classList.contains('draw-results-visible') || drawSelectionTotal > 0;
    const searchActive = isMunicipalitySearchActive();
    const unavailable = searchActive || (!canUseDrawSelection() && !drawSelectionActive && !hasDrawResults);
    drawSelectBtn.disabled = unavailable;
    drawSelectBtn.classList.toggle('disabled', unavailable);
    if (searchActive) {
        drawSelectBtn.title = "検索中はペン機能を使えません";
        return;
    }
    drawSelectBtn.title = unavailable
        ? "ズーム15以上で利用できます"
        : hasDrawResults
            ? "通常表示に戻す"
            : "ペンで囲って表示";
}

function isDrawFilterMode() {
    return drawSelectionActive || document.body.classList.contains('draw-results-visible') || drawSelectionTotal > 0;
}

function getLayerKeyFromControlLabel(label) {
    if (!label) return null;
    const text = label.textContent.trim();
    const match = Object.entries(layerLabels).find(([, labelText]) => text.includes(labelText));
    return match ? match[0] : null;
}

function setLayerControlCheckboxState(keysToCheck) {
    document.querySelectorAll('.leaflet-control-layers-overlays label').forEach(label => {
        const key = getLayerKeyFromControlLabel(label);
        const input = label.querySelector('input[type="checkbox"]');
        if (!key || !input) return;
        input.checked = keysToCheck.has(key);
    });
}

function getVisibleLayerKeys() {
    const visibleKeys = new Set();
    Object.keys(layers).forEach(key => {
        if (map.hasLayer(layers[key])) visibleKeys.add(key);
    });
    return visibleKeys;
}

function ensureLegacyLayerEnabledForSearch() {
    if (!layers.legacy_spots) return;
    if (!map.hasLayer(layers.legacy_spots)) {
        layers.legacy_spots.addTo(map);
    }
    const visibleKeys = getVisibleLayerKeys();
    visibleKeys.add('legacy_spots');
    setTimeout(() => setLayerControlCheckboxState(visibleKeys), 0);
}

function syncDrawLayerControlState() {
    setLayerControlCheckboxState(drawVisibleKeys);
}

function syncNormalLayerControlState() {
    setLayerControlCheckboxState(drawSavedVisibleLayers);
}

function hideNormalLayersForDraw() {
    drawSavedVisibleLayers = new Set();
    Object.keys(layers).forEach(key => {
        if (map.hasLayer(layers[key])) {
            drawSavedVisibleLayers.add(key);
            map.removeLayer(layers[key]);
        }
    });
    drawVisibleKeys = new Set(drawSelectableKeys);
    if (!map.hasLayer(drawSelectionLayer)) drawSelectionLayer.addTo(map);
    if (!map.hasLayer(drawAreaLayer)) drawAreaLayer.addTo(map);
    setTimeout(syncDrawLayerControlState, 0);
}

function restoreNormalLayersAfterDraw() {
    resetDrawSelectionResults();
    const restoredKeys = new Set(drawSavedVisibleLayers);
    drawSavedVisibleLayers.forEach(key => {
        if (layers[key] && !map.hasLayer(layers[key])) {
            layers[key].addTo(map);
        }
    });
    drawSavedVisibleLayers.clear();
    setTimeout(() => setLayerControlCheckboxState(restoredKeys), 0);
}

function getDrawFeatureId(key, index) {
    return `${key}:${index}`;
}

async function renderDrawSelectionResults(polygon) {
    setDrawPanel("囲み範囲のデータを確認中...");

    let added = 0;
    const polygonBounds = getLatLngBoundsFromPolygon(polygon);

    for (const key of drawSelectableKeys) {
        setDrawPanel(`${layerLabels[key] || key} を確認中...`);
        await fetchLayerData(key, layerDefs[key]);
        if (!rawData[key]) continue;

        const repaired = repairGeoJson(rawData[key]);
        const features = repaired.features || [];

        for (let i = 0; i < features.length; i += 1) {
            const feature = features[i];
            const featureId = getDrawFeatureId(key, i);
            if (drawSelectedFeatureIds.has(featureId)) continue;
            if (!featureMatchesLayerCategory(key, feature)) continue;
            if (!featureIntersectsPolygon(feature, polygon, polygonBounds)) continue;

            drawSelectedFeatureIds.add(featureId);
            drawSelectedEntries.push({ key, feature });
            drawSelectionCounts[key] = (drawSelectionCounts[key] || 0) + 1;
            drawSelectionTotal += 1;
            added += 1;

            if (i > 0 && i % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }

    if (drawSelectionTotal === 0) {
        setDrawPanel("囲み範囲内に表示できるピンはありませんでした。もう少し広く囲ってみてください。");
        return;
    }

    renderDrawVisibleResults();
    setDrawPanel(`累計 ${drawSelectionTotal} 件の項目を表示中です。続けて別の場所も囲めます。`, drawSelectionCounts);
}

function startDrawSelectionMode() {
    if (isMunicipalitySearchActive()) {
        setMunicipalityPanel("検索中はペン機能を使えません。検索を終了してから使ってください。");
        updateDrawSelectBtn();
        return;
    }

    if (!canUseDrawSelection()) {
        alert("ペンで囲って表示は、ズーム15以上で利用できます。もう少し近づいてください。");
        updateDrawSelectBtn();
        return;
    }

    drawSelectionActive = true;
    drawPoints = [];
    drawPointerId = null;
    drawActiveTouchPointers.clear();
    resetDrawSelectionResults();
    map.closePopup();
    closeLayerMenu();
    hideNormalLayersForDraw();
    document.body.classList.add('draw-selecting');
    document.body.classList.remove('draw-results-visible');
    document.getElementById('draw-select-btn')?.classList.add('active');
    setDrawPanel("ペンで地図を囲ってください。指を離すと、その範囲だけ表示します。続けて何度でも囲めます。");

}

function stopDrawSelectionMode(restoreLayers = true) {
    drawSelectionActive = false;
    drawPoints = [];
    drawPointerId = null;
    drawActiveTouchPointers.clear();
    if (drawPathLayer) {
        map.removeLayer(drawPathLayer);
        drawPathLayer = null;
    }
    document.body.classList.remove('draw-selecting', 'draw-results-visible');
    document.getElementById('draw-select-btn')?.classList.remove('active');
    setDrawPanel("ペンで地図を囲ってください");

    map.dragging.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    if (map.touchZoom) map.touchZoom.enable();

    if (restoreLayers) restoreNormalLayersAfterDraw();
    else resetDrawSelectionResults();
    updateDrawSelectBtn();
}

async function loadMunicipalityData() {
    if (municipalityData) return municipalityData;
    if (window.MUNICIPALITIES_KINKI_DATA) {
        municipalityData = window.MUNICIPALITIES_KINKI_DATA;
        return municipalityData;
    }

    if (window.location.protocol === 'file:') {
        await new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-municipalities-kinki]');
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'municipalities_kinki.js';
            script.dataset.municipalitiesKinki = 'true';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        if (window.MUNICIPALITIES_KINKI_DATA) {
            municipalityData = window.MUNICIPALITIES_KINKI_DATA;
            return municipalityData;
        }
    }

    const res = await fetch('municipalities_kinki.geojson');
    if (!res.ok) throw new Error('municipalities_kinki.geojson could not be loaded');
    municipalityData = await res.json();
    return municipalityData;
}

function normalizeMunicipalityText(value) {
    return String(value || '').replace(/\s+/g, '').toLowerCase();
}

async function loadTownIndexData() {
    if (townIndexData) return townIndexData;
    const res = await fetch('towns_kinki_index.json');
    if (!res.ok) throw new Error('towns_kinki_index.json could not be loaded');
    townIndexData = await res.json();
    return townIndexData;
}

async function loadTownSplitData(file) {
    if (townSplitDataCache[file]) return townSplitDataCache[file];
    const res = await fetch(file);
    if (!res.ok) throw new Error(`${file} could not be loaded`);
    townSplitDataCache[file] = await res.json();
    return townSplitDataCache[file];
}

function getTownMatchCandidates(query) {
    const q = normalizeMunicipalityText(query);
    if (!q || !townIndexData) return { type: 'none' };

    const rows = townIndexData;
    const exactCode = rows.filter(row => normalizeMunicipalityText(row.code) === q);
    if (exactCode.length) return { type: 'match', rows: exactCode };

    const exactFull = rows.filter(row => {
        const cityName = normalizeMunicipalityText(`${row.city || ''}${row.name || ''}`);
        const prefCityName = normalizeMunicipalityText(`${row.pref || ''}${row.city || ''}${row.name || ''}`);
        return cityName === q || prefCityName === q;
    });
    if (exactFull.length) return { type: 'match', rows: exactFull };

    const exactName = rows.filter(row => normalizeMunicipalityText(row.name) === q);
    if (exactName.length === 1) return { type: 'match', rows: exactName };
    if (exactName.length > 1 && exactName.length <= 12) return { type: 'ambiguous', rows: exactName };
    if (exactName.length > 12) {
        return {
            type: 'blocked',
            message: `${query} は候補が多すぎます。市区町村名も含めて検索してください。`
        };
    }

    const partial = q.length >= 3
        ? rows.filter(row => normalizeMunicipalityText(row.name).includes(q)).slice(0, 13)
        : [];
    if (partial.length === 1) return { type: 'match', rows: partial };
    if (partial.length > 1 && partial.length <= 12) return { type: 'ambiguous', rows: partial };
    if (partial.length > 12) {
        return {
            type: 'blocked',
            message: `${query} は候補が多すぎます。市区町村名も含めて検索してください。`
        };
    }

    return { type: 'none' };
}

function setMunicipalityCandidatePanel(summary, rows) {
    const summaryEl = document.getElementById('municipality-result-summary');
    const breakdownEl = document.getElementById('municipality-result-breakdown');
    if (summaryEl) summaryEl.textContent = summary;
    if (!breakdownEl) return;
    breakdownEl.innerHTML = rows.map(row => `
        <button class="municipality-breakdown-row municipality-candidate-row" type="button" data-town-code="${row.code}" data-town-label="${row.city || ''}${row.name || ''}">
            <span class="municipality-breakdown-label">${row.pref || ''}${row.city || ''} ${row.name || ''}</span>
        </button>
    `).join('');
}

function setLegacyCandidatePanel(summary, features) {
    const summaryEl = document.getElementById('municipality-result-summary');
    const breakdownEl = document.getElementById('municipality-result-breakdown');
    if (summaryEl) summaryEl.textContent = summary;
    if (!breakdownEl) return;

    legacySearchCandidateFeatures = features;
    breakdownEl.innerHTML = features.map((feature, index) => `
        <button class="municipality-breakdown-row municipality-candidate-row legacy-candidate-row" type="button" data-legacy-index="${index}">
            <span class="municipality-breakdown-label">${feature.properties?.name || '名称未設定'}</span>
        </button>
    `).join('');
}

function isLegacyApprovedFeature(feature) {
    const props = feature?.properties || {};
    if (props.isStore === true) return true;

    const flags = [
        props.approved,
        props.approval,
        props.isApproved,
        props.status,
        props.publish,
        props.published,
        props.J,
        props.j
    ];
    return flags.some(value => {
        const normalized = String(value ?? '').trim().toLowerCase();
        return normalized === '1' ||
            normalized === 'true' ||
            normalized === 'yes' ||
            normalized === 'ok' ||
            normalized === 'approved' ||
            normalized === '承認' ||
            normalized === '公開' ||
            normalized === '済';
    });
}

function getApprovedLegacyFeatures() {
    if (!rawData.legacy_spots) return [];
    const features = (repairGeoJson(rawData.legacy_spots).features || [])
        .filter(feature => feature.geometry?.type === 'Point')
        .filter(feature => String(feature.properties?.name || '').trim() !== '');

    return features.sort((a, b) =>
        String(a.properties?.name || '').localeCompare(String(b.properties?.name || ''), 'ja')
    );
}

function getLegacySearchCandidates(query) {
    const q = normalizeMunicipalityText(query);
    if (!q || !rawData.legacy_spots) return { type: 'none' };
    const legacyCandidateLimit = q.includes('ミャクミャク') || q.includes('ﾐｬｸﾐｬｸ') ? 50 : 12;

    const features = (repairGeoJson(rawData.legacy_spots).features || [])
        .filter(feature => feature.geometry?.type === 'Point');

    const exact = features.filter(feature => normalizeMunicipalityText(feature.properties?.name) === q);
    if (exact.length === 1) return { type: 'match', feature: exact[0] };
    if (exact.length > 1) return { type: 'ambiguous', features: exact.slice(0, legacyCandidateLimit) };

    const partial = features.filter(feature => {
        const props = feature.properties || {};
        return normalizeMunicipalityText(props.name).includes(q) ||
            normalizeMunicipalityText(props.popupContent).includes(q);
    });

    if (partial.length === 1) return { type: 'match', feature: partial[0] };
    if (partial.length > 1) return { type: 'ambiguous', features: partial };
    if (false && partial.length > legacyCandidateLimit) {
        return {
            type: 'blocked',
            message: `${query} は万博レガシーピンの候補が多すぎます。もう少し詳しい名称で検索してください。`
        };
    }
    return { type: 'none' };
}

function showLegacySearchFeature(feature, updateShareUrl = true) {
    const latlng = getFeatureLatLng(feature);
    if (!latlng) {
        setMunicipalityPanel("この万博レガシーピンの位置を表示できませんでした。");
        return;
    }

    if (drawSelectionActive || document.body.classList.contains('draw-results-visible')) {
        stopDrawSelectionMode(true);
    }
    if (municipalityModeActive) {
        restoreNormalLayersAfterMunicipality();
        municipalityModeActive = false;
    } else {
        resetMunicipalityResults();
    }
    ensureLegacyLayerEnabledForSearch();

    if (!map.hasLayer(legacySearchLayer)) legacySearchLayer.addTo(map);
    legacySearchLayer.clearLayers();
    const marker = createDrawSelectionMarker('legacy_spots', feature, latlng);
    legacySearchLayer.addLayer(marker);
    map.setView(latlng, Math.max(map.getZoom(), 17));
    setTimeout(() => marker.openPopup?.(), 250);
    document.body.classList.add('municipality-results-visible');
    updateDrawSelectBtn();
    if (legacyListOpen || document.body.classList.contains('legacy-list-open')) {
        document.getElementById('legacy-list-btn')?.classList.add('active');
        document.getElementById('municipality-search-btn')?.classList.remove('active');
    } else {
        document.getElementById('municipality-search-btn')?.classList.add('active');
        document.getElementById('legacy-list-btn')?.classList.remove('active');
    }
    if (updateShareUrl) setLegacyShareUrl(feature, latlng);
    setMunicipalityPanel(`${feature.properties?.name || '万博レガシーピン'} を表示しました。`);
}

async function buildTownBoundaryMatch(query, rows) {
    const files = [...new Set(rows.map(row => row.file).filter(Boolean))];
    const codes = new Set(rows.map(row => row.code));
    const features = [];

    for (const file of files) {
        const geojson = await loadTownSplitData(file);
        (geojson.features || []).forEach(feature => {
            if (codes.has(feature.properties?.code)) features.push(feature);
        });
    }

    const label = rows.length === 1
        ? `${rows[0].city || ''}${rows[0].name || ''}`
        : `${query}（${rows.length}件）`;
    return { label, features };
}

function findMunicipalityFeatures(query) {
    const q = normalizeMunicipalityText(query);
    if (!q || !municipalityData) return null;

    const features = municipalityData.features || [];
    const exactName = features.find(feature => normalizeMunicipalityText(feature.properties?.name) === q);
    if (exactName?.properties?.code) {
        return {
            label: `${exactName.properties.pref || ''}${exactName.properties.name || ''}`,
            features: features.filter(feature => feature.properties?.code === exactName.properties.code)
        };
    }

    const exactParent = features.filter(feature => normalizeMunicipalityText(feature.properties?.parent) === q);
    if (exactParent.length) {
        return {
            label: exactParent[0].properties?.parent || query,
            features: exactParent
        };
    }

    const exactCode = features.filter(feature => normalizeMunicipalityText(feature.properties?.code) === q);
    if (exactCode.length) {
        return {
            label: `${exactCode[0].properties?.pref || ''}${exactCode[0].properties?.name || query}`,
            features: exactCode
        };
    }

    const partial = features.find(feature => normalizeMunicipalityText(feature.properties?.search).includes(q));
    if (partial?.properties?.code) {
        return {
            label: `${partial.properties.pref || ''}${partial.properties.name || ''}`,
            features: features.filter(feature => feature.properties?.code === partial.properties.code)
        };
    }

    return null;
}

function getMunicipalitySearchBlockMessage(query) {
    const q = normalizeMunicipalityText(query);
    if (!q || !municipalityData) return "";

    const features = municipalityData.features || [];
    const prefectures = new Set(features.map(feature => normalizeMunicipalityText(feature.properties?.pref)).filter(Boolean));
    if (prefectures.has(q)) {
        return "府県単位の検索は範囲が大きすぎるため実行できません。市区町村名で検索してください。";
    }

    const largeDesignatedCities = new Set(["大阪市", "京都市", "神戸市"].map(normalizeMunicipalityText));
    if (largeDesignatedCities.has(q)) {
        return `${query}は範囲とデータ量が大きすぎるため実行できません。区名で検索してください。`;
    }

    return "";
}

function setMunicipalityPanel(summary, counts = {}) {
    const summaryEl = document.getElementById('municipality-result-summary');
    const breakdownEl = document.getElementById('municipality-result-breakdown');
    if (summaryEl) summaryEl.textContent = summary;
    if (!breakdownEl) return;

    const rows = Object.entries(counts)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => `
            <div class="municipality-breakdown-row">
                <span class="municipality-breakdown-label">${layerLabels[key] || key}</span>
                <span class="municipality-breakdown-count">${count}件</span>
            </div>
        `);
    breakdownEl.innerHTML = rows.length ? rows.join('') : '';
}

function resetMunicipalityResults() {
    municipalityBoundaryLayer.clearLayers();
    municipalitySelectionLayer.clearLayers();
    legacySearchLayer.clearLayers();
    municipalitySelectedEntries = [];
    municipalitySelectionCounts = {};
    municipalitySelectionTotal = 0;
    legacySearchCandidateFeatures = [];
}

function hideNormalLayersForMunicipality() {
    municipalitySavedVisibleLayers = new Set();
    Object.keys(layers).forEach(key => {
        if (map.hasLayer(layers[key])) {
            municipalitySavedVisibleLayers.add(key);
            map.removeLayer(layers[key]);
        }
    });
    municipalityVisibleKeys = new Set(drawSelectableKeys);
    if (!map.hasLayer(municipalityBoundaryLayer)) municipalityBoundaryLayer.addTo(map);
    if (!map.hasLayer(municipalitySelectionLayer)) municipalitySelectionLayer.addTo(map);
    setTimeout(() => setLayerControlCheckboxState(municipalityVisibleKeys), 0);
}

function restoreNormalLayersAfterMunicipality() {
    resetMunicipalityResults();
    const restoredKeys = new Set(municipalitySavedVisibleLayers);
    municipalitySavedVisibleLayers.forEach(key => {
        if (layers[key] && !map.hasLayer(layers[key])) {
            layers[key].addTo(map);
        }
    });
    municipalitySavedVisibleLayers.clear();
    setTimeout(() => setLayerControlCheckboxState(restoredKeys), 0);
}

function renderMunicipalityVisibleResults() {
    municipalitySelectionLayer.clearLayers();
    municipalitySelectedEntries.forEach(entry => {
        if (!municipalityVisibleKeys.has(entry.key)) return;
        municipalitySelectionLayer.addLayer(createDrawSelectionLayer(entry.key, entry.feature));
    });
}

async function renderMunicipalitySelectionResults(match) {
    resetMunicipalityResults();
    setMunicipalityPanel(`${match.label} の境界を確認中...`);

    const shape = buildMunicipalityShape(match.features);
    if (!shape.rings.length) {
        setMunicipalityPanel("この市町村の境界を表示できませんでした。");
        return;
    }

    const boundaryGeoJson = { type: 'FeatureCollection', features: match.features };
    const boundaryLayer = L.geoJSON(boundaryGeoJson, {
        style: {
            color: '#db2777',
            weight: 3,
            opacity: 0.95,
            fillColor: '#f9a8d4',
            fillOpacity: 0.22
        }
    });
    municipalityBoundaryLayer.addLayer(boundaryLayer);
    const bounds = boundaryLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.08));

    for (const key of drawSelectableKeys) {
        setMunicipalityPanel(`${match.label}：${layerLabels[key] || key} を確認中...`);
        await fetchLayerData(key, layerDefs[key]);
        if (!rawData[key]) continue;

        const repaired = repairGeoJson(rawData[key]);
        const features = repaired.features || [];

        for (let i = 0; i < features.length; i += 1) {
            const feature = features[i];
            if (!featureMatchesLayerCategory(key, feature)) continue;
            if (!featureIntersectsMunicipality(feature, shape)) continue;

            municipalitySelectedEntries.push({ key, feature });
            municipalitySelectionCounts[key] = (municipalitySelectionCounts[key] || 0) + 1;
            municipalitySelectionTotal += 1;

            if (i > 0 && i % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }

    renderMunicipalityVisibleResults();
    document.body.classList.add('municipality-results-visible');
    updateDrawSelectBtn();
    if (match.label) setShareUrl(match.label);
    setMunicipalityPanel(`${match.label}：${municipalitySelectionTotal}件の項目を表示中です。`, municipalitySelectionCounts);
}

async function runMunicipalitySearchFull(query) {
    const trimmed = String(query || '').trim();
    if (!trimmed) {
        setMunicipalityPanel("市町村名を入力してください。");
        return;
    }

    try {
        setMunicipalityPanel("町丁・市区町村データを読み込み中...");
        await loadTownIndexData();
        const townCandidates = getTownMatchCandidates(trimmed);
        if (townCandidates.type === 'blocked') {
            setMunicipalityPanel(townCandidates.message);
            return;
        }
        if (townCandidates.type === 'ambiguous') {
            setMunicipalityCandidatePanel(`${trimmed} は候補が複数あります。市区町村名も含めて検索してください。`, townCandidates.rows);
            return;
        }
        if (townCandidates.type === 'match') {
            if (drawSelectionActive || document.body.classList.contains('draw-results-visible')) {
                stopDrawSelectionMode(true);
            }
            if (!municipalityModeActive) {
                municipalityModeActive = true;
                hideNormalLayersForMunicipality();
            }
            map.closePopup();
            setMunicipalityPanel("町丁境界を読み込み中...");
            const townMatch = await buildTownBoundaryMatch(trimmed, townCandidates.rows);
            await renderMunicipalitySelectionResults(townMatch);
            document.getElementById('municipality-search-btn')?.classList.add('active');
            return;
        }
        setMunicipalityPanel("市区町村境界データを読み込み中...");
        setMunicipalityPanel("市町村境界データを読み込み中...");
        setMunicipalityPanel("万博ピンを確認中...");
        ensureLegacyLayerEnabledForSearch();
        await fetchLayerData('legacy_spots', layerDefs.legacy_spots);
        const legacyCandidates = getLegacySearchCandidates(trimmed);
        if (legacyCandidates.type === 'blocked') {
            setMunicipalityPanel(legacyCandidates.message);
            return;
        }
        if (legacyCandidates.type === 'ambiguous') {
            setLegacyCandidatePanel(`${trimmed} は万博ピンの候補が複数あります。候補を選択してください。`, legacyCandidates.features);
            return;
        }
        if (legacyCandidates.type === 'match') {
            showLegacySearchFeature(legacyCandidates.feature);
            return;
        }

        await loadMunicipalityData();
        const blockedMessage = getMunicipalitySearchBlockMessage(trimmed);
        if (blockedMessage) {
            setMunicipalityPanel(blockedMessage);
            return;
        }

        const match = findMunicipalityFeatures(trimmed);
        if (!match || !match.features.length) {
            setMunicipalityPanel(`${trimmed} は見つかりませんでした。近畿の市区町村名で検索してください。`);
            return;
        }

        if (drawSelectionActive || document.body.classList.contains('draw-results-visible')) {
            stopDrawSelectionMode(true);
        }
        if (!municipalityModeActive) {
            municipalityModeActive = true;
            hideNormalLayersForMunicipality();
        }
        map.closePopup();
        await renderMunicipalitySelectionResults(match);
        document.getElementById('municipality-search-btn')?.classList.add('active');
    } catch (error) {
        console.error(error);
        setMunicipalityPanel("市町村検索でエラーが発生しました。");
    }
}

async function runMunicipalitySearch(query) {
    const trimmed = String(query || '').trim();
    if (!trimmed) {
        setMunicipalityPanel("万博レガシーピン名を入力してください。");
        return;
    }

    if (!ENABLE_MUNICIPALITY_SEARCH) {
        try {
            setMunicipalityPanel("万博レガシーピンを検索中...");
            ensureLegacyLayerEnabledForSearch();
            await fetchLayerData('legacy_spots', layerDefs.legacy_spots);
            const legacyCandidates = getLegacySearchCandidates(trimmed);
            if (legacyCandidates.type === 'blocked') {
                setMunicipalityPanel(legacyCandidates.message);
                return;
            }
            if (legacyCandidates.type === 'ambiguous') {
                setLegacyCandidatePanel(`${trimmed} は万博レガシーピンの候補が複数あります。候補を選択してください。`, legacyCandidates.features);
                return;
            }
            if (legacyCandidates.type === 'match') {
                showLegacySearchFeature(legacyCandidates.feature);
                return;
            }
            setMunicipalityPanel(`${trimmed} は万博レガシーピンで見つかりませんでした。`);
            legacySearchCandidateFeatures = [];
        } catch (error) {
            console.error(error);
            setMunicipalityPanel("万博レガシー検索でエラーが発生しました。");
        }
        return;
    }

    return runMunicipalitySearchFull(query);
}

async function openLegacyListPanel() {
    document.body.classList.add('municipality-search-open', 'legacy-list-open');
    municipalitySearchBtn?.classList.remove('active');
    legacyListBtn?.classList.add('active');
    if (municipalitySearchInput) municipalitySearchInput.value = '';
    clearShareUrl();
    updateDrawSelectBtn();

    setMunicipalityPanel("登録ピン一覧を読み込み中...");
    try {
        ensureLegacyLayerEnabledForSearch();
        await fetchLayerData('legacy_spots', layerDefs.legacy_spots);
        const approvedFeatures = getApprovedLegacyFeatures();
        legacySearchCandidateFeatures = approvedFeatures;
        legacyListOpen = true;
        if (!approvedFeatures.length) {
            setMunicipalityPanel("登録ピンがありません。");
            const breakdownEl = document.getElementById('municipality-result-breakdown');
            if (breakdownEl) breakdownEl.innerHTML = '';
            return;
        }
        setLegacyCandidatePanel(`登録ピン一覧（${approvedFeatures.length}件）`, approvedFeatures);
    } catch (error) {
        console.error(error);
        setMunicipalityPanel("登録ピン一覧の読み込みに失敗しました。");
    }
}

function closeMunicipalitySearch(restoreLayers = true) {
    const wasActive = municipalityModeActive;
    document.body.classList.remove('municipality-search-open', 'municipality-results-visible', 'legacy-list-open');
    document.getElementById('municipality-search-btn')?.classList.remove('active');
    document.getElementById('legacy-list-btn')?.classList.remove('active');
    municipalityModeActive = false;
    legacyListOpen = false;
    clearShareUrl();
    setMunicipalityPanel("万博レガシーピン名を入力してください。");
    if (restoreLayers && wasActive) restoreNormalLayersAfterMunicipality();
    else resetMunicipalityResults();
    updateDrawSelectBtn();
}

function enforceDrawZoomLimit() {
    if (!canUseDrawSelection() && drawPointerId !== null) {
        cancelCurrentDrawPath("ズーム15以上で囲みを追加できます。表示中のピンは通常表示に戻すまで残ります。");
    }
    updateDrawSelectBtn();
}

function clientPointToLatLng(clientX, clientY) {
    const rect = map.getContainer().getBoundingClientRect();
    return map.containerPointToLatLng(L.point(clientX - rect.left, clientY - rect.top));
}

function disableMapInteractionsWhileDrawing() {
    map.dragging.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
}

function enableMapInteractionsAfterDrawing() {
    map.dragging.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    if (map.touchZoom) map.touchZoom.enable();
}

function cancelCurrentDrawPath(message = null) {
    if (drawPointerId !== null) {
        try {
            map.getContainer().releasePointerCapture?.(drawPointerId);
        } catch (e) {
            // Pointer capture may already be gone on touch-cancel paths.
        }
    }
    if (drawPathLayer) {
        map.removeLayer(drawPathLayer);
        drawPathLayer = null;
    }
    drawPoints = [];
    drawPointerId = null;
    enableMapInteractionsAfterDrawing();
    if (message) setDrawPanel(message);
}

function shouldSkipDrawStart(e) {
    const target = e.target;
    if (!target || typeof target.closest !== 'function') return false;
    return Boolean(target.closest('.leaflet-control-layers, .leaflet-marker-icon, .leaflet-popup, .leaflet-interactive, #draw-result-panel, #municipality-search-panel, button'));
}

function beginDrawPath(e) {
    if (drawSelectionActive && e.pointerType === 'touch') {
        drawActiveTouchPointers.add(e.pointerId);
        if (drawActiveTouchPointers.size > 1) {
            cancelCurrentDrawPath("2本指では地図を移動・ズームできます。1本指で囲みを描けます。");
            return;
        }
    }
    if (!drawSelectionActive || drawPointerId !== null) return;
    if (shouldSkipDrawStart(e)) return;
    if (!canUseDrawSelection()) {
        setDrawPanel(drawSelectionTotal > 0
            ? `累計 ${drawSelectionTotal} 件の項目を表示中です。囲みの追加はズーム15以上でできます。`
            : "ズーム15以上で囲みを追加できます。もう少し近づいてください。", drawSelectionCounts);
        updateDrawSelectBtn();
        return;
    }

    e.preventDefault();
    e.stopPropagation();
    drawPointerId = e.pointerId;
    drawPoints = [clientPointToLatLng(e.clientX, e.clientY)];
    setDrawPanel("囲み範囲を描画中...");
    disableMapInteractionsWhileDrawing();

    if (drawPathLayer) map.removeLayer(drawPathLayer);
    drawPathLayer = L.polyline(drawPoints, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
    }).addTo(map);
    if (e.pointerType !== 'touch') {
        map.getContainer().setPointerCapture?.(e.pointerId);
    }
}

function extendDrawPath(e) {
    if (!drawSelectionActive || e.pointerId !== drawPointerId) return;
    if (e.pointerType === 'touch' && drawActiveTouchPointers.size > 1) {
        cancelCurrentDrawPath("2本指では地図を移動・ズームできます。1本指で囲みを描けます。");
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    const nextPoint = clientPointToLatLng(e.clientX, e.clientY);
    const lastPoint = drawPoints[drawPoints.length - 1];
    if (lastPoint && map.latLngToLayerPoint(lastPoint).distanceTo(map.latLngToLayerPoint(nextPoint)) < 4) return;

    drawPoints.push(nextPoint);
    if (drawPathLayer) drawPathLayer.setLatLngs(drawPoints);
}

async function finishDrawPath(e) {
    if (e.pointerType === 'touch') drawActiveTouchPointers.delete(e.pointerId);
    if (!drawSelectionActive || e.pointerId !== drawPointerId) return;
    e.preventDefault();
    e.stopPropagation();
    map.getContainer().releasePointerCapture?.(e.pointerId);
    drawPointerId = null;

    if (drawPoints.length < 3) {
        setDrawPanel("範囲が小さすぎます。ピンを探す場所をぐるっと囲ってください。");
        if (drawPathLayer) {
            map.removeLayer(drawPathLayer);
            drawPathLayer = null;
        }
        enableMapInteractionsAfterDrawing();
        return;
    }

    const polygon = drawPoints.slice();
    if (drawPathLayer) {
        map.removeLayer(drawPathLayer);
    }
    drawPathLayer = L.polygon(polygon, {
        color: '#f59e0b',
        weight: 3,
        opacity: 0.95,
        fillColor: '#f59e0b',
        fillOpacity: 0.12,
        interactive: false
    });
    drawAreaLayer.addLayer(drawPathLayer);
    drawPathLayer = null;

    document.body.classList.add('draw-results-visible');
    await renderDrawSelectionResults(polygon);
    enableMapInteractionsAfterDrawing();
}

const drawSelectBtn = document.getElementById('draw-select-btn');
drawSelectBtn?.addEventListener('click', () => {
    if (drawSelectionActive || document.body.classList.contains('draw-results-visible')) stopDrawSelectionMode(true);
    else startDrawSelectionMode();
});

document.getElementById('draw-clear-btn')?.addEventListener('click', () => stopDrawSelectionMode(true));
const mapContainer = map.getContainer();
mapContainer.addEventListener('pointerdown', beginDrawPath, true);
mapContainer.addEventListener('pointermove', extendDrawPath, true);
mapContainer.addEventListener('pointerup', finishDrawPath, true);
mapContainer.addEventListener('pointercancel', finishDrawPath, true);

const municipalitySearchBtn = document.getElementById('municipality-search-btn');
let legacyListBtn = document.getElementById('legacy-list-btn');
if (!legacyListBtn && municipalitySearchBtn) {
    legacyListBtn = document.createElement('button');
    legacyListBtn.id = 'legacy-list-btn';
    legacyListBtn.title = '登録ピン検索';
    legacyListBtn.type = 'button';
    legacyListBtn.textContent = '📚';
    municipalitySearchBtn.insertAdjacentElement('afterend', legacyListBtn);
}
const municipalitySearchForm = document.getElementById('municipality-search-form');
const municipalitySearchInput = document.getElementById('municipality-search-input');

municipalitySearchBtn?.addEventListener('click', () => {
    const isPanelOpen = document.body.classList.contains('municipality-search-open');
    const isListMode = document.body.classList.contains('legacy-list-open');
    if (municipalityModeActive || (isPanelOpen && !isListMode)) {
        closeMunicipalitySearch(true);
        return;
    }
    legacyListOpen = false;
    document.body.classList.remove('legacy-list-open');
    document.body.classList.add('municipality-search-open');
    municipalitySearchBtn.classList.add('active');
    legacyListBtn?.classList.remove('active');
    updateDrawSelectBtn();
    setTimeout(() => municipalitySearchInput?.focus(), 0);
});

legacyListBtn?.addEventListener('click', async () => {
    const isPanelOpen = document.body.classList.contains('municipality-search-open');
    const isListMode = document.body.classList.contains('legacy-list-open');
    if (isPanelOpen && isListMode) {
        closeMunicipalitySearch(true);
        return;
    }
    await openLegacyListPanel();
});

municipalitySearchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    legacyListOpen = false;
    document.body.classList.remove('legacy-list-open');
    municipalitySearchBtn?.classList.add('active');
    legacyListBtn?.classList.remove('active');
    runMunicipalitySearch(municipalitySearchInput?.value || '');
});

document.getElementById('municipality-close-btn')?.addEventListener('click', () => closeMunicipalitySearch(true));
document.getElementById('municipality-share-btn')?.addEventListener('click', () => copyCurrentShareUrl());
document.getElementById('municipality-result-breakdown')?.addEventListener('click', (e) => {
    const legacyRow = e.target.closest?.('.legacy-candidate-row');
    if (legacyRow) {
        const index = Number(legacyRow.dataset.legacyIndex);
        const feature = legacySearchCandidateFeatures[index];
        if (!feature) return;
        if (municipalitySearchInput) municipalitySearchInput.value = feature.properties?.name || '';
        showLegacySearchFeature(feature);
        return;
    }

    const row = e.target.closest?.('.municipality-candidate-row');
    if (!row) return;
    const code = row.dataset.townCode;
    if (!code) return;
    if (municipalitySearchInput) municipalitySearchInput.value = row.dataset.townLabel || code;
    runMunicipalitySearch(code);
});

function runInitialSharedSearch() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('spot') === 'legacy') {
        const sharedUrl = window.location.href;
        clearSharedSearchFromAddressBar();
        const name = params.get('name') || '';
        const lat = Number(params.get('lat'));
        const lng = Number(params.get('lng'));
        const zoom = Number(params.get('z')) || 17;
        document.body.classList.add('municipality-search-open');
        municipalitySearchBtn?.classList.add('active');
        updateDrawSelectBtn();
        if (municipalitySearchInput) municipalitySearchInput.value = name;
        setTimeout(async () => {
            try {
                setMunicipalityPanel("共有ピンを読み込み中...");
                ensureLegacyLayerEnabledForSearch();
                await fetchLayerData('legacy_spots', layerDefs.legacy_spots);
                const candidate = getLegacySearchCandidates(name);
                if (candidate.type === 'match') {
                    showLegacySearchFeature(candidate.feature, false);
                    currentShareUrl = sharedUrl;
                    document.body.classList.add('municipality-share-ready');
                    return;
                }
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    ensureLegacyLayerEnabledForSearch();
                    map.setView(L.latLng(lat, lng), zoom);
                    setMunicipalityPanel(`${name || '共有ピン'} の位置を表示しました。`);
                    document.body.classList.add('municipality-results-visible');
                    document.body.classList.add('municipality-share-ready');
                    updateDrawSelectBtn();
                    currentShareUrl = sharedUrl;
                }
            } catch (error) {
                console.error(error);
                setMunicipalityPanel("共有ピンを表示できませんでした。");
            }
        }, 500);
        return;
    }

    const query = params.get('q');
    if (!query) return;
    document.body.classList.add('municipality-search-open');
    municipalitySearchBtn?.classList.add('active');
    updateDrawSelectBtn();
    if (municipalitySearchInput) municipalitySearchInput.value = query;
    setTimeout(() => runMunicipalitySearch(query), 500);
}
const hasInitialSharedSearch = new URLSearchParams(window.location.search).has('q') ||
    new URLSearchParams(window.location.search).has('spot');
runInitialSharedSearch();
window.addEventListener('load', () => {
    if (!hasInitialSharedSearch) clearSharedSearchFromAddressBar();
});

const wideAreaAutoZoomKeys = new Set([
    'keikan', 'tree', 'fudo', 'denken', 'fuchi', 'kanko',
    'trail', 'shizenhodo', 'gokaido',
    'live_local', 'legacy_spots',
    'user_spots'
]);

function autoZoomForWideAreaLayer(layer) {
    const key = Object.keys(layers).find(layerKey => layers[layerKey] === layer);
    if (wideAreaAutoZoomKeys.has(key) && map.getZoom() !== 7) {
        map.setZoom(7);
    }
}

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
        else if (text.includes("トレイル")) headerHtml = "<div class='custom-layer-header' style='margin:18px 0 10px 0;'><hr style='margin:0 0 12px 0; border:0; border-top:1px solid #ddd;'><div style='font-size:1.05em; font-weight:bold; color:#2E7D32;'>【上級者向け】</div></div>";
        else if (text.includes("ローカル")) headerHtml = "<div class='custom-layer-header' style='margin:18px 0 10px 0;'><hr style='margin:0 0 12px 0; border:0; border-top:1px solid #ddd;'><div style='font-size:1.05em; font-weight:bold; color:#8e44ad;'>【実験機能】</div></div>";
        else if (text.includes("ユーザー投稿")) headerHtml = "<div class='custom-layer-header' style='margin:18px 0 10px 0;'><hr style='margin:0 0 12px 0; border:0; border-top:1px solid #ddd;'><div style='font-size:1.05em; font-weight:bold; color:#e67e22;'>【コミュニティ】</div></div>";
        
        if (headerHtml) label.insertAdjacentHTML('beforebegin', headerHtml);
    });
}
insertCategoryHeaders();
map.on('layeradd layerremove', () => setTimeout(insertCategoryHeaders, 10));

const DRAW_ZOOM = 15;
const SCAN_ZOOM = 15;
const scanBtn = document.getElementById('scan-btn');
function updateScanBtn() {
    if(!scanBtn) return;
    if (map.getZoom() >= SCAN_ZOOM) { scanBtn.classList.remove('disabled'); scanBtn.disabled = false; scanBtn.innerText = "📡 周囲をスキャン"; }
    else { scanBtn.classList.add('disabled'); scanBtn.disabled = true; scanBtn.innerText = "もっと近づいてスキャン"; }
}
map.on('zoomend', updateScanBtn);
map.on('zoomend', enforceDrawZoomLimit);
updateScanBtn();
updateDrawSelectBtn();

scanBtn?.addEventListener('click', () => {
    if (map.getZoom() < SCAN_ZOOM) return;
    scanBtn.innerText = "🔄 スキャン中...";
    scanBtn.classList.add('disabled');
    const bounds = map.getBounds();
    setTimeout(async () => {
        for (const key of Object.keys(layerDefs)) {
            if (immediateLayers.includes(key) || !map.hasLayer(layers[key])) continue;
            const loaded = await fetchLayerData(key, layerDefs[key]);
            if (loaded && rawData[key]) renderGeoJson(key, bounds);
        }
        scanBtn.innerText = "📡 周囲をスキャン"; scanBtn.classList.remove('disabled');
    }, 600);
});

const myakuCredit = '（画像のミャクミャク・こみゃく・こみゃくピンは二次創作です）';
let restaurantWarningShown = false, advanceWarningShown = false;
map.on('overlayadd', async function(e) {
    autoZoomForWideAreaLayer(e.layer);

    if (e.layer === layers.live_trend) await fetchLayerData('live_trend', layerDefs.live_trend);
    if (e.layer === layers.live_flower) await fetchLayerData('live_flower', layerDefs.live_flower);
    if (e.layer === layers.live_local) await fetchLayerData('live_local', layerDefs.live_local);
    if (e.layer === layers.user_spots) await fetchLayerData('user_spots', layerDefs.user_spots);
    if (e.layer === layers.legacy_spots) await fetchLayerData('legacy_spots', layerDefs.legacy_spots);
    if (e.name.includes('トレンド') && rawData['live_trend']) renderGeoJson('live_trend');
    if (e.name.includes('開花') && rawData['live_flower']) renderGeoJson('live_flower');
    if (e.name.includes('ローカル') && rawData['live_local']) renderGeoJson('live_local');
    if (e.name.includes('ユーザー投稿') && rawData['user_spots']) renderGeoJson('user_spots');
    if (e.name.includes('万博') && rawData['legacy_spots']) renderGeoJson('legacy_spots');
    if (e.name.includes('万博')) map.attributionControl.addAttribution(myakuCredit);
    if (e.name.includes('トレンド') || e.name.includes('開花') || e.name.includes('ローカル')) map.attributionControl.addAttribution(yahooCredit);
    if (e.name.includes('喫茶店') && !restaurantWarningShown) { alert("飲食店データは最大で10mの誤差があることがあります。立ち寄る際は十分に確認してください。"); restaurantWarningShown = true; }
    if ((e.name.includes('トレイル') || e.name.includes('自然歩道') || e.name.includes('五街道')) && !advanceWarningShown) { alert("【上級者向け警告】\n難易度の高いルートが含まれます。事前に計画を立てましょう。"); advanceWarningShown = true; }
});

map.on('overlayremove', function(e) {
    if (e.name.includes('万博')) map.attributionControl.removeAttribution(myakuCredit);
    if (e.name.includes('トレンド') || e.name.includes('開花') || e.name.includes('ローカル')) {
        let hasLiveLayer = false;
        if (layers['live_trend'] && map.hasLayer(layers['live_trend'])) hasLiveLayer = true;
        if (layers['live_flower'] && map.hasLayer(layers['live_flower'])) hasLiveLayer = true;
        if (layers['live_local'] && map.hasLayer(layers['live_local'])) hasLiveLayer = true;
        if (!hasLiveLayer) map.attributionControl.removeAttribution(yahooCredit);
    }
});

const menuBtn = document.getElementById('menu-btn');
const layerMenu = document.querySelector('.leaflet-control-layers');

function handleDrawLayerMenuClick(e) {
    if (!isDrawFilterMode() && !municipalityModeActive) return;

    const label = e.target.closest?.('.leaflet-control-layers-overlays label');
    if (!label) return;

    const key = getLayerKeyFromControlLabel(label);
    const input = label.querySelector('input[type="checkbox"]');
    if (!key || !input || !drawSelectableKeys.includes(key)) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (municipalityModeActive) {
        const nextChecked = !municipalityVisibleKeys.has(key);
        input.checked = nextChecked;
        if (nextChecked) {
            municipalityVisibleKeys.add(key);
        } else {
            municipalityVisibleKeys.delete(key);
        }
        renderMunicipalityVisibleResults();
        setTimeout(() => setLayerControlCheckboxState(municipalityVisibleKeys), 0);
        return;
    }

    const nextChecked = !drawVisibleKeys.has(key);
    input.checked = nextChecked;
    if (nextChecked) {
        drawVisibleKeys.add(key);
    } else {
        drawVisibleKeys.delete(key);
    }

    renderDrawVisibleResults();
    updateDrawSelectBtn();
    setTimeout(syncDrawLayerControlState, 0);
}

layerMenu?.addEventListener('click', handleDrawLayerMenuClick, true);

function closeLayerMenu() {
    document.body.classList.remove('menu-open');
}

menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.toggle('menu-open');
});

document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('menu-open')) return;
    if (menuBtn && menuBtn.contains(e.target)) return;
    if (layerMenu && layerMenu.contains(e.target)) return;
    closeLayerMenu();
});

let layerMenuTouchStartX = null;
let layerMenuTouchStartY = null;
layerMenu?.addEventListener('touchstart', (e) => {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    layerMenuTouchStartX = touch.clientX;
    layerMenuTouchStartY = touch.clientY;
}, { passive: true });

layerMenu?.addEventListener('touchend', (e) => {
    if (layerMenuTouchStartX === null || layerMenuTouchStartY === null) return;
    const touch = e.changedTouches && e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - layerMenuTouchStartX;
    const deltaY = touch.clientY - layerMenuTouchStartY;
    layerMenuTouchStartX = null;
    layerMenuTouchStartY = null;

    if (deltaX < -60 && Math.abs(deltaY) < 80) {
        closeLayerMenu();
    }
}, { passive: true });
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

document.getElementById('reload-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('reload-btn');
    btn.innerText = "⏳";
    try {
        map.closePopup();
        const freshUrl = layerDefs.live_trend.url + '?t=' + new Date().getTime();
        const res = await fetch(freshUrl);
        if (res.ok) {
            const freshData = await res.json();
            rawData['live_trend'] = freshData; rawData['live_flower'] = freshData; rawData['live_local'] = freshData;
            if (map.hasLayer(layers['live_trend'])) renderGeoJson('live_trend');
            if (map.hasLayer(layers['live_flower'])) renderGeoJson('live_flower');
            if (map.hasLayer(layers['live_local'])) renderGeoJson('live_local');
        }
        const freshUserUrl = layerDefs.user_spots.url + '?t=' + new Date().getTime();
        const resUser = await fetch(freshUserUrl);
        if (resUser.ok) {
            rawData['user_spots'] = await resUser.json();
            if (map.hasLayer(layers['user_spots'])) renderGeoJson('user_spots');
        }
    } catch(e) { console.error("最新データの取得に失敗しました:", e); }
    setTimeout(() => { btn.innerText = "↻"; }, 500);
});

let requestMarker = null;
document.getElementById('request-btn')?.addEventListener('click', () => {
    if (requestMarker) map.removeLayer(requestMarker);
    const center = map.getCenter();
    requestMarker = L.marker(center, { draggable: true, icon: icons.red }).addTo(map);
    const popupContent = `
        <div style="text-align:center; min-width:180px;">
            <b style="font-size:1.1em; color:#d35400;">この地点を申請しますか？</b><br>
            <span style="font-size:0.8em; color:#666;">※ピンをドラッグして微調整できます</span><br><br>
            <button id="confirm-request-btn" style="padding:8px 15px; background:#e67e22; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; width:100%;">✉️ この地点を申請</button>
        </div>
    `;
    requestMarker.bindPopup(popupContent).openPopup();
    requestMarker.on('popupclose', () => { if (requestMarker) { map.removeLayer(requestMarker); requestMarker = null; } });
});

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'confirm-request-btn') {
        if (!requestMarker) return;
        const latlng = requestMarker.getLatLng();
        const lat = latlng.lat.toFixed(6); const lng = latlng.lng.toFixed(6);
        const supportEmail = "information.app.excellent@gmail.com"; 
        const subject = encodeURIComponent("【マップDJ】新規スポット追加申請");
        const body = encodeURIComponent(`面白いスポットを報告します。\n\n【スポット名】\n（ここに名称を入力してください）\n\n【おすすめの理由・説明】\n（ここにおすすめの理由を入力してください）\n\n-------------------------\n【位置情報（自動取得）】\n緯度: ${lat}\n経度: ${lng}\nGoogleマップで確認:\nhttps://www.google.com/maps?q=${lat},${lng}\n-------------------------`);
        window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
        map.closePopup(); map.removeLayer(requestMarker); requestMarker = null;
    }
});

map.on('zoomend', function() {
    const size = 100;
    document.documentElement.style.setProperty('--myaku-size', size + 'px');

    // legacyClusterGroupのアイコンを再生成させる（iconCreateFunctionを再呼び出し）
    if (legacyClusterGroup) {
        legacyClusterGroup.refreshClusters();
    }
    updateLegacyClusterVisibility();
    setTimeout(updateStandaloneMyakuLarge, 0);
});

// 初期ロード時はzoomendが発火しないため、起動直後に1度だけ実行
(function applyInitialMyakuSize() {
    const size = 100;
    document.documentElement.style.setProperty('--myaku-size', size + 'px');
    updateLegacyClusterVisibility();
    updateStandaloneMyakuLarge();
})();
