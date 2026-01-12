// api/analyze.js
module.exports = function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({error: "Method Not Allowed"});
    
    try {
        const { mode, age, gender, height, weight, curr, prev } = req.body;

        // 平均データソース（全年齢対応版：20-90代）
        // 出典: スポーツ庁 令和5年度 体力・運動能力調査より推計
        const avgDB = {
            male: {
                '20-24': {grip:46.5, calf:37.0, one_leg:120, five_stand:6.0,  tug:5.3,  walk:4.5},
                '25-29': {grip:46.9, calf:37.2, one_leg:120, five_stand:6.2,  tug:5.4,  walk:4.6},
                '30-34': {grip:47.2, calf:37.5, one_leg:120, five_stand:6.4,  tug:5.5,  walk:4.8},
                '35-39': {grip:47.0, calf:37.8, one_leg:120, five_stand:6.6,  tug:5.6,  walk:5.0},
                '40-44': {grip:46.8, calf:38.0, one_leg:120, five_stand:6.8,  tug:5.7,  walk:5.2},
                '45-49': {grip:46.0, calf:38.1, one_leg:118, five_stand:7.0,  tug:5.8,  walk:5.3},
                '50-54': {grip:45.2, calf:38.0, one_leg:110, five_stand:7.2,  tug:6.0,  walk:5.5},
                '55-59': {grip:43.5, calf:37.5, one_leg:100, five_stand:7.4,  tug:6.2,  walk:5.6},
                '60-64': {grip:41.5, calf:36.8, one_leg:95,  five_stand:7.6,  tug:6.4,  walk:5.8},
                '65-69': {grip:39.0, calf:36.2, one_leg:78,  five_stand:8.2,  tug:6.8,  walk:6.2},
                '70-74': {grip:36.5, calf:35.5, one_leg:58,  five_stand:9.2,  tug:7.5,  walk:6.7},
                '75-79': {grip:33.0, calf:34.5, one_leg:36,  five_stand:10.5, tug:8.4,  walk:7.3},
                '80-84': {grip:29.0, calf:33.2, one_leg:18,  five_stand:12.8, tug:9.8,  walk:8.5},
                '85-':   {grip:25.0, calf:31.8, one_leg:8,   five_stand:15.2, tug:11.5, walk:9.8}
            },
            female: {
                '20-24': {grip:28.2, calf:34.0, one_leg:120, five_stand:6.8,  tug:6.0,  walk:4.8},
                '25-29': {grip:28.8, calf:34.2, one_leg:120, five_stand:6.9,  tug:6.1,  walk:4.9},
                '30-34': {grip:29.0, calf:34.5, one_leg:120, five_stand:7.1,  tug:6.2,  walk:5.1},
                '35-39': {grip:29.2, calf:34.8, one_leg:120, five_stand:7.3,  tug:6.3,  walk:5.3},
                '40-44': {grip:29.0, calf:35.0, one_leg:120, five_stand:7.5,  tug:6.4,  walk:5.5},
                '45-49': {grip:28.5, calf:35.1, one_leg:118, five_stand:7.7,  tug:6.5,  walk:5.6},
                '50-54': {grip:27.5, calf:35.0, one_leg:110, five_stand:7.9,  tug:6.6,  walk:5.8},
                '55-59': {grip:26.0, calf:34.5, one_leg:100, five_stand:8.1,  tug:6.8,  walk:6.0},
                '60-64': {grip:24.5, calf:33.8, one_leg:85,  five_stand:8.4,  tug:7.0,  walk:6.2},
                '65-69': {grip:23.5, calf:33.2, one_leg:70,  five_stand:8.8,  tug:7.4,  walk:6.5},
                '70-74': {grip:22.0, calf:32.5, one_leg:49,  five_stand:9.8,  tug:8.1,  walk:7.0},
                '75-79': {grip:20.5, calf:31.8, one_leg:28,  five_stand:11.2, tug:9.2,  walk:7.8},
                '80-84': {grip:18.0, calf:30.5, one_leg:12,  five_stand:13.5, tug:11.0, walk:9.0},
                '85-':   {grip:15.0, calf:29.0, one_leg:5,   five_stand:16.8, tug:13.5, walk:11.2}
            }
        };

        const a = parseInt(age);
        let ageKey = '85-';
        // 5歳刻みの年齢判定
        if (a < 25) ageKey = '20-24';
        else if (a < 30) ageKey = '25-29';
        else if (a < 35) ageKey = '30-34';
        else if (a < 40) ageKey = '35-39';
        else if (a < 45) ageKey = '40-44';
        else if (a < 50) ageKey = '45-49';
        else if (a < 55) ageKey = '50-54';
        else if (a < 60) ageKey = '55-59';
        else if (a < 65) ageKey = '60-64';
        else if (a < 70) ageKey = '65-69';
        else if (a < 75) ageKey = '70-74';
        else if (a < 80) ageKey = '75-79';
        else if (a < 85) ageKey = '80-84';
    
        // BMI計算
        let bmiInfo = null;
        if (height && weight) {
            const h_m = parseFloat(height) / 100;
            const w_kg = parseFloat(weight);
            if (h_m > 0 && w_kg > 0) {
                const bmi = (w_kg / (h_m * h_m)).toFixed(1);
                let status = bmi < 18.5 ? "低体重" : (bmi >= 25 ? "肥満傾向" : "普通");
                bmiInfo = { value: bmi, status: status };
            }
        }

        const itemDefs = [
            {id:'grip', label:'握力', unit:'kg'}, {id:'calf', label:'下腿周径', unit:'cm'},
            {id:'one_leg', label:'片脚立位', unit:'秒'}, {id:'five_stand', label:'5回立ち', unit:'秒'},
            {id:'tug', label:'TUG', unit:'秒'}, {id:'walk', label:'10m歩行', unit:'秒'}
        ];
        
        const safeCurr = curr || {};
        const safePrev = prev || {};
        const missingData = itemDefs.some(i => safeCurr[i.id] === null || safeCurr[i.id] === "");

        let datasets = [];
        let message = "";
        let subMessage = "";
        let tableData = []; 

        const avg = avgDB[gender] ? (avgDB[gender][ageKey] || avgDB[gender]['85-']) : avgDB['female']['85-'];

        // 詳細テーブルデータの作成
        tableData = itemDefs.map(item => {
            const userVal = safeCurr[item.id];
            const avgVal = avg[item.id];
            let status = 'avg';
            
            if (userVal !== null && userVal !== "") {
                if (['five_stand', 'tug', 'walk'].includes(item.id)) {
                    // タイム系（低い方が良い）
                    if (userVal < avgVal * 0.9) status = 'good';
                    else if (userVal > avgVal * 1.1) status = 'bad';
                } else {
                    // 数値系（高い方が良い）
                    if (userVal > avgVal * 1.1) status = 'good';
                    else if (userVal < avgVal * 0.9) status = 'bad';
                }
            }
            return { 
                id: item.id, label: item.label, unit: item.unit, 
                userVal: userVal, avgVal: avgVal, status: status 
            };
        });

        if (mode === 'history') {
            message = "前回測定値との比較";
            subMessage = "実数値を棒グラフで表示しています";
            datasets = [
                { label: '前回', data: Object.values(safePrev), backgroundColor: '#aaccff' },
                { label: '今回', data: Object.values(safeCurr), backgroundColor: '#ff9999' }
            ];
        } else {
            message = `${ageKey}歳 同年代平均との比較`;
            subMessage = "グラフは平均比(%)、下表は実数です。";

            const scores = tableData.map(d => {
                if (d.userVal === null || d.userVal === "") return 0;
                if (['five_stand', 'tug', 'walk'].includes(d.id)) {
                    if(d.userVal <= 0.1) return 0;
                    // 時間系計算: (平均 / 自分 * 100)
                    return (d.avgVal / d.userVal * 100).toFixed(1);
                }
                // 数値系計算: (自分 / 平均 * 100)
                return (d.userVal / d.avgVal * 100).toFixed(1);
            });

            datasets = [
                {
                    label: 'あなたの能力値 (%)',
                    data: scores,
                    tableData: tableData, 
                    backgroundColor: 'rgba(44, 62, 80, 0.2)',
                    borderColor: '#2c3e50',
                    pointBackgroundColor: '#2c3e50',
                    borderWidth: 2
                },
                {
                    label: '平均 (100%)',
                    data: [100, 100, 100, 100, 100, 100],
                    borderColor: '#e67e22',
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }
            ];
        }

        res.status(200).json({ message, subMessage, bmiInfo, datasets, tableData, missingData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};